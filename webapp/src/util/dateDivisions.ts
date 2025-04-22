import { DateRange, MS } from "./dateUtils";

export enum DateDivisionType {
    Year = "Year",
    Month = "Month",
    Week = "Week",
    Day = "Day",
    Hour = "Hour",
    Minute = "Minute",
}

export type DateDivision = {
    label: string;
    date: Date;
    divisionType: DateDivisionType;
};

function findYearDivisions(range: DateRange): DateDivision[] {
    const divisions = [];
    const startYear = range.start.getFullYear();
    const endYear = range.end.getFullYear();
    for (let year = startYear; year <= endYear; year++) {
        const date = new Date(year, 0, 1);
        if (range.contains(date)) {
            divisions.push({
                divisionType: DateDivisionType.Year,
                label: date.toLocaleString("en-US", { year: "numeric" }),
                date,
            });
        }
    }
    return divisions;
}

function findMonthDivisions(range: DateRange) {
    // Month divisions are a bit tricky because we need to account for the
    // variable number of days by month and leap years so there is no fixed
    // STEP_MS value. We need to iterate through the years and months
    const divisions = [];
    const startYear = range.start.getFullYear();
    const startMonth = range.start.getMonth();
    const endYear = range.end.getFullYear();
    const endMonth = range.end.getMonth();
    for (let year = startYear; year <= endYear; year++) {
        // start at month 1 (february) because January 1st is already
        // included in the year division
        const start = year === startYear ? startMonth : 1;
        const end = year === endYear ? endMonth : 11;
        for (let month = start; month <= end; month++) {
            const date = new Date(year, month, 1);
            if (range.contains(date)) {
                divisions.push({
                    divisionType: DateDivisionType.Month,
                    label: date.toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    }),
                    date,
                });
            }
        }
    }
    return divisions;
}

// This function works well for finding divisions that have a fixed duration
// (like weeks, days, hours, and minutes) but is not suitable for months or years
// because they have variable durations.
function findDivisionDates(
    range: DateRange,
    start: Date,
    stepMs: number,
    ignore?: (date: Date) => boolean
): Date[] {
    const divisionDates: Date[] = [];
    let day = start;
    while (day < range.end) {
        if (range.contains(day) && !ignore?.(day)) {
            divisionDates.push(day);
        }
        day = new Date(day.getTime() + stepMs);
    }
    return divisionDates;
}

function findWeekDivisions(range: DateRange): DateDivision[] {
    const start = new Date(
        range.start.getFullYear(),
        range.start.getMonth(),
        range.start.getDate() - range.start.getDay() + 1
    );
    const dateDivisions = findDivisionDates(
        range,
        start,
        MS.WEEK,
        // ignore the first day of the month because it is already included
        // in the month division
        (date) => {
            const dayOfMonth = date.getDate();
            // ignore if the it is in the first or last 5 days of the month
            // because they are already included in the month division
            return dayOfMonth < 5 || dayOfMonth > 25;
        }
    );
    return dateDivisions.map((date) => ({
        divisionType: DateDivisionType.Week,
        label: `Mon, ${date.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
        })}`,
        date,
    }));
}

function findDayDivisions(range: DateRange): DateDivision[] {
    const start = new Date(
        range.start.getFullYear(),
        range.start.getMonth(),
        range.start.getDate()
    );
    const divDates = findDivisionDates(range, start, MS.DAY, (date) => {
        const dayOfMonth = date.getDate();
        const dayOfWeek = date.getDay();
        // ignore if the it is in the first or last days of the month
        // because they are already included in the month division
        // Also ignore mondays because they are already included in the week division
        return dayOfMonth < 2 || dayOfMonth > 28 || dayOfWeek === 1;
    });
    return divDates.map((day) => ({
        divisionType: DateDivisionType.Day,
        label: day.toLocaleString("en-US", {
            month: "short",
            day: "numeric", // "numeric" is the default
        }),
        date: day,
    }));
}

function findHourDivisions(range: DateRange): DateDivision[] {
    const start = new Date(
        range.start.getFullYear(),
        range.start.getMonth(),
        range.start.getDate(),
        range.start.getHours()
    );
    const divDates = findDivisionDates(
        range,
        start,
        MS.HOUR,
        // ignore the first hour of the day because it is already included
        (date) => date.getHours() === 0
    );
    return divDates.map((hour) => ({
        divisionType: DateDivisionType.Hour,
        label: hour.toLocaleString("en-US", {
            hour: "numeric",
        }),
        date: hour,
    }));
}

function findMinuteDivisions(range: DateRange): DateDivision[] {
    const start = new Date(
        range.start.getFullYear(),
        range.start.getMonth(),
        range.start.getDate(),
        range.start.getHours(),
        range.start.getMinutes()
    );

    const divDates = findDivisionDates(
        range,
        start,
        MS.MINUTE,
        // ignore the first minute of the hour because it is already included
        (date) => {
            const mins = date.getMinutes();
            // ignore the first 10 minutes of the hour and the last
            // of the hour because they are already included in the
            // hour division
            return mins < 10 || mins > 50;
        }
    );
    return divDates.map((minute) => ({
        divisionType: DateDivisionType.Minute,
        label: minute.toLocaleString("en-US", {
            hour: "numeric",
            minute: "numeric",
        }),
        date: minute,
    }));
}

function decimateDivisions(
    divisions: DateDivision[],
    maxDivisions: number
): DateDivision[] {
    if (divisions.length <= maxDivisions) {
        return divisions;
    }
    if (maxDivisions <= 0) {
        return [];
    }
    // just lop off the head and tail for the first two excess divisions
    if (divisions.length === maxDivisions + 1) {
        return divisions.slice(0, -1);
    }
    if (divisions.length === maxDivisions + 2) {
        return divisions.slice(1, -1);
    }

    const step = Math.ceil(divisions.length / maxDivisions);
    const decimated: DateDivision[] = [];
    for (let i = 0; i < divisions.length; i += step) {
        decimated.push(divisions[i]);
    }
    return decimated;
}

export function findDateDivisions(
    range: DateRange,
    numDivisions: number
): DateDivision[] {
    const funcs = [
        findYearDivisions,
        findMonthDivisions,
        findWeekDivisions,
        findDayDivisions,
        findHourDivisions,
        findMinuteDivisions,
    ];
    let divisions: DateDivision[] = [];
    for (const func of funcs) {
        const nextDivisions = func(range);
        const nextLength = nextDivisions.length + divisions.length;
        if (nextLength > numDivisions) {
            divisions = [
                ...divisions,
                ...decimateDivisions(
                    nextDivisions,
                    numDivisions - divisions.length
                ),
            ];
        } else {
            divisions = [...divisions, ...nextDivisions];
        }
        if (divisions.length >= numDivisions) {
            return divisions.slice(0, numDivisions);
        }
    }
    return divisions.slice(0, numDivisions);
}
