import { useEffect, useRef } from "react";
import { WebRTCClient } from "../util/webrtcClient";

interface WebRTCVideoClientProps {
    isActive: boolean;
    audioEnabled: boolean;
}

export const WebRTCVideoClient: React.FC<WebRTCVideoClientProps> = ({
    isActive,
    audioEnabled,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const webrtcClient = useRef<WebRTCClient | null>(null);

    // Effect to manage connection based on active state
    useEffect(() => {
        if (!(videoRef.current && audioRef.current)) return;

        if (isActive) {
            webrtcClient.current = new WebRTCClient();
            webrtcClient.current.start(videoRef.current, audioRef.current);
        } else {
            webrtcClient.current?.stop();
            webrtcClient.current = null;
        }
    }, [isActive, videoRef, audioRef]);

    // Effect to manage audio muting
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = !audioEnabled;
            console.log("WebRTC: Audio", audioEnabled ? "enabled" : "muted");
        }
    }, [audioEnabled]);

    return (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={true} // Video audio is controlled by the separate audio element
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    backgroundColor: "#000",
                }}
            />
            <audio ref={audioRef} autoPlay muted={!audioEnabled} playsInline />
        </div>
    );
};
