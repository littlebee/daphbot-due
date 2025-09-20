import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { BehaviorMode } from "../util/hubState";
import { hubHost } from "../util/hubState";

interface WebRTCStreamProps {
    isActive: boolean;
    mode: BehaviorMode;
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'failed';

interface MediaError {
    name: string;
    message: string;
}

export const WebRTCStream: React.FC<WebRTCStreamProps> = ({ isActive, mode }) => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
    const [mediaError, setMediaError] = useState<MediaError | null>(null);

    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const websocketRef = useRef<WebSocket | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);

    const webrtcSignalingUrl = useMemo(() => `ws://${hubHost}:5201/webrtc`, [hubHost]);

    const cleanup = useCallback(() => {
        // Close WebSocket
        if (websocketRef.current) {
            websocketRef.current.close();
            websocketRef.current = null;
        }

        // Close peer connection
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        // Stop local media tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        setConnectionState('disconnected');
    }, []);

    const requestUserMedia = useCallback(async () => {
        try {
            console.log('WebRTC: Requesting user media...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 15 }
                },
                audio: true
            });

            console.log('WebRTC: Got user media stream:', stream);
            localStreamRef.current = stream;
            setMediaError(null);
            return stream;
        } catch (error) {
            const mediaError = error as MediaError;
            console.error('WebRTC: Error accessing user media:', mediaError);
            console.error('WebRTC: Media error details:', mediaError.name, mediaError.message);
            setMediaError({
                name: mediaError.name || 'MediaError',
                message: mediaError.message || 'Failed to access camera/microphone'
            });
            throw error;
        }
    }, []);

    const createPeerConnection = useCallback(() => {
        const config: RTCConfiguration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        };

        const pc = new RTCPeerConnection(config);

        pc.onconnectionstatechange = () => {
            console.log('WebRTC connection state:', pc.connectionState);
            setConnectionState(pc.connectionState as ConnectionState);

            if (pc.connectionState === 'failed') {
                cleanup();
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && websocketRef.current) {
                websocketRef.current.send(JSON.stringify({
                    type: 'ice_candidate',
                    candidate: event.candidate.candidate,
                    sdpMid: event.candidate.sdpMid,
                    sdpMLineIndex: event.candidate.sdpMLineIndex,
                    foundation: event.candidate.foundation,
                    address: event.candidate.address,
                    port: event.candidate.port,
                    priority: event.candidate.priority,
                    protocol: event.candidate.protocol,
                    candidateType: event.candidate.type
                }));
            }
        };

        return pc;
    }, [cleanup]);

    const connectWebRTC = useCallback(async () => {
        try {
            setConnectionState('connecting');
            setMediaError(null);

            // Request user media first
            const stream = await requestUserMedia();

            // Create WebSocket connection
            console.log('WebRTC: Attempting to connect to:', webrtcSignalingUrl);
            const ws = new WebSocket(webrtcSignalingUrl);
            websocketRef.current = ws;

            ws.onopen = async () => {
                console.log('WebRTC: signaling connected successfully');

                // Create peer connection
                const pc = createPeerConnection();
                peerConnectionRef.current = pc;

                // Add local stream tracks
                stream.getTracks().forEach(track => {
                    pc.addTrack(track, stream);
                });

                // Create and send offer
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                ws.send(JSON.stringify({
                    type: 'offer',
                    sdp: offer.sdp
                }));
            };

            ws.onmessage = async (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'answer' && peerConnectionRef.current) {
                        const answer = new RTCSessionDescription({
                            type: 'answer',
                            sdp: data.sdp
                        });
                        await peerConnectionRef.current.setRemoteDescription(answer);
                    } else if (data.type === 'error') {
                        console.error('WebRTC signaling error:', data.message);
                        setMediaError({
                            name: 'SignalingError',
                            message: data.message
                        });
                        cleanup();
                    }
                } catch (error) {
                    console.error('Error processing WebRTC message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('WebRTC: signaling error:', error);
                console.error('WebRTC: Failed to connect to:', webrtcSignalingUrl);
                setMediaError({
                    name: 'ConnectionError',
                    message: `Failed to connect to WebRTC signaling server at ${webrtcSignalingUrl}`
                });
                setConnectionState('failed');
                cleanup();
            };

            ws.onclose = (event) => {
                console.log('WebRTC: signaling disconnected. Code:', event.code, 'Reason:', event.reason);
                if (event.code !== 1000) { // 1000 is normal closure
                    console.error('WebRTC: Abnormal WebSocket closure');
                }
                cleanup();
            };

        } catch (error) {
            console.error('Error connecting WebRTC:', error);
            setConnectionState('failed');
        }
    }, [webrtcSignalingUrl, requestUserMedia, createPeerConnection, cleanup]);

    // Effect to manage WebRTC connection based on active state and mode
    useEffect(() => {
        const shouldConnect = isActive && mode === BehaviorMode.Manual;

        if (shouldConnect && connectionState === 'disconnected') {
            console.log('WebRTC: Starting connection...');
            connectWebRTC();
        } else if (!shouldConnect && connectionState !== 'disconnected') {
            console.log('WebRTC: Cleaning up connection...');
            cleanup();
        }
        // Reset failed state when switching modes to allow retry
        if (!shouldConnect && connectionState === 'failed') {
            setConnectionState('disconnected');
        }

        return () => {
            // Only cleanup on unmount or when switching away from manual mode
            if (!isActive || mode !== BehaviorMode.Manual) {
                cleanup();
            }
        };
        // Remove connectWebRTC and cleanup from dependencies to prevent infinite loops
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive, mode, connectionState]);

    // Render connection status
    const renderStatus = () => {
        if (!isActive || mode !== BehaviorMode.Manual) {
            return null;
        }

        if (mediaError) {
            return (
                <div style={{
                    position: 'fixed',
                    top: '10px',
                    right: '10px',
                    background: '#ff4444',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '5px',
                    zIndex: 1000
                }}>
                    <strong>{mediaError.name}:</strong> {mediaError.message}
                    {mediaError.name.includes('Media') && (
                        <div style={{ marginTop: '5px', fontSize: '12px' }}>
                            Please allow camera and microphone access
                        </div>
                    )}
                </div>
            );
        }

        const statusColors = {
            'disconnected': '#666',
            'connecting': '#ff9900',
            'connected': '#00aa00',
            'failed': '#ff4444'
        };

        const statusMessages = {
            'disconnected': 'Not connected',
            'connecting': 'Connecting to robot...',
            'connected': 'Streaming to robot',
            'failed': 'Connection failed'
        };

        return (
            <div style={{
                position: 'fixed',
                top: '10px',
                right: '10px',
                background: statusColors[connectionState],
                color: 'white',
                padding: '8px 12px',
                borderRadius: '5px',
                fontSize: '14px',
                zIndex: 1000
            }}>
                {statusMessages[connectionState]}
            </div>
        );
    };

    return (
        <>
            {renderStatus()}
        </>
    );
};