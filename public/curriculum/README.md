# Mission preview assets

Original RoboLab artwork, covered by the repository MIT license. These static
illustrations introduce jobs; they do not run student code or record progress.

- `L01.png`–`L03.png`: actual `StationScene` geometry from the released base
  `773d02049e1460d6db32c2fcf23da9020554590a`. Camera framing and illustrative
  poses distinguish aiming at the crew, an off-target light and patrol stations.
- `L04.png`: actual `ArmView` geometry from Mission 4 review candidate
  `0136571` (PR #6). Its initial `parcel-across` state shows the pickup, guard and
  receiving tray. PR #6 subsequently landed as `6a2b516` and was integrated into
  this branch. Availability comes from the lesson registry, independently of
  the image; the four model missions are now playable.
- The 16 SVG files are original schematic concepts for the remaining missions,
  authored in `scripts/generate-curriculum-diagrams.mjs`. They are explicitly
  labeled as planned concepts in the curriculum and do not promise final geometry.

Regenerate diagrams from the repository root:

```sh
node scripts/generate-curriculum-diagrams.mjs
```

Capture scenes with a local Vite dev server for this branch, and optionally a
second local Vite dev server for the separate Mission 4 candidate:

```sh
PREVIEW_ORIGIN=http://127.0.0.1:5187 ARM_PREVIEW_ORIGIN=http://127.0.0.1:5188 node scripts/capture-curriculum-previews.mjs
```

Omit `ARM_PREVIEW_ORIGIN` to refresh only the searchlight captures. Inspect every
changed image at desktop and narrow sizes. The capture script uses blank local
pages and renderer modules, never account sessions, editor drafts or student data.
Illustrative poses are not evidence of a successful program or a learner pilot.

When a new scene lands, replace its concept asset, update the corresponding
`previews` entry in `src/curriculum-view.ts`, and record source/framing here.
Keep the job visible and avoid exposing solution code in a preview.
