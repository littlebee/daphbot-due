
# daphbot-due

This is an updated version of the [original daph-bot software](https://github.com/littlebee/daph-bot).

This repo is also an example of how to use the [basic_bot framework](https://github.com/littlebee/basic_bot).

The hardware is essentially the same:

- 2 PIR motion sensors angled so that their FOV is a little overlapping with the left and right edges of the camera
- Raspberry Pi 4b 4GB
- Raspberry Pi camera (can also handle USB cameras)
- [Adafruit Braincraft Hat](https://www.adafruit.com/product/4374) provides LCD, sound amplifier and microphone
- 2 wheel drive; caster wheel front
- Unlike the original, the motor controller for daphbot-due will be the [Adeept rpi motor control hat](https://www.adeept.com/rpi-motor-hat_p0133.html).  It has a number of features in addition to a 2 channel motor controller.  It also has a DC-DC step down that can accept any DC voltage between 5-20VDC.  The original used a separate in-line BEC stepdown.

The behavior is basically the same:

- When the left motion sensor is high and the right is low, rotate 20deg left.  Same for right=high, left=low rotate right.
- rotate back to center after certain time without any motion
- when ever a dog or cat is detected in frame,
  -- play a recorded MP3 down/off message
  -- flash lights on braincraft on and off police style
  -- rotate, lunge forward and back... do a little dance
  -- repeat until no pet is detected
  -- play a recorded MP3 "good girl/boy"
  -- back to center


## Getting started

### ### Setup Python venv
```sh
python -m venv bb_env
source bb_env/bin/activate
```

### Clone this repository locally
```sh
git clone https://github.com/littlebee/daphbot-due.git
cd daphbot-due.git
```

### Install daphbot-due dependencies locally

```sh
python -m pip install -r requirements.txt
```

## Upload to robot onboard computer

If you have your ssh public key on the robot and in authorized_keys:
```sh
./upload.sh pi5.local
```

If you are using a different user than you are on your local machine:
```sh
./upload.sh me@my_robot.local /home/me/my_robot_code
```

Note that the `./upload.sh` script uses `scp` to copy files which requires SSH.  To test that ssh is setup locally and on your bot, first test that you can use ssh to login like this:

```shell
ssh me@my_robot.local
```


## Install on onboard computer

ssh onto the onboard computer and `cd` to the directory where daphbot-due was uploaded.


### Install daphbot-due dependencies onboard

```sh
# needed by pyttsx3 text-to-speech
sudo apt install -y espeak

# needed by sounddevice
sudo apt-get install -y libportaudio2 portaudio19-dev

# this repo's requirements including basic_bot
python -m pip install -r requirements.txt
```






