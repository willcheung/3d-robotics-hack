# RoboLab: product and delivery plan

Direction approved for kickoff with early play-test feedback. Working name only. Engineering review shaped delivery into one runnable slice per goal or eligible week; the curriculum can evolve after the prototype.

## The direction

A browser robotics workshop for middle- and high-school beginners. Students edit real code, see an original 3D robot respond, complete short missions, and learn to direct and evaluate AI assistance. No physical build is required. Students have separate sign-ins, saved progress, and a private family competition.

The learning goal is to understand, explain, change, and test robot behavior. AI is part of the workflow from the beginning. A successful generated program is useful; being able to spot a wrong assumption, predict a change, and test it is how we establish understanding.

The supplied CrunchLabs examples inform the relationship between code and hardware and the sense of playful experimentation. We will create our own robots, scenes, copy, and progression.

## What a student sees

Left: an explorable 3D model of the lesson’s mechanism: an arm, motor assembly, conveyor, lift, rover, or another relatable machine. Provide drag-to-orbit, pan, zoom, view reset, and useful front/top/isometric presets. Students can inspect from different angles while simulation is paused or running. Camera controls must never alter robot state. Show joint axes, motor direction arrows, sensor beams, and goal markers where they help explain behavior. Component isolation or transparent housing can expose how a mechanism works without turning the app into a CAD editor.

Right: a readable editor with short runnable examples, useful comments, and a small robot command reference. Run, Stop, Reset, and Restore Example are always visible. Code edits apply on Run rather than restarting a moving robot on every keystroke.

A compact mission card gives one useful job before its numerical targets: a stranded crew needs a light, or a worker needs a parcel delivered. Show the beneficiary and the result in the scene. Console output, sensor values, and a command timeline explain what happened. Highlight robot API calls when their commands execute; do not promise a full general-purpose Java/Python debugger in the first version. Error messages preserve the real error and add a plain-language explanation.

The AI coach opens as a drawer rather than taking a permanent third column. It can explain selected code, suggest a focused change, or help debug an observed failure. Students preview changes and choose whether to apply them.

## Foundation decisions from the first play sessions

The first version is the working foundation for later slices. Follow [FOUNDATION.md](FOUNDATION.md) for module boundaries, the implemented/planned capability ledger, concrete acceptance gates and the autonomous delivery contract. Preserve the current runnable Python experience while adding each new behavior.

Starter comments explain every executable line: imports, named values, allowed inputs, `await`, movement/time, reading sensors and printing. Define await beside its first call: setting accepted is different from motion completed. As code grows, explain branches, loop termination, async functions/parameters/returns, collections, sensor validity and priority inline; follow CURRICULUM.md’s self-study contract. A visible number guide states inclusive ranges, units, decimal vs whole-number rules, zero/sign meaning and why an invalid command stops. A tick is 0.02 simulated seconds; 50 ticks is one simulated second. Distinguish a Python variable's value from API validation, a valid miss from an error, and travel clamps from invalid input. Test boundaries rather than trusting help copy.

Use “Real life machines / robots” for application examples. Remove ECO mode; choose usable graphics defaults and retain reduced motion/WebGL fallback. Python and Java syntax colors distinguish comments, keywords, strings, numbers and robot calls as the student types. Preserve source, selection, undo and readable accessibility fallback while highlighting. The editor must support reliable keyboard editing, indentation/unindent, undo/redo, focus escape and Run shortcuts, preserving drafts through errors and resource limits. A lightweight working editor is acceptable for S01; autocomplete/debugger claims require their own implementation and evidence.

Show the selected “Python · Mission 1” or “Java · Mission 1,” keep separate drafts and a commented starter in each language, and distinguish Mission 1's three practice rescues from three full lessons. Next-rescue navigation preserves code, counts unique locations reached in the current visit, and explains the last available practice. S03H adds a persistent lesson map and experiment history; it must not silently replace source when a student advances. No unreleased lesson may appear playable.

## Guided mission access

Mission 1 is available for guest practice. Sign in and pass all three challenges with **Check & save progress** to unlock Mission 2, then repeat for each following mission. Only the active profile's server-checked milestones unlock work; local successes and practice logs do not. The curriculum opens locked missions as read-only scene/code previews, naming the earliest unfinished prerequisite and offering a return button. A completed mission earns a prominent **Next mission** action in the compact progress strip. Revisit completed missions through the curriculum; there is no mission dropdown. Preserve source, challenge and notes separately for each profile, mission and language. Preview navigation cannot edit, run, restore, save or manipulate the world.

## The lesson loop

### Curriculum preview section

The owner approved full-row visual previews for every lesson. Implement [CURRICULUM-PREVIEWS.md](CURRICULUM-PREVIEWS.md): a wide curriculum with chapter navigation, one scene/diagram beside each mission brief, a useful job, one learning takeaway and truthful progress/availability. Use real model screenshots where available and explicitly labeled concept diagrams for upcoming missions. Stack image and brief on narrow screens. The approved Mission 1–4 proposal is the layout reference; all 16 core and four optional lessons receive the same treatment.

Building or releasing each later mission includes maintaining this preview section: replace its concept with an actual model capture when the scene exists, communicate that mission's distinct task, verify framing/alternative text and keep availability tied to the lesson registry. Static previews come first; motion previews remain a separate possible enhancement. This presentation work does not authorize building later missions or changing checked-completion rules.

### In the workshop

1. Meet someone with a problem; see what the robot will accomplish for them. A short demonstration connects the mechanism to that job before introducing numbers.
2. Predict an outcome: “What will happen if this power is negative?”
3. Run working starter code and make one meaningful change.
4. Watch the world change (pickup point lit, parcel delivered, plant cooled), inspect telemetry, and compare it with the prediction. A miss explains what the person or machine still needs.
5. Complete a challenge with gradually reduced guidance.
6. Connect the mechanism to a real device, then explain or demonstrate the idea in a small variation. Ask what the code accomplished, not only which number worked.

