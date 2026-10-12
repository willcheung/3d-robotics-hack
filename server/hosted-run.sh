#!/bin/sh
set -eu
ulimit -u 64 2>/dev/null || true
ulimit -n 128
ulimit -f 65536
ulimit -c 0
if [ "$1" = java ]; then
 cp /opt/robot/Main.java /work/Main.java
 mkdir out
 javac -J-Xmx96m -J-XX:MaxMetaspaceSize=64m -J-XX:ActiveProcessorCount=1 -encoding UTF-8 -proc:none -cp /opt/robot -d out Main.java
 printf '@compiled\n'
 exec timeout --signal=KILL 20s java -Xmx96m -XX:MaxMetaspaceSize=64m -XX:MaxDirectMemorySize=16m -XX:ActiveProcessorCount=1 -XX:+UseSerialGC -XX:-UsePerfData -cp out:/opt/robot Main
else
 printf '@compiled\n'
 exec timeout --signal=KILL 20s python3 -I -u /opt/robot/python-run.py
fi
