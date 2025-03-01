import pygame

import onboard_ui.styles as styles

(LEFT, TOP) = (470, 850)


def offset(left, top):
    return (LEFT + left, TOP + top)


class CPUInfo:
    def __init__(self, screen, hub_state):
        self.hub_state = hub_state
        self.screen = screen

    def render(self, _t):
        LARGE_FONT = pygame.font.SysFont("timesnewroman", 30)
        SMALL_FONT = pygame.font.SysFont("timesnewroman", 20)

        text = SMALL_FONT.render("CPU: ", True, styles.WHITE, styles.DARK_GRAY)
        self.screen.blit(text, offset(0, 126))

        cpu_util = self.hub_state.state["system_stats"]["cpu_util"]
        text = LARGE_FONT.render(
            f"{cpu_util:.1f}%", True, styles.WHITE, styles.DARK_GRAY
        )
        self.screen.blit(text, offset(10, 148))

        cpu_temp = self.hub_state.state["system_stats"]["cpu_temp"]
        text = LARGE_FONT.render(
            f"{cpu_temp:.1f}°", True, styles.WHITE, styles.DARK_GRAY
        )
        self.screen.blit(text, offset(100, 148))
