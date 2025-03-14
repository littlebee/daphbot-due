
# daphbot-due

This is an updated version of the [original daph-bot software](https://github.com/littlebee/daph-bot).

This repo is also an example of how to use the [basic_bot framework](https://github.com/littlebee/basic_bot).

## Status

This is a *work in progress*.

### Feb 27, 2025

I've been off redesigning in Fusion360 and test printing parts for pivot to 5" touch display pan+tilt. Here are some pics of the work [TBD]

The setup instructions below are updated as of today for the 5" display.

I've also moved old status posts from here to docs/EngineeringLog.md.  I will try and keep what is posted here int the readme.

TODO: add permanent link to blob/.../EngineeringLog.md

## What does it do

The behavior is basically the same as the [OG daph-bot](https://github.com/littlebee/daph-bot):

- When the left motion sensor is high and the right is low, rotate 20deg left.  Same for right=high, left=low rotate right.
- rotate back to center after certain time without any motion
- when ever a dog or cat is detected in frame,
  -- play a recorded MP3 down/off message
  -- flash lights on braincraft on and off police style
  -- rotate, lunge forward and back... do a little dance
  -- repeat until no pet is detected
  -- play a recorded MP3 "good girl/boy"
  -- back to center

- Provide onboard UI that allows the recording of "off" and "good boy" messages


## Hardware

1 x [Raspberry Pi5 8GB](https://www.adafruit.com/product/5813) (see below for OS + setup needed)
1 x [Raspberry Pi5 Active Cooler](https://www.adafruit.com/product/5815)
1 x Large (>= 128GB) Micro SSD card for operating system and recording storage
1 x [Waveshare 5" round display](https://www.waveshare.com/5inch-1080x1080-lcd.htm)
2 x [20 Kg/cm Servos](https://www.amazon.com/ANNIMOS-Digital-Waterproof-DS3218MG-Control/dp/B076CNKQX4)
4 x M4 10mm cap head bolts (for securing display to frame)
4 x M2 8mm cap head bolts + washers & nuts (for securing camera to frame)
4 x M2.5 22mm standoffs (for power deck + ventilation)
4 x M2.5 6mm standoffs + nuts + screws (for motor control board)


## Getting started

### Setup Python venv locally

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

### Run the build locally

You will need [nodejs](https://nodejs.org/en) and npm installed locally and in your path to build the
web app packages.

```sh
./build.sh
```

### Run the tests locally

You should be able to run tests locally.  Note that the webapp tests require `npm` to be in your `$PATH`.   If it is not (`which npm` returns nothing), you need to [install Node.js](https://nodejs.org/en/download).

```sh
./test.sh
```

## Install on onboard computer

### Flash Raspberry PI Bookworm OS (64-bit)

In the Raspberry PI Imager, for operating system, select the default, "Raspberry Pi OS (64-bit)"

Be sure to edit and apply settings for ssh user, password, wifi, etc.

After flashing, install SSD card in the Raspberry Pi and boot it.  `ssh` into the Pi and run the following commands:
```sh
sudo apt update
sudo apt full-upgrade
sudo reboot
```

## Upload to robot onboard computer

From your local development machine, if you have your ssh public key on the robot and in authorized_keys:
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

### Create and activate an onboard Python virtual environment

`ssh` into the Raspberry Pi.

Unfortunately some things like Picamera2 require the shipped python libs
so be sure to include `--system-site-packages` below when running on
Raspberry Pi 5.

Exporting `BB_ENV=production` will tell hardware interface modules of
basic_bot to expect to find the hardware to which they interface.  The
production environment will by default also limit log output to info
and errors. See [basic_bot Configuration] for how to override logging level.


```sh
cd ~
python -m venv --system-site-packages bb_env
echo "source ~/bb_env/bin/activate" >> ~/.bashrc
echo "export BB_ENV=production" >> ~/.bashrc
source .bashrc
```


### Install daphbot-due dependencies onboard

```sh
# needed by pyttsx3 text-to-speech
sudo apt install -y espeak
# needed by sounddevice
sudo apt install -y libportaudio2 portaudio19-dev

# needed on Bookworm os-lite
sudo apt install -y git
# needed to build RpiGPIO extension on os-lite
sudo apt install -y python3-dev
# needed to install picamera2 on os-lite
sudo apt install -y python3-libcamera python3-kms++ libcap-dev ffmpeg libsm6 libxext6
# needed to encode saved video for web
sudo apt install -y libx264-dev

```

With the python venv created above activated:
```sh
# upgrade pip
python -m pip install --upgrade pip

cd ~/daphbot_due
python -m pip install -r requirements.txt
```

Enable I2C under "Interface Options"
```sh
sudo raspi-config
```

Enable use of port 80 for web service:
```sh
sudo setcap CAP_NET_BIND_SERVICE=+eip /usr/bin/python3.11
```

At this point, you should be able to test video capture using basic_bot debug scripts:
```sh
python -m basic_bot.debug.test_picam2_opencv_capture
```

## Run the tests onboard

You should be able to run tests on the onboard computer:

``sh
./test.sh
```

Note that the webapp tests require `npm` to be in your `$PATH`.   If it is not (`which npm`  returns nothing), you need to [install Node.js](https://nodejs.org/en/download).

If you don't have node/npm installed you'll see output like this

```
(bb_env) bee@pi4:~/daphbot_due $ ./test.sh
+ set -e
+ python -m pytest -vv tests/
======================================================================= test session starts ========================================================================
platform linux -- Python 3.11.2, pytest-8.3.4, pluggy-1.5.0 -- /home/bee/bb_env/bin/python
cachedir: .pytest_cache
rootdir: /home/bee/daphbot_due
collected 1 item

tests/test_daphbot_service.py::TestDaphbotService::test_daphbot_service PASSED                                                                               [100%]

======================================================================== 1 passed in 3.81s =========================================================================
+ cd webapp
+ npm install
./test.sh: 10: npm: not found
```






