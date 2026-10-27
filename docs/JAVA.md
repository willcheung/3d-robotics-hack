# S02: real Java in Signal Station

The local workshop compiles the student's complete `Main.java` with Temurin OpenJDK 21 and runs its bytecode in a fresh Linux container. This is real Java: variables, methods, loops, exceptions and sensor-based branches execute. There is no source translation or animation lookup. Python remains bundled Pyodide. Both languages call the same app-owned numerical model, limits and target evaluator; this is local practice, not official family scoring.

## Setup and preview

Requires Node 22.18+ (24 recommended), npm and a running Docker-compatible engine. No host JDK, API key, cloud account or paid service is required. On macOS an available Docker Desktop engine works; this slice was tested with the free Colima engine and Docker CLI. Install and start them if absent:

```sh
brew install --formula colima docker
colima start robolab --vm-type vz --cpus 2 --memory 2 --disk 8 --root-disk 8 --mount none --ssh-config=false --activate=false --ssh-agent=false --kubernetes=false --network-address=false
export DOCKER_HOST="unix://$HOME/.colima/robolab/docker.sock"
```

This profile has no host-directory mounts or forwarded SSH agent, does not change the default Docker context and is not registered as a login service. Stop this named VM with `colima stop robolab` when Java is no longer needed. Do not stop another project's engine. This machine's installed versions are Colima 0.10.3, Lima 2.2.1 and Docker CLI 29.9.0; the actual JDK base is digest-pinned in `java/Dockerfile`.

```sh
npm ci
npm run setup:java
npm run build
npm run preview
```

The workshop opens at http://127.0.0.1:4173 with Python at port 4174. Choose Java next to the file name. For a second isolated local preview, use ports 4273/4274 by setting `APP_ORIGIN=http://127.0.0.1:4273 VITE_RUNTIME_ORIGIN=http://127.0.0.1:4274` for both build and preview. Leave the Docker engine running while using Java. Ctrl+C stops the preview, its active Java job and both HTTP servers. To restart, use the same environment and `npm run preview`.

Image build downloads the pinned JDK base. Compilation and execution then use `--network none`; no source is sent to a cloud compiler. The image contains only the supplied Robot class and entrypoint, not the checkout. Host environment variables and credentials are not passed into the container. The engine socket is used by the trusted local server, never mounted into Java.

## Teaching and API

`Main.java` contains `public class Main` and `public static void main(String[] args) throws Exception`. The starter comments explain each line, the class/method braces, `int`, assignment, semicolons, argument values, printing and error propagation. Compiler diagnostics use the actual file and line, with no wrapper offset. `-proc:none` disables annotation processing.

| Java call | Meaning |
| --- | --- |
| `Robot.motor(double power)` | −1 through 1 inclusive; sign controls direction, magnitude speed, 0 stops. |
| `Robot.servo(double degrees)` | 0 through 180 inclusive; 90 level, 120 up, 60 down. |
| `Robot.waitTicks(int ticks)` | 1 through 600 whole ticks inclusive per call. 50 ticks = 1 simulated second; 1,500 ticks maximum per run. |
| `Robot.angle()` / `Robot.scanner()` | Current trusted direction / tilt, returned as `double`. |
| `Robot.clock()` | Current simulated seconds as `double`. |

Calls wait for the ordered reply, so Java uses no `await`. Setting power/position acknowledges the setting; it does not advance time or wait for arrival. Only waitTicks advances both moving parts. Java rejects incompatible argument types at compilation (for example 2.5 passed to an int parameter); runtime validation rejects nonfinite numbers and out-of-range values. Printing and rounding do not move the robot.

Each language has its own browser draft, example and comments. Switching stops the active program, resets the mechanism and keeps this visit's unique crew completion. It never translates source or auto-runs a saved draft. Storage failure keeps both drafts in this tab. Separate origins/ports have separate browser storage; the older preview's saved draft stays there.

## Parcel Port API (Mission 4 candidate)

`Robot.shoulder(degrees)`, `Robot.elbow(degrees)` and `Robot.grip(mm)` set independent positions: 0..180°, 0..90° and 0..100 mm respectively. `shoulderAngle()`, `elbowAngle()`, `aperture()` and `holding()` read actual state; holding is numeric 1 or 0, not completion. These calls apply only to the arm world. Existing searchlight calls retain their meaning in Missions 1–3. Shared wait/clock behavior and all isolation limits are unchanged. Rebuild the local Java image with `npm run setup:java` after updating to this branch. [MISSION-04.md](MISSION-04.md) defines rates and contact rules.

## Isolation and resource contract

Compilation and execution share one fresh, non-root container with a read-only image, no network or host mounts, all Linux capabilities dropped, no-new-privileges, private process/network namespaces and Docker's default seccomp policy. Only `/work` (64 MiB) and `/tmp` (8 MiB) are writable tmpfs, both noexec/nosuid/nodev. The trusted model and result evaluator remain in the app, outside the container.

Hard engine limits: 256 MiB memory including tmpfs, no extra swap, one CPU, 64 Linux tasks (processes/native threads), 128 file descriptors and no core dumps. Java virtual threads share the bounded JVM memory rather than each consuming a Linux task. The JVM also caps heap at 96 MiB, metaspace at 64 MiB and direct buffers at 16 MiB. The container entrypoint has a 65-second hard deadline independent of the Node server; normal phase deadlines are 45 seconds for startup/compilation and 20 seconds for execution. A stopped job removes the whole container, including subprocesses. Cancellation during creation waits for the creation response and then removes that container; a new local run waits for a cancelled run's cleanup. A cleanup failure retains the server's single-run gate and logs the exact container name for owner reconciliation.

The HTTP API binds only through the loopback preview. It requires the exact Origin/Host, POST and JSON, permits one active Java run, caps source/body/output, and gives replies a random per-run capability. These checks prevent unrelated browser origins from submitting local work; they are not user authentication and must not be exposed as an internet service. Startup/command/output streams and every command are untrusted. Forged completion text cannot set success; only the actual trusted pose and stopped/settled conditions can. The API intentionally provides no direct model/result write.

A crash of the preview process can leave a stopped container record (or a created-but-not-started record). Running containers hit their own deadline. Inspect the named `robolab-java-…` job and its owning preview before removing a leftover; do not kill another writer or run blanket Docker cleanup. Docker/VM failure, browser engine denial of service, host administrator access and kernel vulnerabilities are outside the demonstrated guarantee. Do not call this a hosted multi-tenant service or authoritative scoring system.

## Hosted Java

Local Docker is a development runner and must remain loopback-only. Hosted Java uses the separate authenticated Sandbox service in [HOSTED.md](HOSTED.md); a static upload alone cannot run Java or family services. See [DEPLOYMENT.md](DEPLOYMENT.md) for packaging, staging and release acceptance. No host Docker socket or credential-bearing JDK is exposed to a learner.

## Practice execution tracing (review candidate)

Rebuild the image after this change. Traced Run compiles the original source with debug line information and uses the JDK’s JDI API inside the disposable container. Loop/branch/method locations and helper returns drive the shared highlight; Pause/Step also gate trusted motion and command replies. No debug port leaves the container. Traced practice has a 345-second container deadline (45-second startup plus five-minute playback); ordinary checks retain 65 seconds and 45/20 phase limits. The two trace JVMs use bounded 24/64 MiB heaps and 32/48 MiB metaspace within the unchanged 256 MiB aggregate limit. See [EXECUTION-TRACING.md](EXECUTION-TRACING.md) for controls, limits and coverage.
