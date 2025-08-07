import pygame
import random
import time
from enum import Enum

from basic_bot.commons import constants as bb_constants

import onboard_ui.styles as styles

(CENTER_X, CENTER_Y) = (540, 450)
(HEIGHT, WIDTH) = (250, 500)
(PUPIL_MOVEMENT_WIDTH, PUPIL_MOVEMENT_HEIGHT) = (WIDTH / 2, HEIGHT)
STATE_UPDATE_INTERVAL = 0.5  # seconds
BLINK_DURATION = 0.2
BLINK_INTERVAL_MIN = 0.05
BLINK_INTERVAL_MAX = 5.0

MAX_LID_HEIGHT = 500
RESTING_LID_HEIGHT = 300

RESTING_PUPIL_RADIUS = 120
ALERT_PUPIL_RADIUS = 100

TARGET_LABELS = ["person", "dog", "cat"]


def calc_next_blink_time(t=time.time()):
    return t + random.uniform(BLINK_INTERVAL_MIN, BLINK_INTERVAL_MAX)


class EyeState(Enum):
    RESTING = 0
    ALERT = 1


class Eye:
    def __init__(self, screen, hub_state) -> None:
        self.hub_state = hub_state
        self.screen = screen
        self.state: EyeState = EyeState.RESTING
        self.next_blink_time = calc_next_blink_time()
        self.blink_started_at = 0

        self.last_primary_target = None
        self.last_state_update_time = 0

    def update_state(self):
        if "primary_target" not in self.hub_state.state:
            return

        primary_target = self.hub_state.state["primary_target"]

        self.state = (
            EyeState.ALERT
            if primary_target is not None and self.last_primary_target is not None
            else EyeState.RESTING
        )
        self.last_primary_target = primary_target

    def maybe_blink(self, t):
        if t > self.next_blink_time:
            self.blink_started_at = t
            self.next_blink_time = calc_next_blink_time(t)

    def calc_lid_height(self, t):
        nominal_lid_height = RESTING_LID_HEIGHT if self.state == EyeState.RESTING else 0
        blink_elapsed = t - self.blink_started_at

        if blink_elapsed < BLINK_DURATION:
            blink_percent = blink_elapsed / BLINK_DURATION
            return max(MAX_LID_HEIGHT * blink_percent, nominal_lid_height)

        return nominal_lid_height

    # calculate the center of the pupil based on the bounding box of the primary target
    # so that the eye appears to be looking at the target
    def calc_pupil_center(self):
        if self.last_primary_target is None:
            return (CENTER_X, CENTER_Y)

        bb = self.last_primary_target["bounding_box"]
        bb_center = (bb[0] + (bb[2] - bb[0]) // 2, bb[1] + (bb[3] - bb[1]) // 2)
        bb_center_pct = (
            bb_center[0] / bb_constants.BB_VISION_WIDTH,
            bb_center[1] / bb_constants.BB_VISION_HEIGHT,
        )

        x = (
            CENTER_X
            + PUPIL_MOVEMENT_WIDTH / 2
            - bb_center_pct[0] * PUPIL_MOVEMENT_WIDTH
        )
        y = (
            CENTER_Y
            - PUPIL_MOVEMENT_HEIGHT / 2
            + bb_center_pct[1] * PUPIL_MOVEMENT_HEIGHT
        )
        return (int(x), int(y))

    def render(self, t):
        # this allows the eye to update its state every 0.5 seconds
        # effectively throttling the updates to pupil and eyelid movement
        # without compromising the responsiveness of interactive ui elements
        # rendering fps
        if t - self.last_state_update_time > STATE_UPDATE_INTERVAL:
            self.update_state()
            self.last_state_update_time = t

        self.maybe_blink(t)

        # whites of the eye
        pygame.draw.ellipse(
            self.screen,
            styles.WHITE,
            (CENTER_X - WIDTH / 2, CENTER_Y - HEIGHT / 2, WIDTH, HEIGHT),
            0,
        )
        # pupil
        pupil_radius = (
            ALERT_PUPIL_RADIUS if self.state == EyeState.ALERT else RESTING_PUPIL_RADIUS
        )
        pupil_center = self.calc_pupil_center()
        pygame.draw.circle(self.screen, styles.BLACK, pupil_center, pupil_radius)

        # eyelid
        pygame.draw.rect(
            self.screen,
            styles.DARK_GRAY,
            (CENTER_X - WIDTH / 2, CENTER_Y - HEIGHT, WIDTH, self.calc_lid_height(t)),
            0,
            40,
        )
