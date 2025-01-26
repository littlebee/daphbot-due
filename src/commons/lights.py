import time
from threading import Thread

from basic_bot.commons import log, constants as c

if c.BB_ENV == "production":
    import board
    import adafruit_dotstar as dotstar

    # Braincraft hat has 3 RGB LEDs on it that use the dot star protocol
    dots = dotstar.DotStar(board.D6, board.D5, 3, brightness=0.2)
else:
    log.info("Running in BB_ENV other than 'production', stubbing out adafruit dotstar")
    dots = [0 for _ in range(3)]


def __police_lights_thread_fn(duration: float):
    """
    This is a thread function that is started by police_lights
    to blink the LEDs in a police light pattern.
    """
    global dots
    t_start = time.time()

    # The values are in GBR order
    while time.time() - t_start < duration:
        for i in range(3):
            dots[i] = (0, 255, 0)
            time.sleep(0.1)
            dots[i] = (0, 0, 0)
            time.sleep(0.1)
            dots[i] = (0, 0, 255)
            time.sleep(0.1)
            dots[i] = (0, 0, 0)
            time.sleep(0.1)


def police_lights(duration: float = 1.5):
    """
    This function starts a thread that blinks the LEDs in a police light pattern.

    You can optionally wait for the thread to finish by calling:
    ```
    police_lights().join()
    ```
    """
    return Thread(target=__police_lights_thread_fn, args=(duration,)).start()


if __name__ == "__main__":
    police_lights(5).join()
