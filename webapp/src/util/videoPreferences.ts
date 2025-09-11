/**
 * Video Viewer Preferences - Persistent localStorage-based user preferences
 * 
 * Saves and restores VideoViewer state across browser sessions, including:
 * - RangeSelector selection
 * - Date range filters
 * - Timeline window position
 * - Playhead position
 * 
 * Uses host-specific storage keys to support multiple robots.
 */

import * as du from "./dateUtils";
import { videoHost } from "./hubState";

// Preferences data structure
export interface VideoViewerPreferences {
    selectedRangeName: string;       // Name of selected range (e.g., "Last 90 days")
    filterRange: SerializedDateRange | null;  // Active date range filter
    windowRange: SerializedDateRange | null;  // Current timeline window
    playheadPosition: number;        // Current video timestamp (Date.getTime())
    lastSaved: number;              // When preferences were saved
    version: string;                // Schema version for future migrations
}

// Serializable version of DateRange for localStorage
export interface SerializedDateRange {
    name: string;
    startTime: number;    // Date.getTime()
    endTime: number;      // Date.getTime()
}

// Configuration
const STORAGE_VERSION = "1.0.0";
const PREFERENCE_TTL_DAYS = 30; // Preferences expire after 30 days
const STORAGE_KEY_PREFIX = "daphbot_video_prefs";

// Generate host-specific storage key
function getStorageKey(): string {
    const sanitizedHost = videoHost.replace(/[^a-zA-Z0-9]/g, '_');
    return `${STORAGE_KEY_PREFIX}_${sanitizedHost}`;
}

// Serialize DateRange for storage
function serializeDateRange(range: du.DateRange): SerializedDateRange {
    return {
        name: range.name,
        startTime: range.start.getTime(),
        endTime: range.end.getTime()
    };
}

// Deserialize DateRange from storage
function deserializeDateRange(serialized: SerializedDateRange): du.DateRange {
    return new du.DateRange(
        serialized.name,
        new Date(serialized.startTime),
        new Date(serialized.endTime)
    );
}

/**
 * Save video viewer preferences to localStorage
 */
export function saveVideoPreferences(
    selectedRangeName: string,
    filterRange: du.DateRange | null,
    windowRange: du.DateRange | null,
    playheadPosition: Date
): void {
    try {
        const preferences: VideoViewerPreferences = {
            selectedRangeName,
            filterRange: filterRange ? serializeDateRange(filterRange) : null,
            windowRange: windowRange ? serializeDateRange(windowRange) : null,
            playheadPosition: playheadPosition.getTime(),
            lastSaved: Date.now(),
            version: STORAGE_VERSION
        };

        const storageKey = getStorageKey();
        localStorage.setItem(storageKey, JSON.stringify(preferences));
        
        console.debug(`Video preferences saved for ${videoHost}`, preferences);
    } catch (error) {
        console.warn("Failed to save video preferences:", error);
        // Don't throw - preferences are nice-to-have, not critical
    }
}

/**
 * Load video viewer preferences from localStorage
 * Returns null if no valid preferences found
 */
export function loadVideoPreferences(): VideoViewerPreferences | null {
    try {
        const storageKey = getStorageKey();
        const stored = localStorage.getItem(storageKey);
        
        if (!stored) {
            console.debug(`No video preferences found for ${videoHost}`);
            return null;
        }

        const preferences = JSON.parse(stored) as VideoViewerPreferences;
        
        // Validate preference structure and version
        if (!isValidPreferences(preferences)) {
            console.warn("Invalid video preferences format, clearing");
            clearVideoPreferences();
            return null;
        }

        // Check if preferences are expired
        if (isPreferencesExpired(preferences)) {
            console.debug("Video preferences expired, clearing");
            clearVideoPreferences();
            return null;
        }

        console.debug(`Video preferences loaded for ${videoHost}`, preferences);
        return preferences;
    } catch (error) {
        console.warn("Failed to load video preferences:", error);
        // Try to clear corrupted data
        clearVideoPreferences();
        return null;
    }
}

/**
 * Clear video preferences from localStorage
 */
export function clearVideoPreferences(): void {
    try {
        const storageKey = getStorageKey();
        localStorage.removeItem(storageKey);
        console.debug(`Video preferences cleared for ${videoHost}`);
    } catch (error) {
        console.warn("Failed to clear video preferences:", error);
    }
}

/**
 * Validate preferences data structure
 */
