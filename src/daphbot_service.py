#!/usr/bin/env python3
"""
This is the service that provides daphbot's main behaviors.  It looks for
objects detected classified as cat or dog and then plays the recorded
"off"/"down" message, lights up the LED eyes and moves the robot slightly
in a little dance.

This basic_bot custom service subscribes to the "recognition" key in
hub_state provided by the basic_bot.services.vision_cv service.
Whenever we see that key change we check if the .classification of
any of the recognized objects is "cat" or "dog"

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
}
```
"""
import threading
import asyncio

from basic_bot.commons import log
from basic_bot.commons.hub_state import HubState
from basic_bot.commons.hub_state_monitor import HubStateMonitor

from commons.data import pet_recognized
from commons.dance import dance_thread
from commons.messages import send_behavior_state

# HubState is a class that manages the process local copy of the state.
# Each service runs as a process and  has its own partial or full instance
# of HubState.
hub_state = HubState({"daphbot_behavior": {"is_dancing", False}})

# this is set to True when the robot is dancing and False otherwise
pet_is_detected = False


def handle_state_update(websocket, msg_type, msg_data):
    global pet_is_detected

    if not pet_is_detected and pet_recognized(msg_data):
        pet_is_detected = True

        def handle_dance_complete():
            global pet_is_detected
            pet_is_detected = False

        # we don't want to hold up the websocket receiving (this) thread
        # in HubStateMonitor so we start a new thread to do the dance
        # otherwise the message queue will back up
        threading.Thread(
            target=lambda: dance_thread(websocket, hub_state, handle_dance_complete)
        ).start()
        log.info(f"pet_is_detected: {pet_is_detected=}")


def handle_connect(websocket):
    # if we disconnect and reconnect we need to resend the current state
    log.info("connected to central hub")
    asyncio.create_task(send_behavior_state(websocket, pet_is_detected))


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
