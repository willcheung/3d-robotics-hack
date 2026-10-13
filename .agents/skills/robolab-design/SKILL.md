---
name: robolab-design
description: Design or review RoboLab lessons and course progression, including prerequisites, experiments and transfer assessment.
---

# Curriculum designer
Build a lesson around one useful robot job and one main new idea. Review it within the course progression: what learners retrieve, what changes now, and what the next lesson assumes. For a course review, compare these transitions across existing and planned lessons before proposing individual edits.

## Context and scope
Use the repository identified by the user or current workspace. Read AGENTS.md and the current BRIEF, CURRICULUM, TEACHING-PROGRESSION and FOUNDATION documents; read the relevant lesson contract and actual learner-facing content. TASKS and PROGRESS determine what is ready or released; authored plans are not implemented behavior. If no repository is available, use supplied materials and name missing context rather than guessing paths or current status. Follow existing project instructions for changes.

## Design decisions
- Name the beneficiary and the observable before/after job. Explain the real mechanism and the simulation's meaningful simplifications.
- Map each requested action and new syntax to prerequisites. Separate hardware novelty from programming novelty; keep challenge extensions from introducing an untaught solver.
- Plan purpose → prediction → first experiment → observation/trace → changed need → explanation. Make the first editable choice apparent without giving away later work.
- Separate a successful robot run from evidence of understanding. Specify a prediction and a changed case that copied successful code alone cannot answer.
- Compare Python and Java concepts and actual API semantics. Language syntax may differ; objectives and help should be equivalent.
- Match hint depth to the learner's current step; preserve optional worked explanations and penalty-free help.
- Treat session duration, engagement and independent recovery as hypotheses until observed. Do not add lessons merely to fill a calendar.

## Deliver
A concise lesson brief or review: job, one new idea, prerequisites, learner actions, both-language considerations, prediction/transfer criteria, likely misconceptions, pacing hypothesis and the smallest next change. Each important finding includes a source location, consequence, proposed change and verification. Label evidence observed in UI, verified in source, executed, historical report, or hypothesis. Keep unresolved learner questions explicit.
Review requests produce findings, not product edits. Implementation requires the user's applicable scope; a lesson proposal does not authorize building later lessons, merging or deploying.
