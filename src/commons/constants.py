"""
Constants for daphbot-due project

This module defines constants that can be overridden via environment variables.
"""

from basic_bot.commons.env import env_int, env_string

# WebRTC Signaling Server Configuration
D2_OUI_WEBRTC_PORT = env_int("D2_OUI_WEBRTC_PORT", 5201)
"""
Port number for the WebRTC signaling server hosted by onboard_ui service.

The onboard_ui service runs an aiohttp web server on this port to handle
WebRTC signaling messages (offer, answer, ICE candidates) from the webapp.
This is separate from the central_hub WebSocket (port 5100) to keep
WebRTC signaling isolated and focused.

Default: 5201
"""

D2_OUI_WEBRTC_HOST = env_string("D2_OUI_WEBRTC_HOST", "0.0.0.0")
"""
Host interface for the WebRTC signaling server.

Set to "0.0.0.0" to listen on all interfaces, allowing connections from
remote browsers. For security, could be restricted to specific interfaces
in production deployments.

Default: "0.0.0.0"
"""

D2_OUI_RENDER_FPS = env_int("D2_OUI_RENDER_FPS", 30)
"""
Frame rate for rendering the onboard UI display.

Default: 30 FPS
"""
