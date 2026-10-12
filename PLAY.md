# Signal Station: light the rescue pickup point

Open the local preview at **http://127.0.0.1:4173** on the computer running RoboLab. Start it with the commands in README.md. Take turns at the same keyboard; this preview has no accounts.

## Your mission

Two hikers are stranded on the north ridge. **Turn and tilt a searchlight onto them so the rescue team can find their pickup point.** The pointer is the light's direction dial, attached to its rotating base. Your numbers now have a job: point the beam where people need it.

The diagram labels **1 · MOTOR** at the circular base and **2 · SERVO** at the lamp's side joint. Follow their lines to the parts:

- `motor(power)` turns the whole tower and direction pointer left or right.
- `servo(degrees)` tilts the lamp up or down.
- `wait(ticks)` lets both movements advance; `motor(0)` stops the turn.

The first crew is at **60°**. Set the tilt servo to **120°** (30° above level) to reach their height. Before running, predict whether 50 ticks will turn far enough.

1. Press **Run code**. The example turns only **30°**. The beam misses, and the crew stays “waiting for light.”
2. Find `turn_ticks = 50`. Change only the number. At half power, the light turns 30° in one second; 50 ticks is one second.
3. Run again. Both axes must finish within 2° of their targets, with the motor stopped and servo settled. The crew's platform lights up, and “Crew located. Pickup point lit!” tells you rescuers can see where to go. Locating the crew is the job; the game does not simulate the rescue journey.
4. Explain to your co-pilot what the machine did for the hikers and why your timing helped. If you double the ticks again, would the beam stay on them?

<details><summary>A hint when you need it</summary>

For the first crew, try `turn_ticks = 100`. The motor turns for two simulated seconds at half power. Keep `await motor(0)` so the light holds still.

</details>

## How would I use this with real life machines / robots?

Imagine a camera that can turn toward a doorway and tilt to see who is there. Those two movements are called **pan and tilt**. Your searchlight uses the same arrangement: the base turns sideways, and the head moves up or down. A real controller would command the device's motors and check its position.

