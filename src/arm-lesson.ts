import type {Lesson} from './lessons.ts';
import {lessonTargets} from './model.ts';
export const armPython = `# Job: carry a parcel over the guard to the dispatch worker's tray.

# These built-in calls control three parts and read a payload sensor.
from robot import shoulder, elbow, grip, wait, holding, elbow_angle

# FIRST EXPERIMENT: ticks to lift before turning (1..600 whole ticks).
# A setting is not arrival. Is this enough time to clear the guard?
lift_ticks = 10

# Shoulder destination: 0..180 degrees, inclusive; decimals work.
# 0 faces right, 90 faces the guard, 180 faces left. This does not move the tray.
destination = 150

# Elbow: 0..90 degrees above horizontal. Lower to the pickup at 0.
await elbow(0)

# 40 ticks = 0.8 seconds. All commanded parts move during a wait.
await wait(40)

# Jaw gap: 0..100 millimetres. 0 closes; 100 opens. No motion yet.
await grip(0)

# 25 ticks = 0.5 seconds. A real grasp stops these jaws at 40 mm.
await wait(25)

# A fresh sensor returns 1 if carrying, 0 if empty. Printing does not move it.
print("After closing, holding:", await holding())

# Lift target: 70 degrees. Actual elbow moves at 45 degrees per second.
await elbow(70)

# Give the lift time BEFORE the shoulder turns. Edit lift_ticks above.
await wait(lift_ticks)

# Read actual elbow, not the requested target. This read takes no ticks.
print("Before turn, elbow:", await elbow_angle())

# Shoulder turns toward destination at 90 degrees/second; it needs time.
await shoulder(destination)

# 70 ticks = 1.4 seconds, enough for this case's shoulder travel.
await wait(70)

# Lower the parcel at the destination only after the turn has arrived.
await elbow(0)

# 80 ticks = 1.6 seconds lets this downward elbow move settle.
await wait(80)

# Open the jaws at the tray. Holding above it is not a delivery.
await grip(100)

# Wait for the opening, then read again: released cargo is no longer held.
await wait(25)

# The tray and model check delivery separately; holding 0 can also mean a drop.
print("After opening, holding:", await holding())`;
export const armJava = `// Job: carry a parcel over the guard to the dispatch worker's tray.

// Main is this program's class; keep the enclosing structure.
public class Main {

    // Java starts here; throws Exception lets robot errors reach the console.
    public static void main(String[] args) throws Exception {

        // FIRST EXPERIMENT: int stores whole ticks; waitTicks accepts 1..600.
        // A setting is not arrival. Is this enough time to clear the guard?
        int lift_ticks = 10;

        // Shoulder destination: 0..180 degrees inclusive; double allows decimals.
        // 0 faces right, 90 the guard, 180 left. This does not move the tray.
        double destination = 150;

        // Elbow: 0..90 degrees above horizontal. Lower to pickup at 0.
        Robot.elbow(0);

        // 40 ticks = 0.8 seconds. All commanded parts move during waitTicks.
        Robot.waitTicks(40);

        // Jaw gap: 0..100 millimetres. 0 closes; 100 opens. No motion yet.
        Robot.grip(0);

        // 25 ticks = 0.5 seconds. A real grasp stops these jaws at 40 mm.
        Robot.waitTicks(25);

        // Fresh sensor: 1 means carrying, 0 empty. + joins text and the reading.
        System.out.println("After closing, holding: " + Robot.holding());

        // Lift target: 70 degrees. Actual elbow moves at 45 degrees/second.
        Robot.elbow(70);

        // Give the lift time BEFORE turning. Edit lift_ticks above.
        Robot.waitTicks(lift_ticks);

        // Read actual elbow, not the target; this call advances no time.
        System.out.println("Before turn, elbow: " + Robot.elbowAngle());

        // Shoulder sets an angle, not power; it moves at 90 degrees/second.
        Robot.shoulder(destination);

        // 70 ticks = 1.4 seconds, enough for this case's shoulder travel.
        Robot.waitTicks(70);

        // Lower at the destination only after the shoulder arrives.
        Robot.elbow(0);

        // 80 ticks = 1.6 seconds lets the downward elbow move settle.
        Robot.waitTicks(80);

        // Open at the tray; carrying above it is not delivery.
        Robot.grip(100);

        // Wait for the opening, then read again. There is no await in Java.
        Robot.waitTicks(25);

        // Released cargo is not held; the tray checks delivery separately.
        System.out.println("After opening, holding: " + Robot.holding());
    } // End main: all calls above run in order once.
} // End Main.`;
export const armReference={python:armPython.replace('lift_ticks = 10','lift_ticks = 80'),java:armJava.replace('lift_ticks = 10','lift_ticks = 80')};
export const armMoved={python:armReference.python.replace('destination = 150','destination = 135'),java:armReference.java.replace('destination = 150','destination = 135')};
export const armTransfer={python:armReference.python.replace('destination = 150','destination = 30'),java:armReference.java.replace('destination = 150','destination = 30')};
export const armLesson:Lesson={
 id:'L04',version:1,title:'Parcel Port',job:'Pick up a parcel, carry it clear of the guard, then release it in the dispatch worker’s tray.',beneficiary:'A dispatch worker waiting for a parcel',consequence:'The actual parcel leaves its pickup pad and rests in the receiving tray after release.',
 application:'A servo accepts a position setting. A sorting arm coordinates separate joints and a gripper; a real controller must check motion and payload feedback before the next action.',source:'https://docs.wpilib.org/en/stable/docs/software/hardware-apis/motors/servos.html',otherApplications:'An assembly arm can lift a part past a fixture before placing it on a workbench.',
 prerequisites:['L03'],conceptId:'arm-sequence',concept:'Coordinate three actuators in a safe sequence',recap:'Mission 1: a setting needs time to arrive. Mission 2: read a sensor again for new information. Mission 3: order and waits matter within a sequence. This time the hardware changes, not the programming syntax.',
 units:'Shoulder 0..180°, 90°/s; elbow 0..90° above horizontal, 45°/s; jaw gap 0..100 mm, 200 mm/s; finite decimal settings allowed. Wait 1..600 whole ticks, 50/s. Holding reads 0 or 1, not completion.',comments:'Explain each executable line; distinguish actual from target, arrival from acknowledgement and empty closure from holding. Keep blank lines between commented groups in both languages.',
 hints:['Watch the actual ELBOW value when the turn begins. Has the lift arrived, or are both joints moving together?','Only wait advances motion. The elbow needs time to move from 0° toward 70° at 45° per second before crossing the guard. There are 50 ticks in one second.','Try lift_ticks = 80: 80 ticks is 1.6 seconds, enough for 70° at 45°/second. Keep the lift wait before the shoulder call. Compare the new run with your prediction.'],
 transfer:'The receiving tray moves to 135°, then a return delivery starts at 150° and needs the 30° tray. Adapt the destination using the pose cards. Explain why the lift and grasp still come before the turn, and why a closed empty gripper or an early opening cannot deliver.',
 scenarios:lessonTargets.L04,next:null,transferTarget:'parcel-return',transferReference:armTransfer,starters:{python:armPython,java:armJava},reference:armReference,wrong:{python:armPython,java:armJava},
};
