# Engineering check coverage (reference)


These original horizontal work packages are retained as quality coverage for the vertical slices in TASKS.md. They are not the execution queue. Status/dependency fields below are historical planning metadata; the current slice record governs execution.

## Current acceptance contract

FOUNDATION.md supersedes historical wording below where the first play feedback refined scope. Its test matrix is mandatory for affected behavior: numeric ranges and explanation, editor keyboard/undo/focus, run races and draft preservation, useful jobs, next/last-lesson navigation, bounded experiment history, no retry penalty, independent family submissions, real-language parity and actual scheduled access. ECO was removed; use tested defaults and fallback. Planned tests must never be described as passed tests. CURRICULUM.md now specifies the rover/rocket design; current S03H, S08–S19/S11H and optional X01–X04 in TASKS.md supersede the historical broad expansion milestone below. Validate wheel/heading/sensor/swept-contact semantics and lander inertia/pre-impact landing outcomes before those models ship. The tested lightweight editor remains the default; historical Monaco wording is not a required replacement.

## New teaching and sensing regression requirements

These are future acceptance requirements, not completed tests. Add tests with each delivered behavior; do not implement an unused generic framework or mark later slices tested because S01 passes.

| Delivered behavior | Required checks and adversarial examples |
| --- | --- |
| Commented self-study lesson (S03 onward) | Schema rejects missing job/application/new-concept/prerequisite/units/comments/hints/transfer/reference/wrong fixtures, duplicate IDs, unknown/cyclic prerequisites and unavailable Next targets. Execute both starters, edited examples and reference/wrong/changed-target programs. Human review checks comments against actual API behavior and trace; keyword counts cannot prove explanation quality. Teen observation separately checks independent recovery. |
| Async command timing (S01) | Real Python sets motor/servo targets, immediately reads unchanged pose/time, advances ticks, observes both movements, stops the motor and observes the servo finish during further ticks. No assumption that awaiting a setter means arrival. |
| Arm / heading | Independent joint axes/limits and reachable-pose/grasp/release/collision fixtures; forward/reverse/turn sign, wrap boundary, target tolerance and stale heading. Check actual payload motion, not final green UI alone. |
| Light / color | Sample footprint, finite bounded readings, threshold equality, dark/bright calibration, equal brightness with different color, swapped channels, no label/unknown, changed illumination and explicit validity. Viewpoint and graphics quality never change readings. |
| Images | Exact authored pixel/region and occlusion cases against the versioned trusted sensor pipeline, dimensions/data limits/coordinates, tick/frame identity, empty/ambiguous/stale image and lost detection. No semantic-answer API, prerecorded detection or orbit-camera screenshot standing in for robot sensing. |
| Combined control | Good/wrong programs across changed scenarios and every phase transition; prioritize invalid data/obstacle stop, distinguish safe stop from completion, reject wrong destination, duplicate payload, stale dock state or missing release. Reset, Stop, language/lesson switches and replays clear every actuator/sensor/payload/phase state. |
| Delivery / scoring | Existing editor/draft/history/navigation, both real runtimes, time/output/source caps, trusted result boundary, fresh build and both Vercel packages. Each new model remains practice-only until S06 separately proves official-score eligibility. |

Before making a slice ready, specify fixture inputs and independent expected outputs, command/threshold units and tolerances, and the CI command that will execute each applicable row. Tests must fail for the intentional wrong controllers, not merely confirm a reference returns success. Never relax assertions or product deadlines to make an unfinished controller pass.

## OPS-01 — Prove scheduled execution access

- Status: ready
- Depends on: approved direction
- Scope: establish whether the actual scheduled environment can read account usage, access this private repo, run the toolchain, and create draft PRs. Do not assume it inherits the Mac's sessions.
- Acceptance: read-only smoke evidence proves usage/repository access without exposing secrets; eligibility tests cover qualifying, nonqualifying, missing-data, and duplicate-cycle cases; an isolated dry-run path establishes where coding executes without forcing a real eligible run. If unavailable, document a supported local alternative and the smallest owner setup step. Never claim the trigger works without evidence.
- Validation: tool receipts, focused trigger-state tests, and documented environment evidence.

### Required OPS-01 evidence matrix

