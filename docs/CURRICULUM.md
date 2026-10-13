# Curriculum design: commands, arms, mobile robots and sensors

Planning revision, October 11, 2026. The curriculum requires useful real-life jobs, commented code, direction control, arms, light/color/image sensing and increasingly combined challenges, with optional flight where it supports the course. This is an authored design, not implemented content or evidence of learning. L01 and L02 are released in Python and Java; the current authorized L03 goal adds the patrol loop. DEPLOY-01 provides the curriculum map and private family progress, while other lessons remain authored outlines; TASKS.md owns build readiness and FOUNDATION.md owns acceptance. No later slice starts through this planning revision.

## Decision and learning sequence

Include **Rescue Rover in the core course**, after students have used variables, conditions, loops and functions on visible mechanisms. Include **Rocket Lab as an optional later extension**, beginning with a one-dimensional soft landing and then a short launch/measurement/return mission. Full drone flight, orbital flight, propulsion construction, terrain mapping and general vehicle physics are outside this course version.

The rover extends familiar motor power into two-wheel coordination, then gives sensor feedback a practical reason: reach someone without hitting an obstacle. The lander makes a different relationship visible: thrust changes motion over time, so turning thrust off does not stop a falling vehicle. Flight belongs after students can explain a sensor-controlled rover; it must not make the first coding lessons depend on aerospace mathematics.

Core learner order (see the lesson inventory below for individual sessions):

1. **Signal Station:** use a value to turn and tilt a light toward people who need it; explain commands, time and variables.
2. **Read, then choose:** inspect the light's direction sensor and make one conditional correction. A single `if` comes before a feedback loop.
3. **Ranger patrol:** repeat an explained inspection sequence with a loop; see each checkpoint actually inspected.
4. **Parcel Port:** sequence an arm/gripper handoff, then package that sequence as a function with a destination parameter.
5. **Transfer/debugging:** adapt a changed pickup or light target; distinguish a correct result from a copied program that works only once.
6. **Rescue Rover:** coordinate forward/reverse and left/right motor commands, turn using measured heading, reuse loops and conditions to stop at a measured distance, then use a list of route steps.
7. **Reliable controller and first combined job:** debug units or sensor boundaries, then coordinate the rover and arm at a relief station.
8. **Light and color:** calibrate a light threshold, then distinguish colored supply labels; combine those learned readings with the arm and rover in two harder jobs.
9. **Optional extensions:** camera images followed by image-guided docking, or one-axis landing followed by launch/measurement/return. Neither extension blocks core completion.

The first six complete lessons are L01 values/searchlight (S01 refined by the lesson shell), L02 sensor choice (S03), L03 patrol loop (S08), L04 arm sequence (S04), L05 parameterized arm function (S09), and L06 changed-need transfer/debugging (S10). Mission 1's three target variations are practice within L01, not three lessons. Build order differs from teaching order: the lesson map must use concept prerequisites, not slice numbers. Java becomes available through S02, with the same objectives and separate drafts in every subsequent lesson; no student waits until a later week for Java.

## Common student-facing contract

Each lesson begins with a 10–15 minute guided activity around one main new idea, a short runnable starter, a prediction, a useful before/after result, graduated hints and one changed-need transfer. Time and difficulty are pilot hypotheses. Reuse familiar controls and terms. Show the beneficiary, actuator and sensor together: **code → controller/driver → actuator → movement → sensor reading → next decision**. Students need to identify what moved and why before they optimize it.

Every numeric input has its range, inclusive ends, unit, sign/zero meaning, integer/decimal rule and invalid-input behavior beside the example. Explain each executable starter line, including reads and prints; follow the inline-comment contract below. Keep 1 tick = 0.02 simulated seconds and whole waits of 1–600 ticks per call unless a separately versioned contract change is justified; design reference missions within existing 30-second simulated and 20-second execution limits. Test runtime startup separately. New worlds do not silently relax resource limits.

The title **Real life machines / robots** stays visible. Explain the real machine connection and what our model leaves out. Practice errors retain code and invite a correction. Next preserves drafts, distinguishes available lessons from locked or unreleased content, and supports revisiting experiments. Keep ECO removed, camera motion independent, and keyboard/reduced-motion/WebGL behavior intact.

## Rescue Rover: direction, feedback, routes and debugging

