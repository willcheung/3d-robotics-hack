# Foundation contract and future acceptance gates

Updated from early play-test feedback. Missions 1–3 run online in Python and Java with private student accounts and shared family results; the full curriculum and unattended scheduler remain planned. TASKS.md controls slice readiness; this contract applies to every future slice. Preserve an executable student experience at every checkpoint.

## What exists and what remains planned

| Capability | Current evidence / future gate |
| --- | --- |
| Python execution | Real Pyodide/CPython, isolated runtime origin, trusted command/sensor bridge; acceptance in VALIDATION.md. |
| Learning workspace | Editable Python and Java with syntax colors, line numbers, keyboard indentation/unindent/undo, Run/Stop/Reset/Restore, draft storage and explicit storage failure; lightweight textarea, not a full debugger or autocomplete IDE. |
| Mission 1 | Rescue searchlight with three practice locations, visible job/consequence, value/range guide, comments on every executable starter line, real-life machine connection and transfer questions. |
| Progression | Next-rescue action preserves code; three unique local successes count once per visit. Reload starts a new visit; draft remains. Signed-in students also have persistent server-checked milestones and a private experiment history. Neither is proof of mastery or an official competitive score. |
| Java | S02 local build: real JDK compilation/execution, equivalent robot behavior and separately saved drafts; see JAVA.md for setup and exact limits. DEPLOY-01 now has live Vercel Sandbox Java/Python evidence; its server gateway is live. See HOSTED.md. |
| Lessons / experiment history | Released S03 adds L02 sensor choice; S08 adds L03 counted patrol loops and per-checkpoint dwell. All six mission/language drafts retain their selected challenge. Profile saves synchronize code and challenge; notes and the example return copy stay local. Checked L02 requires L01, and checked L03 requires L02. S03H retains durable understanding records and the remaining history/migration work; see the release receipt in PROGRESS.md. |
| Mission 4 landed/deployed | S04 delivers Parcel Port: three position actuators, geometric grasp/release and swept guard collision; eight independent mission/language code/challenge drafts. L04 checking requires L03. Staging/provider, candidate and complete public Python/Java progression checks passed, including all eight saved contexts; the October 17 preview release closed the earlier quota-limited follow-up. See [PROGRESS.md](PROGRESS.md). |
| Expanded curriculum | 16 core outlines: six foundations, five rover lessons including measured heading (S11H), two light/color lessons (S16/S17) and three combined jobs (S15/S18/S19). Four optional outlines: X01/X02 Rocket Lab and X03/X04 image sensing/docking. CURRICULUM.md specifies prerequisites, hardware connections, numeric/contact contracts and readiness. Released L01–L03 use the searchlight, direction sensor and ordered patrol checkpoints; the arm is released; rover, optical and flight models remain planned. |
| Accounts / family multiplayer | Live private student access codes, separate cross-device drafts/history, parent provision/rotate/revoke, and shared server-checked L01–L03 milestones. In-app parent email setup supplies private student login cards. Official S06 rankings and live co-control are not implemented. |
| Faster parent onboarding | FAMILY-03 is live from merged PR #5: parents use email only; legacy families connect once without losing student access or saved work. Student login cards, one setup receipt and first-sign-in-only notifications remain. Real staging inbox and migration checks passed; PROGRESS.md records exact release evidence. PARENT-EMAIL.md defines the transition; human walkthroughs remain pending. |
| Unattended development | OPS-01 remains unverified. Manual remote-ref ownership has evidence; scheduled usage/repository/toolchain access and atomic cycle ownership do not yet. |

## Boundaries to keep as the framework grows

- `model.ts` owns fixed-step state, validated actuator ranges, travel limits and success. It must remain independent of rendering, editor, browser storage and student globals.
- `protocol.ts` validates bounded messages. `runner.ts` owns per-run identity, ordering, time/output/source limits and hard cancellation. Language adapters must implement that same behavior; compilation is isolated too.
- `scene.ts` renders observed state. Camera motion, graphics load and presentation effects cannot change model time or outcomes. Do not reintroduce an ECO switch; preserve sensible defaults, reduced motion and WebGL fallback.
- `editor.ts` owns keyboard editing; `highlighting.ts` paints Python/Java tokens over the native textarea without rewriting source or owning execution. Snapshot source on Run. Editing the next draft cannot mutate an active run; loading examples, changing languages or restoring history cannot silently erase a different draft.
- The S03 lesson schema must version objective, beneficiary, before/after consequence, real-life application, command units/ranges, starter explanations, solution/wrong-program fixtures and transfer checks. Do not turn the current static page into an unused general framework before the next runnable behavior needs it.
- Drafts and local practice progress are untrusted convenience data. Official family results come from server evaluation and validated receipts, never from DOM flags, browser storage or a posted client score.

