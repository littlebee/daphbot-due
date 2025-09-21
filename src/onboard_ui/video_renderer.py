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

from basic_bot.commons import log, constants as bb_constants
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

        # Total frames processed
        self.frame_count = 0
        # times spent in handle_video_frame per frame of frame_dump_interval length
        self.frame_handling_times = []
        # Log every 30 frames
        self.frame_dump_interval = 30
        self.frame_dump_start_time = None

        self.rendered_frame_count = 0
        self.rendered_frame_times = []

    def handle_video_frame(self, frame: VideoFrame):
        """
        Process incoming WebRTC video frame and convert to pygame surface.

        Args:
            frame: Video frame from WebRTC stream
        """
        try:
            start_time = time.time()
            # Convert frame to numpy array
            img = frame.to_ndarray(format="bgr24")

            # Crop to center 1080x1080 pixels and scale up if necessary
            height, width = img.shape[:2]

            # First, scale up if frame is smaller than 1080x1080
            if width < 1080 or height < 1080:
                scale_factor = max(1080 / width, 1080 / height)
                new_width = int(width * scale_factor)
                new_height = int(height * scale_factor)
                img = cv2.resize(img, (new_width, new_height))
                height, width = img.shape[:2]

            # Calculate crop coordinates for center 1080x1080
            crop_size = 1080
            center_x = width // 2
            center_y = height // 2

            # Calculate crop bounds
            left = max(0, center_x - crop_size // 2)
            top = max(0, center_y - crop_size // 2)
            right = min(width, left + crop_size)
            bottom = min(height, top + crop_size)

            # Adjust if crop area is smaller than desired (edge case)
            if right - left < crop_size:
                left = max(0, right - crop_size)
            if bottom - top < crop_size:
                top = max(0, bottom - crop_size)

            # Crop to center 1080x1080
            resized_img = img[top:bottom, left:right]

            # Convert BGR to RGB for pygame
            rgb_img = cv2.cvtColor(resized_img, cv2.COLOR_BGR2RGB)

            # Create pygame surface
            # Transpose array to match pygame's (width, height, channels) format
            rgb_img = np.transpose(rgb_img, (1, 0, 2))  # type: ignore
            self.current_frame = pygame.surfarray.make_surface(rgb_img)

            self.frame_count += 1
            self.last_frame_time = time.time()
            self.frame_handling_times.append(self.last_frame_time - start_time)

            if (
                bb_constants.BB_LOG_DEBUG
                and self.frame_count % self.frame_dump_interval == 0
            ):  # Log every 30 frames
                total_time = time.time() - (
                    self.frame_dump_start_time or self.last_frame_time
                )
                total_handling_time = sum(self.frame_handling_times)
                self.frame_handling_times = []
                self.frame_dump_start_time = self.last_frame_time
                self.rendered_frame_count

                log.debug(
                    f"Stats for last {self.frame_dump_interval} frames:\n"
                    f"    total frames handled: {self.frame_count};\n"
                    f"    total frames rendered: {self.rendered_frame_count};\n"
                    f"    total time for {self.frame_dump_interval} frames: {total_time:.4f}s;\n"
                    f"    total time in handle_video_frame: {total_handling_time:.4f}s;\n"
                    f"    avg handling time per frame: {total_handling_time / self.frame_dump_interval:.4f}s;\n"
                )

        except Exception as e:
            log.error(f"Error processing video frame: {e}")

    def render(self, t):
        """
        Render current video frame to the screen.

        Args:
            t: Current time
        """
        self.rendered_frame_count += 1
        if self.current_frame is not None:
            # Calculate position to center the video
            frame_rect = self.current_frame.get_rect()
            x = VIDEO_X + (VIDEO_AREA_WIDTH - frame_rect.width) // 2
            y = VIDEO_Y + (VIDEO_AREA_HEIGHT - frame_rect.height) // 2

            # Draw the video frame
            self.screen.blit(self.current_frame, (x, y))
        else:
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
