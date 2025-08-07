#!/bin/bash

mkdir -p ~/.config/systemd/user/

# to automatically run our start script on desktop login
cp setup_files/home/.config/systemd/user/daphbot.service ~/.config/systemd/user/
systemctl --user enable daphbot.service