Use one original two-wheel rover with a passive support wheel and a visible supply tray. Start on a flat floor with a few fixed shapes. Reuse that model for all rover lessons. A space outpost can be a later visual setting using the same skills; do not present this chassis as a copy of a six-wheel Mars rover.

| Lesson / build slice | Useful job and visible result | One main idea and earlier knowledge | Learner change and transfer | Reference / wrong-program evidence |
| --- | --- | --- | --- | --- |
| R01 · S11 · Deliver to the dock | A field crew needs a battery. Drive the loaded tray into the marked dock and stop; the dock receives the battery only after validated arrival. | Two-motor coordination; reuse power, time and a sequence. | Change left/right power to turn, then adjust one segment to a moved dock. Predict equal, unequal and opposite wheel powers first. | Equal power goes straight; opposite powers rotate; wrong turn, passing through at speed, stopping outside, or touching the wrong dock cannot deliver. |
| R01b · S11H · Turn by measurement | Point the battery rover into a side loading bay, then stop. | Heading feedback; reuse a sensor condition and bounded loop. | Predict forward/reverse, left/right arcs and a turn on the spot; change the starting heading and target turn. | Feedback reaches the declared heading tolerance across starts; wrong sign, stale heading, crossing the angle wrap incorrectly or omitting stop fails. |
| R02 · S12 · Stop where the person is | A supply recipient stands behind a changing docking marker. Approach and stop with a visible gap; never touch the barrier. | Distance feedback and clearance; reuse the measured-turn feedback loop. | Replace a fixed wait with read/decide/move/wait/re-read. Move the barrier so yesterday's timing misses while feedback adapts. | Correct controller handles every authored starting distance; stale reading, reversed comparison, no wait, missing stop and collision remain failures. |
| R03 · S13 · Make the delivery round | Several field stations need a box each. Follow a list of route steps; show which stations actually received a box. | Lists and iteration; reuse student-readable drive/turn/deliver functions. | Reorder a short route or add a stop without duplicating the whole program. | Route steps execute real motor commands; skipping a station, duplicate delivery, wrong order where required, or a hidden teleport cannot pass. |
| R04 · S14 · Fix a misleading reading | The rover stops too late because its units or sensor checks are wrong. Repair it so the next delivery arrives intact. | Debugging with observations and boundaries; reuse R02. | Correct one authored bug, then test a boundary and an explicitly shown unavailable-sensor case. | A bad reading never means “clear path.” Controlled stop and a useful explanation are checked separately from successful delivery. |

R03's route helper is visible, commented and editable, built from earlier motor/sensor actions. Do not supply an opaque `drive_to_goal()` that completes the learning objective. Teach arrays in Java and lists in Python with equivalent behavior, without making object-oriented syntax a prerequisite for the Python learner.

### Rover model and API design constraints

Language-neutral names here are proposals to freeze before S11 becomes ready. `drive(left, right)` accepts finite values from −1 to 1 inclusive; sign controls direction, 0 stops that wheel, and relative wheel motion controls turning. Explain that this first model maps power to ideal wheel speed, without slip or acceleration. Physical robot power needs calibration and feedback. Retain `wait(ticks)`; only simulation steps advance the mechanism.

Use meters for position/distance and degrees for the heading displayed to learners. Fix wheel spacing, maximum speed, heading convention, robot footprint, dock tolerances, sensor range and contact rules in a versioned model specification with independent fixtures before implementation. Use short routes that fit the existing run limits. The initial distance sensor is ideal and measures ahead from a defined sensor origin; show its ray. Specify a distinct maximum-range reading (“this far or farther”) and do not later reuse it to mean sensor failure. A fault fixture is introduced explicitly in R04, with a documented validity signal and a safe-stop response.

Success requires all stated deliveries, stopped motion and no disqualifying collision. Check swept movement so a fast step cannot pass through a barrier or dock unnoticed. Sensor readings come from trusted model state at the last completed tick. No GPS teleportation, inferred movement from source text, procedural terrain, pathfinding engine or noise in the first rover slice. S11H adds an ideal heading sensor with an explicitly labeled robot-forward arrow, world axes and clockwise/counterclockwise convention. Freeze its range, wrap boundary, angular error calculation and tolerance before readiness. The student-readable turn helper uses measured heading and motor commands, never changes pose directly. Wheel encoders, slip and noise remain later named extensions; do not imply the ideal heading sensor is a calibrated physical gyro or compass.

