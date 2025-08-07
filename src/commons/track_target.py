import time

from basic_bot.commons import log, constants as c
from commons.messages import send_servo_angles


VIEW_CENTER = (c.BB_VISION_WIDTH / 2, c.BB_VISION_HEIGHT / 2)
# how many pixels per one degree of rotation
# 640 pix / Raspberry Pi v2 cam  62 deg hz fov = 10.32
PIXELS_PER_DEGREE_X = c.BB_VISION_WIDTH / c.BB_VISION_FOV
PIXELS_PER_DEGREE_Y = c.BB_VISION_HEIGHT / (c.BB_VISION_FOV * 0.75)
X_DEGREE_TOLERANCE = 1.5
Y_DEGREE_TOLERANCE = 1.5

# how many pixels from the edge of the frame we can be before we pan or tilt the camera
EDGE_THRESHOLD_PIXELS = 10
# how many degrees off the target position we can be
TARGET_POSITION_THRESHOLD = 0.1

# in seconds how long to wait before sending a new servo angles when
# the target is moving
MIN_TRACK_TIME = TARGET_POSITION_THRESHOLD

last_track_request_time = time.time()


async def track_target(websocket, hub_state, primary_target):
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

    # if the top or left of bounding box is alreadY at least EDGE_THRESHOLD_PIXELS in the frame,
    # we don't need to adjust the tilt or pan of the camera
    if top < EDGE_THRESHOLD_PIXELS:
        degrees_off_y = -Y_DEGREE_TOLERANCE - TARGET_POSITION_THRESHOLD
    elif top > c.BB_VISION_HEIGHT / 4:
        degrees_off_y = Y_DEGREE_TOLERANCE + TARGET_POSITION_THRESHOLD

    if left < EDGE_THRESHOLD_PIXELS:
        degrees_off_x = -X_DEGREE_TOLERANCE - TARGET_POSITION_THRESHOLD
    elif left > c.BB_VISION_WIDTH / 4:
        degrees_off_x = X_DEGREE_TOLERANCE + TARGET_POSITION_THRESHOLD

    await send_relative_angles(websocket, hub_state, degrees_off_x, degrees_off_y)


async def send_relative_angles(websocket, hub_state, x_relative, y_relative):
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
