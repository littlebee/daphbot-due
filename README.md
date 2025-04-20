
# daphbot-due

This is an updated version of the [original daph-bot software](https://github.com/littlebee/daph-bot).

This repo is also an example of how to use the [basic_bot framework](https://github.com/littlebee/basic_bot).

## Status

This is a *work in progress*.

### April 19, 2025

Mostly working on the physical design + new onboard UI for the 5" display

See the full update here:  https://github.com/littlebee/daphbot-due/blob/main/docs/EngineeringLog.md


## Hardware

1 x [Raspberry Pi5 8GB](https://www.adafruit.com/product/5813) (see below for OS + setup needed)
1 x [Raspberry Pi5 Active Cooler](https://www.adafruit.com/product/5815)
1 x Large (>= 128GB) Micro SSD card for operating system and video recording storage
1 x Motor controller (TBD: Which one?  The one I'm currently using isn't made any more, but any based on the PCA9685 servo controller will work with the software.  Also don't need 16 channel controller, maybe a smaller 2 or 4 channel servo controller would work.
1 x [Waveshare 5" round display](https://www.waveshare.com/5inch-1080x1080-lcd.htm)
1 x [55mm ID x 78mm OD thust bearing](https://www.amazon.com/dp/B07GC7VWMM)
2 x [20 Kg/cm Servos](https://www.amazon.com/ANNIMOS-Digital-Waterproof-DS3218MG-Control/dp/B076CNKQX4)

### Power
1 x [12-24V to 5V 5A buck transformer](https://www.amazon.com/dp/B07XXWQ49N?ref=ppx_yo2ov_dt_b_fed_asin_title) for using a 12V power source and providing power to Raspberry Pi 5, amp and motors.
1 x [Coiled 2ft USB A to C connector](https://www.amazon.com/dp/B0DPS4LRDW?ref=ppx_yo2ov_dt_b_fed_asin_title&th=1) for connecting the buck transformers USB-A to the Raspberry Pi5 power connector.

### Audio
1 x [3.7W stereo amplifier](https://www.adafruit.com/product/987)
2 x [3W 4Ohm speakers](https://www.adafruit.com/product/4445)
2 pair (m/f) 2.54mm JST 2 pin connector for speakers and amp.
37 cm length of 22awg 3 wire cable to connect audio output from display to amp
2.5mm audio jack male.
1 x [90 degree USB 3.0 Right angle up/down Adapter](https://www.amazon.com/dp/B0D47TSTV9?ref=ppx_yo2ov_dt_b_fed_asin_title&th=1) for connecting USB Microphone
1 x [USB Lavalier Microphone](https://www.amazon.com/dp/B074BLM973?ref=ppx_yo2ov_dt_b_fed_asin_title&th=1)

### Nuts, Bolts, connectors
4 x M4 8mm cap head bolts for securing display to frame
8 x M4 14mm cap head bolts for securing servos
4 x M4 12mm bolts w/ nuts for attaching the tilt arm to the display frame
4 x M3 8mm tapered head bolts for securing turntable and display arm to servo arms
8 x M3 8mm self tapping screws for securing speakers to pedestal
4 x M2 8mm cap head bolts + washers & nuts (for securing camera to frame)
2 x M2 8mm self tapping screws for securing amplifier to pedestal
4 x M2.5 8mm self tapping screws for securing the motor controller to the pedestal
4 x M2.5 6mm machine screws for securing the pi 5 to the 5" display
2 x 3 pin [Dupont connectors](https://www.amazon.com/Pzsmocn-Connector-Compatible-connection-Internet/dp/B096D849KN/ref=sr_1_3) (2.54mm pitch) with male inserts for servo cables

## Building

The instructions below are **very** order sensitive.

### Attach Pi 5 active cooler to the Pi 5

### Attach Pi5 to the 5" LCD display

  - First attach Pi 5 to the posts on the back of the display using provided 2.54mm hardware
  - Connect the HDMI 0 port on the Pi 5 to the HDMI input on the display using the appropriate HDMI connector provided with the display unit
  - Connect bottom right USB port on the Pi to the usb port on the display using the connector provided with the display

### Attach tilt arm to display frame
  - use 4 x M3 12mm.  torque until bolt is 1 thread above bolt.

### Attach display frame to display
  - use 4 x M4 8mm.  need to really torque them down until the frame is tight on the display.

### Install pedestal servo
  - trim servo cable down to 3.5 inches (9 cm) and install new 3 pin dupont connecter with with male inserts.
  - using 4 x M4 14mm nuts and bolts, secure motor to pedestal block as shown
  - trim servo cable down to 7 inches (18 cm) length and install new 3 pin dupont connecter with with male inserts.

### Install tilt servo
  - trim servo cables
  - do not attach tilt arm to tilt servo yet

### Wire motor controller
  - connect motor controller power to 5V screwdown output on buck converter
  - connect servos to motor controller
  - connect QT qwick cable from motor controller to Raspberry Pi 5
  - connect Coiled USB A->C cable to buck converter

### Set servos to 90 degrees
  - You will need to have at least the basic_bot python package installed
```shell
# install basic_bot
python -m pip install git+https://github.com/littlebee/basic_bot.git@main

# preset motor angles
DEBUG_MOTORS=1 python -m basic_bot.commons.servo_pca9685 0 90
DEBUG_MOTORS=1 python -m basic_bot.commons.servo_pca9685 1 90
```

### Audio
- Solder audio-in 3 wire cable.  Use a piece to solid wire to short the L- and R- with the single ground wire from the audio in cable.
- Solder a tiny piece of solid wire across the 15db gain pads.


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






