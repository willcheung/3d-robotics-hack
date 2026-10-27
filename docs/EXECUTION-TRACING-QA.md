# TRACE-01 verification

Review candidate on `codex/execution-tracing`, base `763c5ac`, ownership `1181109`. Exact tested implementation commit is recorded in PROGRESS.md after validation. No deployment or hosted-provider claim.

## Local evidence

- Native Python monitoring/stack switching and JDI line breakpoints/method returns drive the same playback gate. The robot model is unchanged; fixed ticks and sensor replies remain outside student execution.
- Eight mission/language references run at 2× and 0.5×, reach their targets and retain identical simulation time. Existing mission journeys exercise all twelve variations, wrong programs, errors, Stop/Reset and language/draft recovery.
- Real loop/branch fixtures step through both loop iterations in actual order and skip untaken bodies. Helpers restore the caller before a robot argument takes effect. The helper-return mismatch was reproduced independently in both real runtimes before repair.
- Pause in a moving wait freezes simulation time; Step completes only the remaining wait and stops before the following motor call. Speed changes, draft edits/restoration, Stop and rerun are exercised. A separately reproduced delayed-command race now gates setters and sensor replies too.
- An expensive-render regression reproduced 1,216 ms for 400 ms of model playback when render time accumulated per tick. The repaired presentation clock completes the same fixed ticks in about 476 ms while retaining Pause/Step behavior. A separate 80 ms render fixture reproduced input starvation in catch-up batches; the repaired clock yields browser tasks, and scheduled Pause/Stop now interrupt before completion; browser references and patrols are rechecked after this repair.
- Parser/runner tests reject invalid source positions, sequence IDs and overlapping/stale events without model changes. Work budgets exclude teaching waits but retain cumulative runtime work. Native unresponsive calls exercise the 20-second watchdog; the five-minute practice cap includes Pause.
- Unsupported-stack-switching fault injection runs real Python without tracing, releases a pre-load Pause and resets slow speed to 1×. This is fault-injected Chromium evidence, not a Safari/Firefox device pilot.
- Standard account checks retain immutable source, private family separation, canonical scoring/unlocks, cancellation, saved-work conflicts and atomic service caps. Longer practice leases do not free a still-running practice slot; score-check leases remain unchanged.
- All four local package configurations validate routing, streaming flags, origin/CSP boundaries, immutable debugger assets and license notices. No provider credentials or paid runs are used.

Final command counts/results and remaining gates are recorded in PROGRESS.md. A passing mock account projection is not evidence of scored progression; the disposable family suite runs the actual isolated check adapters.

## Inspected synthetic visuals and informed teaching review

Inspected 1440-pixel Python/Java and 390-pixel narrow captures. The current row is visible behind readable syntax colors, source line numbers align after auto-scroll, controls fit without horizontal overflow and keyboard focus can leave the native editor. Highlight painting does not change selection or source.

The designer/critic/model lenses retained purpose-first lessons and setters-versus-motion semantics. An informed student/teacher walkthrough (the reviewer already knew implementation/reference programs) checked Run → Pause → Step → inspect robot → edit → Stop/retry and returning to saved contexts. The visible explanation distinguishes source-line stepping from stepping an expression and says wait advances motion. This supplies a way to trace L01 movement, L02 branch choice, L03 repeated checkpoint holds and L04 coordinated joints without exposing new solutions. It does not establish teen comprehension or class pacing.

![Python paused before the next motor command](images/tracing-python-desktop.png)
![Java paused before the next motor command](images/tracing-java-desktop.png)
![Narrow controls and auto-scrolled source highlight](images/tracing-narrow.png)

## Remaining qualification

- Unknown/late Sandbox.create resolution and failed cleanup remain provider-uncertainty boundaries. The gateway startup timer is not a proof of provider creation latency; lease arithmetic alone cannot establish cleanup.
- Actual hosted JDI launch inside bubblewrap/private loopback; protected Function streaming, replies, Pause/Step/Stop and cleanup on the new packaged deadlines. Existing provider evidence predates this debugger.
- Real non-Chromium/device acceptance. Python line controls require browser stack switching; ordinary Run is retained when unavailable. Java trace support is independent of that browser feature.
- Java multi-threaded programs: released lessons are single-threaded; JDI suspends all debuggee threads at source boundaries. No concurrent-language-debugger claim is made.
- A real learner explaining the relation between a highlighted wait, a powered motor, branch selection and loop repetition. Completion alone is not evidence of understanding.
