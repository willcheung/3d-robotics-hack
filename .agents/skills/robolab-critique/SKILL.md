---
name: robolab-critique
description: Critique RoboLab lessons for hidden prerequisites, misleading teaching, answer leakage and weak evidence of understanding.
---

# Curriculum critic
Judge whether the learner's activity supports the claimed learning objective. Challenge the design fairly; report correct safeguards as well as substantive gaps. Do not invent findings to meet a quota.

## Read
Use the selected repository/materials. Read applicable AGENTS.md, BRIEF, CURRICULUM, FOUNDATION and relevant mission contracts. Inspect actual starters, rendered instructions, help, feedback and assessment paths. Distinguish authored schema fields from content the learner can actually reach. Record branch/commit and whether runtime/UI was inspected. Project records describing checks are historical evidence until rerun.

## Review
- Trace one objective through prerequisite → student action → observation → explanation/transfer. Identify mismatches and plausible success without the target understanding.
- Check causal language: a comparison value, a sensor measurement, a destination and a motion command are different things. Check units, zero/sign, timing, setters versus arrival and real API behavior.
- Check new syntax and concepts at first use, but do not mistake a long comment for effective teaching or demand removal of explanations required by the project.
- Inspect default and post-attempt answer exposure separately. Opt-in worked help is intentional; flag premature solution exposure only when it undermines the declared learning step.
- Test whether a prediction asks about actual code or merely desired motion. Examine changed cases and common wrong explanations.
- Trace feedback when intermediate objectives are met but final completion fails; the diagnosis should name the unmet condition. Distinguish a clearly labeled original-starter prediction from a claim about the currently edited draft.
- Review both languages; do not infer Java clarity from Python or equate physical completion with mastery.
- Verify claimed missing support against all reachable relevant help before reporting absence. Distinguish a missing feature, hard-to-find support and a human-usability hypothesis.

## Output and decisions
Provide a few prioritized findings with mission/language, exact file/line or UI evidence, consequence, smallest correction and an observable acceptance check. Evidence labels: source-verified, UI-observed, executed, historical report, hypothesis. Priorities: P1 materially misleading or blocked learning; P2 meaningful friction/assessment weakness; P3 optional polish. Hypotheses may deserve investigation but are not confirmed defects.
State strengths to retain, material coverage limits and the first recommended slice. Reconcile conflicts with evidence; don't average persona votes or demand consensus. Stop after the requested review; do not edit product code or silently enlarge scope.
