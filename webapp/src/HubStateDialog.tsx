import React, { useState } from "react";

import { getStateFromCentralHub } from "basic_bot_react";

import { classnames } from "./util/classNames";
import { Button } from "./components/Button";
import { useDaphbotHubState } from "./hooks/useDaphbotHubState";
import st from "./HubStateDialog.module.css";

const LOCAL_STATE = 0;
const REMOTE_STATE = 1;

interface HubStateDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HubStateDialog({ isOpen, onClose }: HubStateDialogProps) {
    const hubState = useDaphbotHubState();
    const [whichState, setWhichState] = useState(LOCAL_STATE);
    const [remoteState, setRemoteState] = useState({});

    const closedClass = !isOpen ? st.closed : null;

    async function loadRemoteState() {
        setRemoteState(await getStateFromCentralHub());
    }

    function handleStateChange(newState: number) {
        setWhichState(newState);

        if (newState === REMOTE_STATE) {
            loadRemoteState();
        }
    }

    function handleDialogClick(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
    }

    const displayedState = whichState === REMOTE_STATE ? remoteState : hubState;

    return (
        <div
            className={classnames(st.dialogBackdrop, closedClass)}
            onClick={onClose}
        >
            <div
                className={classnames(st.dialog, closedClass)}
                onClick={handleDialogClick}
            >
                <div className={classnames(st.dialogContent, closedClass)}>
                    {isOpen && (
                        <div className={classnames(st.dialogViewport)}>
                            <div
                                className={classnames(
                                    "buttons",
                                    st.videoSelector
                                )}
                            >
                                <Button
                                    isSelected={whichState === LOCAL_STATE}
                                    onClick={() =>
                                        handleStateChange(LOCAL_STATE)
                                    }
                                >
                                    local hub state
                                </Button>
                                <Button
                                    isSelected={whichState === REMOTE_STATE}
                                    onClick={() =>
                                        handleStateChange(REMOTE_STATE)
                                    }
                                >
                                    remote hub state
                                </Button>
                            </div>
                            <pre>
                                <code className={st.dialogCode}>
                                    {JSON.stringify(displayedState, null, 2)}
                                </code>
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
