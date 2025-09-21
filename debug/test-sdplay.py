#!/usr/bin/env python3

import sounddevice as sd
import soundfile as sf
import sys
import argparse


def play_wav(filename):
    """Play a WAV file using sounddevice"""
    try:
        # Read the audio file
        data, samplerate = sf.read(filename)
        print(f"Playing: {filename}")
        print(f"Sample rate: {samplerate} Hz")
        print(f"Duration: {len(data) / samplerate:.2f} seconds")
        print(f"Channels: {data.shape[1] if len(data.shape) > 1 else 1}")

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
