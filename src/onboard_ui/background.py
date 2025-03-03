import pygame

from onboard_ui.styles import DARK_GRAY


class Background:
    def __init__(self, screen):
        self.screen = screen

    def render(self, _t):
        # this is mostly just for when running locally and laying out the UI
        # you can see the actual display area of the 5" round screen.
        pygame.draw.circle(self.screen, DARK_GRAY, (540, 540), 540)
