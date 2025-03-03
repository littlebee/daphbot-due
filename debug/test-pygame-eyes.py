#!/usr/bin/env python
"""
Display a set of animated eyes using Pygame.


Source: Gemini prompt:
python code for an animated pair of human-like eyes that
display different expressions or emotions

NOTE: This looks like ass.  You'll need a keyboard or VNC to
see (you can run from dev mach:  `python debug/test-pygame-eyes`).
press 1-5 for the different expressions.
"""

import pygame
import random

# Initialize Pygame
pygame.init()

# Screen dimensions
WIDTH = 800
HEIGHT = 400
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Animated Eyes")

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
BLUE = (0, 0, 255)
GRAY = (150, 150, 150)

# Eye parameters
EYE_RADIUS = 80
PUPIL_RADIUS = 30
EYE_SPACING = 200
EYE_Y = HEIGHT // 2

# Pupil movement limits
PUPIL_LIMIT = EYE_RADIUS - PUPIL_RADIUS - 10

# Emotion states
EMOTIONS = {
    "neutral": {"pupil_x": 0, "pupil_y": 0, "eyelid_top": 0, "eyelid_bottom": 0},
    "happy": {"pupil_x": 0, "pupil_y": -10, "eyelid_top": -20, "eyelid_bottom": 20},
    "sad": {"pupil_x": 0, "pupil_y": 10, "eyelid_top": 20, "eyelid_bottom": -20},
    "angry": {"pupil_x": 10, "pupil_y": 5, "eyelid_top": 10, "eyelid_bottom": 0},
    "surprised": {"pupil_x": 0, "pupil_y": -10, "eyelid_top": -40, "eyelid_bottom": 40},
    "blinking": {"pupil_x": 0, "pupil_y": 0, "eyelid_top": 80, "eyelid_bottom": -80},
}


# Eye class
class Eye:
    def __init__(self, x):
        self.x = x
        self.emotion = "neutral"
        self.emotion_timer = 0
        self.blink_timer = 0
        self.blink_duration = random.randint(10, 30)

    def set_emotion(self, emotion):
        self.emotion = emotion
        self.emotion_timer = 120  # Duration of emotion (frames)

    def update(self):
        if self.blink_timer > 0:
            self.blink_timer -= 1
            self.emotion = "blinking"
        elif random.randint(0, 300) == 0:
            self.blink_timer = self.blink_duration

        if self.emotion_timer > 0:
            self.emotion_timer -= 1
        else:
            self.emotion = "neutral"

    def draw(self, screen):
        emotion_data = EMOTIONS[self.emotion]
        pupil_x = emotion_data["pupil_x"]
        pupil_y = emotion_data["pupil_y"]
        eyelid_top = emotion_data["eyelid_top"]
        eyelid_bottom = emotion_data["eyelid_bottom"]

        # Eye white
        pygame.draw.circle(screen, WHITE, (self.x, EYE_Y), EYE_RADIUS)

        # Eyelids
        pygame.draw.circle(screen, GRAY, (self.x, EYE_Y + eyelid_top), EYE_RADIUS)
        pygame.draw.circle(screen, GRAY, (self.x, EYE_Y + eyelid_bottom), EYE_RADIUS)
        pygame.draw.rect(
            screen,
            WHITE,
            (
                self.x - EYE_RADIUS,
                EYE_Y + eyelid_top,
                EYE_RADIUS * 2,
                abs(eyelid_bottom - eyelid_top),
            ),
        )

        # Pupil
        pygame.draw.circle(
            screen, BLACK, (self.x + pupil_x, EYE_Y + pupil_y), PUPIL_RADIUS
        )


# Create eyes
left_eye = Eye(WIDTH // 2 - EYE_SPACING // 2)
right_eye = Eye(WIDTH // 2 + EYE_SPACING // 2)

# Main loop
running = True
clock = pygame.time.Clock()

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_1:
                left_eye.set_emotion("happy")
                right_eye.set_emotion("happy")
            elif event.key == pygame.K_2:
                left_eye.set_emotion("sad")
                right_eye.set_emotion("sad")
            elif event.key == pygame.K_3:
                left_eye.set_emotion("angry")
                right_eye.set_emotion("angry")
            elif event.key == pygame.K_4:
                left_eye.set_emotion("surprised")
                right_eye.set_emotion("surprised")
            elif event.key == pygame.K_5:
                left_eye.set_emotion("neutral")
                right_eye.set_emotion("neutral")

    # Update eyes
    left_eye.update()
    right_eye.update()

    # Clear screen
    screen.fill(BLACK)

    # Draw eyes
    left_eye.draw(screen)
    right_eye.draw(screen)

    # Update display
    pygame.display.flip()
    clock.tick(60)

# Quit Pygame
pygame.quit()
