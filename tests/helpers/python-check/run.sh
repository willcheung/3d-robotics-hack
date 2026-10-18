#!/bin/sh
set -eu
IFS= read -r source
printf '%s' "$source" | base64 -d > /work/student.py
printf '@compiled\n'
exec timeout --signal=KILL 20s python3 -I -u /opt/robot/python-run.py
