# Family experience — implementation contract

Owner authorized the complete family/student experience on October 17, 2026, including implementation, persona review and comprehensive QA. This is one cumulative runnable slice, FE-01; internal checkpoints are not independently landed dependencies. Base `ce24ca5b82dbbc8b43175022f42ef3d03e78cfde`, branch `codex/family-experience`. UI-04's measured feedback is integrated from the coordinated Mission 1-3 work, preserving the landed guided-access behavior. No merge, deployment, provider mail, credentials, quota or account-setting changes are authorized by this contract.

## Product contract

- Visible parent email sign-in on any computer, existing-account confirmation only after proof, removable optional student nickname rows, no public legacy parent-code connection.
- Children edit and Run. Drafts save automatically; a successful unfinished challenge starts an authoritative server check of that exact run. Pending is visibly distinct from confirmed. All progress surfaces use the same confirmed targets; all three challenges complete a mission. Practice success does not prove conceptual mastery.
- Separate profile/mission/language drafts and immutable attempt snapshots. Revision conflicts require comparison; late requests never overwrite another profile or later edits. Retry receipts survive visible-history pruning. Existing compute limits remain.
- Remove experiment-note/reflection forms and manual Save draft. Keep brief thinking prompts, free progressive hints and measured explanations beside Run and the 3D scene. Console output means printed messages/errors. The latest 12 runs retain code, target, duration and bounded final measurements/output.
- Parent dashboard leads with each child's progress, next mission, activity and learning concepts. Parents may inspect child progress without impersonation; siblings receive summary data only. Optional weekly family summary, quiet inactive weeks, no per-mission messages. Stable recipient/week receipts, consent revalidation and authentication mail capacity remain required.
- Streaks, points and new badges are deferred. Existing records and legacy local notes are preserved.

## Evidence and review state

