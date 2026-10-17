# Workspace UI review

## UI-02 — A shorter practice loop

Status: validated locally, October 17, 2026. The owner accepted the independent information-architecture review and requested compact progress, prediction/results beside Run, optional notes and simpler help. Branch: `codex/compact-workshop`; application commit: `dc2722042217a8dcc65d42a331278af84a2c61e3`; final code/test commit: `efeeea30dd64297cf99a3934a943f6af7b6c2fb8`. Before implementation, local merge `8428bec` incorporated released curriculum previews from main `c69c06d234c20babb92358386fe32ba3449b7afe`. Exclusive slice ownership was acquired before source writes. No publication, CI, merge to main or deployment is claimed.

### Outcomes

- A small progress strip above the job distinguishes the selected rescue/patrol/delivery from unique challenges completed during this visit.
- One mission-specific prediction sits before Run; actual results and the next action follow it. Reflection appears after a finished attempt. The original executed prediction stays attached to that run even if the next note changes.
- Experiment notes are optional and collapsed. Hints, Commands & numbers, and Reset & recovery each state their purpose. Numeric ranges, units, inline comments, free graduated hints and post-attempt example explanations remain reachable.
- Empty Output and real-world examples are collapsed. Printed output and errors open Output automatically. The 3D scene keeps its size when results change.
- The dark family progress heading remains readable at 13.66:1 contrast. Family controls remain below the workbench, with header access to account and curriculum dialogs.

At 1366×900, all four missions in both languages place the workbench at y=314, Run at y=481, results at y=536 and code at y=592. A 1280×800 regression checks the first code, prediction, Run and finished result in the viewport. The default full page is 1,479 pixels tall, compared with about 2,720 before this follow-up. Narrow screens stack the scene and editor; all four missions fit 390 pixels without horizontal page overflow.

Inspected final synthetic captures: [desktop](images/learning-flow-desktop.png), [result](images/learning-flow-result.png), [narrow](images/learning-flow-narrow.png), [family progress](images/learning-flow-progress.png). Additional local captures cover the other three missions. They contain disposable browser state only. No uncaught page errors appeared in the mission capture pass.

### Validation

| Check | Local result |
| --- | --- |
| TypeScript and production app/runtime build | Passed at the application commit; existing bundle-size advisory remains. |
| Model/language/preview checks | 30 passed. |
| Account/recovery checks | 49 passed. |
| Focused navigation, teaching and curriculum checks | 10 passed. |
| New practice-flow regressions | 3 passed: optional support and persistence, selected versus completed challenges, executed prediction/results and syntax-error recovery. |
| Workshop browser suite | All 72 checks covered: 68 passed in the broad batch; four old display expectations were corrected and passed within the five final affected checks below. |
| Final affected station journeys | 5 passed in 53.5 seconds at the final code/test commit: starter edit/run, keyboard/undo, invalid values, unique completions/Next and stale-run protection. |
| Local family UI journeys | 14 passed in 58.3 seconds, including real checked Java, prerequisites, saved drafts, new-device resume and sibling separation. |
| Publication checks and `git diff --check` | Passed; independent secret scanning remains a CI check. |

The focused checks preceded two final wording/icon refinements. The broad batch and final captures use the frozen committed application source. Four broad-batch failures came from old expectations: two assumed real-world examples were always expanded, and two expected the previous progress sentence. Test-only updates explicitly open the disclosure and match the concise wording; visibility, numeric counts, results and recovery assertions remain intact. The five final affected journeys all pass at the final code/test commit. No application edits or relaxed deadlines were needed. Local fixtures use real Pyodide and isolated Docker Java with disposable in-memory families. They do not establish cloud-provider behavior.

### Review and remaining boundaries

Applied the RoboLab design, critique, builder, student/teacher and QA lenses, plus gstack visual review. The independent reviewer found no required fixes. Both optional refinements were applied: a causal first-run reflection and consistent narrow disclosure icons. Reviews are informed synthetic walkthroughs, not observed child/teen learning or classroom pacing. Model semantics, runtime limits, checked account progress, prerequisites and draft recovery are unchanged.

