#!/bin/sh
set -eu
cd /work
IFS= read -r source
printf '%s' "$source" | base64 -d > Main.java
unset source
mkdir out
javac -J-Xmx96m -J-XX:MaxMetaspaceSize=64m -J-XX:ActiveProcessorCount=1 -encoding UTF-8 -proc:none -cp /opt/robot -d out Main.java
printf '@compiled\n'
exec java -Xmx96m -XX:MaxMetaspaceSize=64m -XX:MaxDirectMemorySize=16m -XX:ActiveProcessorCount=1 -XX:+UseSerialGC -XX:-UsePerfData -cp out:/opt/robot Main
