import { useState } from "react";

import {
    HubStateProvider,
    sendHubStateUpdate,
    ObjectsOverlay,
    VideoFeed,
    WebRTCVideoClient,
    PanTilt,
} from "basic_bot_react";
import "basic_bot_react/style.css";

import { BehaviorMode } from "./types/daphbotHubState";
import { useDaphbotHubState } from "./hooks/useDaphbotHubState";

import { Header } from "./Header";
import { MenuLeft } from "./MenuLeft";
import { HubStateDialog } from "./HubStateDialog";
import { VideoFeedToggle } from "./components/VideoFeedToggle";
import { VideoViewer } from "./VideoViewer";
import { WebRTCStream } from "./components/WebRTCStream";
import { VideoFeedType } from "./util/videoPreferences";

import st from "./App.module.css";

interface AppProps {
    hubPort?: number;
    autoReconnect?: boolean;
}

function AppContent() {
    const hubState = useDaphbotHubState();
    const [isHubStateDialogOpen, setIsHubStateDialogOpen] = useState(false);
    const [isVideoViewerActive, setIsVideoViewerActive] = useState(false);
    const [videoFeedType, setVideoFeedType] = useState<VideoFeedType>("mjpeg");
    const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

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
                isHubStateDialogOpen={isHubStateDialogOpen}
                onHubStateDialogOpen={() => setIsHubStateDialogOpen(true)}
            />
            <div className="wrap">
                <div className="left-frame" id="gap">
                    <div className="sidebar-buttons">
                        <MenuLeft
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
                                    <ObjectsOverlay />
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
                                    <PanTilt className={st.customPanTilt} />
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
            <HubStateDialog
                isOpen={isHubStateDialogOpen}
                onClose={() => setIsHubStateDialogOpen(false)}
            />
            <WebRTCStream isActive={!isVideoViewerActive} />
        </div>
    );
}

function App({ hubPort, autoReconnect }: AppProps) {
    return (
        <HubStateProvider port={hubPort} autoReconnect={autoReconnect}>
            <AppContent />
        </HubStateProvider>
    );
}

export default App;
