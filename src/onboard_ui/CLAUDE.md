# CLAUDE.md - Onboard UI Components

This directory contains the Pygame-based UI components for daphbot-due's 5" round display (1080x1080 resolution).

## Architecture

The onboard UI system is managed by `onboard_ui_service.py` and consists of modular components that render different aspects of the robot's interface.

### Core Components

- **eyes.py**: Animated robot eyes with expressive behaviors
  - Responds to target detection (people, cats, dogs)
  - Implements blinking, pupil movement, and emotional states
  - Eye states: RESTING, ALERT, TRACKING based on primary_target

- **background.py**: Dynamic background rendering
- **video_renderer.py**: Video stream display integration
- **network_info.py**: Network status and connectivity display
- **cpu_info.py**: System performance metrics display
- **styles.py**: Shared styling constants and colors

### Renderables System

The `renderables/` directory contains the rendering framework:

- **renderables.py**: Base renderable component system
- **sequenced_renderables.py**: Time-based sequential rendering for animations

## State Integration

The onboard UI subscribes to hub_state keys:
- `system_stats`: CPU usage, temperature, hostname from system_stats service
- `primary_target`: Current tracking target from daphbot_service
- `daphbot_mode`: Operating mode (autonomous vs manual)

## Display Specifications

- **Resolution**: 1080x1080 (5" round display)
- **Center Point**: (540, 450) - offset for round display
- **Render FPS**: Defined by `D2_OUI_RENDER_FPS` constant
- **Touch Input**: Supports touch events via `translate_touch_event`

## Development Guidelines

### Eye Animations
- Eye center at (540, 450) with 250x500 dimensions
- Pupil radius: 120 (resting) to 100 (alert)
- Blink timing: 0.05-5.0 second intervals
- Target tracking modifies pupil position and eye state

### Adding New Components
1. Create component class in appropriate module
2. Integrate with renderables system for frame updates
3. Subscribe to relevant hub_state keys if needed
4. Follow existing styling patterns from styles.py

### Performance Considerations
- Components render at fixed FPS to maintain smooth animation
- Use efficient Pygame drawing operations
- Consider round display masking for visual elements

The onboard UI provides the robot's "face" and primary user interface, making expressive behaviors and system feedback visible on the physical display.