#!/usr/bin/env python

import gpiod
import time


# sensor1 = digitalio.DigitalInOut(board.GP2)
# sensor1.direction = digitalio.Direction.INPUT
# sensor1.pull = digitalio.Pull.DOWN


# while True:
#     print(sensor1.value)
#     time.sleep(0.1)

PIR_PIN = 2
chip = gpiod.Chip("gpiochip4")
sensor = chip.get_line(PIR_PIN)
sensor.request(consumer="pir", type=gpiod.LINE_REQ_EV_RISING_EDGE)


while True:
    print(sensor.get_value())
    time.sleep(0.1)
