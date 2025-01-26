#!/usr/bin/env python3
"""
This was written by Gemini in response to the prompt:
    python cross platform mp3 record and play linux macos

Need to install sounddevice and scipy:
    pip install sounddevice scipy pydub

"""

import sounddevice as sd
from scipy.io import wavfile
import pydub

# Record audio
fs = 44100  # Sample rate
seconds = 5  # Duration of recording

# ca_in = sd.CoreAudioSettings(channel_map=[1, 3])
# ca_out = sd.CoreAudioSettings(channel_map=[-1, -1, 0, -1, 1, -1])

print("Recording...")
myrecording = sd.rec(
    int(seconds * fs), samplerate=fs, channels=1  # , extra_settings=(ca_in, ca_out)
)
sd.wait()  # Wait until recording is finished
print("Finished recording. Saving wav file...")

# Save as WAV file
wavfile.write("test-soundevice-output.wav", fs, myrecording)

# Convert WAV to MP3 using pydub
print("Converting to MP3...")
sound = pydub.AudioSegment.from_wav("test-soundevice-output.wav")
sound.export("test-soundevice-output.mp3", format="mp3")

# Play the MP3 file
print("Playing...")
sound = pydub.AudioSegment.from_mp3("test-soundevice-output.mp3")
sd.play(sound.get_array_of_samples(), fs)
sd.wait()  # Wait until playback is finished

print("Done.")