## Curriculum expansion contract

Read [CURRICULUM.md](CURRICULUM.md) before adding a lesson or world. Student concept prerequisites differ from build-slice dependencies. Keep one main new idea per lesson, reuse tested mechanisms, and retain an anonymous practice path independent of accounts/AI/official scores. Rover direction/heading control precedes route lists; light and color are distinct lessons before combined sensing, and images are an optional extension after arrays/classification; feedback/debugging precede optional flight. Freeze units, sign conventions, sensor failure/saturation, collision/contact and success rules before promotion from draft. Explicitly teach different zero-command effects: zero ideal wheel speed stops a rover, while zero thrust still permits a lander to fall. New models are practice-only until their authoritative scoring contract is separately proved.

## Teaching and numeric contract

Before first Run, tell the learner what the machine accomplishes. Label each controlled part directly in the diagram with its command and movement: for S01, the base motor turns the tower/pointer and the side-joint servo tilts the lamp. Leaders follow the actual part as the camera moves; retain a readable command-to-part key for narrow screens and WebGL fallback. Explain that `wait(ticks)` advances both movements. Check the mapping with separate motor-only and servo-only programs and inspect default/top/narrow views. Explain every executable starter line, including imports, variables, `await`, sensors and console output. Comments must explain purpose and effect, not merely repeat the function name. Keep each explanation directly above its code and add a blank line before the next explanation-and-code group, including within branches. Keep consecutive comment lines together. Apply this spacing to Python and Java starters and worked examples; never reformat or replace a saved student draft automatically. Keep relevant range/unit guidance reachable from the editor and visible in the lesson.

Explain `await` at first use: pause this program until the call returns. For motor/servo this acknowledges a setting; it does not mean arrival. Only `wait` advances ticks and concurrent actuator motion; sensor reads observe the last completed tick. Ordinary calculations/print need no await. Later comments explain conditions, indentation, loop updates/termination, async function definitions/calls, parameters, returns, indices, sensor validity and priority. Java explains its actual API semantics. Require the self-study recap, prediction/trace, graduated hints, glossary, recovery and transfer in CURRICULUM.md. Automated presence checks cannot establish clear teaching; inspect code and collect learner feedback.

For every input, document inclusive/exclusive ends, integer/decimal requirements, units, direction/zero meaning, examples, and invalid-value behavior. For this mission:

| Input | Accepted value | Meaning and failure behavior |
| --- | --- | --- |
| motor power | Finite number −1 through 1 inclusive | Sign chooses left/right; magnitude chooses speed. 0 stops; 0.5 is half power. Outside range / wrong type stops the run. |
| servo target | Finite number 0 through 180 degrees inclusive | Desired tilt position. 90 is level, 120 is 30 up, 60 is 30 down. Movement occurs during wait; invalid inputs stop the run. |
| wait ticks | Whole number 1 through 600 inclusive per call | One tick is 0.02 simulated seconds; 50 ticks is 1 second. Fractions, zero and out-of-range counts stop the run. |
| direction sensor | Read-only degrees, −150 through 150 | The motor has physical travel stops in the model: clamp at a stop rather than raising an input-range error. A powered motor does not count as holding still. |

Name comparison values for their decision role and distinguish them from the mission’s target and commands that move hardware. Explain what changing a value can and cannot change; a successful physical outcome does not prove a variable is the unique correct value. Default comments/help should invite prediction without giving away the debugging or transfer edit; explicit solutions belong in opt-in hints/worked explanations.

A Python variable itself has no robot-specific range; validation happens when its value is passed to the API. Distinguish invalid code/commands, valid attempts that miss, and resource-limit failures. Errors stop the run, preserve the draft, explain a correction and allow a fresh Run. An error does not complete a target, unlock a lesson or earn a score. `round` changes displayed precision; `print` writes the console; neither moves a robot. Simulation seconds are not a promise about real-world elapsed time or calibrated hardware.

