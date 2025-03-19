import { useMemo } from "react";
import * as du from "./dateUtils";

import st from "./DateLine.module.css";

export const DEFAULT_WINDOW_DURATION = 30; // minutes

interface DateLineProps {
    // a string array of base file names retrieved from the basic_bot vision service
    // filtered to selected filterRange
    fileNames: string[];
    filterRange: du.DateRange;

    // current position of the playhead in seconds from the start of the window
    playheadPosition: Date;
    // date range of the viewer window
    windowRange: du.DateRange;

    onWindowChange: (windowRange: du.DateRange) => void;
}

export const DateLine: React.FC<DateLineProps> = ({
    fileNames,
    filterRange,
    playheadPosition,
    windowRange,
    onWindowChange,
}) => {
    const activityMarkers = useMemo(() => {
        if (!fileNames.length || filterRange === du.NO_FILES) return null;
        const secondsFilterRange = filterRange.duration / 1000;
        const ranges = du.contiguousRanges(fileNames);
        const markers = ranges.map((range, index) => {
            const secondsFromTop =
                (range.start.getTime() - filterRange.start.getTime()) / 1000;
            const topPct = (secondsFromTop / secondsFilterRange) * 100;
            const heightPct = (range.duration / filterRange.duration) * 100;
            return (
                <div
                    key={`AM-${index}`}
                    data-rangeStart={range.start.toString()}
                    className={st.activityMarker}
                    style={{ top: `${topPct}%`, height: `${heightPct}%` }}
                />
            );
        });

        return markers;
    }, [fileNames, filterRange]);

    const playheadTopPct = useMemo(() => {
        if (!filterRange || !filterRange.duration) return 0;
        const secondsFilterRange = filterRange.duration / 1000;
        const secondsFromTop =
            (playheadPosition.getTime() - filterRange.start.getTime()) / 1000;
        return (secondsFromTop / secondsFilterRange) * 100;
    }, [filterRange, playheadPosition]);

    const [windowTopPct, windowHeightPct] = useMemo(() => {
        if (!filterRange || !filterRange.duration) return [0, 0];
        const secondsFilterRange = filterRange.duration / 1000;

        const secondsFromTop =
            (windowRange.start.getTime() - filterRange.start.getTime()) / 1000;

        const topPct = (secondsFromTop / secondsFilterRange) * 100;
        const heightPct =
            (windowRange.duration / 1000 / secondsFilterRange) * 100;
        return [topPct, heightPct];
    }, [filterRange, windowRange]);

    const handleClick = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const pct = y / rect.height;
        const msFromTop = pct * filterRange.duration;
        const newStart = new Date(filterRange.start.getTime() + msFromTop);
        const newEnd = new Date(newStart.getTime() + windowRange.duration);
        console.log("clicked", {
            rect,
            y,
            pct,
            msFromTop,
            newStart,
            newEnd,
        });
        onWindowChange(new du.DateRange("window", newStart, newEnd));
    };

    return (
        <div className={st.dateline} onClick={handleClick}>
            <div className={st.rangeDates}>
                <RangeDate date={filterRange.start} />
                <RangeDate date={filterRange.end} />
            </div>
            <div
                className={st.window}
                style={{
                    top: `${windowTopPct}%`,
                    height: `${windowHeightPct}%`,
                }}
            />
            <div className={st.lineBackground}>{activityMarkers}</div>
            <div
                className={st.playhead}
                style={{ top: `${playheadTopPct}%` }}
            />
        </div>
    );
};

interface RangeDateProps {
    date: Date;
}
const RangeDate: React.FC<RangeDateProps> = ({ date }) => {
    const dateDivs = useMemo(() => {
        const dateStr = date.toLocaleString();
        const dateParts = dateStr
            .split(", ")
            .map((part, index) => <div key={index}>{part}</div>);
        return dateParts;
    }, [date]);

    return <div className={st.rangeDate}>{dateDivs}</div>;
};
