#!/bin/bash

source ~/bb_env/bin/activate
export BB_ENV=production

bb_start $@
