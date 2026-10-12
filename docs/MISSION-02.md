# Mission 2 — Read, then choose

S03 / L02 v1. One new idea: use one measured direction and an `if/else` to choose a correction. Prerequisite concepts are Mission 1 commands, named values, motor direction, tilt and ticks. Reuse the same searchlight, renderer, editor, actual Python/Java runtimes, range validation, cancellation and feedback.

## A useful job

The searchlight was moved while its station was offline. The crew still needs its pickup point lit. A fixed right turn cannot recover the light from both sides. Read the direction sensor, compare it with a decision angle, turn the correct way, then stop with the beam on the crew. The visible crew/beam consequence comes from the trusted pose evaluator.

Real life machines / robots: a controller can use a position sensor to determine which way a joint should move. Connect this to a camera aimed at a doorway and an arm joint aimed toward a shelf. [FIRST's encoder documentation](https://docs.wpilib.org/en/stable/docs/software/hardware-apis/sensors/encoders-software.html) distinguishes relative and absolute measurements. Our sensor is an ideal absolute reading; physical hardware needs correct units/zero, calibration, limits and repeated feedback. This single read is sufficient only for the lesson's declared offsets; it is not a general tracking controller.

## Frozen numerical and teaching contract

| Case ID | Start | Crew target | Tilt | Correct decision |
| --- | --- | --- | --- | --- |
| sensor-left | 30° | 60° | 120° | reading < decision angle, +0.5 power |
| sensor-right | 90° | 60° | 120° | else, −0.5 power |
| sensor-transfer | −30° | −60° | 60° | else, −0.5 power after adapting comparison value/tilt |

Each case resets to its declared starting direction, with power 0, tilt/servo target 90° and tick 0. A 50-tick wait advances one simulated second. At half power this moves 30°. The existing model uses 20 ms fixed steps, 60°/second at full power and a 120°/second servo. Completion requires at least one step, zero motor power, settled servo, and direction/tilt within 2° inclusive. Wrong comparison, unchanged comparison value in transfer, missing stop or wrong tilt cannot earn completion.

`angle()` / `Robot.angle()` reads −150° through 150° inclusive at the last completed tick. It takes no argument, does not advance time and does not continuously update a stored variable. No sensor dropout/noise is introduced. The existing limits remain: finite motor −1..1 and servo 0..180, wait 1..600 whole ticks, total 1,500 ticks, and unchanged runtime/source/output limits. The comparison variable is `decision_angle` in Python and `decisionAngle` in Java (previous starters called it `goal`). It selects a branch; it is not a destination command. Power and wait duration determine distance. The crew target remains fixed by the scenario, and success checks the stopped, settled pose rather than any variable’s name or value. A changed comparison value can select the same branch and yield the same result. A comparison variable itself has no actuator range validation. All command range errors preserve source; a valid miss is an experiment.

Starter code intentionally reverses the comparison. It is valid executable code with an unfinished rescue. Explain every executable line, assignment versus comparison, true/false, Python indentation, Java braces, `await` versus synchronous Java calls, sensor reads and stopped motion. The student predicts a direction, sees the actual reading/branch printed by their program, fixes one symbol and tests both starting sides. Default comments and the number guide explain roles without supplying the working comparison or transfer edits. An open experiment asks students to predict whether a nearby comparison value changes the branch or final reading. Three opt-in hints lead from observation to the worked comparison; the explanation becomes available after a finished/error run. Help and retries cost no points.

Three finite practice badges mark right-turn recovery, left-turn recovery and changed-need transfer. They count unique successes in this visit, not tries, speed, rankings or measured understanding. Separate checked milestones persist in the existing family framework. The explanation prompt asks why the two branches work and why a fresh reading is needed after movement. A teen pilot must establish engagement and independent understanding; automated success does not.

## Framework scope brought forward for this lesson

The user requested the same usable framework as Mission 1. S03 therefore includes the minimum S03H integration required to avoid losing drafts or mislabeling progress: a two-mission selector/map, four independent mission/language drafts, mission-aware existing history restore, existing 12-entry journal, and server-checked L02 milestones with L01 prerequisites. Existing L01 draft keys and completion IDs remain valid. Anonymous practice remains accessible; checked L02 completion requires all three checked L01 rescues. L03 stays unavailable.

This does not complete all of S03H: durable understanding records, local anonymous experiment history and broader journal migration/recovery work remain separate. No official competition rankings, live AI, arm/rover lesson, scheduler change or deployment is part of S03.

## One-hour session hypothesis

- 5 minutes: recap motor versus servo, signs and ticks.
- 10 minutes: predict, run the reversed comparison, read the console.
- 15 minutes: fix one comparison and test both starts without rewriting the program.
- 15 minutes: lower-cove transfer; adapt the comparison value and tilt and explain negative directions.
- 10 minutes: connect the measurement/decision to a camera or robot arm; discuss repeated sensing on hardware.
- 5 minutes: explain the two branches, save work and revisit any unfinished badge.

These are pacing targets, not observed outcomes. Students can pause and return to saved drafts.

## Acceptance

`npm test` validates lesson metadata/navigation and independent starting pose/sensor/motion fixtures. `npm run test:java` executes real good/wrong/transfer programs and server evaluation through the isolated local compiler/runtime. `npm run test:browser` executes both language starters, branch/transfer/reference cases, hints/predictions, bad inputs, Stop, mission/language changes, drafts, reload, storage denial and narrow layouts. Real-runtime regressions also check a comparison value of 70 reaching the fixed 60° crew from both starts, a value that changes the branch and misses, a longer wait that changes distance, and preserved runnable drafts using the old `goal` name. Existing editor, runtime isolation and Mission 1 checks remain required. `npm run test:family` checks prerequisites, forged results, independent drafts and profile boundaries; `npm run test:family-ui` checks actual account API draft sync and safe cross-mission history restore. Inspect desktop and narrow screenshots, then build both Vercel packages and verify exact PR-head CI.

Provider tests remain separate from local/CI evidence and require an authorized staged deployment. Do not publish this lesson merely because local tests pass. Preserve existing family data, recovery behavior and rollback. Invite a supervised student walkthrough after review; record remaining learner feedback as pending.
