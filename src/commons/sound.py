import os


from basic_bot.commons import log, constants as c

# these won't work in CI/CD pipeline where there is no sound device
# hardware to play or record audio
if c.BB_ENV != "test":
    import sounddevice as sd
    import pydub
else:
    log.info("Running in BB_ENV='test', stubbing out sounddevice and pydub")

    class SoundDeviceMock:
        def play(self, *args, **kwargs):
            pass

        def rec(self, *args, **kwargs):
            pass

    class PydubMock:
        class AudioSegment:
            def export(self, *args, **kwargs):
                pass

            def from_mp3(self, *args, **kwargs):
                class SoundClass:
                    def get_array_of_samples(self):
                        return [1, 2, 3]

                return SoundClass()

    sd = SoundDeviceMock()
    pydub = PydubMock()


# Record audio
FREQ = 44100  # Sample rate
DURATION = 1.5  # Duration of recording in seconds
MEDIA_PATH = "media"
# OFF_MESSAGE_FILE = os.path.join(MEDIA_PATH, "off_message.mp3")
OFF_MESSAGE_FILE = os.path.join(MEDIA_PATH, "woff_message.mp3")
GOOD_MESSAGE_FILE = os.path.join(MEDIA_PATH, "good_message.mp3")


def play_mp3_file(file_path):
    # Play the MP3 file
    log.info(f"Playing {file_path}")
    sound = pydub.AudioSegment.from_mp3(file_path)
    sd.play(sound.get_array_of_samples(), FREQ)

    # return sd object so that we can wait for it to finish
    # ex.  play_mp3_file().wait()
    return sd


def play_off_message():
    return play_mp3_file(OFF_MESSAGE_FILE)


def play_good_message():
    return play_mp3_file(GOOD_MESSAGE_FILE)


def record_mp3_file(file_path):
    log.info(f"Recording {file_path}")
    recording = sd.rec(
        int(DURATION * FREQ),
        samplerate=FREQ,
        channels=1,  # , extra_settings=(ca_in, ca_out)
    )
    sd.wait()  # Wait until recording is finished
    log.debug("Converting to MP3...")

    # Convert numpy array directly to AudioSegment
    sound = pydub.AudioSegment(
        recording.tobytes(),
        frame_rate=FREQ,
        sample_width=recording.dtype.itemsize,
        channels=1,
    )
    sound.export(file_path, format="mp3")

    log.debug(f"Done recording {file_path}.")


def record_off_message():
    record_mp3_file(OFF_MESSAGE_FILE)


def record_good_message():
    record_mp3_file(GOOD_MESSAGE_FILE)


if __name__ == "__main__":
    play_off_message().wait()
    play_good_message().wait()
