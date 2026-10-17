# Lesson feedback and hints · UI-04

## Scope and design

The owner reported that a successful experiment is acknowledged but does not clearly explain why it worked. This shared refinement applies to all four playable missions in Python and Java. Base: `442ea6981def5f2122ae400709d114ace5f353a7`; isolated branch: `codex/lesson-feedback`. The concurrent mission-lock release is owned separately. This work does not alter simulation, execution, scoring, stored accounts/progress or later missions.

The result beside Run now contains a visible **Challenge complete** label, the useful outcome, actual model observations and a short **Why it worked** explanation. It connects power/time/stopping, decision versus travel distance, ordered checkpoint holds, or parcel handoff to the measured result. It does not inspect student source or trust printed output. Valid alternatives show their actual values, including non-exact positions within the accepted tolerance. Success means this challenge's physical requirements passed; it does not certify conceptual mastery or checked family unlocks.

Three separate hint disclosures and the worked explanation become one progressive card. Students see one hint at a time, can return to a previous hint, and explicitly choose the worked example after an attempt. The example is labeled with its original scenario. The draft is never replaced. Reflection remains optional and the next challenge remains one action away.

## Review lenses and findings

| Lens | Evidence and decision |
| --- | --- |
| Design and curriculum critic | Source review found success copy mainly asked the student to supply an explanation, while the explanation lived in separate help. Move outcome, observation and mechanism together. Keep transfer edits out of automatic success feedback. |
| Student and classroom teacher | Informed synthetic walkthroughs use the existing first edit → run → result → next challenge flow, plus hints and recovery. Keep a short visible explanation and progressive help; no required quiz, new screen or essay. No independent beginner or classroom observation is claimed. |
| Builder and QA skeptic | Use the trusted final state and existing evaluator. Clear the explanation through the existing feedback lifecycle. Real-language tests cover actual alternate solutions, hard-coded decision shortcuts, output that claims success, errors, Stop, Reset, context changes and saved drafts. |
| Engineering review | Installed gstack critical/informational checklist and gate scan, plus a native adversarial source review. The native source review identified no required fixes. A separate browser keyboard probe reproduced focus remaining on disabled Previous hint when returning to hint 1; the fix moves focus to More help and adds a keyboard regression. The adversarial reviewer read fixture/test names and statistics only; parent checks execute the tests. These are focused checklist/native review passes, not a complete gstack release review. No outside-model or hosted-provider review is claimed. |
| Retrospective | The owner's report motivates this change. Whether students can explain and transfer the idea after reading the card remains a learner question, not a software-test conclusion. Future authoring gates in PLAN, FOUNDATION, ENGINEERING-CHECKS and TEACHING-PROGRESSION require the same pattern. |

## Verification

- Clean pinned install: 92 packages, no reported audit vulnerabilities; TypeScript and production build pass.
- Model/language/preview suite: 34 passing checks, including four new independent explanation regressions. Actual alternate timing reaches 61.2° within the existing tolerance; a hard-coded sensor-case success does not receive credit for a conditional; unlogged holds and unreleased parcels cannot produce success explanations.
- Focused browser pass: eight tests pass using real Pyodide and locally isolated Java. Both runtimes traverse all four new explanations; wrong output, rerun, Stop, errors, Reset, changed case and reload clear stale success. Eight mission/language draft contexts, notes, restore and storage-denial recovery pass.
- Desktop and 390-pixel screenshots were inspected. The completed result is beside Run; actual observations and explanation are readable, and the narrow layout has no horizontal overflow. Initial layout is unchanged. Evidence is retained in the local test artifacts; screenshots contain synthetic practice only.
- Final affected browser pass: five tests pass on implementation commit `6b76194f01128743e9a370ff829abf33177efea2`, including the focus repair, both complete Mission 2 journeys and both-language four-mission explanations. The original Mission 2 assertion expected the removed claim that the sensor chose the turn; its replacement checks measured movement and the distinction between one successful start and a general decision.
- All 14 disposable family UI checks pass, including checked unlocks, saved code/challenge pairs, second-device resume, sibling separation and profile transitions. No hosted provider or real account is used.
- Full workshop batch: 72 of 75 passed on its frozen preview snapshot. Two Mission 2 checks still expected removed success copy; the new keyboard regression also reproduced the pre-fix focus issue against that older snapshot. All three affected checks pass in the final five-test batch above. Thus all 75 workshop journeys are covered by the broad batch plus final affected revalidation; this is not a claim of one all-green broad run on the final commit. No deadlines, outcome checks or runtime limits were relaxed.
- Commands: `npm run build`, `npm test`, `npm run test:browser`, `npm run test:family-ui`, the five affected Playwright tests and `npm run check:publication`. App/Python preview origins are paired on 4973/4974 for the broad snapshot and 5073/5074 for final revalidation. Publication hygiene passed for all 219 tracked files. No GitHub CI or hosted qualification was run for this local-only candidate.
- Final visual check also executed Parcel Port in a disposable browser: delivered parcel, zero uncaught page errors and no 390-pixel overflow; its desktop/narrow result captures were inspected.

## Owner QA

1. Complete any challenge. Confirm the result clearly says **Challenge complete**, explains the measured result, and says **Why it worked** without opening help.
2. Try a different valid solution. The observation should show what your run did, not reference-program values. In Mission 2, success should not claim it proved the decision handles every start.
3. Make an unsuccessful attempt, use Stop, Reset, or switch challenges/languages. The previous success explanation should disappear; your draft should remain recoverable.
4. Open Hints. Read one, ask for more help, go back, then explicitly open the worked example after a run. Each step should be understandable and leave your code untouched.
5. Continue to the next challenge and explain what must change and why. This is a learner check; a green result alone does not establish it.

## Boundaries

Local software and informed synthetic reviews are the evidence here. Hosted qualification, actual student comprehension, device pilots and new email delivery are not claimed. Before publication, reconcile any newly landed navigation changes from the separately owned PR #9 and recheck affected navigation/lock behavior. Merge/deployment require separate authorization; no automation changes or future mission implementation are included.
