import { videoHost } from "basic_bot_react";

export function vidFileUrl(filename: string): string {
    return `http://${videoHost}/recorded_video/${filename}`;
}

export function vidUrl(baseFilename: string): string {
    return vidFileUrl(`${baseFilename}.mp4`);
}

export function thumbUrl(baseFilename: string): string {
    return vidFileUrl(`${baseFilename}.jpg`);
}

export function largeThumbUrl(baseFilename: string): string {
    return vidFileUrl(`${baseFilename}_lg.jpg`);
}
