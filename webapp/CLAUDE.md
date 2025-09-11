# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the webapp component of daphbot-due.

## Overview

The webapp is a React/TypeScript single-page application that provides a web interface for monitoring and controlling the daphbot robot. It connects to the robot's central hub via WebSocket to receive real-time state updates and send control commands.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling and dev server
- **Vitest** for testing with jsdom environment
- **ESLint** with TypeScript and React plugins
- **CSS Modules** for component styling
- **WebSocket** for real-time communication with robot

## Architecture

### State Management
The app uses a custom WebSocket-based state management system that connects to the robot's central hub:

- `src/util/hubState.ts` - Central state management, WebSocket connection, and hub communication
- Real-time bidirectional communication with the robot's services
- Automatic reconnection and connection monitoring
- URL parameters for debugging (`?debug=messages`) and custom hub host (`?hubHost=192.168.1.100`)

### Key Components

- **App.tsx** - Main application component with layout and mode switching
- **VideoFeed.tsx** - Live video stream from robot camera
- **ObjectsOverlay.tsx** - Overlays bounding boxes on detected objects (people, cats, dogs)
- **PanTilt.tsx** - Manual servo control interface (manual mode only)
- **MenuLeft/** - Behavior mode selection (autonomous vs manual)
- **VideoViewer/** - Video file viewer for recorded clips

### Hub State Interface
The webapp subscribes to these hub state keys:
- `recognition` - Object detection results with bounding boxes (people, cats, dogs)
- `primary_target` - Current target being tracked
- `system_stats` - CPU, temperature, RAM usage
- `servo_config` - Servo hardware configuration
- `servo_angles` - Current servo positions
- `daphbot_mode` - Robot behavior mode (auto/manual)

## Development Commands

### Setup
```bash
npm install
```

### Development
```bash
# Start dev server (default: localhost:5173)
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Run tests
npm run test

# Preview production build
npm run preview
```

### Connection Configuration
The webapp connects to the robot's central hub on port 5100. For development:

- Default: connects to same host as webapp
- Custom host: `http://localhost:5173?hubHost=192.168.1.100`
- Debug messages: `http://localhost:5173?debug=messages`

## File Structure

```
src/
├── App.tsx                    # Main application
├── main.tsx                   # React entry point
├── components/                # Reusable UI components
│   ├── VideoFeed.tsx         # Camera stream display
│   ├── ObjectsOverlay.tsx    # Object detection overlays
│   ├── PanTilt.tsx           # Servo manual control
│   ├── Button.tsx            # Styled button component
│   └── Dialog.tsx            # Modal dialog component
├── MenuLeft/                  # Mode selection sidebar
├── VideoViewer/              # Video playback interface  
└── util/                     # Utilities and state management
    ├── hubState.ts           # WebSocket connection and state
    ├── hubMessages.ts        # Message sending helpers
    ├── angleUtils.ts         # Servo angle calculations
    └── dateUtils.ts          # Date/time formatting
```

## Testing

The webapp uses Vitest with React Testing Library:
- Test files: `*.test.ts` or `*.test.tsx`
- Setup: `vitest.setup.ts` configures jsdom environment
- Current coverage: 4 test files

## Styling

- **LCARS Theme**: Star Trek-inspired UI design (`public/lcars.css`)
- **CSS Modules**: Component-scoped styling (`.module.css` files)
- **Responsive**: Optimized for desktop and tablet viewing

## WebSocket Communication

The webapp communicates with the robot using JSON messages:

```typescript
// Subscribe to all state updates
{ type: "subscribeState", data: "*" }

// Send control commands
{ type: "updateState", data: { daphbot_mode: "manual" } }

// Request current state
{ type: "getState" }
```

Connection monitoring includes automatic ping/pong heartbeat and reconnection logic.

## Mobile/Tablet Considerations

### Design Constraints (GitHub Issue #33)
The webapp is specifically designed for tablet-sized devices with these considerations:

- **Touch-First Design**: All interactions must work without hover effects
- **Large Click Targets**: Buttons and controls sized for finger interaction
- **Tablet Optimization**: Primary target is tablet-sized mobile devices
- **No Hover Dependencies**: Avoid UI patterns that require hover states

### Current Limitations
Based on GitHub issue #33, several components need mobile/tablet improvements:

- **VideoViewer**: Some interactions still need mobile/tablet optimization
- **Timeline Interactions**: Limited touch gesture support
- **Range Selection**: No click-and-drag date range selection
- **Settings Persistence**: No localStorage for user preferences

### Planned Mobile Improvements
1. **✅ Converted VideoViewer**: From modal overlay to in-page component (completed)
2. **Enhanced Touch Support**: Better gesture handling for timeline navigation
3. **Responsive Controls**: Larger touch targets for all interactive elements
4. **Settings Persistence**: localStorage integration for user preferences
5. **Touch-Friendly Timeline**: iMovie-inspired design optimized for touch

### Development Guidelines
When working on webapp components:
- Test on tablet-sized screens (iPad dimensions)
- Ensure all interactions work with touch
- Use minimum 44px touch targets (iOS guidelines)
- Avoid hover-only functionality
- Consider one-handed tablet use patterns

## Development Notes

- Video stream is served on port 5801 (separate from hub WebSocket on 5100)
- Manual mode enables servo controls, autonomous mode hides them
- Object detection overlays require camera resolution matching
- Hub connection status shown in header (online/offline/connecting)