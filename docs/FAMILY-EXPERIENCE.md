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
