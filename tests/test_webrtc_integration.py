#!/usr/bin/env python3
"""
Integration tests for WebRTC streaming functionality.

These tests verify the basic setup and configuration of WebRTC components
without requiring actual camera hardware or full WebRTC connections.
"""

import unittest
import asyncio
from unittest.mock import patch, MagicMock, AsyncMock

import sys
import os

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from commons.constants import D2_OUI_WEBRTC_PORT, D2_OUI_WEBRTC_HOST
from onboard_ui.webrtc_server import WebRTCSignalingServer
from onboard_ui.video_renderer import VideoRenderer


class TestWebRTCConstants(unittest.TestCase):
    """Test WebRTC configuration constants."""

    def test_webrtc_constants_defined(self):
        """Test that WebRTC constants are properly defined."""
        self.assertIsInstance(D2_OUI_WEBRTC_PORT, int)
        self.assertEqual(D2_OUI_WEBRTC_PORT, 5201)
        self.assertIsInstance(D2_OUI_WEBRTC_HOST, str)
        self.assertEqual(D2_OUI_WEBRTC_HOST, "0.0.0.0")


class TestWebRTCSignalingServer(unittest.TestCase):
    """Test WebRTC signaling server functionality."""

    def setUp(self):
        """Set up test fixtures."""
        self.mock_video_callback = MagicMock()
        self.server = WebRTCSignalingServer(video_callback=self.mock_video_callback)

    def test_server_initialization(self):
        """Test that WebRTC server initializes correctly."""
        self.assertIsNotNone(self.server.app)
        self.assertEqual(self.server.video_callback, self.mock_video_callback)
        self.assertIsNone(self.server.peer_connection)
        self.assertIsNone(self.server.websocket)

    def test_health_check_route(self):
        """Test that health check route is configured."""
        routes = [
            route.method + " " + route.resource.canonical
            for route in self.server.app.router.routes()
        ]
        self.assertIn("GET /health", routes)

    def test_websocket_route(self):
        """Test that WebSocket route is configured."""
        routes = [
            route.method + " " + route.resource.canonical
            for route in self.server.app.router.routes()
        ]
        self.assertIn("GET /webrtc", routes)

    @patch("aiohttp.web.json_response")
    def test_health_check_handler(self, mock_json_response):
        """Test health check endpoint."""
        mock_request = MagicMock()

        async def run_test():
            await self.server.health_check(mock_request)

        asyncio.run(run_test())

        mock_json_response.assert_called_once_with(
            {"status": "ok", "service": "webrtc_signaling"}
        )

    def test_signaling_message_handling(self):
        """Test WebRTC signaling message processing."""
        async def run_test():
            # Test unknown message type
            await self.server.handle_signaling_message({"type": "unknown"})

        asyncio.run(run_test())

        # Should not crash with unknown message types
        self.assertIsNone(self.server.peer_connection)


class TestVideoRenderer(unittest.TestCase):
    """Test video renderer functionality."""

    def setUp(self):
        """Set up test fixtures."""
        # Mock pygame screen
        self.mock_screen = MagicMock()
        self.mock_screen.get_width.return_value = 1080
        self.mock_screen.get_height.return_value = 1080
        self.renderer = VideoRenderer(self.mock_screen)

    def test_renderer_initialization(self):
        """Test that video renderer initializes correctly."""
        self.assertEqual(self.renderer.screen, self.mock_screen)
        self.assertIsNone(self.renderer.current_frame)
        self.assertEqual(self.renderer.frame_count, 0)
        self.assertEqual(self.renderer.last_frame_time, 0)

    def test_has_recent_frame_no_frame(self):
        """Test has_recent_frame when no frame is available."""
        self.assertFalse(self.renderer.has_recent_frame())

    def test_has_recent_frame_old_frame(self):
        """Test has_recent_frame with old frame."""
        import time

        self.renderer.last_frame_time = time.time() - 10  # 10 seconds ago
        self.renderer.current_frame = MagicMock()  # Mock frame

        self.assertFalse(self.renderer.has_recent_frame(max_age_seconds=2.0))

    def test_get_frame_stats(self):
        """Test frame statistics reporting."""
        stats = self.renderer.get_frame_stats()

        self.assertIn("frame_count", stats)
        self.assertIn("last_frame_time", stats)
        self.assertIn("has_current_frame", stats)
        self.assertIn("frame_age", stats)

        self.assertEqual(stats["frame_count"], 0)
        self.assertEqual(stats["last_frame_time"], 0)
        self.assertFalse(stats["has_current_frame"])

    @patch("pygame.surfarray.make_surface")
    @patch("cv2.resize")
    @patch("cv2.cvtColor")
    def test_handle_video_frame_error_handling(
        self, mock_cvtColor, mock_resize, mock_make_surface
    ):
        """Test video frame processing error handling."""
        # Mock frame that will cause an error
        mock_frame = MagicMock()
        mock_frame.to_ndarray.side_effect = Exception("Mock error")

        # Should not crash when frame processing fails
        try:
            self.renderer.handle_video_frame(mock_frame)
        except Exception:
            self.fail("handle_video_frame should handle errors gracefully")


class TestWebRTCIntegration(unittest.TestCase):
    """Integration tests for WebRTC components."""

    def setUp(self):
        """Set up integration test fixtures."""
        self.mock_screen = MagicMock()
        self.video_renderer = VideoRenderer(self.mock_screen)
        self.webrtc_server = WebRTCSignalingServer(
            video_callback=self.video_renderer.handle_video_frame
        )

    def test_video_callback_integration(self):
        """Test that video callback is properly connected."""
        self.assertEqual(
            self.webrtc_server.video_callback, self.video_renderer.handle_video_frame
        )

    @patch("aiohttp.web.AppRunner")
    @patch("aiohttp.web.TCPSite")
    def test_server_startup_configuration(self, mock_site, mock_runner):
        """Test that server starts with correct configuration."""
        mock_runner_instance = MagicMock()
        mock_runner_instance.setup = AsyncMock()
        mock_runner.return_value = mock_runner_instance

        mock_site_instance = MagicMock()
        mock_site_instance.start = AsyncMock()
        mock_site.return_value = mock_site_instance

        async def run_test():
            await self.webrtc_server.start_server()

        asyncio.run(run_test())

        # Verify runner setup
        mock_runner.assert_called_once_with(self.webrtc_server.app)
        mock_runner_instance.setup.assert_called_once()

        # Verify site configuration
        mock_site.assert_called_once_with(
            mock_runner_instance, D2_OUI_WEBRTC_HOST, D2_OUI_WEBRTC_PORT
        )
        mock_site_instance.start.assert_called_once()


if __name__ == "__main__":
    unittest.main()