Target the core explanation and first small win at 10–15 minutes within an approximately one-hour weekly session, leaving time for debugging, variations, transfer and reflection. Introduce one main new idea per lesson and revisit earlier concepts. These are design targets to validate with learners, not established learning outcomes.

After a successful run, show a clear challenge-complete label, the measured outcome and a short “Why it worked” explanation beside Run. Connect actual simulator evidence to the taught control concept; never infer branch/loop understanding from a green result. Keep one optional reflection and an immediate next action. Explanations describe the last executed run, even while the draft is edited. See TEACHING-PROGRESSION.md for the shared pattern.

Hints progress from a visual clue to a concept reminder, a small code change, and finally a worked example. Present one hint at a time with forward/back controls; keep worked examples opt-in after an attempt and label their scenario. Hints and AI help do not erase progress. After repeated difficulty, offer a shorter practice mission and an easier starting state. Advanced students can skip explanations after a short mastery check.

## Every lesson must have a purpose

This is an authoring and acceptance requirement, including early previews. Put the job and its beneficiary before code, and keep a concise real-world application visible outside collapsed help.

- **Job:** one child-readable sentence naming who or what needs the robot and what it must do. “Light the hikers so rescuers can find them,” not only “reach 60°.”
- **Mechanism:** show how each relevant command produces that useful action. Direction, height, grip, travel or sensor readings must correspond to the rendered machine.
- **Consequence:** observable before/after states driven by trusted model evaluation. A success label alone or a decorative story over an unrelated animation is insufficient. A wrong program leaves the job unfinished; reset restores the starting situation.
- **Real application:** name one familiar device or setting, explain the shared mechanism, and state the meaningful differences. Use primary references for specific hardware claims. A fictional rescue scenario is a teaching setting; this preview is not field-ready rescue software.
- **Transfer:** ask the child to adapt a changed need (a lower doorway, another delivery bay, a warmer greenhouse) and explain who benefits and how. A copied solution does not establish understanding.

Browser acceptance covers the visible purpose before Run, a useful success consequence, an unfinished result for a wrong program, and reset. Visual inspection must confirm the actuator, beam/object and target agree in each variation. During the child pilot, ask “What did your machine do for someone?” and “How could this help a real life machine or robot do a useful job?” Record confusion and revise the lesson; do not infer understanding from a green result.

**Mission 1 — rescue searchlight:** two hikers wait on a ridge. The motor turns the searchlight tower; the direction pointer is attached to its base. The servo tilts the lamp: 90° is level, 120° points 30° up, and 60° points 30° down. Hold the beam on the crew to mark their pickup point for rescuers. The first program stops short, so increasing `turn_ticks` has an observable reason. The scene and text change from crew waiting to crew located only after the trusted stopped/settled target check. This locates the crew; it does not claim to simulate completing their rescue.

