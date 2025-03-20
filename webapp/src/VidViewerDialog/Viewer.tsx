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

    onPlayheadChange: (newPlayheadPosition: Date) => void;
}

export const Viewer: React.FC<ViewerProps> = ({
    fileNames,
    playheadPosition,
    windowRange,
    onPlayheadChange,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const fileNamesIndex: number = useMemo(
        () =>
            fileNames.findIndex((fileName, index) => {
                const date = du.parseFilenameDate(fileName);
                const match = playheadPosition >= date;
                console.log("match", { index, match, date, playheadPosition });
                return match;
            }),
        [fileNames, playheadPosition]
    );

    const videoUrl = useMemo(
        () => vidUrl(fileNames[fileNamesIndex]),
        [fileNames, fileNamesIndex]
    );

    const handleVideoEnded = () => {
        if (fileNamesIndex > 0) {
            onPlayheadChange(
                du.parseFilenameDate(fileNames[fileNamesIndex - 1])
            );
        } else {
            onPlayheadChange(
                du.parseFilenameDate(fileNames[fileNames.length - 1])
            );
        }
    };

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

    const handleForward = () => {
        if (fileNamesIndex > 0) {
            onPlayheadChange(
                du.parseFilenameDate(fileNames[fileNamesIndex - 1])
            );
        } else {
            onPlayheadChange(
                du.parseFilenameDate(fileNames[fileNames.length - 1])
            );
        }
    };

    const handleBack = () => {
        if (fileNamesIndex < fileNames.length - 1) {
            onPlayheadChange(
                du.parseFilenameDate(fileNames[fileNamesIndex + 1])
            );
        } else {
            onPlayheadChange(du.parseFilenameDate(fileNames[0]));
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
                onEnded={handleVideoEnded}
            />
            <PlayerControls
                isPlaying={!videoRef.current?.paused}
                onBack10s={handleBack}
                onForward10s={handleForward}
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
