/*

NOTE:  This component is not used yet.  I am exploring adding WebRTC video feed
to basic_bot.  This component is a *possible* React component that will be used
to render the video feed.  There is no such WebRTC video feed service ATM

The first commit below is based on asking Claude 3.5 to finish after providing
the single lime comment above the imports.  This may be a hallucination, but
it's not mine. :)

See also https://github.com/littlebee/basic_bot/issues/31

*/

// A function React component that renders the RTC video from a remote websocket connection
import React, { useEffect, useRef } from "react";

interface RTCVideoProps {
    websocketUrl: string;
}

const RTCVideo: React.FC<RTCVideoProps> = ({ websocketUrl }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const websocketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        // Initialize WebRTC peer connection
        peerConnectionRef.current = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        // Connect to WebSocket
        websocketRef.current = new WebSocket(websocketUrl);

        // Handle incoming WebSocket messages
        websocketRef.current.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "offer") {
                await peerConnectionRef.current?.setRemoteDescription(
                    new RTCSessionDescription(message)
                );
                const answer = await peerConnectionRef.current?.createAnswer();
                await peerConnectionRef.current?.setLocalDescription(answer);
                websocketRef.current?.send(JSON.stringify(answer));
            }
        };

        // Handle incoming video stream
        peerConnectionRef.current.ontrack = (event) => {
            if (videoRef.current) {
                videoRef.current.srcObject = event.streams[0];
            }
        };

        // Cleanup
        return () => {
            peerConnectionRef.current?.close();
            websocketRef.current?.close();
        };
    }, [websocketUrl]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: "100%", height: "100%" }}
        />
    );
};

export default RTCVideo;
