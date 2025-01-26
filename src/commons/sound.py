import os
import sounddevice as sd
import pydub

from basic_bot.commons import log

# Record audio
FREQ = 44100  # Sample rate
DURATION = 1.5  # Duration of recording in seconds
MEDIA_PATH = "media"
OFF_MESSAGE_FILE = os.path.join(MEDIA_PATH, "off_message.mp3")
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
