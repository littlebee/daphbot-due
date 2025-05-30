
### Apr 19, 2025 - All new hardware design

We have a new hardware plaform!  💥

New design around using the 5" round waveshare display **almost** MVP ("almost" as in only a true nerd could find it viable).   [See the video](https://github.com/littlebee/daphbot-due/blob/main/docs/media/d2Apr25.mp4) showing off the new setup using a bonified thrust bearing turntable and motor controllers and audio amp + speakers in the pedestal.


### Apr 2, 2025 - Lots of design work and physical prototypes

Two prototypes of a case to be exact.  The first had a very low profile and had all of the electronics - sbc, motor controller, amp, psu etc in the display.  This had a number of ugly spots:

- Increased weight of the head and additional motor strain;
- out of room, still needed to have sensors and speakers added;
- decreased air circulation to the onboard computer - there was a deck on risers above the Pi5 fan assembly;
- even with the changes below, resting the tilt servo + weight of display+cpu felt like too much shearing force on the pan motor axis.

The prototype-2 design (most current):
- moved speakers, amp, motor controller, and power supply to pedestal;
- added [55mm (ID) thrust bearing](https://www.amazon.com/dp/B07GC7VWMM?ref_=ppx_hzsearch_conn_dt_b_fed_asin_title_5&th=1) in neck to bear the weight of the head;
- modified the head design to add [4x VL53L1X laser range](https://www.amazon.com/dp/B0DC6M6G7W?ref_=ppx_hzsearch_conn_dt_b_fed_asin_title_1) sensors to act as peripheral vision; these replace the function of the two PIR sensors, to allow faster detection of motion that is outside the POV of the camera.  The VL53L1X is purported to have a 6M range.
- The laser range sensors are hard wired to a fixed I2C address so adding a [4 channel I2C multiplexer](https://www.adafruit.com/product/5664?gQT=2) (mux) was necessary.  The range sensors and mux are very light weight and mounted to the display frame.

As for the software, a service to control the head and display face has been started with still more work to do.  The current version in main is just some system stats info and an animated eyeball that reacts and tracks any pet or person targets detected.  (It's kinda cool and funny to watch).  Still needs to be able to configure the bot/networking from the onboard UI.

Also quite a bit of work done the React webapp.  We now have [click and drag video scrubbing](https://github.com/littlebee/daphbot-due/pull/22) that allows you to quick view video segments that are automatically recorded and stored on the robot any time it sees a human or pet.


### Feb. 19, 2025 - The Pivot

Let's see, I started at, "I'm going to use the exact same same design and hardware as OG Daphbot and just update the robotics and behavior software."   I should have known that wouldn't work.  Getting all of the things working on a fresh install of (pick any combination) Pi4 or Pi5, with either Raspian Bullseye or Debian Bookworm has proven challenging.

Also, after seeing the impressive performance boost that the Raspberry Pi5 gives TensorFlow-lite object detection ([Pi4](https://github.com/littlebee/scatbot-edge-ai-shootout/blob/main/docs/media/pi4b4gb_results/pi4b4gb_chart.png) = ~15fps without Coral TPU; Pi5 without TPU = **27fps**),  I knew I had to have it.  Although 15fps is probably fine for this application, at 27fps we can do things like real time object tracking (move the bot to keep the object centered in frame).

The biggest challenge is, was always, the [Adafruit Braincraft Hat](https://www.adafruit.com/product/4374).  When it worked well, as it does on [Scatbot](https://github.com/littlebee/scatbot) (Pi4 Bullseye build), it provides 5 key components:

1. Audio - a Seeed Studio 2 mic inputs and 3w stereo amplifier for output.
2. Onboard UI display - a 1.5" 240x240 display is used to display vital system info and a menu for configuration and setup.
3. User inputs - a 4 position joystick and buttons for operating a menu.
4. Fan for cooling the CPU - this becomes needed when running all 4 CPU cores at max during object detection.
5. Three RGB LEDs that are used for police lights and L/R motion indicators.

On Raspberry Pi5, however,

1. Installing the Seeed voice card audio drivers wipes out the OS camera capture devices.  [I asked Adafruit for help](https://forums.adafruit.com/viewtopic.php?t=216758) with this issue, but I don't expect to hear back.
2. Onboard UI display: I was able to get this working although this is another piece that feels brittle.
3. User inputs - these are simply mapped to GPIO pins and pretty hard to screw up.
4. The Fan is a non starter (see [NOTE](https://learn.adafruit.com/adafruit-braincraft-hat-easy-machine-learning-for-raspberry-pi/fan-service-setup) at top of the setup page - only available on Pi4).
5. Lights work on Pi5

So that leaves us with a tiny display, a couple of buttons and 3 leds.  We will need a USB audio solution and we will need to use an official Pi5 cooling fan + heatsink.

What would a solution look like that didn't use the Braincraft?

What if we replaced the functionality of the 1.5" display, 3 LEDs and 5 button input with a 4 or 5" round touchscreen display that was HDMI driven and didn't need a brutal and brittle install?

This is the pivot:  https://www.amazon.com/waveshare-Resolution-10-Point-Compatible-Raspberry/dp/B0C14CZ2GG?source=ps-sl-shoppingads-lpcontext&ref_=fplfs&psc=1&smid=A50C560NZEBBE

Let's see where this takes us, but I'm also considering a radical redesign of the case with a simpler two motor pan/tilt that encases the display it keeps it facing the current tracked target.   I could give it a face that showed expressions!  The forward and backward motion capability that a wheeled design provides is problematic for a robot meant to sit on a counter.  Moving forward or backward poses the risk that it will run off the counter top.  Anything other than rotational movement also makes it difficult to reset back to an accurate starting position.

