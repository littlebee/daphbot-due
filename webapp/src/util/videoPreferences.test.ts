import { describe, it, expect, beforeEach, vi } from "vitest";
import * as videoPrefs from "./videoPreferences";
import * as du from "./dateUtils";

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

// Mock videoHost
vi.mock('basic_bot_react', async () => {
    const actual = await vi.importActual('basic_bot_react');
    return {
        ...actual,
        videoHost: 'test-robot.local:5801'
    };
});

describe("videoPreferences", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("saveVideoPreferences", () => {
        it("saves preferences to localStorage with correct key", () => {
            const filterRange = new du.DateRange("Last 90 days", new Date(2024, 0, 1), new Date(2024, 2, 31));
            const windowRange = new du.DateRange("window", new Date(2024, 1, 1), new Date(2024, 1, 7));
            const playheadPosition = new Date(2024, 1, 5);

            videoPrefs.saveVideoPreferences("Last 90 days", filterRange, windowRange, playheadPosition);

            expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
            const [key, valueStr] = localStorageMock.setItem.mock.calls[0];
            
            expect(key).toBe("daphbot_video_prefs_test_robot_local_5801");
            
            const savedValue = JSON.parse(valueStr);
            expect(savedValue.selectedRangeName).toBe("Last 90 days");
            expect(savedValue.playheadPosition).toBe(playheadPosition.getTime());
            expect(savedValue.version).toBe("1.0.0");
        });

        it("handles null ranges gracefully", () => {
            const playheadPosition = new Date();
            
            videoPrefs.saveVideoPreferences("Last hour", null, null, playheadPosition);

            expect(localStorageMock.setItem).toHaveBeenCalledTimes(1);
            const [, valueStr] = localStorageMock.setItem.mock.calls[0];
            
            const savedValue = JSON.parse(valueStr);
            expect(savedValue.filterRange).toBe(null);
            expect(savedValue.windowRange).toBe(null);
        });
    });

    describe("loadVideoPreferences", () => {
        it("returns null when no preferences exist", () => {
            localStorageMock.getItem.mockReturnValue(null);

            const result = videoPrefs.loadVideoPreferences();
            
            expect(result).toBe(null);
            expect(localStorageMock.getItem).toHaveBeenCalledWith("daphbot_video_prefs_test_robot_local_5801");
        });

        it("loads valid preferences", () => {
            const validPrefs = {
                selectedRangeName: "Last 90 days",
                filterRange: {
                    name: "Last 90 days",
                    startTime: new Date(2024, 0, 1).getTime(),
                    endTime: new Date(2024, 2, 31).getTime()
                },
                windowRange: null,
                playheadPosition: new Date(2024, 1, 5).getTime(),
                lastSaved: Date.now(),
                version: "1.0.0"
            };
            
            localStorageMock.getItem.mockReturnValue(JSON.stringify(validPrefs));

            const result = videoPrefs.loadVideoPreferences();
            
            expect(result).toEqual(validPrefs);
        });

        it("clears corrupted preferences", () => {
            localStorageMock.getItem.mockReturnValue("invalid json");

            const result = videoPrefs.loadVideoPreferences();
            
            expect(result).toBe(null);
            expect(localStorageMock.removeItem).toHaveBeenCalledWith("daphbot_video_prefs_test_robot_local_5801");
        });

        it("clears expired preferences", () => {
            const expiredPrefs = {
                selectedRangeName: "Last 90 days",
                filterRange: null,
                windowRange: null,
                playheadPosition: new Date().getTime(),
                lastSaved: Date.now() - (31 * 24 * 60 * 60 * 1000), // 31 days ago
                version: "1.0.0"
            };
            
            localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredPrefs));

            const result = videoPrefs.loadVideoPreferences();
            
            expect(result).toBe(null);
            expect(localStorageMock.removeItem).toHaveBeenCalledWith("daphbot_video_prefs_test_robot_local_5801");
        });
    });

    describe("validatePreferencesWithVideoList", () => {
        it("validates preferences against available files", () => {
            const fileNames = [
                "20240301-120000", // newest
                "20240215-120000",
                "20240201-120000", // oldest
            ];
            
            const validRanges = [
                new du.DateRange("Last 90 days", new Date(2024, 0, 1), new Date(2024, 2, 31))
            ];

            const preferences = {
                selectedRangeName: "Last 90 days",
                filterRange: {
                    name: "Last 90 days",
                    startTime: new Date(2024, 0, 1).getTime(),
                    endTime: new Date(2024, 2, 31).getTime()
                },
                windowRange: null,
                playheadPosition: new Date(2024, 1, 15).getTime(),
                lastSaved: Date.now(),
                version: "1.0.0"
            };

            const result = videoPrefs.validatePreferencesWithVideoList(preferences, fileNames, validRanges);
            
            expect(result).not.toBe(null);
            expect(result?.playheadPosition).toEqual(new Date(2024, 1, 15));
        });

        it("rejects preferences with invalid range name", () => {
            const fileNames = ["20240301-120000"];
            const validRanges = [
                new du.DateRange("Last hour", new Date(), new Date())
            ];

            const preferences = {
                selectedRangeName: "Invalid Range",
                filterRange: null,
                windowRange: null,
                playheadPosition: new Date().getTime(),
                lastSaved: Date.now(),
                version: "1.0.0"
            };

            const result = videoPrefs.validatePreferencesWithVideoList(preferences, fileNames, validRanges);
            
            expect(result).toBe(null);
        });
    });
});