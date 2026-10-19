# Project brief

Status: kickoff authorized. See `PLAN.md`, `RESEARCH.md`, `TASKS.md`, and `GOAL.md`.

## Confirmed requirements

- Middle- and high-school beginners, learning Java and Python, including FIRST participants.
- Teach variables, loops, functions, and further foundations through increasingly difficult short lessons. L03 repeats familiar built-in calls; L05 teaches an editable function with parameters and calls it inside a loop. A later spinning intake/flywheel proposal requires its own feedback/contact/readiness contract; see CURRICULUM.md.
- Teach AI-assisted coding alongside understanding, predicting, and checking behavior.
- Khan Academy-style interactive instruction and sandbox: a 3D robot/mechanism on the left, editable runnable code on the right.
- Starter comments explain every executable line. Every numeric input states its allowed range, inclusive ends, units, whole-number/decimal rules, zero/sign meaning and invalid-value behavior; explain ticks as simulated time and await as waiting for a call to return, not for physical arrival. Later code explains conditions, loop termination, functions, collections and sensor validity at the point of use. Errors preserve code and support correction. See FOUNDATION.md.
- Every lesson begins with a concrete job: who needs help, what the machine must accomplish, and a visible change in their world. Explain a real-world use of the same mechanism and ask the student to transfer the idea. Moving a pointer or reaching a number alone is not a sufficient student-facing goal. The curriculum requires this refinement on October 11 after trying Mission 1.
- Simulated motors, a two-joint arm with an independently controlled third gripper actuator, directional rover movement with heading/distance feedback, then light and color sensors. Several combined jobs reuse learned components; small image sensing is a later optional extension. No physical build required.
- Plan 16 core lesson outlines and four optional outlines, targeting one hour per weekly session with save/resume and learner validation. Missions 1–4 are deployed in Python and Java (full public runtime acceptance passed in the October 17 preview release); see PROGRESS.md for release evidence. Each lesson supports independent learning with recap, prediction/trace, graduated hints, recovery and transfer; actual teen independence must be observed.
- CrunchLabs references inspire rather than prescribe original robot designs/control interactions.
- Separate child logins and independent attempts with shared family results (confirmed October 11). October 18 authorized implementation: use an arcade-style family scoreboard including parents and each participant's own progress, with 100-point challenge rewards reduced by 10 after each ten scored tries, down to 50, plus a 200-point mission badge bonus. Practice Run and help remain free; time never affects rank. [ARENA-MVP.md](ARENA-MVP.md) defines the minimum lovable release and a separate opt-in global-board follow-up. This supersedes the earlier retry-neutral competitive rubric and simulated-time tiebreaker; the family MVP is live from PR #16; global competition remains deferred. Simultaneous live control remains outside scope.
- FAMILY-02 is live: parents use an emailed one-time sign-in code, get student login details in one setup receipt, and receive a notification only for each student's first successful sign-in (owner-confirmed). FAMILY-03 makes email the only standard parent sign-in flow; old code-only families connect once while keeping their students and progress. Existing accounts/work are preserved and routine activity stays quiet. See PLAN.md and PARENT-EMAIL.md for the contracts, and PROGRESS.md for release evidence.
- Regular small wins and clear next-step navigation without overwhelming students. Distinguish practice variations, completed lessons, transfer understanding and official scores. Label real-life applications as “Real life machines / robots”; no ECO control. Make available languages and the final available lesson explicit.
- Research commercial/open-source alternatives before committing to implementation.
- Target Vercel hosting from the first chunk: reproducible deployable build, later hosted family-play link, deployment checks, and isolation-aware Java/scoring services.
- Decompose the agreed plan into autonomous Codex chunks with substantive quality checks. Every delivered chunk runs on its own as an addition to the existing app; preserve and resume unfinished chunks across weeks.

## Initial direction

October 18 arena amendment: existing parents participate alongside students in the family MVP with their own saved progress, identical points/badges and a Parent label. Admin controls stay separate. The global kids' board excludes parents; approving a child never enrolls the parent.

- Working name: RoboLab; laptop browser first.
- Mechanism-based missions: control arms, individual/coordinated motors, lifts, conveyors, and other relatable machines. Locomotion is one topic, not the whole product. Rescue Rover is a core extension after motor/sensor/loop/function foundations. Rocket Lab is an optional later one-axis landing and launch/measurement/return extension after feedback and debugging; full drone/orbital flight is deferred. See CURRICULUM.md for lesson prerequisites, hardware connections, model contracts and acceptance.
- Freely switch between real Java and Python in every released lesson; preserve separate drafts. Python-first is a suggested learning path only.
- Fully explorable 3D: orbit/spin, pan, zoom, reset/preset views; camera exploration is independent of simulation state.
- S01 is an honest Python-only development preview; S02 adds real Java parity. An early child pilot follows the first complete lesson. The later six-lesson content pilot, qualified family release and expanded course have separate readiness gates; stages are not a promised weekly schedule.
- Parent-managed private accounts; personal bests and family challenges; AI allowed equally.
- Trusted simulation and official scoring independent of rendering speed; define eligible source/runtime behavior rather than promising arbitrary code is deterministic.
- S01 is the runnable foundation: trusted model/protocol, isolated real runtime, editor/run lifecycle, renderer and acceptance harness. Expand it through tested slices rather than rebuilding it. Runtime and actual scheduled-access proof precede unattended expansion; see FOUNDATION.md.

## Open context

Target FIRST program/team SDK, learner devices and starting experience. Vercel is the web-hosting target; account/project access and actual deployment approval remain setup dependencies. Auth/AI and isolated runner configuration follow their feasibility gates.

## Execution workflow

Maintainers review high-level direction, not every implementation detail. Tasks have dependencies and observable acceptance criteria. Approved ready tasks may execute unattended under the weekly usage trigger. An explicitly authorized manual goal need not wait for the scheduling condition.

Read BUDGET.md before applying the allowance reserves below; its current-cycle exception applies only when the live reset matches. The active trigger checks hourly for at least 50% of weekly allowance remaining and a reset in >0 and <=24 hours; it is configured for one slice run per cycle. Resume existing work first. Stop starting implementation at <=35% remaining; preserve and stop at <=25%. These thresholds reserve headroom but cannot guarantee consumption. End-to-end scheduled access and atomic ownership remain unproven OPS-01 gates. Keep durable runnable checkpoints and exact resume receipts. Changes are tested and prepared as draft PRs; downstream dependencies wait for accepted work to land. Merges, deployments, purchases, and credential setup require separate authorization.
