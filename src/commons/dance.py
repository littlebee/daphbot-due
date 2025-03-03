import time

from basic_bot.commons import log, constants as c
from commons import sound


def dance():
    if c.BB_ENV == "test":
        # when we are running in test mode, we don't want to wait
        # for the dance to finish for each test of recognition
        # input.  Also, we don't have access to motors, LEDs, etc.
        time.sleep(0.5)
    else:
        # play the "off" or "down" message
        sound.play_off_message()
        time.sleep(1)


# This is a thread function that is started by handle_state_update
# when a pet is detected.  It plays the "off" or "down" message+++
def dance_thread(dance_complete_callback):
    log.info("Starting dance_thread")
    dance()
    dance_complete_callback()
    log.info("Exiting dance_thread")
