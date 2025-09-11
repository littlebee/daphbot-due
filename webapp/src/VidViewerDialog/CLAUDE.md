# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the VidViewerDialog component of daphbot-due.

## Overview

The VidViewerDialog is a comprehensive video playback interface that allows users to browse and watch recorded videos from the robot's camera. It provides timeline-based navigation, filtering by date ranges, and thumbnail previews.

## Video Recording & Storage System

### Recording Process
Videos are automatically recorded by the `daphbot_service` when people or pets are detected:

1. **Trigger**: When a person, cat, or dog is detected, `daphbot_service.py` calls `record_video()`
2. **Duration**: Each recording is 10 seconds (`RECORDED_VIDEO_DURATION = 10`)
3. **Throttling**: Only records if 10+ seconds have passed since last recording
4. **Backend**: Uses `basic_bot.commons.vision_client.send_record_video_request()`

### File Generation (basic_bot vision service)
The recording process creates multiple files per video:

```python
# Filename format: YYYYMMDD-HHMMSS (e.g., "20240315-143022")
base_filename = "20240315-143022"

# Generated files:
"20240315-143022.mp4"     # H.264 encoded video (web-compatible)
"20240315-143022.jpg"     # Small thumbnail (94x70px)
"20240315-143022_lg.jpg"  # Large thumbnail (640x480px)
"20240315-143022_raw.mp4" # Raw OpenCV capture (deleted after conversion)
```

### Storage Location
- **Production**: `BB_VIDEO_PATH` environment variable (typically `/home/pi/basic_bot_videos/`)
- **Development**: Configurable via basic_bot constants

### Web Server Integration
Videos are served via the basic_bot vision service REST API:

- **Port**: 5801 (separate from main hub on 5100)
- **List endpoint**: `GET /recorded_video` → JSON array of base filenames
- **File endpoint**: `GET /recorded_video/{filename}.mp4` or `.jpg`
- **Host**: Same as hub host, determined by `videoHost` in `hubState.ts`

## Component Architecture

### Visual Layout
The VidViewerDialog displays as a large modal overlay with a two-pane layout:

- **Left Sidebar**: Vertical timeline with date navigation and range selection
- **Right Panel**: Video player with thumbnail strip navigation
- **LCARS Theme**: Star Trek-inspired blue/teal color scheme consistent with the main app
- **Modal Design**: Backdrop click to close, prominent "Close" button

### Main Component (`index.tsx`)
The root dialog component manages:

- **File fetching**: Retrieves list of recorded videos from `/recorded_video`
- **Date range filtering**: Provides preset ranges (last hour, day, week, etc.)
- **Window management**: Shows subset of files for performance
- **Navigation state**: Tracks current playhead position and active file

### Key Sub-Components

#### Viewer (`Viewer.tsx`)
- **Large Video Player**: Right panel displays current video with standard HTML5 controls
- **Timestamp Display**: Current video timestamp prominently shown (e.g., "8/6/2025, 8:06:41 AM")
- **Progress Indicator**: Shows "0:07 / 0:10" for current position in 10-second clips
- **Custom Controls**: Three circular buttons below video (back 10s, play/pause, forward 10s)
- **Auto-advance**: Automatically plays next video when current ends
- **URL generation**: Uses `vidUtils.ts` to construct video URLs

#### Timeline (`Timeline.tsx`)
- **Horizontal Thumbnail Strip**: Bottom of right panel shows video thumbnails (94x70px)
- **Visual Navigation**: Click thumbnails to jump to specific videos
- **Scrubbing**: Click/drag to navigate through time
- **Performance optimization**: Uses stride to limit thumbnails (max 100)
- **Date/Time Labels**: Each thumbnail shows timestamp for quick reference

#### DateLine (`Dateline.tsx`)
- **Vertical Timeline**: Left sidebar showing chronological video availability
- **Date Labels**: Clear timestamps (e.g., "6/13/2025, 8:20:38 AM", "Mon, Jun 16")
- **Green Blocks**: Visual indicators showing periods with recorded videos
- **Blue Selection Box**: Highlights current window range being viewed
- **Scrollable Interface**: Navigate through long date ranges

#### RangeSelector (`RangeSelector.tsx`)
- **Dropdown Filter**: "Last 90 days" dropdown at top of left sidebar
- **Preset Options**: "Last hour", "Last day", "Last week", "Last 90 days", etc.
- **Auto-generated ranges**: Based on available video files
- **Dynamic options**: Hides ranges with no available videos

## File Naming & Date Parsing

### Filename Format
```
YYYYMMDD-HHMMSS
20240315-143022 = March 15, 2024 at 2:30:22 PM
```

