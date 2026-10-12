# Research notes

Reviewed October 11, 2026. Sources describe current capabilities; delivery recommendations below are our judgment. No products were purchased or installed, and no code/assets were imported.

## Existing learning and simulation tools

| Tool | Verified relevance | How it informs this project |
| --- | --- | --- |
| [VEXcode VR](https://www.vexrobotics.com/vexcode/vr) | Browser virtual robots, Python in some offerings, multiple playgrounds and competition activities | Strong benchmark for visible code-controlled behavior. Our build should justify itself through tailored Java/Python lessons, AI learning, and the family experience. |
| [VEX Python curriculum](https://education.vex.com/stemlabs/cs/cs-level-1-vexcode-vr-python) | A progression through movement, repeated behavior, sensors, decisions, and algorithms | Confirms that robot challenges can carry foundational concepts. Create original lessons and challenges; do not copy the course. |
| [Firia Labs Virtual Robotics](https://firialabs.com/pages/virtual-robotics) | Simulated CodeBot, Python missions without hardware, hints and automatic objective validation | Particularly close to the proposed tutorial loop. Useful benchmark for a first-run experience and objective checks. |
| [Webots](https://github.com/cyberbotics/webots) | Open-source robot modeling/programming/simulation environment; Apache-2.0 repository and online simulation examples | Useful future reference for richer robot models. A custom small browser teaching model is the initial recommendation so content, resets, and grading remain tightly controlled. |
| [virtual_robot](https://github.com/Beta8397/virtual_robot) | Desktop JavaFX 2D FTC learning simulator with an approximation of the FTC SDK | Useful competition bridge/reference if she is in FTC. It is not the proposed browser 3D lesson UI. Examine licensing before reusing anything. |

Robotify was also considered, but its current product page could not be fetched during this research; no feature or pricing claim here relies on it. We did not establish a comprehensive feature gap across every commercial product.

## FIRST alignment

[FIRST](https://www.firstinspires.org/) runs distinct programs including FIRST Tech Challenge and FIRST Robotics Competition; we need the target program before claiming SDK alignment.

[FTC's official programming resources](https://www.firstinspires.org/resources/library/ftc/programming-resources) list Blocks, browser-based OnBot Java, and Android Studio Java workflows. Python should not be presented as an interchangeable official FTC controller path based on that page.

[WPILib's FRC Python documentation](https://docs.wpilib.org/en/stable/docs/software/python/index.html) includes RobotPy setup and deployment. The site's [FRC documentation](https://docs.wpilib.org/en/stable/index.html) is the appropriate future reference if she is in FRC.

Recommendation: teach transferable programming in both languages with our simulator API, then add a clearly labeled FTC or FRC bridge. Real robots still need hardware-specific configuration, timing, testing, and team review.

## Building blocks and constraints

- [Three.js](https://threejs.org/): web 3D rendering library. Proposed foundation for original procedural robot models.
- [Monaco Editor](https://github.com/microsoft/monaco-editor): browser code editor, MIT repository. Syntax editing does not supply Python/Java execution; runtimes remain separate.
- [Pyodide workers](https://pyodide.org/en/stable/usage/webworker.html): executing Python in a separate worker avoids blocking the UI. [Interrupt documentation](https://pyodide.org/en/stable/usage/keyboard-interrupts.html) describes interruption facilities. We must still demonstrate hard-stop fallback and security isolation.
- [CheerpJ overview](https://cheerpj.com/docs/overview): a browser JVM supporting Java applications and Java/JavaScript interoperability, operating on bytecode. It does not by itself establish our editable source-to-runtime pipeline. [Licensing](https://cheerpj.com/docs/licensing) must be reviewed for the intended use before adoption.
- [Rapier determinism](https://rapier.rs/docs/user_guides/javascript/determinism/): its JavaScript/WASM simulation can be deterministic with the same version, initial conditions, and construction order. External initialization math can break that property. A fixed timestep alone does not guarantee equivalent results.
- [URDF loaders](https://github.com/gkjohnson/urdf-loaders): open-source loaders for Three.js and Unity. Consider later for articulated robot imports; rendering a URDF is not a complete physics or motor-control simulation.

Research supports a custom teaching experience assembled from reusable components. Runtime, security, performance, Java licensing, and learning outcomes still require prototypes and tests; they were not established by reading documentation.

## Language and kickoff guidance

[ROS 2 maintains a Python client library](https://github.com/ros2/rclpy) and a [C++ client library](https://github.com/ros2/rclcpp). Recommendation: Python is a strong starting point for broad robotics/software experimentation; C++ is a later companion for lower-level and performance-sensitive work. Java remains relevant to FIRST/team workflows. This is a learning-path recommendation, not a prediction that one language will dominate all future robotics.

[Official goal guidance](https://learn.chatgpt.com/use-cases/follow-goals) describes `/goal` as a durable objective with a verifiable stopping condition. Use it for the bounded first build in GOAL.md, not an endless request to complete the whole backlog. Writing GOAL.md does not itself enable or start the app's goal mode.

[Official model guidance](https://learn.chatgpt.com/docs/models) describes Astra as the most capable option for demanding workflows and GPT-6.1 Sol as a lower-cost choice for repeated long-running work. Extra High effort is reasonable for the initial combined runtime/simulation milestone; lower effort or Sol can be evaluated for later well-scoped tasks. Availability and controls depend on account/client; no model setting was changed during planning.

## Vercel hosting

Added October 11, 2026. [Vercel environments](https://vercel.com/docs/deployments/environments) document generated preview URLs and separate production workflows; a new project's first deployment is production. [Project configuration](https://vercel.com/docs/project-configuration) supports repository-defined build/output/routing/headers. [Functions limits](https://vercel.com/docs/functions/limitations) require bounded application workloads. [Vercel Sandbox](https://vercel.com/docs/sandbox) offers isolated microVM execution and is a candidate for the later Java/authoritative runner, subject to actual isolation/protocol/toolchain/cost checks.

Recommendation: Vercel for the browser workshop and bounded app APIs, browser Python for the first preview, and a proven separate execution boundary for Java/scoring. Do not execute student code inside credential-bearing app handlers. See DEPLOYMENT.md; no account access or deployment was established by this research.
