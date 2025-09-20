"""
Video renderer for displaying WebRTC video frames in pygame.

This module handles converting WebRTC video frames to pygame surfaces
and rendering them to the onboard display, replacing the eye animation
when in manual mode.
"""

import time
import pygame
import numpy as np
from typing import Optional

import cv2
from av import VideoFrame

from basic_bot.commons import log
import onboard_ui.styles as styles

# Display constants
DISPLAY_WIDTH = 1080
DISPLAY_HEIGHT = 1080
VIDEO_AREA_WIDTH = 800
VIDEO_AREA_HEIGHT = 600
VIDEO_X = (DISPLAY_WIDTH - VIDEO_AREA_WIDTH) // 2
VIDEO_Y = (DISPLAY_HEIGHT - VIDEO_AREA_HEIGHT) // 2


class VideoRenderer:
    """Renders WebRTC video frames to pygame display."""

    def __init__(self, screen):
        """
        Initialize video renderer.

        Args:
            screen: pygame screen surface
        """
        self.screen = screen
        self.current_frame: Optional[pygame.Surface] = None
        self.last_frame_time = 0
        self.frame_count = 0

    def handle_video_frame(self, frame: VideoFrame):
        """
        Process incoming WebRTC video frame and convert to pygame surface.

        Args:
            frame: Video frame from WebRTC stream
        """
        try:
            # Convert frame to numpy array
            img = frame.to_ndarray(format="bgr24")

            # Resize to fit video area while maintaining aspect ratio
            height, width = img.shape[:2]
            aspect_ratio = width / height

            if aspect_ratio > VIDEO_AREA_WIDTH / VIDEO_AREA_HEIGHT:
                # Fit to width
                new_width = VIDEO_AREA_WIDTH
                new_height = int(VIDEO_AREA_WIDTH / aspect_ratio)
            else:
                # Fit to height
                new_height = VIDEO_AREA_HEIGHT
                new_width = int(VIDEO_AREA_HEIGHT * aspect_ratio)

            # Resize image
            resized_img = cv2.resize(img, (new_width, new_height))

            # Convert BGR to RGB for pygame
            rgb_img = cv2.cvtColor(resized_img, cv2.COLOR_BGR2RGB)

            # Create pygame surface
            # Transpose array to match pygame's (width, height, channels) format
            rgb_img = np.transpose(rgb_img, (1, 0, 2))
            self.current_frame = pygame.surfarray.make_surface(rgb_img)

            self.frame_count += 1
            self.last_frame_time = time.time()

            if self.frame_count % 30 == 0:  # Log every 30 frames
                log.debug(f"Processed {self.frame_count} video frames")

        except Exception as e:
            log.error(f"Error processing video frame: {e}")

    def render(self, t):
        """
        Render current video frame to the screen.

        Args:
            t: Current time
        """
        if self.current_frame is not None:
            # Calculate position to center the video
            frame_rect = self.current_frame.get_rect()
            x = VIDEO_X + (VIDEO_AREA_WIDTH - frame_rect.width) // 2
            y = VIDEO_Y + (VIDEO_AREA_HEIGHT - frame_rect.height) // 2

            # Draw the video frame
            self.screen.blit(self.current_frame, (x, y))
        else:
            # No video frame available - show placeholder
            self.render_placeholder()

    def render_placeholder(self):
        """Render placeholder when no video is available."""
        # Draw placeholder rectangle
        pygame.draw.rect(
            self.screen,
            styles.DARK_GRAY,
            (VIDEO_X, VIDEO_Y, VIDEO_AREA_WIDTH, VIDEO_AREA_HEIGHT),
        )

        # Draw border
        pygame.draw.rect(
            self.screen,
            styles.LIGHT_GRAY,
            (VIDEO_X - 2, VIDEO_Y - 2, VIDEO_AREA_WIDTH + 4, VIDEO_AREA_HEIGHT + 4),
            2,
        )

        # Add text indicating waiting for video
        if hasattr(pygame, "font") and pygame.font.get_init():
            font = pygame.font.Font(None, 48)
            text = font.render("Waiting for video stream...", True, styles.WHITE)
            text_rect = text.get_rect(center=(DISPLAY_WIDTH // 2, DISPLAY_HEIGHT // 2))
            self.screen.blit(text, text_rect)

    def has_recent_frame(self, max_age_seconds=2.0):
        """
        Check if we have a recent video frame.

        Args:
            max_age_seconds: Maximum age of frame to consider recent

        Returns:
            bool: True if frame is recent, False otherwise
        """
        if not self.current_frame:
            return False
        return (time.time() - self.last_frame_time) < max_age_seconds

    def get_frame_stats(self):
        """Get video frame statistics for debugging."""
        return {
            "frame_count": self.frame_count,
            "last_frame_time": self.last_frame_time,
            "has_current_frame": self.current_frame is not None,
            "frame_age": (
                time.time() - self.last_frame_time if self.last_frame_time > 0 else None
            ),
        }
