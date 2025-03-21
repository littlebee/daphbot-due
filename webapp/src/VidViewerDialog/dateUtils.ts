export const DAY_MS = 24 * 60 * 60 * 1000;
export const RECORDING_DURATION = 10 * 1000; // 10 seconds

export function daysAgoDate(days: number): Date {
    return new Date(Date.now() - days * DAY_MS);
}

export function parseFilenameDate(file: string): Date {
    try {
        const year = parseInt(file.slice(0, 4));
        const month = parseInt(file.slice(4, 6)) - 1;
        const day = parseInt(file.slice(6, 8));
        const hour = parseInt(file.slice(9, 11));
        const minute = parseInt(file.slice(11, 13));
        const second = parseInt(file.slice(13, 15));
        return new Date(year, month, day, hour, minute, second);
    } catch (e) {
        console.error(`Error parsing date from file name: ${file}`);
        throw e;
    }
}

export class DateRange {
    constructor(public name: string, public start: Date, public end: Date) {}

    // Returns the duration of this range in milliseconds
    get duration() {
        return this.end.getTime() - this.start.getTime();
    }

    // Returns a list of file names that fall within this range
    // assumes that the fileNames are sorted in descending order
    filterFileNames(fileNames: string[]): string[] {
        const filtered = [];
        for (const f of fileNames) {
            const date = parseFilenameDate(f);
            if (date >= this.start && date < this.end) {
                filtered.push(f);
            } else if (date < this.start) {
                break;
            }
        }
        return filtered;
    }
}

export const NO_FILES = new DateRange("No Files", new Date(), new Date());

// Returns a list of DateRanges that are valid for the given list of file names
// These are the top-level filter ranges that the user can select from in the UI
export function validRanges(fileNames: string[]): DateRange[] {
    const now = new Date();
    if (!fileNames.length) return [NO_FILES];
    const latest = parseFilenameDate(fileNames[0]);
    const earliest = parseFilenameDate(fileNames[fileNames.length - 1]);
    const ranges = [];
    for (const days of [1 / 24, 0.25, 0.5, 1, 7, 30, 90, 365]) {
        const daysAgo = daysAgoDate(days);
        if (daysAgo < earliest) continue;
        const name =
            days === 1
                ? "Last 24 hours"
                : days < 1
                ? `Last ${days * 24} hours`
                : `Last ${days} days`;
        ranges.push(new DateRange(name, daysAgo, now));
    }
    ranges.push(new DateRange("All time", earliest, latest));

    return ranges;
}

// Returns a list of DateRanges that are contiguous ignoring gaps of
// less than or equal to 1 second based on the given list of file names
export function contiguousRanges(fileNames: string[]): DateRange[] {
    function createRange(start: Date, end: Date): DateRange {
        const name = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
        return new DateRange(name, start, end);
    }
    if (fileNames.length === 0) return [];
    if (fileNames.length === 1) {
        const start = parseFilenameDate(fileNames[0]);
        const end = new Date(start.getTime() + RECORDING_DURATION);
        return [new DateRange(fileNames[0], start, end)];
    }
    const ranges = [];
    let start = parseFilenameDate(fileNames[fileNames.length - 1]);
    let end = new Date(start.getTime() + RECORDING_DURATION);
    // fileNames are sorted by service in descending order
    for (let i = fileNames.length - 2; i >= 0; i--) {
        const nextStart = parseFilenameDate(fileNames[i]);
        if (nextStart.getTime() - end.getTime() > 1000) {
            ranges.push(createRange(start, end));
            start = nextStart;
        }
        end = new Date(nextStart.getTime() + RECORDING_DURATION);
    }
    if (end !== start) {
        ranges.push(createRange(start, end));
    }

    return ranges;
}
