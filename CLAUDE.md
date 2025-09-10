# CLAUDE.md - daphbot-due Project Context

## Project Overview

**daphbot-due** is a robotic pet deterrent system built on the [basic_bot framework](https://github.com/littlebee/basic_bot). This is an updated version of the original daph-bot software and serves as an example implementation of the basic_bot framework.

### Core Functionality
- **Pet Detection**: Uses computer vision to detect cats and dogs
- **Automated Response**: Plays recorded "off"/"down" messages when pets are detected
- **Target Tracking**: Pan/tilt servo system tracks detected pets
- **Onboard UI**: 5" round display (1080x1080) with interactive interface showing robot status and eyes
- **Audio Feedback**: Text-to-speech and recorded message playback

## Architecture

### basic_bot Framework Dependency
This project is **heavily dependent** on the [basic_bot framework](https://github.com/littlebee/basic_bot), which provides:

#### Central Hub Service
- **Websockets-based pub/sub protocol**: Ultra-lightweight JSON message passing
- **Global state management**: Shared state across all services via `HubState` class
- **Inter-service communication**: Services publish/subscribe to state changes
- **Process management**: Each service runs as an independent background process

#### Core Services Provided by basic_bot
1. **central_hub**: Core communication hub with websockets pub/sub
2. **servo_control**: Hardware interface for servo motors (PCA9685-based)
4. **vision**: Computer vision with OpenCV and TensorFlow Lite object detection
5. **system_stats**: System monitoring (CPU, temperature, etc.)

### Project-Specific Services
1. **daphbot**: Main behavior logic (`src/daphbot_service.py`)
   - Subscribes to "recognition" from vision service
   - Publishes "primary_target" state
   - Handles pet detection and response logic

2. **onboard_ui**: Display interface (`src/onboard_ui_service.py`)
   - Pygame-based UI for 5" round display
   - Subscribes to "system_stats" and "primary_target"
   - Renders robot eyes, system info, and interactive elements


3. **web_server**: HTTP/websocket server for web interface. Specific to this project, the webserver and associated React SPA provide
- UI for remotely controlling the robot, remotely seeing the video feed from the robot with superimposed bounding boxes for objects recognized.
- UI for viewing recorded video files
- UI for viewing central_hub states

## Configuration Files

### basic_bot.yml
Primary service configuration defining:
- **Service definitions**: Each service's run command and environment
- **Environment variables**: Different settings for development vs production
- **Service dependencies**: How services interact with each other

Key services configured:
```yaml
services:
  - name: "central_hub"      # Core communication hub (basic_bot)
  - name: "web_server"       # Web interface from (daphbot-due)
  - name: "servo_control"    # Motor control (basic_bot)
  - name: "vision"           # Object detection (basic_bot)
  - name: "system_stats"     # System monitoring (basic_bot)
  - name: "daphbot"          # Pet detection logic and behavior (daphbot-due)
  - name: "onboard_ui"       # Display interface shown on the robots round 1080p screen
```

### servo_config.yml
Servo hardware configuration read by basic_bot servo_control:
- **Pan servo**: Channel 0, 180° range
- **Tilt servo**: Channel 1, 180° range, 65° minimum angle

### Python Configuration
- **requirements.txt**: Dependencies including basic_bot from GitHub
- **mypy.ini**: Type checking configuration
- **.flake8**: Code style configuration

## Hardware Platform

### Target Hardware
- **Raspberry Pi 5 (8GB)** with active cooling
- **Waveshare 5" round display** (1080x1080)
- **Servo motors**: 2x 20 Kg/cm servos for pan/tilt
- **Motor controller**: PCA9685-based servo controller
- **Audio system**: 3.7W stereo amplifier with speakers
- **Camera**: For computer vision (configurable module)
- **Power**: 12-24V to 5V buck converter system

### Environment Setup
- **Production**: `BB_ENV=production` enables hardware interfaces
- **Development**: Mock hardware interfaces for testing
- **Python venv**: Required with `--system-site-packages` on Pi

## Operational Scripts

### Service Management
- **start.sh**: Activates venv, sets production env, calls `bb_start`
- **stop.sh**: Calls `bb_stop` to stop all services
- **restart.sh**: Stop, wait 2 seconds, then start services
- **ps.sh**: Shows running basic_bot processes

### Development Tools
- **test.sh**: Runs pytest for Python tests + npm tests for webapp
- **build.sh**: Builds webapp components
- **upload.sh**: SCP deployment to robot hardware

## Development Guidelines

### Communication Patterns
Services communicate via the central hub using JSON messages:
```python
# Subscribe to state changes
hub_state = HubState({"primary_target": None})
hub_state_monitor = HubStateMonitor(...)

# Publish state updates
hub_state.update_state({
    "primary_target": {
        "classification": "cat",
        "bounding_box": [x, y, w, h],
        "confidence": 0.99
    }
})
```

### Key Directories
- **src/**: Python source code
  - **commons/**: Shared utilities (messages, data processing, tracking)
  - **onboard_ui/**: Display interface components
- **webapp/**: Node.js/React web interface
- **tests/**: Python and JavaScript test suites
- **docs/**: Project documentation
- **logs/**: Runtime log files
- **pids/**: Process ID files for service management

### Testing
- **Python**: pytest with verbose output
- **JavaScript**: npm test for webapp
- **Hardware testing**: Debug scripts for camera, motors, etc.

### Dependencies
- **Python 3.9+** required
- **Node.js v20.18+** for webapp
- **Hardware libraries**: Picamera2, adafruit-circuitpython-vl53l1x
- **Audio/Video**: pygame, pyttsx3, sounddevice, opencv
- **System**: Requires I2C enabled, port 80 capabilities

## Environment Variables

### Key Variables
- **BB_ENV**: "production" for hardware, unset for development
- **BB_LOG_ALL_MESSAGES**: Enable verbose logging of all websockets and http messages sent and recieved by a service
- **BB_TFLITE_THREADS**: TensorFlow Lite thread count
- **BB_OBJECT_DETECTION_THRESHOLD**: Confidence threshold (default 0.6)
- **D2_OUI_RENDER_FPS**: Onboard UI frame rate (default 30, recommended 20)

### Platform-Specific Paths
- **Pi deployment**: `/home/pi/daphbot_due/`
- **Local development**: Current working directory
- **Virtual environment**: `~/bb_env/` on target hardware

## Common Commands

### Development
```bash
# Setup local environment
python -m venv bb_env && source bb_env/bin/activate
pip install -r requirements.txt

# Run tests
./test.sh

# Build project
./build.sh
```

### Deployment
```bash
# Upload to robot
./upload.sh pi5.local

# On robot - start services
./start.sh

# Monitor processes
./ps.sh

# View logs
tail -f logs/daphbot.log
```

### Hardware Testing
```bash
# Test camera
python -m basic_bot.debug.test_picam2_opencv_capture

# Test servos
DEBUG_MOTORS=1 python -m basic_bot.commons.servo_pca9685 0 90
```

This project demonstrates a complete robotics application using the basic_bot framework's service-oriented architecture with real-time communication and hardware integration.