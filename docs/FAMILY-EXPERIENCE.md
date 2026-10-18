# Family experience — implementation contract

Owner authorized the complete family/student experience on October 17, 2026, including implementation, persona review and comprehensive QA. This is one cumulative runnable slice, FE-01; internal checkpoints are not independently landed dependencies. Base `ce24ca5b82dbbc8b43175022f42ef3d03e78cfde`, branch `codex/family-experience`. UI-04's measured feedback is integrated from the coordinated Mission 1-3 work, preserving the landed guided-access behavior. No merge, deployment, provider mail, credentials, quota or account-setting changes are authorized by this contract.

## Product contract

- Visible parent email sign-in on any computer, existing-account confirmation only after proof, removable optional student nickname rows, no public legacy parent-code connection.
- Children edit and Run. Drafts save automatically; a successful unfinished challenge starts an authoritative server check of that exact run. Pending is visibly distinct from confirmed. All progress surfaces use the same confirmed targets; all three challenges complete a mission. Practice success does not prove conceptual mastery.
- Separate profile/mission/language drafts and immutable attempt snapshots. Revision conflicts require comparison; late requests never overwrite another profile or later edits. Retry receipts survive visible-history pruning. Existing compute limits remain.
- Remove experiment-note/reflection forms and manual Save draft. Keep brief thinking prompts, free progressive hints and measured explanations beside Run and the 3D scene. Console output means printed messages/errors. The latest 12 runs retain code, target, duration and bounded final measurements/output.
- Parent dashboard leads with each child's progress, next mission, activity and learning concepts. Parents may inspect child progress without impersonation; siblings receive summary data only. Optional weekly family summary, quiet inactive weeks, no per-mission messages. Stable recipient/week receipts, consent revalidation and authentication mail capacity remain required.
- Streaks, points and new badges are deferred. Existing records and legacy local notes are preserved.

## Evidence and remaining checks

Design/critique: keep physical accomplishment separate from understanding; explain actual state rather than infer intent from source. Student/teacher: the next action should be Run or adapt the next challenge, with no bookkeeping. Model: preserve server authority and existing model semantics. Builder/QA/retro: validate complete journeys and recovery before adding motivation features. These are informed synthetic reviews, not learner observation.

Parent-entry checkpoint (uncommitted changes on `d90f406`): TypeScript, 24 onboarding/parent-email tests and seven local browser journeys passed. Screenshots inspected at narrow width. Native gstack adversarial review found expired-proof recovery, frozen rejected batches and stale credential responses; fixes and browser regressions pass. Local fixture inbox only; no real delivery or physical second-device claim.

Remaining acceptance: automatic saves/checks in both languages and four playable missions; partial/full progress and parent consistency; fresh-browser resume; immutable source under edits; offline/lost responses/duplicates/conflicts; Stop/logout/revoke/sibling isolation; useful history and note removal; weekly windows/deduplication/quiet weeks/opt-out/provider failure. Run affected and full repository checks and inspect final screenshots. Record exact tested commit and review/CI state before handoff. Real provider and learner checks remain release gates.

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

Native adversarial review and QA probes found and repaired: expired email proof without restart; rejected student batches frozen as ambiguous retries; late replacement credentials crossing identities; Undo during an in-flight save dropping the reverted source; older local-only edits falsely marked synced; conflicts blocking logout; stale private history after forced sign-out; successful reruns mislabeled pending; and delayed conflict-save acknowledgements updating another session's draft metadata. Regression tests exercise both a different student and a renewed session for the same student.

These findings came from informed design, critique, student, teacher, model, build, QA and retro lenses plus native gstack adversarial review. There was no real learner observation or independent external-model review.
