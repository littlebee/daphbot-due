import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { videoHost } from "../util/hubState";
import * as videoPrefs from "../util/videoPreferences";

import st from "./index.module.css";
import * as du from "../util/dateUtils";
import { DateLine } from "./Dateline";
import { RangeSelector } from "./RangeSelector";
import { Viewer } from "./Viewer";

export const VideoViewer: React.FC = () => {
    const validRanges = useRef<du.DateRange[]>([]);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [allFileNames, setAllFileNames] = useState<Array<string>>([]);
    const [filterRange, setFilterRange] = useState<du.DateRange>(du.NO_FILES);
    const [windowRange, setWindowRange] = useState<du.DateRange>(du.NO_FILES);
    const [playheadPosition, setPlayheadPosition] = useState<Date>(new Date());
    const [preferencesLoaded, setPreferencesLoaded] = useState(false);

    useEffect(() => {
        fetch(`http://${videoHost}/recorded_video`)
            .then((res) => res.json())
            .then((fileNames) => {
                setAllFileNames(fileNames);
                if (!fileNames.length) {
                    setFilterRange(du.NO_FILES);
                    return;
                }
                validRanges.current = du.validRanges(fileNames);
                
                // Try to load and apply saved preferences
                const savedPrefs = videoPrefs.loadVideoPreferences();
                if (savedPrefs) {
                    const validatedPrefs = videoPrefs.validatePreferencesWithVideoList(
                        savedPrefs,
                        fileNames,
                        validRanges.current
                    );
                    
                    if (validatedPrefs) {
                        // Apply validated preferences
                        const selectedRange = validRanges.current.find(r => r.name === savedPrefs.selectedRangeName);
                        if (selectedRange) {
                            setFilterRange(selectedRange);
                        }
                        if (validatedPrefs.playheadPosition) {
                            setPlayheadPosition(validatedPrefs.playheadPosition);
                        }
                        console.debug("Applied saved video preferences");
                        setPreferencesLoaded(true);
                        return;
                    }
                }
                
                // Fall back to default: most recent range (most restrictive)
                setFilterRange(validRanges.current[0]);
                setPreferencesLoaded(true);
            });
    }, []);

    // Debounced save of preferences when state changes
    const debouncedSavePreferences = useCallback(() => {
        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        
        // Only save if preferences have been loaded and we have valid data
        if (!preferencesLoaded || filterRange === du.NO_FILES) {
            return;
        }
        
        // Set new timeout for debounced save
        saveTimeoutRef.current = setTimeout(() => {
            videoPrefs.saveVideoPreferences(
                filterRange.name,
                filterRange,
                windowRange !== du.NO_FILES ? windowRange : null,
                playheadPosition
            );
        }, 2000); // 2 second delay
    }, [preferencesLoaded, filterRange, windowRange, playheadPosition]);

    // Save preferences when key state changes
    useEffect(() => {
        debouncedSavePreferences();
    }, [debouncedSavePreferences]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

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
            du.findNearestFileIndexForDate(filteredFileNames, playheadPosition),
        [filteredFileNames, playheadPosition]
    );


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

            const nextFilenamesIndex = du.findNearestFileIndexForDate(
                filteredFileNames,
                newPlayheadPosition
            );
            if (nextFilenamesIndex < 0) {
                return;
            }
            const adjPlayheadPosition = du.parseFilenameDate(
                filteredFileNames[nextFilenamesIndex]
            );
            setPlayheadPosition(adjPlayheadPosition);
            adjustWindowRangeToNewPlayhead(adjPlayheadPosition);
        },
        [filteredFileNames, adjustWindowRangeToNewPlayhead]
    );

    return (
        <div className={st.videoViewer}>
            <h4 className={st.title}>Recorded Videos</h4>
            <div className={st.content}>
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
        </div>
    );
};
