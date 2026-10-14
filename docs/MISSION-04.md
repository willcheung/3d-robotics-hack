# Mission 4: Parcel Port

Status: ready contract implemented in the owner-authorized S04 review candidate. Design, critique and model reviews below resolve the implementation gates; [MISSION-04-QA.md](MISSION-04-QA.md) records executable evidence and remaining gates. Base: `773d02049e1460d6db32c2fcf23da9020554590a`. This is a design decision, not a learner or provider result.

## Learning contract

A dispatch worker needs a parcel moved across a low guard into a receiving tray. The learner coordinates three independent position actuators: a shoulder turns, an elbow lifts, and a gripper opens/closes. The observable result is a parcel picked up, carried clear of the guard and released in the tray. Pointing an empty arm at the tray cannot complete the job.

Retrieve L01's setting-versus-arrival distinction, L02's fresh sensor reading and L03's ordered actions with waits. The one main new demand is coordinating a new mechanism; retain ordinary variables and sequential calls. Do not require new loops, function definitions, arrays, trigonometry or inverse kinematics. L05 will name this already-understood sequence as an editable parameterized helper. Checked L04 requires all three L03 patrols; practice remains freely available.

Start with a visibly raised, open arm over the parcel. The commented program lowers, closes, reads payload presence, lifts, turns, lowers and opens. Its first editable decision is `lift_ticks = 10`, deliberately too short before the turn. Predict whether the actual elbow has arrived before the shoulder begins. Run the original example, inspect collision/pose/payload feedback, then change one value. Three free hints progress from observing the elbow to calculating its travel time to a worked 80-tick lift. The solution is opt-in after a run. Success alone is not understanding.

Three cases use the same mechanism and sequence: **Across the guard** (pickup shoulder 30°, tray 150°), **Moved receiving tray** (pickup 30°, tray 135°), and **Return delivery** (pickup 150°, tray 30°). Pickup/tray elbows are 0°. The arm begins aligned with that case's pickup, elbow 35°, gripper 100 mm. Keep the destination variable separate from the fixed tray: editing code does not move the tray. The moved tray requires adapting a destination; return reverses the turn using the same taught commands. Ask why a closed empty gripper, an early turn or an early release fails. Show the case's pose cards before asking for an edit.

## Frozen model and API: parcel-arm-v1

This is a yaw-and-lift arm with two 0.8 m links, not a general industrial manipulator. A horizontal inner link rotates about a vertical shoulder axis; the outer link lifts about its horizontal elbow axis. The base joint is at world `(0, 0.30, 0)` metres; +y is up. Shoulder 0° faces +x, 90° faces +z, 180° faces −x. Increasing elbow raises the outer link from horizontal; the simplified wrist keeps the jaws and parcel level. Show both axes, actual values and commanded values. Camera orbit never changes state.

| API (Python / Java) | Contract |
| --- | --- |
| `shoulder(degrees)` / `Robot.shoulder(degrees)` | Finite number, 0..180° inclusive; decimals allowed. Position target, not power; actual yaw approaches it at 90°/second during waits. Zero points along +x, not a stop command. |
| `elbow(degrees)` / `Robot.elbow(degrees)` | Finite number, 0..90° inclusive; decimals allowed. Target above horizontal, at 45°/second. Zero lowers to pickup/tray height. |
| `grip(mm)` / `Robot.grip(mm)` | Finite number, 0..100 mm inclusive; decimals allowed. Jaw-gap target at 200 mm/second. Zero requests closed; 100 fully open. A held 40 mm parcel physically stops closing jaws at 40 mm. |
| `shoulder_angle()`, `elbow_angle()`, `aperture()`, `holding()` / camelCase Java equivalents | Argument-free numeric readings from the last completed tick. Holding is 1 for attached parcel, 0 otherwise; it is not a completion signal. Reads never advance time. |
| `wait(ticks)` / `Robot.waitTicks(ticks)` | Existing 1..600 whole ticks per call; 50 ticks/second. All commanded actuators move together. Setting or awaiting a target only acknowledges it; use a wait for arrival. |

These calls apply only to the arm mission. Old motor/servo/angle/scanner commands apply only to the light missions, with unchanged versions, limits and behavior. `clock()` and waits work in either world. Wrong-world calls, unknown fields, non-finite values, booleans, out-of-range inputs and fractional waits fail clearly. Python awaits robot calls; Java methods block for acknowledgement. Existing 1,500-tick/30-s simulation, 20-s execution, 45-s startup, 2,000-command, output/source limits and isolation remain unchanged.

At yaw s and elbow e, elbow position is `(0.8 cos s, 0.30, 0.8 sin s)`; gripper radius is `0.8 + 0.8 cos e`, height `0.30 + 0.8 sin e`. Angles are converted to radians only inside the model. Students use pose cards, not these equations. The pickup/tray positions are gripper positions at their declared yaw and zero elbow. Gripper position sensors beyond the joint readings are not needed for this lesson.

### Contact, release and collision

Each 20-ms tick advances the three actuators toward their targets without overshoot, checks the swept motion, then processes contact and payload motion. Grasp requires closing from above 40 mm to 40 mm or below while both joints are settled and the gripper is within 0.04 m of the available parcel. Only that closing edge can attach: closed-empty jaws do not attach later by passing through a parcel. An unsuccessful grasp stays empty until reopened and closed at a valid pose.

