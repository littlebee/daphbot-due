import { useState, useEffect } from "react";

import {
    DEFAULT_HUB_STATE,
    connectToHub,
    addHubStateUpdatedListener,
    IHubState,
    BehaviorMode,
} from "./util/hubState";
import { sendHubStateUpdate } from "./util/hubMessages";

import { Header } from "./Header";
import { MenuLeft } from "./MenuLeft";
import { HubStateDialog } from "./HubStateDialog";
import { ObjectsOverlay } from "./components/ObjectsOverlay";
import { VideoFeed } from "./components/VideoFeed";
import { PanTilt } from "./components/PanTilt";

interface AppProps {
    hubPort?: number;
    autoReconnect?: boolean;
}

function App({ hubPort, autoReconnect }: AppProps) {
    const [hubState, setHubState] = useState<IHubState>(DEFAULT_HUB_STATE);
    const [isHubStateDialogOpen, setIsHubStateDialogOpen] = useState(false);

    useEffect(() => {
        addHubStateUpdatedListener(handleHubStateUpdated);
        connectToHub({ port: hubPort, autoReconnect });
    }, [hubPort, autoReconnect]);

    const handleHubStateUpdated = (newState: IHubState) => {
        setHubState({ ...newState });
    };

    const handleModeChange = (mode: BehaviorMode) => {
        sendHubStateUpdate({ daphbot_mode: mode });
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
                        {hubState.hubConnStatus === "online" && (
                            <MenuLeft
                                selectedMode={hubState.daphbot_mode}
                                onModeChange={handleModeChange}
                            />
                        )}
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
                        <div className="video-container">
                            <ObjectsOverlay
                                recogObjects={hubState.recognition}
                            />
                            <VideoFeed />
                        </div>
                        {hubState.daphbot_mode === BehaviorMode.Manual && (
                            <PanTilt
                                servoConfig={hubState.servo_config}
                                servoAngles={hubState.servo_angles}
                                servoActualAngles={hubState.servo_actual_angles}
                            />
                        )}
                    </div>
                </div>
            </div>
            <HubStateDialog
                hubState={hubState}
                isOpen={isHubStateDialogOpen}
                onClose={() => setIsHubStateDialogOpen(false)}
            />
        </div>
    );
}

export default App;
