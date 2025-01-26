#!/bin/sh

# echo on
set -x
# stop on error
set -e

pytest -vv tests/

cd webapp && npm install && npm run test

