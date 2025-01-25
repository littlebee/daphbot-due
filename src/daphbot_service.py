#!/usr/bin/env python3
"""
This is the service that provides daphbot's main behaviors.  It looks for
objects detected classified as cat of dog and then plays the recorded
"off"/"down" message, lights up the LED eyes and moves the robot slightly
in a little dance.

This basic_bot custom service subscribes to the "recognition" key in
hub_state provided by the basic_bot.services.vision_cv service.
Whenever we see that key change we check if the .classification of
any of the recognized object is "cat" or "dog"

This service also provides (publishes) the "daphbot_behavior" key to
central_hub state.  Example:
```json
{
    type: "updateState",
    data: {
        "daphbot_behavior": {
            "is_dancing": true
        }
    }
```


"""
import time
import threading
import asyncio
from basic_bot.commons import log, messages, constants as c
from basic_bot.commons.hub_state import HubState
from basic_bot.commons.hub_state_monitor import HubStateMonitor


# HubState is a class that manages the process local copy of the state.
# Each service runs as a process and  has its own partial or full instance
# of HubState.
hub_state = HubState({"daphbot_behavior": {"is_dancing", False}})

# this is set to True when the robot is dancing and False otherwise
pet_is_detected = False


async def send_behavior_state(websocket, is_dancing_arg=None):
    global pet_is_detected
    if is_dancing_arg is not None:
        pet_is_detected = is_dancing_arg

    await messages.send_update_state(
        websocket, {"daphbot_behavior": {"is_dancing": pet_is_detected}}
    )


# This is a thread function that is started by handle_state_update
# when a pet is detected.  It plays the "off" or "down" message+++
def _dance(websocket):
    # there should be no asyncio loop running in this thread yet
    asyncio.run(send_behavior_state(websocket, True))
    asyncio.sleep(0)

    log.info("dancing")

    if c.BB_ENV == "test":
        # when we are running in test mode, we don't want to wait
        # for the dance to finish for each test of recognition
        # input.  Also, we don't have access to motors, LEDs, etc.
        time.sleep(0.5)
    else:
        # play the "off" or "down" message
        # light up the LED eyes
        # move the robot slightly
        # wait for the dance to finish
        # clear the pet_is_detected flag

        # REMOVE ME placeholder for animation that is maybe
        # going to be 5 seconds long
        time.sleep(5)

    asyncio.run(send_behavior_state(websocket, False))


def handle_state_update(websocket, msg_type, msg_data):
    global pet_is_detected

    if not pet_is_detected and "recognition" in msg_data:
        for obj in msg_data["recognition"]:
            if obj["classification"] in ["cat", "dog"]:
                # this still needs to be set here because the
                # dance thread is started in the same event loop
                # and may not have started yet
                pet_is_detected = True
                # we don't want to hold up the websocket receiving thread
                # in HubStateMonitor so we start a new thread to do the dance
                threading.Thread(target=lambda: _dance(websocket)).start()
                break
        log.info(f"pet_is_detected: {pet_is_detected=}")


def handle_connect(websocket):
    # if we disconnect and reconnect we need to resend the current state
    log.info("connected to central hub")
    asyncio.create_task(send_behavior_state(websocket))


# HubStateMonitor will open a websocket connection to the central hub
# and start a thread to listen for state changes.  The monitor will call,
# on the callback function with the new state before applying the changes to
# the local state.
hub_monitor = HubStateMonitor(
    hub_state,
    # identity of the service
    "daphbot_service",
    # keys to subscribe to
    ["recognition"],
    # callback function to call when a message is received
    # Note that when started using bb_start, any standard output or error
    # will be captured and logged to the ./logs directory.
    on_state_update=handle_state_update,
    on_connect=handle_connect,
)
hub_monitor.start()
hub_monitor.thread.join()
