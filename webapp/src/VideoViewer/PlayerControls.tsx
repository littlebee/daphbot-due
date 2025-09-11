import st from "./PlayerControls.module.css";
import ForwardIcon from "../components/icons/ForwardIcon";
import BackIcon from "../components/icons/BackIcon";
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
                <BackIcon />
            </Button>

            <Button onClick={onPlayPause}>
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </Button>

            <Button onClick={onForward10s}>
                <ForwardIcon />
            </Button>
        </div>
    );
};
