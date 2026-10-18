# Test-only CPython; same protocol as hosted checks, isolated by JavaRun's limits.
FROM python:3.13-slim@sha256:70729b46c69b4f1e97c4822c1af3df53a1476cf5ddc6c087c0c10bc3a5678c2f
COPY server/python-run.py /opt/robot/python-run.py
COPY tests/helpers/python-check/run.sh /opt/robot/run.sh
RUN sed -i 's@/opt/robot/student.py@/work/student.py@' /opt/robot/python-run.py && chmod 555 /opt/robot/run.sh
USER 10001:10001
WORKDIR /work
ENTRYPOINT ["/opt/robot/run.sh"]
