import {lessonTargets} from './model.ts';
import type {Lesson} from './lessons.ts';

export const patrolPython = `# Job: light each route checkpoint long enough for a ranger to log it.

# Import built-in functions. Each does one action; none knows the route.
from robot import motor, servo, wait, angle

# Whole repeat count, not an angle or a promise of checkpoints reached.
# Start with one repeat; predict which stations will still be waiting.
# range(0) or a negative count does nothing; a fraction causes an error.
repeats = 1

# Power -1..1 inclusive; decimals work. Positive is right, 0 stops.
power = 0.5

# Whole ticks of travel, 1..600 per wait. 50 ticks = 1 simulated second.
# Power and travel time together set the gap between stops.
travel_ticks = 100

# Tilt 0..180 degrees inclusive; 90 is level, 60 points 30 degrees down.
tilt = 90

# await pauses this program for a reply. This setting is accepted now;
# only wait advances movement, so acceptance does not mean arrival.
await servo(tilt)

# range(repeats) supplies 0, 1, ... stopping BEFORE repeats.
# The indented body repeats; checkpoint is a counter, not a sensor.
for checkpoint in range(repeats):
    # Call the motor function again at the beginning of each repeat.
    await motor(power)

    # Move both motor and servo for travel_ticks; then continue.
    await wait(travel_ticks)

    # Stop turning BEFORE holding the light on the checkpoint.
    await motor(0)

    # Hold 25 ticks = 0.5 seconds. wait still advances time at power 0.
    # Only a steady beam at the next checkpoint logs it; sweeping past fails.
    await wait(25)

    # Read the current direction (-150..150 degrees) on EVERY repeat.
    # +1 displays the counter starting at 1; print/round do not move hardware.
    print("Repeat", checkpoint + 1, "stopped at", round(await angle()), "degrees")

# Back at the left margin: this runs ONCE after all repeats, not inside them.
# A printed message cannot mark checkpoints complete; check the route panel.
print("Patrol program finished. Check which checkpoints were logged.")`;

export const patrolJava = `// Job: light each route checkpoint long enough for a ranger to log it.

// Main names the program. Keep this class around the main method.
public class Main {

    // Java starts here. throws Exception lets real errors reach the console.
    public static void main(String[] args) throws Exception {

        // int is a whole number. Repeat count is not an angle or a result.
        // Start with one repeat; predict which stations will still be waiting.
        // Zero/negative counts skip this loop; a fraction cannot be an int.
        int repeats = 1;

        // double allows decimals; power -1..1 inclusive. Right is positive.
        double power = 0.5;

        // Whole travel ticks, 1..600 per wait. 50 ticks = 1 simulated second.
        // Power and travel time together set the gap between stops.
        int travelTicks = 100;

        // Tilt 0..180 degrees inclusive; 90 is level, 60 is 30 degrees down.
        double tilt = 90;

        // Built-in Robot methods do one action each; none knows the route.
        // Java waits for acceptance (no await keyword), not physical arrival.
        Robot.servo(tilt);

        // Start counter at 0; repeat while < repeats; ++ adds 1 after each body.
        // Braces group repeated calls. checkpoint counts repeats, not successes.
        for (int checkpoint = 0; checkpoint < repeats; checkpoint++) {
            // Set power again at the beginning of every repeat.
            Robot.motor(power);

            // Only waitTicks advances motion, including the tilting servo.
            Robot.waitTicks(travelTicks);

            // Stop turning BEFORE holding the beam steady.
            Robot.motor(0);

            // 25 ticks = 0.5 seconds. Time still advances at power 0.
            // Only a steady beam at the next checkpoint logs it; passing fails.
            Robot.waitTicks(25);

            // Fresh direction reading (-150..150 degrees) on EVERY repeat.
            // +1 displays from 1. Round/println format output; they never move parts.
            System.out.println("Repeat " + (checkpoint + 1) + " stopped at " + Math.round(Robot.angle()) + " degrees");
        } // End the repeated body.

        // Outside the loop: once after all repeats. Text cannot award checkpoints.
        System.out.println("Patrol program finished. Check which checkpoints were logged.");
    } // End main.
} // End Main.`;

export const patrolReference = {python:patrolPython.replace('repeats = 1','repeats = 3'),java:patrolJava.replace('repeats = 1','repeats = 3')};
export const patrolExtra = {python:patrolReference.python.replace('repeats = 3','repeats = 4').replace('travel_ticks = 100','travel_ticks = 75'),java:patrolReference.java.replace('repeats = 3','repeats = 4').replace('travelTicks = 100','travelTicks = 75')};
export const patrolTransfer = {python:patrolReference.python.replace('power = 0.5','power = -0.5').replace('tilt = 90','tilt = 60'),java:patrolReference.java.replace('power = 0.5','power = -0.5').replace('tilt = 90','tilt = 60')};

export const patrolLesson: Lesson = {
  id:'L03',version:1,title:'Ranger patrol',job:'After a storm, rangers need light at every route checkpoint. Repeat a move, stop and hold sequence so they can log each location before setting out.',beneficiary:'The ranger team preparing a rescue route',consequence:'Each numbered checkpoint lights and becomes logged after a steady hold. All checkpoints, in order, make the route ready.',
  application:'A pan-and-tilt inspection camera can tour preset views and dwell at each one. Your loop repeats the movement and pause; a real camera also needs calibrated positions, feedback and useful images.',source:'https://developer.axis.com/vapix/network-video/guard-tour-api/',otherApplications:'Repeat plant inspections in a greenhouse, or run a sequence of stage-light cues. Each job needs its own positions, timings and checks.',
  prerequisites:['L02'],conceptId:'counted-loop',concept:'Repeat built-in function calls with a counted for loop',recap:'Power sets direction and speed, servo sets tilt, wait advances time and angle reads the result. Those are built-in functions. Now the same group of calls runs more than once.',units:'25 consecutive ticks = 0.5 seconds of stopped, settled light within ±2° of the next checkpoint. Repeat count is a whole number used by the language, not a robot command. 0 or a negative count skips the loop; excessive work reaches the existing run limits.',comments:'Explain the loop counter, exclusive end, grouping, repeated calls, fresh readings and the once-only line after the loop. Separate every explanation/code group with a blank line.',
  hints:['Run one repeat. Which checkpoint is logged, and which are still waiting? Compare the counter in the console with the route panel.','Repeat count decides how many times the body runs. Power and travel ticks decide where each repeat stops. The hold wait must stay inside the loop after motor(0).','For Ridge sweep, repeat the body three times: range(3) uses 0, 1, 2; Java uses checkpoint < 3. Keep the stop and hold inside the body. Then predict how a fourth, closer checkpoint changes count and travel time.'],
  transfer:'Cove return starts at +90°. Log +30°, −30°, then −90°, with tilt 60°. Keep the loop and hold. Predict which direction and tilt settings must change; explain why changing repeat count alone cannot fix them.',
  scenarios:lessonTargets.L03,next:'L04',transferTarget:'patrol-cove',transferReference:patrolTransfer,starters:{python:patrolPython,java:patrolJava},reference:patrolReference,wrong:{python:patrolPython,java:patrolJava},
};