Implement and test the operational gate as its own proof. It must use the existing Robotics usage trigger, preserve its eligibility/duplicate records and never launch a real builder from test fixtures.

| Case | Expected behavior |
| --- | --- |
| Weekly bucket missing/unsupported; used percent invalid; reset absent/past | Fail closed; no coding claim. A missing value is not zero usage. |
| 49.9% / exactly 50% remaining; reset at 0, just above 0, exactly 24h, just beyond 24h | Qualify only >=50% remaining and reset >0 and <=24h in the supported 10080-minute bucket. |
| Two simultaneous eligible polls; repeated poll after completion | One atomic cycle claim and at most one coding run and one usage notification per bucket/reset. Losing polls perform no slice write. |
| Manual writer versus scheduled writer; branch already in progress | Atomic shared slice ownership prevents competing writers; resume the existing branch/PR only after ownership is valid. Never take over by age. |
| Crash before/after claim, branch creation, PR creation or result receipt | Durable identity/recovery is inspected; no second run for a consumed cycle, duplicate branch/PR or automatic abandoned-claim takeover. Unknown notification delivery cannot justify blindly resending. |
| Reset rolls over mid-run or usage becomes unknown/exhausted | Preserve checkpoint and stop; no automatic claim under the new reset in the same run. Test default budget reserves and the exact-reset BUDGET.md exception separately. |
| Dependency still review/unmerged; no ready slice; failed test or unavailable runtime | No downstream implementation. Record the precise gate; never reinterpret review as done or missing checks as passing. |
| Actual scheduled permissions and environment | Read-only scheduled smoke proves usage, repo and ownership-store access; isolated dry run demonstrates checkout/install/model/browser/build/package commands and draft-PR capability without production mutation. Local interactive approval is not proof of unattended access. |

Record test command/output, runtime/environment identity, supported store, claim keys, reset timestamp, tested commit and a durable run receipt. Keep automatic implementation gated until both negative/race tests and actual scheduled access pass. Local CI success proves application checks only. A passing OPS-01 gate still permits one ready slice and a validated draft PR, not automatic merge/deployment or a new automation.

## 01 — Application foundation and CI

- Status: ready
- Depends on: approved direction
- Scope: TypeScript shell, pinned dependencies, development commands, test tools, CI, and separate simulator/language/lesson/UI/server modules.
- Acceptance: a fresh checkout installs, builds, and launches from documented commands; build/type checks and a real smoke check run in CI; no client secrets. Show a simple workshop loading/error shell.
- Validation: fresh-install CI run and browser smoke; retain commit/check links.

## 02 — Robot protocol and deterministic model

- Status: draft
- Depends on: 01
- Scope: motor, servo, simulated clock, bounded sensors, command/telemetry schemas, seed/version identifiers. Rendering stays outside the model. Specify power range, degrees, seconds, travel limits, collision rules, and errors.
- Acceptance: known commands produce known observations; fixed inputs/seed repeat; sensors read current simulation state; invalid numbers, unknown actuators, out-of-range commands, and oversized messages fail predictably. Reset clears all run state. No movement inferred from code strings.
- Validation: fixtures with independent numerical expectations, reset isolation, seeded replay, and schema rejection.

## 03 — Real Python execution spike

- Status: draft
- Depends on: 02
- Scope: Pyodide worker adapter, robot API, bounded console, command stream, loading/error/termination states.
- Acceptance: real variables, functions, loops, and a sensor-conditioned decision change the model correctly; syntax/runtime errors identify their source; infinite loops and excessive output can be stopped; a new run works after cancellation. Sensor timing is independent of display FPS.
- Validation: actual Python fixtures, failures, sensor loop, UI cancellation, and cold/warm latency measurements on an identified device. Security remains gated on 05.

## 04 — Real Java execution spike and runtime decision

- Status: draft
- Depends on: 02
- Scope: demonstrate source compilation and Java execution using the shared robot API. Evaluate isolated JDK service and browser JVM options as needed, including licenses. Record the selected runtime and service needs.
- Acceptance: real Java variables, loops, methods, and sensor feedback execute; compiler errors point to student source lines; Stop and a second clean run work. No regex translation masquerading as Java. Equivalent Python/Java fixtures match after 03 lands. Measure startup/run latency and document unresolved isolation concerns.
- Validation: actual compile/run, broken source, infinite loop, output bounds, and equivalence. Paid/unavailable services become explicit blockers, not autonomous purchases.

