import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import * as du from "./dateUtils";

import st from "./Timeline.module.css";
import { largeThumbUrl, thumbUrl } from "../util/vidUtils";
import { AnyTouchEvent, getClientXY } from "./touchUtils";

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
    const timelineRef = useRef<HTMLDivElement>(null);
    // The timeline was clicked and the mouse/finger is still down
    const [isScrubbing, setIsScrubbing] = useState(false);
    // The date that the playhead is currently over or null if the playhead
    // is not over a date within the duration of a fileNames member
    const [scrubDate, setScrubDate] = useState<Date | null>(null);

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
            const zIndex =
                index === fileNamesIndex
                    ? 2
                    : Math.abs(index - fileNamesIndex) === 1
                    ? 1
                    : 0;
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
        console.log("Timeline got playheadPosition", playheadPosition);
        if (!windowRange || !windowRange.duration) return 0;
        const secondsWindowRange = windowRange.duration / 1000;
        const secondsFromStart =
            (playheadPosition.getTime() - windowRange.start.getTime()) / 1000;
        return (secondsFromStart / secondsWindowRange) * 100;
    }, [windowRange, playheadPosition]);

    const getDateFromEventPoint = useCallback(
        (event: AnyTouchEvent, windowRange: du.DateRange): Date => {
            if (!timelineRef.current) return windowRange.start;
            const clientX = getClientXY(event)[0];
            const rect = timelineRef.current.getBoundingClientRect();

            if (clientX < rect.left) return windowRange.start;
            if (clientX > rect.right) return windowRange.end;

            const xf = (clientX - rect.left) / rect.width;
            return new Date(
                windowRange.start.getTime() + windowRange.duration * xf
            );
        },
        [windowRange] // eslint-disable-line react-hooks/exhaustive-deps
    );

    const getScrubDate = useCallback(
        (event: AnyTouchEvent) => {
            const eDate = getDateFromEventPoint(event, windowRange);
            const nearestFile = du.findNearestFileForDate(fileNames, eDate);
            const scrubDate = nearestFile
                ? du.parseFilenameDate(nearestFile)
                : null;
            return scrubDate;
        },
        [windowRange, fileNames, getDateFromEventPoint]
    );

    const handleMouseDown = (event: AnyTouchEvent) => {
        event.preventDefault();
        setIsScrubbing(true);

        const scrubDate = getScrubDate(event);
        setScrubDate(scrubDate);

        // not sure yet if we want to call onPlayheadChange here
        // if (scrubDate) onPlayheadChange(scrubDate);
    };

    // This function is called from docuement mousemove and touchmove events
    // which is why event type is MouseEvent | TouchEvent and not
    // React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
    const handleMouseMove = useCallback(
        (event: AnyTouchEvent) => {
            if (!isScrubbing || !timelineRef.current) return;
            setScrubDate(getScrubDate(event));
        },
        [isScrubbing, getScrubDate]
    );

    const handleMouseUp = useCallback(() => {
        if (!isScrubbing) return;
        setIsScrubbing(false);
        if (scrubDate) {
            console.log("Timeline setting playhead to", scrubDate);
            onPlayheadChange(scrubDate);
        }
        setScrubDate(null);
    }, [isScrubbing, onPlayheadChange, scrubDate]);

    useEffect(() => {
        // these are on the document so that we track the mouse even if it
        // leaves the timeline element
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("touchmove", handleMouseMove);
        document.addEventListener("touchend", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("touchmove", handleMouseMove);
            document.removeEventListener("touchend", handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const scrubberFile: string | null = useMemo(() => {
        if (!scrubDate) return null;
        const index = du.findNearestFileIndexForDate(fileNames, scrubDate);
        return index === -1 ? null : fileNames[index];
    }, [fileNames, scrubDate]);

    const previewStyle = useMemo(() => {
        if (!scrubDate || !timelineRef.current) return {};
        const leftPct =
            ((scrubDate.getTime() - windowRange.start.getTime()) /
                windowRange.duration) *
            100;
        const offset = leftPct > 60 ? -300 : -150;
        return { left: `calc(${leftPct}% + ${offset}px)` };
    }, [scrubDate, windowRange]);

    return (
        <div className={st.outerContainer}>
            <div
                ref={timelineRef}
                className={st.timeline}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
            >
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
            {scrubberFile !== null && (
                <div className={st.scrubberPreview} style={previewStyle}>
                    <div className={st.scrubberDate}>
                        {scrubDate?.toLocaleString()}
                    </div>
                    <div className={st.scrubberThumb}>
                        <img src={largeThumbUrl(scrubberFile)} />
                    </div>
                </div>
            )}
        </div>
    );
};
