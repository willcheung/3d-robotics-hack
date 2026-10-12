export const pythonStarter = `# Job: hold the searchlight on the stranded crew.

# Import the robot controls and direction sensor.
from robot import motor, servo, wait, angle

# Store the waiting time: 1 to 600 whole ticks per wait.
# 1 tick = 0.02 simulated seconds; 50 ticks = 1 second.
turn_ticks = 50  # Try changing this number!

# await means: pause this program until the call returns.
# For motor/servo, that means the setting was accepted.
# It does NOT mean the moving part has reached its goal!
# SERVO at the lamp joint: tilt the head up or down.
# Set position: 0 to 180 degrees. 90 is level; 120 is 30 up.
await servo(120)

# MOTOR in the base: turn the tower and pointer left/right.
# Set power: -1 to 1. 0.5 is half power to the right.
await motor(0.5)

# Let BOTH the motor turn and the servo tilt for this long.
# await wait returns after these simulation steps finish.
# Only wait advances time; setting power/position does not.
await wait(turn_ticks)

# Set power to 0 so the light stops and holds still.
await motor(0)

# await angle() gets the current direction in degrees.
# round makes it a whole number; print shows it below.
# Neither round nor print needs await or moves the robot.
print("Direction:", round(await angle()), "degrees")`;
export const javaStarter = `// Job: hold the searchlight on the stranded crew.

// A class groups Java code. Keep this name Main (the file is
// Main.java).
public class Main {

    // Java starts here. static means no Main object is needed.
    // void means no value is returned; args holds startup text
    // (unused here).
    // throws Exception lets robot errors stop the run and
    // appear below.
    public static void main(String[] args)
            throws Exception {

        // int stores a whole number; = gives it a value; ;
        // ends the statement.
        // Allowed: 1 to 600 whole ticks per wait. 50 ticks = 1
        // simulated second.
        int turn_ticks = 50; // Try changing this number!

        // Robot is the supplied class of controls.
        // Java calls need no await.
        // Each call waits for its reply; motor/servo only
        // acknowledge a setting.
        // SERVO at the lamp joint: set tilt to 0..180 degrees
        // (inclusive).
        // 90 is level; 120 is 30 up. This does not wait for
        // arrival.
        Robot.servo(120);

        // MOTOR in the base: power -1..1. 0.5 turns right at
        // 30 degrees/second.
        Robot.motor(0.5);

        // Only waitTicks advances time: BOTH motor and servo
        // move during it.
        // This returns after all the ticks finish. 50 ticks =
        // 1 second.
        Robot.waitTicks(turn_ticks);

        // Power 0 stops the motor so the searchlight holds
        // still.
        Robot.motor(0);

        // angle reads direction. Math.round rounds it to a
        // whole degree.
        // + joins text and the number; println writes one
        // console line.
        // Reading, rounding and printing do not move the
        // robot.
        System.out.println("Direction: " +
                Math.round(Robot.angle()) + " degrees");
    } // End the main method.
} // End the Main class.`;