## Experiment history, progression and family scoring

Product decision: independent attempts at the same versioned family challenge, with shared family results. Track experiments without penalizing retries; rank successful challenge submissions by reliability, then simulated completion time. Live simultaneous robot control is outside the agreed first multiplayer scope.

S03H records a bounded history per lesson/version/language with attempt ID, source snapshot, target/seed, outcome (reached/missed/code error/stopped/runtime unavailable), simulated time and a concise error. Learners can inspect what changed and load a prior program into the editor without auto-running it; protect the current draft before replacement. An active run gets one terminal record; duplicate messages cannot count twice. Define retention and storage quota fallback. Reload/migration/corrupt storage must preserve or clearly recover usable drafts. A run lost to reload is interrupted/unknown, never a success. Infrastructure failures and cancelled runs are distinguishable from a submitted challenge attempt.

Show practice attempts as experiments, unique mission completion as progress, and demonstrated understanding as a separate transfer result. Keep retry/hint/AI access neutral. Define next available lesson, prerequisites, saved state and final available lesson explicitly; never show a dead Next button or imply unreleased content is playable.

S05 syncs history and progress to the correct child/family with ownership checks and conflict handling. S06 adds equal-condition competition: identical challenge version and seed set, reliability first, then simulated completion time, explicit ties/failures and personal bests. Display the rubric before submission. Never rank by laptop speed, wall-clock time, source length, practice tries or amount of help. No official points are added to S01.

For live multiplayer, first specify cooperative vs competitive control, session ownership, server authority, command ordering, disconnect/reconnect, stale state, latency/fairness and what happens when one child leaves. Test those before calling a local two-tab demo multiplayer.

## Required regression gates

Account onboarding changes must retain the FAMILY-02 contract in PLAN.md: preserve existing family/student identity and work, require current verified ownership before email access or credential delivery, deduplicate retryable creation and first-sign-in events, and separate successful account creation from email-delivery status. Routine sign-ins produce no activity email. Anonymous practice and students with valid codes keep working during a mail outage. No implementation is ready for release on mocked email or in-memory storage evidence alone; ENGINEERING-CHECKS.md specifies the race/migration/provider gates.

| Area | Evidence required on the proposed commit |
| --- | --- |
| Numeric/API semantics | Independent known-value fixtures; accepted edges, just-outside edges, fractions, strings, booleans, null/nonfinite values, wrong arguments, physical travel clamps, total-time limits. UI and starter comments must match the tested API. |
| Real runtime | Observe loading and execution separately in long-running fixtures; preserve the product's independent startup/execution deadlines and exact result assertions. Actual edited source changes the robot; variables, loops, functions/methods, sensor-dependent branches; syntax/runtime errors and both-language conformance when Java is delivered. |
| Editor | Typing/pasting, cursor/selection, multiline indent/unindent, native undo/redo, Enter indentation, keyboard Run, accessible focus escape, scroll/line numbers and token alignment, language-specific syntax colors including multiline comments/strings, literal HTML display, readable forced-colors/plain-text fallback, source-size error, draft/reload/storage-denied behavior. Check learners’ actual browsers before declaring device support. |
| Run lifecycle | Double Run, rapid Stop/Reset/target/language changes, runtime outage, stale callbacks, edits during a run, infinite loop, output flood and successful recovery. No source loss or mixed-run results. |
| Lesson/navigation | Job and real-life application understandable before coding; reference succeeds, wrong program remains unfinished; unique completion; Next preserves draft; retry/reset/reload and last available lesson; transfer understanding measured separately. |
| Success/help teaching | Clear challenge completion plus measured result and causal explanation beside Run in every playable mission/language. Alternate valid solutions must show actual values; completion cannot infer source constructs or mastery. Progressive hints preserve all levels, keyboard access and drafts; worked examples remain opt-in after an attempt. Verify stale-result clearing and unchanged free retries. |
| History/persistence | Exactly one terminal attempt per Run; immutable source snapshot, error/cancel/outage categories, bounded size, safe restore, schema migration, corrupted data, quota/unavailable storage, cross-tab conflicts. Never auto-run a restored attempt. |
| Trust / family | Sandbox escape and forged results/messages; compile/runtime resource limits; server re-evaluation, submission idempotency, score tampering, two-child and second-family access checks, logout/revoke/save-conflict behavior. |
| Sensor and combined jobs | Independent light calibration/threshold, RGB/unknown, image pixels/occlusion/coordinates/frame identity and heading-wrap fixtures; camera-independent observations. Changed scenarios expose hard-coded answers, stale data, wrong condition priority, skipped phases, duplicate payloads and unsafe handoffs. Both languages, budgets and reset across all state transitions. |
| New mechanism | Independent arm joint/grasp/release and rover wheel/heading/sensor/swept-contact fixtures; lander free-fall/balanced-thrust/pre-impact-speed fixtures. Reference and wrong programs in both languages; no teleport, student-set phase/result, or success after clamping a failed collision. Model/source/runtime versions and all dynamic-state reset paths. |
| Visual / performance | Inspect desktop and narrow-screen captures, all goal poses, readable comments/help/feedback, reduced motion and WebGL fallback. Slow rendering must not change simulated outcomes. No ECO control. |
| Delivery | Fresh install, types, production build, all applicable tests, both hosting packages; exact tested SHA and actual current PR-head CI, inspected screenshots, known limits and next action. Hosted tests require separate authorized deployment. |

