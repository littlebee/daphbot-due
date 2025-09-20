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
from commons.constants import D2_OUI_RENDER_FPS
from onboard_ui.renderables.renderables import Renderables

from onboard_ui.background import Background
from onboard_ui.network_info import NetworkInfo
from onboard_ui.cpu_info import CPUInfo
from onboard_ui.eyes import Eye
from onboard_ui.webrtc_server import WebRTCSignalingServer
from onboard_ui.video_renderer import VideoRenderer

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
hub_state_monitor = HubStateMonitor(
    hub_state, "onboard_ui", ["system_stats", "primary_target", "daphbot_mode"]
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

# Initialize WebRTC components
video_renderer = VideoRenderer(screen)
webrtc_server = WebRTCSignalingServer(video_callback=video_renderer.handle_video_frame)
webrtc_runner = None

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
        current_time = time.time()

        # Check if we're in manual mode and should show video
        is_manual_mode = hub_state.state.get("daphbot_mode") == "manual"

        # Log mode changes
        if not hasattr(render, "last_mode"):
            render.last_mode = None
        if render.last_mode != is_manual_mode:
            log.info(f"Mode changed: manual_mode={is_manual_mode}")
            render.last_mode = is_manual_mode

        screen.fill(styles.BLACK)
        if is_manual_mode:
            video_renderer.render(current_time)
        else:
            renderables.render(current_time)

        pygame.display.update()

    except Exception as e:
        traceback.print_exc()
        log.error(f"could not get stats {e}")


async def ui_task():
    log.info(f"Starting render loop at {D2_OUI_RENDER_FPS} fps")
    # await render_splash()
    while not should_exit:
        await render()
        clock.tick(D2_OUI_RENDER_FPS)
        # Yield control to other async tasks
        await asyncio.sleep(0)


async def webrtc_task():
    """Start WebRTC signaling server."""
    log.info("WebRTC task started")
    global webrtc_runner

    try:
        log.info("Starting WebRTC signaling server")
        webrtc_runner = await webrtc_server.start_server()
        log.debug("WebRTC signaling server task started successfully")

        # Keep the server running
        while not should_exit:
            await asyncio.sleep(1)

    except Exception as e:
        log.error(f"Error in WebRTC server: {e}")
        import traceback

        log.error(f"WebRTC server traceback: {traceback.format_exc()}")
    finally:
        if webrtc_runner:
            await webrtc_server.stop_server(webrtc_runner)


async def start():
    log.info("Starting onboard_ui service tasks")
    tasks = []

    log.debug("Creating UI task")
    ui_task_obj = asyncio.create_task(ui_task())
    tasks.append(ui_task_obj)

    log.debug("Creating WebRTC task")
    webrtc_task_obj = asyncio.create_task(webrtc_task())
    tasks.append(webrtc_task_obj)

    try:
        done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_EXCEPTION)
        log.info(f"Tasks completed: done={len(done)}, pending={len(pending)}")

        # Check for exceptions
        for task in done:
            if task.exception():
                log.error(f"Task {task} failed with exception: {task.exception()}")
                import traceback

                log.error(
                    f"Traceback: {traceback.format_exception(type(task.exception()), task.exception(), task.exception().__traceback__)}"
                )
    except Exception as e:
        log.error(f"Error in start() function: {e}")
        import traceback

        log.error(f"Start function traceback: {traceback.format_exc()}")


asyncio.run(start())