## 05 — Execution isolation and resource bounds

- Status: draft
- Depends on: 03, 04
- Scope: harden selected runtimes/bridge before attaching real accounts or submissions.
- Acceptance: student code cannot read app sessions, account data, host files, secrets, or unauthorized network endpoints. Prove browser-origin and CSP boundaries; workers alone are insufficient. Server jobs, if used, have no network/host mounts/secrets, capped CPU/memory/time/output, and clean per-run storage. Forged/stale messages cannot alter another run; cancellation discards pending commands.
- Validation: adversarial data/network access and resource exhaustion fixtures, forged messages, isolation, and post-cancel recovery; record limits and usability impact.

## 06 — Original Signal Station in 3D

- Status: draft
- Depends on: 02
- Scope: original motor/servo bench, pointer/target, orbit/pan/zoom/reset/preset camera controls, component labels, sensor visualization, and telemetry-driven animation. Camera actions cannot modify model state.
- Acceptance: model state drives rendered positions; direction and units agree; reset/replay restores pose; labels are legible; art is original. Target 30 FPS at default detail on an identified normal laptop; expose quality degradation and unsupported-WebGL feedback.
- Validation: model/render integration, laptop-width screenshots, keyboard/zoom/reduced-motion checks, performance evidence. Screenshots alone do not prove simulation accuracy.

## 07 — Split-panel editor and complete run loop

- Status: draft
- Depends on: 05, 06
- Scope: Monaco, language switching with independently saved Python/Java drafts and shared mission state, mission card, Run/Stop/Reset/Restore, console, command timeline, and local draft save.
- Acceptance: edited Python/Java actually control the robot; edits apply on Run; rapid actions cannot mix runs; examples/lesson switches do not silently overwrite work; real errors are readable. Keyboard/focus/panel resizing work. Execution and animation playback are clearly distinguished.
- Validation: end-to-end edited code to pose/sensor result in both languages, cancel/error/refresh flows, screenshots. Local save is development support, not family login.

## 08 — Lesson engine and first small win

- Status: draft
- Depends on: 07
- Scope: versioned schema, prerequisites, demonstration/prediction/tweak/challenge/reflection, hint ladder, reference solutions, objective checks, first Signal Station lesson.
- Acceptance: one meaningful code change accomplishes a useful job for a named beneficiary with a visible world consequence; short explanations/comments teach one concept; prediction/reflection use authored answers or observable checks; reference and wrong programs are machine-checkable. Hints do not deduct mastery. Provide Python/Java variants.
- Validation: schema, solution/failure fixtures, overshoot/unit mismatch, complete browser lesson/progress save, screenshot review. Learning claims remain pilot hypotheses.

## 09 — Parcel arm and four foundational lessons

- Status: draft
- Depends on: 08
- Scope: bounded two-joint arm/gripper and sequence/variable/loop/function missions. Use a documented simple grasp rule rather than general contact simulation.
- Acceptance: grasp/carry/place obey geometry and state rules; travel limits/collisions give useful feedback; each lesson adds one concept with comments, hints, solutions, and a transfer variation. Early missions have both languages.
- Validation: grasp/drop/target boundaries, seeded replay, intentional wrong programs, language equivalence, browser lesson flows. Original art and honest model limitations.

## 10 — Private family accounts and saved progress

- Status: draft
- Depends on: 05, 08
- Scope: maintained authentication/session mechanism, parent provisioning, aliases, family-scoped programs/attempts/mastery. Local test infrastructure precedes production setup.
- Acceptance: genuine separate child sign-ins across profiles/devices; work survives logout/refresh; children cannot modify each other's progress; another family cannot read either. Parent can provision/revoke profiles and inspect progress. No public identity or child email required.
- Validation: two-child and second-family end-to-end flows, authorization, expiration/revocation, save conflicts. Document production configuration dependencies; no credential creation or service purchases.

## 11 — AI coach with student-controlled edits

