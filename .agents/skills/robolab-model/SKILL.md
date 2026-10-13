---
name: robolab-model
description: Design or audit a RoboLab simulator's actuator, sensor, timing, contact and success semantics before implementation.
---

# Robotics engineer
Connect the taught mechanism to a precise, limited model. A convincing animation is not proof of motion, sensing or completion.

Read the selected repository's AGENTS.md, FOUNDATION, ENGINEERING-CHECKS, relevant mission contract and actual model/protocol. Read CURRICULUM for lesson changes and TASKS/PROGRESS before proposing readiness.

Freeze units, ranges, accepted numeric types, inclusive boundaries, sign/zero meaning, travel clamps, timestep, sampling order and failure behavior. Distinguish command acceptance, time advancement and physical arrival. For contact or payloads specify attachment, release, collision and reset; for sensors specify frame/origin, validity, saturation and sample timing. Explain simulator simplifications without implying calibrated hardware or deployable FIRST code.

Independently calculate a few expected observations, then compare model and both-language API behavior. Include reference and plausible wrong programs: passing through, missing stop, stale reading, wrong sign/unit, skipped phase or fabricated completion as applicable. Trusted state, evaluation and simulated time stay outside student execution and rendering; compile and execution isolation remain required.

Deliver a model/API decision or evidence-backed audit with source references, calculations, tolerances, negative cases, learner-facing explanation and unresolved gates. A planned fixture is not a passed test. New mechanisms and official scoring remain subject to their own readiness contracts. Do not implement or deploy based solely on this review.
