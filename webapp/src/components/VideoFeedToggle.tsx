import { useState, useEffect } from "react";
import {
    VideoFeedType,
    getVideoFeedType,
    saveVideoFeedType,
    getAudioEnabled,
    saveAudioEnabled,
} from "../util/videoPreferences";

import styles from "./VideoFeedToggle.module.css";

interface VideoFeedToggleProps {
    onFeedTypeChange: (feedType: VideoFeedType) => void;
    onAudioEnabledChange: (enabled: boolean) => void;
}

export const VideoFeedToggle: React.FC<VideoFeedToggleProps> = ({
    onFeedTypeChange,
    onAudioEnabledChange,
}) => {
    const [feedType, setFeedType] = useState<VideoFeedType>("mjpeg");
    const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

    // Load preferences on mount
    useEffect(() => {
        const loadedFeedType = getVideoFeedType();
        const loadedAudioEnabled = getAudioEnabled();

        setFeedType(loadedFeedType);
        setAudioEnabled(loadedAudioEnabled);

        // Notify parent components of loaded preferences
        onFeedTypeChange(loadedFeedType);
        onAudioEnabledChange(loadedAudioEnabled);
    }, [onFeedTypeChange, onAudioEnabledChange]);

    const handleFeedTypeChange = (newFeedType: VideoFeedType) => {
        setFeedType(newFeedType);
        saveVideoFeedType(newFeedType);
        onFeedTypeChange(newFeedType);

        // When switching to WebRTC, ensure audio starts disabled (per requirements)
        if (newFeedType === "webrtc" && audioEnabled) {
            const newAudioState = false;
            setAudioEnabled(newAudioState);
            saveAudioEnabled(newAudioState);
            onAudioEnabledChange(newAudioState);
        }
    };

    const handleAudioToggle = () => {
        const newAudioState = !audioEnabled;
        setAudioEnabled(newAudioState);
        saveAudioEnabled(newAudioState);
        onAudioEnabledChange(newAudioState);
    };

    return (
        <div className={styles.videoFeedToggle}>
            <div className={styles.toggleContainer}>
                <label className={styles.toggleLabel}>Video Feed:</label>
                <div className={styles.feedTypeButtons}>
                    <button
                        className={`${styles.feedTypeButton} ${
                            feedType === "mjpeg" ? styles.active : ""
                        }`}
                        onClick={() => handleFeedTypeChange("mjpeg")}
                    >
                        MJPEG
                    </button>
                    <button
                        className={`${styles.feedTypeButton} ${
                            feedType === "webrtc" ? styles.active : ""
                        }`}
                        onClick={() => handleFeedTypeChange("webrtc")}
                    >
                        WebRTC+Audio
                    </button>
                </div>
            </div>

            {feedType === "webrtc" && (
                <div className={styles.audioControls}>
                    <button
                        className={`${styles.audioButton} ${
                            audioEnabled
                                ? styles.audioEnabled
                                : styles.audioMuted
                        }`}
                        onClick={handleAudioToggle}
                        title={audioEnabled ? "Mute Audio" : "Enable Audio"}
                    >
                        <span className={styles.speakerIcon}>
                            {audioEnabled ? "🔊" : "🔇"}
                        </span>
                        {audioEnabled ? "Audio On" : "Audio Off"}
                    </button>
                </div>
            )}
        </div>
    );
};
