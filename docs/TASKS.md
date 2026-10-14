# Working-slice queue

Kickoff is authorized. Each delivered chunk must be a runnable, self-contained addition to the existing app, with a visible student outcome, meaningful acceptance checks, setup instructions, and a durable resume record. Self-contained means no missing prerequisite branch or unfinished stub is needed to use the delivered behavior; it does not mean rebuilding the whole app each week.

FOUNDATION.md is the current cross-slice acceptance contract and implemented/planned capability ledger. Detailed engineering coverage is retained in ENGINEERING-CHECKS.md. That document is not the execution queue. Vercel build/hosting requirements and the separately authorized DEPLOY-01 gate are in DEPLOYMENT.md. Every slice retains a deployable web build; no automatic deployment is authorized.

## Execution rules

Read BUDGET.md for the temporary owner-authorized exception to the reserve thresholds. The live weekly reset must match; otherwise the defaults below apply.

- One slice per manual goal or eligible weekly coding cycle. Never automatically start a second slice after completing the first.
- Every delivered lesson, including language-parity and challenge slices, must retain the PLAN.md purpose contract: a beneficiary and useful job, a visible consequence of real execution, a concrete real-world application, and a changed-need transfer question. These are acceptance criteria, not optional flavor text.
- Resume unfinished work before selecting a new slice. States: ready, in_progress, paused_budget, blocked, validated_local, review, done. Review means a tested draft PR; done means accepted work has landed.
- Dependencies must be done and landed before starting a later slice. Unmerged prerequisites pause downstream work. No merge or deployment is authorized.
- Begin a scheduled run only with >=50% weekly allowance remaining and reset in >0 and <=24 hours. An explicit manual kickoff may start immediately.
- Check usage before work, between checkpoints, before expensive batches, and before final validation. At <=35% remaining, stop starting implementation and reserve headroom for checks, fixes, persistence, and the PR. At <=25%, prioritize safe preservation and stop. Unknown usage means preserve and pause. These are soft operating thresholds, not a guaranteed consumption ceiling or token budget.
- Keep the last runnable/tested checkpoint identified. Isolate unfinished work on the existing slice branch; never deliver a broken chunk or relabel a partial slice as complete. If remaining capacity cannot finish a slice, resume it in a later eligible cycle.
- Persist the fields in PROGRESS.md: ID/status, base SHA, branch/worktree, PR, last runnable commit, tested SHA, checks/evidence, unmet criteria, exact next action, and blockers. Recheck affected behavior after a changed base or rebase.
- Before unattended coding, OPS-01 must establish supported durable atomic ownership of a cycle and slice. Prior chat history alone is not a lock. Do not let hourly polls or a manual goal become competing writers.

## CURRICULUM-01 — Visual mission previews