### Date Parsing Logic (`dateUtils.ts`)
```typescript
function parseFilenameDate(file: string): Date {
    const year = parseInt(file.slice(0, 4));      // 2024
    const month = parseInt(file.slice(4, 6)) - 1; // 2 (March, 0-indexed)
    const day = parseInt(file.slice(6, 8));       // 15
    const hour = parseInt(file.slice(9, 11));     // 14
    const minute = parseInt(file.slice(11, 13));  // 30
    const second = parseInt(file.slice(13, 15));  // 22
    return new Date(year, month, day, hour, minute, second);
}
```

## URL Construction (`vidUtils.ts`)

```typescript
// Video URLs
vidUrl("20240315-143022")
→ "http://192.168.1.100:5801/recorded_video/20240315-143022.mp4"

// Thumbnail URLs
thumbUrl("20240315-143022")
→ "http://192.168.1.100:5801/recorded_video/20240315-143022.jpg"

largeThumbUrl("20240315-143022")
→ "http://192.168.1.100:5801/recorded_video/20240315-143022_lg.jpg"
```

## Performance Considerations

### File Filtering
- **Sorted order**: Files returned by server in descending chronological order (newest first)
- **Range filtering**: `DateRange.filterFileNames()` efficiently filters by breaking early
- **Window concept**: Shows only subset of files at once to prevent UI lag

### Timeline Optimization
- **Thumbnail stride**: Shows max 100 thumbnails regardless of file count
- **Dynamic sizing**: Timeline elements sized as percentages of window duration
- **Lazy loading**: Images loaded as needed during scrolling

### Memory Management
- **Window ranges**: Limits active file set to prevent memory issues
- **Auto-cleanup**: Browser handles video memory management
- **Efficient updates**: Uses React's useMemo for expensive calculations

## Date Range System

### Range Types
1. **Filter Range**: Top-level filter (e.g., "Last 24 hours")
2. **Window Range**: Subset of filter for timeline display
3. **Playhead Position**: Current video being viewed

### Navigation Flow
1. User selects filter range → loads matching files
2. System creates window range (1/6 of filter duration)
3. Timeline shows files within window range
4. User navigates → window automatically adjusts to follow playhead

## Testing

### Test Files
- **index.test.tsx**: Component integration tests
- **testdata/**: Sample video filenames for testing

### Test Utilities
Mock data includes realistic filename patterns and date ranges to verify parsing and filtering logic.

## Development Notes

- **File sorting**: Server returns files in reverse chronological order
- **Time zones**: All dates parsed as local time
- **Error handling**: Graceful fallbacks for parsing errors and missing files
- **Responsive design**: Works on desktop and tablet interfaces
- **Touch support**: Timeline supports touch gestures for mobile devices

## UI/UX Design Features

### Visual Indicators
- **Green Blocks**: Clearly show periods with available recordings on the timeline
- **Blue Selection Box**: Highlights the current time window being viewed
- **Color Coding**: Consistent LCARS blue/teal theme throughout the interface
- **Clear Typography**: Large, readable timestamps and labels

### User Experience
- **Intuitive Navigation**: Multiple ways to navigate (timeline, thumbnails, controls)
- **Visual Feedback**: Immediate response to user interactions
- **Modal Design**: Focused viewing experience with easy close options
- **Progressive Disclosure**: Shows overview first, then details on demand

### Accessibility Considerations
- **Large Click Targets**: Circular control buttons are easy to interact with
- **Clear Visual Hierarchy**: Important information prominently displayed
- **Standard Video Controls**: Familiar HTML5 video player interface
- **Keyboard Navigation**: Standard modal and video player keyboard support

## Known Issues & Planned Improvements

### Current Limitations (GitHub Issue #33)
The current implementation has several acknowledged design and functional issues:

- **Modal Design**: Current overlay approach interrupts main workflow
- **Mobile UX**: Poor tablet/mobile interaction experience
- **Timeline Interaction**: Limited click-and-drag date range selection
- **No Persistent Preferences**: Range selector settings not saved
- **Hover Dependencies**: Some interactions rely on hover (problematic for touch devices)

### Planned Improvements
Based on GitHub issue #33, the following improvements are planned:

1. **Replace Modal with In-Page Component**
   - Convert from overlay dialog to integrated page component
   - Add toggle functionality for "RECORDED VIDEOS" button
   - Maintain context with main application

2. **Enhanced Mobile/Tablet Support**
   - Optimize for tablet-sized devices
   - Remove hover-dependent interactions
   - Improve touch gesture support for timeline

3. **Advanced Timeline Features**
   - Click-and-drag date range selection
   - iMovie-inspired timeline design
   - Better visual feedback for interactions

4. **Persistent User Preferences**
   - localStorage integration for range selector settings
   - Remember user's preferred viewing options
   - Maintain state across sessions

5. **Custom Thumbnail API**
   - Develop thumbnail collage generation
   - Improve visual representation of video segments
   - Better performance for timeline rendering

### Design Constraints
- **Target Device**: Must work well on tablet-sized mobile devices
- **No Hover Effects**: All interactions must be touch-friendly
- **Performance**: Handle large numbers of video files efficiently
- **Accessibility**: Maintain usability across different device types