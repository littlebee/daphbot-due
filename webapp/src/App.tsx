import { useState, useEffect } from "react";

import {
    connectToHub,
    addHubStateUpdatedListener,
    sendHubStateUpdate,
    ObjectsOverlay,
    VideoFeed,
    WebRTCVideoClient,
    PanTilt,
} from "basic_bot_react";

import {
    IDaphbotHubState,
    BehaviorMode,
    DAPHBOT_DEFAULT_HUB_STATE,
} from "./types/daphbotHubState";

import { Header } from "./Header";
import { MenuLeft } from "./MenuLeft";
import { HubStateDialog } from "./HubStateDialog";
import { VideoFeedToggle } from "./components/VideoFeedToggle";
import { VideoViewer } from "./VideoViewer";
import { WebRTCStream } from "./components/WebRTCStream";
import { VideoFeedType } from "./util/videoPreferences";

interface AppProps {
    hubPort?: number;
    autoReconnect?: boolean;
}

function App({ hubPort, autoReconnect }: AppProps) {
    const [hubState, setHubState] = useState<IDaphbotHubState>(
        DAPHBOT_DEFAULT_HUB_STATE
    );
    const [isHubStateDialogOpen, setIsHubStateDialogOpen] = useState(false);
    const [isVideoViewerActive, setIsVideoViewerActive] = useState(false);
    const [videoFeedType, setVideoFeedType] = useState<VideoFeedType>("mjpeg");
    const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

    useEffect(() => {
        addHubStateUpdatedListener(handleHubStateUpdated);
        connectToHub({ port: hubPort, autoReconnect });
    }, [hubPort, autoReconnect]);

    const handleHubStateUpdated = (newState: object) => {
        setHubState({ ...(newState as IDaphbotHubState) });
    };

    const handleModeChange = (mode: BehaviorMode) => {
        sendHubStateUpdate({ daphbot_mode: mode });
    };

    const handleVideoViewerToggle = () => {
        setIsVideoViewerActive(!isVideoViewerActive);
    };

    const handleFeedTypeChange = (feedType: VideoFeedType) => {
        setVideoFeedType(feedType);
    };

    const handleAudioEnabledChange = (enabled: boolean) => {
        setAudioEnabled(enabled);
    };

    return (
        <div>
            <Header
                hubState={hubState}
                isHubStateDialogOpen={isHubStateDialogOpen}
                onHubStateDialogOpen={() => setIsHubStateDialogOpen(true)}
            />
            <div className="wrap">
                <div className="left-frame" id="gap">
                    <div className="sidebar-buttons">
                        <MenuLeft
                            selectedMode={hubState.daphbot_mode}
                            onModeChange={handleModeChange}
                            isVideoViewerActive={isVideoViewerActive}
                            onVideoViewerToggle={handleVideoViewerToggle}
                        />
                    </div>
                </div>
                <div className="right-frame">
                    <div className="bar-panel">
                        <div className="bar-6"></div>
                        <div className="bar-7"></div>
                        <div className="bar-8"></div>
                        <div className="bar-9">
                            <div className="bar-9-inside"></div>
                        </div>
                        <div className="bar-10"></div>
                    </div>
                    <div className="corner-bg">
                        <div className="corner"></div>
                    </div>
                    <div className="content">
                        {isVideoViewerActive ? (
                            <VideoViewer />
                        ) : (
                            <>
                                <VideoFeedToggle
                                    onFeedTypeChange={handleFeedTypeChange}
                                    onAudioEnabledChange={
                                        handleAudioEnabledChange
                                    }
                                />
                                <div className="video-container">
                                    <ObjectsOverlay
                                        recogObjects={hubState.recognition}
                                    />
                                    <VideoFeed
                                        isActive={videoFeedType === "mjpeg"}
                                    />
                                    <WebRTCVideoClient
                                        isActive={videoFeedType === "webrtc"}
                                        audioEnabled={audioEnabled}
                                    />
                                </div>
                                {hubState.daphbot_mode ===
                                    BehaviorMode.Manual && (
                                    <PanTilt
                                        servoConfig={hubState.servo_config}
                                        servoAngles={hubState.servo_angles}
                                        servoActualAngles={
                                            hubState.servo_actual_angles
                                        }
                                    />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
            <HubStateDialog
                hubState={hubState}
                isOpen={isHubStateDialogOpen}
                onClose={() => setIsHubStateDialogOpen(false)}
            />
            <WebRTCStream
                isActive={!isVideoViewerActive}
                mode={hubState.daphbot_mode}
            />
        </div>
    );
}

export default App;
