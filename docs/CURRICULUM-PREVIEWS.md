# Curriculum mission previews

## Accepted direction and scope

The owner approved a full-row visual curriculum after reviewing a four-mission proposal. Implement the same preview section across all 16 core lessons and four optional extensions. Preserve the existing lesson order, prerequisites, separate language drafts, practice availability and trusted checked-completion rules. This is one presentation slice, CURRICULUM-01; it does not implement or release future missions.

Each row shows a large mission image, a concrete job and beneficiary, one learning takeaway, availability/progress and the existing open-mission action when playable. Use the actual model renderer for available scenes and clearly labeled concept diagrams for upcoming content. A concept diagram must depict the lesson's particular task, not imply that an unbuilt world is playable. Avoid code, numerical solutions and answer-bearing condition diagrams in the previews.

## Page and navigation

- Expand the curriculum into a wide, page-like dialog with a persistent Close control and chapter navigation. Retain native dialog focus containment, Escape and focus return to the curriculum opener; entering a lesson closes the curriculum and focuses its editor.
- Use one full-width row per lesson. Desktop places the image beside the brief; narrow screens put it above the brief. Preserve readable text, meaningful image alternatives and visible keyboard focus at 390 px and with enlarged text.
- Group consecutive lessons into Searchlight (L01–03), Robotic arm (L04–06), Rescue rover (R01–R04), Sensors & combined missions (C01 through C03), and Optional extensions (V01–F02). Chapter links scroll within the curriculum without changing the current lesson or replacing a draft.
- State that Missions 1–4 are playable after the landed Mission 4 integration. Derive playable counts/actions from the existing lesson registry so a later mission integration can update availability without another layout rewrite. Keep optional status distinct from coming soon and prerequisite-locked checked completion.
- A failed or blocked image must leave the mission title, purpose, skills, state and navigation usable. Static previews need no additional WebGL context or student runtime. Reserve image space and lazy-load below-the-fold assets.

## Preview inventory

| Lesson | Preview | Visible job / new idea |
| --- | --- | --- |
| L01 Signal Station | Real searchlight scene aimed at the ridge crew | Light the pickup point; values, motor power and servo tilt. |
| L02 Read, then choose | Real searchlight scene off target | Recover the light using a direction reading and one condition. |
| L03 Ranger patrol | Real searchlight scene with numbered checkpoints | Repeat move/stop/hold to inspect a route. |
| L04 Parcel Port | Real arm scene showing pickup, guard and receiving tray | Coordinate joints and a gripper to hand a parcel to a worker. |
| L05 A reusable handoff | Arm concept with two labeled receiving bays and repeated handoffs | Define an editable helper with a destination parameter. |
| L06 Adapt and debug | Existing-mechanism concept with a moved receiving tray | Compare the old and changed job; diagnose one cause. |
| R01 Deliver to the dock | Two-wheel rover, battery and destination dock | Coordinate wheel power for a delivery. |
| R01b Turn by measurement | Rover facing a side bay with a heading arc | Use fresh heading feedback to turn and stop. |
| R02 Stop where the person is | Rover, forward distance ray and marked clearance | Use distance feedback to stop with a gap. |
| R03 Make the delivery round | Rover route through numbered stations | Store and repeat route steps with a list/array. |
| R04 Fix a misleading reading | Rover stopped before an obstacle with a missing-reading indicator | Validate sensor data before moving. |
| C01 Stock the relief station | Docked rover, parcel and unloading arm | Coordinate stopped docking and arm handoff. |
| P01 Find the inspection strip | Downward rover sensor comparing dark floor and bright strip | Calibrate a brightness threshold. |
| P02 Read the supply label | Stationary parcel with labeled RGB samples and an unknown example | Classify readings, including ambiguity. |
| C02 Sort the relief supplies | Arm sorting labeled parcels into matching bays | Combine classification and handoff. |
| C03 Follow the route and dock | Marked route, obstacle and identified destination | Prioritize distance, light and color conditions. |
| V01 Find the inspection area | Robot-mounted camera and visible pixel grid | Inspect image rows, columns and regions. |
| V02 Dock beneath the marker | Rover, overhead marker, offset and stop position | Combine image position and distance. |
| F01 Bring the instrument home | Vertical capsule above a landing pad with descent/thrust arrows | Use thrust to slow descent before touchdown. |
| F02 Launch, measure, return | One-axis capsule with ascent, measurement band and return phases | Compose launch, measurement and gentle landing. |

## Asset and future-lesson contract

Keep assets original, local and independent of external services. Real screenshots come from the existing renderer with documented illustrative poses and synthetic content; they do not establish a successful student run or a learner pilot. Concept diagrams use readable labels and shape/text cues as well as color. Record the capture/generation procedure and asset provenance in the asset directory. Do not publish private accounts, editor contents, contact details or runtime receipts in images.

Every new mission slice includes its curriculum preview section as acceptance work: confirm the useful job/new takeaway, replace its concept with a screenshot of the actual model when available, check mobile framing and alternatives, and preserve coming-soon status until the lesson is genuinely playable. Reused mechanisms still need a view that communicates the changed task. Mission 4's screenshot was captured from its separately committed candidate; after PR #6 landed, this branch integrated the landed source and its registry now makes Mission 4 playable. There are four model screenshots and 16 concept diagrams. Short opt-in motion previews are a possible later enhancement, not part of this slice.

## Verification and evidence boundaries

Browser checks cover all 20 rows/assets, accurate playable/optional states, chapter navigation, Escape/focus return, opening each released mission without losing either language's draft, narrow layout and image failure. Existing family fixtures cover locked/unlocked/completed states; no preview can award a badge. Inspect representative desktop/narrow screenshots and all concept artwork. Run TypeScript/production build, the affected lesson/navigation/family suites and publication checks. No model/runtime semantics, authentication, cloud stores or providers change here, and the separately authorized release added fresh provider and public acceptance; see PROGRESS.md for the evidence and limits.

Design/critique review: keep the useful result visually first, distinguish the repeated searchlight missions, show each future lesson's one new demand, and keep learning outcomes separate from completion. Student/teacher checks are synthetic interface walkthroughs only: identify a mission's job, find its entry action, recognize upcoming content, and return to an existing draft. Actual teen engagement and classroom pacing remain unmeasured.
