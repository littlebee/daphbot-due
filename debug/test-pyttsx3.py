#!/usr/bin/env python3
"""
This was written by Gemini in response to the prompt:
    python cross platform text to speech linux macos

Need to install pyttsx3
    pip install pyttsx3

"""
import pyttsx3

engine = pyttsx3.init()

# Set properties (optional)
engine.setProperty("rate", 150)  # Speed
engine.setProperty("volume", 0.9)  # Volume

# Say the text
engine.say("Hello, world! This is a cross-platform text-to-speech example.")
engine.runAndWait()
