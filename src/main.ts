import './style.css';
import { initialState, reached, targets, lessonIds, lessonTargets, targetLesson, draftKey, type LessonId, type State } from './model.ts';
import {missionAccess} from './progression.ts';
import { Runner, type RunStatus } from './runner.ts';
import { StationScene } from './scene.ts';
import { attachEditor } from './editor.ts';
import { attachHighlighting } from './highlighting.ts';
import { attachFamily } from './family.ts';
import { pythonStarter, javaStarter } from './starters.ts';
import {getLesson} from './lessons.ts';
import {armMissions,armUI,armLanguage,armProgress,armFailure} from './arm-ui.ts';
import {patrolMissions, patrolUI, patrolProgress} from './patrol-ui.ts';
import {readExperiment, type Experiment} from './experiment.ts';
import {renderTeaching, patrolFailure} from './teaching.ts';
type Language = 'python' | 'java';
let lesson: LessonId = 'L01';
let checked:readonly string[] = [];
let signedIn = false, checkActive = false;
const access=(id=lesson)=>missionAccess(id,checked);
const locked=()=>!!access().required;
let starters = getLesson(lesson).starters;
const missions: Record<string, { location: string; job: string; waiting: string; found: string }> = {
  beacon: { location: 'North ridge', job: 'Two hikers are stranded on the north ridge. Aim and hold the searchlight on them so the rescue team can find their pickup point.', waiting: 'North ridge crew · waiting for light', found: 'North ridge crew located · pickup point lit' },
  farther: { location: 'East lookout', job: 'A second crew is waiting at the east lookout. Turn the same searchlight farther to mark their pickup point for the rescue team.', waiting: 'East lookout crew · waiting for light', found: 'East lookout crew located · pickup point lit' },
  reverse: { location: 'Lower cove', job: 'This crew is below the station, in the lower cove. Turn left and tilt the searchlight down to show the rescue team where they are.', waiting: 'Lower cove crew · waiting for light', found: 'Lower cove crew located · pickup point lit' },
};
Object.assign(missions, {
  'sensor-left': {location:'Recover from 30°',job:'The light starts at 30°. Read its direction and choose a correction to reach the north ridge crew at 60°.',waiting:'North ridge crew · light needs recovery',found:'North ridge crew located · recovery from 30° complete'},
  'sensor-right': {location:'Recover from 90°',job:'Same crew, opposite starting side. Use the SAME program to recover from 90° to 60°.',waiting:'North ridge crew · light needs recovery',found:'North ridge crew located · recovery from 90° complete'},
  'sensor-transfer': {location:'Lower cove transfer',job:'A crew now waits below the station. Start at −30°, turn to −60° and tilt to 60°. Adapt the comparison value and tilt while keeping your decision rule.',waiting:'Lower cove crew · waiting for your adapted program',found:'Lower cove crew located · transfer rescue complete'},
});
Object.assign(missions,patrolMissions,armMissions);
const missionNumber=()=>Number(lesson.slice(1));
const icons = {
 play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m8 5 12 7-12 7z"/></svg>',
 stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
 reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/></svg>',
 cube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m12 3 9 5v9l-9 5-9-5V8zm0 10 9-5M3 8l9 5v9"/></svg>',
};
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<header class="header"><a class="brand" href="/" aria-label="RoboLab home"><span class="brand-mark">${icons.cube}</span>Robo<span>Lab</span></a><span class="preview-badge" id="language-badge"><span></span>Python · Mission 1</span><a class="help-link" href="#play-guide">Help <span>↓</span></a></header>
<main>
<div class="workspace-heading"><div class="intro"><div><div class="eyebrow">MISSION 01 <span>/</span> NUMBERS → MOVEMENT</div><h1>Signal Station<span>.</span></h1></div></div>
<nav class="lesson-picker" aria-label="Choose a challenge"><label class="target-select"><span id="target-label">WHERE IS THE CREW?</span><select id="target" aria-label="Challenge target"><option value="beacon">01 · North ridge / 60°</option><option value="farther">02 · East lookout / 90°</option><option value="reverse">03 · Lower cove / −60°</option></select></label></nav></div>
<section id="mission-access" class="mission-access" aria-labelledby="preview-title" hidden><div><strong id="preview-title" tabindex="-1">Read-only preview</strong><p id="unlock-help"></p></div><button id="return-mission"></button></section>
<section class="practice-nav" aria-label="Practice progress"><strong id="practice-current">Practice · Rescue 1 of 3</strong><div id="practice-badges" class="practice-badges" aria-label="Challenge status"></div><p id="practice-progress">0 of 3 completed this visit</p><p id="checked-progress" hidden></p></section>
<section class="mission-card" aria-label="Your mission"><div class="mission-copy"><h2>Put the stranded crew in the light</h2><p id="mission-job">${missions.beacon.job}</p><p class="mission-instruction">Turn to <strong id="goal-angle">60°</strong> · Tilt servo to <strong id="goal-scanner">120°</strong> · Hold still. Change <code>turn_ticks</code> to control how long the motor turns.</p></div></section>
<div class="workbench">
<section class="world-panel" aria-label="Robot workbench"><div class="panel-heading"><span><span class="live-dot"></span> RESCUE STATION</span><span id="graphics-label" class="tiny-label">LIVE 3D</span></div><div id="scene" class="scene"><div class="scene-tag"><span>SS—01</span><strong>SIGNAL STATION</strong><small>Motor turns · servo tilts</small></div>
<svg class="component-lines" aria-hidden="true"><g data-part="motor"><line/><circle r="5"/></g><g data-part="servo"><line/><circle r="5"/></g><g data-part="gripper"><line/><circle r="5" cx="0" cy="0"/></g></svg>
<div class="component-label motor-label" id="motor-label"><strong>1 · MOTOR</strong><span>Base turns left / right</span><code>motor(power)</code></div>
<div class="component-label servo-label" id="servo-label"><strong>2 · SERVO</strong><span>Joint tilts lamp up / down</span><code>servo(degrees)</code></div><div class="component-label gripper-label" id="gripper-label" hidden><strong>3 · GRIPPER</strong><span>Opens / closes the jaws</span><code>grip(millimetres)</code></div><div class="camera-tools"><button id="zoom-in" aria-label="Zoom in">+</button><button id="zoom-out" aria-label="Zoom out">−</button><button id="top-view" aria-label="Top view">${icons.cube}</button><button id="view-reset" aria-label="Reset camera">${icons.reset}</button></div><div class="scene-caption">DRAG TO ORBIT <span>·</span> SCROLL TO ZOOM <span>·</span> RIGHT-DRAG TO PAN</div></div><p class="motion-key"><code>motor</code> turns the tower + pointer. <code>servo</code> tilts the lamp.<br><code>wait(ticks)</code> lets both movements advance. <code>motor(0)</code> stops the turn.</p><div id="crew-status" class="crew-status" role="status" aria-live="polite">${missions.beacon.waiting}</div><section id="patrol-progress" class="patrol-progress" aria-label="Route checkpoint progress" hidden></section><section id="arm-progress" class="arm-progress" aria-label="Parcel and joint state" hidden></section><div class="telemetry"><div><span>LIGHT DIRECTION</span><strong id="pointer-value">0.0<em>°</em></strong><small id="pointer-target">target 60°</small></div><div><span>TILT SERVO</span><strong id="scanner-value">90.0<em>°</em></strong><small id="scanner-target">target 120°</small></div><div><span>SIMULATED TIME</span><strong id="time-value">0.00<em>s</em></strong><small>50 ticks / second</small></div></div></section>
<section id="code-panel" class="code-panel" aria-label="Python editor"><div class="panel-heading"><span id="file-name" class="file-name"><i>Py</i> signal.py</span><label class="language-control">LANGUAGE <select id="language" aria-label="Programming language"><option value="python">Python</option><option value="java">Java</option></select></label></div><p class="editor-help" id="editor-help"># lines are notes. <code>await</code> waits for a robot call to return. <a href="#commands-help" data-help="commands-help">Commands & numbers</a></p><div class="experiment-tools"><div class="first-edit"><button id="find-edit">Find first edit</button><p id="next-edit"></p><a href="#hints-help" data-help="hints-help">Hints</a></div><p class="predict-line"><strong>Before Run</strong> <span id="predict-prompt"></span> <button class="text-action" data-note="prediction">Add note</button></p></div><div class="editor-wrap"><pre id="line-numbers" aria-hidden="true"></pre><div class="editor-surface"><pre class="code-highlight" aria-hidden="true"><code id="highlighted-code"></code></pre><textarea id="code" aria-label="Python code" aria-describedby="editor-shortcuts" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off"></textarea></div></div><p id="editor-shortcuts" class="editor-shortcuts">Tab: indent · Shift+Tab: unindent · Esc, then Tab: leave editor</p><div class="editor-footer"><span id="draft-status">Draft saved on this device</span><button id="restore">${icons.reset} Restore example</button><button id="return-draft" hidden>Return to my draft</button></div><div class="run-bar"><button id="run" class="primary">${icons.play} Run code <kbd>⌘ ↵</kbd></button><button id="stop" disabled>${icons.stop} Stop</button><button id="reset" aria-label="Reset robot">${icons.reset} Reset</button></div><details id="output-panel"><summary class="console-heading"><span>Output</span><span id="runtime-label">Messages from your code</span><b>+</b></summary><pre id="console" tabindex="0" aria-label="Python console">Your print() output will appear here.</pre></details></section>
</div>
<section id="feedback" class="feedback" role="status" aria-live="polite"><div class="feedback-icon">↗</div><div><h2 id="feedback-title">Ready to run</h2><p id="feedback-text"></p></div><span id="status-pill">READY</span></section>
<div id="run-followup" hidden><p id="reflect-prompt"></p><button class="text-action" data-note="reflection">Add reflection</button><div class="next-actions"><p id="next-help"></p><button id="next-rescue" disabled>Next rescue →</button></div></div>
<details id="experiment-notes" class="support-section"><summary>Experiment notes <span>Optional · saved on this device</span><b>+</b></summary><section id="lesson-coach" class="lesson-coach" aria-label="Experiment notes"></section></details>
<section id="play-guide" class="help-hub" aria-labelledby="help-title"><h2 id="help-title">Help when you need it</h2><details id="hints-help" class="support-section"><summary>Hints <span>Find your next edit</span><b>+</b></summary><div id="hints-content"></div></details><details id="commands-help" class="support-section"><summary>Commands & numbers <span>Understand the code</span><b>+</b></summary>
<section id="value-guide" class="value-guide" aria-labelledby="value-title"><h3 id="value-title">What does each value do?</h3><div class="value-cards"><article><h3><code>motor(0.5)</code> · turning power</h3><p><strong>Allowed: −1 to 1, including both ends.</strong> Decimals work. Positive turns right; negative turns left; 0 stops.</p><p>0.5 means half power: 30° each simulated second. 1 means full power: 60° each second. Power chooses speed and direction, not a destination angle.</p></article><article><h3><code>servo(120)</code> · tilt position</h3><p><strong>Allowed: 0° to 180°, including both ends.</strong> Decimals work. 90° is level, 120° points 30° up, and 60° points 30° down.</p><p>This sets the angle to move toward. The head moves as time advances with <code>wait</code>.</p></article><article><h3><code>wait(turn_ticks)</code> · movement time</h3><p><strong>Allowed: 1 to 600 whole ticks per call.</strong> A tick is one small step of the simulation: 0.02 seconds.</p><p>50 ticks = 1 second. 100 = 2 seconds. 600 = 12 seconds. <code>turn_ticks = 50</code> stores that count in a variable; <code>wait(turn_ticks)</code> uses it.</p></article></div><div class="range-notes"><p><strong>Outside the range?</strong> <code>motor(2)</code>, <code>servo(200)</code> or <code>wait(0)</code> stops the run with an error. A fraction such as <code>wait(2.5)</code> also fails. Your draft stays; fix the value and Run again. The robot checks ranges when you call a command. Python also checks types at runtime; Java checks declared types during compilation. In Java, waitTicks takes an int (a whole number).</p><p><strong>Valid numbers can still miss.</strong> That is an experiment, not a code error. The direction dial has travel stops at −150° and 150°; reaching a stop clamps movement instead of raising a range error. Stop the motor with <code>motor(0)</code>. A run also stops if it exceeds 30 simulated seconds or its runtime limits.</p><p><strong>Reading and printing:</strong> <code>angle()</code> reads the light’s current direction. <code>round</code> rounds that reading to a whole degree for display; <code>print</code> writes it in the console. These do not move the robot.</p></div></section>
<div id="robot-help"><h3>Robot calls</h3><div class="api-table"><code>await motor(0.5)</code><span>Power −1 to 1. Negative turns left; 0 stops.</span><code>await servo(120)</code><span>Tilt the light: 90° is level; 120° points 30° up; 60° points 30° down.</span><code>await wait(50)</code><span>Advance 50 ticks, or 1 simulated second.</span><code>await angle()</code><span>Read the direction dial: where the light faces.</span><code>await scanner()</code><span>Read the tilt servo’s angle (the API calls it scanner).</span></div><p id="await-guide"><strong>What does await mean?</strong> Pause this program until the robot call returns; the page can still respond. <code>await motor(0.5)</code> and <code>await servo(120)</code> return when the setting is accepted, before movement. They do not wait for a part to reach its goal. <code>await wait(50)</code> lets both parts move for 50 ticks (1 simulated second), then continues. <code>await angle()</code> gets the current sensor reading. Calculations, <code>round</code> and <code>print</code> do not need await.</p><p>Time advances only when you wait. A short wait may leave the servo still moving toward its goal. The motor travels from −150° to 150°.</p></div></details><details id="recovery-help" class="support-section"><summary>Reset & recovery <span>Keep your work safe</span><b>+</b></summary><dl class="recovery-guide"><dt>Run / Reset</dt><dd>Start this challenge again. Your code stays.</dd><dt>Stop</dt><dd>End the run. Edit your code, then try again.</dd><dt>Restore example</dt><dd>Load the starter and keep one return copy. Use “Return to my draft” to recover your code and challenge.</dd><dt>Code error?</dt><dd>Read the error in Output, fix the line, then Run. Your draft stays.</dd><dt>Save</dt><dd>Drafts and notes stay on this device. Sign in to save code and challenges to your profile; notes stay here.</dd></dl></details></section>
<details class="support-section real-world-help"><summary>Real life machines / robots <span>Use this idea beyond the mission</span><b>+</b></summary><section class="real-world" aria-labelledby="real-world-title"><div><span class="eyebrow">WHY THIS MATTERS</span><h2 id="real-world-title">You’re programming where a machine looks.</h2><p>The pointer is the searchlight’s direction dial. Turning it moves the whole light. Tilting the head changes how high it looks. When you aim both and stop, the crew’s pickup point lights up.</p></div><div class="real-world-example"><span class="eyebrow">REAL LIFE MACHINES / ROBOTS</span><h3>Point a camera at a doorway.</h3><p>A camera on a pan-and-tilt mount uses the same two movements: turn toward the door, then tilt to see who is there. Your code would give a real controller those movement instructions.</p><a href="https://learn.adafruit.com/mini-pan-tilt-kit-assembly?view=all" target="_blank" rel="noopener noreferrer">See a real pan-and-tilt mechanism ↗</a><p class="model-note">This game uses a simplified motor. Real hardware needs its own driver code, measured speeds and position checks; these programs run in the game.</p></div></section></details>
<footer><span>RoboLab <i>/</i> Small experiments. Real understanding.</span><span>Python + Java · Private family progress</span></footer>
</main>`;
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const code = el<HTMLTextAreaElement>('code');
// Keep Run and help above the long commented program.
const runBar=document.querySelector('.run-bar')!;
el('code-panel').insertBefore(runBar,document.querySelector('.editor-wrap'));
runBar.after(el('feedback'),el('run-followup'));
// Links open the relevant disclosure and move keyboard focus to its destination.
document.addEventListener('click',event=>{
  const link=(event.target as Element).closest<HTMLElement>('[data-help],[data-note]');if(!link)return;
  event.preventDefault();
  if(locked()&&link.dataset.note)return;
  const note=link.dataset.note, destination=note?'experiment-notes':link.dataset.help!;
  el<HTMLDetailsElement>(destination).open=true;
  if(note)el(note).focus();else el(destination).querySelector('summary')!.focus();
});
const experiments=new Map<string,Experiment>();
function experimentFor(lang=language,id=lesson):Experiment {
  const key=storageKey(lang,id), source=lessonDrafts[id][lang];
  if(!experiments.has(key)){let raw=null;try{raw=localStorage.getItem(key+'.experiment');}catch{}experiments.set(key,readExperiment(raw,source,id));}
  return experiments.get(key)!;
}
function renderCoach(){renderTeaching(lesson,language,selected,experimentFor(),saveDraft);el('return-draft').hidden=!experimentFor().previous;renderAccess();}

let language: Language = 'python';
let draftPrefix = 'robolab.s01';
const lessonDrafts = {L01:{python:pythonStarter,java:javaStarter},L02:{...getLesson('L02').starters},L03:{...getLesson('L03').starters},L04:{...getLesson('L04').starters}};
let drafts = lessonDrafts[lesson];
function storageKey(lang:Language,id=lesson){return `${draftPrefix}.${draftKey(id,lang)}`;}
try {
  if(localStorage.getItem('robolab.s01.language') === 'java') language='java';
  for(const id of lessonIds)for(const lang of ['python','java'] as const)lessonDrafts[id][lang]=localStorage.getItem(storageKey(lang,id))??getLesson(id).starters[lang];
} catch { /* Keep both drafts in memory when storage is unavailable. */ }
code.value = drafts[language];
const highlight = attachHighlighting(code, el('highlighted-code'));
const pythonHelp = el('editor-help').innerHTML;
const pythonApi = document.querySelector('.api-table')!.innerHTML;
const pythonAwait = el('await-guide').innerHTML;
function languageUI() {
  const java=language==='java', name=java?'Java':'Python';
  el<HTMLSelectElement>('language').value=language;
  el('language-badge').textContent=`${name} · Mission ${missionNumber()}`;
  el('code-panel').setAttribute('aria-label',`${name} editor`);
  code.setAttribute('aria-label',`${name} code`);
  el('console').setAttribute('aria-label',`${name} console`);
  if(status==='idle') el('console').textContent=java?'Your System.out.println output will appear here.':'Your print() output will appear here.';
  el('file-name').innerHTML=java?'<i>Jv</i> Main.java':'<i>Py</i> signal.py';
  el('editor-help').innerHTML=java?'// lines are notes. Robot calls wait for a reply; use <code>Robot.waitTicks</code> to advance motion. <a href="#commands-help" data-help="commands-help">Commands & numbers</a>':pythonHelp;
  document.querySelector('.api-table')!.innerHTML=java?'<code>Robot.motor(0.5);</code><span>Power −1 to 1. Negative turns left; 0 stops.</span><code>Robot.servo(120);</code><span>Tilt 0° to 180°. 90° is level.</span><code>Robot.waitTicks(50);</code><span>Advance 50 ticks: 1 simulated second.</span><code>Robot.angle();</code><span>Read the current direction.</span><code>Robot.scanner();</code><span>Read the tilt servo angle.</span>':pythonApi;
  el('await-guide').innerHTML=java?'<strong>Why is there no await?</strong> These Java calls block this program until the robot replies; the page stays responsive. Setting motor power or servo position does not advance time or wait for arrival. <code>Robot.waitTicks(50)</code> advances both parts for 1 simulated second. <code>Robot.clock()</code> reads simulated seconds. Java checks types before running: <code>int</code> holds whole numbers, <code>double</code> allows decimals. A semicolon ends a statement; braces group the class and method. Keep <code>public class Main</code> and its <code>main</code> method; put your commands inside the method.':pythonAwait;
  const examples: Record<string,string> = {'decision_angle':'decisionAngle', 'motor(0.5)':'Robot.motor(0.5)', 'servo(120)':'Robot.servo(120)', 'wait(turn_ticks)':'Robot.waitTicks(turn_ticks)', 'wait(50)':'Robot.waitTicks(50)', 'turn_ticks = 50':'int turn_ticks = 50;', 'motor(2)':'Robot.motor(2)', 'servo(200)':'Robot.servo(200)', 'wait(0)':'Robot.waitTicks(0)', 'wait(2.5)':'Robot.waitTicks(2.5)', 'motor(0)':'Robot.motor(0)', 'angle()':'Robot.angle()', 'round':'Math.round', 'print':'System.out.println', 'wait(ticks)':'Robot.waitTicks(ticks)'};
  document.querySelectorAll<HTMLElement>('#value-guide code, .motion-key code').forEach(node=>{
    const py=node.dataset.python ?? node.textContent!; node.dataset.python=py; node.textContent=java?(examples[py]??py):py;
  });
  if(lesson==='L04')armLanguage(java);
}
let state: State = initialState(), status: RunStatus | 'idle' = 'idle', runner: Runner | undefined;
const completedLocations = new Set<string>();
let locationOrder: readonly string[] = lessonTargets[lesson];
let success = false, selected = 'beacon', generation = 0;
let scene: StationScene | undefined;
try { scene = new StationScene(el('scene')); } catch {
  const warning = document.createElement('p'); warning.className = 'webgl-warning'; warning.textContent = '3D needs WebGL. Enable hardware acceleration or try a current desktop browser. The code and angle readouts still work.'; el('scene').append(warning);
}
function showState() {
  const goal = targets[selected];
  el('pointer-value').innerHTML = `${state.angle.toFixed(1)}<em>°</em>`;
  el('scanner-value').innerHTML = `${state.scanner.toFixed(1)}<em>°</em>`;
  el('time-value').innerHTML = `${(state.ticks * .02).toFixed(2)}<em>s</em>`;
  const crewStatus = success ? missions[selected].found : missions[selected].waiting;
  if (el('crew-status').textContent !== crewStatus) el('crew-status').textContent = crewStatus;
  el('crew-status').classList.toggle('located', success);
  patrolProgress(state,selected,success);
  armProgress(state.arm,selected);
  updatePractice();
  scene?.update(state, goal, success);
}
function updatePractice() {
  renderAccess();
  const index = locationOrder.indexOf(selected);
  const kind=lesson==='L04'?'Delivery':lesson==='L03'?'Patrol':'Rescue';
  el('practice-current').textContent=access().complete?`Mission ${missionNumber()} complete`:`Practice · ${kind} ${index+1} of 3`;
  const badges=el('practice-badges');
  const content=locationOrder.map((target,i)=>{const done=access().complete||completedLocations.has(target),current=target===selected,label=`${missions[target].location}: ${done?'completed':'not completed'}${current?', current':''}`;return `<span class="${done?'earned':''}" ${current?'aria-current="step"':''} aria-label="${label}" title="${label}">${done?'✓':i+1}</span>`;}).join('');
  if(badges.innerHTML!==content)badges.innerHTML=content;
  el('practice-progress').textContent = access().complete?'3 of 3 checked!':`${locationOrder.filter(t=>completedLocations.has(t)).length} of 3 completed this visit`;
  el('checked-progress').hidden=!signedIn||access().complete;
  el('checked-progress').textContent=`Checked: ${locationOrder.filter(t=>checked.includes(t)).length}/3`;
  const next = el<HTMLButtonElement>('next-rescue');
  next.hidden = index === locationOrder.length - 1 || !completedLocations.has(selected);
  next.disabled = !completedLocations.has(selected) || status === 'loading' || status === 'running';
  next.textContent = `${lesson==='L04'?'Next delivery':lesson==='L03'?'Next patrol':'Next rescue'}: ${missions[locationOrder[index + 1] ?? selected].location} →`;
  const practiced=locationOrder.every(t=>completedLocations.has(t));
  const complete=access().complete;
  const nextLesson=el<HTMLButtonElement>('next-lesson');if(nextLesson){const nextId=getLesson(lesson).next;nextLesson.hidden=!nextId||!complete;nextLesson.textContent=nextId?`Next mission: ${getLesson(nextId).title} →`:'';nextLesson.disabled=!complete;}
  el('run-followup').hidden=locked()||status==='loading'||status==='running'||(status!=='finished'&&!completedLocations.has(selected));
  el('reflect-prompt').hidden=status!=='finished';
  document.querySelector<HTMLButtonElement>('[data-note="reflection"]')!.hidden=status!=='finished';
  el('next-help').textContent = complete
    ? `Mission ${missionNumber()} complete · 3 of 3 checked!${getLesson(lesson).next?'':' Mission 5 is coming soon.'}`
    : practiced ? `${signedIn?'Use':'Sign in and use'} Check & save progress on all 3 challenges to finish this mission.`
    : completedLocations.has(selected)
      ? (index===locationOrder.length-1?'Choose an unfinished challenge above.':'Keep your code and adapt it to the next challenge.')
      : '';
}
function renderAccess() {
  const info=access(), preview=!!info.required;
  document.documentElement.dataset.currentMission=lesson;
  document.documentElement.dataset.runStatus=status;
  document.documentElement.dataset.preview=String(preview);
  el('mission-access').hidden=!preview;
  document.querySelector<HTMLElement>('.practice-nav')!.hidden=preview;
  el('unlock-help').textContent=info.message;
  el('return-mission').textContent=`Go to Mission ${Number(info.required?.slice(1))}`;
  code.readOnly=preview;
  code.setAttribute('aria-describedby',preview?'unlock-help':'editor-shortcuts');
  el('editor-shortcuts').textContent=preview?'Preview · editing and running unlock after the previous mission.':'Tab: indent · Shift+Tab: unindent · Esc, then Tab: leave editor';
  el('graphics-label').textContent=preview?'3D PREVIEW':'LIVE 3D';
  el('scene').inert=preview;scene?.setInteractive(!preview);
  for(const id of ['language','target','restore','return-draft','find-edit','reset','view-reset','top-view','zoom-in','zoom-out','save-cloud','verify-cloud','resolve-conflict']){
    const control=document.getElementById(id) as HTMLButtonElement|null;if(control)control.disabled=preview||(id==='verify-cloud'&&checkActive);
  }
  el<HTMLButtonElement>('run').disabled=preview||status==='loading'||status==='running';
  for(const control of document.querySelectorAll<HTMLButtonElement|HTMLTextAreaElement>('#lesson-coach textarea,[data-note]'))control.disabled=preview;
  if(preview)for(const control of document.querySelectorAll<HTMLButtonElement>('#lesson-coach button,#hints-content button'))control.disabled=true;
  el('experiment-notes').inert=preview;
}
function feedback(title: string, text: string, kind = '') {
  el('feedback-title').textContent = title; el('feedback-text').textContent = text; el('feedback').className = `feedback ${kind}`;
}
function saveDraft() {
  highlight(language);
  el('line-numbers').textContent = code.value.split('\n').map((_, i) => i + 1).join('\n');
  if(locked()){el('draft-status').textContent='Preview · your saved draft is unchanged';return;}
  drafts[language]=code.value;
  const experiment=experimentFor();experiment.source=code.value;experiment.target=selected;
  try { localStorage.setItem(storageKey(language), code.value);localStorage.setItem(storageKey(language)+'.experiment',JSON.stringify(experiment));el('draft-status').textContent = 'Draft & challenge saved on this device'; }
  catch { el('draft-status').textContent = 'Latest work is in this tab only'; }
  el('return-draft').hidden=!experiment.previous;
}
code.addEventListener('input', saveDraft);
code.addEventListener('scroll', () => { el('line-numbers').scrollTop = code.scrollTop; });
attachEditor(code, saveDraft, run);
let attemptPrediction='';
let attempt: {id:string;source:string;language:Language;target:string} | undefined;
function recordAttempt(outcome:string, detail?:string) {
  if(!attempt)return;
  const finished=attempt;attempt=undefined;
  void family.record({...finished,outcome,seconds:state.ticks*.02,error:detail});
}
function setStatus(next: RunStatus, detail?: string) {
  status = next;
  const active = next === 'loading' || next === 'running';
  el<HTMLButtonElement>('run').disabled = active;
  el<HTMLButtonElement>('stop').disabled = !active;
  el('status-pill').textContent = next === 'finished' ? 'FINISHED' : next.toUpperCase();
  const name = language==='java'?'Java':'Python';
  el('runtime-label').textContent = ({ loading: language==='java'?'Compiling real Java…':'Loading real Python…', running: `${name} is running`, finished: 'Program finished', stopped: language==='java'?'Program stopped':'Worker stopped', error: 'Program stopped' })[next];
  if (next === 'loading') feedback(language==='java'?'Compiling Java…':'Loading Python…', 'You can Stop at any time.');
  if (next === 'running') feedback('Running your code…', lesson==='L04'?'Watch the actual joints and parcel.':lesson==='L03'?'Watch each stop and steady hold.':'Watch where the beam stops.');
  if (next === 'finished') {
    const worked=el<HTMLButtonElement>('show-solution');if(worked)worked.disabled=false;
    success = reached(state, targets[selected]);
    if (success) completedLocations.add(selected);
    if(lesson==='L04'){const miss=armFailure(state.arm!);feedback(success?'Parcel delivered. The worker can finish!':miss.title,success?'You grasped, carried clear and released in the tray. Explain why the lift came before the turn, then adapt the moved tray.':miss.text,success?'success':'try-again');}
    else if(lesson==='L03'){const miss=patrolFailure(state,selected);feedback(success?'Route ready. Rangers can set out!':miss.title,success?'Every checkpoint received a steady hold. Explain which calls repeated and which ran once. Try a changed route; retries and hints are free.':miss.text,success?'success':'try-again');}
    else if (success) feedback('Crew located. Pickup point lit!', lesson==='L02'
      ? `Your code recovered the light for the ${selected==='sensor-transfer'?'lower cove':'north ridge'} crew. Explain how the sensor reading chose the turn, and why the same comparison works from the other side. Then try another case.`
      : `The ${missions[selected].location.toLowerCase()} pickup point has a steady light.`, 'success');
    else feedback('Not on target yet.', `Direction: ${state.angle.toFixed(1)}° / ${targets[selected].angle}° · Tilt: ${state.scanner.toFixed(1)}° / ${targets[selected].scanner}°. ${state.power ? `Use ${language==='java'?'Robot.motor(0);':'await motor(0)'} to stop.` : lesson==='L02'?'Compare Read, Decision and Now in Output. Check the branch, movement and tilt.':'Change your timing or direction, then Run again.'}`, 'try-again');
  }
  if (next === 'stopped') feedback('Stopped. Your code is safe.', 'Run again from this case’s starting direction, or Reset. Your draft stays.');
  if (next === 'error') {
    el<HTMLDetailsElement>('output-panel').open=true;
    const worked=el<HTMLButtonElement>('show-solution');if(worked)worked.disabled=false;
    const error = detail || `${name} was interrupted. Try again.`;
    const hint = language==='java' && error.includes('possible lossy conversion') ? 'Java cannot put a decimal into an int. Counts and waitTicks need whole numbers; use double for values that allow decimals. See the original compiler error below.' : error.includes('SyntaxError') ? 'Python found a syntax error. Check the line shown in the console.' : error.includes('NameError') ? 'Python found an unknown name. Check spelling and your imports in the console.' : error.split('\n').at(-1)!;
    feedback('Let’s fix that and try again.', hint, 'error');
    el('console').textContent += `\n${error}`;
  }
  if(!active && attempt){const observation=state.arm?`shoulder ${state.arm.shoulder.toFixed(1)}°, elbow ${state.arm.elbow.toFixed(1)}°, parcel ${state.arm.payload}${state.arm.collision?', guard contact':''}`:`direction ${state.angle.toFixed(1)}°, tilt ${state.scanner.toFixed(1)}°${state.patrol?`, ${state.patrol.visited} checkpoints logged`:''}`;el('prediction-feedback').textContent=`Prediction: ${attemptPrediction || 'No prediction recorded.'} Result: ${next}; ${observation}. Compare this run with your prediction before the next edit.`;}
  if(!active) recordAttempt(next==='finished'?(success?'reached':'missed'):next==='stopped'?'stopped':detail?.includes('unavailable')?'unavailable':'error',detail);
  showState();
}
function run() {
  if (locked() || status === 'loading' || status === 'running' || family.isChecking()) return;
  const current = ++generation;
  runner?.stop(); state = initialState(selected); success = false; showState(); el('console').textContent = '';
  saveDraft();attemptPrediction=experimentFor().prediction;el<HTMLDetailsElement>('output-panel').open=false;
  attempt={id:crypto.randomUUID(),source:code.value,language,target:selected};
  try { runner = new Runner(code.value, {
    snapshot: value => { if (generation === current) { state = value; showState(); } },
    status: (value, detail) => { if (generation === current) setStatus(value, detail); },
    output: text => { if (generation === current) { el<HTMLDetailsElement>('output-panel').open=true; el('console').textContent += text; el('console').scrollTop = el('console').scrollHeight; } },
  }, language, selected); } catch (e) { setStatus('error', String(e)); }
}
function reset() {
  recordAttempt('stopped');
  ++generation; runner?.stop(); runner = undefined; state = initialState(selected); success = false; status = 'idle';
  el<HTMLButtonElement>('run').disabled = false; el<HTMLButtonElement>('stop').disabled = true;
  el('status-pill').textContent = 'READY'; el('runtime-label').textContent = 'Ready for your code'; el('console').textContent = language==='java'?'Your System.out.println output will appear here.':'Your print() output will appear here.';
  feedback('Ready for another run. Your code stays.', ''); showState();
}
el<HTMLSelectElement>('language').onchange = event => {
  if(locked()){el<HTMLSelectElement>('language').value=language;return;}
  if(family.isChecking()){el<HTMLSelectElement>('language').value=language;feedback('Wait for the progress check.','Stop the check before switching languages.');return;}
  saveDraft(); reset();
  language=(event.target as HTMLSelectElement).value==='java'?'java':'python';
  selected=experimentFor().target;state=initialState(selected);code.value=drafts[language]; code.scrollTop=0; code.scrollLeft=0;lessonUI(); languageUI();renderCoach();saveDraft();showState();
  try {localStorage.setItem('robolab.s01.language',language);} catch {}
  feedback(`${language==='java'?'Java':'Python'} draft ready.`, '');
};
el('run').onclick = run;
el('stop').onclick = () => runner?.stop();
el('reset').onclick = () => {if(!locked())reset();};
el('restore').onclick = () => {
  if(locked()||family.isChecking())return;
  const experiment=experimentFor();
  // Repeated Restore clicks must not overwrite the student's return copy.
  if(!experiment.previous)experiment.previous={source:code.value,target:selected};
  reset();code.value=starters[language];experiment.prediction='';experiment.reflection='';saveDraft();renderCoach();
  feedback('Example restored. Your draft has a return copy.', 'The example was written for the first challenge. Your selected challenge stays; compare the two before running. Return to my draft restores your saved code and challenge.');
};
el('return-draft').onclick=()=>{
  if(locked()||family.isChecking())return;
  const experiment=experimentFor(),previous=experiment.previous;if(!previous)return;
  reset();selected=previous.target;state=initialState(selected);code.value=previous.source;delete experiment.previous;experiment.prediction='';experiment.reflection='';saveDraft();lessonUI();languageUI();renderCoach();showState();
  feedback('Your draft and challenge are back.', 'Predict from this code before running again.');
};
el('find-edit').onclick=()=>{
  if(locked())return;
  const pattern=lesson==='L01'?/^(?:\s*int )?\s*turn_ticks\s*=/m:lesson==='L02'?/^\s*if[ (]/m:lesson==='L04'?/^(?:\s*int )?\s*lift_ticks\s*=/m:/^(?:\s*int )?\s*repeats\s*=/m;
  const match=pattern.exec(code.value);code.focus();
  if(match){const start=match.index+match[0].search(/\S/);code.setSelectionRange(start,code.value.indexOf('\n',start)<0?code.value.length:code.value.indexOf('\n',start));code.scrollTop=Math.max(0,(code.value.slice(0,start).split('\n').length-3)*parseFloat(getComputedStyle(code).lineHeight));code.dispatchEvent(new Event('scroll'));}
  else feedback('This draft uses a different structure.', 'Find the value or condition you want to test in your code; your draft is unchanged.');
};
function selectLocation(value: string) {
  if(locked()){el<HTMLSelectElement>('target').value=selected;return;}
  if(family.isChecking()){el<HTMLSelectElement>('target').value=selected;feedback('Wait for the progress check.','Stop the check before changing rescues.');return;}
  if(!locationOrder.includes(value))return;
  reset(); selected = value;state=initialState(selected);
  el<HTMLSelectElement>('target').value = value;
  el('mission-job').textContent = missions[selected].job;
  el('goal-angle').textContent = `${targets[selected].angle}°`; el('goal-scanner').textContent = `${targets[selected].scanner}°`;
  el('pointer-target').textContent = `target ${targets[selected].angle}°`; el('scanner-target').textContent = `target ${targets[selected].scanner}°`;
  experimentFor().prediction='';experimentFor().reflection='';saveDraft();renderCoach();
  feedback(lesson==='L02'&&selected!=='sensor-transfer'?'New starting side. Keep the same code.':'New challenge. Your code stays.',''); showState();
}
el<HTMLSelectElement>('target').onchange = event => selectLocation((event.target as HTMLSelectElement).value);
el('next-rescue').onclick = () => {
  const next = locationOrder[locationOrder.indexOf(selected) + 1];
  if (next && completedLocations.has(selected) && status !== 'loading' && status !== 'running') selectLocation(next);
};
el('view-reset').onclick = () => !locked() && scene?.reset(); el('top-view').onclick = () => !locked() && scene?.top();
el('zoom-in').onclick = () => !locked() && scene?.zoom(.85); el('zoom-out').onclick = () => !locked() && scene?.zoom(1.18);
const firstMotion=document.querySelector('.motion-key')!.innerHTML;
const firstIntro=document.querySelector('.intro')!.innerHTML;
const firstWorld=document.querySelector('.real-world')!.innerHTML;
const firstValues=el('value-guide').innerHTML;
const firstInstruction=document.querySelector('.mission-instruction')!.innerHTML;
const nextMission=document.createElement('button');nextMission.id='next-lesson';nextMission.textContent='Mission 2: Read, then choose →';nextMission.disabled=true;document.querySelector('.practice-nav')!.append(nextMission);nextMission.onclick=()=>{const next=getLesson(lesson).next;if(next&&access().complete)selectLesson(next);};
function lessonUI(){
  const info=getLesson(lesson),sensor=lesson==='L02';
  const arm=lesson==='L04';
  el('scene').dataset.world=arm?'arm':'station';
  el('gripper-label').hidden=!arm;
  document.querySelector('.scene-tag')!.innerHTML=arm?'<span>PP—04</span><strong>PARCEL PORT</strong><small>Shoulder turns · elbow lifts · gripper holds</small>':'<span>SS—01</span><strong>SIGNAL STATION</strong><small>Motor turns · servo tilts</small>';
  document.querySelector('.world-panel .panel-heading>span')!.innerHTML='<span class="live-dot"></span> '+(arm?'PARCEL PORT':'RESCUE STATION');
  document.querySelector('.telemetry>div:first-child>span')!.textContent=arm?'SHOULDER · ACTUAL':'LIGHT DIRECTION';
  document.querySelector('.telemetry>div:nth-child(2)>span')!.textContent=arm?'ELBOW · ACTUAL':'TILT SERVO';
  document.querySelector('.motion-key')!.innerHTML=arm?'<code>shoulder</code> turns · <code>elbow</code> lifts · <code>grip</code> opens/closes.<br>Targets are accepted now; only <code>wait</code> advances motion.':firstMotion;
  if(!arm)el('servo-label').innerHTML='<strong>2 · SERVO</strong><span>Joint tilts lamp up / down</span><code>servo(degrees)</code>';
  el('patrol-progress').hidden=lesson!=='L03';
  el('arm-progress').hidden=!arm;
  if(arm){armUI(selected);renderCoach();return;}
  el('target-label').textContent=lesson==='L03'?'CHOOSE YOUR PATROL':'WHERE IS THE CREW?';
  if(lesson==='L03'){patrolUI(selected);renderCoach();return;}

  document.querySelector('.intro')!.innerHTML=sensor?'<div><div class="eyebrow">MISSION 02 / READING → DECISION → MOVEMENT</div><h1>Read, then choose<span>.</span></h1></div>':firstIntro;
  document.querySelector('.mission-copy h2')!.textContent=sensor?'Recover the rescue light':'Put the stranded crew in the light';
  document.querySelector('.mission-instruction')!.innerHTML=sensor?'Turn to <strong id="goal-angle">60°</strong> · Tilt to <strong id="goal-scanner">120°</strong> · Hold still. Fix the <code>if</code> comparison; test both starting sides.':firstInstruction;
  el<HTMLSelectElement>('target').innerHTML=locationOrder.map((t,i)=>`<option value="${t}">${i+1} · ${missions[t].location}</option>`).join('');
  el<HTMLSelectElement>('target').value=selected;
  el('mission-job').textContent=missions[selected].job;
  el('goal-angle').textContent=`${targets[selected].angle}°`;el('goal-scanner').textContent=`${targets[selected].scanner}°`;
  el('pointer-target').textContent=`target ${targets[selected].angle}°`;el('scanner-target').textContent=`target ${targets[selected].scanner}°`;
  document.querySelector('.practice-nav')!.setAttribute('aria-label',`Mission ${sensor?2:1} practice progress`);
  document.querySelector('.real-world')!.innerHTML=sensor?`<div><span class="eyebrow">WHY THIS MATTERS</span><h2 id="real-world-title">A robot can measure before it moves.</h2><p>${info.job} A fixed right turn only works from one side. The sensor lets your code choose.</p><p><strong>Other real-life applications:</strong> ${info.otherApplications}</p></div><div class="real-world-example"><span class="eyebrow">REAL LIFE MACHINES / ROBOTS</span><h3>Position sensors on robot joints</h3><p>${info.application}</p><a href="${info.source}" target="_blank" rel="noopener noreferrer">See FIRST robotics position-sensor documentation ↗</a><p class="model-note">Our angle sensor is an ideal absolute reading, with no noise or delay. Real encoders can be relative or absolute; their units and zero need calibration. This one-read correction works only for our declared 30° offsets. A real moving target needs repeated sensing, taught later.</p></div>`:firstWorld;
  el('value-guide').innerHTML=sensor?firstValues.replace('<code>wait(turn_ticks)</code>','<code>wait(50)</code>').replace('50 ticks = 1 second. 100 = 2 seconds. 600 = 12 seconds. <code>turn_ticks = 50</code> stores that count in a variable; <code>wait(turn_ticks)</code> uses it.','50 ticks = 1 second. At half power that moves 30°, exactly the gap in each Mission 2 case. 100 ticks would move 60° and overshoot.').replace('<div class="range-notes">','<div class="range-notes"><p><strong>Compare, move, check:</strong> <code>decision_angle</code> is a comparison value in degrees. The <code>if</code> compares <code>reading</code> with it to choose a branch. Motor power and the wait duration determine how far the light turns; this variable does not tell the motor where to stop. Changing it can leave the same branch selected and produce the same movement.</p><p>The crew’s target is set by the selected rescue. Success checks where the stopped beam actually points, not whether a variable matches that target. The comparison value has no robot API range check; an unusual value can choose an unhelpful branch without causing an error. Older saved code may call this value <code>goal</code>; the role is the same.</p><p><strong>Try an experiment:</strong> Choose a nearby comparison value. Predict whether Decision and Now will change, then test both starting sides. Which line controls the amount of turning?</p>'):firstValues;
  el('scene').dataset.sensor=String(sensor);
  el('motor-label').innerHTML='<strong>1 · MOTOR</strong><span>Base turns left / right</span><code>motor(power)</code>'+(sensor?'<small id="direction-sensor-label">SENSOR · angle()<br>Reads base direction</small>':'');
  renderCoach();
}
function selectLesson(id:LessonId,target?:string,lang:Language=language,source?:string){
  if(family.isChecking()){feedback('Wait for the progress check.','Stop the check before changing missions.');return;}
  if(source!==undefined&&access(id).required)return;
  saveDraft();reset();language=lang;lesson=id;starters=getLesson(id).starters;drafts=lessonDrafts[id];locationOrder=lessonTargets[id];selected=target&&locationOrder.includes(target)?target:experimentFor().target;state=initialState(selected);code.value=source??drafts[language];code.scrollTop=0;code.scrollLeft=0;
  lessonUI();languageUI();saveDraft();showState();
  try{localStorage.setItem(`${draftPrefix}.lesson`,lesson);}catch{}
  feedback(locked()?'Read-only preview':'Your draft and challenge are ready.',locked()?access().message:'');
  if(locked())el('preview-title').focus({preventScroll:true});
}
el('return-mission').onclick=()=>{const required=access().required;if(required)selectLesson(required);};
const family=attachFamily({
  checking:active=>{checkActive=active;renderAccess();},
  canEdit:(id=lesson)=>!access(id).required,
  progress:(completed,authenticated)=>{const wasComplete=access().complete;checked=authenticated?completed:[];signedIn=authenticated;updatePractice();if(!wasComplete&&access().complete)document.querySelector('.practice-nav')!.scrollIntoView({block:'center'});},
  draft:()=>({source:code.value,language,target:selected,lesson}),
  lesson:()=>lesson,
  openLesson:(id,target)=>selectLesson(id,target),
  draftFor:(lang,id=lesson)=>id===lesson&&lang===language?code.value:lessonDrafts[id][lang],
  targetFor:(lang,id=lesson)=>id===lesson&&lang===language?selected:experimentFor(lang,id).target,
  stop:()=>runner?.stop(),
  load:(lang,source,id=lesson,target)=>{if(access(id).required)return;selectLesson(id,target,lang,source);experimentFor().prediction='';experimentFor().reflection='';saveDraft();renderCoach();},
  profile:(id,cloud,completed)=>{
    saveDraft();reset();completedLocations.clear();checked=id?completed:[];signedIn=!!id;
    draftPrefix=id?`robolab.profile.${id}`:'robolab.s01';
    for(const id of lessonIds)for(const lang of ['python','java'] as const){
      let local:string|null=null;try{local=localStorage.getItem(storageKey(lang,id));}catch{}
      const saved=cloud[draftKey(id,lang)];
      lessonDrafts[id][lang]=experiments.get(storageKey(lang,id))?.source??local??saved?.source??getLesson(id).starters[lang];
      const key=storageKey(lang,id);if(!experiments.has(key)){let raw=null;try{raw=localStorage.getItem(key+'.experiment');}catch{}experiments.set(key,readExperiment(raw,lessonDrafts[id][lang],id,saved?.source===lessonDrafts[id][lang]?saved?.target:undefined));}
    }
    let savedLesson:LessonId='L01';try{const saved=localStorage.getItem(`${draftPrefix}.lesson`) as LessonId;if(lessonIds.includes(saved))savedLesson=saved;}catch{}
    // Change identity before loading; never save the outgoing draft under the incoming profile.
    lesson=savedLesson;starters=getLesson(lesson).starters;drafts=lessonDrafts[lesson];locationOrder=lessonTargets[lesson];selected=experimentFor().target;state=initialState(selected);lessonUI();
    code.value=drafts[language];languageUI();saveDraft();showState();
  },
});
if(import.meta.env.VITE_HOSTED==='1') {
  document.querySelector('.build-status')!.textContent='Four missions in Python and Java. Sign in for Java, saved drafts and checked family progress.';
  document.querySelector('footer span:last-child')!.textContent='Python + Java · Private family progress';
}
// Read context before the first save can overwrite it.
selected=experimentFor().target;state=initialState(selected);lessonUI();languageUI();saveDraft();showState();

try{const saved=localStorage.getItem(`${draftPrefix}.lesson`) as LessonId;if(lessonIds.includes(saved))selectLesson(saved);}catch{}
