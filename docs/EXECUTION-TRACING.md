# Execution tracing — TRACE-01

Authorized: live source highlighting, speed, Pause and Step for Python and Java in every playable mission (L01–L04). Base 763c5ac; branch codex/execution-tracing; ownership 1181109. Implementation and local verification only; no release authorization.

## Frozen behavior

Practice Run snapshots source. A runtime line event identifies the next executable source line; highlight it before allowing execution. Comments/blank lines are skipped. Repeated loop visits and only executed branch bodies appear; Python functions and Java methods retain their native semantics. One source line may contain several statements; Step is a source-line boundary, not an expression debugger.

Pause freezes line progression and model ticks, including halfway through wait. Step completes the currently highlighted line through its next source-line boundary, then stays paused. If paused during wait, Step completes the remainder of that line's wait before stopping at the next line. Highlight stays on the wait line throughout movement. Speed scales line dwell and wall-clock tick pacing; model dt stays 0.02 seconds, sensor sampling and success rules stay unchanged. No movement occurs during pure calculation/setter lines.

Normal speed: 80 ms line dwell and real-time ticks; slower settings increase dwell so learners can inspect decisions. Paused line means next to execute; running wait means executing. Stop/Reset/error/context change retire highlights and pending callbacks. Editing remains possible; changed drafts show an explicit snapshot warning and hide the highlight until the draft matches the running snapshot. No selection, focus or undo changes from highlighting.

Tracing is practice-only. Server checks execute original source with tracing disabled and retain existing score/isolation rules. Trace fields are untrusted, range/sequence/count bounded, and never update model state or award progress. Java uses JDI inside its existing sandbox; no debugger port is exposed outside it. Python uses native line tracing with Pyodide stack switching; browsers lacking that capability retain ordinary Run with a clear tracing-unavailable explanation. No silent fabricated trace.

Bound practice to five minutes of playback (including Pause), 20 seconds of runtime work outside host-controlled replies, 10,000 line events and existing source/output/robot-command limits. Compilation retains its independent 45-second limit. Hosted practice leases/capabilities and package deadlines must cover the bounded playback plus compilation/cleanup; score checks retain their existing deadlines.

## Acceptance

Real Python and Java: loop iteration order, taken/untaken branches, helper calls, sensor-dependent decisions; all four mission references produce identical final states/ticks across speeds and stepping. Pause during motion freezes every model value; one Step reaches exactly the next boundary, wait remains highlighted; Resume has no elapsed-time catch-up. Test Stop during Pause/loading/Step, syntax/runtime/range errors, trace/command bounds, malformed/stale events, rapid controls, draft/context changes and successful rerun. Inspect desktop/narrow screenshots and keyboard editing/focus. Account and official-check regressions remain required. Evidence distinguishes local tests, hosted/provider qualification and human learning.

## Teaching review before build

Design/critic/model source review: this makes L01 command→movement, L02 selected branch, L03 repeated stops and L04 coordinated joints inspectable without adding syntax or answers. Keep setter acceptance distinct from arrival, show wait during all concurrent motion, and describe source-line rather than statement stepping. Do not infer comprehension from a successful run. Student/teacher review after build is an informed synthetic walkthrough, not a classroom pilot. Future lessons use the shared runner automatically when released; this slice creates no new lesson.
