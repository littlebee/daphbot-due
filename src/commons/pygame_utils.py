import pygame
from pygame.locals import MOUSEBUTTONDOWN, MOUSEBUTTONUP, FINGERDOWN, FINGERUP


def translate_touch_event(screen, event):
    """
        If event is FINGERDOWN, this function returns a MOUSEBUTTONDOWN
        event with a `pos` member that is translated from the FINGERDOWN x and y

        Other events are returned untouched
    """
    event_out = event
    if event.type == FINGERDOWN or event.type == FINGERUP:
        w, h = screen.get_size()
        pos = (int(event.x * w), int(event.y * h))
        # print(f"got touch event {event.x},{event.y} {w},{h} -> {pos}")
        event_type = MOUSEBUTTONDOWN if event.type == FINGERDOWN else MOUSEBUTTONUP
        event_out = pygame.event.Event(event_type, pos=pos)

    return event_out