- Status: draft
- Depends on: 07, 08, 10
- Scope: explain/suggest/debug modes using bounded lesson/code/error context, secure server integration, and outage fallback.
- Acceptance: students request help, preview edits, predict behavior, and choose whether to apply/run; payloads exclude identifiers/secrets; prompt content cannot execute tools; malformed replies never change code; timeouts recover; parent-configured spending/rate caps work. Suggestions use the ordinary sandbox/checks.
- Validation: deterministic mocked success/failures, adversarial context, payload inspection, rate limits, and bounded live smoke after provider setup. Missing provider access is a blocker; a scripted mock is not a completed AI feature.

## 12 — Reproducible scoring and family challenge

- Status: draft
- Depends on: 09, 10, selected server evaluation path from 04–05
- Scope: reexecute submitted source against the versioned simulator server-side, fixed seed sets, validated scores, private leaderboard/personal bests. Never trust posted client scores or command traces.
- Acceptance: identical source/config yields the same official result; reliability ranks before simulated time; display/laptop speed cannot affect rank; ties explicit; duplicates idempotent; altered seed/version/score claims cannot forge results. Both languages share rubric and AI rules. Practice scores labeled separately.
- Validation: replay, timing/seed boundaries, forged submissions, duplicate races, authorization, ranking, two-child flow.

## 13 — Six-lesson family pilot

- Status: draft
- Depends on: 09, 10, 11, 12
- Scope: six introductory lessons, map, finite badges/cosmetics, one family challenge, onboarding, and pilot instructions.
- Acceptance: six lessons pass reference/failure checks; no grind/login streak required; hints preserve progress; shorter practice and optional stretch tasks exist; free play unlocked; first task clearly explains what to change/watch.
- Validation: two synthetic learner journeys, outage/cancel/reload, screenshots/accessibility, parent checklist. Enjoyment/comprehension await actual child feedback.

## 14 — Rover and remaining season (decomposition milestone)

- Status: draft
- Depends on: 13, reviewed family pilot feedback
- Scope: split into bounded ready tasks after pilot: differential-drive rover, sensors/conditions, lists, debugging, Java bridge, final arena. Never implement this entire epic as one task.
- Acceptance: each pack has 2–3 short lessons, prerequisite/concept ladder, solutions/failures, seeded checks, adaptations, and reuse of earlier concepts. Add FTC/FRC mapping after program context is confirmed.
- Validation: content/schema/runtime/score regressions, new sensor/drive numerical fixtures, learner feedback before mass expansion.

## Required PR receipt

Record status, branch, PR, tested commit, met/unmet acceptance criteria, check commands/links, visual evidence where relevant, decisions, and blockers. Never claim CI or a user pilot passed without evidence.

## DEPLOY-01 regression additions

- Local CI includes family/session authorization, parent-only provisioning, second-family separation, stale-profile protection, revocation, source/revision validation, atomic concurrency/daily limits, immutable practice attempts and durable cancellation races.
- Live storage: uncompressed private reads return strong ETags; concurrent cleanup/history/draft saves all persist; a true same-revision draft conflict has exactly one winner. Clean up disposable test families.
- Live Sandbox: both-language known-value sensor fixture, wrong programs, forged completion, syntax/range errors, network/localhost/sudo/runtime-write/environment probes, heap/direct-memory limits, flood, startup cancel, child-process Stop, automatic execution deadline and confirmed VM stop.
- Family browser acceptance: parent/child access, real hosted Java/Python, cross-device saves, version comparison, shared checked-only progress, three-target completion without unreleased unlocks, Stop-check race, stale tab identity, revoke, anonymous Python and desktop/narrow screenshots. Keep runtime loading and execution deadlines separate in tests.
- Release: import the bundled Node handler in package checks; assert routes, stream support, raw request parsing and immutable VM assets. Separately test protected Vercel Function OIDC/routing/streaming/HTTPS/CSP/Stop on the exact deployed artifact before public promotion. No credentials or access codes in logs, traces, screenshots or artifacts.

## Parent recovery regressions

Verification UI must visibly confirm the server-confirmed address, persist after closing/reopening and reload, and clear for signed-out/student profiles. Pending or rejected links must not borrow an existing address's success state. Check live-region semantics, automatic visibility after confirmation, narrow-screen wrapping and synthetic-only screenshots.

