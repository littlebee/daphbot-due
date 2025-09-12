import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    const datelineRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState<Date | null>(null);
    const [dragEnd, setDragEnd] = useState<Date | null>(null);
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
                    data-testid="activity-range"
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

    const getDateFromY = useCallback((y: number): Date => {
        if (!datelineRef.current) return filterRange.start;
        const rect = datelineRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, y / rect.height));
        const msFromTop = pct * filterRange.duration;
        return new Date(filterRange.start.getTime() + msFromTop);
    }, [filterRange]);

    const [dragSelectionTopPct, dragSelectionHeightPct] = useMemo(() => {
        if (!isDragging || !dragStart || !dragEnd) return [0, 0];
        
        const startTime = Math.min(dragStart.getTime(), dragEnd.getTime());
        const endTime = Math.max(dragStart.getTime(), dragEnd.getTime());
        
        const topTime = (startTime - filterRange.start.getTime()) / filterRange.duration;
        const bottomTime = (endTime - filterRange.start.getTime()) / filterRange.duration;
        
        const topPct = topTime * 100;
        const heightPct = (bottomTime - topTime) * 100;
        
        return [topPct, heightPct];
    }, [isDragging, dragStart, dragEnd, filterRange]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const startDate = getDateFromY(y);
        
        setIsDragging(true);
        setDragStart(startDate);
        setDragEnd(startDate);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !datelineRef.current) return;
        
        const rect = datelineRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const currentDate = getDateFromY(y);
        
        setDragEnd(currentDate);
    }, [isDragging, getDateFromY]);

    const handleMouseUp = useCallback(() => {
        if (!isDragging || !dragStart || !dragEnd) return;
        
        const startTime = Math.min(dragStart.getTime(), dragEnd.getTime());
        const endTime = Math.max(dragStart.getTime(), dragEnd.getTime());
        
        // If the drag distance is very small, treat it as a single click
        const dragDuration = endTime - startTime;
        const minDragDuration = 5 * 60 * 1000; // 5 minutes minimum
        
        if (dragDuration < minDragDuration) {
            // Single click behavior: move window to clicked position
            const newStart = new Date(startTime);
            const newEnd = new Date(newStart.getTime() + windowRange.duration);
            onWindowChange(new du.DateRange("window", newStart, newEnd));
        } else {
            // Drag behavior: set window to selected range
            const newStart = new Date(startTime);
            const newEnd = new Date(endTime);
            onWindowChange(new du.DateRange("window", newStart, newEnd));
        }
        
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
    }, [isDragging, dragStart, dragEnd, windowRange.duration, onWindowChange]);

    useEffect(() => {
        if (!isDragging) return;
        
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
        <div 
            ref={datelineRef}
            className={st.dateline} 
            onMouseDown={handleMouseDown}
        >
            <RangeDate date={filterRange.start} />
            <div className={st.innerContainer}>
                <div
                    className={st.window}
                    style={{
                        top: `${windowTopPct}%`,
                        height: `${windowHeightPct}%`,
                    }}
                />
                {isDragging && (
                    <div
                        className={st.dragSelection}
                        style={{
                            top: `${dragSelectionTopPct}%`,
                            height: `${dragSelectionHeightPct}%`,
                        }}
                    />
                )}
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
