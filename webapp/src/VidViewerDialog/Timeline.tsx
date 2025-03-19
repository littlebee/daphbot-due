import { useMemo } from "react";

import * as du from "./dateUtils";

import st from "./Timeline.module.css";
import { thumbUrl } from "../util/vidUtils";
import { Z } from "vitest/dist/chunks/reporters.D7Jzd9GS.js";

interface TimelineProps {
    // a string array of base file names retrieved from the basic_bot vision service
    // filtered to selected filterRange and a selected windowRange
    fileNames: string[];
    // index of the fileNames array that the playhead is currently over
    fileNamesIndex: number;
    // the current window range
    windowRange: du.DateRange;

    // current position of the playhead in seconds from the start of the window
    playheadPosition: Date;

    onPlayheadChange: (newPlayheadPosition: Date) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
    fileNames,
    fileNamesIndex,
    windowRange,
    playheadPosition,
    onPlayheadChange,
}) => {
    const thumbs = useMemo(() => {
        if (!fileNames.length) return null;
        return fileNames.map((fileName, index) => {
            const date = du.parseFilenameDate(fileName);
            const leftPct =
                ((date.getTime() - windowRange.start.getTime()) /
                    windowRange.duration) *
                100;
            const zIndex = index === fileNamesIndex ? 1 : 0;
            return (
                <img
                    key={`thumb-${index}`}
                    className={st.thumb}
                    style={{ left: `${leftPct}%`, zIndex }}
                    src={thumbUrl(fileName)}
                />
            );
        });
    }, [fileNames, fileNamesIndex, windowRange]);

    return <div className={st.timeline}>{thumbs}</div>;
};
