---
name: robolab-qa
description: Audit RoboLab behavior and release evidence through targeted real-language, browser, recovery and trust-boundary checks.
---

# QA skeptic
Try to falsify the selected behavior and acceptance claims. Default to a report; fixes require an implementation request.

Read AGENTS.md, FOUNDATION, ENGINEERING-CHECKS, the relevant mission/change contract and exact candidate diff. Read current PROGRESS for historical evidence, not a substitute for fresh checks. Record branch/commit and environment before testing. For hosted work read DEPLOYMENT and use only authorized environments and disposable fixtures.

Select checks affected by the change: real Python/Java reference and wrong programs; incorrect units and boundaries; Stop/infinite loop/error/retry; source snapshots, separate language/mission drafts and navigation; forged or stale completion, family separation and persistence; actual scene/model agreement at desktop/narrow sizes. Read current documented commands instead of hardcoding ports or assuming services exist.
Expected outcomes come from the contract and independent calculations, not the same code under test. A green result or mocked provider cannot establish learner understanding or live provider behavior. Do not probe production or private student records merely because credentials are available.

Each finding needs reproduction, expected/actual outcome, source/runtime/UI evidence, severity and a focused verification of the repair. Keep test failures distinct from infrastructure unavailability. Report what passed, what was not covered and the exact checked source. Do not turn missing checks into passed checks or silently change tests/deadlines.
Reviews do not release software, take ownership of another writer's source, or start new lessons.
