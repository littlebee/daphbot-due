import queue
import numpy as np
import sounddevice as sd

from basic_bot.commons import log, constants as c

if c.BB_LOG_DEBUG:
    default_output_device_info = sd.query_devices(sd.default.device[1], "output")
    log.debug(
        f"audio_stream_player: Default output device: {default_output_device_info}"
    )


class AudioStreamPlayer:

    def __init__(self):
        # Audio playback setup
        self.audio_queue = queue.Queue(maxsize=100)  # Buffer for audio frames
        self.audio_stream = None
        self.audio_thread = None

    async def setup_audio_stream(self, first_frame):
        """Setup sounddevice audio stream based on first audio frame."""
        try:
            # TODO: maybe remove this clanker. audio_data was not being used
            # # Convert frame to numpy array to get audio properties
            # audio_data = np.frombuffer(
            #     first_frame.to_ndarray().tobytes(), dtype=np.int16
            # )

            # Get audio properties from the frame
            sample_rate = first_frame.sample_rate
            channels = (
                len(first_frame.layout.channels)
                if hasattr(first_frame, "layout")
                else 1
            )

            log.info(f"Setting up audio stream: {sample_rate}Hz, {channels} channels")

            # Create audio stream with callback
            self.audio_stream = sd.OutputStream(
                samplerate=sample_rate,
                channels=channels,
                dtype=np.int16,
                callback=self._audio_callback,
                blocksize=1024,  # Small buffer for low latency
                latency="low",
            )

            self.audio_stream.start()
            log.info("Audio stream started successfully")

        except Exception as e:
            log.error(f"Error setting up audio stream: {e}")

    def _audio_callback(self, outdata, frames, time, status):
        """Callback function for sounddevice audio stream."""
        if status:
            log.warning(f"Audio callback status: {status}")

        try:
            # Get audio data from queue
            audio_data = self.audio_queue.get_nowait()

            # Ensure data fits in output buffer
            if len(audio_data) <= len(outdata):
                outdata[: len(audio_data)] = audio_data.reshape(-1, 1)
                # Pad with zeros if needed
                if len(audio_data) < len(outdata):
                    outdata[len(audio_data) :] = 0
            else:
                # Truncate if too long
                outdata[:] = audio_data[: len(outdata)].reshape(-1, 1)

        except queue.Empty:
            # No audio data available, output silence
            outdata.fill(0)
        except Exception as e:
            log.error(f"Error in audio callback: {e}")
            outdata.fill(0)

    def queue_audio_frame(self, frame):
        """Convert and queue audio frame for playback."""
        try:
            # Convert WebRTC frame to numpy array
            audio_data = np.frombuffer(frame.to_ndarray().tobytes(), dtype=np.int16)

            # Add to queue (drop old frames if queue is full)
            try:
                self.audio_queue.put_nowait(audio_data)
            except queue.Full:
                # Remove oldest frame and add new one
                try:
                    self.audio_queue.get_nowait()
                    self.audio_queue.put_nowait(audio_data)
                except queue.Empty:
                    pass

        except Exception as e:
            log.error(f"Error queuing audio frame: {e}")

    def cleanup_audio_stream(self):
        """Clean up audio stream resources."""
        try:
            if self.audio_stream:
                self.audio_stream.stop()
                self.audio_stream.close()
                self.audio_stream = None
                log.info("Audio stream cleaned up")

            # Clear audio queue
            while not self.audio_queue.empty():
                try:
                    self.audio_queue.get_nowait()
                except queue.Empty:
                    break

        except Exception as e:
            log.error(f"Error cleaning up audio stream: {e}")
