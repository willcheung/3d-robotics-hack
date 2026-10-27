# Family arena: minimum lovable release

Status: released October 18, 2026. The owner authorized implementation including parents, then testing and production deployment. [PR #16](https://github.com/willcheung/3d-robotics-hack/pull/16) is merged and live; exact tested source `c12a9bd483ed4bc2b89f9facabdce9b9adfb2fb5`, merge `9a86d8cea5b92b915abba4556161483a77d17da9`. PROGRESS.md records CI and staging/candidate/public evidence. Global leaderboard remains deferred. The planning reviews below are historical source-based evidence, distinct from software qualification and learner observation.

## The first useful release

Turn the family’s administrative progress list into an inviting competition between students and parents, using the same view for both. Include existing active parent profiles alongside active students, using each profile’s own saved progress and identical scoring and badges. Label parent rows **Parent**. Ship one understandable score, four collectible mission badges, a visible next win and safe resume. Keep the existing four missions, real Python/Java runtimes, checked unlocks, free practice and saved work. No new account type or parent-provisioning flow is needed.

The earlier interactive concept is a visual reference, not the specification: its fixed 100-point challenge rewards and “no retry penalty” copy are superseded by the ten-try bands below. Customer standings use persisted participant progress; do not populate them with sample players or scores. Disposable QA fixtures remain separate.

- **Family arena:** rank, family display name, earned points, completed missions/badges and a **Parent** label on parent rows. Mark the signed-in participant “You,” whether parent or student. A parent's selected child can additionally be labeled “Selected student” without changing whose row is “You.” Equal points share a rank; zero points displays “Not ranked yet.” A one-child family can compete with its parent. Preserve existing family profile limits and the six-student limit.
- **My progress, for parents and students:** the same standings plus own mission progress, badge collection and Continue to the correct saved mission/challenge. Default to the signed-in profile's own progress, including the parent's existing drafts/completions. Name the actual remaining job and reward, for example “Complete East lookout · 90 points available”; include the 200-point badge bonus only when that success would finish the mission. Parents may inspect a student's aggregate progress separately; Continue always resumes the signed-in participant's own work. Student accounts never switch into another participant's drafts.
- **Mission details:** each challenge’s scored checks and earned/available points; the mission’s checks so far, frozen as its total on first completion, and points out of 500. Details are secondary to the next action. Student login management remains parent-only and visually separate. Parent selection inspects progress only; it never creates a student session or loads that student's draft into the parent's editor.
- **Visual treatment:** use the existing app shell and theme, arcade-style rank numbers/point totals, an earned badge accent and a highlighted own row. Reuse the current components; no new design system, avatars service, effects engine, sound or mandatory animation.

First screen priority: **family standings → your next win/Continue → badge collection**. Keep parent administration out of the standings rows. Show score rules before the first scored check and beside the try count. Replace current blanket “retries never cost points” copy in scored-check contexts with the precise free-practice/scored-check distinction. Name the useful robot job in the next action; points do not replace the lesson’s beneficiary, prediction or explanation.

## Scoring: ten tries in each band

Each of the three challenges in a mission earns points independently, using the try on which its first checked success occurs:

| Scored try at first success | Challenge points |
| --- | --- |
| 1–10 | 100 |
| 11–20 | 90 |
| 21–30 | 80 |
| 31–40 | 70 |
| 41–50 | 60 |
| 51+ | 50 |

`challenge points = max(50, 100 - 10 × floor((successfulTry - 1) / 10))`.

The successful check counts as a try. Each challenge has its own ten-try allowance; the three required successes do not share one allowance. Unlock the mission badge and add a fixed **200-point completion bonus** when all three pass. Mission maximum: **500**; fully completed mission minimum: **350**. Four released missions cap at **2,000**. Example: 4, 12 and 23 tries earns 100 + 90 + 80 + 200 = **470**.

Reduce the reward still available for an unfinished challenge. Never subtract from earned points, undo a badge, lock a completed mission or reset attempts through a replay, language switch, reload, sign-out, access-code replacement or second device. Award each canonical challenge and mission once per participant profile, across both languages. Parents use the identical bands, bonuses, reward floor/ceiling and free practice/help; admin actions never grant points or reset counts. Hints and AI help have no separate deduction. Time spent and simulated completion time never influence rank.

Rank by total earned points. Equal totals share rank: 500, 500, 400 → #1, #1, #3. Sorting tied display names is presentation only. Score is a progress/game score, not a measure of comprehension or overall ability.

### What counts as a scored try

Ordinary **Run** remains free practice. Only **Check & save progress** can add a scored try. Explain this beside the action: “Practice with Run. Checks 1–10 can earn 100 points; each later group of 10 lowers the available reward by 10, down to 50.”

For MVP, count only a trusted, durably finalized **reached** or **missed** result. All error results (including code errors), failed authorization/validation/prerequisites, quotas, duplicate requests, cancelled checks, unavailable runtime, transport/storage/provider failures and unknown interrupted outcomes do not count. Existing adapters merge code and provider errors; do not add an error-classification project to charge them differently. Call the visible counter **“scored checks”**, not all attempts or practice runs. Show “Check not counted” only for confirmed excluded outcomes; a lost response shows “Result not confirmed. Refresh progress” until the authoritative summary is read. A lost HTTP response must not erase a result the server has already durably finalized. If Stop wins before finalization, exclude the check; if finalization wins, retain its earned result and report that the check already finished.

Before pass: “12 scored checks · 90 points available.” After pass: “Completed in 12 scored checks · 90 points earned.” After 10 counted misses, the next counted success is check 11 and earns 90. Show the next check’s band without decrementing points that do not yet exist. Rechecking a completed challenge changes neither its first-completion count nor its earned award. The mission’s first-completion count is the sum of its three frozen challenge counts; later practice stays separate.

### Existing participants

Existing parent and student completion survives under the same migration. Award 100 points for each previously checked challenge and the usual 200 per completed mission. Reuse each profile's own completion list; do not copy a child's progress into a parent or create a replacement parent profile. Mark their historical tries **“Not recorded”**, never 0 or 1. For unfinished challenges, start new scored counters at launch and label them **“Scored checks since points launched.”** Do not infer missing history or apply retrospective deductions. A mission containing a legacy completion with unknown tries shows “Total checks not recorded,” with any new challenge counts still visible.

Initialize an absent score map from **preexisting** checked completions inside the same conditional update, **before** applying a newly finalized result. Freeze historical completed entries at 100 with unknown counts; unfinished entries start at zero. Never reinitialize existing scoring entries. A read-only summary uses the same baseline semantics until the first write. This avoids mistaking a new reduced-point success for historical full credit and needs no background migration.

## Small implementation boundary

Reuse the current family document, conditional-update helper, parent/student sessions, one-active-run-per-profile guard, checked execution and `/api/family` response. Add a fixed map for the twelve canonical challenges: scored count and frozen earned result. Keep the existing short experiment history for inspection, not as the scoring ledger. Compute mission bonuses and family totals from canonical completed/earned entries rather than maintaining another total that can drift. Add a minimal participant summary with role and aggregate achievements for active parents/students; keep the existing student-only list for provisioning/login controls. Shared standings expose no parent recovery email, credentials, admin data or another profile’s drafts/history, and grant students no admin authority.

The check finalization must update its counted result, first success, completion and earned points atomically. Reuse the draft-revision pattern: atomically consume/increment a per-profile check revision **when reservation admission succeeds**, and bind pending request ID, canonical target and accepted revision. This revision is a request nonce, separate from the scored-check count; an admitted check that later errors or Stops still consumes it. A replay with the old expected revision returns refresh/retry without new computation or counting, including after its history entry is evicted.

Hold the existing per-profile active reservation until terminal scoring is durably committed. The implementation base already records before releasing; preserve that ordering and bind finalization/cleanup to the accepted check revision. Finalization matches pending ID/target/revision, rechecks authorization and cancellation, initializes any legacy baseline, then atomically counts the eligible result, freezes any new award/completion and clears pending. Only then release runtime reservations. Stop competes through the same conditional-update boundary. An expired/replaced pending check or stale Stop/result cannot change a newer check. Excluded terminal states clear only their matching pending reservation and add no scored check; a finally path still cleans up resources if the store is unavailable. Preserve quotas. No event bus, general achievement engine, replay service, separate database or worker.

Intended code boundary: `server/family-store.mjs` for persistence/summary, `server/hosted-api.mjs` for trusted check finalization and `src/family.ts` plus existing CSS for display. Reconcile with the separately active account-navigation branch before implementation; do not copy an unfinished writer’s source. Add one small scoring helper only if it removes duplicated client/server rubric logic; never accept posted scores, counts, awards or success flags from student code or browser state.

```text
Practice Run ────────────────────────────────> existing runtime/history (no score)
Scored check -> current auth/run guards -> trusted result -> atomic family update
                                                          | count + freeze award
GET family <---------------------- derived private summary <┘
   ├─ parent: own ranked progress/Continue + optional student summary + separate admin
   └─ student: parent/student standings + own progress (no others’ private work/admin)
```

## States and recovery

| State | What the family sees |
| --- | --- |
| Loading | Stable headings and loading text; no fake zero scores or temporary rank |
| No students | Show the parent's own progress/standings and the existing Add student action; do not treat a parent-only family as an empty leaderboard |
| No checked success | “Not ranked yet” and Continue to Mission 1 |
| Partial challenge | Saved count, next-check reward and free Practice action |
| Pending check | Checking; prevent a second concurrent submission |
| Successful first check | “Challenge complete · +90 points” using the actual award; when applicable “Mission badge earned · +200 bonus.” Refresh standings and show the next action in the existing polite status area, without a new modal/effects system |
| Confirmed excluded failure | “Check not counted”; preserve code, progress and previous snapshot |
| Unknown transport/result | “Result not confirmed. Refresh progress”; retain the previous confirmed snapshot and reconcile through the existing family refresh |
| Stale revision/session | Refresh/sign-in guidance; no extra try or overwritten draft |
| Legacy history | Points retained; unknown tries explicitly labeled |
| All four complete | Full badge collection and Revisit; no unreleased Next action |

On a narrow screen keep rank, player and points readable; move counts and mission details below the row rather than horizontally scrolling or hiding points. Use 44px touch targets, visible keyboard focus, semantic table/rank labels and text alongside color. Check text contrast on the actual own-row highlight and badge treatments. Reuse the current narrow-dialog behavior and support 200% zoom/reduced motion. Do not expand this task into redesigning the coding workspace.

## Keep in the roadmap, outside the first release

**World arcade is the next separate slice, not cancelled, and is kids-only.** Server eligibility requires an active student role; exclude parent profiles regardless of points, approval or client flags. Apply that exclusion to enrollment, projections, all-player/near-me ranking and player cards, not just UI hiding. Parents approve their children’s participation without entering as competitors. Reuse these rows, badges and points after family scoring is accepted. Keep one board for the same four missions/rubric. Start signed-in, opt-in, with current parent approval plus student choice and generated aliases. Publish only alias/avatar preset, points and badge counts; no family names/links, source, ages, school, history or credentials. Hide/revoke must remove an entry. No chat or free-text profiles. Decide its minimal index after measuring the accepted family slice; do not prebuild it here. No real children are enrolled by this plan.

Defer adaptation/reliability badges, new assessments, challenge packs, seasons, cosmetics shop, streaks, score analytics, leagues and generalized reward infrastructure. Their absence does not prevent a lovable first family scoreboard. Four completed missions can tie; accept shared rank rather than invent a hidden speed tiebreaker.

## Implementation acceptance

1. Independently check tries 1, 10, 11, 20, 21, 50 and 51; 4/12/23 → 470; completed-mission floor 350 and ceiling 500; whole-track ceiling 2,000. Test legacy/mixed histories and unknown counts.
2. Check once-only count/award under duplicate admission; replay after an excluded error/Stop and after 12+ history entries; competing tabs; lost responses; both terminal-first and Stop-first orders; a delayed result/Stop after expired reservation replacement; forced conditional-write retry; logout/revocation and both languages. Assert reservation is held through terminal commit and existing quotas are intact. Wrong programs cannot earn completion. Free Run and excluded failure classes cannot lower available rewards.
3. Preserve all existing profiles, draft/challenge pairs, checked unlocks, reference/wrong programs, error/Stop/recovery and quota behavior. Prove identical parent/student scoring/badges, independent counters and legacy credit; admin actions cannot grant/reset points. Test parent/student and second-family API boundaries; no forged scores, parent email/admin leakage or access to another participant's drafts/history.
4. Walk parent and student views, Parent labels, each signed-in profile's “You” row, shared parent/student ties, a parent-only family, one and six students plus existing parent profiles, long names, pending/outage states and own mission resume. Selecting a child's summary must preserve the parent's own draft/session. Inspect synthetic desktop/narrow screenshots and keyboard/focus/zoom. Never put real credentials or family data in captures.
5. Run affected family/API/UI tests, production build and publication checks. Record exact tested commit. Local tests are not hosted-provider proof or learner observation; normal separately authorized release gates still apply.

Reuse `tests/family.test.mjs` and the existing conditional MemoryStore/API fixtures for scoring and race regressions. Cover legacy initialization plus ten new misses and the eleventh successful check: legacy completion remains 100/unknown, new completion is 90/11, and the mixed mission total remains unknown. Use existing Playwright family journeys for parent/student rendering and resume. Add no framework or broad refactor.

## Next action

The authorized family MVP is released. Collect owner/learner feedback; keep ARENA-02 deferred as requested. No global publication, further mission or new gamification is authorized by this release.

## Review record

Base: `2451250c18ec46bad7498c61eb607aa57e8fe574`, branch `codex/site-identity`; uncommitted documentation changes only. The working tree was clean before this planning pass. Existing source and the prior concept are evidence, not implementation of these proposed rules. Active worktrees/branches were inspected locally; remote ownership and PR reads failed because GitHub was unreachable. Do not infer ownership or landed integration from that failure. Preserve the existing site-identity work and other account/navigation writers.

This is a proportional **gstack persona review**, applying the installed product/CEO, seven-pass design and engineering methodology in sequence with separate native reviewers. It is not a completed full `/autoplan` pipeline, cross-provider review, formal shipping clearance or CI run. Optional gstack onboarding, telemetry and account settings were left unchanged. No outside provider was invoked. The requested simplicity takes precedence over setup ceremonies, scope expansion and additional reporting infrastructure.

### Findings incorporated

| Review | Evidence and finding | Smallest disposition |
| --- | --- | --- |
| CEO/product | Source: old PLAN/S06 conflict with new retries/time/global direction; current runtime combines code/provider errors | Supersede the old rubric explicitly; only terminal reached/missed checks count; retain world as a proposed next slice |
| CEO/product | Reduced rewards can make a generic next-win promise false | Name the job and exact currently available challenge award; include the badge bonus only when earned by that check |
| Design, all seven passes | Source: hierarchy, states, journey, visual restraint, existing components, accessibility and unresolved decisions; old screenshot is layout evidence only | Keep standings → next win → badges; distinguish confirmed uncounted results from unknown transport; announce actual awards; verify contrast. The later owner amendment replaces the original row/eligibility decision with parent participation and each signed-in profile's own “You” row |
| Engineering | `server/hosted-api.mjs` releases before persisting; `server/family-store.mjs` retains only twelve history entries | Consume an admission revision, bind pending, commit score while the active reservation is held, then release; test replay/Stop/expired-result orders in existing fixtures |
| Engineering | Lazy migration after appending new completion could mistake it for historical full credit | Initialize the old-completion baseline before any new result in the same conditional write; never reinitialize existing entries |

Engineering readback after the original amendments confirmed both ordering findings closed and no remaining material contradiction in that reviewed version. The subsequent owner amendment below adds parent participation. Architecture stays bounded by existing family profile limits × twelve score entries; no index, cache service, generic ledger or benchmark project belongs in this family slice. Tests remain required implementation work, not passed checks.

### Owner amendment: parents participate

After the original persona review, the owner explicitly included parents in the MVP family standings, using their existing own progress, identical points/badges, a Parent label and separate admin controls; the global kids' board excludes parents. This supersedes the earlier decision that parents were not ranked. A targeted source check confirms parent profiles already have drafts/completion/history, while `view()` currently filters its shared students list to students only. Add a minimal aggregate participant summary without changing that provisioning list, account model or scoring rubric. The affected acceptance checks above include parent independence and privacy. This amendment received a scoped plan/source consistency check, not another full persona or runtime pass.

### RoboLab lenses and reconciliation

| Lens | Finding and evidence | Decision / next check |
| --- | --- | --- |
| Curriculum designer and critic | Source-only: a completion/efficiency score can be mistaken for understanding; current lessons separately require prediction and changed-case explanation | Keep the current lesson sequence, purpose and assessment intact. Call these game/progress points, not mastery. No new skill meters or assessment badges |
| Skeptical student | Informed text walkthrough: after ten misses the next check earns 90; unknown legacy history and free Run versus scored Check can confuse | Explicit next-check reward, “scored checks” labels and unknown-history text. In implementation walk a first visit, ten misses, error recovery and fresh-device return; no beginner independence is claimed |
| Classroom teacher | Hypothesis: students behind on points may hesitate to check or seek help; points do not establish teaching effectiveness | Preserve free Run/hints/AI, a 50-point challenge floor, full 200-point completion badge and unchanged unlocks. Observe whether a teen can explain the band and still use help; do not invent engagement or pacing evidence |
| Robotics model | Source-only: success remains the current trusted canonical challenge evaluation; points add no actuator/sensor/time rule | Preserve both-language reference/wrong-program semantics. No simulator or later-lesson implementation |
| Builder and QA skeptic | Source: history is not a durable scoring lock; active source/ownership and runtime failure paths matter | Fixed score fields and atomic checks only; exact regression matrix above. Reconcile base/ownership before implementation; no product edits in this turn |
| Learning researcher | No new learner observations; the first benefit to test is understandable family progress, not more achievement dimensions | Build/review the family slice first if the owner accepts that sequencing. Observe one learner explaining free practice, a score band and a next goal; use evidence before adding dimensions |

The teacher's retry-pressure concern does not override the owner's ten-try direction. The remedy is transparent scoring, penalty-free practice/help, a reward floor and preservation of earned progress. The product desire for a global board remains explicit, while its consent/projection work is separated from the first release. These are reconciled design choices and hypotheses, not a vote proving learner benefit.

### Verification and remaining gates

Documentation links/publication rules, whitespace and independent scoring arithmetic are checked during this planning pass; the exact results are recorded in PROGRESS.md. Product code, runtime regression tests, new screenshots, CI, hosted services and learner pilots are not part of this planning validation. The earlier interactive concept still has the superseded fixed scoring and is not current product acceptance evidence.

This planning-only validation is superseded by the authorized implementation record in PROGRESS.md. No merge/deployment, account setting, quota, credential or global-publication action is implied.

## GSTACK REVIEW REPORT

| Review | Runs | Status | Findings |
| --- | --- | --- | --- |
| CEO/product persona | 1 | Native review complete | Rubric contradictions, counted outcome and truthful reward amended |
| Design persona | 1 | All seven dimensions reviewed | Outcome wording, earned-points feedback and row identity amended |
| Engineering persona | 1 + readback | Native review complete | Atomic ordering and baseline migration amendments verified in plan |
| RoboLab personas | 1 synthesis | Source-based review complete | Learning claims, free practice/help, recovery and evidence limits preserved |
| Subsequent parent-participation amendment | 1 scoped check | Plan/source consistency checked | Same profile scoring/badges, Parent labels, own resume and separate admin; global student-only eligibility specified |
| Outside LLM reviewer / full autoplan | 0 | Not run | No cross-provider or full-workflow clearance claimed |

**VERDICT:** Plan review complete; ARENA-01 implementation was subsequently authorized. Local software checks and native implementation review are recorded separately in PROGRESS.md; subsequent release verification is recorded there as well.

**UNRESOLVED DECISIONS:**
- Delivery sequence resolved by the owner: implement the family MVP now; global leaderboard later. Global publication is not authorized.