See [Adafruit's real pan-and-tilt mechanism](https://learn.adafruit.com/mini-pan-tilt-kit-assembly?view=all). That kit uses two positional servos; our turn axis uses a simplified timed motor to teach power and duration. Its hardware driver code and measured speeds would differ. The game program is not directly deployable to a real camera or rescue light.

**Try the idea in a new setting:** a camera must look at a lower doorway. Which command changes its height? If your turn motor ran twice as fast, would you wait longer or less? Explain your prediction, then test that power/time relationship in the game.

## Two more crews need help

- **East lookout:** a second crew waits farther right, at 90°. Keep the tilt at 120° and predict how much longer to turn at half power. Reference: 150 ticks.
- **Lower cove:** this crew is left and below the station. Use motor power `-0.5`, tilt servo `60` (30° below level), and 100 ticks to reach −60°. Explain why turning left alone cannot help if the beam still points uphill.

Selecting a crew resets the robot and keeps your code. Reaching a target is practice feedback; it does not establish concept mastery or an official score.

## Number ranges and errors

- `motor(power)`: any finite number from **−1 to 1, inclusive**. Negative turns left, positive turns right, zero stops. `0.5` is half power, not a target angle.
- `servo(degrees)`: any finite number from **0 to 180, inclusive**. 90° is level; 120° points 30° up and 60° points 30° down. This chooses a tilt position, not speed.
- `wait(ticks)`: **1 to 600 whole ticks per call**. A tick is a 0.02-second simulation step. 50 ticks = 1 simulated second; 100 = 2; 600 = 12. Only wait advances simulated movement.
- `turn_ticks = 50` saves a number in a variable. The robot checks the range when `wait(turn_ticks)` uses it. An invalid value such as `motor(2)`, `servo(200)`, `wait(0)` or `wait(2.5)` stops the run with an error. Fix the value and Run again; your draft stays.
- Valid commands can still miss the crew without a code error. Direction travel stops clamp at −150°/150°; those stops are different from invalid input ranges. A powered motor must still be stopped to complete the job.
- `angle()` reads the current direction, `round` changes displayed precision and `print` writes the console. None of these moves the machine.

## What comes next?

The **Next rescue** button becomes available after reaching a location. It keeps your code so you can adapt it for the next crew. Unique locations count once in “3 crew locations reached”; retries do not lose points. This count lasts for the current visit and resets on page reload; your saved code remains.

These are three practice rescues within Mission 1. After the lower cove, use the location selector to revisit unfinished rescues. The page states that more lessons are planned. Choose Python or Java above the editor; these are two languages for the same mission, not different lessons.

Future family mode uses separate attempts on the same challenge and shared results. Experiment history will help compare code changes without penalizing retries; official results will rank reliability, then simulated completion time. Persistent history, accounts and official scores are planned slices, not hidden features in this build.

## Controls

- The editor supports Tab to indent, Shift+Tab to unindent, Enter indentation, native undo/redo, and Escape then Tab to leave the editor. Comments beginning with `#` explain each executable starter line. The number guide is linked beside the editor.
- **Run code** starts a fresh Python worker and resets the mechanism before executing your draft. ⌘Enter or Ctrl+Enter also runs.
- **Stop** immediately ends the worker, including an infinite loop. The last observed pose and your draft remain.
- **Reset** stops the worker and returns the mechanism to zero, with the tilt servo at 90° (level). It keeps your code.
- **Restore example** stops the worker and replaces your draft with the original commented example.
- Drag the scene to orbit. Right-drag to pan. Scroll or use +/− to zoom. Top view and Reset camera only change your view. With the scene focused, arrow keys orbit, +/− zoom, and Home resets.
- Drafts save in this browser on this device, when storage is available. Copy important code elsewhere before clearing browser data.

## A tiny Python toolbox

`await` means **pause this program until this robot call returns**. The page can still respond. For `await motor(0.5)` and `await servo(120)`, the call returns when the setting is accepted; the parts have not moved yet. `await wait(50)` advances 50 simulation steps, letting both parts move, and returns when those steps finish. A shorter wait can leave the servo still approaching its target.

`await angle()` waits for the current sensor reading. Ordinary calculations, `round` and `print` do not need `await`. Our robot calls do: removing it is not a shortcut for running two movements together. The motor and servo already move together during `wait`.

```python
from robot import motor, servo, wait, angle, scanner, clock

await motor(0.5)  # Power: -1 to 1; negative turns counterclockwise
await servo(120)  # Tilt goal: 0 to 180 degrees; 90 is level
await wait(50)    # One simulated second, in 20 ms ticks
await motor(0)    # Stop the motor
print(await angle())   # Light direction, -150 to 150 degrees
print(await scanner()) # Tilt servo angle (legacy API name)
print(await clock())   # Simulated seconds since Run
```

Every robot call uses `await`, including sensors. Python variables, loops, functions and arithmetic execute for real. The motor turns at 60°/second at full power. The tilt servo moves toward its goal at 120°/second. **Only `wait` advances simulated time.** Each wait accepts 1–600 whole ticks. The model has travel stops, not general rigid-body physics.

## If something goes wrong

Read the console: Python syntax and runtime errors include `student.py` and a line number. An unknown name usually needs an import or corrected spelling. An invalid motor/servo/wait argument stops the run with the allowed range.

Long runs stop after 20 wall-clock seconds; loading has a separate 45-second deadline. Console output is limited to 8 KB, code to 16,000 characters, commands to 2,000, and simulated time to 30 seconds. Use Stop any time and Run again to get a clean runtime. `input()` and installing extra packages are not supported. If 3D is unavailable, the app explains WebGL requirements; angle readouts and Python remain usable.

This development preview runs real Python and Java for supervised local play. Java needs the isolated runner in JAVA.md. Accounts, live AI, official scoring and a hosted family-play link remain later gates. Actual child feedback and testing on the children's devices are still pending.

## Try the same robot in Java

Choose **Java** beside the file name. Read the comments in `Main.java`, then Run the unchanged example: it stops at 30°, short of the north ridge. Change `int turn_ticks = 50;` to `int turn_ticks = 100;` and Run again. The light reaches 60°, tilts to 120° and holds the crew's pickup point lit.

Java starts in the `main` method inside `class Main`. Keep the braces and semicolons. `Robot.motor`, `Robot.servo` and sensor calls wait for replies, so they use no `await`. Only `Robot.waitTicks` advances movement. Its `int` argument must be a whole number; invalid types fail during compilation. Out-of-range command values stop execution. The console shows the actual `Main.java` line for compiler or runtime errors.

Switch back to Python: its draft is still there. Switching stops the current run and resets the robot, while crew completion in this visit stays. Restore example affects only the selected language. Run starts fresh; Stop and errors never erase your draft or earn a completion. Try the east lookout and lower cove in either language.

If Java is unavailable, keep the draft and try Python; the workshop owner can follow [Java setup](docs/JAVA.md). No student installation is needed when using a workshop with its runner already started.