Current tests establish implemented behavior only. A planned test, mocked provider, CI workflow file, passing program or screenshot does not establish unbuilt functionality, security beyond the tested boundary, learner understanding, real device support or scheduler access.

## Autonomous execution contract

Before each slice: read current instructions/receipts, confirm readiness and landed dependencies, check usage, inspect branch/PR changes, claim exclusive ownership, identify affected acceptance rows, and preserve the last runnable checkpoint. Implement one useful slice, test the delivered behavior plus its regressions, inspect visual evidence, update the same draft PR, verify current-head CI and write a durable resume receipt. Pause with concrete unmet criteria on a failed gate; do not silently drop tests or claim planned features exist.

OPS-01 must prove the actual scheduled environment can read the supported weekly bucket, access this checkout/repository and toolchain, execute the required checks under unattended permissions, and prepare the PR. Prove atomic cycle claims keyed by usage bucket/reset and slice ownership shared with manual runs; test competing polls, missing data, reset rollover, interrupted writer recovery and crashes before/after branch/PR creation. Use the OPS-01 test matrix in ENGINEERING-CHECKS.md; passing local trigger fixtures is not scheduled-environment proof. Preserve the existing trigger's eligibility and duplicate-run protection. Do not create a second automation to work around missing access.

[Official scheduled-task documentation](https://learn.chatgpt.com/docs/automations?surface=app) confirms local project tasks require the computer on, the app running and the project available; web schedules do not directly retain a local folder. This is a product capability, not evidence that our existing hosted trigger has been migrated or passed OPS-01.

Autonomous implementation still stops at a validated draft for review. Under the current authorization, dependencies advance only after accepted work lands; automatic merge/deploy, credentials, purchases and reset redemption remain outside scope. The scheduler itself was not changed by this refinement.


## Mission 3 and future actuator composition

MISSION-03.md freezes the additive patrol model: repeated built-in function calls, ordered stopped dwell and a final stopped pose. A repeat counter or console message never establishes a completed checkpoint; UI and server use trusted tick history. Preserve Missions 1/2 model semantics and legacy draft keys. Keep whole-repeat behavior distinct from API argument validation, and test zero/too-few/excess repetitions, missing/interrupting dwell, skipped points and camera independence in both languages. Authoritative receipts identify `signal-patrol-v1`; earlier missions retain `signal-station-v1`.

For future mechanisms, label every actuator separately. An arm’s gripper is its own third powered actuator with aperture and payload rules. A later spinning intake or flywheel needs a distinct power/speed contract, object presence, feed/release interlocks and object accounting. Do not infer these effects from animation or introduce an opaque helper that solves the lesson. Teach calling library functions, defining an editable parameterized helper, then calling that helper inside a loop in separate steps; CURRICULUM.md records the revised progression.

## Progressive teaching review

Apply [TEACHING-PROGRESSION.md](TEACHING-PROGRESSION.md) across the course. Each lesson retrieves prior understanding, introduces one main new demand, asks for a prediction about the current code and selected case, then checks observable evidence and changed-need explanation. Failed feedback names the unmet condition. Returning learners retain code and challenge together; example restore offers a return copy. Notes, completion and demonstrated understanding remain distinct.
