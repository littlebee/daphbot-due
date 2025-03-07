import { BehaviorMode } from "./util/hubState";

import st from "./MenuLeft.module.css";

interface MenuLeftProps {
    selectedMode: BehaviorMode;

    onModeChange: (mode: BehaviorMode) => void;
}

export const MenuLeft: React.FC<MenuLeftProps> = ({
    selectedMode,
    onModeChange,
}) => {
    const modeMenuButtons = Object.keys(BehaviorMode).map((mode) => {
        const modeValue = BehaviorMode[mode as keyof typeof BehaviorMode];
        return (
            <a
                className={selectedMode === modeValue ? st.selected : undefined}
                onClick={() => onModeChange(modeValue)}
                key={mode}
            >
                {mode}
            </a>
        );
    });

    return (
        <div className={st.menuLeft}>
            <h4 className={st.label}>Behavior</h4>
            <div>{modeMenuButtons}</div>
        </div>
    );
};
