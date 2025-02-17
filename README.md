
# daphbot-due

This is an updated version of the [original daph-bot software](https://github.com/littlebee/daph-bot).

This repo is also an example of how to use the [basic_bot framework](https://github.com/littlebee/basic_bot).

The hardware is essentially the same, only upgraded:

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

### Run the tests locally
You should be able to run tests locally.  Note that the webapp tests require `npm` to be in your `$PATH`.   If it is not (`which npm` returns nothing), you need to [install Node.js](https://nodejs.org/en/download).

``sh
./test.sh
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


### install adafruit blinka for Braincraft hat
See also: https://learn.adafruit.com/circuitpython-on-raspberrypi-linux/installing-circuitpython-on-raspberry-pi

```sh
sudo raspi-config nonint do_i2c 0
sudo raspi-config nonint do_spi 0
sudo raspi-config nonint do_serial_hw 0
sudo raspi-config nonint do_ssh 0
sudo raspi-config nonint do_camera 0
sudo apt-get install -y i2c-tools libgpiod-dev python3-libgpiod
pip3 install --upgrade adafruit-blinka
```

### Install audio drivers for Braincraft hat
See Also: https://learn.adafruit.com/adafruit-braincraft-hat-easy-machine-learning-for-raspberry-pi/audio-setup)

``` sh
cd ~
sudo apt-get install -y git
git clone https://github.com/HinTak/seeed-voicecard
cd seeed-voicecard
git checkout v6.6
sudo ./install.sh
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

It will ask you to reboot; press enter and allow it to reboot. After reboot, ssh back into the onboard computer and disable be sure that raspi-config is set to boot to console:
```sh
sudo raspi-config
```
Select "1 System Options"
Select "S5 Boot / Auto Login"
Select "B1 Console"
Press Tab key twice to select "Finish"
Answer "Yes" to "Would you like to reboot"


After rebooting, ssh back into the onboard computer and run alsamixer:
```sh
sudo alsamixer
```
Use F6 to select the Seeed voice card and make sure that the left and right speaker volumes are maxed.  Esc to exit.


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






