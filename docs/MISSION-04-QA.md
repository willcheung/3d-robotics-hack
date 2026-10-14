# Mission 4 candidate: persona and software evidence

This records the owner-authorized S04 candidate on `codex/mission-04-parcel`, based on `773d02049e1460d6db32c2fcf23da9020554590a`. [MISSION-04.md](MISSION-04.md) is the frozen contract. The draft PR and its checks identify the exact tested head; PROGRESS.md records the delivery checkpoint. Missions 1–3 remain live. This candidate has no Mission 4 provider, production, classroom or learner-device acceptance yet.

## Teaching decisions and informed walkthrough

The eight repository personas were applied as review lenses. Design, critique and model work preceded implementation. The student and teacher pass was **informed and scripted**: the reviewer had already read the implementation and references. Browser execution and inspected screenshots establish software behavior, not how an actual beginner thinks or how long a class takes.

| Lens | Decision or observed evidence | Consequence / next check |
| --- | --- | --- |
| Curriculum designer | Retrieve L01 setting versus arrival, L02 fresh readings and L03 ordering. Hardware coordination is the new demand; sequential syntax stays familiar. | Keep functions and parameters in L05. Ask learners to explain the existing sequence before naming it as a helper. |
| Critic | Empty closure, carrying and delivery are different states. Target angles are not measured angles. | Show actual/commanded values and payload state; holding alone cannot unlock completion. |
| Robotics model | Three actuators, fixed rates, geometric grasp/release and swept guard contact have independent numeric fixtures. | Keep this deliberately simplified yaw/lift mechanism; do not imply full rigid-body physics or physical-hardware compatibility. |
| Informed student | Both starters turn after only 10 lift ticks. Execution prints an actual elbow of 9° before the turn, then reports a guard collision. Changing the wait to 80 delivers; unchanged destination code fails the moved-tray case. | The first edit and feedback form a causal experiment. Whether a learner understands it without copying Hint 3 remains unobserved. |
| Teacher | Python and Java expose the same first edit, free hints, opt-in explanation and pose cards. Reset retains code. Eight code/challenge contexts resume; profile saves survive a fresh browser. | Java has more visible boilerplate. Offer each learner one language; record reading/help burden separately from runtime waiting. Notes remain device-only. |
| Builder | Implemented three delivery cases using the existing trusted model/runner, draft, history and account boundaries. | Preserve previous lessons and no automatic execution on resume. |
| QA skeptic | Wrong programs, limits, reset, cancellation, malicious completion claims and persistence were exercised. Review found the defects below. | Require repaired regressions and exact-head CI before review handoff; provider qualification stays separate. |
| Learning researcher | No real learner observation was added. Successful programs and synthetic personas cannot establish understanding. | Prioritize the small observation protocol below before expanding the arm into further mechanics. |

## Findings resolved in this candidate

| Finding | Evidence | Repair and focused verification |
| --- | --- | --- |
| M4-01 · Misfiled progress | Family view placed patrol checkmarks under Mission 4 and omitted parcel rows. | Each heading now owns its correct checklist. The real local Java progression test checks L03 complete/L04 empty, then all three delivered rows. |
| M4-02 · Python argument parity | Server closures exposed an extra operation parameter; malformed calls could select another valid operation. This did not bypass trusted validation. | Closure factories enforce one setter argument and zero sensor arguments. Actual CPython executes all three deliveries; malformed positional/keyword calls emit no command. |
| M4-03 · Collision diagnosis | The collision latch overwrote commanded targets with the last safe actual angles. | Freeze actual motion while retaining the learner's targets. Model and both-language browser regressions require the original 70° lift/150° turn after collision. |
| M4-04 · Scene readability/geometry | Screenshot/source inspection found faint/overlapping gripper labels, a hard-to-locate parcel and a misoriented elbow hinge. | Reposition/brighten the label, mark the parcel, orient the hinge perpendicular to the lift plane and match rendered link radius to the contact contract. Inspect final desktop/narrow views. |
| M4-05 · Prior-world diagram | The hidden new gripper leader had no initial numeric endpoint, breaking the existing searchlight diagram check. | Initialize its hidden endpoint; preserve searchlight descriptions and rerun its existing regression. |

## Executed checks and limits

Local environment: macOS, Node 24, Chromium, real browser Pyodide, CPython 3 for the server-shim conformance fixture, and Temurin JDK 21 in the existing isolated Colima/Docker runner. CPython shim fixtures run only authored synthetic code; they do not prove the hosted sandbox boundary. Local account tests use disposable in-memory families and fixture email.

- Model/schema/preview suite plus new CPython tests: independent hand coordinates, actuator rates, type/range boundaries, immutable snapshots, deterministic 320-tick deliveries, grasp/release tolerances, wrong tray, dropped/held states, swept collision, freeze/reset and unchanged old models.
- Account/API suite: prerequisites, model-version receipts, forged/stale completion, eight independent drafts, legacy six-draft preservation, family/profile separation and existing onboarding/recovery boundaries.
- Real Java and browser checks: all three reference programs, starter collision, empty closure, early release, invalid commands, syntax errors, infinite-loop Stop, Reset/retry, switched worlds/languages, free hints and opt-in explanation. Python and Java deliver in 6.40 simulated seconds, with holding changing 1 to 0.
- Local account browser checks: twelve checked milestones through real Java; correct mission lists; fresh-browser source/challenge resume; sibling separation; in-flight L04 checking keeps its visible context. This is not live Blob or Sandbox evidence.
- Visual evidence: desktop delivered Python/Java scenes and narrow scene/editor/coach captures under the private test-results directory. Verify labels, actual cargo position, feedback, camera controls and fallback, not just a green banner.
- Delivery checks: TypeScript/build, clean app/runtime Vercel packages, publication checks and exact PR-head CI. Read the PR's final receipt for commands, counts and outcomes; planned CI/provider work is never credited as a pass here.

The first broad local run exposed M4-05. One overlapping browser invocation also deleted another runner's trace directory; that infrastructure failure is separate from product behavior. Final runs use separate output directories or run sequentially. No assertion, product runtime deadline or retry allowance was weakened; an unnecessary increase to an existing test's overall timeout was removed.

## What to improve next

First qualify this candidate for release only with separate authorization: execute real hosted Python/Java, all twelve milestones and eight saved code/challenge contexts against disposable authorized fixtures, then inspect the protected candidate. Existing release scripts currently prove L01–L03; extend their acceptance scope to L04 before using them to approve this release. Preserve the email-only entry and current accounts. Do not infer a provider pass from local mocks or earlier releases.

For the deferred classroom pilot, use the learner's chosen language and record: (1) prediction of actual lift before turning, (2) first independent edit and help level, (3) explanation of empty closure versus holding versus delivery, (4) adaptation to the 135° tray without copying the reference, and (5) save/resume with the correct case. Record active time separately from execution waiting and use met/partial/not observed per criterion. If evidence shows a specific explanation fails, fix that step before adding L05. Keep personal observations private and publish only anonymized findings.