Run tests/recovery.test.mjs and the local recovery-ui.spec.ts in ordinary CI. Include current-code reauthentication, parent/student/other-family boundaries, verification replay/expiry, neutral missing/unverified/delivery-failure receipts, private token/index/limit storage, bounded sends, concurrent reset winner, orphan invite rejection, same-browser interrupted-response retry, old parent session invalidation, unchanged student drafts/history/completion, same-tab hash links and new-tab confirmation, and readable narrow screens. Real private Blob and actual email delivery remain separate release checks; a local inbox fixture is never provider proof. Exact two-origin frame/postMessage/CSP acceptance must retain rejection of foreign parents.


## FAMILY-02 onboarding acceptance

The workflow and delivery slices are defined in PLAN.md and TASKS.md. [ONBOARDING-QA.md](ONBOARDING-QA.md) records implemented tests, real staging evidence and remaining human observations. Retain these gates in future builds; local fault injection and mocked mail never replace actual staging delivery. Record exact source and CI/provider evidence separately.

| Area | Required positive and negative evidence |
| --- | --- |
| Email parent access | New email verifies then explicitly creates one family; existing email resumes its current family; several memberships require a private chooser after proof. Unknown and known requests reveal no membership before verification. |
| One-time code | Correct, wrong, malformed, expired and consumed values; concurrent consumption has one winner; challenge swap and another browser's retry cannot gain access. Resend cannot reset expiry/guess limits. Per-email/IP failures across fresh challenges stay bounded. Do not store a brute-forceable unkeyed six-digit digest. |
| Account/session continuity | Existing code-only and verified-email families keep all profile IDs, codes, Mission 1/2 drafts/history/completion. Email change, stale indexes, revocation, tab switching, lost session responses and logout races cannot claim another family or overwrite its editor. Normal parent sign-in does not rotate credentials. |
| Signup and student batches | Same request retries return the same family/students/codes; a reused ID with changed input fails. Two tabs, partial invite/family writes, daily-limit races and lost responses create neither duplicate profiles nor orphan usable credentials. Six-active/retained-profile bounds and existing shared quotas remain enforced. |
| Student cards and shared devices | Copy code/link, clipboard failure, Print, keyboard and narrow layout; no credentials in captured artifacts. Link GET/scanner/prefetch has no sign-in side effect; explicit Start works. Switching to a student protects current editor state and loads only that student's work. |
| Credential delivery | Only current verified parent receives the new batch's credentials. Parent-email change, student code rotation/revocation and payload expiry before delivery suppress stale mail. Encrypted temporary payload is unreadable without the correct key, rejects tampering, expires and is cleaned up. Retry does not regenerate or silently replace a code. |
| Quiet notification behavior | One successful interactive first sign-in sets one state/event under simultaneous requests. Failed logins, session refresh, repeated sign-in, code rotation, parent administration and previews send none. Opt-out, legacy profiles and parent-email changes are respected. |
| Mail crash/retry | Crash before/after store commit, queue publication, provider acceptance and sent receipt; duplicate/out-of-order queue deliveries and uncertain provider response. Stable event IDs plus durable receipts suppress duplicate mail; no blind retry beyond Resend's deduplication window. A detached promise is not acceptance. |
| Availability and budgets | Mail outage does not invalidate an existing session/code, erase cards or block student lesson entry. Queued, accepted, failed and expired delivery states are accurate. Explicit auth requests retain reserved budget; setup/notifications cannot bypass global/email/IP caps. No quota reset in fixtures. |
| End-to-end family journey | Parent email → proof → add two children → one setup receipt → each child signs in → exactly two first-sign-in notices → Python and Java edit/run/check/save → fresh-device resume. Later sign-ins generate zero notices. Include wrong student code, opt-out and replacement code without lost progress. |
| Hosted acceptance | Real private Blob concurrency, authenticated durable consumer, Resend acceptance and actual inbox receipt on protected staging before release. Use the designated test parent and disposable students; clean only fixture records. Verify HTTPS, exact app origins, cookies and message escaping. No mocked inbox, screenshot or green dashboard can establish delivery. |
| Human onboarding | Observe a parent reaching usable student cards and a teen resuming a lesson; record timing, errors and help needed. The roughly two-minute setup target excludes inbox delay; capture delay separately. Automated completion is not proof of intuitive onboarding. |

