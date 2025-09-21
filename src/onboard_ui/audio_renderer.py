"""
Audio renderer for WebRTC audio tracks.

This module provides an AudioRenderer class that handles incoming WebRTC audio frames
and plays them locally using sounddevice.
"""

import numpy as np
from basic_bot.commons import log, constants as c

# Import sounddevice conditionally for testing environments
if c.BB_ENV != "test":
    import sounddevice as sd
else:
    log.info("Running in BB_ENV='test', stubbing out sounddevice")

    class SoundDeviceMock:
        def play(self, *args, **kwargs):
            pass

    sd = SoundDeviceMock()


class AudioRenderer:
    """Renders WebRTC audio frames to local audio output."""

    def __init__(self):
        """Initialize the audio renderer."""
        self.sample_rate = 48000  # WebRTC default sample rate
        self.is_playing = False
        self.output_channels = None  # Will be detected on first use
        self._detect_audio_capabilities()

    def _detect_audio_capabilities(self):
        """Detect audio device capabilities."""
        try:
            if c.BB_ENV == "test":
                self.output_channels = 2  # Default for testing
                return

            # Get default output device info
            device_info = sd.query_devices(kind='output')
            self.output_channels = min(device_info['max_output_channels'], 2)  # Max 2 channels
            log.info(f"Detected audio output: {self.output_channels} channels, device: {device_info['name']}")
        except Exception as e:
            log.warning(f"Could not detect audio capabilities, defaulting to mono: {e}")
            self.output_channels = 1

    def handle_audio_frame(self, frame):
        """
        Convert WebRTC audio frame to numpy array and play it.

        Args:
            frame: WebRTC audio frame object
        """
        try:
            # Convert frame to numpy array
            audio_data = frame.to_ndarray()

            # Ensure audio_data is in the correct format for sounddevice
            if audio_data.dtype != np.float32:
                audio_data = audio_data.astype(np.float32)

            # Handle channel conversion
            audio_data = self._convert_channels(audio_data)

            # Play audio using sounddevice (non-blocking)
            sd.play(audio_data, self.sample_rate, blocking=False)

            if not self.is_playing:
                log.info(f"Started WebRTC audio playback ({audio_data.shape})")
                self.is_playing = True

        except Exception as e:
            log.error(f"Error playing audio frame: {e}")

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

    def stop(self):
        """Stop audio playback."""
        try:
            sd.stop()
            if self.is_playing:
                log.info("Stopped WebRTC audio playback")
                self.is_playing = False
        except Exception as e:
            log.error(f"Error stopping audio: {e}")