## Lesson inventory and weekly pace

The revised design contains **16 core lesson outlines and 4 optional outlines**. L01 and L02 are released in both languages; L03 is the current implementation goal. Each has three practice variations. Slice IDs also include platform work, so counting TASKS.md headings is not counting student missions.

| Core lessons | Number | Build slices |
| --- | --- | --- |
| L01–L06: values, a sensor choice, repetition, arm sequence, arm function, transfer/debugging | 6 | S01, S03, S08, S04, S09, S10 |
| R01, R01b, R02–R04: wheel directions, heading, distance feedback, route lists, sensor debugging | 5 | S11, S11H, S12–S14 |
| C01: relief station, first combined job | 1 | S15 |
| P01–P02: light calibration, color classification | 2 | S16–S17 |
| C02–C03: sort supplies, follow and dock | 2 | S18–S19 |
| Optional V01–V02: image sensing, image-guided docking | 2 | X03–X04 |
| Optional F01–F02: land, launch/measure/return | 2 | X01–X02 |

Aim for one lesson per **one-hour weekly session**: 10 minutes of recap/purpose/prediction, 15 of guided code, 25 of experiments and a changed scenario, 10 of explaining the result and saving a next step. Thus the core is a proposed 16-session path, with up to four optional sessions. This is an unvalidated pacing target, not a promise of 20 weeks of released content. Combined jobs may need two sessions; let a learner save halfway and resume. A mini experiment is not another counted mission. Pilot the first foundation, rover, new-sensor and optional-image/flight lesson before multiplying that content.

## Comments and help for independent learning

Every starter explains **why a line is there and what it changes or returns**, beside the line. Teach new syntax at first use, then retain enough local explanation that a learner can revisit a mission without a separate tutorial. Comments can be folded into short function/loop blocks as programs grow, but every executable line must have an identifiable explanation. Keep purpose, units, return values, stop conditions and failure handling; do not pad code with restatements such as “call motor.”

- **First commands:** explain imports, assignment versus comparison, parentheses/arguments, comments and indentation. Define `await` where it first appears: it pauses this program until the call returns. Setting motor power or a servo target returns on acceptance, not physical arrival; only `wait(ticks)` advances motion here. A sensor call returns a reading; `round` and `print` do not move hardware or need await.
- **Conditions and loops:** explain what the comparison means, true/false branches, which indented lines repeat, why the sensor must be read again, why the loop waits, how it stops and what happens on missing data. Have students predict a tiny trace of reading → decision → command → next reading.
- **Functions and collections:** explain definition versus call, parameters/local values/return, `async def` for Python helpers that await, and each call site. Explain list/array indices, bounds and traversal when introduced. Java comments teach its actual selected synchronous/asynchronous API and syntax; never suggest Java has Python's await keyword.
- **Multiple sensors:** label what each reading measures, its coordinate frame, sampling time and validity, and how competing conditions are prioritized. Explain named states and allowed transitions before asking for a state machine. Provide a short readable starter and optional expanded annotated reference; no hidden helper solves the objective.

Each released lesson needs a recap of required concepts, a small working starter, one editable first step, a predicted result, readable trace/output, three graduated hints (observation → relevant concept → worked step), a glossary at the point of use, a reset/recovery path and a changed-need transfer with feedback. Solutions remain available after an attempt and explain the reasoning; help and retries are penalty-free. Authored guidance works without AI or accounts. Include a “ready to move on” explanation prompt and an explicit next/revisit/end path. Test that a learner can recover from a wrong unit, syntax error or stale reading without an adult rewriting the program; actual independence still requires teen observation.

## Arm, light and color sensing

**L04 / S04 is the robotic-arm mission:** two labeled servo joints and a gripper pick up a parcel, lift clear of a marked obstruction and place it in a worker's bay. Teach sequence first. L05 / S09 then turns that working sequence into a parameterized handoff function. Freeze joint axes, degree limits, gripper aperture/commands, reach envelope, payload attachment and release rules; clearly show unreachable positions. No opaque `pick_and_place()` or unexplained inverse kinematics. Reference and wrong-pose/missing-grasp/early-release/collision programs prove actual manipulation. Learners connect this to a sorting or assembly arm and explain what feedback/calibration real hardware would add.

