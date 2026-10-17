# UI-03 — Guided mission access

## Outcome and contract

The owner chose all three challenges passed with **Check & save progress**, with sign-in required, as the unlock rule. Mission 1 remains available for guest practice. Later missions remain visible through Curriculum & unlocks, with read-only code and scenes, the first unfinished prerequisite and a return button. Editing, keyboard Run, scenario/language changes, restore/save, notes and camera controls are unavailable in a locked preview. Existing drafts are retained.

The mission dropdown is removed. Verified completion earns **Mission complete · 3 of 3 checked** and **Next mission** in the compact top strip. Local practice and checked counts remain distinct. Revisit completed work through the curriculum. Completion is evidence that the program passed these scenarios, not proof of understanding.

The access state comes from the current profile's server response. Local storage and practice logs cannot grant access. Identity changes invalidate older responses; newer progress refreshes supersede older ones. Expired sessions or confirmed cross-tab profile changes remove old access. An invalid submitted parent code does not invalidate a valid signed-in session. The server's existing completion checks remain authoritative; this UI gate is a learning sequence, not an anti-tampering boundary for locally executed Python.

## Review lenses

- Design/critique: the prerequisite sequence and transfer challenges are unchanged. The new rule makes the next step explicit and gives completion a visible payoff, without adding another lesson concept or a new grading criterion.
- Student/teacher: informed synthetic walkthroughs covered guest preview → return, practice without unlocking, two checked challenges → still locked, third check → Next mission, revisiting, reload, siblings and returning drafts. The reviewer had seen reference programs; this is not an independent beginner observation or a classroom pilot.
- Builder/QA: real Python and local isolated Java still drive the models. Model success, progress verification, draft recovery and identity boundaries are checked separately from visual layout.
- gstack critical/informational checklist and native adversarial review: repaired stale identity invalidation, profile-mismatch handling, out-of-order progress and unrelated authentication-error handling. The final review also caught an empty-detail error panel hidden by the readiness spacing rule; the rule now applies only while idle, with a real Python error regression. Re-review found no remaining actionable source issues. No outside-model review is claimed. Gate inventory covered all 35 eligible existing test/config hunks at review time: the flagged test declaration changes to an account fixture, not a removed test; the server startup allowance includes the newly required hosted-frontend build, not a relaxed execution or assertion deadline.

## Local evidence

Base: `442ea6981def5f2122ae400709d114ace5f353a7`. Branch: `codex/guided-missions`. Exclusive ownership was acquired before source edits. Validation is local; the final checkpoint is recorded in PROGRESS.md.

| Check | Evidence |
| --- | --- |
| TypeScript and production build | Passed. |
| Model/Python/preview suite | 30 passed. |
| Account/API boundaries | 49 passed. |
| Isolated Java suite | 17 passed. |
| Local family UI | All 14 journeys covered: 13 in the final broad run, plus the corrected wrong-parent-code fixture passed separately. Earlier all-14 run also passed. The real progression journey checked all 12 challenges and exercised reload, Next mission, eight drafts and sibling separation. |
| Final focused browser checks | All 11 lock/session/layout/learning-flow journeys passed, including visible error feedback. The keyboard/editing journey and the three-successes-without-unlocking journey also passed separately. |
| Workshop regression coverage | All 77 current journeys covered across batches. The broad run passed 72 of its 75 cases. Its three failures were an outdated nonhosted copy assertion, a test renamed during the run and a viewport spacing regression. The current keyboard, practice-lock and layout cases passed after correction. Two additional session-race cases pass in the final focused batch. This is split-batch coverage, not a single clean full-suite run. |
| Publication check | Passed against all staged additions. No hosted credentials or family data are included. |

Existing mechanism and teaching suites use explicit account-state fixtures for already checked prerequisites, while executing real local Python/Java. Separate family UI tests execute actual server checks. Test-only stored prerequisites support unrelated draft/navigation/recovery scenarios and are never exposed by production routes. No assertion, runtime deadline or test is removed to accommodate the new lock. A submitted parent-code fixture was corrected to the actual input format so the test reaches the intended server error.

Desktop and narrow screenshots were inspected for locked previews and the completion strip. At 1366×900, all unlocked missions/languages keep the workbench above 340px and code above 600px; locked previews keep both visible in the initial desktop viewport. Navigation fits 320, 390, 768 and 1024px without horizontal overflow. Targets retain 44px tap height. Redundant readiness text is hidden; actual feedback remains beside Run. Local logs and synthetic screenshots are retained under ignored `work/guided-missions/`, `test-results/` and `test-results-family-ui/`.

## Delivery boundary

This change has not been merged or deployed. No live provider, production, email delivery or actual learner evidence is claimed. The existing localhost preview is refreshed on its original origin to retain drafts. Next delivery steps are GitHub/CI and an authorized release with the repository's hosting checks; the previous UI-02 release's focused-hosted-check exception is not a new release qualification result.
