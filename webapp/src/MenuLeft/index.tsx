import { useMemo, useState } from "react";

import { BehaviorMode } from "../util/hubState";
import { VidViewerDialog } from "../VidViewerDialog";
import st from "./MenuLeft.module.css";

interface MenuLeftProps {
    selectedMode: BehaviorMode;

    onModeChange: (mode: BehaviorMode) => void;
}

export const MenuLeft: React.FC<MenuLeftProps> = ({
    selectedMode,
    onModeChange,
}) => {
    const [isRecordedVideosOpen, setIsRecordedVideosOpen] = useState(false);
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
    const handleRecordedVideosClick = () => {
        setIsRecordedVideosOpen(true);
    };

    const handleDialogClose = () => {
        setIsRecordedVideosOpen(false);
    };

    return (
        <div className={st.menuLeft}>
            <h4 className={st.label}>Behavior</h4>
            <div>{modeMenuButtons}</div>
            <div className={st.spacer} />
            <div>
                <a onClick={handleRecordedVideosClick}>Recorded Videos</a>
            </div>
            {isRecordedVideosOpen && (
                <VidViewerDialog
                    isOpen={isRecordedVideosOpen}
                    onClose={handleDialogClose}
                />
            )}
        </div>
    );
};
