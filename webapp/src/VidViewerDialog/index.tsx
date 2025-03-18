import { useEffect, useMemo, useRef, useState } from "react";
import { videoHost } from "../util/hubState";

import st from "./index.module.css";
import * as du from "./dateUtils";
import { DateLine } from "./Dateline";
import { RangeSelector } from "./RangeSelector";

interface VidViewerDialogProps {
    isOpen: boolean;
    onClose: () => void;
}
export const VidViewerDialog: React.FC<VidViewerDialogProps> = ({
    isOpen,
    onClose,
}) => {
    const validRanges = useRef<du.DateRange[]>([]);

    const [allFileNames, setAllFileNames] = useState<Array<string>>([]);
    const [filterRange, setFilterRange] = useState<du.DateRange>(du.NO_FILES);
    const [windowRange, setWindowRange] = useState<du.DateRange>(du.NO_FILES);
    const [playheadPosition, setPlayheadPosition] = useState<Date>(new Date());

    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        fetch(`http://${videoHost}/recorded_video`)
            .then((res) => res.json())
            .then((fileNames) => {
                setAllFileNames(fileNames);
                if (!fileNames.length) {
                    setFilterRange(du.NO_FILES);
                    return;
                }
                validRanges.current = du.validRanges(fileNames);
                // set to the most recent range which is also the most restrictive
                setFilterRange(validRanges.current[0]);
            });
    }, [isOpen]);

    const filteredFileNames = useMemo(() => {
        if (!allFileNames.length || filterRange === du.NO_FILES) {
            return [];
        }
        const filteredFileNames = filterRange.filterFileNames(allFileNames);
        if (!filteredFileNames.length) {
            return [];
        }
        const oldestFile = filteredFileNames[filteredFileNames.length - 1];
        const windowRangeStart = du.parseFilenameDate(oldestFile);
        let windowRangeEnd = new Date(
            // use 1/10 of the filter range for the window duration
            windowRangeStart.getTime() + filterRange.duration / 6
        );
        if (windowRangeEnd > filterRange.end) {
            windowRangeEnd = filterRange.end;
        }
        const newWindowRange = new du.DateRange(
            "windowRange",
            windowRangeStart,
            windowRangeEnd
        );
        console.log("setting window range", { newWindowRange, oldestFile });
        setWindowRange(newWindowRange);
        return filterRange.filterFileNames(allFileNames);
    }, [filterRange, allFileNames]);

    const _windowFiles = useMemo(() => {
        if (!filteredFileNames?.length || windowRange === du.NO_FILES) {
            return [];
        }
        const windowFiles = windowRange.filterFileNames(filteredFileNames);
        if (!windowFiles.length) {
            return [];
        }
        const oldestFile = windowFiles[windowFiles.length - 1];
        const firstStart = du.parseFilenameDate(oldestFile);
        console.log("setting playhead position", firstStart);
        // if windowsFiles changes, the playhead position needs to be updated
        setPlayheadPosition(firstStart);

        return windowFiles;
    }, [windowRange, filteredFileNames]);

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className={st.backdrop} onClick={handleBackdropClick}>
            <div className={st.dialog}>
                <h4 className={st.dialogTitle}>Recorded Videos</h4>
                <div className={st.dialogContent}>
                    <div className={st.filterAndSearch}>
                        <RangeSelector
                            validRanges={validRanges.current}
                            range={filterRange}
                            onRangeChange={(newRange) =>
                                setFilterRange(newRange)
                            }
                        />
                    </div>

                    <div className={st.listAndPlayer}>
                        <DateLine
                            filteredFileNames={filteredFileNames}
                            filterRange={filterRange}
                            playheadPosition={playheadPosition}
                            windowRange={windowRange}
                            onWindowChange={setWindowRange}
                        />
                        <div className={st.videoContainer}>
                            {(selectedVideo && (
                                <video
                                    controls
                                    autoPlay
                                    src={`http://${videoHost}/recorded_video/${selectedVideo}.mp4`}
                                />
                            )) || <div>Select a video to play</div>}
                        </div>
                    </div>
                </div>

                <button className={st.closeButton} onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
};
