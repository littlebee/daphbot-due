import { useMemo } from "react";

import * as du from "./dateUtils";

import st from "./Timeline.module.css";
import { thumbUrl } from "../util/vidUtils";

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
        const _thumbs = [];
        const stride = Math.max(1, Math.floor(fileNames.length / 100));
        for (let index = 0; index < fileNames.length; index += stride) {
            const fileName = fileNames[index];
            const date = du.parseFilenameDate(fileName);
            const leftPct =
                ((date.getTime() - windowRange.start.getTime()) /
                    windowRange.duration) *
                100;
            const zIndex = index === fileNamesIndex ? 1 : 0;
            _thumbs.push(
                <img
                    key={`thumb-${index}`}
                    className={st.thumb}
                    style={{ left: `${leftPct}%`, zIndex }}
                    src={thumbUrl(fileName)}
                />
            );
        }
        return _thumbs;
    }, [fileNames, fileNamesIndex, windowRange]);

    const playheadPct = useMemo(() => {
        if (!windowRange || !windowRange.duration) return 0;
        const secondsWindowRange = windowRange.duration / 1000;
        const secondsFromStart =
            (playheadPosition.getTime() - windowRange.start.getTime()) / 1000;
        return (secondsFromStart / secondsWindowRange) * 100;
    }, [windowRange, playheadPosition]);

    const handleTimelineClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const pct = (x / rect.width) * 100;
        const newPlayheadPosition = new Date(
            windowRange.start.getTime() + (windowRange.duration * pct) / 100
        );
        onPlayheadChange(newPlayheadPosition);
    };

    return (
        <div className={st.outerContainer}>
            <div className={st.timeline} onClick={handleTimelineClick}>
                {thumbs}
            </div>
            <div className={st.playhead} style={{ left: `${playheadPct}%` }} />
            <div className={st.rangeDates}>
                <div className={st.rangeStart}>
                    {windowRange.start.toLocaleString()}
                </div>
                <div className={st.rangeEnd}>
                    {windowRange.end.toLocaleString()}
                </div>
            </div>
        </div>
    );
};
