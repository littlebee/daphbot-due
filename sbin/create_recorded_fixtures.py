#!/usr/bin/env python
"""
This script is run from the root project directory and will create a set of
recorded video files for testing the recorded video feature.  Files will be
created in the ./recorded_videos directory.

To create the files, this script will look in the ./recorded_videos path for
the earliest recorded existing video file (.mp4) and its associated
thumbnail files (.jpg).

The created files will be be distributed using random gaps and contiguous
10s segments over 30 days from the earliest exiting video.

You can run it multiple times to create more files / history
"""
import os
import random
from datetime import datetime, timedelta
from shutil import copyfile

# Constants
RECORDED_VIDEOS_PATH = "./recorded_video"
RECORDED_VIDEO_DURATION = 10
DAYS = 30


def get_earliest_video():
    """
    Get the earliest video file in the recorded_videos directory.
    """
    files = os.listdir(RECORDED_VIDEOS_PATH)
    videos = [f for f in files if f.endswith(".mp4")]
    videos.sort()
    if len(videos) > 0:
        return videos[0]
    return None


def create_recorded_fixtures(num_files=20):
    earliest_video = get_earliest_video()
    if not earliest_video:
        print("No earliest .mp4 found. Exiting.")
        return

    earliest_thumb_path = os.path.join(
        RECORDED_VIDEOS_PATH, earliest_video.replace(".mp4", ".jpg")
    )

    earliest_lg_thumb_path = os.path.join(
        RECORDED_VIDEOS_PATH, earliest_video.replace(".mp4", "_lg.jpg")
    )

    # parse the datetime from the earliest video base file name
    dt_str = earliest_video.split(".")[0]
    earliest_existing_date = datetime.strptime(dt_str, "%Y%m%d-%H%M%S")

    current_time = earliest_existing_date
    target_time = earliest_existing_date - timedelta(days=DAYS)

    while current_time > target_time:
        gap_minutes = random.randint(1, 240)
        current_time -= timedelta(minutes=gap_minutes)
        chunk_size = random.randint(1, 10)
        for _ in range(chunk_size):
            ts = current_time.strftime("%Y%m%d-%H%M%S")
            mp4_name = f"{ts}.mp4"
            copyfile(
                os.path.join(RECORDED_VIDEOS_PATH, earliest_video),
                os.path.join(RECORDED_VIDEOS_PATH, mp4_name),
            )
            if os.path.exists(earliest_thumb_path):
                jpg_name = f"{ts}.jpg"
                copyfile(
                    earliest_thumb_path, os.path.join(RECORDED_VIDEOS_PATH, jpg_name)
                )
            if os.path.exists(earliest_lg_thumb_path):
                jpg_name = f"{ts}_lg.jpg"
                copyfile(
                    earliest_thumb_path, os.path.join(RECORDED_VIDEOS_PATH, jpg_name)
                )
            current_time -= timedelta(seconds=RECORDED_VIDEO_DURATION)

    print("Recorded fixtures created.")


if __name__ == "__main__":
    create_recorded_fixtures()
