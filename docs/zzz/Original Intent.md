--The hardware is essentially the same, only upgraded--:

- 2 PIR motion sensors angled so that their FOV is a little overlapping with the left and right edges of the camera
- Raspberry Pi 5 8GB with Debian Bookworm installed
- Raspberry Pi camera module 3
- [Adafruit Braincraft Hat](https://www.adafruit.com/product/4374) provides LCD, sound amplifier and microphone
- 1 Small [3W 4ohm speaker](https://www.adafruit.com/product/3351) for sound
- 2 wheel drive; caster wheel front
- [Adeept rpi motor control hat](https://www.adeept.com/rpi-motor-hat_p0133.html).  It has a number of features in addition to a 2 channel motor controller.  It also has a DC-DC step down that can accept any DC voltage between 5-20VDC.  The original used a separate in-line BEC stepdown.

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

These instructions are for Pi5 Bookworm with Adafruit Braincraft hat.

TODO: save move these instructions to the freezer under docs/zzzz and rewrite them for the 5" touch display design.

### ### Setup Python venv locally

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

### Run the tests locally
You should be able to run tests locally.  Note that the webapp tests require `npm` to be in your `$PATH`.   If it is not (`which npm` returns nothing), you need to [install Node.js](https://nodejs.org/en/download).

```sh
./test.sh
```


## Install on onboard computer

### Flash Raspberry PI Bookworm (OS-lite)

In the Raspberry PI Imager, for operating system, under "Raspberry Pi OS (other)", select
"Raspberry Pi OS Lite (64bit)"

Be sure to edit and apply settings for ssh user, password, wifi, etc.

After flashing, install ssd card in the Raspberry Pi and boot it.  ssh into the Pi and run the following commands:
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

### Create and activate a Python virual environment

Unfortunately some things like Picamera2 require the shipped python libs
so be sure to include `--system-site-packages` below when running on
Raspberry Pi 4 or 5.

```sh
cd ~
python -m venv --system-site-packages bb_env
echo "source bb_env/bin/activate" >> .bashrc
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

```

With the python venv created above activated:
```sh
# upgrade pip
python -m pip install --upgrade pip

cd ~/daphbot_due
python -m pip install -r requirements.txt
```

At this point, you should be able to test video capture using basic_bot debug scripts:
```sh
python -m basic_bot.debug.test_picam2_opencv_capture
```


### Install adafruit blinka for Braincraft hat
See also: https://learn.adafruit.com/circuitpython-on-raspberrypi-linux/installing-circuitpython-on-raspberry-pi

```sh
sudo raspi-config nonint do_i2c 0
sudo raspi-config nonint do_spi 0
sudo raspi-config nonint do_serial_hw 0
sudo apt install -y i2c-tools libgpiod-dev python3-libgpiod
pip3 install --upgrade adafruit-blinka
```

### DO NOT INSTALL audio drivers for Braincraft hat
See Also: https://learn.adafruit.com/adafruit-braincraft-hat-easy-machine-learning-for-raspberry-pi/audio-setup)


Installing the audio drivers for Braincraft as per the instructions will remove the camera capture device.  :/  I [posted in the Adafruit forums](https://forums.adafruit.com/viewtopic.php?t=216758), but I'm not expected a response.  I guess we'll use a separate usb speaker and microphone.

``` sh
# cd ~
# sudo apt install -y git
# git clone https://github.com/HinTak/seeed-voicecard
# cd seeed-voicecard
# git checkout v6.6
#sudo ./install.sh
```

### Install Braincraft TFT Display

See also: https://learn.adafruit.com/adafruit-braincraft-hat-easy-machine-learning-for-raspberry-pi/display-kernel-module-install


From your python virtual environment:
```sh
cd ~
python -m pip install --upgrade adafruit-python-shell click
git clone https://github.com/adafruit/Raspberry-Pi-Installer-Scripts.git
cd Raspberry-Pi-Installer-Scripts
sudo -E env PATH=$PATH python3 adafruit-pitft.py --display=st7789v_bonnet_240x240 --rotation=0 --install-type=mirror
```

It will ask you to reboot; press enter and allow it to reboot. After reboot, ssh back into the onboard computer

```sh
sudo alsamixer
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