The real-device bridge is a pan-and-tilt camera: turn toward a doorway and tilt to see who is there. [Adafruit's pan-and-tilt assembly guide](https://learn.adafruit.com/mini-pan-tilt-kit-assembly?view=all) provides a concrete mechanism reference. The shared idea is controlling two axes; that kit uses two positional servos, while this game uses a timed motor for the turn axis. Real hardware requires its own driver API, measured behavior and position feedback. The game's 30°/second at half power is a lesson model, not a hardware calibration.

## A robot world that grows with them

Use an original catalog of mechanisms and shared simulation components. Locomotion is one lesson topic, not the organizing principle. Missions can operate a factory arm, coordinate several motors in a lift or conveyor, aim a sensor, manage a greenhouse vent, or eventually control a simplified rocket lander. The rover is a core course extension after the foundational lessons. Rocket Lab is an optional later one-axis landing and launch/measurement/return extension after feedback and debugging. [CURRICULUM.md](CURRICULUM.md) specifies their jobs, concept ladder, model/API contracts, reference/wrong-program checks and readiness gates. Initial experiences:

- **Signal Station:** a motor-driven rescue searchlight with a direction dial and tilting servo head. First success: change one value so the beam reaches stranded hikers and lights their pickup point. Further targets move the crew to an east lookout or a lower cove.
- **Parcel Port:** add a two-joint arm and gripper. Pick up a parcel, clear a gate, and place it in a bay. Angles, sequence, loops, and functions become visible.
- **Rescue Rover:** attach two drive wheels and a distance sensor. Carry supplies, avoid obstacles, and navigate to a beacon. Conditions and feedback have a purpose.
- **Rocket Lab (optional):** bring a science capsule down gently, then extend that controller into a short launch, measurement and return. Altitude and vertical speed explain why thrust differs from a position command. Introduce one-axis inertia before any steering, orbital flight or complex aerodynamics.
- **Challenge Arena:** combine learned mechanisms in a timed, repeatable mission. A ghost of the student's previous best gives a useful comparison; sibling replays are optional.

Use expressive original shapes and small animations, but keep actuator motion physically interpretable. The early model is simplified and deterministic: motor power, travel limits, acceleration, collision rules, and sensors have documented semantics. It is not advertised as a calibrated replica of a competition robot. Introduce noise, inertia, encoders, and feedback explicitly in later lessons rather than making beginners troubleshoot unexplained randomness.

Start with Signal Station and Parcel Port. Rover and competition-field worlds follow after the core learning loop works.

## The foundation and extension learning path

Stages describe prerequisite order, not a promised weekly release schedule. Each offers short lessons, practice variations and optional free play; pace them using student feedback. Every lesson introduces one main idea. The revised inventory is 16 core outlines plus four optional outlines in CURRICULUM.md, targeting one hour per session with pilot-based pacing. The first six foundation lessons and their build mappings are explicit there; they do not include three copies of Mission 1's target variations.

| Stage | Useful mission and visible result | Real life machines / robots and transfer | Main programming foundation | AI skill |
| --- | --- | --- | --- | --- |
| 1 | Light a stranded crew's pickup point | Pan-and-tilt camera: aim at a lower doorway | Commands, named values and sequence | Request one change; predict its effect |
| 2 | Read the light's direction and choose a correction | A sensor-based camera check: respond to a moved target | One sensor read and a conditional branch; no feedback loop yet | Check a suggestion against the observed reading |
| 3 | Inspect each ranger checkpoint repeatedly | Inspection patrol: add a repeat without copying code | Loops and counters; reuse conditions separately | Verify repeat count and termination |
| 4 | Pick up and hand parcels to a worker | Arm/gripper sequence, then a reusable handoff to a different bay | Functions and parameters in a separate lesson after the arm sequence | Review and test a reusable behavior |
| 5 | Deliver a battery, then stop short of a moved barrier | Two-wheel rover: turn with two motors, then adapt using distance | Separate drive-coordination and feedback lessons | Compare fixed timing with a sensor-controlled solution |
| 6 | Bring boxes to a list of field stations | Delivery rover: reorder route steps and add a stop | Lists/arrays and iteration using visible drive functions | Provide examples and missed-stop cases |
| 7 | Repair the rover's unit or sensor-boundary bug | Reliable robot control: distinguish an unavailable reading from clear space | Debugging, units, boundaries and assertions | Challenge a plausible wrong suggestion with evidence |
| 8 | Stock a relief station with the correct supplies | Reuse the rover and parcel arm in a bounded shared job | State, composition and testing | Specify, inspect and improve a complete solution |
| 9 | Calibrate brightness, then classify supply-label colors in separate lessons | Optical marker and color sensors: explain unknown readings | Thresholds/calibration, then component comparisons | Test a suggestion under changed lighting and ambiguous labels |
| 10 | Sort supplies, then follow a marked route to the correct dock | Combine arm, rover, distance, light and color after teaching each | Condition priority, phases and integration tests | Test conflicts, stale data and incomplete deliveries |
| Optional image extension | Inspect a small pixel grid, then steer beneath a marker | Camera-guided inspection/docking with visible sensor images | Arrays, region counts, image coordinates, then feedback | Reject guessed detections and stale images |
| Optional flight extension | Land a science capsule gently; later launch, measure and return | A simplified robotic lander: adapt to a changed starting height or descent speed | Inertia and feedback, followed by mission states | Test a controller across declared starting conditions |

Use existing light/arm/rover mechanisms to teach the core progression. Greenhouse/conveyor worlds require separately scoped future slices; they are not hidden prerequisites of debugging or the initial six lessons. Rocket Lab follows successful rover feedback/debugging and a learner-fit review; it does not delay the core course. Full drone control and orbital launch simulation remain deferred.

Java is available through S02, not held until stage 7. All later released lessons offer both languages with equivalent objectives, sensors and feedback. Keep separate drafts, stop active runs when switching, and never silently translate or replace a student's source. Offer a Python/Java comparison lab after functions as an optional bridge, without making a new language a prerequisite for the rover or flight concepts. Python-first remains a suggested path.

Later packs can explore gamepad control, encoders, proportional control, autonomous state machines, and the team's actual competition SDK. Choose FTC or FRC mapping after maintainers confirm the target program and team tools. The teaching API is our own; it must not be presented as directly deployable FTC/FRC code.

## Motivation and family competition

**Parent participation:** the owner explicitly includes existing active parents in the family leaderboard MVP, alongside students, with a **Parent** label and the identical scoring, badges, legacy credit and quotas. Each participant resumes their own saved progress. Parent administration remains separate from competition; inspecting a child's summary never replaces the parent's own draft/session. The global kids' leaderboard excludes parent profiles at the server eligibility/projection/ranking boundary.

**October 18 implementation authorization:** [Family arena MVP](ARENA-MVP.md) is the current scoring/dashboard contract. The owner requested ten scored tries before a reward drops, another drop every ten, and a simple minimum lovable product reviewed before implementation. The owner selected the family scoreboard including parents first; the requested opt-in world arcade remains the next separately accepted slice. The owner subsequently authorized testing and production deployment; the family MVP is live from PR #16. Global child publication remains a separate scope.

The plan specifies independent attempts with shared family results as the first multiplayer mode. Each child gets a parent-managed private profile, alias, avatar, and separate saved programs. Provide genuine sign-in across devices before the family pilot; a browser-only profile picker is useful during development but is not the requested account system.

Track experiment history, demonstrated understanding, mission completion and game points separately. Ordinary Run practice, hints and AI help remain free. The ARENA rubric reduces the points available on an unfinished challenge after each ten scored tries; it never removes earned points or completed work. Save a bounded source snapshot and outcome for each attempt so a child can compare what changed; distinguish misses, code errors, stopped runs and infrastructure failures. Restoring an attempt must preserve the current draft and never auto-run it. Persist scored counters independently of the short history; see ARENA-MVP.md for legacy unknown counts, migration and once-only finalization. Award four mission-completion badges first. Concept/mastery badges and cosmetics remain outside this MVP; never award stronger motors that disadvantage another learner.

The first scoreboard compares earned progress points for the same four released missions. Each challenge earns 100 on scored tries 1–10, 90 on 11–20, and so on to a 50-point floor; all three successes add a fixed 200-point mission badge bonus. Show the rubric and next-check reward before submission. Ties share rank. Wall-clock/simulated time, laptop performance, code length and amount of AI assistance never determine rank. Any later multi-scenario family challenge needs its own reviewed authoritative evaluation contract; do not build that evaluator for the first progress scoreboard or retain the superseded simulated-time tiebreaker.

Keep personal improvement prominent. Cooperative or simultaneous live sessions can be considered in a separate future scope; the initial family mode compares independent submissions. No penalty for missing a day. The owner now requests a global arcade board; the proposed follow-up is signed-in and opt-in, with parent approval, student choice and generated aliases. Do not publish existing names or enroll any child automatically. A student who is behind can still complete the learning goal and earn the full mission badge bonus. ARENA-MVP.md keeps this world-board slice and other deferred work explicit.

Official family scores require authoritative server execution in both languages. A trusted model/evaluator owns state, simulated time, success, and rubric; student code receives only validated commands and bounded sensor observations. Store source and runtime/compiler/API/model/challenge/seed versions with trusted traces and result receipts. Never trust a posted score or student-created trace.

A deterministic seeded model does not make arbitrary Java/Python source deterministic. Define competition-supported execution, clock/random/thread behavior, computational budgets, failure aggregation, and ties. Prove that contract and test resource boundaries; if source eligibility cannot be enforced reliably, keep such programs practice-only. Independent deterministic model replay remains useful without promising arbitrary source replay.

## First useful release

The first development preview is one working Python motor/servo mission (S01). S02 adds genuine Java parity; all subsequent released lessons support both languages. Observe the first full lesson with a child at S03 before expanding content. Accounts, live AI, and official scores must not delay that feedback.

The six-lesson content pilot uses L01–L06 from CURRICULUM.md and needs S03H, S04 and S08–S10 in addition to the language/lesson foundation. It can run as supervised anonymous practice without waiting for accounts, official scores, hosting or live AI. Authored coaching examples remain labeled.

The separately qualified family-ready release adds:

- One polished split-panel workshop with Run/Stop/Reset, telemetry, and saved code.
- The six validated foundation lessons, with variables, conditions, loops, functions and transfer across the motor/servo bench and parcel arm.
- Real Python execution plus real Java execution for the equivalent introductory tasks, following the runtime gate.
- Two private child accounts and a parent account, persisted progress, and one shared challenge.
- Optional live AI coaching once S07 has live-provider evidence; its availability never blocks lessons or the family release.
- Meaningful success checks, a deterministic replay, and useful hints.

The expanded course is a roadmap; six polished foundation lessons are the first content target. Add core directional rover lessons, distinct light/color lessons and progressively combined jobs after those foundations; gate optional images and rockets on learner readiness. Family login and official scoring still need S05/S06; a hosted URL needs DEPLOY-01. An unrestricted construction editor, full drone flight, complex walking, CAD import, simultaneous multiplayer physics and a full competition field remain later proposals.

## Technical direction and early risk checks

Retain the implemented TypeScript/Vite application, Three.js scene and tested lightweight textarea editor. Consider an editor replacement only for a demonstrated learner need and with editing/accessibility/draft regressions; Monaco is not an automatic prerequisite for more lessons. Make lesson content data-driven. Keep the simulator independent of rendering so automated tests and server evaluation can execute the same model without a graphics card. Start with bounded kinematics and collision rules. Consider Rapier when lessons genuinely need rigid-body dynamics; pin the engine version and control initialization and timesteps.

Use a small shared robot API such as set motor power, move servo to an angle, advance simulated time, read a sensor, and log a value. Specify units and validation centrally. Python and Java adapters drive the same model and emit the same versioned telemetry format. Running code should actually execute variables, loops, and functions; matching strings or pretending Java is JavaScript is unacceptable.

**Python feasibility:** evaluate Pyodide in a module worker. Long-running code needs hard termination and bounded output. A worker keeps the UI responsive but is not by itself a security boundary. Host untrusted code on a separate origin with no account cookies or credentials, restrict network access, validate every message, and demonstrate the isolation. The trusted simulator must be outside the student-writable runtime state. Use a validated, ordered actuator/time/sensor message protocol with bounded payloads and backpressure. Student code cannot write model state, success flags, or rubric functions, including through Pyodide JavaScript interoperability. The UI receives bounded snapshots; sensors use simulated time rather than animation frame rate. Prove this boundary with adversarial programs, not import-name filtering alone.

**Java feasibility:** prove edit → compile → execute → sensor feedback → render before settling on the runtime. Evaluate a properly isolated JDK compile/run service and a browser JVM such as CheerpJ. CheerpJ runs bytecode; source compilation, stop behavior, licensing, and interop must be demonstrated separately. Preferred fallback is an ephemeral non-root JDK job with no network, no host mounts or secrets, read-only runtime, capped resources/output, and explicit cancellation. Sandbox both compilation and execution, cancel their entire process trees, and cap processes/threads/temp storage as well as CPU/memory/output. A networkless job still needs an explicitly ordered trusted pipe/message bridge: actuate → advance time → read sensor → branch → trusted result. Prove return-value ordering, backpressure, cancellation, and source-line mapping. Select only after a working prototype and operational review. Check actual CheerpJ personal/evaluation licensing before assuming payment is required. Do not silently remove Java from the product to avoid this work.

Accounts, competition validation, and AI use a small server layer. Store credentials only in server configuration. Parent-provisioned profiles need family-scoped access controls and secure sessions. Test separation between families as well as between children. Child accounts do not require public identities or a child's email address.

The AI coach receives only the current lesson, selected program, and relevant bounded error/telemetry context. Keep identity and family scores out of prompts. Use spending limits and timeouts, show that suggestions may be wrong, and never auto-run generated code. AI output cannot grade a leaderboard result or unlock a lesson on its own. Provider credentials and any paid hosting are setup dependencies, not something the agent purchases automatically.

License-check libraries, robot assets, and imported examples. We can learn from open-source projects without assuming every repository permits copying its code or art.

## Vercel hosting from the first chunk

Vercel is the web-hosting target. S01 must include a reproducible Vercel-ready production build, correct worker/WASM asset delivery, and a documented credential-free runtime-origin arrangement. The first working chunk remains playable locally; the separately authorized DEPLOY-01 gate supplies a hosted link the children can use on their computers. Every later slice retains a deployable package and required-service documentation.

Use Vercel for the web frontend and bounded application APIs; evaluate Vercel Sandbox for isolated Java/server challenge execution. Ordinary API handlers do not execute student code with application credentials. Browser Python is the first preview path; choose the Java/official scoring host only after isolation, bridge, cancellation, resources, latency, and costs are proved. Keep durable family data and preview/production environments separate.

Deployment checks cover HTTPS, worker/WASM headers and assets, origin isolation, camera/code/run/reset/Stop, route refreshes, access from learners’ devices, exact deployed commit, and rollback. Connecting Git can cause pushes to deploy, and a new Vercel project's first deployment is production under the current documented behavior. Treat bootstrap and automated preview/promotion policy as explicit operational decisions, not implied by a draft PR. Preparing this plan does not deploy the app. See DEPLOYMENT.md for the gate and primary sources.

## Delivery order: usable slices

Each slice extends the previously landed application and stops at one runnable student outcome. Self-contained means a fresh checkout provides the delivered experience without another unfinished branch, not that each slice rebuilds the application.

| Slice | Delivered experience |
| --- | --- |
| S01 | Original 3D motor/servo target mission with real Python, minimal editor, camera controls, Run/Stop/Reset, and trusted execution |
| S02 | Same mission in real Java, language switching, separate drafts, compiler feedback, and parity checks |
| S03 | One sensor-choice lesson with prediction, hints and a transfer check; early child pilot |
| S03H | Persistent lesson map and bounded experiment journal with safe restore and migration/recovery |
| S04 | One original arm/gripper pick-and-place mission in both languages |
| S05 | Genuine separate private family logins and saved progress with runnable local services |
| S06 | One trusted server-validated sibling challenge in both languages with versions, rubric, and replay |
| S07 | Live AI explain/suggest/debug assistance, previewed changes, limits, and outage fallback |
| S08–S10 | One patrol-loop lesson, one arm-function lesson, then a foundation transfer/debugging lesson; six-lesson content pilot |
| S11/S11H/S12–S14 | Rover directions/delivery, measured heading, distance-controlled stop, route lists, then debugging; one lesson per slice |
| S15 | First combined job: dock a rover and unload with the arm |
| S16–S17 | Separate reflected-light calibration and RGB label-classification lessons |
| S18–S19 | Two further combined jobs: sort relief supplies; follow a marked route, avoid an obstacle and identify the dock |
| X01–X02 | Optional one-axis gentle landing, then launch/measurement/return; gated by feedback skills and learner-fit evidence |
| X03–X04 | Optional pixel-grid image sensing, then camera-guided docking; gated by core sensing and learner-fit evidence |

S05–S07 do not gate anonymous lesson development when their services are unavailable. Student prerequisites and build dependencies are different: TASKS.md records the latter and CURRICULUM.md the former. All new entries remain draft; this plan update authorizes no later implementation.

OPS-01 is an operational proof rather than a student feature: actual scheduled usage/repository access, durable atomic cycle/slice ownership, and interrupted-run recovery. Detailed coverage lives in ENGINEERING-CHECKS.md; TASKS.md is the executable queue.

If a slice proves too large, split its observable behavior further. Framework scaffolding or a runtime stub alone is not a delivered chunk. No reliable calendar estimate is possible until runtime feasibility and learners’ devices are known. Completion checks, not a weekly deadline, define completion.

## Codex work, budget, and recovery

The hourly automation is configured to start at most one run per weekly reset timestamp when at least 50% remains and reset is in more than zero and at most 24 hours. Supported usage identifies the weekly bucket by its 10080-minute duration; missing values do not establish eligibility. OPS-01 must prove actual scheduled access and supported atomic ownership before unattended coding is described as operational. Prior history or a Markdown task file alone is not a lock.

Read BUDGET.md before applying the default reserves below; its expressly authorized current-cycle exception applies only while the live weekly reset matches. S01 is landed. The current explicit manual goal and its scope are recorded in GOAL.md; that manual build does not wait for the weekly trigger. Each manual goal or eligible cycle completes or resumes exactly one slice, then stops. At <=35% weekly remaining, stop starting implementation and reserve capacity for checks, repairs, persistence, and review. At <=25%, preserve and stop. Check usage before work, at checkpoints, and before expensive batches. Unavailable usage, reset passing during a scheduled run, or a concrete blocker means preserve and pause. Percentages do not imply tokens or guarantee a hard spending ceiling; other account activity and work between checks can consume the reserve.

Keep tested runnable checkpoints. If capacity cannot finish the current slice, preserve its branch and last runnable commit, identify unfinished changes, and record the exact next action. Resume that slice and PR before selecting new work. PROGRESS.md records status, base SHA, branch/worktree, PR, runnable/tested commits, actual evidence, unmet criteria, and blockers. States distinguish paused_budget, blocked, validated_local, review, and done. PR access failure leaves tested work validated_local, not complete.

The current first version does not prove scheduled coding access. OPS-01 must test the actual existing trigger environment, including unattended permissions, before marking it operational; follow FOUNDATION.md and TRIGGER-SETUP.md. Autonomous implementation hands over a validated draft, and dependent work waits for accepted code to land under the current no-merge policy.

Durable operational ownership must prevent overlapping hourly polls and manual goals from becoming competing writers. Test crash/recovery around branch/PR creation, reset rollover, and unavailable usage. Claim a new eligible cycle before resuming unfinished work; once a cycle has claimed its coding run, subsequent polls do not start another. Do not infer atomicity from a prompt instruction.

Work on a slice branch, preserve unrelated changes, run meaningful acceptance checks, and prepare one draft PR with screenshots for visual changes and an exact tested commit receipt. Dependencies become complete only after accepted work lands. No automatic merge or deployment is authorized; downstream work pauses on unmerged prerequisites. Later draft slices can become ready after their dependencies land and their acceptance contracts are concrete.

Quality gates apply to the behavior delivered in the current slice:

- Fresh-checkout setup, build, type checks, and relevant model/runtime/integration checks pass on the delivery commit.
- Independent numerical fixtures and known-good/wrong programs establish correct target and boundary behavior.
- Both-language slices prove actual feedback execution and equivalent observations within documented tolerances.
- Trusted ownership and isolation withstand malformed/forged messages and student attempts to set model/results directly.
- Fixed-seed model replay is independent of rendering speed; competition source eligibility and resource behavior are tested separately.
- Stop, infinite loops, excessive output, errors, and service outages recover without losing the student's program.
- Browser checks exercise the delivered edit/run/result/reset flow; later slices add hints/save/accounts/submissions as appropriate.
- Visual checks include inspected screenshots, keyboard operation, contrast, reduced motion, and unsupported-WebGL feedback.
- Account/challenge slices test tampering, duplicates, revocation, and cross-child/family access.
- Live AI requires a bounded real smoke test plus timeout/invalid-output/secret/limit checks; fixtures alone do not establish a working provider.

Completion and demonstrated understanding are separate records. A transfer check asks the student to adapt a target, predict a changed value, or fix a wrong suggestion. Authored examples can teach AI verification before live integration, clearly labeled as examples.

Pilot the first full lesson with each learner independently: can they make a visible change in about two minutes, finish without parental debugging, explain the concept, and want another mission? Record missing feedback as pending. Synthetic checks cannot prove engagement. Use actual friction to adjust lessons before generating a large library.

## Open curriculum decisions

The product is laptop-first and private to the family, with freely switchable Java/Python lessons around relatable mechanisms in explorable 3D. Python is the suggested first language, not a restriction.  Confirm the target FIRST program/team stack and learner devices. Those details tailor the competition bridge and performance targets without changing the core concept.

See `RESEARCH.md` for sources and alternatives, and `TASKS.md` for the implementation queue.

## October 11 hosted-family scope revision

The project uses Vercel + Sandbox and requested real online Java/Python, student progress and curriculum unlocks. The smaller first account model is private family profiles, consistent with separate attempts and shared results. DEPLOY-01 now brings forward usable L01 progress/history/accounts from S03H/S05; it does not imply those later multi-lesson slices or official S06 competition are complete. HOSTED.md records the implementation and actual provider limits. Keep the 16 core and four optional outlines; L01–L03 are now released. Completion means three server-checked challenges per mission; understanding/transfer remains a separate teaching outcome.

Future missions must use the same family ownership, draft-revision conflict handling, source snapshots, trusted checking and released/prerequisite distinction. Add version/migration tests before changing completion requirements. Keep history bounded and help/retries neutral. Include durable cancellation and a stale-profile test when editing Run or account flows. Storage providers must pass live concurrent-write and strong-ETag tests; mocks alone missed a real compressed-response conflict. Verify Function response streaming, request parsing, OIDC, deployed headers and both runtime origins before promotion. Preserve a protected preview and a separate production data store; public access changes and server-secret provisioning retain their explicit approval gate.

## In-app family setup follow-up

FAMILY-01 removes local-file provisioning from the parent journey: create a family, privately save the parent code, and add students from the app. Keep interrupted signup retry-safe, validate account/session switching, and bound signup and hosted compute across all families. Future account changes retain the four account UI regressions in ordinary CI plus real Blob/HTTPS checks before release. Preserve existing codes/data during migration. Verified parent email recovery is implemented in RECOVERY-01; larger classroom administration remains future work.

## Parent recovery and returning students

RECOVERY-01 adds optional verified parent recovery email; students continue with their individual access codes and can ask their parent for a replacement without losing drafts or progress. Verification requires the current parent session/code plus email proof. Recovery preserves the same family and rotates only parent credentials. Every future account change must retain expired/replay/race, partial-write recovery, non-enumerating responses, email limits, role isolation and saved-progress tests. Preserve the original host during custom-domain migration; local browser drafts and cookies do not automatically cross hosts.

## FAMILY-02 design: email sign-in and quick family onboarding

Design requested October 12, 2026. The subsequent manual goal authorizes combined FAMILY-02A/B/C implementation and protected staging QA on PR #3; production promotion remains separate. The owner selected **one notification for each student's first successful sign-in**, not recurring activity email. Prioritize reaching the first lesson over settings, tutorials or credential paperwork. Design target: a new parent can reach student login cards in about two minutes, excluding inbox delivery; a returning student can resume from one code or link. Validate these targets with people and actual inboxes rather than claiming them from automated tests.

### Parent and student journey

1. **Choose Parent or Student.** Parent uses one **Continue with email** form for both new and returning families. Student sees **Enter your student code**. Keep **Try Python without an account** visible. Do not place signup, recovery and student login in one long form.
2. **Parent enters email, then a six-digit code.** Send one transactional message: “Your RoboLab sign-in code.” The code expires after 10 minutes and verifies the address while signing in. Use a single paste-friendly field with numeric input mode and one-time-code autofill; provide Change email, a visible resend countdown and an inbox/spam hint. No password, separate verification email, automatic second welcome email or requirement to copy a long parent code. Never display a successful delivery claim just because a request was queued.
3. **Resume or create the family.** After email proof, return the parent to their existing family. If an address already manages multiple families, show a private family chooser; never silently select, merge or create a duplicate family. If none is linked, ask for student nicknames on a compact **Create family** screen, with **I already have a parent code** nearby for older families. Use “Parent” by default; a parent display name is optional. Family creation happens only after an explicit action and is retry-safe.
4. **Add children in one batch.** Start with one nickname row and **Add another student**, up to the existing six-active-student limit. No child email, birthdate, public username or password is needed. **Create student logins** immediately shows one card per child: nickname, private student code, Copy login link, Copy code and Print cards. The student code is the login credential; do not introduce a second username/PIN pair just to call it a login ID. Nicknames identify the card but cannot authenticate.
5. **Email the setup details once.** A clearly stated part of Create student logins is sending the verified parent one message containing the newly created students' names, private codes and student-only login links, plus a parent-dashboard link with no parent credential. Combine siblings created together; do not send one email per nickname row. Display **Ready — email sent**, **Email pending** or **Email needs retry** from actual delivery state. Cards remain usable when email fails. After setup, adding another student sends one new-student receipt; existing students' codes are not rotated or resent implicitly.
6. **Let the child start.** A student opens the copied link and confirms **Start learning**, or pastes their code. Show their nickname and **Start Mission 1** or **Continue mission** with saved work loaded. On the parent's device, **Let this student start here** explicitly switches profiles after saving/protecting the parent's current editor; ordinary Copy/Print actions leave the parent signed in. A shared device has a visible Sign out / Switch student action and never silently opens someone else's draft.
7. **Confirm setup once.** On the first successful interactive student sign-in, notify the verified parent: “Alex signed in to RoboLab. Their account is ready.” Include View family progress, not credentials or source code. Dashboard status changes from **Waiting for first sign-in** to **Ready**. Reloads, session refreshes, practice, future sign-ins and code replacements do not send another first-sign-in notice. Parents can turn this notification off; sign-in codes and explicitly requested access details still arrive.

Parent sessions retain the existing seven-day lifetime. Routine email sign-in creates a session for the same parent and does not rotate parent codes, student codes or progress. Existing verified recovery addresses are eligible for email sign-in after fresh email proof. Older families without a verified address use the existing parent code once to connect email, with current-parent reauthentication plus email proof; email alone must never claim an unlinked family. Keep explicit recovery/revoke-all actions for a lost or compromised credential. Changing email requires recent parent reauthentication and proof of the new address; the old address stays valid until the change commits, then old pending sign-in challenges and queued credential mail must become invalid.

### Quiet email policy

| Event | Email behavior |
| --- | --- |
| Parent requests sign-in | One short-lived code; Resend is an explicit rate-limited action. Verification also establishes the parent email. |
| Parent creates one or several students | One setup receipt for that submitted batch; no separate welcome campaign. |
| Each new student signs in successfully for the first time | One parent notification, enabled by default with a clear preference. Failed attempts never trigger it. |
| Normal sign-in, session refresh, lesson completion or return after a break | No email. |
| Parent requests a replacement student code | One credential receipt after explicit confirmation; old student sessions/code are invalidated, saved work is retained. |

For a new family with two students, the normal initial sequence is four messages: one parent code, one combined setup receipt and two first-sign-in confirmations. There are no scheduled reminders, inactivity nudges, progress digests or marketing emails in this scope. Existing students must not receive retroactive “first ever” notifications: their historical sign-ins were not recorded. Mark them as existing profiles; begin first-sign-in notifications only for students enrolled in the new flow. A legacy student's next observed sign-in may update the dashboard without emailing.

### Credential, retry and migration contract

- Preserve family/profile IDs, existing access codes, revocation epochs, both missions' language drafts, experiment history and checked unlocks. New fields are additive. Never rename a student by merging on nickname. Current email lookup can reference several families and must remain valid; no implicit uniqueness migration.
- One-time parent codes are distinct from reusable student codes. Generate codes with a cryptographic RNG, bind each to purpose, normalized email and a high-entropy browser challenge, and store only a keyed verifier. Ten-minute expiry, at most five failed guesses per challenge, account/IP throttles across challenges, constant-time comparisons and atomic consumption are required. Resend must not reset the attempt/expiry budget. Reading mail on another device is fine; enter the code in the requesting browser. A new browser can request its own code.
- Before proof, use the same response for new and existing email addresses and disclose no family/member list. A correct proof grants only that address's verified family memberships. Every family is rechecked against its current verified address and active parent at consumption; stale indexes and an email change cannot grant old access. A neutral failure is not a reason to erase current work.
- Keep seven-day secure HttpOnly sessions, exact Origin checks and stale-profile guards. Require explicit account switching; save or preserve the active editor before replacing the session. Reject malformed/expired/replayed challenges, cross-family access and logout/revocation races. Session-cookie response loss must have a bounded retry tied to the original browser, not reuse by another client.
- Student links carry a high-entropy student credential in the URL fragment, never a query parameter. Remove it from the address bar immediately; an explicit POST completes sign-in. A page GET, email scanner or preview must not log a student in or trigger the first-sign-in email. Use no third-party analytics on credential entry pages. Mask codes except when deliberately showing/printing newly generated cards; exclude codes and email contents from logs, traces and screenshots.
- Store student credential hashes as today. To send/retry setup mail, retain the necessary credential payload only in an authenticated encrypted, short-lived outbox envelope; never add plaintext codes to family documents. Use a versioned server-only encryption key and an explicit expiry/cleanup policy. After the payload expires, a parent may explicitly generate and email a replacement code, with a warning that it signs out that student; there is no promise to retrieve a hashed old code. No existing student code is changed merely to support email delivery.
- Make create-family, batch-add-students, replacement-code and setup-email requests idempotent. Persist one result per request ID; reusing an ID with different input fails. Parallel tabs and dropped responses cannot create duplicate children, issue two credentials or send repeated setup receipts. Commit the profile/access version and durable email intent together where possible; stale/orphan invite records must never authenticate. Reconcile multi-document writes explicitly.
- Record first successful student sign-in once using an atomic conditional update, with an event key derived from family/profile identity, not session or credential version. Login/authentication helper calls used for parent administration are not student sign-in events. Email preferences, parent verification, student active state and credential version must be rechecked before sending delayed messages. Code rotation never resets the first-sign-in flag.

### Delivery and operational readiness

Reuse the existing verified Resend sender and private store. The current recovery mail adapter gives every send a new idempotency key; new retryable mail must instead use the stable outbox-event key. Resend keeps idempotency keys for 24 hours, so persist our own sent/failed/unknown receipt and never blindly retry an uncertain event after that window. An accepted provider request is not proof of inbox delivery. See [Resend idempotency documentation](https://resend.com/docs/dashboard/emails/idempotency-keys).

First-sign-in notifications must not hold up student login. The intended background-delivery candidate is [Vercel Queues](https://vercel.com/docs/queues), currently beta with durable, at-least-once delivery. Before making the mail slice ready, prove project/plan availability, costs, authenticated consumer integration with this custom Build Output API, deployment isolation and retries. Queue messages contain event IDs only; sensitive payloads remain in private storage. Durable outbox state and provider idempotency must tolerate duplicate queue delivery. A detached promise or an in-memory “sent” flag is insufficient. No queue, service, credential or scheduler is created by this design; lack of an authorized reliable delivery path blocks that slice rather than weakening the promise.

Freeze notification quotas and encryption retention before implementation. Preserve the existing overall 60-email/day service budget unless separately authorized; distinguish parent-code requests from setup receipts and notifications so several children cannot use up one parent's sign-in allowance. Reserve capacity for requested authentication by limiting optional notices. Keep per-address/per-IP abuse protection, explicit resend cooldowns, bounded retry lifetimes and visible failures. Expired credential mail must not be delivered later as valid access instructions. Authentication/storage failures must never claim success; delivery failures after successful account creation keep usable cards and a retryable receipt. No quota resets, paid upgrades or changes to the Robotics usage trigger are part of this work.

Security review should apply [OWASP authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) and [one-time recovery-token guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html) to the concrete implementation. Email proof is one authentication factor; this design does not claim MFA or phishing resistance. The product screen explains only the action, expiry and recovery choices the user needs.

### Delivery slices and acceptance

FAMILY-02A delivers real parent email signup/sign-in, the existing-family migration and the same-family return path. FAMILY-02B adds retry-safe batch student cards and the combined setup email, including reliable delivery/credential expiry. FAMILY-02C adds first-sign-in state, the parent's preference and one deduplicated notice. Each must be independently runnable and preserve both missions; see TASKS.md. The whole requested onboarding experience is complete only when all three slices are accepted. ENGINEERING-CHECKS.md defines the negative/race/browser/provider gates. Do not expand into classroom administration, passwords, routine activity monitoring or another mission.

## Released slice: Mission 2

S03 / L02 is released in both languages; PROGRESS.md records the authorized merge and hosted checks. [MISSION-02.md](MISSION-02.md) remains its design and acceptance contract. It reuses the editor, model, accounts and teaching controls, including mission-aware drafts/navigation/checked progress. Keep the remaining S03H journal/understanding work separately scoped; TASKS.md controls future readiness, and this release starts no later slice. Every later mission must pair a real job with observable consequences, other hardware applications, a commented starter, graduated hints, prediction/transfer and penalty-free challenges. Learner/device/pacing observation remains pending.

### FAMILY-02 implementation contract

The combined manual goal supersedes the internal A/B/C merge ordering for PR #3. Additive account fields preserve old families; the owner permits starting fresh but no production wipe is required. Parent login uses fresh email proof and preserves the existing family. Legacy code setup remains an advanced alternative.

Email budgets share the existing 60/day service cap: up to five authentication requests, five credential batches/replacements and six first-sign-in messages per verified address per UTC day. Optional notices stop at 48 service sends to reserve authentication capacity. Authentication has a 60-second resend cooldown, five wrong guesses per challenge, and cross-challenge address/IP limits. Retries reuse quota reservations and provider identities.

Temporary authentication code envelopes expire after 10 minutes; credential envelopes/cards expire after 23 hours, within Resend's 24-hour deduplication window. AES-256-GCM uses a versioned envelope and a domain-separated HKDF key from the existing server-only session secret. Queue cleanup is scheduled before sensitive writes/delivery; cleanup may run after its deadline during a provider outage, but expired payloads cannot be used or delivered. Sent mail payloads are deleted immediately; family reads also scrub expired envelopes if queue cleanup was delayed. Request IDs, hashes and status receipts remain for replay protection. Session-key rotation needs an explicit migration plan; ordinary releases never rotate it.

Vercel Queues is a deployment-partitioned durable outbox transport; messages contain only private record identifiers. It uses project OIDC and a private consumer, with retries and leases. Publishing failures show a parent retry action; valid student login does not wait for the email provider. Protected staging proved the actual custom Build Output trigger, private consumer, provider delivery and both-language saved work. ONBOARDING-QA.md and PR #3 record the exact-commit gates and remaining human observations.


## Released Mission 3 and the actuator progression

L03 / S08 shipped under [MISSION-03.md](MISSION-03.md), reusing landed map/draft/journal/family behavior instead of waiting for the broader S03H expansion. Repeat built-in function calls to inspect every checkpoint in a route; a final pose alone is insufficient. The [curriculum review](CURRICULUM.md#october-13-review-richer-hardware-without-a-syntax-pile-up) makes the arm's third gripper actuator explicit, adds calls to student-defined helpers inside loops in L05, and scopes a later roller intake/flywheel collection proposal behind feedback and model-readiness gates. Increase meaningful job requirements while keeping retries and help free. No new actuator ships implicitly with L03.

Missions 1–3 and FAMILY-02 onboarding are released. The owner authorized PR #4 merge and deployment after software qualification, with persona review now and the real classroom pilot later. PROGRESS.md records the release evidence. Mission 4 has since landed and deployed under its reviewed arm/gripper contract; PROGRESS.md records passing staging/candidate checks and the shared-allowance block on remaining public runtime checks. No later mechanism ships implicitly.

### Teaching refinement across the progression

The current manual scope includes shared L01–L03 teaching/recovery improvements and the authored course-wide progression in [TEACHING-PROGRESSION.md](TEACHING-PROGRESSION.md). Future mission contracts must retrieve earlier concepts, freeze one main new demand, and specify actual-code prediction, diagnostic evidence and changed-need transfer before implementation readiness. Classroom timing and independence remain unvalidated.

## Email-only parent entry follow-up

The owner subsequently chose one standard parent sign-in flow: email. FAMILY-03 supersedes FAMILY-02's retained public parent-code signup/login/recovery paths; [PARENT-EMAIL.md](PARENT-EMAIL.md) freezes the transition and failure rules. Existing code-only families prove their old credential and email once, keeping their original records. Existing verified recovery emails already qualify for email sign-in. Student codes, active sessions, guest Python and the saved-progress model remain. New runtime mechanisms and Mission 4 stay separate.

FAMILY-03 landed in PR #5 and is live after authorized staging, candidate and public acceptance. [PROGRESS.md](PROGRESS.md) records exact source and evidence. The owner subsequently authorized the separate Parcel Port slice. MISSION-04.md now freezes its teaching/model contract; MISSION-04-QA.md records the review candidate and remaining release/learner gates. No later mission is authorized by that work.
