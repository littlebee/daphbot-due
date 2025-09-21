"""
WebRTC signaling server for onboard_ui service.

This module provides an aiohttp web server that handles WebRTC signaling
between the webapp and onboard_ui service for browser-to-display video streaming.
"""

import asyncio
import json
import logging
from typing import Optional

import aiohttp
from aiohttp import web, WSMsgType
from aiohttp_cors import setup as cors_setup, ResourceOptions
from aiortc import RTCPeerConnection, RTCSessionDescription

from basic_bot.commons import log
from commons.constants import D2_OUI_WEBRTC_HOST, D2_OUI_WEBRTC_PORT

logger = logging.getLogger(__name__)


class WebRTCSignalingServer:
    def __init__(self, video_callback=None):
        """
        Initialize WebRTC signaling server.

        Args:
            video_callback: Function to call when new video frame is received
        """
        self.app = web.Application()
        self.video_callback = video_callback
        self.peer_connection: Optional[RTCPeerConnection] = None
        self.websocket: Optional[aiohttp.ClientWebSocketResponse] = None

        # Setup CORS for cross-origin requests from webapp
        cors = cors_setup(
            self.app,
            defaults={
                "*": ResourceOptions(
                    allow_credentials=True,
                    expose_headers="*",
                    allow_headers="*",
                    allow_methods="*",
                )
            },
        )

        # Add routes
        self.app.router.add_get("/webrtc", self.websocket_handler)
        self.app.router.add_get("/health", self.health_check)

        # Add CORS to all routes
        for route in list(self.app.router.routes()):
            cors.add(route)

    async def health_check(self, request):
        """Health check endpoint."""
        return web.json_response({"status": "ok", "service": "webrtc_signaling"})

    async def websocket_handler(self, request):
        """Handle WebSocket connections for WebRTC signaling."""
        ws = web.WebSocketResponse()
        await ws.prepare(request)

        self.websocket = ws
        log.info("WebRTC signaling client connected")

        async for msg in ws:
            if msg.type == WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                    await self.handle_signaling_message(data)
                except Exception as e:
                    log.error(f"Error processing WebRTC message: {e}")
                    await self.send_error(f"Error processing message: {e}")
            elif msg.type == WSMsgType.ERROR:
                log.error(f"WebRTC WebSocket error: {ws.exception()}")
                break

        log.info("WebRTC signaling client disconnected")
        self.websocket = None

        # Clean up peer connection
        if self.peer_connection:
            await self.peer_connection.close()
            self.peer_connection = None

        return ws

    async def handle_signaling_message(self, data):
        """Process incoming WebRTC signaling messages."""
        message_type = data.get("type")

        if message_type == "offer":
            await self.handle_offer(data)
        elif message_type == "ice_candidate":
            await self.handle_ice_candidate(data)
        else:
            log.debug(f"Unknown WebRTC message type: {message_type}")

    async def handle_offer(self, data):
        """Handle WebRTC offer from browser."""
        try:
            # Create new peer connection
            self.peer_connection = RTCPeerConnection()

            # Set up event handlers
            @self.peer_connection.on("track")
            def on_track(track):
                log.info(f"Received WebRTC track: {track.kind}")
                if track.kind == "video" and self.video_callback:
                    asyncio.create_task(self.process_video_track(track))

            @self.peer_connection.on("connectionstatechange")
            async def on_connectionstatechange():
                log.info(
                    f"WebRTC connection state: {self.peer_connection.connectionState}"
                )

            # Set remote description from offer
            offer = RTCSessionDescription(sdp=data["sdp"], type=data["type"])
            await self.peer_connection.setRemoteDescription(offer)

            # Create answer
            answer = await self.peer_connection.createAnswer()
            await self.peer_connection.setLocalDescription(answer)

            # Send answer back to browser
            await self.send_message(
                {"type": "answer", "sdp": self.peer_connection.localDescription.sdp}
            )

            log.info("WebRTC answer sent to browser")

        except Exception as e:
            log.error(f"Error handling WebRTC offer: {e}")
            await self.send_error(f"Error processing offer: {e}")

    async def handle_ice_candidate(self, data):
        """Handle ICE candidate from browser."""
        try:
            if self.peer_connection and data.get("candidate"):
                from aiortc import RTCIceCandidate

                candidate = RTCIceCandidate(
                    component=1,
                    foundation=data.get("foundation", ""),
                    ip=data.get("address", ""),
                    port=data.get("port", 0),
                    priority=data.get("priority", 0),
                    protocol=data.get("protocol", "udp"),
                    type=data.get("candidateType", "host"),
                    sdpMid=data.get("sdpMid"),
                    sdpMLineIndex=data.get("sdpMLineIndex"),
                )

                await self.peer_connection.addIceCandidate(candidate)
                log.debug("Added ICE candidate")

        except Exception as e:
            log.error(f"Error handling ICE candidate: {e}")

    async def process_video_track(self, track):
        """Process incoming video frames from WebRTC track."""
        try:
            while True:
                frame = await track.recv()
                if self.video_callback:
                    self.video_callback(frame)
        except Exception as e:
            log.error(f"Error processing video track: {e}")

    async def send_message(self, message):
        """Send message to WebSocket client."""
        if self.websocket and not self.websocket.closed:
            await self.websocket.send_str(json.dumps(message))

    async def send_error(self, error_message):
        """Send error message to WebSocket client."""
        await self.send_message({"type": "error", "message": error_message})

    async def start_server(self):
        """Start the WebRTC signaling server."""
        runner = web.AppRunner(self.app)

        log.debug("Setting up WebRTC server runner")
        await runner.setup()

        log.debug("Creating WebRTC server site")
        site = web.TCPSite(runner, D2_OUI_WEBRTC_HOST, D2_OUI_WEBRTC_PORT)
        log.debug("Starting WebRTC server site")
        await site.start()

        log.info(
            f"WebRTC signaling server started on {D2_OUI_WEBRTC_HOST}:{D2_OUI_WEBRTC_PORT}"
        )
        return runner

    async def stop_server(self, runner):
        """Stop the WebRTC signaling server."""
        if self.peer_connection:
            await self.peer_connection.close()
        await runner.cleanup()
        log.info("WebRTC signaling server stopped")
