import { describe, it, vi, afterEach, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { VidViewerDialog } from "./index";
import { MS } from "../util/dateUtils";

describe("VidViewerDialog", () => {
    afterEach(() => {
        vi.clearAllMocks(); // Reset all mocked calls between tests
    });

    it("renders the component", async () => {
        const fileNames = mockFetchResponse(1);
        await render(<VidViewerDialog isOpen={true} onClose={() => {}} />);
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
            `http://localhost:5801/recorded_video/${fileNames.slice(-1)[0]}.mp4`
        );
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