The combined manual goal froze normalized-email rules, challenge storage/TTL/attempt budgets, retry binding, signup atomicity, encryption/retention and category budgets in PLAN.md. FAMILY-02C reuses the same delivery path and lifetime profile event identity. Future account changes must preserve interrupted-response retries even at the six-student limit, reject control characters in mail-bound names, and retain expired-payload cleanup when a queue outage occurs. Enabling provider resources or releasing authentication changes still requires the ordinary scoped operational authorization.

## S03 / Mission 2 regression gates

Every future lesson must preserve curriculum navigation and independent mission/language drafts, declared starting poses, real sensor/branch behavior in both runtimes, existing family privacy/recovery, and checked-only unlocks. New tests in `lessons.test.ts`, `mission2.spec.ts`, `mission-drafts.spec.ts`, `family.test.mjs` and `java.test.mjs` cover the S03 contract. Keep server-owned scenario selection and canonical lesson/version receipts; reject unknown targets and ignore client-supplied pose/outcome fields. A new lesson must not overwrite an earlier lesson's draft or count its milestones toward another lesson. Keep local transport tests, actual provider acceptance and observed teen learning distinct. See [MISSION-02.md](MISSION-02.md).

Owner-QA additions: while a checked run is pending, attempted rescue/mission/language changes must keep the selector and underlying scenario consistent. Open every hint in both languages and verify no penalty. Exercise the complete prerequisite-to-completion student UI with real local isolated execution, wrong-program rejection, second-device resume and independent sibling progress. The disposable account test server must not fall back to cloud services. See [MISSION-02-QA.md](MISSION-02-QA.md) for evidence boundaries and the owner checklist.


## S08 / Mission 3 regression gates

MISSION-03.md is the frozen acceptance contract. `tests/patrol.test.ts` supplies independent route/time/dwell/boundary/reset fixtures. `tests/browser/mission3.spec.ts` executes real Python and Java through starter, wrong count/timing, every patrol, hints, error/Stop/recovery, camera, six local drafts and narrow/WebGL fallback. `tests/java.test.mjs` checks real compiled loop traces and authoritative HTTP rejection of fabricated checkpoint counts/results. Family model/browser tests retain L01/L02 records, separate L03 languages, checked L02 prerequisites, new-device progress and sibling isolation. These local suites do not claim cloud-provider acceptance or observed teen comprehension. Exact-head CI and hosted tests before a separately authorized release remain required.

## Progressive teaching and recovery gates

Shared lesson refinements must cover all playable missions and both languages. Check predictions against the selected case and current source snapshot without automatically grading arbitrary code. Check missing milestones separately from a wrong final pose; retained diagnostic history cannot award progress or accept student-supplied results. Verify first-edit focus, reachable free hints, Run, text-only note rendering, legacy/partial local saves, six code/challenge pairs, recoverable repeated Restore clicks, full-storage recovery, profile isolation and cloud conflict/version pairing. Keep cloud code/challenge saves separate from device-only notes. Future lesson acceptance includes the retrieval/new-demand/transfer row in TEACHING-PROGRESSION.md.

## FAMILY-03 parent entry regression gates

PARENT-EMAIL.md supersedes tests that require public parent-code login, code-only signup or code-issuing recovery. Keep the underlying historic recovery/store fixtures as compatibility evidence, but the public API must reject retired routes. Add fresh email plus old-code/unfinished-setup ownership, index-before-family partial writes, competing emails, same-challenge response retry, retired-code rejection, unchanged student records and explicit current-session boundaries. Use parent-session fixtures only for non-auth hosted checks; they do not establish email authentication or provider delivery.


## UI-03 — Checked mission access

See [GUIDED-MISSIONS-QA.md](GUIDED-MISSIONS-QA.md). New access checks cover guest previews, existing locked drafts, read-only keyboard/editor/world controls, practice-only non-unlocks, the third real checked result, Next mission, fresh-device resume, sibling separation and session expiry/change. Delayed responses cannot invalidate a newer identity or roll back newer checked progress; wrong submitted parent credentials must not discard an otherwise valid session.

Browser mechanism/teaching tests use explicit account-response fixtures for already checked prerequisites, with the real local Python and Java runtimes. These fixtures are not evidence of completion. The local family UI journey separately runs all twelve real Java progress checks through the application API. Test-only persisted prerequisites support unrelated recovery/draft scenarios; none are exposed by production endpoints. Existing server tests continue to reject forged completion and premature checks.

