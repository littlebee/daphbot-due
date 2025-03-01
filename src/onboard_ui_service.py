"""
    This service provides the onboard UI for the robot.  It displays
    the robot's eyes, system info, a menu and everything else associated
    with the 5" display which is assumed to be 1080x1080.

    This service subscribes to the "system_stats" key in hub_state
    provided by the basic_bot.services.system_stats service.

    This service also subscribes to the "primary_target" key in hub_state
    provided by daphbot_service.  This is used for expressive behavior
    in the robot's eyes and background

"""

import asyncio
import pygame
import signal
import sys
import time
import traceback
from pygame.locals import KEYDOWN, K_q, MOUSEBUTTONDOWN


from basic_bot.commons import log
from basic_bot.commons.hub_state import HubState
from basic_bot.commons.hub_state_monitor import HubStateMonitor

from commons.pygame_utils import translate_touch_event
from onboard_ui.renderables.renderables import Renderables

from onboard_ui.background import Background
from onboard_ui.network_info import NetworkInfo
from onboard_ui.cpu_info import CPUInfo
from onboard_ui.eyes import Eye

import onboard_ui.styles as styles

RENDER_FPS = 30

hub_state = HubState(
    {
        "system_stats": {
            "hostname": "unknown",
            "cpu_util": 0.0,
            "cpu_temp": 0.0,
        }
    }
)
hub_state_monitor = HubStateMonitor(
    hub_state, "onboard_ui", ["system_stats", "primary_target"]
)
hub_state_monitor.start()

should_exit = False


def sigterm_handler(signum, frame):
    global should_exit
    log.info("Caught sigterm. Stopping...")
    should_exit = True
    hub_state_monitor.stop()


signal.signal(signal.SIGTERM, sigterm_handler)

print("Initializing pygame...")
pygame.init()

print("Setting pygame display mode...")
screen = pygame.display.set_mode((1080, 1080))

print("Initialized.")
screen_width = screen.get_width()
screen_height = screen.get_height()

pygame.mouse.set_visible(False)
clock = pygame.time.Clock()

screen.fill(styles.BLACK)

current_websocket = None

renderables = Renderables()
renderables.append(Background(screen))
renderables.append(Eye(screen, hub_state))
renderables.append(NetworkInfo(screen, hub_state))
renderables.append(CPUInfo(screen, hub_state))


async def render():
    global screen
    global screen_width
    global screen_height

    for event in pygame.event.get():
        # print(f"got event from pygame {event}")
        isQuitKey = event.type == KEYDOWN and event.key == K_q
        if event.type == pygame.QUIT or isQuitKey:
            sys.exit(0)
            break

        translated_event = translate_touch_event(screen, event)
        if event.type == MOUSEBUTTONDOWN:
            log.info(f"got translated event {translated_event=} from {event=}")
        renderables.handle_pyg_event(translated_event)

    try:
        screen.fill(styles.BLACK)
        renderables.render(time.time())
        pygame.display.update()

    except Exception as e:
        traceback.print_exc()
        log.error(f"could not get stats {e}")


async def ui_task():
    # await render_splash()
    while not should_exit:
        await render()
        clock.tick(RENDER_FPS)


async def start():
    tasks = []
    tasks.append(asyncio.create_task(ui_task()))
    await asyncio.wait(tasks)


asyncio.run(start())
