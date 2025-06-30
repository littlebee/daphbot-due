#!/usr/bin/env python3
"""
This is the service that provides daphbot's main behaviors.  It looks for
objects detected classified as cat or dog and then plays the recorded
"off"/"down" message,

This basic_bot custom service subscribes to the "recognition" key in
hub_state provided by the basic_bot.services.vision service.
Whenever we see that key change we check if the .classification of
any of the recognized objects is "cat" or "dog"

This service also provides (publishes) the "acquired_target" key to
central_hub state.  Example:
```json
{
    type: "updateState",
    data: {
        "primary_target": {
            "classification": "cat",
            "bounding_box": [1, 22, 200, 330],
            "confidence": 0.99
        }
    }
}
```
"""
import asyncio
import threading
import time

from basic_bot.commons import log, constants as c, vision_client as vc
from basic_bot.commons.hub_state import HubState
from basic_bot.commons.hub_state_monitor import HubStateMonitor

from commons.data import find_primary_target, is_pet
from commons.dance import dance_thread
from commons.messages import send_primary_target, send_servo_angles


VIEW_CENTER = (c.BB_VISION_WIDTH / 2, c.BB_VISION_HEIGHT / 2)
# how many pixels per one degree of rotation
# 640 pix / Raspberry Pi v2 cam  62 deg hz fov = 10.32
PIXELS_PER_DEGREE_X = c.BB_VISION_WIDTH / c.BB_VISION_FOV
PIXELS_PER_DEGREE_Y = c.BB_VISION_HEIGHT / (c.BB_VISION_FOV * 0.75)
X_DEGREE_TOLERANCE = 1.5
Y_DEGREE_TOLERANCE = 1.5

# in seconds how long to wait before sending a new servo angles when
# the target is moving
MIN_TRACK_TIME = 0.1


# HubState is a class that manages the process local copy of the state.
# Each service runs as a process and  has its own partial or full instance
# of HubState.
hub_state = HubState({"primary_target": None})

# this is set to True when the robot is dancing and False otherwise
pet_is_detected = False


def handle_dance_complete(websocket):
    global pet_is_detected
    pet_is_detected = False
    # after doing the dance, we may have missed some state updates
    # so we process a state update using the current state
    handle_state_update(websocket, "state", hub_state.state)


def handle_state_update(websocket, _msg_type, msg_data):
    global pet_is_detected

    in_manual_mode = hub_state.state.get("daphbot_mode") == "manual"

    primary_target = find_primary_target(msg_data)
    asyncio.create_task(send_primary_target(websocket, primary_target))

    # if we are not currently dancing
    if not pet_is_detected and not in_manual_mode:
        if primary_target:
            log.debug(f"handle_state_update: {primary_target=}")
            asyncio.create_task(track_target(websocket, primary_target))
            record_video()
            pet_is_detected = is_pet(primary_target)
            if pet_is_detected:
                # we don't want to hold up the websocket receiving (this) thread
                # in HubStateMonitor so we start a new thread to do the dance
                # otherwise the message queue will back up
                threading.Thread(
                    target=lambda: dance_thread(
                        lambda: handle_dance_complete(websocket)
                    )
                ).start()


def handle_connect(websocket):
    # if we disconnect and reconnect we need to resend the current state
    log.info("connected to central hub")
    asyncio.create_task(send_primary_target(websocket, None, force=True))


RECORDED_VIDEO_DURATION = 10
last_video_recorded_at = 0


def record_video():
    global last_video_recorded_at

    # we are not running the vision service during integration tests
    # of daphbot_service so we don't want to try and send the request
    if c.BB_ENV == "test":
        return

    current_time = time.time()
    if current_time - last_video_recorded_at < RECORDED_VIDEO_DURATION + 0.1:
        return
    last_video_recorded_at = current_time
    vc.send_record_video_request(RECORDED_VIDEO_DURATION)


last_track_request_time = time.time()


async def track_target(websocket, primary_target):
    if primary_target is None:
        return

    global last_track_request_time
    current_time = time.time()
    if current_time - last_track_request_time < MIN_TRACK_TIME:
        return
    last_track_request_time = current_time

    [left, top, _, _] = primary_target["bounding_box"]
    degrees_off_x = 0
    degrees_off_y = 0

    # if the top or left of bounding box is alread at least 10px in the frame,
    # we don't need to adjust the tilt or pan of the camera
    if top < 10:
        degrees_off_y = -Y_DEGREE_TOLERANCE - 0.1
    elif top > c.BB_VISION_HEIGHT / 4:
        degrees_off_y = Y_DEGREE_TOLERANCE + 0.1

    if left < 10:
        degrees_off_x = -X_DEGREE_TOLERANCE - 0.1
    elif left > c.BB_VISION_WIDTH / 4:
        degrees_off_x = X_DEGREE_TOLERANCE + 0.1

    await send_relative_angles(websocket, degrees_off_x, degrees_off_y)


async def send_relative_angles(websocket, x_relative, y_relative):
    # send the angles to the servo controller
    current_x = hub_state.state["servo_actual_angles"]["pan"]
    current_y = hub_state.state["servo_actual_angles"]["tilt"]
    x_angle = (
        current_x + (x_relative * -1)
        if abs(x_relative) > X_DEGREE_TOLERANCE
        else current_x
    )
    y_angle = (
        current_y + (y_relative * -1)
        if abs(y_relative) > Y_DEGREE_TOLERANCE
        else current_y
    )
    if x_angle == current_x and y_angle == current_y:
        log.debug("no change in servo angles")
        return

    log.debug(
        f"sending servo angles: ({current_x=}, {current_y=}) => ({x_angle=}, {y_angle=})"
    )
    await send_servo_angles(websocket, x_angle, y_angle)


# HubStateMonitor will open a websocket connection to the central hub
# and start a thread to listen for state changes.  The monitor will call,
# on the callback function with the new state before applying the changes to
# the local state.
hub_monitor = HubStateMonitor(
    hub_state,
    # identity of the service
    "daphbot_service",
    # keys to subscribe to
    ["recognition", "daphbot_mode", "servo_config", "servo_actual_angles"],
    # callback function to call when a message is received
    # Note that when started using bb_start, any standard output or error
    # will be captured and logged to the ./logs directory.
    on_state_update=handle_state_update,
    on_connect=handle_connect,
)
hub_monitor.start()
hub_monitor.thread.join()