function isValidPreferences(prefs: any): prefs is VideoViewerPreferences {
    return (
        typeof prefs === 'object' &&
        prefs !== null &&
        typeof prefs.selectedRangeName === 'string' &&
        typeof prefs.playheadPosition === 'number' &&
        typeof prefs.lastSaved === 'number' &&
        typeof prefs.version === 'string' &&
        (prefs.filterRange === null || isValidSerializedDateRange(prefs.filterRange)) &&
        (prefs.windowRange === null || isValidSerializedDateRange(prefs.windowRange))
    );
}

/**
 * Validate serialized DateRange structure
 */
function isValidSerializedDateRange(range: any): range is SerializedDateRange {
    return (
        typeof range === 'object' &&
        range !== null &&
        typeof range.name === 'string' &&
        typeof range.startTime === 'number' &&
        typeof range.endTime === 'number' &&
        range.startTime <= range.endTime
    );
}

/**
 * Check if preferences are expired
 */
function isPreferencesExpired(preferences: VideoViewerPreferences): boolean {
    const ageMs = Date.now() - preferences.lastSaved;
    const maxAgeMs = PREFERENCE_TTL_DAYS * 24 * 60 * 60 * 1000;
    return ageMs > maxAgeMs;
}

/**
 * Validate if saved preferences are compatible with current video list
 * Returns null for invalid ranges, or the deserialized ranges if valid
 */
export function validatePreferencesWithVideoList(
    preferences: VideoViewerPreferences,
    availableFiles: string[],
    validRanges: du.DateRange[]
): {
    filterRange: du.DateRange | null;
    windowRange: du.DateRange | null;
    playheadPosition: Date | null;
} | null {
    try {
        // Check if selected range name is still valid
        const selectedRange = validRanges.find(r => r.name === preferences.selectedRangeName);
        if (!selectedRange) {
            console.debug("Saved range name no longer valid:", preferences.selectedRangeName);
            return null;
        }

        // Validate and deserialize filter range
        let filterRange: du.DateRange | null = null;
        if (preferences.filterRange) {
            filterRange = deserializeDateRange(preferences.filterRange);
            // Check if range makes sense with current video list
            if (!isDateRangeReasonable(filterRange, availableFiles)) {
                console.debug("Saved filter range no longer reasonable");
                return null;
            }
        }

        // Validate and deserialize window range
        let windowRange: du.DateRange | null = null;
        if (preferences.windowRange) {
            windowRange = deserializeDateRange(preferences.windowRange);
            if (!isDateRangeReasonable(windowRange, availableFiles)) {
                console.debug("Saved window range no longer reasonable");
                return null;
            }
        }

        // Validate playhead position
        const playheadPosition = new Date(preferences.playheadPosition);
        if (!isPlayheadPositionReasonable(playheadPosition, availableFiles)) {
            console.debug("Saved playhead position no longer reasonable");
            return null;
        }

        return {
            filterRange,
            windowRange,
            playheadPosition
        };
    } catch (error) {
        console.warn("Error validating preferences with video list:", error);
        return null;
    }
}

/**
 * Check if a date range is reasonable given available video files
 */
function isDateRangeReasonable(range: du.DateRange, availableFiles: string[]): boolean {
    if (availableFiles.length === 0) return false;
    
    // Range shouldn't be in the future
    if (range.start > new Date()) return false;
    
    // Range should overlap with available video timespan
    try {
        const oldestFile = availableFiles[availableFiles.length - 1];
        const newestFile = availableFiles[0];
        const oldestDate = du.parseFilenameDate(oldestFile);
        const newestDate = du.parseFilenameDate(newestFile);
        
        // Check if ranges overlap
        return range.end > oldestDate && range.start < newestDate;
    } catch (error) {
        console.warn("Error parsing video file dates:", error);
        return false;
    }
}

/**
 * Check if playhead position is reasonable given available video files
 */
function isPlayheadPositionReasonable(position: Date, availableFiles: string[]): boolean {
    if (availableFiles.length === 0) return false;
    
    // Position shouldn't be in the future
    if (position > new Date()) return false;
    
    // Position should be within the timespan of available videos (with some tolerance)
    try {
        const oldestFile = availableFiles[availableFiles.length - 1];
        const newestFile = availableFiles[0];
        const oldestDate = du.parseFilenameDate(oldestFile);
        const newestDate = du.parseFilenameDate(newestFile);
        
        // Add 1 hour tolerance on either side
        const tolerance = 60 * 60 * 1000;
        return position >= new Date(oldestDate.getTime() - tolerance) && 
               position <= new Date(newestDate.getTime() + tolerance);
    } catch (error) {
        console.warn("Error validating playhead position:", error);
        return false;
    }
}