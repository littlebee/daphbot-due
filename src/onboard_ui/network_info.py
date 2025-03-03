import pygame
import socket
import subprocess

from basic_bot.commons import log
import onboard_ui.styles as styles

(LEFT, TOP) = (30, 500)


def offset(left, top):
    return (LEFT + left, TOP + top)


class NetworkInfo:
    def __init__(self, screen, hub_state):
        self.hub_state = hub_state
        self.screen = screen
        self.ip_addr = get_ip_address()
        self.ssid = get_wifi_ssid()

    def render(self, _t):
        LARGE_FONT = pygame.font.SysFont("timesnewroman", 30)
        SMALL_FONT = pygame.font.SysFont("timesnewroman", 20)

        text = SMALL_FONT.render("Network:", True, styles.WHITE, styles.DARK_GRAY)
        self.screen.blit(text, offset(0, 0))

        text = LARGE_FONT.render(
            self.hub_state.state["system_stats"]["hostname"],
            True,
            styles.WHITE,
            styles.DARK_GRAY,
        )
        self.screen.blit(text, offset(10, 22))

        text = LARGE_FONT.render(self.ip_addr, True, styles.WHITE, styles.DARK_GRAY)
        self.screen.blit(text, offset(10, 58))

        text = LARGE_FONT.render(self.ssid, True, styles.WHITE, styles.DARK_GRAY)
        self.screen.blit(text, offset(10, 92))


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


def get_wifi_ssid():
    # Linux
    try:
        ssid = subprocess.check_output(
            "iwgetid -r", shell=True, stderr=subprocess.DEVNULL
        ).decode("utf-8")
        return ssid.strip()
    except Exception as e:
        log.error(f"unable to get wifi ssid using iwgetid. {e}")

    # macOS
    try:
        ssid = subprocess.check_output(
            "networksetup -getairportnetwork en0", shell=True, stderr=subprocess.DEVNULL
        ).decode("utf-8")
        return ssid.split(":")[1].strip()
    except Exception as e:
        log.error(f"unable to get wifi ssid using networksetup. {e}")

    return ""