Status: **review**, in [draft PR #10](https://github.com/willcheung/3d-robotics-hack/pull/10). Family implementation/test checkpoint: `5983230a046ee6cf31a3a14e1e329de67b835306`. The candidate also integrates current main `841f341e2e722b767efceff9b6f47b635baa2775` to preserve its favicon and mission-title change; only the progress record conflicted. The final combined candidate is identified by the PR checks. Base: `ce24ca5b82dbbc8b43175022f42ef3d03e78cfde`. Branch/worktree: `codex/family-experience` / managed `family-experience`. Exclusive slice ownership protected implementation. The PR checks are the exact-head CI record; no merge or deployment is claimed.

Design/critique: keep physical accomplishment separate from understanding; explain actual state rather than infer intent from source. Student/teacher: the next action should be Run or adapt the next challenge, with no bookkeeping. Model: preserve server authority and existing model semantics. Builder/QA/retro: validate complete journeys and recovery before adding motivation features. These are informed synthetic reviews, not learner observation. The measured feedback implementation was coordinated with the Mission 1-3 chat and integrated from UI-04 source `6b76194f01128743e9a370ff829abf33177efea2`.

Local validation covers all **223 current cases**:

| Checks | Passed coverage |
| --- | --- |
| Model, autosave, Python bridge and preview | 40 |
| Family, recovery, parent email and weekly summary | 63 |
| Real isolated Java execution | 17 |
| Family browser journeys with real Python/Java server checks | 20 |
| Workshop browser behavior in both languages | 83 |

The family journeys cover all twelve challenges per language, automatic draft/progress saves, consistent child/parent results, fresh-browser resume, immutable submitted source, lost responses, duplicate receipts, offline retry, draft conflicts, Stop/logout/revocation and sibling privacy. Weekly tests cover reporting windows, quiet weeks, legacy dates, stable receipts, provider/queue failures, expired payloads, opt-out/recipient revalidation, bounded scanning and reserved authentication-mail capacity. They use disposable local accounts and controlled mail/store adapters; they do not prove live provider delivery.

The initial 80-case workshop batch passed 77 and found two outdated test assumptions (the renamed student navigation button and capturing feedback before running code) plus a real completed-mission layout regression. The screenshot now follows a real delivery; saved completion stays in the top strip while run follow-up requires a finished run. Corrected cases pass with unchanged layout bounds. Three new Stop/check race cases pass, and final affected batches revalidate curriculum, both-language explanations, hints, navigation and recovery. This is coverage across the broad batch and focused final reruns, not a claim of one all-green final local broad run.

TypeScript/production build, publication checks and all four package modes pass locally: static app, hosted app with weekly delivery off/on, and isolated runtime. Hosted test discovery passes; provider suites were not executed. Inspected synthetic screenshots include parent progress, all-mission completion, narrow measured feedback and the corrected returning-student laptop layout. No physical second-device or real learner pilot is claimed.

Native gstack adversarial source review found recovery/race defects and required regressions; its final reviewed scope has no remaining actionable findings. The final layout/activity/copy follow-up also has no finding. Source review and test/fixture summary inspection are distinct evidence; no external-model review is credited. The earlier draft CI run was superseded by final fixes. Run `39082870829` then hit the overall 25-minute job ceiling after reaching the workshop suite with 67 cases passing and no test-failure annotation; preceding suites and build had passed. The overall allowance is now 35 minutes, preserving every test assertion, individual timeout and student-runtime deadline. After integrating the new main-branch metadata change, TypeScript/build and all three navigation/viewport browser cases pass again. Exact-head CI results belong to PR #10.

Remaining release gates: separately authorized protected staging with actual Blob/Sandbox/mail/queue/cron, one designated opted-in family's inbox and scheduled weekly execution, rollout/rollback qualification, and public smoke checks. Observe a parent returning on another computer and a learner explaining a changed challenge before claiming usability or understanding. Next action: review PR #10 and its final CI; release only after explicit authorization. Streaks/badges remain deferred.

## Weekly delivery and rollout

Summaries are opt-in per family and disabled operationally by default. The dashboard stores the parent's choice even while delivery is unavailable. A Monday summary covers the previous Monday–Sunday in UTC, combines active children, reports runs and newly completed missions, and links to the parent dashboard. Quiet weeks send nothing. Older completions without reliable dates are not presented as new. The server retains eight weekly activity buckets independently of the latest twelve visible runs.

The existing private mail queue delivers encrypted, expiring payloads with recipient/week receipts. The cron entry enqueues a durable scan before any family processing; each job scans twenty families and queues continuation. A daily 16:00 UTC trigger retries dispatch for the same prior week. It does not create daily summaries. Preparation and send both require `WEEKLY_SUMMARY_ENABLED=1`; the HTTP entry also requires `CRON_SECRET` of at least 32 characters and its exact bearer header. Preference, current verified recipient and active students are rechecked immediately before sending. Optional mail stops at 48 of the unchanged 60 daily global sends, preserving authentication capacity. Undelivered payloads expire after 23 hours.

The application package includes the cron only when explicitly enabled, following the [Vercel Build Output configuration](https://vercel.com/docs/build-output-api/configuration) and [cron authorization contract](https://vercel.com/docs/cron-jobs/manage-cron-jobs). No provider configuration, secrets, schedules or actual messages are changed by local implementation. Before enabling in a release: qualify the exact protected app artifact, secret validation, private storage pagination, durable queue retry, one designated opted-in family's actual inbox delivery, duplicate suppression, opt-out and a scheduled execution. Keep existing rollback and public authentication/runtime smoke gates.

## Data and interface semantics

- Code saves are separate from execution: edits auto-save, while a run records the exact source, language and selected challenge used at launch. Editing during the check cannot change its result.
- A successful unfinished challenge checks automatically on the server. Three confirmed targets finish its mission. Pending results stay visibly pending; existing compute limits still apply and Retry sync recovers without creating a new attempt. Successful reruns of an earned challenge remain practice runs and retain the earned marker.
- Run history keeps the latest twelve attempts per profile, including source, target, outcome, simulated duration, bounded final measurements and up to 4,000 console characters. Arbitrary Python/Java variable values are not captured: students can print them, and the code preserves the values they entered. This is a bounded history, not an unlimited experiment archive.
- Console output contains `print`/`System.out.println` messages and errors. “Code finished running” describes runtime completion, while the adjacent result and “Why it worked” explain the observed physical outcome. Success explanations from the coordinated Mission 1-3 chat use actual model state, not guessed code intent.
- Parent dashboard shows each child's completed missions, current/next mission, learning concepts and recent activity. It does not expose child source or credentials in the progress projection. Login management remains a separate parent action.
- Local unsynced work survives sign-out and sibling switching under its original profile. Different cloud/local versions require an explicit choice, with a return copy when loading the saved version. Account switching never forces conflict resolution.

## Review findings resolved

Native adversarial review and QA probes found and repaired: expired email proof without restart; rejected student batches frozen as ambiguous retries; late replacement credentials crossing identities; Undo during an in-flight save dropping the reverted source; older local-only edits falsely marked synced; conflicts blocking logout; stale private history after forced sign-out; successful reruns mislabeled pending; delayed conflict-save acknowledgements updating another session's draft metadata; finished Stop responses falsely announcing completion after a miss/error; and duplicate completion content pushing returning students' code below the intended viewport. Regression tests exercise both a different student and a renewed session for the same student.

These findings came from informed design, critique, student, teacher, model, build, QA and retro lenses plus native gstack adversarial review. There was no real learner observation or independent external-model review.

## Account navigation follow-up

The header uses one account entry. Guests choose **Sign in**, then **Student sign in** or **Parent sign in**. Signed-in students open **My progress** directly; parents open **Parent dashboard** directly. The visible profile label still identifies the active account. Sign-out restores the guest entry. This supersedes the three separate guest buttons without changing authentication, saved work, or family authorization.

The sign-in disclosure supports ordinary Tab navigation, arrow keys, Escape, outside-click dismissal, and focus return after closing the form. Its controls remain reachable on narrow screens. The curriculum introduction omits the redundant rescue-light/arm/rover paragraph while retaining the actual playable count, chapters, previews, and unlock states.
