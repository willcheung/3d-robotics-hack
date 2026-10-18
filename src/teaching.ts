import {getLesson, type Language} from './lessons.ts';
import {targets,patrols, PATROL_DWELL, type LessonId, type State} from './model.ts';
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const guides={
  L01:{retrieve:'Start here: motor sets power, servo sets tilt, and wait gives them time to move.',predict:'For the code in your editor, where will the beam stop? What will changing the wait do?',reflect:'What did you change, what moved, and why? For a faster motor, would you wait longer or less?',bridge:'Next: the light will start from different directions. A fixed turn may no longer help.',solution:'For the north ridge at half power, 50 ticks turns 30°. Doubling to 100 ticks turns 60°. Stop with motor(0). East lookout needs a longer turn; the cove needs a left turn and lower tilt. Explain each change before testing.'},
  L02:{retrieve:'Recall Mission 1: power and wait set the turn distance. A comparison chooses which commands run.',predict:'Read your current if condition. Which branch will run from this start, and where will the beam stop?',reflect:'Compare Read, Decision and Now. Why did that branch run? Would the same code work from the other side?',bridge:'Next: repeat a sequence. A stored reading stays old unless your code reads the sensor again.',solution:'The working condition tests reading < decision angle. At 30° it selects +0.5; at 90° it selects −0.5. Both move 30° in 50 ticks, then stop. For the cove, change the comparison value to −60 and tilt to 60. The comparison selects a branch; power and time set distance.'},
  L04:{retrieve:'Recall: setters need time (Mission 1), fresh readings show actual state (Mission 2), and order matters (Mission 3). Now coordinate a shoulder, elbow and gripper.',predict:'Trace your current calls: what is the actual elbow angle before the turn? When will the parcel attach and release?',reflect:'What did the elbow reading and parcel state show? Explain why you wait before turning, and how the moved tray changes your code.',bridge:'Next: give this familiar handoff sequence a reusable name and destination parameter. Mission 5 is planned, not playable yet.',solution:'The reference lowers to the pickup, waits 40 ticks, closes and waits 25. Lift to 70° and wait 80 ticks (1.6 seconds at 45°/second), then turn to the receiving shoulder and wait 70. Lower and wait 80, open to 100 mm and wait 25. Use destination 135 for the moved tray or 30 for the return. Holding should read 1 after closing and 0 after release; the tray confirms delivery.'},
  L03:{retrieve:'Recall: only wait advances motion. Read a sensor again to measure the new position; a counter is not a sensor.',predict:'Trace your current loop: how many repeats, which stopping angles, and which checkpoints will actually log?',reflect:'Compare printed repeats with logged checkpoints. What ran each time and what ran once? Explain your next change.',bridge:'Next: order familiar actions on an arm, then give that sequence a reusable name and parameter.',solution:'Ridge sweep uses three repeats of +0.5 power for 100 ticks, motor(0), then wait(25). Extra checkpoint uses four repeats with 75 travel ticks. Cove return uses three repeats/100 ticks, −0.5 power and tilt 60°. The stop and hold stay inside the loop.'},
};
export function renderTeaching(lesson:LessonId, language:Language) {
  const guide=guides[lesson], info=getLesson(lesson);
  const solution=language==='java'?guide.solution.replaceAll('motor(', 'Robot.motor(').replaceAll('wait(', 'Robot.waitTicks('):guide.solution;
  el('next-edit').textContent=({L01:'Change turn_ticks.',L02:'Trace the if comparison.',L03:'Change repeats.',L04:'Test lift_ticks.'})[lesson];
  el('predict-prompt').textContent=({L01:'Where will this code stop the beam?',L02:'Which branch will run from this start?',L03:'Which checkpoints will this loop reach?',L04:'Will the elbow finish lifting before the turn?'})[lesson];
  el('reflect-prompt').textContent=({L01:'Why did the beam stop there?',L02:'Why did that branch run?',L03:'Which calls ran on every repeat?',L04:'Why must the lift finish before the turn?'})[lesson];
  el('hints-content').innerHTML=`<p>${guide.retrieve}</p><p class="hint-context">Original example · hints are free. Reveal more only when you need it.</p><div class="hint-card"><div id="hint-step" aria-live="polite"><h3 id="hint-level"></h3><p id="hint-text"></p></div><div id="solution-explanation" hidden><h3>One working approach · original example</h3><p></p></div><div class="hint-actions"><button id="previous-hint" disabled>Previous hint</button><button id="next-hint">More help →</button><button id="show-solution" hidden disabled>Show worked example</button></div><p id="worked-availability" hidden>Try a run first to unlock the worked example. Your draft stays.</p></div><details><summary>Try a changed job<b>+</b></summary><p>${info.transfer}</p><p>${guide.bridge}</p></details><a href="#code-panel">Return to code ↑</a>`;
  let hintIndex=0, worked=false;
  const renderHint=()=>{
    el('hint-step').hidden=worked;el('solution-explanation').hidden=!worked;
    el('hint-level').textContent=`Hint ${hintIndex+1} of ${info.hints.length}`;
    const hint=info.hints[hintIndex];
    el('hint-text').textContent=language==='java'?hint.replaceAll('range(3) uses 0, 1, 2; Java uses checkpoint < 3','checkpoint < 3 visits counters 0, 1, 2'):hint;
    el<HTMLButtonElement>('previous-hint').disabled=!worked&&hintIndex===0;
    el('previous-hint').textContent=worked?'Back to hints':'Previous hint';
    el('next-hint').hidden=worked||hintIndex===info.hints.length-1;
    el('show-solution').hidden=worked||hintIndex!==info.hints.length-1;
    el('worked-availability').hidden=worked||hintIndex!==info.hints.length-1||!el<HTMLButtonElement>('show-solution').disabled;
  };
  el('previous-hint').onclick=()=>{if(worked)worked=false;else hintIndex=Math.max(0,hintIndex-1);renderHint();if(hintIndex===0)el('next-hint').focus();};
  el('next-hint').onclick=()=>{hintIndex=Math.min(info.hints.length-1,hintIndex+1);renderHint();if(hintIndex===info.hints.length-1)el('previous-hint').focus();};
  el('show-solution').onclick=()=>{worked=true;renderHint();el('previous-hint').focus();};
  el('solution-explanation').querySelector('p')!.textContent=`${solution} Try the edits yourself; your draft stays.`;
  renderHint();

}
/** Feedback uses trusted model observations, never a counter printed by student code. */
export function patrolFailure(state:State, selected:string):{title:string;text:string} {
  const route=patrols[selected], visited=state.patrol?.visited??0;
  if(visited===route.angles.length)return {title:'All checkpoints logged. Check the final stop.',text:`${visited} of ${route.angles.length} logged, but the patrol must finish stopped at ${targets[selected].angle}° with settled tilt ${route.tilt}°. It ended at ${state.angle.toFixed(1)}°, tilt ${state.scanner.toFixed(1)}°, power ${state.power}. Check for an extra turn or a missing stop.`};
  const best=state.patrol?.bestDwell[visited]??0;
  return {title:'Some checkpoints still need light.',text:`${visited} of ${route.angles.length} logged. Next is ${route.angles[visited]}°. Longest stopped, settled hold there: ${best}/${PATROL_DWELL} ticks in this run. ${best>0?'The beam reached this checkpoint, but needs 25 consecutive hold ticks before moving on.':'Check travel time, direction and tilt, then stop and hold inside the loop.'} A printed repeat or final angle alone cannot log a checkpoint.`};
}
