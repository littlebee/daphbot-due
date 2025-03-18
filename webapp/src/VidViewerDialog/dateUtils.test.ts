import { describe, it, expect } from "vitest";

import * as dateUtils from "./dateUtils";

describe("dateUtils", () => {
    describe(".contiguousRanges", () => {
        it("returns an empty array when given an empty array", () => {
            expect(dateUtils.contiguousRanges([])).toEqual([]);
        });

        it("handles a single file", () => {
            const fileNames = ["20250101-000000"];
            const ranges = dateUtils.contiguousRanges(fileNames);
            expect(ranges).toEqual([
                new dateUtils.DateRange(
                    fileNames[0],
                    new Date("2025-01-01T00:00:00"),
                    new Date("2025-01-01T00:00:10") // 10 seconds duration
                ),
            ]);
        });

        it("handles multiple ranges and gaps", () => {
            const fileNames = [
                "20250102-000107",
                "20250102-000057",
                "20250102-000048",
                // should be a new range here because of the gap of
                // 12 seconds > 11 seconds (10 seconds duration + 1 second tolerance)

                "20250102-000036", // 10 seconds duration + 1 second tolerance
                "20250102-000025",
                // new range starting above

                "20250101-000030",
                "20250101-000020",
                "20250101-000010",
                "20250101-000000",
            ];
            const ranges = dateUtils.contiguousRanges(fileNames);
            expect(ranges).toEqual([
                new dateUtils.DateRange(
                    "1/1/2025 - 1/1/2025",
                    new Date("2025-01-01T00:00:00"),
                    new Date("2025-01-01T00:00:40") // +10 seconds after last in range
                ),
                new dateUtils.DateRange(
                    "1/2/2025 - 1/2/2025",
                    new Date("2025-01-02T00:00:25"),
                    new Date("2025-01-02T00:00:46") // +10 seconds duration
                ),
                new dateUtils.DateRange(
                    "1/2/2025 - 1/2/2025",
                    new Date("2025-01-02T00:00:48"),
                    new Date("2025-01-02T00:01:17") // +10 seconds duration
                ),
            ]);
        });
    });
});