Reuse the rover or arm delivered by the prerequisite slices for the following sensor lessons. **Brightness is not color; neither is object recognition.** Teach each separately before combining it.

| Lesson / slice | Useful job and new idea | Student control and real-life connection | Required transfer / wrong cases |
| --- | --- | --- | --- |
| P01 · S16 · Find the inspection strip | Stop the rover's downward sensor over a bright inspection strip so a worker knows where to check the tray. New idea: calibrating a threshold from measured light/dark samples. | Read reflected brightness, print samples and choose a threshold. This resembles an optical marker/line sensor; normalized simulator brightness is not a claim of measured lux. | Change the strip/floor brightness within a declared separable range. A guessed threshold, reversed comparison, shadow fixture or unavailable reading must not falsely count as aligned. |
| P02 · S17 · Read the supply label | Read a stationary parcel label and select its matching bay indicator. New idea: classify color from components and keep an unknown case. | Inspect bounded red/green/blue readings and write the comparison; no motor or new arm motion is introduced here. Connect to label checking in a sorting machine. | Move the sensor to another known label, then an ambiguous/unknown one. Swapped channels, brightness-only classification and guessing a bay for unknown cannot pass. Distinguish colors with similar brightness. |

Sensor contracts are frozen before ready: visible sensor mounting and sample footprint, scene-space sample point, fixed-tick sampling, legal output ranges, missing-data/validity flag, max-rate/message bounds and calibration fixtures. Proposed brightness is 0–1 inclusive and proposed RGB is three integers 0–255 inclusive; these are planning choices until the API version is fixed. Invalid command arguments raise useful errors; valid low light or ambiguous color is an observation the program handles, not an input-range error. The trusted sensor samples authored world surfaces independently of the viewing camera, graphical quality or device pixels. Use bounded explicit illumination variations only after showing their effect; no surprise random noise. Labels also use text/shapes so vision or color perception is not the only way to understand the task.

## Increasingly combined challenges

These are separate complete jobs, not one enormous final exercise. Each reuses taught inputs, outputs and code helpers; a challenge must not quietly introduce a new sensor, syntax or hidden solver. Scenario difficulty grows by combining skills and changing declared conditions, not by shortening arbitrary deadlines or penalizing tries.

| Challenge / slice | Previously learned skills | Complete job and evidence |
| --- | --- | --- |
| C01 · S15 · Stock the relief station | Rover directions/heading/distance, functions and arm sequence | Dock a supply rover, stop, then have the arm unload one parcel into a bay. Teach a small named-phase sequence here (arrive → docked → unload → complete). No handoff until safe dock; no payload teleport, stale dock flag or delivery before release. |
| C02 · S18 · Sort the relief supplies | C01 plus calibrated light/label location and color classification | At the existing dock, inspect two arriving parcels and use the arm function to put each in its matching bay. Unknown labels stop with an explanation. Misclassification, wrong bay and duplicate counting cannot pass. |
| C03 · S19 · Follow the route and dock | R02 distance loop, P01 brightness, P02 color and C01 phases | Follow a short marked route using reflected light, stop for a barrier, identify the color-coded dock and park. Explain priority: invalid sensor or obstacle → stop, then route following, then verified dock. A bright strip alone is not the correct dock. Test moved obstacle, changed brightness and wrong destination. |

For C03, use one visible editable steering rule (the light sensor follows a strip edge) and a low-speed, generous course proven feasible with that rule. This introduces combining conditions and priority, not a hidden PID/path-planning library. Keep route, dock and label fixtures bounded; freeze exact tolerances and all reset states. Make early combined jobs practice before any official scoring. S06 must separately qualify each model with trusted both-language execution before family results become official.

## Optional image-sensing extension

**V01 / X03 — Find the marked inspection area:** return an actual small RGB sensor image from a fixed robot-mounted camera, display that image with pixel coordinates, and let the learner count matching pixels in named regions to choose where to inspect. New idea: an image is a grid of samples, not an answer such as “goal is left.” Reuse arrays, loops, functions and color classification. Start with high-contrast authored shapes; a bounded proposed 16×12 frame avoids huge data and unexplained machine learning. Freeze resolution, field of view, camera pose, image origin/axes, sampling cadence, occlusion and frame/tick identity before ready. Test the real versioned sensor pipeline from world geometry to pixels independently of the student's viewer. Empty, occluded, ambiguous and stale images must not produce an invented detection. User uploads, general object recognition, networking and a learned model are outside this slice.

