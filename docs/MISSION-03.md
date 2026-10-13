# Mission 3: Ranger patrol

L03 / S08, lesson version 1, patrol model `signal-patrol-v1`. The owner requested a curriculum review and a complete Lesson 3 goal. This slice builds on landed S03 and the existing multi-lesson map, family journal and checked progress. It brings forward only the L03 integration needed from S03H; broader durable understanding/local journal work stays separate. No merge, deployment, automation change or later lesson implementation is included.

## Job and teaching

A storm has darkened a ranger route. Sweep the light to each numbered checkpoint and hold it steady so the field team can log that location before setting out. Each inspected panel changes from waiting to checked; the route becomes ready only after every checkpoint is logged in order and the light rests at the last one. The simulation checks illumination time, not whether terrain is safe or what a camera image contains.

One main new idea: a counted `for` loop repeats a move → stop → hold → read/print sequence. The repeat counter counts calls, not checkpoints reached. Built-in functions (`motor`, `servo`, `wait`, `angle`) do one documented action; the loop calls them repeatedly. They do not know the route or solve it. Defining a parameterized helper is L05; an optional explanation can discuss wrapping a known sequence later, without requiring it to finish L03.

Prerequisite L02; reuse values, direction, time and observations. Both starters work but inspect only one checkpoint. First edit: choose a repeat count after predicting the console and visible route. Explain Python `range`, zero-based counter, indentation, Java initializer/condition/increment/braces, setter versus wait/arrival, and fresh readings. Blank lines separate every comment/code group. Default copy explains roles, not the answer; three opt-in hints and worked explanation supply help without penalty.

## Frozen physical and progress contract

Reuse the existing 20 ms ticks, motor −1..1, 60°/s at full power, servo 0..180° at 120°/s, travel −150..150°, 1..600 whole wait ticks, 1500 total ticks and existing execution/startup limits. Only wait advances motion or checkpoint dwell. No new command or answer-returning sensor is introduced.

| Route | Start | Ordered checkpoints | Tilt | Reference repeat / power / travel ticks |
| --- | --- | --- | --- | --- |
| Ridge sweep | −90° | −30°, 30°, 90° | 90° | 3 / 0.5 / 100 |
| Extra checkpoint | −90° | −45°, 0°, 45°, 90° | 90° | 4 / 0.5 / 75 |
| Cove return | 90° | 30°, −30°, −90° | 60° | 3 / −0.5 / 100 |

Each checkpoint needs 25 consecutive completed ticks (0.5 simulated seconds) within inclusive ±2° direction and tilt tolerance, motor power exactly zero and servo settled. Moving, pointing elsewhere or unsettled tilt clears unfinished dwell. Completed checkpoints remain checked within this run. Only the next ordered checkpoint can accrue dwell. Repeatedly lighting a completed point cannot advance the route. Success also requires stopped/settled final pose at the last checkpoint. Excess movement, skipping earlier points, powered drive-through and a final pose alone cannot pass. Stop/error never completes; Run/Reset clears all route state. Camera and source text cannot grant completion.

The learner's repeat variable is not API range-checked: integer 0/negative values perform no repeats and miss, Python fractional `range` fails and Java uses an `int`; excessive work reaches existing budgets. Calls still enforce their own numeric ranges. Timing is an ideal lesson model, not hardware calibration.

References use 375, 400 and 375 ticks respectively. A manually repeated correct sequence may complete the physical job; success does not prove loop understanding. Require a separate explain/predict prompt, never grade by finding a `for` string.

## Engagement, hardware and pacing

Three finite patrol badges: Ridge sweep, Extra checkpoint, Cove return. No retry/time-pressure penalty or ranking; show within-run checkpoint count separately from visit badges and saved server-checked completion. Each scenario changes an observable requirement. Real application: a pan/tilt inspection camera visits preset views and dwells at each (Axis guard-tour documentation); real devices use calibrated positions, feedback and images. Additional applications: repeated greenhouse inspection and stage-light cues, with their own sensing/control requirements.

One-hour hypothesis: 10 minutes recap/prediction; 15 first loop; 25 changed spacing, reverse direction and debugging; 10 explaining and saving. Human teen/device/pacing evidence remains pending.

## Acceptance and delivery

- Independent model fixtures: exact dwell/angle/tilt boundaries; consecutive dwell reset; skipped/duplicate/drive-through/wrong-tilt/no-stop/excess/zero-repeat failures; deterministic replay; per-run reset; previous model behavior unchanged.
- Real Python and isolated Java: starter, all three references, too few/excess repeats, wrong duration/tilt, syntax and range errors, infinite-loop Stop, subsequent recovery. Prove executed code affects actual motion.
- Browser: both complete journeys, predictions, every hint/worked explanation, visible checkpoint states, badges, camera independence, Next/revisit/final mission, Reset during movement, lesson/language switching and six independent drafts/reload. Inspect desktop/narrow/fallback evidence.
- Family: checked L03 requires checked L02; server selects scenario and canonical model/lesson versions. Practice/client fields cannot unlock; wrong/error/cancel never earns completion. Saved drafts/history persist after fresh-device login, preserve L01/L02 and sibling isolation, and keep pending-check navigation guards. Local real-runtime acceptance is distinct from provider staging proof.
- Fresh install, types/build, both Vercel packages, publication checks and exact-head CI; draft PR, screenshots and owner-QA checklist. Stop at review. Hosted acceptance is required before a separately authorized release.
