import {lessonTargets, lessonPrerequisites, targetLesson, targets, type LessonId} from './model.ts';
import {pythonStarter, javaStarter} from './starters.ts';
import {armLesson} from './arm-lesson.ts';
import {patrolLesson} from './patrol-lesson.ts';
export type Language = 'python' | 'java';
export const sensorPython = `# Job: recover the light so rescuers can find the crew.

# Import controls and the direction sensor; no hardware moves yet.
from robot import motor, servo, wait, angle

# Comparison value in degrees: the if below uses it to choose a branch.
# It is not a move-to command and does not move the crew’s target.
# The sensor reads -150..150 degrees; this variable has no API range check.
decision_angle = 60

# Servo target: 0..180 degrees, inclusive; 120 points 30 degrees up.
tilt = 120

# await pauses THIS program until a call returns.
# Reading angle returns the current direction (-150..150 degrees).
# It measures the last completed tick; it does not move the light.
reading = await angle()

# print shows the measurement; it needs no await and causes no motion.
print("Read:", reading, "degrees; decision angle:", decision_angle)

# The servo setting is accepted now; arrival needs wait below.
await servo(tilt)

# A comparison is true or false. if runs its indented branch when true.
# DEBUG CHALLENGE: is > the right comparison for a right turn?
# Change just the comparison, then test BOTH starting positions.
if reading > decision_angle:
    # Power -1..1 inclusive; +0.5 turns right at 30 degrees/second.
    await motor(0.5)

    # This message tells us which branch actually ran.
    print("Decision: turn right")
else:
    # else runs when the comparison is false. -0.5 turns left.
    await motor(-0.5)

    # Indentation puts this message inside the left-turn branch.
    print("Decision: turn left")

# Outside both branches: advance 50 whole ticks = 1 simulated second.
# wait accepts 1..600 whole ticks; both motor AND servo move during it.
# Power and this duration set the turn distance, not decision_angle.
# Each case starts 30 degrees from the crew’s fixed target.
await wait(50)

# Power 0 holds the turn still. Without it the rescue cannot complete.
await motor(0)

# Read AGAIN: the old reading variable does not update by itself.
# Check where the light actually stopped against the crew’s target.
# Round the display to a whole degree; the sensor/model keeps its precision.
print("Now:", round(await angle()), "degrees")`;
export const sensorJava = `// Job: recover the light so rescuers can find the crew.

// Main names this program; keep the class and main method below.
public class Main {

    // Java starts in main. throws Exception lets errors reach the console.
    public static void main(String[] args) throws Exception {

        // double stores decimals; = assigns; ; ends a statement.
        // Comparison value in degrees; if uses it to pick a branch.
        // Not a move-to command: the crew’s target stays fixed.
        // Sensor reads -150..150; this value has no API range check.
        double decisionAngle = 60;

        // Tilt: 0..180 degrees inclusive; 120 points 30 degrees up.
        double tilt = 120;

        // angle reads the last completed tick's direction (-150..150).
        // Java waits for the reply; no await keyword or motion is needed.
        double reading = Robot.angle();

        // + joins text and numbers. println displays the measured reading.
        System.out.println("Read: " + reading + " degrees; decision angle: " + decisionAngle);

        // Accept a servo setting now. Only waitTicks advances its movement.
        Robot.servo(tilt);

        // if tests true/false; braces group the commands for each branch.
        // DEBUG CHALLENGE: is > the right comparison for a right turn?
        // Change just the comparison, then test BOTH starting positions.
        if (reading > decisionAngle) {
            // Power -1..1 inclusive; +0.5 turns right at 30 degrees/second.
            Robot.motor(0.5);

            // Show which branch actually ran.
            System.out.println("Decision: turn right");
        } else { // Otherwise run the left-turn branch.
            // Negative power turns left; its size controls speed.
            Robot.motor(-0.5);

            // Show the other branch's decision.
            System.out.println("Decision: turn left");
        } // Both branches rejoin here.

        // 50 whole ticks = 1 simulated second. Allowed: 1..600 per call.
        // Both parts move; power and duration set the turn distance.
        // decisionAngle does not set the distance or stop the motor there.
        // Each case starts 30 degrees from the crew’s fixed target.
        Robot.waitTicks(50);

        // Power 0 holds the light still; a powered motor cannot complete.
        Robot.motor(0);

        // Read again: the old reading variable never updates by itself.
        // Check where the light actually stopped against the crew’s target.
        // Math.round displays a whole degree; it does not change the model.
        System.out.println("Now: " + Math.round(Robot.angle()) + " degrees");
    } // End main.
} // End Main.`;
export const sensorReference = {
  python: sensorPython.replace('if reading > decision_angle:', 'if reading < decision_angle:').replace('DEBUG CHALLENGE: is > the right comparison for a right turn?', 'WORKED STEP: a smaller reading needs a right turn.'),
  java: sensorJava.replace('if (reading > decisionAngle)', 'if (reading < decisionAngle)').replace('DEBUG CHALLENGE: is > the right comparison for a right turn?', 'WORKED STEP: a smaller reading needs a right turn.'),
};
export const sensorTransfer = {
  python: sensorReference.python.replace('decision_angle = 60', 'decision_angle = -60').replace('tilt = 120', 'tilt = 60'),
  java: sensorReference.java.replace('decisionAngle = 60', 'decisionAngle = -60').replace('tilt = 120', 'tilt = 60'),
};
export type Lesson = {
  id: LessonId; version: number; title: string; job: string; beneficiary: string;
  consequence: string; application: string; source: string; otherApplications: string;
  prerequisites: LessonId[]; conceptId: string; concept: string; recap: string; units: string;
  comments: string; hints: [string,string,string]; transfer: string;
  scenarios: readonly string[]; next: LessonId|null; transferTarget: string; transferReference: Record<Language,string>;
  starters: Record<Language,string>; reference: Record<Language,string>; wrong: Record<Language,string>;
};
export const lessons: Lesson[] = [
  {id:'L01',version:1,title:'Signal Station',job:'Light the stranded crew’s pickup point.',beneficiary:'Stranded hikers and the rescue team',consequence:'A stopped, settled beam marks the crew’s pickup point.',application:'A pan-and-tilt camera turns and tilts to see a doorway.',source:'https://learn.adafruit.com/mini-pan-tilt-kit-assembly?view=all',otherApplications:'Aim a stage spotlight or an inspection camera.',prerequisites:[],conceptId:'commands-values',concept:'Commands and named values',recap:'Code sends instructions to a motor and servo.',units:'Power −1..1; servo 0..180 degrees; wait 1..600 whole ticks, 0.02 s each.',comments:'Every executable starter line explains its purpose; await acknowledges a call, not arrival.',hints:['Watch where the first beam stops.','Half power turns 30 degrees each second.','Change turn_ticks from 50 to 100 for the north ridge.'],transfer:'Aim at the lower cove; explain how the turn direction and tilt change.',scenarios:lessonTargets.L01,next:'L02',transferTarget:'reverse',transferReference:{python:pythonStarter.replace('turn_ticks = 50','turn_ticks = 100').replace('servo(120)','servo(60)').replace('motor(0.5)','motor(-0.5)'),java:javaStarter.replace('turn_ticks = 50','turn_ticks = 100').replace('servo(120)','servo(60)').replace('motor(0.5)','motor(-0.5)')},starters:{python:pythonStarter,java:javaStarter},reference:{python:pythonStarter.replace('turn_ticks = 50','turn_ticks = 100'),java:javaStarter.replace('turn_ticks = 50','turn_ticks = 100')},wrong:{python:pythonStarter,java:javaStarter}},
  {id:'L02',version:1,title:'Read, then choose',job:'The searchlight was moved while the station was offline. Read its direction and recover the beam so rescuers can find the crew.',beneficiary:'The crew waiting for its pickup point to be lit again',consequence:'The beam reaches the crew and stays still after a correction from either side.',application:'An absolute position sensor can tell a robot controller where a rotating part is. Your program compares that measurement with a decision angle to choose a motor direction. The motor’s power and running time then determine how far it turns.',source:'https://docs.wpilib.org/en/stable/docs/software/hardware-apis/sensors/encoders-software.html',otherApplications:'A camera can turn toward a doorway from either side. A robot arm can choose which way to move a joint toward a shelf. Each needs its own calibration, limits and repeated feedback.',prerequisites:['L01'],conceptId:'sensor-conditional',concept:'One sensor reading and an if/else decision',recap:'Motor power picks direction and speed; the servo picks tilt. Only wait advances motion. The decision angle is a comparison value for choosing a branch. It does not command an arrival or change the crew’s target.',units:'angle returns −150..150 degrees inclusive, at the last completed tick; negative is left of zero. No arguments. Starts are 30 degrees from the crew’s fixed target. ±0.5 power for 50 ticks moves 30 degrees. Existing motor/servo/wait limits apply.',comments:'Distinguish the measured reading, comparison value, turn distance and fixed crew target; explain assignment versus comparison, true/false, branch grouping and a fresh sensor read in both languages.',hints:['Compare the LIGHT DIRECTION reading with the crew’s target. Which way would close the gap? Trace which branch your comparison selects.','A smaller reading needs a positive/right turn. A larger reading needs a negative/left turn. The starter has the comparison reversed.','Use a less-than comparison between reading and the decision angle in the if condition. Keep the positive motor call inside if and the negative call inside else; test 30° AND 90° starts.'],transfer:'A crew moves to the lower cove. Start at −30°, face −60° and tilt to 60°. Decide how to adapt the comparison value and tilt while keeping the same rule. Explain your prediction before testing negative directions.',scenarios:lessonTargets.L02,next:'L03',transferTarget:'sensor-transfer',transferReference:sensorTransfer,starters:{python:sensorPython,java:sensorJava},reference:sensorReference,wrong:{python:sensorPython,java:sensorJava}},
];
lessons.push(patrolLesson,armLesson);
export function validateLessons(items: Lesson[]) {
  const ids=new Set<string>();
  for(const l of items){
    if(ids.has(l.id))throw Error('Duplicate lesson ID');ids.add(l.id);
    if(!Number.isSafeInteger(l.version)||l.version<1)throw Error('Invalid lesson version');
    for(const k of ['id','title','job','beneficiary','consequence','application','source','otherApplications','conceptId','concept','recap','units','comments','transfer'] as const)if(typeof l[k]!=='string'||!l[k].trim())throw Error(`Missing lesson ${k}`);
    if(!Array.isArray(l.prerequisites)||!Array.isArray(l.hints)||l.hints.length!==3||l.hints.some(h=>!h?.trim()))throw Error('Missing prerequisites or three hints');
    if(!Array.isArray(l.scenarios)||!l.scenarios.length||l.scenarios.some(t=>!Object.hasOwn(targets,t)))throw Error('Invalid lesson scenarios');
    if(l.scenarios.some(t=>targetLesson(t)!==l.id))throw Error('Scenario belongs to another lesson');
    if(JSON.stringify(l.prerequisites)!==JSON.stringify(lessonPrerequisites[l.id]))throw Error('Unknown or cyclic prerequisites differ from checked progress');
    if(!l.scenarios.includes(l.transferTarget))throw Error('Missing transfer target');
    for(const kind of ['starters','reference','wrong','transferReference'] as const)for(const lang of ['python','java'] as const)if(!l[kind]?.[lang]?.trim())throw Error(`Missing ${kind} fixture`);
  }
  const visit=(id:string,path=new Set<string>())=>{if(path.has(id))throw Error('Cyclic lesson prerequisites');const l=items.find(l=>l.id===id);if(!l)throw Error('Unknown prerequisite');for(const p of l.prerequisites)visit(p,new Set([...path,id]));};
  for(const l of items){visit(l.id);if(l.next!==null&&!ids.has(l.next))throw Error('Unreleased next lesson');}
}
validateLessons(lessons);
export function getLesson(id: LessonId) { return lessons.find(l=>l.id===id)!; }
