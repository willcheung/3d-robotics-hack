import './style.css';
import { initialState, reached, targets, lessonIds, lessonTargets, targetLesson, draftKey, type LessonId, type State } from './model.ts';
import { Runner, type RunStatus } from './runner.ts';
import { StationScene } from './scene.ts';
import { attachEditor } from './editor.ts';
import { attachHighlighting } from './highlighting.ts';
import { attachFamily } from './family.ts';
import { pythonStarter, javaStarter } from './starters.ts';
import {getLesson} from './lessons.ts';
import {patrolMissions, patrolUI, patrolProgress} from './patrol-ui.ts';
import {readExperiment, type Experiment} from './experiment.ts';
import {renderTeaching, patrolFailure} from './teaching.ts';
type Language = 'python' | 'java';
let lesson: LessonId = 'L01';
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
Object.assign(missions,patrolMissions);
const missionNumber=()=>Number(lesson.slice(1));
const icons = {
 play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m8 5 12 7-12 7z"/></svg>',
 stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
 reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/></svg>',
 cube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m12 3 9 5v9l-9 5-9-5V8zm0 10 9-5M3 8l9 5v9"/></svg>',
};
document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<header class="header"><a class="brand" href="/" aria-label="RoboLab home"><span class="brand-mark">${icons.cube}</span>Robo<span>Lab</span></a><span class="header-divider"></span><span class="workshop-label">THE ROBOTICS WORKSHOP</span><span class="preview-badge" id="language-badge"><span></span>Python · Mission 1</span><a class="help-link" href="#play-guide">How to play <span>↗</span></a></header>
<main>
<div class="intro"><div><div class="eyebrow">MISSION 01 <span>/</span> NUMBERS → MOVEMENT</div><h1>Signal Station<span>.</span></h1><p>Use code to help a rescue team find a stranded crew.</p></div><div class="mission-stamp"><span>YOUR CODE HAS A JOB</span><strong>Find them. Light the way.</strong><div><i class="active"></i><i></i><i></i><i></i></div></div></div>
<nav class="lesson-picker" aria-label="Choose a mission"><label>YOUR MISSION <select id="lesson" aria-label="Mission"><option value="L01">1 · Signal Station</option><option value="L02">2 · Read, then choose</option><option value="L03">3 · Ranger patrol</option></select></label><p>Practice freely. Check each mission’s three challenges to unlock saved completion in the next mission.</p></nav>
<p class="build-status">Run real Python or Java across three missions. Each mission keeps separate language drafts. Retries and hints never cost points.</p>
<section class="mission-card" aria-label="Your mission"><div class="mission-number">01</div><div class="mission-copy"><h2>Put the stranded crew in the light</h2><p id="mission-job">${missions.beacon.job}</p><p class="mission-instruction">Turn to <strong id="goal-angle">60°</strong> · Tilt servo to <strong id="goal-scanner">120°</strong> · Hold still. Change <code>turn_ticks</code> to control how long the motor turns.</p></div><label class="target-select"><span id="target-label">WHERE IS THE CREW?</span><select id="target" aria-label="Challenge target"><option value="beacon">01 · North ridge / 60°</option><option value="farther">02 · East lookout / 90°</option><option value="reverse">03 · Lower cove / −60°</option></select></label></section>
<div class="workbench">
<section class="world-panel" aria-label="Robot workbench"><div class="panel-heading"><span><span class="live-dot"></span> RESCUE STATION</span><span id="graphics-label" class="tiny-label">LIVE 3D</span></div><div id="scene" class="scene"><div class="scene-tag"><span>SS—01</span><strong>SIGNAL STATION</strong><small>Motor turns · servo tilts</small></div>
<svg class="component-lines" aria-hidden="true"><g data-part="motor"><line/><circle r="5"/></g><g data-part="servo"><line/><circle r="5"/></g></svg>
<div class="component-label motor-label" id="motor-label"><strong>1 · MOTOR</strong><span>Base turns left / right</span><code>motor(power)</code></div>
<div class="component-label servo-label" id="servo-label"><strong>2 · SERVO</strong><span>Joint tilts lamp up / down</span><code>servo(degrees)</code></div><div class="camera-tools"><button id="zoom-in" aria-label="Zoom in">+</button><button id="zoom-out" aria-label="Zoom out">−</button><button id="top-view" aria-label="Top view">${icons.cube}</button><button id="view-reset" aria-label="Reset camera">${icons.reset}</button></div><div class="scene-caption">DRAG TO ORBIT <span>·</span> SCROLL TO ZOOM <span>·</span> RIGHT-DRAG TO PAN</div></div><p class="motion-key"><code>motor</code> turns the tower + pointer. <code>servo</code> tilts the lamp.<br><code>wait(ticks)</code> lets both movements advance. <code>motor(0)</code> stops the turn.</p><div id="crew-status" class="crew-status" role="status" aria-live="polite">${missions.beacon.waiting}</div><section id="patrol-progress" class="patrol-progress" aria-label="Route checkpoint progress" hidden></section><div class="telemetry"><div><span>LIGHT DIRECTION</span><strong id="pointer-value">0.0<em>°</em></strong><small id="pointer-target">target 60°</small></div><div><span>TILT SERVO</span><strong id="scanner-value">90.0<em>°</em></strong><small id="scanner-target">target 120°</small></div><div><span>SIMULATED TIME</span><strong id="time-value">0.00<em>s</em></strong><small>50 ticks / second</small></div></div></section>
<section id="code-panel" class="code-panel" aria-label="Python editor"><div class="panel-heading"><span id="file-name" class="file-name"><i>Py</i> signal.py</span><label class="language-control">LANGUAGE <select id="language" aria-label="Programming language"><option value="python">Python</option><option value="java">Java</option></select></label></div><p class="editor-help" id="editor-help"># lines are notes. <code>await</code> waits for a robot call to return. <a href="#value-guide">Number guide ↓</a></p><div class="experiment-tools"><p id="next-edit"></p><button id="find-edit">Find first edit</button><a href="#lesson-coach">Prediction & free hints ↓</a><p id="predict-reminder"></p></div><div class="editor-wrap"><pre id="line-numbers" aria-hidden="true"></pre><div class="editor-surface"><pre class="code-highlight" aria-hidden="true"><code id="highlighted-code"></code></pre><textarea id="code" aria-label="Python code" aria-describedby="editor-shortcuts" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off"></textarea></div></div><p id="editor-shortcuts" class="editor-shortcuts">Tab: indent · Shift+Tab: unindent · Esc, then Tab: leave editor</p><div class="editor-footer"><span id="draft-status">Draft saved on this device</span><button id="restore">${icons.reset} Restore example</button><button id="return-draft" hidden>Return to my draft</button></div><div class="run-bar"><button id="run" class="primary">${icons.play} Run code <kbd>⌘ ↵</kbd></button><button id="stop" disabled>${icons.stop} Stop</button><button id="reset" aria-label="Reset robot">${icons.reset} Reset</button></div><div class="console-heading"><span>CONSOLE</span><span id="runtime-label">Ready for your code</span></div><pre id="console" tabindex="0" aria-label="Python console">Your print() output will appear here.</pre></section>
</div>
<section id="feedback" class="feedback" role="status" aria-live="polite"><div class="feedback-icon">↗</div><div><h2 id="feedback-title">What do you think will happen?</h2><p id="feedback-text">Will the beam reach the crew? Run the example, then change how long the motor turns.</p></div><span id="status-pill">READY</span></section>
<section class="practice-nav" aria-label="Mission 1 practice progress"><div><span class="eyebrow">MISSION 1 · THREE PRACTICE RESCUES</span><p id="practice-progress">0 of 3 crew locations reached in this visit.</p><p id="next-help">Light this crew’s pickup point to unlock the next rescue, or choose a location above.</p></div><button id="next-rescue" disabled>Next rescue: East lookout →</button></section>
<section id="lesson-coach" class="lesson-coach" aria-label="Mission coaching" hidden></section>
<section id="value-guide" class="value-guide" aria-labelledby="value-title"><span class="eyebrow">READ THE NUMBERS BEFORE YOU RUN</span><h2 id="value-title">What does each value do?</h2><div class="value-cards"><article><h3><code>motor(0.5)</code> · turning power</h3><p><strong>Allowed: −1 to 1, including both ends.</strong> Decimals work. Positive turns right; negative turns left; 0 stops.</p><p>0.5 means half power: 30° each simulated second. 1 means full power: 60° each second. Power chooses speed and direction, not a destination angle.</p></article><article><h3><code>servo(120)</code> · tilt position</h3><p><strong>Allowed: 0° to 180°, including both ends.</strong> Decimals work. 90° is level, 120° points 30° up, and 60° points 30° down.</p><p>This sets the angle to move toward. The head moves as time advances with <code>wait</code>.</p></article><article><h3><code>wait(turn_ticks)</code> · movement time</h3><p><strong>Allowed: 1 to 600 whole ticks per call.</strong> A tick is one small step of the simulation: 0.02 seconds.</p><p>50 ticks = 1 second. 100 = 2 seconds. 600 = 12 seconds. <code>turn_ticks = 50</code> stores that count in a variable; <code>wait(turn_ticks)</code> uses it.</p></article></div><div class="range-notes"><p><strong>Outside the range?</strong> <code>motor(2)</code>, <code>servo(200)</code> or <code>wait(0)</code> stops the run with an error. A fraction such as <code>wait(2.5)</code> also fails. Your draft stays; fix the value and Run again. The robot checks ranges when you call a command. Python also checks types at runtime; Java checks declared types during compilation. In Java, waitTicks takes an int (a whole number).</p><p><strong>Valid numbers can still miss.</strong> That is an experiment, not a code error. The direction dial has travel stops at −150° and 150°; reaching a stop clamps movement instead of raising a range error. Stop the motor with <code>motor(0)</code>. A run also stops if it exceeds 30 simulated seconds or its runtime limits.</p><p><strong>Reading and printing:</strong> <code>angle()</code> reads the light’s current direction. <code>round</code> rounds that reading to a whole degree for display; <code>print</code> writes it in the console. These do not move the robot.</p></div></section>
<section class="real-world" aria-labelledby="real-world-title"><div><span class="eyebrow">WHY THIS MATTERS</span><h2 id="real-world-title">You’re programming where a machine looks.</h2><p>The pointer is the searchlight’s direction dial. Turning it moves the whole light. Tilting the head changes how high it looks. When you aim both and stop, the crew’s pickup point lights up.</p></div><div class="real-world-example"><span class="eyebrow">REAL LIFE MACHINES / ROBOTS</span><h3>Point a camera at a doorway.</h3><p>A camera on a pan-and-tilt mount uses the same two movements: turn toward the door, then tilt to see who is there. Your code would give a real controller those movement instructions.</p><a href="https://learn.adafruit.com/mini-pan-tilt-kit-assembly?view=all" target="_blank" rel="noopener noreferrer">See a real pan-and-tilt mechanism ↗</a><p class="model-note">This game uses a simplified motor. Real hardware needs its own driver code, measured speeds and position checks; these programs run in the game.</p></div></section>
<section id="play-guide" class="guide"><div class="guide-heading"><span class="eyebrow">A LITTLE HELP, WHEN YOU NEED IT</span><h2>You’re in control.</h2></div><details><summary><span>01</span> How do I get the light onto the crew? <b>+</b></summary><p>The first beam stops short of the hikers. At half power, the motor turns 30° each second. There are 50 ticks in a second. The example waits 50 ticks and moves 30°. How many ticks would make it turn 60° and reach the north ridge? Change <code>turn_ticks</code>, then Run code.</p><p>Run starts from zero each time. Reset returns the robot to its starting position and keeps your code. Restore example keeps one return copy of your draft on this device. Use Return to my draft to get it back.</p></details><details id="robot-help"><summary><span>02</span> What can my robot do? <b>+</b></summary><div class="api-table"><code>await motor(0.5)</code><span>Power −1 to 1. Negative turns left; 0 stops.</span><code>await servo(120)</code><span>Tilt the light: 90° is level; 120° points 30° up; 60° points 30° down.</span><code>await wait(50)</code><span>Advance 50 ticks, or 1 simulated second.</span><code>await angle()</code><span>Read the direction dial: where the light faces.</span><code>await scanner()</code><span>Read the tilt servo’s angle (the API calls it scanner).</span></div><p id="await-guide"><strong>What does await mean?</strong> Pause this program until the robot call returns; the page can still respond. <code>await motor(0.5)</code> and <code>await servo(120)</code> return when the setting is accepted, before movement. They do not wait for a part to reach its goal. <code>await wait(50)</code> lets both parts move for 50 ticks (1 simulated second), then continues. <code>await angle()</code> gets the current sensor reading. Calculations, <code>round</code> and <code>print</code> do not need await.</p><p>Time advances only when you wait. A short wait may leave the servo still moving toward its goal. The motor travels from −150° to 150°.</p></details><details><summary><span>03</span> Ready for a new experiment? <b>+</b></summary><p>Choose “East lookout.” A crew needs help farther to the right: predict the ticks for 90°. Then try “Lower cove”: this crew is left and below you. Use negative motor power, tilt to 60°, and stop at −60°.</p><p>Tell your co-pilot: who did your code help, and what did the machine do for them? Now imagine aiming a camera at a lower doorway. Which command changes its height? If your turn motor ran twice as fast, would you wait longer or less? Explain before testing.</p></details></section>
<footer><span>RoboLab <i>/</i> Small experiments. Real understanding.</span><span>Python + Java · Family multiplayer planned</span></footer>
</main>`;
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const code = el<HTMLTextAreaElement>('code');
// Keep Run and help above the long commented program.
el('code-panel').insertBefore(document.querySelector('.run-bar')!,document.querySelector('.editor-wrap'));
const experiments=new Map<string,Experiment>();
function experimentFor(lang=language,id=lesson):Experiment {
  const key=storageKey(lang,id), source=lessonDrafts[id][lang];
  if(!experiments.has(key)){let raw=null;try{raw=localStorage.getItem(key+'.experiment');}catch{}experiments.set(key,readExperiment(raw,source,id));}
  return experiments.get(key)!;
}
function renderCoach(){renderTeaching(lesson,language,selected,experimentFor(),saveDraft);el('return-draft').hidden=!experimentFor().previous;}

let language: Language = 'python';
let draftPrefix = 'robolab.s01';
const lessonDrafts = {L01:{python:pythonStarter,java:javaStarter},L02:{...getLesson('L02').starters},L03:{...getLesson('L03').starters}};
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
  el('editor-help').innerHTML=java?'// lines are notes. Robot calls wait for a reply; use <code>Robot.waitTicks</code> to advance motion. <a href="#value-guide">Number guide ↓</a>':pythonHelp;
  document.querySelector('.api-table')!.innerHTML=java?'<code>Robot.motor(0.5);</code><span>Power −1 to 1. Negative turns left; 0 stops.</span><code>Robot.servo(120);</code><span>Tilt 0° to 180°. 90° is level.</span><code>Robot.waitTicks(50);</code><span>Advance 50 ticks: 1 simulated second.</span><code>Robot.angle();</code><span>Read the current direction.</span><code>Robot.scanner();</code><span>Read the tilt servo angle.</span>':pythonApi;
  el('await-guide').innerHTML=java?'<strong>Why is there no await?</strong> These Java calls block this program until the robot replies; the page stays responsive. Setting motor power or servo position does not advance time or wait for arrival. <code>Robot.waitTicks(50)</code> advances both parts for 1 simulated second. <code>Robot.clock()</code> reads simulated seconds. Java checks types before running: <code>int</code> holds whole numbers, <code>double</code> allows decimals. A semicolon ends a statement; braces group the class and method. Keep <code>public class Main</code> and its <code>main</code> method; put your commands inside the method.':pythonAwait;
  const examples: Record<string,string> = {'decision_angle':'decisionAngle', 'motor(0.5)':'Robot.motor(0.5)', 'servo(120)':'Robot.servo(120)', 'wait(turn_ticks)':'Robot.waitTicks(turn_ticks)', 'wait(50)':'Robot.waitTicks(50)', 'turn_ticks = 50':'int turn_ticks = 50;', 'motor(2)':'Robot.motor(2)', 'servo(200)':'Robot.servo(200)', 'wait(0)':'Robot.waitTicks(0)', 'wait(2.5)':'Robot.waitTicks(2.5)', 'motor(0)':'Robot.motor(0)', 'angle()':'Robot.angle()', 'round':'Math.round', 'print':'System.out.println', 'wait(ticks)':'Robot.waitTicks(ticks)'};
  document.querySelectorAll<HTMLElement>('#value-guide code, .motion-key code').forEach(node=>{
    const py=node.dataset.python ?? node.textContent!; node.dataset.python=py; node.textContent=java?(examples[py]??py):py;
  });
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
  updatePractice();
  scene?.update(state, goal, success);
}
function updatePractice() {
  const index = locationOrder.indexOf(selected);
  const badges=el('practice-badges');if(badges){const content=lesson!=='L01'?locationOrder.map((t,i)=>`<span class="${completedLocations.has(t)?'earned':''}">${completedLocations.has(t)?'✓':'○'} ${(lesson==='L03'?['Ridge sweep','Extra checkpoint','Cove return']:['Right-turn rescue','Left-turn rescue','Transfer rescue'])[i]}</span>`).join(''):'';if(badges.innerHTML!==content)badges.innerHTML=content;badges.hidden=lesson==='L01';}
  el('practice-progress').textContent = `${locationOrder.filter(t=>completedLocations.has(t)).length} of 3 ${lesson==='L01'?'crew locations reached':lesson==='L03'?'patrol badges earned':'recovery badges earned'} in this visit.`;
  const next = el<HTMLButtonElement>('next-rescue');
  next.hidden = index === locationOrder.length - 1;
  next.disabled = !completedLocations.has(selected) || status === 'loading' || status === 'running';
  next.textContent = `${lesson==='L03'?'Next patrol':'Next rescue'}: ${missions[locationOrder[index + 1] ?? selected].location} →`;
  const complete=locationOrder.every(t=>completedLocations.has(t));
  const nextLesson=el<HTMLButtonElement>('next-lesson');if(nextLesson){const nextId=getLesson(lesson).next;nextLesson.hidden=!nextId;nextLesson.textContent=nextId?`Mission ${Number(nextId.slice(1))}: ${getLesson(nextId).title} →`:'';nextLesson.disabled=!complete;}
  el('next-help').textContent = complete
    ? (getLesson(lesson).next?`All three challenges completed in this visit! Continue to Mission ${Number(getLesson(lesson).next!.slice(1))}, or revisit a case.`:'All three patrol badges earned! Mission 4 is coming soon. Revisit a route or explain how your loop adapted.')
    : index === locationOrder.length - 1
      ? `This is the last practice ${lesson==='L03'?'patrol':'rescue'} in Mission ${missionNumber()}. Choose an unfinished case above. ${lesson==='L03'?'Mission 4 is coming soon.':''}`
      : completedLocations.has(selected)
        ? `Ready for another case? Your code stays so you can adapt it. These are variations within Mission ${missionNumber()}.`
        : (lesson==='L03'?'Log every checkpoint and stop at the last one to finish this patrol.':'Light this crew’s pickup point to unlock the next rescue, or choose a location above.');
}
function feedback(title: string, text: string, kind = '') {
  el('feedback-title').textContent = title; el('feedback-text').textContent = text; el('feedback').className = `feedback ${kind}`;
}
function saveDraft() {
  highlight(language);
  el('line-numbers').textContent = code.value.split('\n').map((_, i) => i + 1).join('\n');
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
  if (next === 'loading') feedback('Getting the station ready…', `${name} runs in its own sandbox. You can stop at any time.`);
  if (next === 'running') feedback('Watch your numbers become movement.', lesson==='L03'?'Watch each stop: moving gets you there; a steady hold logs the checkpoint.':'Watch the beam: motor power turns it sideways, and the servo tilts it toward the crew.');
  if (next === 'finished') {
    const worked=el<HTMLButtonElement>('show-solution');if(worked)worked.disabled=false;
    success = reached(state, targets[selected]);
    if (success) completedLocations.add(selected);
    if(lesson==='L03'){const miss=patrolFailure(state,selected);feedback(success?'Route ready. Rangers can set out!':miss.title,success?'Every checkpoint received a steady hold. Explain which calls repeated and which ran once. Try a changed route; retries and hints are free.':miss.text,success?'success':'try-again');}
    else if (success) feedback('Crew located. Pickup point lit!', lesson==='L02'
      ? `Your code recovered the light for the ${selected==='sensor-transfer'?'lower cove':'north ridge'} crew. Explain how the sensor reading chose the turn, and why the same comparison works from the other side. Then try another case.`
      : `Your code held the light on the ${missions[selected].location.toLowerCase()} crew. The rescue team can now see where to go. Try another crew, then explain how your timing helped.`, 'success');
    else feedback('A useful experiment. Try one change.', `The crew is still waiting for a steady light. Direction: ${state.angle.toFixed(1)}° / ${targets[selected].angle}°. Tilt servo: ${state.scanner.toFixed(1)}° / ${targets[selected].scanner}°. ${state.power ? `Remember ${language==='java'?'Robot.motor(0);':'await motor(0)'} to stop.` : lesson==='L02'?'Compare the Read, Decision and Now lines in your console with the crew’s target. Check the chosen branch, movement and tilt, then Run again.':'Change your timing or direction, then Run again.'}`, 'try-again');
  }
  if (next === 'stopped') feedback('Stopped. Your code is safe.', 'Run again from this case’s starting direction, or Reset. Your draft stays.');
  if (next === 'error') {
    const worked=el<HTMLButtonElement>('show-solution');if(worked)worked.disabled=false;
    const error = detail || `${name} was interrupted. Try again.`;
    const hint = language==='java' && error.includes('possible lossy conversion') ? 'Java cannot put a decimal into an int. Counts and waitTicks need whole numbers; use double for values that allow decimals. See the original compiler error below.' : error.includes('SyntaxError') ? 'Python found a syntax error. Check the line shown in the console.' : error.includes('NameError') ? 'Python found an unknown name. Check spelling and your imports in the console.' : error.split('\n').at(-1)!;
    feedback('Let’s fix that and try again.', hint, 'error');
    el('console').textContent += `\n${error}`;
  }
  if(!active && attempt){el('prediction-feedback').textContent=`Run from ${initialState(selected).angle}°: ${attemptPrediction || 'No prediction recorded.'} Result: ${next}; direction ${state.angle.toFixed(1)}°, tilt ${state.scanner.toFixed(1)}°${state.patrol?`, ${state.patrol.visited} checkpoints logged`:''}. Compare this run with your prediction before the next edit.`;}
  if(!active) recordAttempt(next==='finished'?(success?'reached':'missed'):next==='stopped'?'stopped':detail?.includes('unavailable')?'unavailable':'error',detail);
  showState();
}
function run() {
  if (status === 'loading' || status === 'running' || family.isChecking()) return;
  const current = ++generation;
  runner?.stop(); state = initialState(selected); success = false; showState(); el('console').textContent = '';
  saveDraft();attemptPrediction=experimentFor().prediction;
  attempt={id:crypto.randomUUID(),source:code.value,language,target:selected};
  try { runner = new Runner(code.value, {
    snapshot: value => { if (generation === current) { state = value; showState(); } },
    status: (value, detail) => { if (generation === current) setStatus(value, detail); },
    output: text => { if (generation === current) { el('console').textContent += text; el('console').scrollTop = el('console').scrollHeight; } },
  }, language, selected); } catch (e) { setStatus('error', String(e)); }
}
function reset() {
  recordAttempt('stopped');
  ++generation; runner?.stop(); runner = undefined; state = initialState(selected); success = false; status = 'idle';
  el<HTMLButtonElement>('run').disabled = false; el<HTMLButtonElement>('stop').disabled = true;
  el('status-pill').textContent = 'READY'; el('runtime-label').textContent = 'Ready for your code'; el('console').textContent = language==='java'?'Your System.out.println output will appear here.':'Your print() output will appear here.';
  feedback('A fresh start for your next idea.', 'Your code is still here. Change a number, make a prediction, and Run.'); showState();
}
el<HTMLSelectElement>('language').onchange = event => {
  if(family.isChecking()){el<HTMLSelectElement>('language').value=language;feedback('Wait for the progress check.','Stop the check before switching languages.');return;}
  saveDraft(); reset();
  language=(event.target as HTMLSelectElement).value==='java'?'java':'python';
  selected=experimentFor().target;state=initialState(selected);code.value=drafts[language]; code.scrollTop=0; code.scrollLeft=0;lessonUI(); languageUI();renderCoach();saveDraft();showState();
  try {localStorage.setItem('robolab.s01.language',language);} catch {}
  feedback(`${language==='java'?'Java':'Python'} draft ready.`, 'Each language keeps its own code. Switching stops the old run; your crew progress stays.');
};
el('run').onclick = run;
el('stop').onclick = () => runner?.stop();
el('reset').onclick = reset;
el('restore').onclick = () => {
  if(family.isChecking())return;
  const experiment=experimentFor();
  // Repeated Restore clicks must not overwrite the student's return copy.
  if(!experiment.previous)experiment.previous={source:code.value,target:selected};
  reset();code.value=starters[language];experiment.prediction='';experiment.reflection='';saveDraft();renderCoach();
  feedback('Example restored. Your draft has a return copy.', 'The example was written for the first challenge. Your selected challenge stays; compare the two before running. Return to my draft restores your saved code and challenge.');
};
el('return-draft').onclick=()=>{
  if(family.isChecking())return;
  const experiment=experimentFor(),previous=experiment.previous;if(!previous)return;
  reset();selected=previous.target;state=initialState(selected);code.value=previous.source;delete experiment.previous;experiment.prediction='';experiment.reflection='';saveDraft();lessonUI();languageUI();renderCoach();showState();
  feedback('Your draft and challenge are back.', 'Predict from this code before running again.');
};
el('find-edit').onclick=()=>{
  const pattern=lesson==='L01'?/^(?:\s*int )?\s*turn_ticks\s*=/m:lesson==='L02'?/^\s*if[ (]/m:/^(?:\s*int )?\s*repeats\s*=/m;
  const match=pattern.exec(code.value);code.focus();
  if(match){const start=match.index+match[0].search(/\S/);code.setSelectionRange(start,code.value.indexOf('\n',start)<0?code.value.length:code.value.indexOf('\n',start));code.scrollTop=Math.max(0,(code.value.slice(0,start).split('\n').length-3)*parseFloat(getComputedStyle(code).lineHeight));code.dispatchEvent(new Event('scroll'));}
  else feedback('This draft uses a different structure.', 'Find the value or condition you want to test in your code; your draft is unchanged.');
};
function selectLocation(value: string) {
  if(family.isChecking()){el<HTMLSelectElement>('target').value=selected;feedback('Wait for the progress check.','Stop the check before changing rescues.');return;}
  if(!locationOrder.includes(value))return;
  reset(); selected = value;state=initialState(selected);
  el<HTMLSelectElement>('target').value = value;
  el('mission-job').textContent = missions[selected].job;
  el('goal-angle').textContent = `${targets[selected].angle}°`; el('goal-scanner').textContent = `${targets[selected].scanner}°`;
  el('pointer-target').textContent = `target ${targets[selected].angle}°`; el('scanner-target').textContent = `target ${targets[selected].scanner}°`;
  experimentFor().prediction='';experimentFor().reflection='';saveDraft();renderCoach();
  feedback(lesson==='L02'&&selected!=='sensor-transfer'?'New starting side. Keep the same code.':'New challenge. What will you change?', lesson==='L03'?'Keep your code and compare the route’s count, spacing, direction and tilt. Which setting controls each change?':lesson==='L02'?(selected==='sensor-transfer'?'Compare this crew’s direction and height with the previous case. Predict which values need to change and why, then test your idea.':'Keep your code: the sensor reading should choose the other turn. Predict which branch will run.'):selected === 'reverse' ? 'The cove is left and below: try negative motor power and tilt the servo to 60°. Keep your code and experiment.' : 'Keep the same power. Predict how many ticks this new angle will need.'); showState();
}
el<HTMLSelectElement>('target').onchange = event => selectLocation((event.target as HTMLSelectElement).value);
el('next-rescue').onclick = () => {
  const next = locationOrder[locationOrder.indexOf(selected) + 1];
  if (next && completedLocations.has(selected) && status !== 'loading' && status !== 'running') selectLocation(next);
};
el('view-reset').onclick = () => scene?.reset(); el('top-view').onclick = () => scene?.top();
el('zoom-in').onclick = () => scene?.zoom(.85); el('zoom-out').onclick = () => scene?.zoom(1.18);
const firstIntro=document.querySelector('.intro')!.innerHTML;
const firstWorld=document.querySelector('.real-world')!.innerHTML;
const firstValues=el('value-guide').innerHTML;
const firstHelp=document.querySelector('#play-guide details')!.innerHTML;
const lastHelp=document.querySelector('#play-guide details:last-child')!.innerHTML;
const firstInstruction=document.querySelector('.mission-instruction')!.innerHTML;
const badgeList=document.createElement('div');badgeList.id='practice-badges';badgeList.className='practice-badges';document.querySelector('.practice-nav>div')!.append(badgeList);
const nextMission=document.createElement('button');nextMission.id='next-lesson';nextMission.textContent='Mission 2: Read, then choose →';nextMission.disabled=true;document.querySelector('.practice-nav')!.append(nextMission);nextMission.onclick=()=>{const next=getLesson(lesson).next;if(next)selectLesson(next);};
function lessonUI(){
  const info=getLesson(lesson),sensor=lesson==='L02';
  el('patrol-progress').hidden=lesson!=='L03';
  el('target-label').textContent=lesson==='L03'?'CHOOSE YOUR PATROL':'WHERE IS THE CREW?';
  if(lesson==='L03'){patrolUI(selected);renderCoach();return;}
  el<HTMLSelectElement>('lesson').value=lesson;
  document.querySelector('.intro')!.innerHTML=sensor?'<div><div class="eyebrow">MISSION 02 / READING → DECISION → MOVEMENT</div><h1>Read, then choose<span>.</span></h1><p>Get the rescue light back on target, from either side.</p></div><div class="mission-stamp"><span>YOUR CODE HAS A JOB</span><strong>Measure first. Make the call.</strong></div>':firstIntro;
  document.querySelector('.mission-number')!.textContent=sensor?'02':'01';
  document.querySelector('.mission-copy h2')!.textContent=sensor?'Recover the rescue light':'Put the stranded crew in the light';
  document.querySelector('.mission-instruction')!.innerHTML=sensor?'Turn to <strong id="goal-angle">60°</strong> · Tilt to <strong id="goal-scanner">120°</strong> · Hold still. Fix the <code>if</code> comparison; test both starting sides.':firstInstruction;
  el<HTMLSelectElement>('target').innerHTML=locationOrder.map((t,i)=>`<option value="${t}">${i+1} · ${missions[t].location}</option>`).join('');
  el<HTMLSelectElement>('target').value=selected;
  el('mission-job').textContent=missions[selected].job;
  el('goal-angle').textContent=`${targets[selected].angle}°`;el('goal-scanner').textContent=`${targets[selected].scanner}°`;
  el('pointer-target').textContent=`target ${targets[selected].angle}°`;el('scanner-target').textContent=`target ${targets[selected].scanner}°`;
  document.querySelector('.practice-nav')!.setAttribute('aria-label',`Mission ${sensor?2:1} practice progress`);
  document.querySelector('.practice-nav .eyebrow')!.textContent=sensor?'MISSION 2 · THREE RECOVERY BADGES':'MISSION 1 · THREE PRACTICE RESCUES';
  document.querySelector('.real-world')!.innerHTML=sensor?`<div><span class="eyebrow">WHY THIS MATTERS</span><h2 id="real-world-title">A robot can measure before it moves.</h2><p>${info.job} A fixed right turn only works from one side. The sensor lets your code choose.</p><p><strong>Other real-life applications:</strong> ${info.otherApplications}</p></div><div class="real-world-example"><span class="eyebrow">REAL LIFE MACHINES / ROBOTS</span><h3>Position sensors on robot joints</h3><p>${info.application}</p><a href="${info.source}" target="_blank" rel="noopener noreferrer">See FIRST robotics position-sensor documentation ↗</a><p class="model-note">Our angle sensor is an ideal absolute reading, with no noise or delay. Real encoders can be relative or absolute; their units and zero need calibration. This one-read correction works only for our declared 30° offsets. A real moving target needs repeated sensing, taught later.</p></div>`:firstWorld;
  document.querySelector('#play-guide details')!.innerHTML=sensor?'<summary><span>01</span> Why read before turning? <b>+</b></summary><p>The station starts at 30° or 90° while the crew is at 60°. One needs a right turn; the other needs a left turn. A variable stores one reading, not a live connection. Read again after movement to see the new direction.</p><p>Reset and Run both restore the chosen case’s starting direction. Your code stays. Use the mission selector to return to Mission 1; each mission has separate Python and Java drafts.</p>':firstHelp;
  document.querySelector('#play-guide details:last-child')!.innerHTML=sensor?`<summary><span>03</span> Can your rule handle a changed job? <b>+</b></summary><p>${info.transfer}</p><p>Ready to move on? Explain which branch ran at 30° and at 90°, why the old reading stays unchanged, and what a real robot would need to measure again. A green rescue is evidence of a working run; understanding still needs your explanation.</p>`:lastHelp;
  el('value-guide').innerHTML=sensor?firstValues.replace('<code>wait(turn_ticks)</code>','<code>wait(50)</code>').replace('50 ticks = 1 second. 100 = 2 seconds. 600 = 12 seconds. <code>turn_ticks = 50</code> stores that count in a variable; <code>wait(turn_ticks)</code> uses it.','50 ticks = 1 second. At half power that moves 30°, exactly the gap in each Mission 2 case. 100 ticks would move 60° and overshoot.').replace('<div class="range-notes">','<div class="range-notes"><p><strong>Compare, move, check:</strong> <code>decision_angle</code> is a comparison value in degrees. The <code>if</code> compares <code>reading</code> with it to choose a branch. Motor power and the wait duration determine how far the light turns; this variable does not tell the motor where to stop. Changing it can leave the same branch selected and produce the same movement.</p><p>The crew’s target is set by the selected rescue. Success checks where the stopped beam actually points, not whether a variable matches that target. The comparison value has no robot API range check; an unusual value can choose an unhelpful branch without causing an error. Older saved code may call this value <code>goal</code>; the role is the same.</p><p><strong>Try an experiment:</strong> Choose a nearby comparison value. Predict whether Decision and Now will change, then test both starting sides. Which line controls the amount of turning?</p>'):firstValues;
  el('scene').dataset.sensor=String(sensor);
  el('motor-label').innerHTML='<strong>1 · MOTOR</strong><span>Base turns left / right</span><code>motor(power)</code>'+(sensor?'<small id="direction-sensor-label">SENSOR · angle()<br>Reads base direction</small>':'');
  renderCoach();
}
function selectLesson(id:LessonId,target?:string,lang:Language=language,source?:string){
  if(family.isChecking()){el<HTMLSelectElement>('lesson').value=lesson;feedback('Wait for the progress check.','Stop the check before changing missions.');return;}
  saveDraft();reset();language=lang;lesson=id;starters=getLesson(id).starters;drafts=lessonDrafts[id];locationOrder=lessonTargets[id];selected=target&&locationOrder.includes(target)?target:experimentFor().target;state=initialState(selected);code.value=source??drafts[language];code.scrollTop=0;code.scrollLeft=0;
  lessonUI();languageUI();saveDraft();showState();
  try{localStorage.setItem(`${draftPrefix}.lesson`,lesson);}catch{}
  feedback('Your draft and challenge are ready.',lesson==='L03'?'Trace the current loop, then compare its counter with actual logged checkpoints.':lesson==='L02'?'Trace the comparison in your current draft. Test the same code from both starting sides.':'Predict what your current values will do, then test one change. Each mission keeps separate drafts.');
}
el<HTMLSelectElement>('lesson').onchange=e=>{const id=(e.target as HTMLSelectElement).value as LessonId;if(lessonIds.includes(id))selectLesson(id);};
const family=attachFamily({
  draft:()=>({source:code.value,language,target:selected,lesson}),
  lesson:()=>lesson,
  openLesson:(id,target)=>selectLesson(id,target),
  draftFor:(lang,id=lesson)=>id===lesson&&lang===language?code.value:lessonDrafts[id][lang],
  targetFor:(lang,id=lesson)=>id===lesson&&lang===language?selected:experimentFor(lang,id).target,
  stop:()=>runner?.stop(),
  load:(lang,source,id=lesson,target)=>{selectLesson(id,target,lang,source);experimentFor().prediction='';experimentFor().reflection='';saveDraft();renderCoach();},
  profile:(id,cloud)=>{
    saveDraft();reset();completedLocations.clear();
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
  document.querySelector('.build-status')!.textContent='Three missions in Python and Java. Sign in for hosted Java, separate saved mission drafts, checked rescues and shared family progress.';
  document.querySelector('footer span:last-child')!.textContent='Python + Java · Private family progress';
}
// Read context before the first save can overwrite it.
selected=experimentFor().target;state=initialState(selected);lessonUI();languageUI();saveDraft();showState();

try{const saved=localStorage.getItem(`${draftPrefix}.lesson`) as LessonId;if(lessonIds.includes(saved))selectLesson(saved);}catch{}
