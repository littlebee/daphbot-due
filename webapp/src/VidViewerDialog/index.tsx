import { act, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { videoHost } from "../util/hubState";

import st from "./index.module.css";
import * as du from "./dateUtils";
import { DateLine } from "./Dateline";
import { RangeSelector } from "./RangeSelector";
import { Viewer } from "./Viewer";

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
        setWindowRange(newWindowRange);
        return filterRange.filterFileNames(allFileNames);
    }, [filterRange, allFileNames]);

    const windowFiles = useMemo(() => {
        if (!filteredFileNames?.length || windowRange === du.NO_FILES) {
            return [];
        }
        const windowFiles = windowRange.filterFileNames(filteredFileNames);
        if (!windowFiles.length) {
            return [];
        }
        const oldestFile = windowFiles[windowFiles.length - 1];
        const firstStart = du.parseFilenameDate(oldestFile);
        // if windowsFiles changes, the playhead position needs to be updated
        setPlayheadPosition(firstStart);

        return windowFiles;
    }, [windowRange, filteredFileNames]);

    const filteredFileNamesIndex: number = useMemo(
        () =>
            filteredFileNames.findIndex((fileName) => {
                const date = du.parseFilenameDate(fileName);
                const match = playheadPosition >= date;
                return match;
            }),
        [filteredFileNames, playheadPosition]
    );

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const adjustWindowRangeToNewPlayhead = useCallback(
        (newPlayheadPosition: Date) => {
            if (
                newPlayheadPosition <= windowRange.start ||
                newPlayheadPosition >= windowRange.end
            ) {
                let newWindowRangeStart = new Date(
                    newPlayheadPosition.getTime() - windowRange.duration / 2
                );
                let newWindowRangeEnd = new Date(
                    newPlayheadPosition.getTime() + windowRange.duration / 2
                );
                if (newWindowRangeStart < filterRange.start) {
                    newWindowRangeStart = filterRange.start;
                    newWindowRangeEnd = new Date(
                        newWindowRangeStart.getTime() + windowRange.duration
                    );
                } else if (newWindowRangeEnd > filterRange.end) {
                    newWindowRangeEnd = filterRange.end;
                    newWindowRangeStart = new Date(
                        newWindowRangeEnd.getTime() - windowRange.duration
                    );
                }
                setWindowRange(
                    new du.DateRange(
                        "windowRange",
                        newWindowRangeStart,
                        newWindowRangeEnd
                    )
                );
            }
        },
        [windowRange, filterRange]
    );

    const handleNextFile = useCallback(() => {
        const newPlayheadPosition =
            filteredFileNamesIndex > 0
                ? du.parseFilenameDate(
                      filteredFileNames[filteredFileNamesIndex - 1]
                  )
                : du.parseFilenameDate(
                      filteredFileNames[filteredFileNames.length - 1]
                  );

        setPlayheadPosition(newPlayheadPosition);
        adjustWindowRangeToNewPlayhead(newPlayheadPosition);
    }, [
        filteredFileNames,
        filteredFileNamesIndex,
        adjustWindowRangeToNewPlayhead,
    ]);

    const handlePrevFile = useCallback(() => {
        const newPlayheadPosition =
            filteredFileNamesIndex >= filteredFileNames.length - 1
                ? du.parseFilenameDate(filteredFileNames[0])
                : du.parseFilenameDate(
                      filteredFileNames[filteredFileNamesIndex + 1]
                  );

        setPlayheadPosition(newPlayheadPosition);
        adjustWindowRangeToNewPlayhead(newPlayheadPosition);
    }, [
        filteredFileNames,
        filteredFileNamesIndex,
        adjustWindowRangeToNewPlayhead,
    ]);

    const handlePlayheadChange = useCallback(
        (newPlayheadPosition: Date) => {
            if (filteredFileNames.length === 0) {
                return;
            }
            const nextFilenamesIndex = filteredFileNames.findIndex(
                (fileName) => {
                    return (
                        newPlayheadPosition >= du.parseFilenameDate(fileName)
                    );
                }
            );
            if (nextFilenamesIndex < 1) {
                return;
            }
            const adjPlayheadPosition = du.parseFilenameDate(
                filteredFileNames[nextFilenamesIndex - 1]
            );
            setPlayheadPosition(adjPlayheadPosition);
            adjustWindowRangeToNewPlayhead(adjPlayheadPosition);
        },
        [filteredFileNames, adjustWindowRangeToNewPlayhead]
    );

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
                            fileNames={filteredFileNames}
                            filterRange={filterRange}
                            playheadPosition={playheadPosition}
                            windowRange={windowRange}
                            onWindowChange={setWindowRange}
                        />
                        <Viewer
                            fileNames={windowFiles}
                            playheadPosition={playheadPosition}
                            windowRange={windowRange}
                            onNextFile={handleNextFile}
                            onPrevFile={handlePrevFile}
                            onPlayheadChange={handlePlayheadChange}
                        />
                    </div>
                </div>

                <button className={st.closeButton} onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
};
