FROM eclipse-temurin:21-jdk-jammy@sha256:e0c60c487345d1dc9d0fc7b6f0496f3cc941e5132e09296cc17a6decc71b902b
WORKDIR /opt/robot
COPY Robot.java TraceMain.java run.sh ./
RUN javac --add-modules jdk.jdi Robot.java TraceMain.java && chmod 555 run.sh && rm Robot.java TraceMain.java
USER 10001:10001
WORKDIR /work
ENTRYPOINT ["/usr/bin/timeout", "--signal=KILL", "65s", "/bin/sh", "/opt/robot/run.sh"]
