import pygame
import socket
import subprocess

from basic_bot.commons import log
import onboard_ui.styles as styles


def render_system_info(screen, hub_state):
    LARGE_FONT = pygame.font.SysFont("timesnewroman", 30)
    SMALL_FONT = pygame.font.SysFont("timesnewroman", 20)

    text = SMALL_FONT.render("Network:", True, styles.WHITE, styles.BLACK)
    screen.blit(text, (0, 0))

    text = LARGE_FONT.render(
        hub_state.state["system_stats"]["hostname"],
        True,
        styles.WHITE,
        styles.BLACK,
    )
    screen.blit(text, (10, 22))

    text = LARGE_FONT.render(get_ip_address(), True, styles.WHITE, styles.BLACK)
    screen.blit(text, (10, 58))

    wifiSsid = subprocess.run(["iwgetid", "-r"], stdout=subprocess.PIPE).stdout
    text = LARGE_FONT.render(wifiSsid, True, styles.WHITE, styles.BLACK)
    screen.blit(text, (10, 92))

    text = SMALL_FONT.render("CPU: ", True, styles.WHITE, styles.BLACK)
    screen.blit(text, (0, 126))

    cpu_util = hub_state.state["system_stats"]["cpu_util"]
    text = LARGE_FONT.render(f"{cpu_util:.1f}%", True, styles.WHITE, styles.BLACK)
    screen.blit(text, (10, 148))

    cpu_temp = hub_state.state["system_stats"]["cpu_temp"]
    text = LARGE_FONT.render(f"{cpu_temp:.1f}°", True, styles.WHITE, styles.BLACK)
    screen.blit(text, (100, 148))


def get_ip_address():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip_addr = s.getsockname()[0]
        s.close()
        return ip_addr
    except Exception as e:
        log.error(f"unable to get ip address. {e}")
        return "0.0.0.0"
