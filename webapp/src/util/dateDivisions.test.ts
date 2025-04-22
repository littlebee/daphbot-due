import { describe, it, expect } from "vitest";
import { findDateDivisions, DateDivisionType } from "./dateDivisions";
import { DateRange } from "./dateUtils";

function makeRange(start: Date, end: Date): DateRange {
    return new DateRange("testRange", start, end);
}

describe("findDateDivisions", () => {
    it("returns empty array if numDivisions is 0", () => {
        const range = makeRange(new Date(2023, 0, 1), new Date(2023, 11, 31));
        const result = findDateDivisions(range, 0);
        expect(result).toEqual([]);
    });

    it("returns year division for a single year", () => {
        const range = makeRange(new Date(2022, 0, 1), new Date(2023, 0, 1));
        const result = findDateDivisions(range, 1);
        expect(result.length).toBe(1);
        expect(result[0].divisionType).toBe(DateDivisionType.Year);
    });

    it("returns correct number of divisions for a multi-year range", () => {
        const range = makeRange(new Date(2020, 0, 1), new Date(2023, 0, 1));
        const result = findDateDivisions(range, 3);
        expect(result.length).toBe(3);
        expect(
            result.every((d) => d.divisionType === DateDivisionType.Year)
        ).toBe(true);
    });

    it("returns correct number of divisions for a multi-year range with months added for filler", () => {
        const range = makeRange(new Date(2019, 11, 15), new Date(2023, 0, 15));
        const result = findDateDivisions(range, 6);
        expect(result).toEqual([
            {
                divisionType: DateDivisionType.Year,
                label: "2020",
                date: new Date(2020, 0, 1),
            },
            {
                divisionType: DateDivisionType.Year,
                label: "2021",
                date: new Date(2021, 0, 1),
            },
            {
                divisionType: DateDivisionType.Year,
                label: "2022",
                date: new Date(2022, 0, 1),
            },
            {
                divisionType: DateDivisionType.Year,
                label: "2023",
                date: new Date(2023, 0, 1),
            },
            {
                divisionType: DateDivisionType.Month,
                label: "Feb 1, 2020",
                date: new Date(2020, 1, 1),
            },
            {
                divisionType: DateDivisionType.Month,
                label: "Aug 1, 2021",
                date: new Date(2021, 7, 1),
            },
        ]);
    });

    it("returns month divisions if numDivisions exceeds year divisions", () => {
        const range = makeRange(new Date(2023, 0, 1), new Date(2023, 6, 1));
        const result = findDateDivisions(range, 6);
        expect(result.length).toBe(6);
        expect(
            result.some((d) => d.divisionType === DateDivisionType.Month)
        ).toBe(true);
    });

    it("returns week divisions if numDivisions exceeds month divisions", () => {
        const range = makeRange(new Date(2023, 0, 1), new Date(2023, 0, 31));
        const result = findDateDivisions(range, 10);
        expect(result.length).toBe(10);
        expect(
            result.some((d) => d.divisionType === DateDivisionType.Week)
        ).toBe(true);
    });

    it("returns day divisions if numDivisions exceeds week divisions", () => {
        const range = makeRange(new Date(2023, 0, 10), new Date(2023, 0, 20));
        const result = findDateDivisions(range, 8);
        expect(result.length).toBe(8);
        expect(
            result.some((d) => d.divisionType === DateDivisionType.Day)
        ).toBe(true);
    });

    it("returns hour divisions for small ranges", () => {
        const range = makeRange(
            new Date(2023, 0, 1, 10, 0, 0),
            new Date(2023, 0, 1, 15, 0, 0)
        );
        const result = findDateDivisions(range, 4);
        expect(result.length).toBe(4);
        expect(
            result.some((d) => d.divisionType === DateDivisionType.Hour)
        ).toBe(true);
    });

    it("returns minute divisions for very small ranges", () => {
        const range = makeRange(
            new Date(2023, 0, 1, 10, 10, 0),
            new Date(2023, 0, 1, 10, 50, 0)
        );
        const result = findDateDivisions(range, 5);
        expect(result.length).toBe(5);
        expect(
            result.some((d) => d.divisionType === DateDivisionType.Minute)
        ).toBe(true);
    });

    it("does not exceed numDivisions", () => {
        const range = makeRange(new Date(2023, 0, 1), new Date(2024, 0, 1));
        const result = findDateDivisions(range, 7);
        expect(result.length).toBeLessThanOrEqual(7);
    });

    it("handles range where start equals end (empty range)", () => {
        const date = new Date(2023, 0, 1);
        const range = makeRange(date, date);
        const result = findDateDivisions(range, 5);
        expect(result).toEqual([]);
    });

    it("handles negative numDivisions", () => {
        const range = makeRange(new Date(2023, 0, 1), new Date(2023, 11, 31));
        const result = findDateDivisions(range, -5);
        expect(result).toEqual([]);
    });

    it("handles range within a single day", () => {
        const range = makeRange(
            new Date(2023, 0, 1, 12, 0, 0),
            new Date(2023, 0, 1, 13, 0, 0)
        );
        const result = findDateDivisions(range, 3);
        expect(result.length).toBe(3);
        expect(
            result.some((d) => d.divisionType === DateDivisionType.Minute)
        ).toBe(true);
    });
});