While attached, the parcel follows the actual gripper pose, and jaw gap is at least 40 mm. Opening beyond 45 mm releases on that tick. A delivery requires both joints settled and the release within 0.06 m of the selected tray; it puts the parcel at the receiving surface. Any other release is a failed drop, displayed directly below its release position at floor height. There is no throwing, bounce, sliding or automatic reset/regrasp after a drop. A delivered parcel cannot be duplicated or picked up again. Final success additionally requires no collision, settled joints and jaws, and an open gap of at least 80 mm. Carrying over the tray, printing a success or merely ending at its pose cannot pass.

The marked guard is the axis-aligned box `x=[−0.35,0.35], y=[0,0.65], z=[1.00,1.75]` metres. Check both arm links with 0.04-m clearance and the held parcel with 0.06-m clearance. Swept checks subdivide each tick's rotation to at most 0.1° per joint and expand contact by an additional 0.005 m (greater than the maximum 0.00419-m point displacement between substeps), conservatively covering intervening motion. Boundary contact counts as collision. Low turns cannot skip through the guard. This is a deliberately limited geometric model, not general rigid-body physics, self-collision or safety-rated robot planning.

A collision latches failure and freezes motion at the preceding safe pose, including the carried parcel. Subsequent commands cannot clear it; sensors remain readable and time remains bounded. Run/Reset makes a fresh scenario, clears collision/grasp/drop/delivery state and keeps the learner's code. Stop halts execution and preserves its visible snapshot/draft; the next Run starts fresh. Language, mission and profile switches retain existing cancellation/save boundaries.

## Independent expected observations and acceptance

Using the equations above independently of implementation: pickup at 30°/0° is `(1.385640646, 0.30, 0.80)` m; raised 30°/70° is `(0.929778829, 1.051754097, 0.536808057)` m; tray 150°/0° is `(−1.385640646, 0.30, 0.80)` m. The moved 135° tray is `(−1.131370850, 0.30, 1.131370850)` m. These anchors and boundary fixtures must compare numeric state, not rendered labels.

The reference lowers 35° to 0° in 40 ticks, closes in 25, lifts to 70° in 80, turns to the tray in 70, lowers in 80 and opens in 25: 320 ticks = 6.4 seconds. A 70° elbow lift needs 77.78 ticks at 45°/second; 80 settles it. A 120° shoulder turn needs 66.67 ticks at 90°/second; 70 settles it. Read `holding()` after closing and after opening. These reads do not add ticks. Each case fits existing runtime limits.

Required model checks: setters/readings do not advance time; exact rates, simultaneous motion, travel limits and numeric rejection; independent poses; valid and empty grasps, moving-joint grasp rejection, grasp/release boundaries, early/moving release, wrong tray, carried versus delivered, insufficient opening, low/swept collision, immutable prior snapshots, reset and deterministic replay. Reference and plausible wrong programs must run in real Python and Java. Trusted model/evaluation stay outside student execution; forged completion and old-model signals cannot grant L04 completion.

Required integration checks: all three cases, starter miss and informative recovery, syntax/range errors, Stop/infinite loop, Reset, language/mission switches, free hints/solution, old L01–L03 behavior, camera and narrow view, independent eight code/challenge contexts, fresh-browser profile restore, L03 prerequisite, sibling/family isolation and bounded history. New keys are `L04.python`/`L04.java`; never rewrite the six old drafts, completion IDs or model versions. Local memory stores do not establish hosted provider acceptance. Package both hosted targets without deploying; CI and a draft PR are review gates, not a release.

## Persona decisions and observation plan

- **Designer:** hardware coordination is the new demand. Keep familiar syntax, ordered waits and a fresh payload read; defer function syntax to L05. Preserve purpose → current-code prediction → one edit → observation → changed tray → explanation.
- **Critic:** avoid teaching that a target is arrival or closed jaws imply cargo. Show actual versus target angles, numeric holding, physically moving parcel and separate delivered state. Default instructions name the experiment without giving the 80-tick solution; hints remain free.
- **Robotics engineer:** use yaw/lift geometry rather than unexplained inverse kinematics. Freeze collision and contact rules above, with independent anchor calculations and wrong traces before building. This is a simulation; real servos require calibration, feedback and hardware-specific limits. [WPILib's servo documentation](https://docs.wpilib.org/en/stable/docs/software/hardware-apis/motors/servos.html) supplies a real positional-actuator comparison, not a drop-in SDK or this model's rules.
- **Teacher/student:** after implementation, perform an informed synthetic walkthrough in both languages, since the author already knows the references. Inspect the first editable wait, pose cards, collision recovery, meaning of holding, changed tray and safe resume. Actual reading burden, pacing and comprehension remain hypotheses.
- **Researcher:** retain the deferred classroom pilot. A future observation should record whether the learner predicts actual elbow position, fixes the order/timing using evidence, explains why empty closure and early opening fail, adapts the moved tray, and resumes the right case. Record help and active time separately from runtime waiting; no fabricated learner metrics.
