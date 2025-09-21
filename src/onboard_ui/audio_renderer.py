"""
Audio renderer for WebRTC audio tracks.

This module provides an AudioRenderer class that handles incoming WebRTC audio frames
and plays them locally using sounddevice. Optimized for Raspberry Pi with Debian Bullseye.
"""

import asyncio
import numpy as np
import threading
import queue
import time
from typing import Optional
from basic_bot.commons import log, constants as c

# Import sounddevice conditionally for testing environments
if c.BB_ENV != "test":
    import sounddevice as sd
else:
    log.info("Running in BB_ENV='test', stubbing out sounddevice")

    class SoundDeviceMock:
        def play(self, *args, **kwargs):
            pass

        def query_devices(self, *args, **kwargs):
            return {'name': 'Mock Device', 'max_output_channels': 2}

        def check_output_settings(self, *args, **kwargs):
            pass

        def stop(self, *args, **kwargs):
            pass

    sd = SoundDeviceMock()


class AudioRenderer:
    """Renders WebRTC audio frames to local audio output with Raspberry Pi optimization."""

    def __init__(self, buffer_size: int = 10):
        """
        Initialize the audio renderer.

        Args:
            buffer_size: Number of audio frames to buffer for smooth playback
        """
        # Use lower quality settings for Raspberry Pi
        self.sample_rate = 16000  # Lower sample rate to reduce CPU load
        self.is_playing = False
        self.output_channels = None
        self.buffer_size = buffer_size

        # Audio frame buffer for smooth playback
        self.audio_buffer = queue.Queue(maxsize=buffer_size)
        self.playback_thread = None
        self.stop_playback = threading.Event()

        # Statistics
        self.frames_received = 0
        self.frames_played = 0
        self.buffer_underruns = 0
        self.last_stats_time = time.time()

        # Raspberry Pi specific optimizations
        self._detect_audio_capabilities()
        self._configure_for_raspberry_pi()

    def _detect_audio_capabilities(self):
        """Detect audio device capabilities with Raspberry Pi specific handling."""
        try:
            if c.BB_ENV == "test":
                self.output_channels = 2
                return

            # Query available audio devices
            devices = sd.query_devices()
            log.debug(f"Available audio devices: {devices}")

            # Get default output device info
            default_device = sd.query_devices(kind='output')
            self.output_channels = min(default_device['max_output_channels'], 2)

            # Test audio settings to ensure they work
            try:
                sd.check_output_settings(
                    channels=self.output_channels,
                    samplerate=self.sample_rate,
                    device=None  # Use default device
                )
                log.info(f"Audio output configured: {self.output_channels} channels @ {self.sample_rate}Hz, device: {default_device['name']}")
            except Exception as e:
                log.warning(f"Audio settings test failed, falling back to mono: {e}")
                self.output_channels = 1

        except Exception as e:
            log.warning(f"Could not detect audio capabilities, defaulting to mono: {e}")
            self.output_channels = 1

    def _configure_for_raspberry_pi(self):
        """Apply Raspberry Pi specific audio optimizations."""
        try:
            if c.BB_ENV == "test":
                return

            # Raspberry Pi may need specific buffer configurations
            # These settings help with audio stability on Pi hardware
            import os

            # Check if we're on a Raspberry Pi
            if os.path.exists('/proc/device-tree/model'):
                with open('/proc/device-tree/model', 'r') as f:
                    model = f.read()
                    if 'Raspberry Pi' in model:
                        log.info(f"Detected Raspberry Pi: {model.strip()}")
                        # Use smaller buffer and lower quality for Pi
                        self.buffer_size = min(self.buffer_size, 3)
                        # Force mono audio on Pi for better performance
                        if self.output_channels is None or self.output_channels > 1:
                            log.info("Forcing mono audio for Raspberry Pi optimization")
                            self.output_channels = 1

        except Exception as e:
            log.debug(f"Could not detect Raspberry Pi model: {e}")

    def handle_audio_frame(self, frame):
        """
        Convert WebRTC audio frame and add to buffer for playback.

        Args:
            frame: WebRTC audio frame object
        """
        try:
            # Convert frame to numpy array - WebRTC uses planar format
            audio_data = frame.to_ndarray()

            # Debug first few frames
            if self.frames_received < 3:
                log.info(f"Audio frame {self.frames_received}: shape={audio_data.shape}, dtype={audio_data.dtype}, range=[{audio_data.min():.6f}, {audio_data.max():.6f}]")

            # Validate frame data
            if len(audio_data) == 0:
                log.warning("Received empty audio frame, skipping")
                return

            # WebRTC audio comes at 48kHz, downsample to 16kHz for Pi
            original_sample_rate = 48000
            if hasattr(frame, 'sample_rate'):
                original_sample_rate = frame.sample_rate

            # WebRTC audio is typically in planar format (channels, samples)
            # Convert to interleaved format (samples, channels) for sounddevice
            if audio_data.ndim == 2 and audio_data.shape[0] < audio_data.shape[1]:
                # Transpose from (channels, samples) to (samples, channels)
                audio_data = audio_data.T

            # Handle single channel case
            elif audio_data.ndim == 1:
                # Keep as is - mono audio
                pass
            elif audio_data.ndim == 2 and audio_data.shape[1] == 1:
                # Flatten single channel
                audio_data = audio_data.flatten()

            # Ensure audio_data is in the correct format for sounddevice
            if audio_data.dtype != np.float32:
                # Convert to float32 and normalize if needed
                if audio_data.dtype in [np.int16, np.int32]:
                    # Convert from integer to float
                    max_val = np.iinfo(audio_data.dtype).max
                    audio_data = audio_data.astype(np.float32) / max_val
                else:
                    audio_data = audio_data.astype(np.float32)

            # Clamp values to prevent clipping
            audio_data = np.clip(audio_data, -1.0, 1.0)

            # Downsample audio if needed for Pi optimization
            if original_sample_rate != self.sample_rate:
                audio_data = self._downsample_audio(audio_data, original_sample_rate, self.sample_rate)

            # Handle channel conversion
            audio_data = self._convert_channels(audio_data)

            # More aggressive buffer management to prevent garbling
            current_buffer_size = self.audio_buffer.qsize()

            # Keep buffer smaller to reduce latency and prevent garbling
            if current_buffer_size >= 2:  # Very aggressive - keep only 1-2 frames
                try:
                    # Drop all but the newest frame
                    while self.audio_buffer.qsize() > 1:
                        self.audio_buffer.get_nowait()
                    log.debug(f"Audio buffer full, dropped {current_buffer_size - 1} frames")
                except queue.Empty:
                    pass

            try:
                self.audio_buffer.put_nowait(audio_data)
                self.frames_received += 1
            except queue.Full:
                # Still full after cleanup - drop this frame
                log.debug("Audio buffer still full after cleanup, dropping frame")

            # Start playback thread if not already running
            if not self.is_playing:
                self._start_playback_thread()

        except Exception as e:
            log.error(f"Error processing audio frame: {e}")
            import traceback
            log.error(f"Audio frame error traceback: {traceback.format_exc()}")

    def _start_playback_thread(self):
        """Start the audio playback thread."""
        if self.playback_thread is None or not self.playback_thread.is_alive():
            self.stop_playback.clear()
            self.playback_thread = threading.Thread(target=self._playback_worker, daemon=True)
            self.playback_thread.start()
            self.is_playing = True
            log.info("Started WebRTC audio playback thread")

    def _playback_worker(self):
        """Worker thread for continuous audio playback."""
        try:
            consecutive_empty = 0
            while not self.stop_playback.is_set():
                try:
                    # Get audio data from buffer with shorter timeout for responsiveness
                    audio_data = self.audio_buffer.get(timeout=0.05)
                    consecutive_empty = 0

                    # Validate audio data before playing
                    if audio_data is None or len(audio_data) == 0:
                        continue

                    # Play audio (non-blocking)
                    sd.play(audio_data, self.sample_rate, blocking=False)
                    self.frames_played += 1

                    # Log first few successful plays for debugging
                    if self.frames_played <= 5:
                        log.info(f"Successfully played audio frame {self.frames_played}: shape={audio_data.shape}")

                    # Minimal sleep for low latency playback
                    # Since we're keeping the buffer very small (1-2 frames), play immediately
                    time.sleep(0.001)

                except queue.Empty:
                    consecutive_empty += 1
                    # No audio data available
                    if consecutive_empty > 5 and self.frames_received > 0:
                        self.buffer_underruns += 1
                        log.debug(f"Audio buffer underrun (consecutive empty: {consecutive_empty})")

                    # Longer sleep when buffer is empty
                    time.sleep(0.05)
                    continue
                except Exception as e:
                    log.error(f"Error in audio playback: {e}")
                    time.sleep(0.1)  # Brief pause before continuing

        except Exception as e:
            log.error(f"Audio playback thread error: {e}")
        finally:
            # Stop any remaining audio playback
            if c.BB_ENV != "test":
                try:
                    sd.stop()
                except:
                    pass
            self.is_playing = False
            log.info("Audio playback thread stopped")

    def _convert_channels(self, audio_data):
        """
        Convert audio data to match output device capabilities.

        Args:
            audio_data: numpy array of audio samples

        Returns:
            numpy array adjusted for output device
        """
        # Handle different input shapes
        if audio_data.ndim == 1:
            # Mono input
            if self.output_channels == 1:
                return audio_data
            else:
                # Convert mono to stereo by duplicating channel
                return np.column_stack([audio_data, audio_data])
        elif audio_data.ndim == 2:
            input_channels = audio_data.shape[1]

            if input_channels == self.output_channels:
                # Perfect match
                return audio_data
            elif input_channels > self.output_channels:
                # Downmix: take first N channels or mix stereo to mono
                if self.output_channels == 1 and input_channels == 2:
                    # Mix stereo to mono
                    return np.mean(audio_data, axis=1)
                else:
                    # Take first N channels
                    return audio_data[:, :self.output_channels]
            else:
                # Upmix: duplicate channels
                if input_channels == 1 and self.output_channels == 2:
                    # Mono to stereo
                    return np.column_stack([audio_data[:, 0], audio_data[:, 0]])
                else:
                    # General case: repeat existing channels
                    repeated_data = audio_data
                    while repeated_data.shape[1] < self.output_channels:
                        repeated_data = np.column_stack([repeated_data, audio_data])
                    return repeated_data[:, :self.output_channels]
        else:
            log.warning(f"Unexpected audio data shape: {audio_data.shape}")
            return audio_data

    def _downsample_audio(self, audio_data, original_rate, target_rate):
        """
        Improved downsampling with anti-aliasing for better quality.

        Args:
            audio_data: Input audio data
            original_rate: Original sample rate
            target_rate: Target sample rate

        Returns:
            Downsampled audio data
        """
        if original_rate == target_rate:
            return audio_data

        # Calculate downsampling ratio
        ratio = original_rate / target_rate

        if ratio > 1:
            # Apply simple low-pass filtering before downsampling to reduce aliasing
            # Use a moving average filter for simplicity (efficient on Pi)
            kernel_size = max(3, int(ratio // 2))

            if audio_data.ndim == 1:
                # Apply smoothing filter
                kernel = np.ones(kernel_size) / kernel_size
                filtered = np.convolve(audio_data, kernel, mode='same')
                # Downsample
                step = int(ratio)
                return filtered[::step]
            else:
                # Multi-channel case
                filtered_channels = []
                for ch in range(audio_data.shape[1]):
                    kernel = np.ones(kernel_size) / kernel_size
                    filtered = np.convolve(audio_data[:, ch], kernel, mode='same')
                    filtered_channels.append(filtered)

                filtered_data = np.column_stack(filtered_channels)
                step = int(ratio)
                return filtered_data[::step, :]
        else:
            return audio_data

    def stop(self):
        """Stop audio playback and cleanup resources."""
        try:
            # Signal playback thread to stop
            self.stop_playback.set()

            # Stop sounddevice
            if c.BB_ENV != "test":
                sd.stop()

            # Wait for playback thread to finish
            if self.playback_thread and self.playback_thread.is_alive():
                self.playback_thread.join(timeout=2.0)

            # Clear buffer
            while not self.audio_buffer.empty():
                try:
                    self.audio_buffer.get_nowait()
                except queue.Empty:
                    break

            if self.is_playing:
                log.info("Stopped WebRTC audio playback")
                self.is_playing = False

        except Exception as e:
            log.error(f"Error stopping audio: {e}")

    def get_stats(self):
        """Get audio playback statistics for monitoring."""
        current_time = time.time()
        elapsed = current_time - self.last_stats_time

        stats = {
            'frames_received': self.frames_received,
            'frames_played': self.frames_played,
            'buffer_underruns': self.buffer_underruns,
            'buffer_size': self.audio_buffer.qsize(),
            'buffer_max_size': self.buffer_size,
            'is_playing': self.is_playing,
            'output_channels': self.output_channels,
            'sample_rate': self.sample_rate,
            'playback_thread_alive': self.playback_thread.is_alive() if self.playback_thread else False
        }

        if elapsed > 0:
            stats['receive_rate'] = self.frames_received / elapsed
            stats['playback_rate'] = self.frames_played / elapsed
            stats['drop_rate'] = self.buffer_underruns / elapsed

        return stats

    def log_stats(self):
        """Log current audio statistics for debugging."""
        stats = self.get_stats()
        log.info(f"Audio Stats: received={stats['frames_received']}, played={stats['frames_played']}, "
                f"buffer={stats['buffer_size']}/{stats['buffer_max_size']}, underruns={stats['buffer_underruns']}, "
                f"playing={stats['is_playing']}, thread_alive={stats['playback_thread_alive']}")

    def enable_debug_logging(self, enabled=True):
        """Enable or disable debug logging for audio frames."""
        self.debug_logging = enabled

    def reset_stats(self):
        """Reset statistics counters."""
        self.frames_received = 0
        self.frames_played = 0
        self.buffer_underruns = 0
        self.last_stats_time = time.time()