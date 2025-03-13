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

from basic_bot.commons import log, vision_client as vc
from basic_bot.commons.hub_state import HubState
from basic_bot.commons.hub_state_monitor import HubStateMonitor

from commons.data import find_primary_target, is_pet
from commons.dance import dance_thread
from commons.messages import send_primary_target

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

    # if we are not currently dancing
    if not pet_is_detected and not in_manual_mode:
        primary_target = find_primary_target(msg_data)
        log.info(f"handle_state_update: {primary_target=}")
        asyncio.create_task(send_primary_target(websocket, primary_target))
        if primary_target:
            async_record_video()
            pet_is_detected = is_pet(primary_target)
            log.info(f"handle_state_update: {pet_is_detected=}, {primary_target=}")
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


def async_record_video():
    global last_video_recorded_at
    current_time = time.time()
    if current_time - last_video_recorded_at < RECORDED_VIDEO_DURATION + 1:
        return
    last_video_recorded_at = current_time
    threading.Thread(
        target=lambda: vc.send_record_video_request(RECORDED_VIDEO_DURATION)
    ).start()


# HubStateMonitor will open a websocket connection to the central hub
# and start a thread to listen for state changes.  The monitor will call,
# on the callback function with the new state before applying the changes to
# the local state.
hub_monitor = HubStateMonitor(
    hub_state,
    # identity of the service
    "daphbot_service",
    # keys to subscribe to
    [
        "recognition",
        "daphbot_mode",
    ],
    # callback function to call when a message is received
    # Note that when started using bb_start, any standard output or error
    # will be captured and logged to the ./logs directory.
    on_state_update=handle_state_update,
    on_connect=handle_connect,
)
hub_monitor.start()
hub_monitor.thread.join()
