"""
    This service listens for system_stats from the central hub and renders
    information to the 240x240 TFT display on the braincraft hat.

    Uses pygame to render the display and should work on any onboard
    computer that has a 240x240 display accessible via /dev/fb1.

"""

import asyncio
import board
import os
import pygame
import signal
import sys
import traceback
from digitalio import DigitalInOut, Direction, Pull

from basic_bot.commons import log
from basic_bot.commons.hub_state import HubState
from basic_bot.commons.hub_state_monitor import HubStateMonitor

from onboard_ui.system_info import render_system_info
import onboard_ui.styles as styles

hub_state = HubState(
    {
        "system_stats": {
            "hostname": "unknown",
            "cpu_util": 0.0,
            "cpu_temp": 0.0,
        }
    }
)
hub_state_monitor = HubStateMonitor(hub_state, "onboard_ui", ["system_stats"])

reset_button = DigitalInOut(board.D17)
reset_button.direction = Direction.INPUT
reset_button.pull = Pull.UP

os.putenv("SDL_FBDEV", "/dev/fb1")
print("Initializing pygame...")
pygame.init()

print("Setting pygame display mode...")
screen = pygame.display.set_mode((240, 240))

print("Initialized.")
screen_width = screen.get_width()
screen_height = screen.get_height()

pygame.mouse.set_visible(False)
screen.fill(styles.BLACK)

current_websocket = None


async def render_splash():
    global screen
    global screen_width
    global screen_height

    splash = pygame.image.load(
        os.path.dirname(sys.argv[0]) + "/onboard_ui/media/images/scatbot-splash.bmp"
    )
    # splash = pygame.transform.rotate(splash, args.rotation)
    screen.blit(
        splash,
        (
            (screen_width / 2) - (splash.get_width() / 2),
            (screen_height / 2) - (splash.get_height() / 2),
        ),
    )

    pygame.display.update()
    await asyncio.sleep(10)
    screen.fill(styles.BLACK)
    pygame.display.update()


async def render():
    global screen
    global screen_width
    global screen_height

    try:
        screen.fill(styles.BLACK)
        render_system_info(screen, hub_state)
        pygame.display.update()

    except Exception as e:
        traceback.print_exc()
        log.error(f"could not get stats {e}")


async def ui_task():
    # await render_splash()
    while True:
        await render()
        if not reset_button.value:
            os.system("./stop.sh")
            os.system("sudo reboot")

        await asyncio.sleep(1)


async def start():
    tasks = []
    tasks.append(asyncio.create_task(ui_task()))
    await asyncio.wait(tasks)


asyncio.run(start())
