import st from "./PlayerControls.module.css";
import Forward10sIcon from "../components/icons/Forward10sIcon";
import Back10sIcon from "../components/icons/Back10sIcon";
import { Button } from "../components/Button";
import PlayIcon from "../components/icons/PlayIcon";
import PauseIcon from "../components/icons/PauseIcon";

interface PlayerControlsProps {
    isPlaying: boolean;

    onBack10s: () => void;
    onForward10s: () => void;
    onPlayPause: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
    isPlaying,
    onBack10s,
    onForward10s,
    onPlayPause,
}) => {
    return (
        <div className={st.playerControls}>
            <Button onClick={onBack10s}>
                <Back10sIcon />
            </Button>

            <Button onClick={onPlayPause}>
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </Button>

            <Button onClick={onForward10s}>
                <Forward10sIcon />
            </Button>
        </div>
    );
};