- Status: review in [PR #7](https://github.com/willcheung/3d-robotics-hack/pull/7); local validation passed for the accepted full-row design. The owner explicitly authorized finishing this slice under a one-time reserve-rule exception. Exact-head CI and remaining gates are recorded with the PR.
- Depends on: the existing curriculum/draft/family framework. Started from released L01–L03; subsequently integrated landed Mission 4 from PR #6.
- Working outcome: learners can see the machine and useful job for every one of the 20 lessons before choosing a mission.
- Scope: [CURRICULUM-PREVIEWS.md](CURRICULUM-PREVIEWS.md), full-row responsive previews, four actual model captures, 16 distinct labeled concept diagrams, chapter navigation, existing availability/prerequisite/completion states, and the future-lesson preview acceptance contract in PLAN.md. All four landed missions open through their previews; later missions remain coming soon.
- Acceptance: all 20 lessons retain their order and truthful playable/optional state; concepts never imply a playable model; desktop/narrow images and text remain readable; chapter/Close/Escape navigation and both-language drafts are preserved; image failure never blocks lesson entry.
- Validation: inspected artwork and desktop/narrow screenshots, browser navigation/draft/focus/availability checks, relevant family regressions, TypeScript/build and publication checks. No hosted release, later lesson implementation or learner pilot is implied.

## OPS-01 — Operational gate (not a student feature chunk)

Status: ready. This read-only/setup proof does not replace a working app slice.

Prove actual scheduled usage/private-repo/toolchain access and a supported atomic claim keyed to usage bucket and weekly reset timestamp. Record slice/branch identity and recovery states. Test overlapping polls, interrupted runs, unavailable usage, reset rollover, and failures before/after branch or PR creation. A resumed unfinished slice in a new cycle claims that new cycle; duplicate polls in the same cycle do not create another writer. A manual goal requires mutually exclusive slice ownership too.

If the environment cannot support those guarantees, report the specific missing setup once per relevant cycle and keep coding gated. Do not claim a lock exists merely because the prompt asks for one.

## S01 — First real Python small win

- Status: done; see PROGRESS.md
- Depends on: none for explicit manual kickoff; OPS-01 for unattended execution
- Working outcome: an anonymous local development preview lets a student edit real Python to turn and tilt a rescue searchlight onto a stranded crew, visibly marking their pickup point. The pointer is its direction dial; orbit/pan/zoom/reset let students inspect the mechanism. A visible pan-and-tilt camera example explains the real-world connection.
- Scope: explained input units/ranges and commented executable starter lines, reliable keyboard editor, explicit Python-only availability, next-rescue navigation and per-visit unique completion; minimal app/build/CI foundation with reproducible Vercel-ready production output, documented runtime origin/assets/headers and hosting setup, one bounded mechanism, documented tick-based API and units, trusted simulation owner, isolated Python runtime, minimal editor, starter comments, Run/Stop/Reset, loading/errors, target feedback, one prediction/transfer variation. Prefer one fixed mechanism over full hardware catalog/editor features.
- Acceptance: editing a variable changes actual execution; a real loop/function fixture passes; trusted actuator/time RPC and sensor return path work; students cannot set result/score/model state directly; camera movement never changes mechanism state; Stop handles infinite loops and excessive output; reset/new run works without losing code; reference/wrong programs produce correct feedback. Label clearly as a Python-only development preview; S02 adds Java.
- Validation: independent numerical model fixtures, bridge/isolation misuse tests, actual Python fixtures, fresh-install build/type checks, browser edit/run/result and cancellation checks, inspected screenshots. Include a tested preview URL and launch/restart instructions, a short PLAY.md with the target plus two variations of the same mechanism, Restore Example, commands, limitations, tested commit, and draft PR. Verify the child-facing play walkthrough from fresh launch through edit/run/target/reset/restore and exercise the production output locally. Actual hosted smoke checks belong to DEPLOY-01 after access and deployment approval. If this proves too large, split an observable student behavior; do not call runtime/framework stubs a delivered slice.
- Purpose acceptance: crew/job visible before Run; motor turns the whole light and servo tilts its head; a missed or wrong-height beam leaves the crew waiting; a valid stopped/settled run marks their pickup point lit; reset restores waiting. Inspect all three crew locations. Explain a real camera application, simplified hardware behavior and a changed-need transfer question.

## S02 — Same working mission in Java

- Status: done; see PROGRESS.md
- Depends on: S01 landed
- Working outcome: switch the existing mission between real Java and Python, preserving separate drafts and mission progress.
- Scope: actual Java source compilation/execution and selected runtime decision; trusted synchronous sensor/time bridge; sandbox compilation and runtime, including process-tree cancellation and process/thread/temp-storage/resource bounds. Existing Python/scene remains usable throughout.
- Acceptance: Java variables/loops/methods and a sensor-conditioned branch control the same mechanism; real compiler errors map to student lines; equivalent programs match model observations; switching cleanly stops active runs and preserves both drafts. No string-to-animation shortcuts or Java-to-JavaScript regex substitution.
- Validation: real compile/run fixtures, cross-language conformance, syntax/runtime failures, infinite loops, large output, child process cancellation, isolation, language-switch browser flows. Record runtime/license/setup and Vercel-hosted integration decision; evaluate Vercel Sandbox as an isolated runner candidate without assuming access, cost, or Java support. Unavailable paid/hosted infrastructure is a blocker, not an autonomous purchase.

## DEPLOY-01 — Hosted Mission 1 and private family foundation

- Status: done; see PROGRESS.md
- Depends on: landed S01 and S02, both satisfied.
- Working outcome: both languages usable online; separate student profiles, shared checked rescue progress, saved drafts/experiments, and a curriculum that never unlocks unbuilt content.
- Scope adjustment: The project uses the easier family model. Bring the useful L01 portions of S03H/S05 forward into this release rather than waiting for later lesson authorship. Preserve S03's teaching work and S06's separate competition qualification.
- Acceptance: real hosted language/sensor/error/Stop behavior, isolated compiler and execution, durable atomic storage, separate family/student authorization, cross-device draft conflicts, checked-only progress, cancellation races, honest curriculum availability, protected hosted browser acceptance before promotion, exact tested commit and rollback receipt.
- Automation guardrail: provider proof is distinct from the static build and from Function/HTTPS proof. A failed live service or unavailable authorization preserves the candidate; it never licenses an alternative deployment, bypass, credential change or untested claim. Current usage polling/paused automation do not gate this manually authorized release.

## FAMILY-01 — Parents create families in the app

- Status: done; see PROGRESS.md.
- Depends on: landed DEPLOY-01 (satisfied).
- Outcome: a parent creates a private family in Family & progress, saves their parent access code, creates student aliases/codes, and returns on another device without a local provisioning file.
- Acceptance: no child email; masked/copyable codes; clear code-saving and verified recovery guidance; interrupted and concurrent setup retries return the same family/code; active students or other-family sessions cannot create a different family silently; existing accounts remain valid. Private storage retains hashes, not plaintext access codes.
- Bounds: ten new families per UTC day; hosted compute has a service-wide 120-run daily cap and two active runs, in addition to existing profile/family gates. Signup cannot multiply the compute budget; anonymous Python remains available.
- Validation: atomic signup/retry/partial-failure/limit tests, colliding attempt IDs across students with independent service cleanup, account UI in CI, narrow-screen and clipboard-denial checks, protected HTTPS acceptance with real private storage and both runtimes, existing account regression and exact release receipt. Future auth changes must retain these tests; verified email recovery is implemented by RECOVERY-01.

## FAMILY-02A — Parent email sign-in and signup

- Status: done; accepted, landed in PR #3 and released after staging and public production acceptance. See ONBOARDING-QA.md and PROGRESS.md.
- Depends on: FAMILY-01, RECOVERY-01 and RECOVERY-02 landed (satisfied); freeze the challenge/attempt/email-budget contract and inspect ownership before promotion to ready.
- Outcome: a parent enters email and a short one-time code, then resumes the same family or explicitly creates one. Email proof is part of onboarding; no separate recovery-verification task or mandatory parent-code saving step.
- Contract: [PLAN.md's FAMILY-02 design](PLAN.md#family-02-design-email-sign-in-and-quick-family-onboarding). Keep existing parent/student codes, verified email memberships, multiple-family chooser, drafts/progress, seven-day sessions and exact-origin boundaries. Legacy unverified families link email only after parent-code reauthentication. Ordinary email sign-in never rotates credentials or creates a duplicate family.
- Acceptance: ten-minute, single-use, bounded-attempt codes; neutral pre-proof responses; browser-bound interrupted-response retry; one family on concurrent signup; explicit profile switching; wrong/expired/replayed codes and rate limits preserve work. Reauthentication and email-change/revoke races cannot use stale membership.
- Validation: `tests/onboarding.test.mjs` and `tests/hosted/onboarding-ui.spec.ts`, existing family/recovery tests, real Blob concurrency, real inbox/code sign-in on protected staging, both-mission Python/Java saved-progress regressions and exact-commit CI. Mock mail is not delivery evidence.

## FAMILY-02B — Student login cards and a single setup email

- Status: done; accepted, landed in PR #3 and released with real combined-email and both-language saved-work acceptance. See ONBOARDING-QA.md.
- Depends on: FAMILY-02A behavior (combined goal permits building together); authorized reliable mail delivery and a frozen encryption/retention/notification-budget contract. Evaluate Vercel Queues integration/costs before making this slice ready.
- Outcome: a verified parent creates up to six student nicknames in a batch, immediately gets usable Copy/Print login cards and receives one combined setup email. Returning students use one code or an explicit-confirmation student link. No student email or extra username/password.
- Acceptance: idempotent batch creation and credential issuance, stable request/recipient binding, encrypted temporary credential outbox with expiry, same-event email deduplication, no bearer code in queries/logs, deliberate shared-device switching, usable cards if mail fails. Replacing a code is explicit and keeps saved work. Retries, duplicates, partial writes, email changes and revocations never disclose stale credentials or create orphan access.
- Validation: `tests/onboarding.test.mjs` and `tests/hosted/onboarding-ui.spec.ts`, clipboard-denied/print/narrow/keyboard checks, crash and dropped-response fixtures, real private-store/provider retry acceptance, actual combined email received by the designated parent and both-language saved-work checks. No setup email is sent to an unverified address. Do not claim complete onboarding until FAMILY-02C is accepted too.

## FAMILY-02C — First student sign-in confirmation

- Status: done; accepted, landed in PR #3 and released. Public QA received one first-sign-in notice per student; repeat sign-ins retained the same provider receipts. See ONBOARDING-QA.md.
- Depends on: FAMILY-02B behavior and its durable delivery path proved within the combined goal.
- Outcome: parent sees Waiting for first sign-in / Ready and gets one optional notice when each newly enrolled child signs in successfully. Later sessions, credential replacements and ordinary activity remain quiet. Existing students receive no invented retrospective first-sign-in emails.
- Acceptance: one persisted event per family/profile, atomic first-sign-in state, notification preference respected at delivery, no events for failed login/GET/email previews/helper authentication/session refresh, no login delay or failure due to mail outage. Duplicate delivery/retry cannot repeat the message; unknown delivery is reconciled within the provider deduplication window. Current verified parent and active student are rechecked before sending.
- Validation: `tests/onboarding.test.mjs` and `tests/hosted/onboarding-ui.spec.ts`, two simultaneous real sign-ins, webhook/queue replay, crashes before/after provider acceptance, mail outage, old/new profile migration, email change/revocation and notification opt-out. Protected staging must show the one received notice and no second send after subsequent sign-ins; timestamps/UI flags alone are not proof. Retain complete Python/Java family regressions.

## FAMILY-03 — Email-only parent entry

- Status: done; [PR #5](https://github.com/willcheung/3d-robotics-hack/pull/5) merged and released after explicit authorization. Exact-head CI, actual staging inbox/provider checks and public both-language saved-progress acceptance are recorded in [PROGRESS.md](PROGRESS.md). Contract: [PARENT-EMAIL.md](PARENT-EMAIL.md).
- Depends on: FAMILY-02 landed (satisfied).
- Outcome: parents use email; existing code-only families connect once without losing profiles, student codes or progress. Students keep their code-based entry and guest Python stays available.
- Acceptance: old parent codes and retired signup/recovery endpoints cannot authenticate or mint a new code; migration requires legacy ownership and fresh email proof, is retry-safe, prevents email/family reassignment, and preserves six draft/challenge contexts plus checked results. Interrupted old setup remains recoverable.
- Validation: account/API races and boundaries, browser migration/retry/return, student-card and mission-progress regressions, inspected screenshots and exact-head CI passed. Authorized protected staging, production-candidate and public checks passed; only disposable fixtures were changed. Classroom observation remains pending; Mission 4 is a separate slice.

## S03 — Sensor feedback and one complete lesson

- Status: done; [PR #2](https://github.com/willcheung/3d-robotics-hack/pull/2) merged and released after explicit authorization. Exact-source CI, protected staging, production-candidate and public acceptance evidence are recorded in PROGRESS.md. Learner/device/pacing observation remains pending; no later slice is authorized by this release.
- Ready contract: [MISSION-02.md](MISSION-02.md) freezes three starts, units, objective tolerances, good/wrong/transfer fixtures, teaching and acceptance. Minimal mission-aware integration with the existing family framework is included to preserve drafts and checked progress.
- Depends on: S02 landed
- Working outcome: finish a short sensor-choice lesson with prediction, one conditional correction, hints and a transfer check in either language.
- Scope: minimal versioned lesson schema with job/beneficiary, useful visible outcome, real-device connection, explained ranges, inline syntax/line explanations, prerequisite/new-concept IDs, hints, transfer and reference/wrong fixtures; bounded telemetry, reference/wrong programs and local draft preservation. Use one sensor read and `if` before introducing a feedback loop. Preserve clear current/next/last-available navigation; full persistent progress/history belongs to S03H.
- Acceptance: a trusted sensor observation changes a real program branch; wrong units/conditions fail clearly; changed target or faulty authored AI suggestion tests understanding. Both languages share objective/rubric. Help has no penalty.
- Validation: model/bridge and lesson-schema checks (missing metadata/fixtures, duplicate IDs, unknown/cyclic prerequisites, unreleased Next targets), real sensor/branch fixtures, reference/wrong programs, complete browser lesson/hint/draft/reload/reset flow and inspected screenshots. Invite the early supervised child pilot now; record missing feedback as pending. Accounts, live AI, official scores and S03H must not delay this observation.

## S03H — Lesson map and experiment journal

- Status: draft
- Depends on: S03 landed
- Working outcome: revisit completed practice, advance to the next released lesson and inspect/restore an earlier experiment without losing the current draft.
- Scope: extend the DEPLOY-01 L01 map/journal to multiple released lessons, declared prerequisites and last-available behavior; bounded source/target/version/language/outcome/time history; separate completion and understanding; safe source restore, retention, version migration and storage recovery. The journal works with the existing real lesson, not an empty framework.
- Acceptance: one terminal record per Run; immutable executed source; reached/missed/error/stopped/outage/interrupted categories; no retry penalty or auto-run on restore; protect current work before replacement. Reload cannot turn an interrupted run into success.
- Validation: full next/revisit/history/restore browser flows, exact-once races, cancel/outage classification, quota/denied/corrupt storage, migration, cross-tab conflicts, both language drafts, screenshots. If too large, split map/progress and journal into separate observable slices before starting.

## S04 — One arm mission

- Status: implemented review candidate on `codex/mission-04-parcel`; validation is recorded in [MISSION-04-QA.md](MISSION-04-QA.md). [MISSION-04.md](MISSION-04.md) freezes the reviewed teaching/model/API contract and independent fixture expectations.
- Depends on: S03 and S08 landed (satisfied). The informed foundation walkthrough is reviewed; real classroom observation remains deferred by the owner.
- Working outcome: control an original arm/gripper to pick up and place one parcel, with Java/Python examples and explorable 3D.
- Scope: bounded two-joint arm, labeled axes and an independently actuated third gripper control, explicit grasp/drop geometry, one sequence mission; functions are taught separately in S09. No general contact-physics promise or full arm curriculum.
- Acceptance: grasp/carry/place follow documented rules; limits/collisions explain failure; wrong poses cannot succeed; camera, reset, existing motor lesson, and language drafts remain intact.
- Validation: independent arm/grasp/target boundary fixtures, deterministic trace replay, reference/wrong programs, both-language/browser flows, screenshots. Incorporate available learner feedback.
- Next action: review the candidate and exact-head CI, then obtain separate release authorization for hosted qualification and deployment. Observe the arm transition with real learners when available. S04 is not done until accepted work lands; no L05 build is started.

## S05 — Separate family progress

- Status: draft
- Depends on: S03H landed (S04 is optional for this slice)
- Working outcome: parent provisions two genuine private child logins with saved programs/progress, usable with documented local test infrastructure.
- Scope: extend and revalidate the DEPLOY-01 maintained encrypted-session and private-family foundation; aliases, family-scoped persistence including each child's attempt history, parent view/provision/revoke, save conflict resolution. Production setup is separate; no child email/public identity required.
- Acceptance: children can independently log in across profiles/devices; logout/refresh retains work; child A cannot modify child B's progress and another family cannot read either; parent revocation works. Existing anonymous development preview remains usable.
- Validation: two-child/second-family end-to-end flows, authorization, session/revocation, save conflicts; no credentials in client/runtime; fresh local service setup. Paid hosting/production configuration is recorded as a later dependency.

## S06 — One private validated challenge

- Status: draft
- Depends on: S02, S03H, S05 landed
- Working outcome: siblings make separate attempts at the same challenge and compare server-validated results in a shared family view, with personal bests and trusted replay.
- Scope: explicit authoritative server execution in both Python and Java, isolated student runners, trusted simulator/evaluator owner, supported competition-code contract, fixed scenarios, versions, rubric, failure/time-budget outcomes, ties, idempotency, and private results UI.
- Acceptance: no client score, student trace, writable rubric, or success flag can forge results. Rank reliability before simulated time; track experiments without penalizing retries or help. Store trusted source/runtime/compiler/API/model/challenge/seed/result/trace receipts. Define treatment of clocks/randomness/concurrency and computational resource limits; deterministic model replay is not a promise that arbitrary source always reproduces identically. If supported deterministic source enforcement cannot be proved, keep those programs practice-only and label eligibility honestly. AI policy is equal. Live simultaneous robot control is outside this slice.
- Validation: both-language authoritative feedback execution, model tampering, forged submissions, clock/random/thread cases, timeout/seed/tie boundaries, duplicates/races, access control, known-wrong programs, replay, full two-child flow. Rendering speed cannot affect model time/ranking.

## S07 — Live AI coaching

- Status: draft
- Depends on: S03H, S05 landed; provider setup available
- Working outcome: an existing useful lesson gains explain/suggest/debug help with previewed edits and student-controlled application.
- Scope: secure server provider integration, bounded nonidentifying context, parent-configured rate/spending limits, outage fallback. Existing lessons work when service is unavailable.
- Acceptance: suggestions never auto-run; malformed/adversarial output cannot modify code or access tools; identity/secrets stay out of prompts; timeout/limit feedback is clear; a wrong suggestion can become an explicit lesson check rather than an accepted result.
- Validation: deterministic success/failure/adversarial fixtures, payload inspection, limits, browser apply/decline flows, and a bounded live smoke after provider access exists. A mock is not a completed live coach. Missing provider setup does not block S01–S06.

## Later-lesson readiness rules

The following entries are **draft plans, not permission to start them now**. Read CURRICULUM.md for student prerequisites, model contracts and the full feedback review. Build order is not learner order. S05–S07 are not prerequisites for anonymous practice; new worlds become eligible for official family scoring only after S06's evaluator explicitly supports their model and both runtimes.

Before promoting one entry to ready: dependencies must be landed; choose one main new concept; freeze lesson/model/API versions, units, ranges, contact/failure semantics and all objective tolerances; prove feasible reference and intentional wrong programs within existing runtime limits; identify applicable FOUNDATION.md checks. Review the first rover/flight lesson with a student before multiplying that world's content, or preserve the pending feedback gate. Each entry delivers a complete lesson with both languages, locally explained syntax/await/reads/units/stop rules, three graduated hints, real-life connection, transfer, preserved drafts and inspected visual/browser evidence. CURRICULUM.md defines 16 core and four optional lesson outlines and a one-hour-session target; platform slices and practice variations are not extra missions. Scope an oversized lesson into separate useful outcomes before work; no framework-only slice.

## S08 — Ranger patrol loop

- Status: done; PR #4 merged and Mission 3 released after explicit owner authorization, exact-head CI and protected staging/candidate qualification. Contract: [MISSION-03.md](MISSION-03.md); evidence: [PROGRESS.md](PROGRESS.md) and [MISSION-03-QA.md](MISSION-03-QA.md). Real learner/device/pacing observation remains pending; the owner chose persona review now and a classroom pilot later.
- Depends on: S03 landed and existing DEPLOY-01/S03 map, drafts, journal and checked progress. This goal includes only L03 integration/regressions from S03H; its broader understanding/local-history work remains separate.
- Working outcome: use a loop to inspect a small set of ranger checkpoints with the existing light/camera mechanism; show each actual inspection.
- Scope: one repetition lesson, bounded checkpoint observations and a counter; variables/conditions reused, lists deferred.
- Acceptance and validation: the correct repeat count visits every required checkpoint; zero/one-too-few/excess repetitions, skipped dwell and a wrong tilt remain unfinished. Check real execution, reset of visited state, both-language observations, hints/transfer, history and browser visuals.

## S09 — Reusable parcel handoff

- Status: draft
- Depends on: S04, S08 landed
- Working outcome: package the arm handoff into a function/method with a destination parameter and use it twice.
- Scope: one functions lesson on the existing arm; distinguish library calls from an editable parameterized helper and call that helper inside a bounded loop; no new conveyor or physics engine.
- Acceptance and validation: separate calls deliver to their requested bays; hard-coded destinations, missing grasp/release and invalid poses fail. Test parameter boundaries, both-language behavior, draft/history/next flow and scene consequence.

## S10 — Foundation transfer and content pilot

- Status: draft
- Depends on: S09 landed
- Working outcome: repair one plausible wrong light/arm program for a changed need, then complete the six-lesson foundation path L01–L06.
- Scope: one transfer/debugging lesson plus links through existing lessons; authored AI review example, concise parent/student observation guide. Accounts/live AI/official scores are not gates.
- Acceptance and validation: copied original fails the changed target while a reasoned correction passes; record explanation/transfer separately from completion. Exercise all six reference/wrong programs, both-language lesson navigation/history and two synthetic learner journeys. Actual learner understanding/enjoyment remains pending until observed; do not call synthetic checks a completed pilot.

## S11 — Rover battery delivery

- Status: draft
- Depends on: S10 landed
- Working outcome: coordinate left/right wheels to deliver a loaded battery tray to one dock and stop.
- Scope: one two-wheel rover on a flat bounded map, one short route, ideal wheel-speed model and explicit dock/contact rules; R01 in CURRICULUM.md.
- Acceptance and validation: independent equal/unequal/opposite/zero wheel fixtures, heading/sign/unit boundaries, footprint/swept collisions and dock containment/stopping. Reference arrives and visibly transfers the battery; wrong turn, drive-through or wrong dock cannot deliver. Preserve existing lessons, both runtimes, history and camera independence. Observe this first rover lesson before expanding the pack.

## S11H — Rover measured turn

- Status: draft
- Depends on: S11 landed; first rover learner-fit feedback reviewed
- Working outcome: turn from a changed starting heading into a side loading bay and stop; R01b.
- Scope: ideal heading sensor, labeled world/robot directions, a visible editable sensor-driven turn helper; no encoders, slip or pose-setting API.
- Acceptance and validation: independently calculated forward/reverse, left/right, unequal/opposite wheel and heading-wrap cases; reference adapts across starts while wrong-sign, stale-reading and missing-stop programs fail. Freeze degree range, turn direction, wrap/error calculation and tolerance. Verify both languages, reset, sensor frame/tick, camera independence, transfer and journal.

## S12 — Rover sensor-controlled stop

- Status: draft
- Depends on: S11H landed; first rover learner-fit feedback reviewed before content expansion
- Working outcome: use measured distance to stop short of a barrier moved between attempts; R02.
- Scope: one ideal forward distance sensor with defined origin, range, saturation and sampling semantics; a bounded sense/decide/act/wait loop.
- Acceptance and validation: reference succeeds for authored starting distances; fixed old timing, reversed comparison, stale readings, absent wait/stop and collisions fail. Check sensor boundary/no-hit conventions, real Java/Python feedback, timestep/render independence, reset/cancel/stale messages and preserved drafts.

## S13 — Rover delivery list

- Status: draft
- Depends on: S11H, S12 landed
- Working outcome: use a list/array of short route steps to supply several stations; R03.
- Scope: small fixed layout and visible editable helper functions composed from taught motor/sensor actions; no opaque goal-completion call or path planner.
- Acceptance and validation: route order and deliveries follow actual stopped poses; duplicate/skipped/wrong stations and malformed steps cannot manufacture completion. Test lists/arrays in both languages, versioned outcomes, replay, transfer, history and navigation.

## S14 — Rover debugging and sensor validity

- Status: draft
- Depends on: S13 landed
- Working outcome: fix an authored units/boundary bug and respond correctly to an explicitly unavailable sensor; R04.
- Scope: one main debugging lesson using the existing rover; fault fixtures and a documented validity signal, no surprise random failures.
- Acceptance and validation: unavailable differs from maximum range; bad data leads to a controlled stop and explanation, not delivery credit. Verify exact boundaries, conversion/wrong-sign programs, recovery, sensor-state reset, both languages, history classification and browser outcome.

## S15 — Relief-station combined challenge

- Status: draft
- Depends on: S04, S14 landed
- Working outcome: deliver one requested parcel with the rover and hand it into a bay with the arm.
- Scope: C01, one bounded mission coordinating the existing models; explicitly teach named phases (arrive, docked, unload, complete) and a trusted payload contract; no new vehicle or general contact engine.
- Acceptance and validation: pickup/transport/handoff occur in order; duplicate payloads, skipped phases, collisions, wrong parcel/bay and resets cannot forge delivery. Reference/wrong-program and both-language fixtures, phase boundaries, history/replay, camera/render independence and full learner journey. Official competition additionally requires S06 model/evaluator qualification.

## S16 — Calibrate a light sensor

- Status: draft
- Depends on: S14 landed
- Working outcome: sample floor/strip brightness, choose a threshold and stop the rover at the inspection strip; P01.
- Scope: one downward reflected-light sensor on the existing rover, calibration and a declared separable brightness range. Reuse the distance-loop pattern; no color classification yet.
- Acceptance and validation: independent sample-footprint/brightness fixtures, endpoints, equality threshold, changed lighting, stale/unavailable reading and reset; wrong threshold/sign cannot earn alignment. Trusted sensing is independent of the viewer and frame rate. Both-language references must fit existing budgets; show code comments, trace, real-life connection and changed-strip transfer. Record learner feedback before the next sensor lesson.

## S17 — Classify a supply label

- Status: draft
- Depends on: S16 landed; first new-sensor learner-fit feedback reviewed
- Working outcome: read a stationary parcel's RGB components, choose its matching bay indicator or explicitly report unknown; P02.
- Scope: one color sensor and small student-written classifier, labeled RGB readings, ambiguous/no-label case; no new mechanism movement.
- Acceptance and validation: known colors, equal-brightness/different-color fixtures, channel swaps, component ranges, exact thresholds, ambiguity and absence. Brightness-only or hard-coded classification fails transfer. Check actual sensor→program→indicator behavior in both languages, text/shape alternatives, tick identity, camera independence, reset/history and comments.

## S18 — Sort relief supplies

- Status: draft
- Depends on: S15, S17 landed
- Working outcome: locate/read two parcel labels at the dock and use the taught arm function to place each parcel in its matching bay; C02.
- Scope: combine existing light/color readings, arm/gripper, named phases and parameterized handoff; unknown labels produce a bounded stop and explanation.
- Acceptance and validation: actual sensed labels and grasp/release determine destinations. Test changed parcel order, wrong color/bay, unknown label, premature grasp, duplicate delivery, collision and all phase resets. Independent payload accounting, both-language good/wrong fixtures, recovery/history/transfer and inspected browser outcome. Official results require S06 qualification.

## S19 — Follow a marked route and dock

- Status: draft
- Depends on: S18 landed
- Working outcome: follow a short bright strip, stop for an obstacle and finish at the matching color-coded dock; C03.
- Scope: visible editable strip-edge steering, distance-based stop and color-based arrival using existing sensors; explain condition priority. No new sensor, hidden path planner or unexplained controller.
- Acceptance and validation: prove the low-speed course feasible within current limits before ready. Cover moved obstacle, changed brightness, wrong dock, conflicting/invalid readings, lost strip, no-wait loop, collision and stopping boundaries. Safe stop is distinct from completing delivery. Both-language traces and wrong programs, reset/cancel/history, camera independence, hints and full combined journey. Qualify official scores separately.

## X01 — Optional rocket soft landing

- Status: draft (optional extension)
- Depends on: S14 landed; rover feedback/debugging understanding observed and first flight scenario reviewed for learner fit
- Working outcome: bring an uncrewed science capsule down gently using thrust and height/vertical-speed observations; F01.
- Scope: one-axis constant-mass lander with fixed gravity, bounded thrust and an existing editor/runtime; freeze numerical parameters and contact semantics before promotion. No fuel/orbital/steering model.
- Acceptance and validation: independent free-fall/balanced-thrust/rising fixtures; input ranges, sign/units, ground crossing, pre-impact velocity, ceiling/time failure, reset of all dynamic state and reference feasibility. Hard impact cannot become success after clamping. Test both-language control, Stop versus physical zero thrust, slow rendering, history and visible intact/failed landing. Record first flight learner feedback before X02.

## X02 — Optional launch, measure and return

- Status: draft (optional extension)
- Depends on: X01 landed; first flight learner feedback reviewed
- Working outcome: pass simulated readiness checks, ascend to a measurement band, dwell to collect a reading and return the capsule intact; F02.
- Scope: reuse X01's one-axis model; one explicit mission-state lesson, bounded height/dwell requirements and safe reset/failure rules. A decorative countdown is insufficient.
- Acceptance and validation: invalid readiness prevents launch; skipped measurement, out-of-band dwell, stale/forged phase messages, ceiling escape, timeout or hard landing never complete the job. Test phase transitions, exact contact/dwell boundaries, reference and wrong programs, both languages, history and learner-facing explanations. Official competition has the same separate S06 qualification gate.

## X03 — Optional image sensor

- Status: draft (optional extension)
- Depends on: S19 landed; core sensor understanding observed and image-lesson scenario reviewed for learner fit
- Working outcome: inspect a real small RGB sensor frame, count matching pixels by region and identify the marked inspection area; V01.
- Scope: fixed robot-mounted camera, bounded pixel grid (proposed 16×12), visible image/coordinates and student-readable loops; no uploads, network inference or learned model.
- Acceptance and validation: versioned trusted scene-to-pixel pipeline; independent pixel/field-of-view/occlusion fixtures; boundary pixels, absent/ambiguous marker, stale frame and frame/tick identity. API must return image samples, not an answer label. Orbit/display resolution cannot change sensing. Real both-language references, data/output/time bounds, reset/recovery and first-image learner observation before expansion.

## X04 — Optional image-guided docking

- Status: draft (optional extension)
- Depends on: X03 landed; first image-lesson learner feedback reviewed
- Working outcome: use image-region offset to steer beneath an inspection marker, stop using distance feedback and visibly complete docking; V02.
- Scope: combine existing camera/rover/sensors with one explained steering rule; no new perception model or arm behavior.
- Acceptance and validation: reference adapts to declared marker offsets; prerecorded answers, wrong marker, stale/lost detection, invalid distance and drive-through cannot pass. Prove feasible motion/tolerances, bounded feedback, priority, reset and both-language/runtime/browser/history conformance. Official scoring remains separately gated.

## Required delivery receipt

Runnable setup; visible behavior; met/unmet criteria; tested commit and actual PR head; check commands/links; inspected visual evidence; next action and blockers. Validated local work without PR access is `validated_local`, not done. Each later run reuses that branch and retries only the missing submission step.

## RECOVERY-01 — Verified parent email and custom domain

- Status: done; see PROGRESS.md.
- Scope: authenticated email binding, neutral lost-code request, explicit one-use recovery with safe retry, unchanged student login/progress, Resend sending, robolab.vibecodingdad.com alongside the existing app origin.
- Acceptance: current GOAL.md contract, recovery/API/UI regressions, real Blob concurrent claims, provider delivery and protected/live origin evidence, exact-head CI and preserved rollback.
- No new lessons, automated release policy, purchases or usage/reset work.

## Teaching progression refinement — current review slice

- Status: implementation/review candidate on the existing S08 branch; not landed.
- Owner scope: improve the progressive experience across L01–L03 and strengthen future authored plans, without building later missions.
- Acceptance: current-draft predictions and free hints in both languages; direct first edit and Run; truthful missing-checkpoint versus final-stop diagnosis, including retained short-hold evidence; code/challenge persistence and recoverable example restore; all 20 planned lessons mapped to retrieval, new demand and transfer.
- Future readiness: apply TEACHING-PROGRESSION.md in each mission contract. Existing dependencies, ownership, model freeze and first-family pilot gates remain.

## Repository personas and next curriculum decision

- Status: review candidate on the existing S08 branch; documentation and skills only. The owner authorized saving all eight personas in the repo, routing them through AGENTS.md, and identifying the next curriculum work.
- Scope: versioned `.agents/skills/robolab-*` instructions and UI metadata; automatic task-appropriate routing; course-wide design/retrospective guidance; source-based next-step review and a ready-to-use observation protocol in [TEACHING-PROGRESSION.md](TEACHING-PROGRESSION.md#next-curriculum-decisions).
- Acceptance: eight discoverable skill manifests validate; AGENTS links resolve; references work in a clean checkout without personal skill paths; no private data or new executable dependencies. Preserve existing skills' evidence and authorization boundaries. This does not change the app or count as fresh browser/provider/learner evidence.
- Next action: owner walkthrough of the L01–L03 candidate and observed learner progression; qualify staging/release only under separate authorization. Then author the L04/S04 contract. Later implementation, merge, deployment and class contact are not authorized by this planning task.
