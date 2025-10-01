
# daphbot-due

DaphbotDue (D2 for short) is a pet (or human) monitoring robot that detects when a pet or human is present in the field of view of it's onboard camera.

When a pet or human is detected, Daphbot can be configured to play an audio file and optionally start recording.

D2 also sports a web UX for remotely viewing the live video streams from the robot, viewing recorded videos, and manually controlling the robots pan and tilt motors.  When in "Manual" behavior mode, D2 will also optionally stream the web users camera and microphone to the onboard display and speakers and allow the web user telepresense.

D2 is an example of how to use the [basic_bot framework](https://github.com/littlebee/basic_bot).


## Status

This is a *work in progress*.

Latest update: We have telepresence! 🎉

See the full update here:  https://github.com/littlebee/daphbot-due/blob/main/BLOG.md


## Hardware

### Compute

| Qauntity | Description |
| -------- | ----------- |
| 1 | [Raspberry Pi5 8GB](https://www.adafruit.com/product/5813) (see below for OS + setup needed) |
| 1 | [Raspberry Pi5 Active Cooler](https://www.adafruit.com/product/5815) |
| 1 | [Raspberry Pi Camera Module 3](https://www.adafruit.com/product/5657) |
| 1 | Large (>= 128GB) Micro SSD card for operating system and video recording storage |
| 1 | Motor controller (TBD: Which one?  The one I'm currently using isn't made any more, but any based on the PCA9685  |servo controller will work with the software.  Also don't need 16 channel controller, maybe a smaller 2 or 4 channel servo controller would work.
| 1 | [Waveshare 5" round display](https://www.waveshare.com/5inch-1080x1080-lcd.htm) |

### Motion

| Qauntity | Description |
| -------- | ----------- |
| 1 | [55mm ID x 78mm OD thust bearing](https://www.amazon.com/dp/B07GC7VWMM) |
| 2 | [20 Kg/cm Servos](https://www.amazon.com/ANNIMOS-Digital-Waterproof-DS3218MG-Control/dp/B076CNKQX4) |

### Power

| Qauntity | Description |
| -------- | ----------- |
| 1 | [12-24V to 5V 5A buck transformer](https://www.amazon.com/dp/B07XXWQ49N?ref=ppx_yo2ov_dt_b_fed_asin_title) for using a 12V power source and providing power to Raspberry Pi 5, amp and motors. |
| 1 | [Coiled 2ft USB A to C connector](https://www.amazon.com/dp/B0DPS4LRDW?ref=ppx_yo2ov_dt_b_fed_asin_title&th=1) for connecting the buck transformers USB-A to the Raspberry Pi5 power connector. |

### Audio

| Qauntity | Description |
| -------- | ----------- |
| 1 | [3.7W stereo amplifier](https://www.adafruit.com/product/987) |
| 2 | [3W 4Ohm speakers](https://www.adafruit.com/product/4445) |
| 2 pair | (m/f) 2.54mm JST 2 pin connector for speakers and amp. |
| 37 cm | 22awg 3 wire cable to connect audio output from display to amp |
| 1 | [male 2.5mm, 3 connector,  audio jack](https://www.amazon.com/Replacement-Connector-YOUCHENG-Headphones-Headset/dp/B08GFY8B3K) |
| 1 | [90 degree USB 3.0 Right angle up/down Adapter](https://www.amazon.com/dp/B0D47TSTV9? |ref=ppx_yo2ov_dt_b_fed_asin_title&th=1) for connecting USB Microphone
| 1 | [USB Lavalier Microphone](https://www.amazon.com/dp/B074BLM973?ref=ppx_yo2ov_dt_b_fed_asin_title&th=1) |

### Nuts, Bolts, connectors

| Qauntity | Description |
| -------- | ----------- |
| 4 | M4 8mm cap head bolts for securing display to frame
| 8 | M4 14mm cap head bolts for securing servos
| 4 | M4 12mm bolts w/ nuts for attaching the tilt arm to the display frame
| 4 | M3 8mm tapered head bolts for securing turntable and display arm to servo arms
| 8 | M3 8mm self tapping screws for securing speakers to pedestal
| 14 | M3 8mm self tapping screws for pedestal cover
| 4 | M2 8mm cap head bolts + washers & nuts (for securing camera to frame)
| 2 | M2 8mm self tapping screws for securing amplifier to pedestal
| 4 | M2.5 8mm self tapping screws for securing the motor controller to the pedestal
| 4 | M2.5 6mm machine screws for securing the pi 5 to the 5" display
| 2 | 3 pin [Dupont connectors](https://www.amazon.com/Pzsmocn-Connector-Compatible-connection-Internet/dp/B096D849KN/ref=sr_1_3) (2.54mm pitch) with male inserts for servo cables

## Assembling the Robot

The instructions below are **very** order sensitive.

### Attach Pi 5 active cooler to the Pi 5

### Attach Pi5 to the 5" LCD display

  - First attach Pi 5 to the posts on the back of the display using provided 2.54mm hardware.
  - Connect the HDMI 0 port on the Pi 5 to the HDMI input on the display using the appropriate HDMI connector provided with the display unit.
  - Connect bottom right USB port on the Pi to the usb port on the display using the connector provided with the display.

### Attach tilt arm to display frame

  - Use 4 x M3 12mm; torque until bolt is 1 thread above bolt.

### Attach display frame to display

  - Use 4 x M4 8mm; need to really torque them down until the frame is tight on the display.

### Install pedestal servo

  - Trim servo cable down to 3.5 inches (9 cm) and install new 3 pin dupont connecter with with male inserts.
  - Using 4 x M4 14mm nuts and bolts, secure motor to pedestal block as shown.
  - Trim servo cable down to 7 inches (18 cm) length and install new 3 pin dupont connecter with with male inserts.

### Install tilt servo

  - Trim servo cables to about two inches longer than needed to reach the motor controller.
  - Do not attach tilt arm to tilt servo yet.

### Wire motor controller

  - Connect motor controller power to 5V screwdown output on buck converter.
  - Connect servos to motor controller - "pan" servo is connected to channel 0 on the controller; "tilt" servo to channel 1.
  - Connect QT qwick cable from motor controller to Raspberry Pi 5.
  - Connect Coiled USB A->C cable to buck converter.

### Set servos to 90 degrees

You will need to have at least the basic_bot python package installed
```shell
# install basic_bot on Raspberry Pi via ssh
python -m pip install git+https://github.com/littlebee/basic_bot.git@main

# preset motor angles
DEBUG_MOTORS=1 python -m basic_bot.commons.servo_pca9685 0 90
DEBUG_MOTORS=1 python -m basic_bot.commons.servo_pca9685 1 90
```

### Audio

- Solder audio-in 3 wire cable to the male 2.5mm 3 pole audio jack.
- Use a piece to solid wire to short the L- and R- with the single ground wire from the audio in cable.
- Solder the other end of the audio-in 3 wire cable to L+ (white), R+ (red) and L- (black) on the audio amplifier
- Solder a tiny piece of solid wire across the 15db gain pads on audio amplifier.
- Connect the male 2.5mm audio jack to the audio output on the display panel
- Attach the audio amplifier to the back of the pedestal base using 2 M2 8mm self tapping screws.

### Camera

- Attach camera cable to camera.
- Feed camera cable **behind** the display frame using the passthrough provided between frame and the display.
- Attach camera to display frame using 4 M2 8mm cap head bolts and nuts.
- Attach camera cable to Raspberry Pi.
- Tuck camera cable into loop provided in frame.

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

Note that the `./upload.sh` script uses `rsync` to copy files which requires SSH.  To test that ssh is setup locally and on your bot, first test that you can use ssh to login like this:

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

## Start services on the robot

From `ssh` shell, the the python virtual environment created above active,

```sh
cd daphbot-due
./start.sh
```

This will start all of the services on the robot in the background.  To stop the services:
```sh
./stop.sh
```

## Connect to the web app

With the services running on the robot, you should be able to use any web browser to connect to the robot.  For example, if your robot is connected to the local network and named "my_robot",  http://my_robot.local

The [web_service service](https://littlebee.github.io/basic_bot/Api%20Docs/services/web_server/)) serves the request.

![D2 web app screenshot](https://github.com/littlebee/daphbot-due/blob/main/docs/media/d2_web_UX.png)

## Debugging

The logs are the place to start if something isn't working.   Each service will create a log file in the `~/daphbot-due/logs` directory.  By viewing those log, you should be able to see all errors and warnings if something is not configured correctly.

