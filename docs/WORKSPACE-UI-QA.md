# Compact workshop review

Status: review candidate, October 17, 2026. The owner requested top-level curriculum/family navigation, a higher simulator/editor and less crowded copy. Base: `2cd78c972539d736fc7219006d04ab7f8e298318`; branch: `codex/compact-workshop`; application and regression-test commit: `755f1ad8890f7ccea720aaad8afc865bb975b41a`. The PR records its final head and CI result. No merge or deployment is included.

## Changes and evidence

- Curriculum & unlocks and Family & progress now live beside the brand. Keyboard activation, Escape/Close focus return and curriculum navigation preserve the current draft.
- A compact mission heading contains both selectors. The useful job and goal values stay before Run. Decorative stamps, repeated introduction copy and the second prediction prompt were removed; detailed prediction, hints, units and recovery remain reachable.
- General language/account/unlock explanations are in the curriculum dialog, which now correctly identifies four playable missions. Number-reference columns have less visual framing.
- The dark progress toolbar owns its foreground color. Its heading improved from approximately 1.14:1 to 13.66:1 contrast; status messages are announced through a live region.
- At 1366×900, the workbench moved from y=586 to y=284 and the editable code from y=849 to y=524. All four missions and both languages meet the new laptop layout checks. Navigation and selectors fit 320, 390, 768 and 1024 pixel widths without page overflow.

Inspected synthetic screenshots: [desktop](images/workspace-desktop.png), [narrow](images/workspace-narrow.png), [progress toolbar](images/workspace-progress-narrow.png). Additional local captures covered Missions 2–4 and the family/curriculum dialogs. The first automated screenshot driver lacked WebGL; the actual 3D screenshots and diagram checks used Chromium with working WebGL. Enlarging narrow camera buttons overlapped a callout, so existing camera sizes were retained and the final diagram was checked again.

## Validation

Local macOS checks used Node 26.7.0, Playwright Chromium, real Pyodide and the existing isolated RoboLab Docker Java engine. Only disposable local account fixtures were used.

| Command | Result |
| --- | --- |
| `npm run build` | TypeScript and production app/runtime build passed; existing bundle-size advisory remains. |
| `npm run test` | 30 passed. Initial sandbox port-binding failures were resolved by running the same fixtures with local port access. |
| `npm run test:family` | 49 passed with local port access. |
| `DOCKER_HOST=unix://…/robolab/docker.sock npm run test:family-ui` | 14 passed, including real checked Java, all mission prerequisites, separate drafts, resume, sibling isolation and parent/student entry. |
| `npx playwright test tests/browser/workspace.spec.ts` | 3 passed: dialog/draft behavior, all mission/language laptop layouts and responsive navigation. |
| Final paired-origin run of workspace checks plus the station diagram test | 4 passed after restoring the existing camera-button sizes; actual motor/servo behavior, camera views and narrow callouts included. |
| `npm run check:publication` and `git diff --check` | Passed; independent secret scanning remains a CI check. |

The full workshop browser batch and exact-head CI are recorded in the PR. Its batch started before the camera-size restoration; executable behavior was unchanged, and the final camera/layout checks above used the committed source. The final preview uses matched app/runtime origins and snapshots its build assets.

## Review boundaries

Used the RoboLab builder and QA lenses, the curriculum critic's preservation checks, an informed student walkthrough and gstack's visual hierarchy/contrast review. An independent in-host source review found no remaining required fixes. Specific prompts and units remain available; no model, runtime, account authority, lesson prerequisite or saved-draft contract changed. This is synthetic UI and software evidence, not observed learner comprehension, classroom pacing or a live-provider qualification. The separate curriculum-preview branch/PR was preserved.

Next action: inspect the review candidate and exact-head CI. Acceptance/merge and hosted release need their ordinary authorization; no later lesson is started.