Next action: inspect the local preview and await authorization to publish the branch before a draft PR and exact-head CI. Acceptance and hosted release remain separate.

## UI-01 — Earlier navigation checkpoint

Status: validated locally, October 17, 2026. The owner requested top-level curriculum/family navigation, a higher simulator/editor and less crowded copy. Base: `2cd78c972539d736fc7219006d04ab7f8e298318`; branch: `codex/compact-workshop`; application and regression-test commit: `755f1ad8890f7ccea720aaad8afc865bb975b41a`. Subsequent commits update evidence only. The branch has not been published; no PR, exact-head CI, merge or deployment is included.

### Changes and evidence

- Curriculum & unlocks and Family & progress now live beside the brand. Keyboard activation, Escape/Close focus return and curriculum navigation preserve the current draft.
- A compact mission heading contains both selectors. The useful job and goal values stay before Run. Decorative stamps, repeated introduction copy and the second prediction prompt were removed; detailed prediction, hints, units and recovery remain reachable.
- General language/account/unlock explanations are in the curriculum dialog, which now correctly identifies four playable missions. Number-reference columns have less visual framing.
- The dark progress toolbar owns its foreground color. Its heading improved from approximately 1.14:1 to 13.66:1 contrast; status messages are announced through a live region.
- At 1366×900, the workbench moved from y=586 to y=284 and the editable code from y=849 to y=524. All four missions and both languages meet the new laptop layout checks. Navigation and selectors fit 320, 390, 768 and 1024 pixel widths without page overflow.

Inspected synthetic screenshots: [desktop](images/workspace-desktop.png), [narrow](images/workspace-narrow.png), [progress toolbar](images/workspace-progress-narrow.png). Additional local captures covered Missions 2–4 and the family/curriculum dialogs. The first automated screenshot driver lacked WebGL; the actual 3D screenshots and diagram checks used Chromium with working WebGL. Enlarging narrow camera buttons overlapped a callout, so existing camera sizes were retained and the final diagram was checked again.

### Validation

Local macOS checks used Node 26.7.0, Playwright Chromium, real Pyodide and the existing isolated RoboLab Docker Java engine. Only disposable local account fixtures were used.

| Command | Result |
| --- | --- |
| `npm run build` | TypeScript and production app/runtime build passed; existing bundle-size advisory remains. |
| `npm run test` | 30 passed. Initial sandbox port-binding failures were resolved by running the same fixtures with local port access. |
| `npm run test:family` | 49 passed with local port access. |
| `DOCKER_HOST=unix://…/robolab/docker.sock npm run test:family-ui` | 14 passed, including real checked Java, all mission prerequisites, separate drafts, resume, sibling isolation and parent/student entry. |
| `npx playwright test tests/browser/workspace.spec.ts` | 3 passed: dialog/draft behavior, all mission/language laptop layouts and responsive navigation. |
| Full workshop browser batch | 64 passed in 11.4 minutes: real Python/Java across all four missions, drafts, errors/Stop/recovery, teaching, runtime isolation, keyboard and responsive behavior. |
| Final paired-origin run of workspace checks plus the station diagram test | 4 passed after restoring the existing camera-button sizes; actual motor/servo behavior, camera views and narrow callouts included. |
| `npm run check:publication` and `git diff --check` | Passed; independent secret scanning remains a CI check. |

The full workshop browser batch started before the camera-size restoration; executable behavior was unchanged, and the final camera/layout checks above used the committed source. Exact-head CI remains pending publication. The final preview uses matched app/runtime origins and snapshots its build assets.

### Review boundaries

Used the RoboLab builder and QA lenses, the curriculum critic's preservation checks, an informed student walkthrough and gstack's visual hierarchy/contrast review. An independent in-host source review found no remaining required fixes. Specific prompts and units remain available; no model, runtime, account authority, lesson prerequisite or saved-draft contract changed. This is synthetic UI and software evidence, not observed learner comprehension, classroom pacing or a live-provider qualification. The separate curriculum-preview branch/PR was preserved.

Next action: inspect the local preview and authorize publishing this branch to the existing GitHub repository before opening a draft PR and checking exact-head CI. Acceptance/merge and hosted release remain separate actions; no later lesson is started.
