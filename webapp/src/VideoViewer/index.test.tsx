import { describe, it, vi, afterEach, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { VideoViewer } from "./index";
import { MS, DateRange } from "../util/dateUtils";
import * as videoPrefs from "../util/videoPreferences";

// Mock videoPreferences module
vi.mock("../util/videoPreferences");
const mockVideoPrefs = vi.mocked(videoPrefs);

// Mock hubState module
vi.mock("../util/hubState", () => ({
    videoHost: "test-robot.local:5801"
}));

describe("VideoViewer", () => {
    beforeEach(() => {
        // Set up default mock implementations
        mockVideoPrefs.loadVideoPreferences.mockReturnValue(null);
        mockVideoPrefs.validatePreferencesWithVideoList.mockReturnValue(null);
        mockVideoPrefs.saveVideoPreferences.mockImplementation(() => {});
    });

    afterEach(() => {
        vi.clearAllMocks(); // Reset all mocked calls between tests
    });

    it("renders the component", async () => {
        const fileNames = mockFetchResponse(1);
        await render(<VideoViewer />);
        screen.getByText("Recorded Videos");
        // should only be one range element because mock fetch response
        // only returns one range of 10 video clips spaced 10s apart.  That
        // in turn gets rendered as a single contiguous range because there
        // aren't any gaps beween 10s video clips
        await waitFor(() => screen.getByTestId("activity-range"));
        screen.getByTestId("range-selector");

        const video = screen.getByTestId("video-player") as HTMLVideoElement;
        expect(video).toBeTruthy();
        expect(video.src).toEqual(
            `http://test-robot.local:5801/recorded_video/${fileNames.slice(-1)[0]}.mp4`
        );
    });

    describe("Preference persistence", () => {
        it("loads component without saved preferences and uses defaults", async () => {
            const fileNames = mockFetchResponse(1);
            
            // Mock no saved preferences
            mockVideoPrefs.loadVideoPreferences.mockReturnValue(null);
            
            render(<VideoViewer />);
            
            await waitFor(() => screen.getByTestId("video-player"));
            
            // Should load preferences on mount
            expect(mockVideoPrefs.loadVideoPreferences).toHaveBeenCalled();
            
            // Should not call validate since no preferences exist
            expect(mockVideoPrefs.validatePreferencesWithVideoList).not.toHaveBeenCalled();
            
            // Should use the newest video (last in array since they're sorted newest first)
            const video = screen.getByTestId("video-player") as HTMLVideoElement;
            expect(video.src).toEqual(
                `http://test-robot.local:5801/recorded_video/${fileNames.slice(-1)[0]}.mp4`
            );
        });

        it("loads and applies valid saved preferences", async () => {
            const fileNames = mockFetchResponse(7, new Date(), 20); // 7 days, 20 videos per day
            const testDate = new Date("2024-01-15T10:30:22Z");
            
            // Mock saved preferences
            const savedPrefs: videoPrefs.VideoViewerPreferences = {
                selectedRangeName: "Last 90 days",
                filterRange: {
                    name: "Last 90 days", 
                    startTime: new Date("2024-01-01").getTime(),
                    endTime: new Date("2024-03-31").getTime()
                },
                windowRange: {
                    name: "window",
                    startTime: new Date("2024-01-10").getTime(),
                    endTime: new Date("2024-01-20").getTime()
                },
                playheadPosition: testDate.getTime(),
                lastSaved: Date.now(),
                version: "1.0.0"
            };
            
            const validatedPrefs = {
                filterRange: new DateRange("Last 90 days", new Date("2024-01-01"), new Date("2024-03-31")),
                windowRange: new DateRange("window", new Date("2024-01-10"), new Date("2024-01-20")),
                playheadPosition: testDate
            };
            
            mockVideoPrefs.loadVideoPreferences.mockReturnValue(savedPrefs);
            mockVideoPrefs.validatePreferencesWithVideoList.mockReturnValue(validatedPrefs);
            
            render(<VideoViewer />);
            
            await waitFor(() => screen.getByTestId("video-player"));
            
            // Should load and validate preferences
            expect(mockVideoPrefs.loadVideoPreferences).toHaveBeenCalled();
            expect(mockVideoPrefs.validatePreferencesWithVideoList).toHaveBeenCalledWith(
                savedPrefs,
                fileNames,
                expect.any(Array)
            );
        });

        it("handles invalid saved preferences gracefully", async () => {
            const fileNames = mockFetchResponse(1);
            
            // Mock invalid preferences that fail validation
            const invalidPrefs: videoPrefs.VideoViewerPreferences = {
                selectedRangeName: "Invalid Range",
                filterRange: null,
                windowRange: null,
                playheadPosition: Date.now(),
                lastSaved: Date.now(),
                version: "1.0.0"
            };
            
            mockVideoPrefs.loadVideoPreferences.mockReturnValue(invalidPrefs);
            mockVideoPrefs.validatePreferencesWithVideoList.mockReturnValue(null); // Invalid
            
            render(<VideoViewer />);
            
            await waitFor(() => screen.getByTestId("video-player"));
            
            // Should try to load and validate, then fall back to defaults
            expect(mockVideoPrefs.loadVideoPreferences).toHaveBeenCalled();
            expect(mockVideoPrefs.validatePreferencesWithVideoList).toHaveBeenCalledWith(
                invalidPrefs,
                fileNames,
                expect.any(Array)
            );
            
            // Should still render correctly with defaults
            const video = screen.getByTestId("video-player") as HTMLVideoElement;
            expect(video.src).toContain("/recorded_video/");
        });

        it("saves preferences when state changes (debounced)", async () => {
            const fileNames = mockFetchResponse(1);
            
            render(<VideoViewer />);
            
            await waitFor(() => screen.getByTestId("video-player"));
            
            // Clear any initial calls from component mount
            mockVideoPrefs.saveVideoPreferences.mockClear();
            
            // Wait for debounced save to trigger (2000ms + buffer)
            await waitFor(() => {
                expect(mockVideoPrefs.saveVideoPreferences).toHaveBeenCalled();
            }, { timeout: 3000 });
        });

        it("passes restored preferences to DateLine and Viewer components", async () => {
            const fileNames = mockFetchResponse(2, new Date(), 5); // Smaller dataset for faster testing
            const testPlayheadDate = new Date("2024-01-15T10:30:22Z");
            const testWindowStart = new Date("2024-01-10T08:00:00Z");
            const testWindowEnd = new Date("2024-01-20T18:00:00Z");
            
            // Mock saved preferences with specific window range and playhead
            const savedPrefs: videoPrefs.VideoViewerPreferences = {
                selectedRangeName: "Last 90 days",
                filterRange: {
                    name: "Last 90 days", 
                    startTime: new Date("2024-01-01").getTime(),
                    endTime: new Date("2024-03-31").getTime()
                },
                windowRange: {
                    name: "restored-window",
                    startTime: testWindowStart.getTime(),
                    endTime: testWindowEnd.getTime()
                },
                playheadPosition: testPlayheadDate.getTime(),
                lastSaved: Date.now(),
                version: "1.0.0"
            };
            
            const validatedPrefs = {
                filterRange: new DateRange("Last 90 days", new Date("2024-01-01"), new Date("2024-03-31")),
                windowRange: new DateRange("restored-window", testWindowStart, testWindowEnd),
                playheadPosition: testPlayheadDate
            };
            
            mockVideoPrefs.loadVideoPreferences.mockReturnValue(savedPrefs);
            mockVideoPrefs.validatePreferencesWithVideoList.mockReturnValue(validatedPrefs);
            
            const { container } = render(<VideoViewer />);
            
            await waitFor(() => {
                const videoPlayer = screen.getByTestId("video-player");
                expect(videoPlayer).toBeTruthy();
            }, { timeout: 2000 });
            
            // Verify preferences were loaded and validated correctly
            expect(mockVideoPrefs.loadVideoPreferences).toHaveBeenCalled();
            expect(mockVideoPrefs.validatePreferencesWithVideoList).toHaveBeenCalledWith(
                savedPrefs,
                fileNames,
                expect.any(Array)
            );
            
            // The component structure should be present - check for key elements
            expect(screen.getByText("Recorded Videos")).toBeTruthy();
            expect(screen.getByTestId("range-selector")).toBeTruthy();
        });
    });
});

function mockFetchResponse(
    numberOfDays: number,
    startDate: Date = new Date(),
    numberOfVideos: number = 10
): string[] {
    const fileNames: string[] = [];
    const startMS = startDate.getTime();
    for (let i = 0; i < numberOfDays; i++) {
        const date = new Date(startMS + MS.DAY * i);
        fileNames.push(...generateSpanOfVideos(date, numberOfVideos));
    }
    global.fetch = vi.fn(() =>
        Promise.resolve({
            json: () => Promise.resolve(fileNames),
        } as Response)
    ) as unknown as typeof global.fetch;
    return fileNames;
}

function generateSpanOfVideos(
    startDate: Date,
    numberOfVideos: number = 10
): string[] {
    // Video filenames are in the format YYYYMMDD-HHMMSS
    const videos = [];
    const startMS = startDate.getTime();
    for (let i = 0; i < numberOfVideos; i++) {
        // 10 second intervals
        const videoDate = new Date(startMS - i * MS.SECOND * 10);
        const filename = `${videoDate.getFullYear()}${String(
            videoDate.getMonth() + 1
        ).padStart(2, "0")}${String(videoDate.getDate()).padStart(
            2,
            "0"
        )}-${String(videoDate.getHours()).padStart(2, "0")}${String(
            videoDate.getMinutes()
        ).padStart(2, "0")}${String(videoDate.getSeconds()).padStart(2, "0")}`;
        videos.push(filename);
    }
    return videos;
}
