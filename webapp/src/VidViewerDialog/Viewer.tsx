import { useMemo, useRef } from "react";

import * as du from "./dateUtils";
import { vidUrl } from "../util/vidUtils";

import st from "./Viewer.module.css";
import { Timeline } from "./Timeline";
import { PlayerControls } from "./PlayerControls";

interface ViewerProps {
    // a string array of base file names retrieved from the basic_bot vision service
    // filtered to selected filterRange
    fileNames: string[];
    // current position of the playhead in seconds from the start of the window
    playheadPosition: Date;
    // date range of the viewer window
    windowRange: du.DateRange;

    onNextFile: () => void;
    onPrevFile: () => void;
    onPlayheadChange: (newPlayheadPosition: Date) => void;
}

export const Viewer: React.FC<ViewerProps> = ({
    fileNames,
    playheadPosition,
    windowRange,
    onNextFile,
    onPrevFile,
    onPlayheadChange,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileNamesIndex: number = useMemo(
        () =>
            fileNames.findIndex((fileName) => {
                const date = du.parseFilenameDate(fileName);
                const match = playheadPosition >= date;
                return match;
            }),
        [fileNames, playheadPosition]
    );

    const videoUrl = useMemo(
        () => vidUrl(fileNames[fileNamesIndex]),
        [fileNames, fileNamesIndex]
    );

    const handlePlayPause = () => {
        try {
            if (videoRef.current) {
                if (videoRef.current.paused) {
                    videoRef.current.play();
                } else {
                    videoRef.current.pause();
                }
            }
        } catch (e) {
            console.error("Error handlePlayPause", e);
        }
    };

    return (
        <div className={st.viewer}>
            <div className="playheadDateTime">
                {playheadPosition.toLocaleString()}
            </div>
            <video
                ref={videoRef}
                className={st.video}
                controls
                autoPlay
                src={videoUrl}
                onEnded={onNextFile}
            />
            <PlayerControls
                isPlaying={!videoRef.current?.paused}
                onBack10s={onPrevFile}
                onForward10s={onNextFile}
                onPlayPause={handlePlayPause}
            />
            <Timeline
                fileNames={fileNames}
                fileNamesIndex={fileNamesIndex}
                windowRange={windowRange}
                playheadPosition={playheadPosition}
                onPlayheadChange={onPlayheadChange}
            />
        </div>
    );
};
