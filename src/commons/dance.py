import time
import asyncio

from basic_bot.commons import log, constants as c
from commons import sound, lights, messages as m
from commons.data import pet_recognized


def dance():
    if c.BB_ENV == "test":
        # when we are running in test mode, we don't want to wait
        # for the dance to finish for each test of recognition
        # input.  Also, we don't have access to motors, LEDs, etc.
        time.sleep(0.5)
    else:
        # play the "off" or "down" message
        lights.police_lights(3)
        sound.play_off_message()
        time.sleep(1)


async def dance_async(websocket, hub_state, dance_complete_callback):
    log.debug("In dance_async")
    await m.send_behavior_state(websocket, True)
    while pet_recognized(hub_state.state):
        dance()
    await m.send_behavior_state(websocket, False)
    dance_complete_callback()


# This is a thread function that is started by handle_state_update
# when a pet is detected.  It plays the "off" or "down" message+++
def dance_thread(websocket, hub_state, dance_complete_callback):
    # there should be no asyncio loop running in this thread yet
    asyncio.run(dance_async(websocket, hub_state, dance_complete_callback))
