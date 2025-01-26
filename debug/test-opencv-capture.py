#!/usr/bin/env python3

# To see CV debug information, do
#
#    OPENCV_VIDEOIO_DEBUG=1 debug/test-camera.py

# Python program to save a video using OpenCV and output FPS
#
# from https://www.geeksforgeeks.org/saving-a-video-using-opencv/
import sys
import time

import cv2

DURATION = 10


video_channel = 0
if len(sys.argv) > 1:
    video_channel = int(sys.argv[1])

size = (1280, 720)
video_file = "camera_test_output.mp4"

# Create an object to read
# from camera
video = cv2.VideoCapture(video_channel)

# We need to check if camera
# is opened previously or not
if video.isOpened() is False:
    raise RuntimeError("error creating video capture on channel", video_channel)

video.set(cv2.CAP_PROP_FRAME_WIDTH, size[0])
video.set(cv2.CAP_PROP_FRAME_HEIGHT, size[1])
video.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc("M", "J", "P", "G"))
video.set(cv2.CAP_PROP_FPS, 30)

capture_fps = video.get(cv2.CAP_PROP_FPS)


print(
    f"starting video_channel={video_channel} size={size} capture_fps={capture_fps}",
)

print(f"recording {DURATION} secs of video...")
start = time.time()
num_frames = 0
captured_frames = []
while True:
    ret, frame = video.read()

    if ret is True:
        # Write the frame into the
        # file 'filename.avi'
        # writer.write(frame)
        captured_frames.append(frame)
        num_frames += 1

    # Break the loop
    else:
        break

    # runs for 30s
    if time.time() - start >= DURATION:
        break

duration = time.time() - start
print(f"recorded {num_frames} frames in {duration}s ({num_frames/duration:.2f} fps)")


print(f"\nSaving video to {video_file}")
# Below VideoWriter object will create
# a frame of above defined The output
# is stored in 'filename.avi' file.
start = time.time()

writer = cv2.VideoWriter(
    "camera_test_output.mp4", cv2.VideoWriter_fourcc(*"mp4v"), capture_fps, size
)
for frame in captured_frames:
    writer.write(frame)

duration = time.time() - start
print(f"saved {num_frames} frames in {duration}s ({num_frames/duration:.2f} fps)")


# When everything done, release
# the video capture and video
# write objects
video.release()
writer.release()


print("The video was successfully saved.")
print("")
print("You can view the video recorded with:")
print(
    "   scp pi@raspberrypi.local:/home/pi/mi_corazon/camera_test_output.mp4 . && open camera_test_output.mp4"
)
print("on your local machine")