**V02 / X04 — Dock beneath the inspection marker:** combine the taught image-region error with the existing rover steering and distance stop; align under a marker and stop in the inspection bay. Show the sensor view separately from orbit controls. Reference programs adapt to declared marker offsets; prerecorded answers, stale frames, a wrong marker, lost detection or crossing the bay at speed fail. No new arm, camera model or machine-learning concept is added in the combined challenge. This is a simplified camera-guided docking connection, not a claim of full autonomous navigation.

Both are optional and await core sensor lessons, actual learner-fit feedback and feasible both-language references. A fixed, trusted software sensor renderer may generate the frame; a canned classification returned by the API or reading the freely orbiting display canvas is not image sensing. Physical cameras add optics, exposure, latency and calibration absent from the first model. Introduce those limits in the real-life explanation.

## Rocket Lab: an optional feedback extension

Use an original uncrewed instrument capsule above a single landing pad. It can only move vertically; the learner can still orbit the 3D camera. Show height, vertical speed and a thrust indicator with a visible ground reference. Introduce the distinction between a desired position, current velocity and applied thrust with a prediction before code. Students need only signed numbers and comparisons initially; equations and proportional control are optional extensions.

| Lesson / build slice | Job and visible result | New idea / prior knowledge | Transfer and objective |
| --- | --- | --- | --- |
| F01 · X01 · Bring the instrument home | A science team needs its fragile measurement capsule returned intact. Begin above the pad in a documented descent; adjust thrust to land gently. | Inertia and braking over time; reuse variables, loops, sensor conditions and rover debugging. | Change starting height or descent speed. Landing requires ground contact with acceptable impact speed; merely crossing height zero or freezing the final display cannot succeed. |
| F02 · X02 · Launch, measure, return | Send the capsule to a low marked measurement band, hold it long enough to collect a reading, then return the instrument intact. | Explicit mission states; reuse F01's controller and functions. | Change the measurement band. A preflight condition must allow launch, the measurement must actually occur, and a gentle return must complete the job. A countdown or upward animation alone is not success. |

F01 is the first flight slice, with a complete landing outcome. F02 extends the same working model; it is not an orbital-launch simulator. Draft the landing controller and test several achievable starting conditions before promising the pack. If the reference needs unexplained calculus, a large control library or continual adult intervention, simplify the scenario or postpone it. A rover-focused learner can finish the core course without this extension.

### Lander model and API design constraints

`thrust(level)` accepts a finite value from 0 to 1 inclusive. It sets upward thrust, not altitude or speed. At 0, gravity still acts; negative throttle is an input error. Read `altitude()` in meters and `vertical_speed()` in meters per second, with positive meaning up. Keep a fixed timestep and document the velocity/height update order. Use a deliberately simplified constant-mass model, constant gravity and bounded thrust, with no fuel depletion, drag, rotation or steering initially. Values are toy-world parameters, not specifications for physical rocket hardware.

Before X01 becomes ready, freeze gravity, maximum acceleration, initial height/speed, ceiling, landing-speed tolerance and numerical integration/contact rules; prove the reference succeeds within the existing run budgets. Independently check free fall, balanced thrust and rising motion. At contact, grade the **pre-impact** speed before clamping position/velocity. High-speed impact is a failed landing even if the renderer rests the vehicle on the pad. Ceiling escape and time expiry also fail. A valid low-thrust setting can fail the mission without being a range error. Stop cancels the simulation immediately; it does not teach that cutting thrust physically freezes a flying machine.

F02 adds a small state contract: waiting for valid readiness conditions → ascent → measurement dwell → descent → landed. Freeze the readiness inputs, dwell duration and outcome rules before promotion. Student code may keep its own controller state, but cannot set the evaluator’s authoritative mission phase or claim a sample directly; the trusted evaluator derives progress from observed states. Show which requirement remains unmet. Fault scenarios get explicit sensor validity and bounded responses; do not add surprise failures to the first flight experience.

## Evidence, motivation and real hardware connections

