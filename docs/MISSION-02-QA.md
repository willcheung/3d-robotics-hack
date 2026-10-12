# Mission 2 owner QA

This review covers S03 / L02 on [PR #2](https://github.com/willcheung/3d-robotics-hack/pull/2), now merged and [live](https://robolab.vibecodingdad.com) after the separately authorized release. The original local audit is below; PROGRESS.md records the exact source, CI and hosted release evidence.

## Audit findings and fixes

- **Rescue selection during a check:** reproduced a mismatch where the selector showed a new rescue while the pending server check and scene still used the previous one. The selector now stays on the checked rescue and tells the student to stop the check before switching. The new browser test failed before the fix and passed afterward; mission/language guards remain covered.
- **Mission-specific feedback:** success previously described a “recover from 30° crew” and asked about timing. Success now names the north-ridge or lower-cove crew and asks how the sensor reading chose the turn. A miss directs students to their Read/Decision console lines and destination values. Mission 1 retains its timing explanation.
- **Laptop label overlap:** the decorative “Crew pickup point” legend overlapped the 3D crew status at a 1280-pixel viewport. Removed the redundant legend; the 3D crew status and accessible status below the scene remain.
- **Coverage gap:** added a complete student journey through real checked Mission 1 prerequisites and Mission 2 completion, including a wrong program, second-device sign-in, saved draft, shared family results and an independent sibling. Added explicit checks that all three hints open in both languages without awarding a badge.

- **Original preview Python loading:** restored matched app/runtime assets at the reported URL after a shared-directory rebuild changed their configured origins. The unchanged draft survived reload and ran to completion. Local previews now keep a private asset snapshot; three new regressions cover rebuild isolation and cleanup.

- **Comparison versus destination:** renamed the starter value to `decision_angle` / `decisionAngle`. Comments and default help explain branch selection, power/time and the fixed crew target without giving the corrected condition. Nearby-value experiments, changed-branch/time cases and legacy draft preservation are checked in both real runtimes.

## Requirements and evidence

| Requirement | Evidence |
| --- | --- |
| Useful job and hardware connection | Visible crew/beam consequence, labeled motor/servo/sensor, camera and robot-arm applications, calibrated-hardware limitations. Comments and desktop/narrow screenshots inspected. |
| Real Python and Java | Both starters run and miss; the corrected comparison succeeds from 30° and 90°. Changed comparison value/tilt succeeds at the lower cove; unchanged transfer values and wrong units miss. The browser suite uses real Pyodide and isolated Java. |
| Self-study and gamification | Prediction feedback, three readable free hints, post-run explanation, input ranges, inline comments, three unique visit badges and a transfer explanation. Hints/retries do not subtract progress. |
| Safe editor/run/navigation | Wrong input, infinite-loop Stop, restart, reset, mission/language switches, reload, four separate drafts and unavailable storage are exercised. The pending-check selector regression preserves visible state. |
| Family progress and unlocks | Real local isolated Java plus the application HTTP evaluator verifies the six rescues. A fresh student cannot check L02 early; a wrong program does not earn completion. Saved completion/drafts survive another browser context; the sibling stays locked with separate work. Local account/recovery regression tests also pass. |
| Delivery | TypeScript/build, targeted local walkthroughs, inspected screenshots and required final-head CI. CI runs the full regression suite and packages both Vercel targets. Use the PR's checks for the exact final source, not a test count from an older commit. |

Local checks after the fixes: 10 account browser tests and 7 Mission 2 browser tests passed. The full CI suite contains 107 tests (8 model/schema, 3 preview isolation/cleanup, 22 account/recovery, 10 account browser, 15 isolated Java, 49 browser). The account fixture uses in-memory data and local Java, explicitly prevents cloud-runtime fallback, and does not prove Vercel Sandbox/Blob behavior. Its held-response navigation fixture tests a UI race only, not execution or completion.

## Owner checklist

Use the live app or the current local preview supplied with the PR. Guest drafts belong to that browser origin. Sign in with a student code and use Save draft / Check & save progress for cross-device work. Protected staging and public release checks have passed; learner observation remains the purpose of this checklist.

1. Open Mission 2 in Python. Before coding, explain who needs the light, what the motor/servo do, and what the sensor measures. Note any wording you would need to explain to a teen.
2. Predict the turn from 30° toward 60°. Run the starter and inspect **Read**, **Decision** and **Now**. The crew should remain waiting. Open each hint; no points or progress should be lost.
3. Change the comparison from `>` to `<`. Run, then choose the 90° start without rewriting the code. The same program should rescue the crew from both sides and earn two distinct badges.
4. Try a decision angle of 70 from both starting sides: the corrected program still stops at 60°, the fixed crew target. Explain which lines determine distance. Then try the lower-cove transfer. Unchanged destination values should miss. Change `decision_angle` (Python) or `decisionAngle` (Java) to −60 and `tilt` to 60, keep the comparison, and run. Expect −60° direction, 60° tilt and three visit badges. Explain why the same comparison works with negative numbers.
5. Change the wait to 0, run, and confirm the error preserves your draft. Restore 50 and recover. Reset should restore the selected case's starting pose without erasing code.
6. Repeat steps 2–5 in Java. Check that comments explain the syntax and that switching back restores the Python draft. Visit Mission 1 and return, then reload to check saved code. Visit badges restart on reload; server-checked family completion is separate and persistent.
7. Review the family screenshot/evidence below. The released family view shows separate completed Python/Java students and an uncompleted sibling. Both hosted languages passed staging and live checks for sign-out/re-entry and a fresh browser context. Checked Mission 2 progress requires all three checked Mission 1 rescues; practice is always available.
8. Try your intended laptop/browser and a narrow window. Check label/command readability and keyboard editing. Record whether the explanation, hints and transfer feel engaging, and what a teen could complete without adult help.

Comparison clarification: [Python comments](images/mission-02-decision-python.png), [Java comments](images/mission-02-decision-java.png), [number guide](images/mission-02-decision-guide.png), [narrow guide](images/mission-02-decision-narrow.png).

Earlier framework evidence: [Python lesson](images/mission-02-python.png), [Java lesson](images/mission-02-java.png), [narrow diagram](images/mission-02-narrow.png), [synthetic family completion](images/mission-02-family-progress.png).

Hosted release evidence: [desktop family results](images/mission-02-live-family-desktop.png), [narrow family results](images/mission-02-live-family-narrow.png). Both languages completed all three rescues and retained both missions' drafts/progress across fresh-browser and sign-out/sign-in checks on protected staging and the public domain. Real Blob concurrency checks and the protected production-candidate API checks passed before promotion. All disposable records were removed; existing student data and shared limits were preserved.

## Remaining limits

- Release checks used disposable pre-provisioned families and retained the existing daily signup quota. Fresh-family signup, email delivery and the full unchanged sandbox-adversarial matrix were not rerun during this release; earlier provider evidence and current CI regressions remain separate.
- Teen independence, enjoyment, accessibility with assistive technology, intended-device support and one-hour pacing remain unobserved. Automated completion does not establish understanding.
- This is one ideal sensor read with declared 30° starting offsets. Continuous feedback, noisy sensors, arms/rovers, official rankings and Mission 3 remain future work. Practice badges reset per visit; durable understanding records and the remaining S03H journal work are separately scoped.

No existing student data, credentials, service settings or automation are changed by this QA pass.
