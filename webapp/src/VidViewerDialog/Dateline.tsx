import { useMemo } from "react";
import * as du from "../util/dateUtils";
import { DateDivision, findDateDivisions } from "../util/dateDivisions";

import st from "./Dateline.module.css";

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
                    data-rangestart={range.start.toString()}
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

    const dateDivisions = useMemo(() => {
        // for almost all ranges, we want to show 6 divisions which works
        // well for months, hours and minutes, but in the case of
        // "Last 7 days" we want to show 7 divisions to avoid chopping
        const numDivisions = filterRange.name === "Last 7 days" ? 7 : 6;
        const divisions = findDateDivisions(filterRange, numDivisions);
        return divisions;
    }, [filterRange]);

    const handleClick = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const pct = y / rect.height;
        const msFromTop = pct * filterRange.duration;
        const newStart = new Date(filterRange.start.getTime() + msFromTop);
        const newEnd = new Date(newStart.getTime() + windowRange.duration);
        onWindowChange(new du.DateRange("window", newStart, newEnd));
    };

    return (
        <div className={st.dateline} onClick={handleClick}>
            <RangeDate date={filterRange.start} />
            <div className={st.innerContainer}>
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
                {dateDivisions.map((dateDivision, index) => (
                    <DivisionDate
                        key={`DD-${index}`}
                        dateDivision={dateDivision}
                        filterRange={filterRange}
                    />
                ))}
            </div>
            <RangeDate date={filterRange.end} />
        </div>
    );
};

interface RangeDateProps {
    date: Date;
}
const RangeDate: React.FC<RangeDateProps> = ({ date }) => {
    const dateStr = date.toLocaleString();
    return <div className={st.rangeDate}>{dateStr}</div>;
};

interface DivisionDateProps {
    dateDivision: DateDivision;
    filterRange: du.DateRange;
}
const DivisionDate: React.FC<DivisionDateProps> = ({
    dateDivision,
    filterRange,
}) => {
    const topPct = useMemo(() => {
        if (!dateDivision) return 0;
        return (
            ((dateDivision.date.getTime() - filterRange.start.getTime()) /
                filterRange.duration) *
            100
        );
    }, [dateDivision, filterRange]);

    const style = {
        // 20px is the height of the date division label
        top: `${topPct}%`,
    };
    return (
        <div style={style} className={st.divisionDate}>
            {dateDivision.label}
        </div>
    );
};
