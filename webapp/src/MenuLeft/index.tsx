import { useMemo } from "react";

import { BehaviorMode } from "../util/hubState";
import st from "./MenuLeft.module.css";

interface MenuLeftProps {
    selectedMode: BehaviorMode;
    isVideoViewerActive: boolean;
    onModeChange: (mode: BehaviorMode) => void;
    onVideoViewerToggle: () => void;
}

export const MenuLeft: React.FC<MenuLeftProps> = ({
    selectedMode,
    isVideoViewerActive,
    onModeChange,
    onVideoViewerToggle,
}) => {
    const modeMenuButtons = useMemo(
        () =>
            Object.keys(BehaviorMode).map((mode) => {
                const modeValue =
                    BehaviorMode[mode as keyof typeof BehaviorMode];
                return (
                    <a
                        className={
                            selectedMode === modeValue ? st.selected : undefined
                        }
                        onClick={() => onModeChange(modeValue)}
                        key={mode}
                    >
                        {mode}
                    </a>
                );
            }),
        [selectedMode, onModeChange]
    );

    return (
        <div className={st.menuLeft}>
            <h4 className={st.label}>Behavior</h4>
            <div>{modeMenuButtons}</div>
            <div className={st.spacer} />
            <div>
                <a 
                    className={isVideoViewerActive ? st.selected : undefined}
                    onClick={onVideoViewerToggle}
                >
                    Recorded Videos
                </a>
            </div>
        </div>
    );
};
