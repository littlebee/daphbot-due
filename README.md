
# daphbot-due

This is an updated version of the [original daph-bot software](https://github.com/littlebee/daph-bot) based on the [basic_bot framework](https://github.com/littlebee/basic_bot).

The hardware is essentially the same:

- 2 PIR motion sensors angled so that their FOV is a little overlapping with the left and right edges of the camera
- Raspberry Pi 4b 4GB
- Raspberry Pi camera (can also handle USB cameras)
- [Adafruit Braincraft Hat](https://www.adafruit.com/product/4374) provides LCD, sound amplifier and microphone
- 2 wheel drive; caster wheel front
- Unlike the original, the motor controller for daphbot-due will be the [Adeept rpi motor control hat](https://www.adeept.com/rpi-motor-hat_p0133.html).  It has a number of features in addition to a 2 channel motor controller like a DC-DC step down that can accept any DC voltage between 5-20VDC.  The original used a separate in-line BEC stepdown.

The behavior is basically the same:

- When the left motion sensor is high and the right is low, rotate 20deg left.  Some for right=high, left=low rotate right.
- rotate back to center after certain time without any motion
- when ever a dog or cat is detected in frame,
  -- play a recorded MP3 down/off message
  -- flash lights on braincraft on and off police style
  -- rotate, lunge forward and back... do a little dance
  -- repeat until no pet is detected
  -- play a recorded MP3 "good girl/boy"
  -- back to center



## uploading to robot host computer

Note that the upload script uses `scp` to copy files which requires SSH.  To test that ssh is setup locally and on your bot, first test that you can use ssh to login like this:
```shell
ssh me@my_robot.local
```
### to upload
```shell
./upload.sh me@my_robot.local /home/me/my_robot_code
```
and follow the examples