These connections justify the examples; the course design is our own. [ROBOTIS describes TurtleBot3](https://emanual.robotis.com/docs/en/platform/turtlebot3/features/) as a two-wheel differential-drive platform with motor control and sensors. That makes it a concrete hardware comparison for the rover, without requiring ROS, buying a kit or installing a hardware SDK.

[NASA/JPL describes Perseverance's AutoNav](https://www.jpl.nasa.gov/news/nasas-self-driving-perseverance-mars-rover-takes-the-wheel/) using terrain observations to identify hazards and choose paths. Our first rover teaches the smaller read/decide/act loop, not equivalent mapping or Mars navigation. [NASA's ALHAT account](https://www.nasa.gov/space-technology-mission-directorate/tdm/autonomous-landing-hazard-avoidance-technology-alhat/) connects altitude/velocity sensors and onboard software to controlled landing. Rocket Lab reduces that idea to one axis. Sources reviewed October 11, 2026; no source establishes that our lessons improve learning.

On each machine, have the student point to the input, actuator, motion and feedback. Then ask a transfer question: “Where could a real robot use this, and what would you need to measure or change?” Explain that a driver translates commands for a controller, hardware supplies energy, sensors measure results, and real calibration/latency/limits differ. No physical build or hardware deployment is required.

Keep experiments and help penalty-free. Save source/outcome history through S03H; show progress and understanding separately. Family challenges compare separate attempts at the same versioned scenario, reliability before simulated time, only after S06's authoritative evaluation supports that new model and both languages. All required landing/delivery constraints must pass before time can help rank a run. New worlds start as practice; an existing leaderboard does not automatically qualify them for official scoring.

## Readiness and acceptance for every new world

- Explicit beneficiary, one main new idea, prerequisite lesson IDs, number guide, line comments, hints, changed-need transfer and both-language starters.
- Versioned numerical contract, feasible reference programs and intentional wrong programs. Independently calculated motion/sensor/contact fixtures; range/type/nonfinite and exact-boundary checks.
- Real Java/Python conformance through the existing trusted bridge; no writable authoritative state, result, phase, collision or score fields in student code.
- Browser edit/run/result, error recovery, infinite-loop Stop, reset during movement, rapid lesson/language changes, stale callbacks, source snapshot and history recovery. Reset clears velocity, payload, sensor, mission phase and completion state for the active run.
- Inspect camera views for correct heading/thrust/height/sensor geometry; narrow layout, keyboard use, reduced motion and fallback. Slow rendering must not change results. No theme-specific settings maze.
- Fresh build and both hosting packages; exact-head CI, inspected screenshots and a durable receipt. Unavailable provider/hosting services must not block anonymous practice.
- Observe the first rover lesson before multiplying rover content, and the first flight lesson before expanding flight. Pending student feedback stays labeled pending; a missing interview may permit unrelated work but does not establish engagement or justify mass content generation.

## Build-plan review from all feedback so far

| Finding | Planning change |
| --- | --- |
| Learners could see a number move without understanding its job | Every lesson begins with a beneficiary and shows a useful world consequence; application and transfer remain required. |
| Numbers, ticks and errors were unclear | Keep inclusive ranges/units/type rules, every-line comments, explicit time conversion and error-versus-miss distinctions in all new APIs. |
| Language and progression were unclear | S02 delivers actual Java; the map distinguishes practice, released lessons, locked prerequisites and future worlds. No fake runnable language or dead Next path. |
| S03 combined too much behavior | Keep S03 focused on one sensor lesson; add S03H for the persistent lesson map and experiment journal. Each is a useful deliverable. |
| S08+ was too vague for unattended selection | Define S08–S19, S11H and optional X01–X04 as bounded draft outcomes with landed dependencies. They still require readiness review; no new coding is authorized now. |
| New syntax and richer sensing could overwhelm self-learners | Teach await and every new construct inline; separate heading, brightness, color and images; add progressively combined jobs only after their component lessons. |
| An arm was easy to miss in the roadmap | Make the two-joint pick/place lesson and later parameterized arm function explicit; reuse them in two relief-station challenges. |
| One mission per week risked conflating a quick activity with a complete lesson | Plan 16 core one-hour sessions and four optional outlines, with save/resume and pilot-based pacing; L01 and L02 are released; L03 is the current goal. |
| Curriculum weeks implied missing machines and simultaneous new concepts | Reuse the light/arm for six foundations, introduce rover drive before route lists, and debug the existing rover. Greenhouse/conveyor/drone worlds remain separate future proposals. |
| Six lessons and a family-ready release were conflated | Six authored foundation lessons can be evaluated without live AI/accounts/scores. Family deployment and official challenges retain their separate gates. |
| Editor and automation proposals were stale | Preserve the tested lightweight editor; a replacement needs a demonstrated learner need. Preserve existing trigger eligibility/duplicate protection, OPS-01 proof, one writer/one slice, current BUDGET.md exception and review-before-dependent-work. |

This review refines S01’s await comments/help and its runtime acceptance fixture, and updates future plans. It does not implement any later mission or change the existing automation, deployment or settings.

## Mission 2 implementation contract

The next authorized lesson is L02 / S03, **Read, then choose**. [MISSION-02.md](MISSION-02.md) freezes the useful rescue job, real hardware connections, three sensor-choice/transfer cases, free hints and finite badges, both-language comments, a one-hour session hypothesis and mandatory tests. Future lessons must retain these same purpose, prediction, trace, transfer, draft, family and error-recovery requirements; engagement and independence still need observed teen feedback.


## October 13 review: richer hardware without a syntax pile-up

The owner suggested a third motor that spins, launches or grabs, plus functions inside loops. Keep the 16 core / four optional lesson inventory; the additional actuator ideas below are scoped proposals, not extra released missions or permission to build them now.

- **L03, Ranger patrol:** repeat existing built-in motor/servo/wait/sensor function calls in a counted loop. Three complete routes require more than one final pose: every ordered checkpoint must receive a steady dwell. This teaches repetition before new mechanics. [MISSION-03.md](MISSION-03.md) freezes the current goal.
- **L04, Parcel Port:** make the third independently controlled actuator explicit: shoulder servo, elbow servo and powered gripper. Gripping is a separate physical action, not a synonym for pointing the arm. Teach joint sequence, aperture and confirmed grasp/release before introducing reusable helpers. Freeze contact/holding/release limits and a trusted payload-presence reading with the model; a closed empty gripper cannot carry a parcel.
- **L05, reusable handoff:** first distinguish a library function from a student-defined helper. Show an editable `handoff(destination)` built from taught calls, then call it inside a bounded loop. Parameters select a bay; returns can describe an observed result. Python helpers with awaits use `async def`/`await`; Java uses a visible static method with the same behavior. Helpers cannot teleport payloads or return trusted completion.
- **Later mechanism proposal, after L05 and feedback/debugging:** a continuously spinning roller intake can collect foam parcels into a tray; later, a separate flywheel/feed-gate exercise can deliver foam balls to a collection basket. Choose one mechanism per slice after a learner review. Grippers set aperture; rollers set power; flywheels need speed feedback and spin-up time. These different effects must be taught, not hidden behind one generic third-motor button. The [REV intake designs](https://docs.revrobotics.com/ftc-kickoff-concepts/powerplay-2022-2023/intake) and [flywheel-control example](https://docs.revrobotics.com/ftc-kickoff-concepts/decode-2025-26/programming-teleop/programming-flywheel-control) provide concrete hardware comparisons. This is a simulated sports/collection mechanism, with no physical launcher build instructions.
- **Freeze before readiness:** actuator ranges/units, speed response, object count, sensor validity, single feed/release, capture/miss/jam/reset rules, achievable reference and wrong programs in both languages. A speed threshold and object-present check must control the feed; a spinning animation alone cannot claim a delivered object. Avoid adding contact physics or ballistics to L03.
- **Increasing stakes:** make more of the team's job depend on correct software—several checkpoints, an intact parcel, the correct bay, then a coordinated delivery with sensing. Expose partial completion and what remains. Keep mistakes reversible, hints free and retries penalty-free; avoid arbitrary countdowns or a larger pile of unexplained commands.

The existing multi-lesson map and saved journal now support L03's integration. For this explicitly requested manual goal, S08 depends on landed S03 and includes its own draft/map/history/unlock regressions; full S03H understanding/local-history work remains a separate draft. This changes no scheduled ownership, eligibility, merge or deployment rule. Actual teen comprehension/engagement remains unobserved and is part of the owner checklist.
