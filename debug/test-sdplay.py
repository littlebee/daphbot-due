#!/usr/bin/env python3

import sounddevice as sd
import wave
import numpy as np
import sys
import argparse

def play_wav(filename):
    """Play a WAV file using sounddevice"""
    try:
        # Read the WAV file using wave module
        with wave.open(filename, 'rb') as wav_file:
            frames = wav_file.readframes(-1)
            samplerate = wav_file.getframerate()
            channels = wav_file.getnchannels()
            sampwidth = wav_file.getsampwidth()

            print(f"Playing: {filename}")
            print(f"Sample rate: {samplerate} Hz")
            print(f"Channels: {channels}")
            print(f"Sample width: {sampwidth} bytes")
            print(f"Duration: {len(frames) / (samplerate * channels * sampwidth):.2f} seconds")

            # Convert bytes to numpy array
            if sampwidth == 1:
                dtype = np.uint8
            elif sampwidth == 2:
                dtype = np.int16
            elif sampwidth == 4:
                dtype = np.int32
            else:
                raise ValueError(f"Unsupported sample width: {sampwidth}")

            data = np.frombuffer(frames, dtype=dtype)

            # Reshape for multi-channel audio
            if channels > 1:
                data = data.reshape(-1, channels)

            # Play the audio
            sd.play(data, samplerate)
            sd.wait()  # Wait until playback is finished
            print("Playback completed")

    except FileNotFoundError:
        print(f"Error: File '{filename}' not found")
        sys.exit(1)
    except Exception as e:
        print(f"Error playing audio: {e}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Play a WAV file using sounddevice")
    parser.add_argument("filename", help="Path to the WAV file to play")

    args = parser.parse_args()
    play_wav(args.filename)

if __name__ == "__main__":
    main()