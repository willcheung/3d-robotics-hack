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

## The lesson loop

1. Meet someone with a problem; see what the robot will accomplish for them. A short demonstration connects the mechanism to that job before introducing numbers.
2. Predict an outcome: “What will happen if this power is negative?”
3. Run working starter code and make one meaningful change.
4. Watch the world change (pickup point lit, parcel delivered, plant cooled), inspect telemetry, and compare it with the prediction. A miss explains what the person or machine still needs.
5. Complete a challenge with gradually reduced guidance.
6. Connect the mechanism to a real device, then explain or demonstrate the idea in a small variation. Ask what the code accomplished, not only which number worked.

Target the core explanation and first small win at 10–15 minutes within an approximately one-hour weekly session, leaving time for debugging, variations, transfer and reflection. Introduce one main new idea per lesson and revisit earlier concepts. These are design targets to validate with learners, not established learning outcomes.

Hints progress from a visual clue to a concept reminder, a small code change, and finally a worked example. Hints and AI help do not erase progress. After repeated difficulty, offer a shorter practice mission and an easier starting state. Advanced students can skip explanations after a short mastery check.

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

The plan specifies independent attempts with shared family results as the first multiplayer mode. Each child gets a parent-managed private profile, alias, avatar, and separate saved programs. Provide genuine sign-in across devices before the family pilot; a browser-only profile picker is useful during development but is not the requested account system.

Track experiment history, demonstrated understanding, mission completion and personal bests separately. Retrying is encouraged and never penalized. Save a bounded source snapshot and outcome for each attempt so a child can compare what changed; distinguish misses, code errors, stopped runs and infrastructure failures. Restoring an attempt must preserve the current draft and never auto-run it. Define migrations, corrupt/quota-limited storage and exactly-one terminal receipt per run before implementation; see FOUNDATION.md. Award a finite set of lesson badges for completion and demonstrations of concepts. Earn cosmetic robot parts and workbench decorations; do not make stronger motors a reward that disadvantages the other learner.

A weekly family challenge uses the same challenge version and seed set for both students. Rank successful runs first by reliability across those scenarios, then by simulated completion time. Show the rubric before entry. Wall-clock speed, laptop performance, code length, number of retries, and amount of AI assistance do not determine the winner. AI assistance is allowed under the same policy for students.

Keep personal improvement prominent. Cooperative or simultaneous live sessions can be considered in a separate future scope; the agreed initial family mode compares independent submissions. No penalty for missing a day and no public leaderboard. A losing student can still complete the week's learning goal and earn the completion badge.

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

Read BUDGET.md before applying the default reserves below; its expressly authorized current-cycle exception applies only while the live weekly reset matches. S01 is landed. The current explicit S02 manual kickoff and its usage/scheduler exception are recorded in GOAL.md; that manual build does not wait for the weekly trigger. Each manual goal or eligible cycle completes or resumes exactly one slice, then stops. At <=35% weekly remaining, stop starting implementation and reserve capacity for checks, repairs, persistence, and review. At <=25%, preserve and stop. Check usage before work, at checkpoints, and before expensive batches. Unavailable usage, reset passing during a scheduled run, or a concrete blocker means preserve and pause. Percentages do not imply tokens or guarantee a hard spending ceiling; other account activity and work between checks can consume the reserve.

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

The project uses Vercel + Sandbox and requested real online Java/Python, student progress and curriculum unlocks. The smaller first account model is private family profiles, consistent with separate attempts and shared results. DEPLOY-01 now brings forward usable L01 progress/history/accounts from S03H/S05; it does not imply those later multi-lesson slices or official S06 competition are complete. HOSTED.md records the implementation and actual provider limits. Keep the 16 core and four optional outlines, with only L01 released. Completion means three server-checked rescues; understanding/transfer remains a separate teaching outcome.

Future missions must use the same family ownership, draft-revision conflict handling, source snapshots, trusted checking and released/prerequisite distinction. Add version/migration tests before changing completion requirements. Keep history bounded and help/retries neutral. Include durable cancellation and a stale-profile test when editing Run or account flows. Storage providers must pass live concurrent-write and strong-ETag tests; mocks alone missed a real compressed-response conflict. Verify Function response streaming, request parsing, OIDC, deployed headers and both runtime origins before promotion. Preserve a protected preview and a separate production data store; public access changes and server-secret provisioning retain their explicit approval gate.

## In-app family setup follow-up

FAMILY-01 removes local-file provisioning from the parent journey: create a family, privately save the parent code, and add students from the app. Keep interrupted signup retry-safe, validate account/session switching, and bound signup and hosted compute across all families. Future account changes retain the four account UI regressions in ordinary CI plus real Blob/HTTPS checks before release. Preserve existing codes/data during migration. Verified parent email recovery is implemented in RECOVERY-01; larger classroom administration remains future work.

## Parent recovery and returning students

RECOVERY-01 adds optional verified parent recovery email; students continue with their individual access codes and can ask their parent for a replacement without losing drafts or progress. Verification requires the current parent session/code plus email proof. Recovery preserves the same family and rotates only parent credentials. Every future account change must retain expired/replay/race, partial-write recovery, non-enumerating responses, email limits, role isolation and saved-progress tests. Preserve the original host during custom-domain migration; local browser drafts and cookies do not automatically cross hosts.

## Current next build: Mission 2

The user authorized S03 / L02 in both languages. [MISSION-02.md](MISSION-02.md) is its concrete design and acceptance contract. Reuse the existing editor, model, accounts and teaching controls. Bring forward only the mission-aware draft/navigation/checked-progress work needed to deliver a complete second lesson; keep the remaining S03H journal/understanding work separately scoped. Every later mission must pair a real job with observable consequences, other hardware applications, a commented starter, graduated hints, prediction/transfer and penalty-free challenges. No release or learner-pilot claim follows from implementation alone.
