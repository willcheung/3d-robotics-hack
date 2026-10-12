# Mission 2 owner QA

This review covers S03 / L02 on [PR #2](https://github.com/willcheung/3d-robotics-hack/pull/2). It is a local owner-QA candidate. The PR records the final tested commit and CI results; review is not a merge or live release.

## Audit findings and fixes

- **Rescue selection during a check:** reproduced a mismatch where the selector showed a new rescue while the pending server check and scene still used the previous one. The selector now stays on the checked rescue and tells the student to stop the check before switching. The new browser test failed before the fix and passed afterward; mission/language guards remain covered.
- **Mission-specific feedback:** success previously described a “recover from 30° crew” and asked about timing. Success now names the north-ridge or lower-cove crew and asks how the sensor reading chose the turn. A miss directs students to their Read/Decision console lines and destination values. Mission 1 retains its timing explanation.
- **Coverage gap:** added a complete student journey through real checked Mission 1 prerequisites and Mission 2 completion, including a wrong program, second-device sign-in, saved draft, shared family results and an independent sibling. Added explicit checks that all three hints open in both languages without awarding a badge.

## Requirements and evidence

| Requirement | Evidence |
| --- | --- |
| Useful job and hardware connection | Visible crew/beam consequence, labeled motor/servo/sensor, camera and robot-arm applications, calibrated-hardware limitations. Comments and desktop/narrow screenshots inspected. |
| Real Python and Java | Both starters run and miss; the corrected comparison succeeds from 30° and 90°. Changed goal/tilt succeeds at the lower cove; unchanged transfer values and wrong units miss. The browser suite uses real Pyodide and isolated Java. |
| Self-study and gamification | Prediction feedback, three readable free hints, post-run explanation, input ranges, inline comments, three unique visit badges and a transfer explanation. Hints/retries do not subtract progress. |
| Safe editor/run/navigation | Wrong input, infinite-loop Stop, restart, reset, mission/language switches, reload, four separate drafts and unavailable storage are exercised. The pending-check selector regression preserves visible state. |
| Family progress and unlocks | Real local isolated Java plus the application HTTP evaluator verifies the six rescues. A fresh student cannot check L02 early; a wrong program does not earn completion. Saved completion/drafts survive another browser context; the sibling stays locked with separate work. Local account/recovery regression tests also pass. |
| Delivery | TypeScript/build, targeted local walkthroughs, inspected screenshots and required final-head CI. CI runs the full regression suite and packages both Vercel targets. Use the PR's checks for the exact final source, not a test count from an older commit. |

Local checks after the fixes: 10 account browser tests and 5 Mission 2 browser tests passed. The full CI suite contains 102 tests (8 model/schema, 22 account/recovery, 10 account browser, 15 isolated Java, 47 browser). The account fixture uses in-memory data and local Java, explicitly prevents cloud-runtime fallback, and does not prove Vercel Sandbox/Blob behavior. Its held-response navigation fixture tests a UI race only, not execution or completion.

## Owner checklist

Use the current local preview supplied with the PR. It keeps guest drafts on that browser origin; family provider checks require a later authorized staging release.

1. Open Mission 2 in Python. Before coding, explain who needs the light, what the motor/servo do, and what the sensor measures. Note any wording you would need to explain to a teen.
2. Predict the turn from 30° toward 60°. Run the starter and inspect **Read**, **Decision** and **Now**. The crew should remain waiting. Open each hint; no points or progress should be lost.
3. Change the comparison from `>` to `<`. Run, then choose the 90° start without rewriting the code. The same program should rescue the crew from both sides and earn two distinct badges.
4. Try the lower-cove transfer. Unchanged destination values should miss. Change `goal` to −60 and `tilt` to 60, keep the comparison, and run. Expect −60° direction, 60° tilt and three visit badges. Explain why the same comparison works with negative numbers.
5. Change the wait to 0, run, and confirm the error preserves your draft. Restore 50 and recover. Reset should restore the selected case's starting pose without erasing code.
6. Repeat steps 2–5 in Java. Check that comments explain the syntax and that switching back restores the Python draft. Visit Mission 1 and return, then reload to check saved code. Visit badges restart on reload; server-checked family completion is separate and persistent.
7. Review the family screenshot/evidence below: Pilot A has completed Missions 1 and 2 while Pilot B has no checked rescues. Later staging QA should repeat this with disposable student accounts in both hosted languages, including sign-out/re-entry and a second device.
8. Try your intended laptop/browser and a narrow window. Check label/command readability and keyboard editing. Record whether the explanation, hints and transfer feel engaging, and what a teen could complete without adult help.

Evidence: [Python lesson](images/mission-02-python.png), [Java lesson](images/mission-02-java.png), [narrow diagram](images/mission-02-narrow.png), [synthetic family completion](images/mission-02-family-progress.png).

## Remaining limits

- Hosted Mission 2 Sandbox/Blob/origin acceptance and production deployment have not been performed. They need a separate authorized release pass.
- Teen independence, enjoyment, accessibility with assistive technology, intended-device support and one-hour pacing remain unobserved. Automated completion does not establish understanding.
- This is one ideal sensor read with declared 30° starting offsets. Continuous feedback, noisy sensors, arms/rovers, official rankings and Mission 3 remain future work. Practice badges reset per visit; durable understanding records and the remaining S03H journal work are separately scoped.

No existing student data, credentials, service settings or automation are changed by this QA pass.
