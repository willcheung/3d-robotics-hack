# Signal Station runtime and model contract

S02 adds the real Java transport described in [JAVA.md](JAVA.md). It reuses the same trusted Runner/model validation below; compilation and execution occur in a bounded container. The Python worker contract and numerical model are unchanged.

## Trust boundary

The app origin owns `State`, the numerical model, the current target, simulated time, and feedback. A separate credential-free origin serves a small sandboxed iframe and a **new module worker for every run**, using pinned Pyodide 314.0.7 (real CPython in WebAssembly). No simulation object or result evaluator is passed into Python.

`Python → asynchronous command → iframe relay → app validation → fixed model ticks → bounded sensor result → Python` is ordered. Each robot call returns a Promise awaited by Python. Only one command may be in flight. The app checks the iframe's Window identity, exact origin, run token, message shape, monotonically increasing sequence number, allowed operation, argument type and range. It rejects unknown fields, forged success/score messages, out-of-order requests and overlapping commands. Sensors read the current app-owned model after preceding waits finish.

The iframe relays worker data as untrusted data. Its event handler accepts instructions only from its configured parent origin and parent Window. The worker's JS/Python bindings are not a security boundary: student code can import `js` or replace its own robot module. All received commands remain subject to the app's validation. A forged `done` cannot set success; the app computes feedback from the actual trusted pose, stopped motor and settled servo. This is browser-local practice feedback, not official scoring or tamper protection against the browser's owner/devtools.

## Origins and CSP

Local app: `http://127.0.0.1:4173`. Local runtime: `http://127.0.0.1:4174`. They are different browser origins. Neither server has accounts, secrets, private files, uploads, or authenticated endpoints. Only generated static files are served. Production must use separate HTTPS origins, with the runtime on a credential-free site, no shared domain-wide cookies and no account services. A path on the app origin is invalid.

- App: scripts from self; frames only from the configured runtime origin; no objects, base URI or frame embedding. No remote fonts/scripts/CDN at runtime.
- Iframe: scripts and worker from its own origin only; embedding only from configured app origin. Sandbox allows scripts/same-origin but forbids popups, forms, downloads, top navigation and other capabilities.
- Worker **response header**: `default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; worker-src 'none'`. This is enforced by the browser and cannot be removed by student Python/JS. It permits bundled runtime assets and WASM while blocking app-origin/external fetches, sockets, imports from other origins, and nested workers.
- Module workers cannot access DOM, parent Window or app localStorage. The cross-origin frame cannot read app DOM/storage either.

No SharedArrayBuffer, cross-origin isolation, privileged server execution or credentials are needed. Stop sends termination and removes the iframe; destroying the worker is the hard fallback for arbitrary Python loops. Reset/new run use a new iframe/token/worker and reject old work. Output uses text nodes, never HTML.

The runtime origin may fetch its own static assets. It is not a networkless process sandbox. Python has an ephemeral virtual filesystem, with the standard library but no host mounts. The browser manages JS/WASM memory; S01 does not guarantee a per-run memory quota, protection from browser engine exploits, or malicious denial of service through enormous allocations/structured-clone messages. Use this supervised local preview without sensitive sessions; a future account/official-runner slice needs stronger hostile multi-tenant resource guarantees.

## Model v1

State is pointer degrees, motor power, scanner degrees, servo goal and integer ticks. Reset: pointer 0°, power 0, scanner/goal 90°, ticks 0. Each tick is exactly 0.02 simulated seconds; renderer speed and wall-clock timing do not enter the calculation.

The rescue mission renders these same API values as a two-axis searchlight. `angle()` is the whole tower's horizontal bearing and attached direction dial; `scanner()` is the tilt servo's retained API name. A servo value of 90° is level, 120° is 30° upward and 60° is 30° downward. The crew is placed on the target bearing/elevation. Its illuminated pickup marker and “located” status are derived from the existing trusted stopped/settled success check, not from Python output or a separate scene collision evaluator. The beam is an explanatory visual, not a photometric simulation. The revision changes the rendered mechanism's purpose and mounting, not actuator speed, travel, timing or success tolerance.

| Operation | Contract |
| --- | --- |
| `motor(power)` | Finite numeric power in [−1,1]. 60 degrees/second × power, hard travel stops at −150° and 150°. No acceleration/inertia in this teaching model. |
| `servo(degrees)` | Finite numeric target in [0,180]. Move at up to 120°/second while ticks advance; no overshoot. |
| `wait(ticks)` | Integer 1–600, up to a cumulative 1,500 ticks. Each tick advances both actuators. |
| `angle()`, `scanner()` | Current trusted actuator positions in degrees. No argument. |
| `clock()` | Current trusted ticks × 0.02 seconds. No argument. |

The UI paces waits for visible motion with deadlines, but every step uses the fixed 20 ms model tick. After a delayed browser callback, all due ticks execute before displaying the next snapshot; frames never drop model steps or change their duration. The scene redraws only when its pose, view, or size changes, so idle graphics do not compete with Python startup. A suspended or very slow browser can still hit the wall-clock deadline; no timing or competition claim is based on wall time. Local success requires at least one tick, motor power exactly zero, scanner settled at its commanded goal, and both actual angles within ±2° of the chosen targets.

## Bounds and failure behavior

Source ≤16,000 characters; each output message ≤8,192 characters; aggregate console ≤8,192 UTF-8 bytes; 2,000 commands; 12,000 worker messages; one pending command; 45 s startup; 20 s run wall clock; 30 s cumulative simulated time. Parent-side checks still apply if Python replaces its own wrappers. `input()` fails with guidance. Unknown imports may fail; extra package installation is unsupported.

Limits, worker failures, errors and Stop terminate the run and preserve the draft/last observed pose. Run resets all model/runtime state. Cancelling an outstanding wait prevents further ticks. Errors are not success. An active run uses its source snapshot; later edits affect the next run.

Tests cover independent numerical expectations, real Python variable/function/loop/sensor execution, good/wrong/transfer programs, cancellation/recovery, output flood, syntax/runtime errors, forged commands/results, and browser origin/CSP boundaries. Actual hosted headers and children’s devices must be tested at DEPLOY-01; local tests are not hosted evidence.

Sources: [Pyodide module workers](https://pyodide.org/en/stable/usage/webworker.html), [Pyodide JS API](https://pyodide.org/en/stable/usage/api/js-api.html). The supported API is used directly; no source-to-animation substitution.