## Success explanation and progressive help gates

Every new mission must provide a short evidence-to-mechanism explanation beside its successful result. Explain observed completion; never claim a branch, loop or helper was used from source strings or student output. Cover actual values for an alternative valid solution, inclusive tolerances where relevant, wrong/forged output, missed milestones, Stop/error/reset, draft edits during or after a run, and context/profile changes. Verify all hint levels and the opt-in worked example in both languages, keyboard navigation, no draft mutation, and narrow/desktop readability. Preserve runtime, scoring and checked family-unlock rules. Shared refinements require all playable mission journeys; hosted/provider qualification remains a separate release gate. See LESSON-FEEDBACK-QA.md.

## FE-01 — Automatic family experience

[FAMILY-EXPERIENCE.md](FAMILY-EXPERIENCE.md) supersedes older manual save/check and experiment-note UI acceptance. Keep thinking prompts and measured explanations; notes are preserved as legacy local data but have no required form. Ordinary signed-in Run saves its immutable attempt and automatically checks a successful unfinished challenge. Confirmed targets alone award progress across every surface; pending, unsuccessful and repeat practice runs need accurate labels. All four missions in Python and Java must complete through Run alone in the disposable account suite.

Retain automatic revisioned saves for eight mission/language contexts, offline/reply-loss retry, older local drafts, compare/restore return copies, sign-out despite conflicts, forced-session cleanup and late-response isolation across students and renewed sessions. The queue must never consume another compute reservation for a previously confirmed attempt receipt, including after the visible twelve-run history is pruned.

Weekly tests cover UTC week boundaries, quiet weeks, opt-in date, first completion dates, multiple children, stable receipt/recipient/week, queue/provider failure, duplicate delivery, current consent/recipient/revocation, expiry and reserved authentication budget. The authenticated dispatch and paginated durable scan are separate from provider acceptance. Package with summaries disabled and enabled; activation, real inbox delivery and scheduled execution require separately authorized hosting qualification.

## ARENA-01 — Family game points (released)

[ARENA-MVP.md](ARENA-MVP.md) supersedes FE-01 automatic successful-Run checking for the authorized family-scoreboard release. Run remains free practice with automatic draft/history sync; only explicit **Check & save progress** can count scored checks and award canonical progress. Keep all-four-mission Python/Java progression, draft/history/identity/recovery and weekly regressions, submitting explicit checks in the affected journeys. FE-01 release evidence above remains historical.

Validate ten-check boundaries/floor/mission bonus, immutable once-only awards across languages/replays, mixed legacy migration, parent/student parity, shared ranks, safe aggregate privacy, admitted-check nonces and cancellation/finalization races. Hold Check disabled through Stop reconciliation and retire active checks on session teardown. Family API fixtures and real local isolated language/browser journeys provide local evidence only; exact-head CI, provider release qualification and actual learner observation remain distinct.

## TRACE-01 source execution playback

See [EXECUTION-TRACING.md](EXECUTION-TRACING.md). `playback.test.ts` and `runner-playback.test.mjs` cover shared gates, Stop, cumulative runtime work, unsupported-browser recovery, delayed command races and invalid trace messages. `java-tracing.test.mjs` executes native JDI loops/branches/helper returns and cancellation in the isolated container. `execution-tracing.spec.ts` executes both languages across all four missions at two speeds, compares model times, checks loop/branch visits, Pause inside wait, Step, source snapshots, errors/context changes, scroll/focus and desktop/narrow captures. Existing mission journeys still cover all variations, good/wrong programs and checked prerequisites.

Traceable infinite loops spend learner reading time at source boundaries, bounded by the five-minute practice deadline and trace count. The ordinary 20-second *runtime work* watchdog is tested independently with an unresponsive native Python calculation and Java native wait; those fixtures cannot consume the budget as reading time. Output fixtures still exceed the unchanged 8 KiB limit promptly. Official checks retain the old 45/20-second and 65-second VM boundaries. Package checks require TraceMain.java and the 360-second API envelope; traced practice VM/container lifetime is at most 345 seconds, family/service/control leases 420 seconds. Actual hosted JDI, HTTPS streaming/Stop and learner/device observation remain separate release gates.
