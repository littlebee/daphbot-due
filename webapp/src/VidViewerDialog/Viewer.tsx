import { useMemo } from "react";

import * as du from "./dateUtils";
import { vidUrl } from "../util/vidUtils";

import st from "./Viewer.module.css";
import { Timeline } from "./Timeline";

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
    const fileNamesIndex: number = useMemo(
        () =>
            fileNames.findIndex((fileName) => {
                const date = du.parseFilenameDate(fileName);
                return (
                    date >= playheadPosition &&
                    playheadPosition.getTime() <
                        date.getTime() + du.RECORDING_DURATION
                );
            }),
        [fileNames, playheadPosition]
    );

    return (
        <div className={st.viewer}>
            <video
                className={st.video}
                controls
                autoPlay
                src={vidUrl(fileNames[fileNamesIndex])}
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
