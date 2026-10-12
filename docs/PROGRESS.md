# Public progress

Implemented and previously validated: S01 rescue searchlight in Python, S02 real Java and syntax colors, DEPLOY-01 hosted runtimes and private family progress, FAMILY-01 in-app family/student setup, and RECOVERY-01 verified parent email recovery. Mission 1 is live; its three rescue variations are one lesson. Mission 2 is playable on its review branch, described below. Later curriculum entries remain plans.

OPEN-01 prepares the public source distribution: privacy review, MIT license, dependency notices, generic setup/contribution/security documentation and publication guardrails. The publication receipt records its exact source and checks after validation. Private historical operations receipts are not part of the public source distribution.

For each future slice record ID/status, base SHA, branch/PR, last runnable and exact tested commit, checks/evidence, unmet criteria, blockers and next action. `review` means validated work awaiting acceptance; `done` means it landed. Resume unfinished authorized work before selecting another ready slice. Inspect live ownership before writing.

Actual student/device pilots and OPS-01 scheduled-access/atomic-cycle proof remain pending. No automation is activated by publishing the source.

## RECOVERY-02 — Visible email verification confirmation

- Status: done; [PR #1](https://github.com/willcheung/3d-robotics-hack/pull/1) merged and the tested app was promoted to [RoboLab](https://robolab.vibecodingdad.com) on October 12, 2026 after explicit release approval.
- Base: `451e93e68363fd76940c2efdd29ca3c1ac7233d3`; branch: `codex/email-verification-banner`.
- Last runnable implementation: `a8d807fefa7201c2258c4497492646b8027d7b84`; exact tested and deployed source: `6f6193bb15dc995b2a057f3d1af27f3f8d54c139`. Merge commit: `226d9b60a29850c30ee426329c3aed7697f77890`, preserving the newer README edits with identical application source.
- Outcome: a persistent, accessible “Email verified” banner identifies the server-confirmed parent recovery address and explains the recovery action. Pending or rejected links do not inherit a previous address's success; students and signed-out users see no address in the banner.
- Passed: 20 account/recovery tests, 7 browser account tests, TypeScript/production build and publication checks. Inspected [desktop](images/email-verified-desktop.png) and [narrow](images/email-verified-narrow.png) screenshots use synthetic identities. Browser checks cover new-tab confirmation, reopen/reload persistence, logout/student privacy, consumed-link failure and long-address wrapping.
- Exact-head CI passed: [88 workshop tests and deployment packages](https://github.com/willcheung/3d-robotics-hack/actions/runs/38276650048) and [publication safety](https://github.com/willcheung/3d-robotics-hack/actions/runs/38276650047).
- Protected staging, the production candidate and the public site passed the real verification-API banner checks: reload persistence, reused-link rejection, parent-only visibility and narrow layout. Live screenshots were inspected. The public browser journey passed parent/student sign-in, student creation, real Java, browser Python, server-checked Python and shared saved results; disposable fixtures were removed.
- Release limits: fresh-family signup checks were blocked by the existing daily quota, which was preserved; release checks used disposable pre-provisioned families. One staging Java Stop/restart failure did not recur in two focused reruns; its cause remains unconfirmed. This change has no backend, email-provider, storage or runtime changes, and does not claim new live email-delivery proof. Deployment IDs, package hashes and rollback details remain in the private operator receipt.
- Next action: no further work required for RECOVERY-02. Student/device pilots and later curriculum slices retain their existing readiness gates.

## S03 / L02 — Mission 2: Read, then choose

- Status: review candidate in [draft PR #2](https://github.com/willcheung/3d-robotics-hack/pull/2); locally validated, with current-head CI required for acceptance. Not merged or deployed.
- Base: `074d344968401539af2a533385fcc574b427407f`; branch: `codex/s03-sensor-choice`; worktree: primary checkout. Last runnable implementation: `3a35be89b8c51388cc7e68466f98c8621859b785`. The PR records its final head and exact-head checks, including this receipt.
- Outcome: use an actual direction reading and one conditional branch to recover the searchlight from 30° or 90°, then adapt goal/tilt for a lower-cove transfer. Both real languages include explanatory comments, units/ranges, prediction, console trace, three hints, a worked explanation, real-machine applications and penalty-free recovery badges. See [the frozen lesson contract](MISSION-02.md).
- Framework: two-mission navigation, four independent drafts, mission-aware existing journal restore and shared checked milestones. L01 keys/data remain valid. Server-owned L02 starting poses, canonical lesson/version receipts and L01 prerequisites prevent client-reported results from unlocking progress. S03H's remaining durable understanding/local-history work stays separate.
- Passed locally: 8 model/schema tests, 22 family/recovery tests, 8 account browser tests, 15 isolated Java tests including real server evaluation, and all 47 browser behaviors across the full regression batch and focused reruns. The initial full browser run found two obsolete Mission-1-only copy assertions; the updated teaching/navigation checks passed without changing deadlines or robot-result assertions. The first Java browser attempt used an unavailable default Docker endpoint; the documented RoboLab engine then passed. Final Mission 2 checks also reject a wrong-unit goal.
- Clean-install/build evidence: `npm ci` reported zero known vulnerabilities; TypeScript/production build and app/runtime Vercel package checks passed from a clean source export. Publication checks passed for 105 tracked files. Exact-head GitHub CI remains the final check record in the PR.
- Inspected visual evidence: [Python lesson](images/mission-02-python.png), [Java lesson](images/mission-02-java.png), [narrow sensor/motor/servo diagram](images/mission-02-narrow.png). The number guide uses Mission 2's actual variables and wait call.
- Unmet release/learning gates: no new cloud Sandbox/Blob provider or deployed-origin acceptance; no teen/device pilot or validated one-hour pacing. The local authoritative HTTP test uses real isolated Java with in-memory storage, not a Vercel provider. No scheduler/usage/reset/configuration changes.
- Next action: review final-head CI and the runnable lesson, collect a supervised teen walkthrough, and obtain explicit merge/deployment authorization before a protected hosted acceptance/release. Do not start S03H or another mission from this review branch.

### S03 owner-QA pass

- Same PR #2 and branch; audit base `90144aba20569204de63aff75ece8aaa10fa3e91`. See [readiness report and owner checklist](MISSION-02-QA.md). Final exact tested SHA and CI links are recorded in the PR and private resume receipt.
- Reproduced and fixed rescue-selector drift during a pending progress check. Added a failing-before/passing-after browser regression, including existing mission/language guards. Corrected Mission 2 result feedback to name the crew and explain the sensor decision; retained Mission 1 behavior.
- Passed locally: 10 account browser tests, including a real isolated Java prerequisite/completion journey and cross-device/sibling separation; 5 real Python/Java Mission 2 walkthroughs including all hints, mistakes, transfer, Stop/Reset and draft preservation; TypeScript/build. Desktop, narrow and synthetic family screenshots inspected. Final-head CI is required before handoff and is linked in PR #2.
- Final laptop visual pass removed a redundant pickup-point legend that overlapped the 3D crew status at a 1280-pixel viewport. The useful 3D and accessible crew-status labels remain.
- Boundaries: in-memory local account fixtures and real local Java are not cloud-provider proof. No merge/deploy, production-data changes, automation changes or later mission work. Learner/device/pacing and hosted release checks remain pending.

### S03 owner feedback — lesson-code spacing

- Added blank lines between each explanation-and-code group in the Python and Java starters for Missions 1 and 2. Worked/reference examples inherit the same spacing. Nonblank source lines are identical; saved drafts and student records are not reformatted or replaced.
- Made this readability convention part of FOUNDATION.md for future lessons. Existing drafts can opt into the revised starter with Restore example, which replaces that draft.
- Passed locally: 8 model/schema checks, TypeScript/build and both complete Mission 2 language walkthroughs (starter miss, both correction directions, transfer and reset). Refreshed Python/Java screenshots inspected; existing final-head CI remains the acceptance gate and is recorded in PR #2.

### S03 owner feedback — Python loading at the original preview URL

- Reproduced a 45-second Python load timeout on the owner's original local preview: its server still expected one origin pair while shared app/runtime build directories had been replaced by a build for another pair. Browser/runtime isolation correctly rejected the mismatch.
- Restored the same app origin with matched, dedicated build assets. Reload preserved the displayed draft exactly; the owner's existing Python program then reached FINISHED with real Read/Decision/Now output.
- Local preview servers now snapshot the paired build assets at startup, preventing subsequent builds from changing an active preview. Shutdown and failed startup clean up those temporary files. No runtime-origin permissions, production settings, accounts or student records were changed.
- Added three CI regressions for replacing both build directories while previews are running, port-conflict cleanup, and incomplete-build cleanup. The asset-replacement test failed before the fix and passed afterward. Existing real Python/Java browser tests remain the execution proof; static HTTP fixtures do not simulate Python.
- Final tested commit and full CI results are recorded in the same PR #2 and private resume receipt. No merge or deployment.
