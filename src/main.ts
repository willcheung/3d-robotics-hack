import './style.css';
import { initialState, reached, targets, type State } from './model.ts';
import { Runner, type RunStatus } from './runner.ts';
import { StationScene } from './scene.ts';
import { attachEditor } from './editor.ts';
import { attachHighlighting } from './highlighting.ts';
import { attachFamily } from './family.ts';
import { pythonStarter, javaStarter } from './starters.ts';
type Language = 'python' | 'java';
const starters = {python:pythonStarter,java:javaStarter};
const missions: Record<string, { location: string; job: string; waiting: string; found: string }> = {
  beacon: { location: 'North ridge', job: 'Two hikers are stranded on the north ridge. Aim and hold the searchlight on them so the rescue team can find their pickup point.', waiting: 'North ridge crew · waiting for light', found: 'North ridge crew located · pickup point lit' },
  farther: { location: 'East lookout', job: 'A second crew is waiting at the east lookout. Turn the same searchlight farther to mark their pickup point for the rescue team.', waiting: 'East lookout crew · waiting for light', found: 'East lookout crew located · pickup point lit' },
  reverse: { location: 'Lower cove', job: 'This crew is below the station, in the lower cove. Turn left and tilt the searchlight down to show the rescue team where they are.', waiting: 'Lower cove crew · waiting for light', found: 'Lower cove crew located · pickup point lit' },
};
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
<p class="build-status">Run real Python or Java in one mission with three practice rescues. Each language keeps its own draft. More lessons and family results are planned.</p>
<section class="mission-card" aria-label="Your mission"><div class="mission-number">01</div><div class="mission-copy"><h2>Put the stranded crew in the light</h2><p id="mission-job">${missions.beacon.job}</p><p class="mission-instruction">Turn to <strong id="goal-angle">60°</strong> · Tilt servo to <strong id="goal-scanner">120°</strong> · Hold still. Change <code>turn_ticks</code> to control how long the motor turns.</p></div><label class="target-select">WHERE IS THE CREW?<select id="target" aria-label="Challenge target"><option value="beacon">01 · North ridge / 60°</option><option value="farther">02 · East lookout / 90°</option><option value="reverse">03 · Lower cove / −60°</option></select></label></section>
<div class="workbench">
<section class="world-panel" aria-label="Robot workbench"><div class="panel-heading"><span><span class="live-dot"></span> RESCUE STATION</span><span id="graphics-label" class="tiny-label">LIVE 3D</span></div><div id="scene" class="scene"><div class="scene-tag"><span>SS—01</span><strong>SIGNAL STATION</strong><small>Motor turns · servo tilts</small></div><div class="scene-legend"><i></i> CREW PICKUP POINT</div>
<svg class="component-lines" aria-hidden="true"><g data-part="motor"><line/><circle r="5"/></g><g data-part="servo"><line/><circle r="5"/></g></svg>
<div class="component-label motor-label" id="motor-label"><strong>1 · MOTOR</strong><span>Base turns left / right</span><code>motor(power)</code></div>
<div class="component-label servo-label" id="servo-label"><strong>2 · SERVO</strong><span>Joint tilts lamp up / down</span><code>servo(degrees)</code></div><div class="camera-tools"><button id="zoom-in" aria-label="Zoom in">+</button><button id="zoom-out" aria-label="Zoom out">−</button><button id="top-view" aria-label="Top view">${icons.cube}</button><button id="view-reset" aria-label="Reset camera">${icons.reset}</button></div><div class="scene-caption">DRAG TO ORBIT <span>·</span> SCROLL TO ZOOM <span>·</span> RIGHT-DRAG TO PAN</div></div><p class="motion-key"><code>motor</code> turns the tower + pointer. <code>servo</code> tilts the lamp.<br><code>wait(ticks)</code> lets both movements advance. <code>motor(0)</code> stops the turn.</p><div id="crew-status" class="crew-status" role="status" aria-live="polite">${missions.beacon.waiting}</div><div class="telemetry"><div><span>LIGHT DIRECTION</span><strong id="pointer-value">0.0<em>°</em></strong><small id="pointer-target">target 60°</small></div><div><span>TILT SERVO</span><strong id="scanner-value">90.0<em>°</em></strong><small id="scanner-target">target 120°</small></div><div><span>SIMULATED TIME</span><strong id="time-value">0.00<em>s</em></strong><small>50 ticks / second</small></div></div></section>
<section id="code-panel" class="code-panel" aria-label="Python editor"><div class="panel-heading"><span id="file-name" class="file-name"><i>Py</i> signal.py</span><label class="language-control">LANGUAGE <select id="language" aria-label="Programming language"><option value="python">Python</option><option value="java">Java</option></select></label></div><p class="editor-help" id="editor-help"># lines are notes. <code>await</code> waits for a robot call to return. <a href="#value-guide">Number guide ↓</a></p><div class="editor-wrap"><pre id="line-numbers" aria-hidden="true"></pre><div class="editor-surface"><pre class="code-highlight" aria-hidden="true"><code id="highlighted-code"></code></pre><textarea id="code" aria-label="Python code" aria-describedby="editor-shortcuts" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off"></textarea></div></div><p id="editor-shortcuts" class="editor-shortcuts">Tab: indent · Shift+Tab: unindent · Esc, then Tab: leave editor</p><div class="editor-footer"><span id="draft-status">Draft saved on this device</span><button id="restore">${icons.reset} Restore example</button></div><div class="run-bar"><button id="run" class="primary">${icons.play} Run code <kbd>⌘ ↵</kbd></button><button id="stop" disabled>${icons.stop} Stop</button><button id="reset" aria-label="Reset robot">${icons.reset} Reset</button></div><div class="console-heading"><span>CONSOLE</span><span id="runtime-label">Ready for your code</span></div><pre id="console" tabindex="0" aria-label="Python console">Your print() output will appear here.</pre></section>
</div>
<section id="feedback" class="feedback" role="status" aria-live="polite"><div class="feedback-icon">↗</div><div><h2 id="feedback-title">What do you think will happen?</h2><p id="feedback-text">Will the beam reach the crew? Run the example, then change how long the motor turns.</p></div><span id="status-pill">READY</span></section>
<section class="practice-nav" aria-label="Mission 1 practice progress"><div><span class="eyebrow">MISSION 1 · THREE PRACTICE RESCUES</span><p id="practice-progress">0 of 3 crew locations reached in this visit.</p><p id="next-help">Light this crew’s pickup point to unlock the next rescue, or choose a location above.</p></div><button id="next-rescue" disabled>Next rescue: East lookout →</button></section>
<section id="value-guide" class="value-guide" aria-labelledby="value-title"><span class="eyebrow">READ THE NUMBERS BEFORE YOU RUN</span><h2 id="value-title">What does each value do?</h2><div class="value-cards"><article><h3><code>motor(0.5)</code> · turning power</h3><p><strong>Allowed: −1 to 1, including both ends.</strong> Decimals work. Positive turns right; negative turns left; 0 stops.</p><p>0.5 means half power: 30° each simulated second. 1 means full power: 60° each second. Power chooses speed and direction, not a destination angle.</p></article><article><h3><code>servo(120)</code> · tilt position</h3><p><strong>Allowed: 0° to 180°, including both ends.</strong> Decimals work. 90° is level, 120° points 30° up, and 60° points 30° down.</p><p>This sets the angle to move toward. The head moves as time advances with <code>wait</code>.</p></article><article><h3><code>wait(turn_ticks)</code> · movement time</h3><p><strong>Allowed: 1 to 600 whole ticks per call.</strong> A tick is one small step of the simulation: 0.02 seconds.</p><p>50 ticks = 1 second. 100 = 2 seconds. 600 = 12 seconds. <code>turn_ticks = 50</code> stores that count in a variable; <code>wait(turn_ticks)</code> uses it.</p></article></div><div class="range-notes"><p><strong>Outside the range?</strong> <code>motor(2)</code>, <code>servo(200)</code> or <code>wait(0)</code> stops the run with an error. A fraction such as <code>wait(2.5)</code> also fails. Your draft stays; fix the value and Run again. The robot checks ranges when you call a command. Python also checks types at runtime; Java checks declared types during compilation. In Java, waitTicks takes an int (a whole number).</p><p><strong>Valid numbers can still miss.</strong> That is an experiment, not a code error. The direction dial has travel stops at −150° and 150°; reaching a stop clamps movement instead of raising a range error. Stop the motor with <code>motor(0)</code>. A run also stops if it exceeds 30 simulated seconds or its runtime limits.</p><p><strong>Reading and printing:</strong> <code>angle()</code> reads the light’s current direction. <code>round</code> rounds that reading to a whole degree for display; <code>print</code> writes it in the console. These do not move the robot.</p></div></section>
<section class="real-world" aria-labelledby="real-world-title"><div><span class="eyebrow">WHY THIS MATTERS</span><h2 id="real-world-title">You’re programming where a machine looks.</h2><p>The pointer is the searchlight’s direction dial. Turning it moves the whole light. Tilting the head changes how high it looks. When you aim both and stop, the crew’s pickup point lights up.</p></div><div class="real-world-example"><span class="eyebrow">REAL LIFE MACHINES / ROBOTS</span><h3>Point a camera at a doorway.</h3><p>A camera on a pan-and-tilt mount uses the same two movements: turn toward the door, then tilt to see who is there. Your code would give a real controller those movement instructions.</p><a href="https://learn.adafruit.com/mini-pan-tilt-kit-assembly?view=all" target="_blank" rel="noopener noreferrer">See a real pan-and-tilt mechanism ↗</a><p class="model-note">This game uses a simplified motor. Real hardware needs its own driver code, measured speeds and position checks; these programs run in the game.</p></div></section>
<section id="play-guide" class="guide"><div class="guide-heading"><span class="eyebrow">A LITTLE HELP, WHEN YOU NEED IT</span><h2>You’re in control.</h2></div><details><summary><span>01</span> How do I get the light onto the crew? <b>+</b></summary><p>The first beam stops short of the hikers. At half power, the motor turns 30° each second. There are 50 ticks in a second. The example waits 50 ticks and moves 30°. How many ticks would make it turn 60° and reach the north ridge? Change <code>turn_ticks</code>, then Run code.</p><p>Run starts from zero each time. Reset returns the robot to its starting position and keeps your code. Restore example replaces your draft with the original.</p></details><details id="robot-help"><summary><span>02</span> What can my robot do? <b>+</b></summary><div class="api-table"><code>await motor(0.5)</code><span>Power −1 to 1. Negative turns left; 0 stops.</span><code>await servo(120)</code><span>Tilt the light: 90° is level; 120° points 30° up; 60° points 30° down.</span><code>await wait(50)</code><span>Advance 50 ticks, or 1 simulated second.</span><code>await angle()</code><span>Read the direction dial: where the light faces.</span><code>await scanner()</code><span>Read the tilt servo’s angle (the API calls it scanner).</span></div><p id="await-guide"><strong>What does await mean?</strong> Pause this program until the robot call returns; the page can still respond. <code>await motor(0.5)</code> and <code>await servo(120)</code> return when the setting is accepted, before movement. They do not wait for a part to reach its goal. <code>await wait(50)</code> lets both parts move for 50 ticks (1 simulated second), then continues. <code>await angle()</code> gets the current sensor reading. Calculations, <code>round</code> and <code>print</code> do not need await.</p><p>Time advances only when you wait. A short wait may leave the servo still moving toward its goal. The motor travels from −150° to 150°.</p></details><details><summary><span>03</span> Ready for a new experiment? <b>+</b></summary><p>Choose “East lookout.” A crew needs help farther to the right: predict the ticks for 90°. Then try “Lower cove”: this crew is left and below you. Use negative motor power, tilt to 60°, and stop at −60°.</p><p>Tell your co-pilot: who did your code help, and what did the machine do for them? Now imagine aiming a camera at a lower doorway. Which command changes its height? If your turn motor ran twice as fast, would you wait longer or less? Explain before testing.</p></details></section>
<footer><span>RoboLab <i>/</i> Small experiments. Real understanding.</span><span>Python + Java · Family multiplayer planned</span></footer>
</main>`;
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const code = el<HTMLTextAreaElement>('code');
let language: Language = 'python';
let draftPrefix = 'robolab.s01';
const drafts = {python:pythonStarter,java:javaStarter};
try {
  if(localStorage.getItem('robolab.s01.language') === 'java') language='java';
  for(const lang of ['python','java'] as const) drafts[lang]=localStorage.getItem(`robolab.s01.${lang}`) ?? starters[lang];
} catch { /* Keep both drafts in memory when storage is unavailable. */ }
code.value = drafts[language];
const highlight = attachHighlighting(code, el('highlighted-code'));
const pythonHelp = el('editor-help').innerHTML;
const pythonApi = document.querySelector('.api-table')!.innerHTML;
const pythonAwait = el('await-guide').innerHTML;
function languageUI() {
  const java=language==='java', name=java?'Java':'Python';
  el<HTMLSelectElement>('language').value=language;
  el('language-badge').textContent=`${name} · Mission 1`;
  el('code-panel').setAttribute('aria-label',`${name} editor`);
  code.setAttribute('aria-label',`${name} code`);
  el('console').setAttribute('aria-label',`${name} console`);
  if(status==='idle') el('console').textContent=java?'Your System.out.println output will appear here.':'Your print() output will appear here.';
  el('file-name').innerHTML=java?'<i>Jv</i> Main.java':'<i>Py</i> signal.py';
  el('editor-help').innerHTML=java?'// lines are notes. Robot calls wait for a reply; use <code>Robot.waitTicks</code> to advance motion. <a href="#value-guide">Number guide ↓</a>':pythonHelp;
  document.querySelector('.api-table')!.innerHTML=java?'<code>Robot.motor(0.5);</code><span>Power −1 to 1. Negative turns left; 0 stops.</span><code>Robot.servo(120);</code><span>Tilt 0° to 180°. 90° is level.</span><code>Robot.waitTicks(50);</code><span>Advance 50 ticks: 1 simulated second.</span><code>Robot.angle();</code><span>Read the current direction.</span><code>Robot.scanner();</code><span>Read the tilt servo angle.</span>':pythonApi;
  el('await-guide').innerHTML=java?'<strong>Why is there no await?</strong> These Java calls block this program until the robot replies; the page stays responsive. Setting motor power or servo position does not advance time or wait for arrival. <code>Robot.waitTicks(50)</code> advances both parts for 1 simulated second. <code>Robot.clock()</code> reads simulated seconds. Java checks types before running: <code>int</code> holds whole numbers, <code>double</code> allows decimals. A semicolon ends a statement; braces group the class and method. Keep <code>public class Main</code> and its <code>main</code> method; put your commands inside the method.':pythonAwait;
  const examples: Record<string,string> = {'motor(0.5)':'Robot.motor(0.5)', 'servo(120)':'Robot.servo(120)', 'wait(turn_ticks)':'Robot.waitTicks(turn_ticks)', 'turn_ticks = 50':'int turn_ticks = 50;', 'motor(2)':'Robot.motor(2)', 'servo(200)':'Robot.servo(200)', 'wait(0)':'Robot.waitTicks(0)', 'wait(2.5)':'Robot.waitTicks(2.5)', 'motor(0)':'Robot.motor(0)', 'angle()':'Robot.angle()', 'round':'Math.round', 'print':'System.out.println', 'wait(ticks)':'Robot.waitTicks(ticks)'};
  document.querySelectorAll<HTMLElement>('#value-guide code, .motion-key code').forEach(node=>{
    const py=node.dataset.python ?? node.textContent!; node.dataset.python=py; node.textContent=java?(examples[py]??py):py;
  });
}
let state: State = initialState(), status: RunStatus | 'idle' = 'idle', runner: Runner | undefined;
const completedLocations = new Set<string>();
const locationOrder = Object.keys(missions);
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
  updatePractice();
  scene?.update(state, goal, success);
}
function updatePractice() {
  const index = locationOrder.indexOf(selected);
  el('practice-progress').textContent = `${completedLocations.size} of 3 crew locations reached in this visit.`;
  const next = el<HTMLButtonElement>('next-rescue');
  next.hidden = index === locationOrder.length - 1;
  next.disabled = !completedLocations.has(selected) || status === 'loading' || status === 'running';
  next.textContent = `Next rescue: ${missions[locationOrder[index + 1] ?? selected].location} →`;
  el('next-help').textContent = completedLocations.size === 3
    ? 'All three practice rescues reached! More lessons are planned. You can revisit any location; this is local practice, not a family score.'
    : index === locationOrder.length - 1
      ? 'This is the last practice rescue in Mission 1. Choose any unfinished location above. More lessons are planned.'
      : completedLocations.has(selected)
        ? 'Ready for another crew? Your code stays so you can adapt it. These are variations within Mission 1.'
        : 'Light this crew’s pickup point to unlock the next rescue, or choose a location above.';
}
function feedback(title: string, text: string, kind = '') {
  el('feedback-title').textContent = title; el('feedback-text').textContent = text; el('feedback').className = `feedback ${kind}`;
}
function saveDraft() {
  highlight(language);
  el('line-numbers').textContent = code.value.split('\n').map((_, i) => i + 1).join('\n');
  drafts[language]=code.value;
  try { localStorage.setItem(`${draftPrefix}.${language}`, code.value); el('draft-status').textContent = 'Draft saved on this device'; }
  catch { el('draft-status').textContent = 'Draft is in this tab only'; }
}
code.addEventListener('input', saveDraft);
code.addEventListener('scroll', () => { el('line-numbers').scrollTop = code.scrollTop; });
attachEditor(code, saveDraft, run);
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
  if (next === 'running') feedback('Watch your numbers become movement.', 'Watch the beam: motor power turns it sideways, and the servo tilts it toward the crew.');
  if (next === 'finished') {
    success = reached(state, targets[selected]);
    if (success) completedLocations.add(selected);
    if (success) feedback('Crew located. Pickup point lit!', `Your code held the light on the ${missions[selected].location.toLowerCase()} crew. The rescue team can now see where to go. Try another crew, then explain how your timing helped.`, 'success');
    else feedback('A useful experiment. Try one change.', `The crew is still waiting for a steady light. Direction: ${state.angle.toFixed(1)}° / ${targets[selected].angle}°. Tilt servo: ${state.scanner.toFixed(1)}° / ${targets[selected].scanner}°. ${state.power ? `Remember ${language==='java'?'Robot.motor(0);':'await motor(0)'} to stop.` : 'Change your timing or direction, then Run again.'}`, 'try-again');
  }
  if (next === 'stopped') feedback('Stopped. Your code is safe.', 'Run again to begin from zero, or Reset to return the robot to its starting position.');
  if (next === 'error') {
    const error = detail || `${name} was interrupted. Try again.`;
    const hint = error.includes('SyntaxError') ? 'Python found a syntax error. Check the line shown in the console.' : error.includes('NameError') ? 'Python found an unknown name. Check spelling and your imports in the console.' : error.split('\n').at(-1)!;
    feedback('Let’s fix that and try again.', hint, 'error');
    el('console').textContent += `\n${error}`;
  }
  if(!active) recordAttempt(next==='finished'?(success?'reached':'missed'):next==='stopped'?'stopped':detail?.includes('unavailable')?'unavailable':'error',detail);
  showState();
}
function run() {
  if (status === 'loading' || status === 'running' || family.isChecking()) return;
  const current = ++generation;
  runner?.stop(); state = initialState(); success = false; showState(); el('console').textContent = '';
  attempt={id:crypto.randomUUID(),source:code.value,language,target:selected};
  try { runner = new Runner(code.value, {
    snapshot: value => { if (generation === current) { state = value; showState(); } },
    status: (value, detail) => { if (generation === current) setStatus(value, detail); },
    output: text => { if (generation === current) { el('console').textContent += text; el('console').scrollTop = el('console').scrollHeight; } },
  }, language); } catch (e) { setStatus('error', String(e)); }
}
function reset() {
  recordAttempt('stopped');
  ++generation; runner?.stop(); runner = undefined; state = initialState(); success = false; status = 'idle';
  el<HTMLButtonElement>('run').disabled = false; el<HTMLButtonElement>('stop').disabled = true;
  el('status-pill').textContent = 'READY'; el('runtime-label').textContent = 'Ready for your code'; el('console').textContent = language==='java'?'Your System.out.println output will appear here.':'Your print() output will appear here.';
  feedback('A fresh start for your next idea.', 'Your code is still here. Change a number, make a prediction, and Run.'); showState();
}
el<HTMLSelectElement>('language').onchange = event => {
  saveDraft(); reset();
  language=(event.target as HTMLSelectElement).value==='java'?'java':'python';
  code.value=drafts[language]; code.scrollTop=0; code.scrollLeft=0; languageUI(); saveDraft();
  try {localStorage.setItem('robolab.s01.language',language);} catch {}
  feedback(`${language==='java'?'Java':'Python'} draft ready.`, 'Each language keeps its own code. Switching stops the old run; your crew progress stays.');
};
el('run').onclick = run;
el('stop').onclick = () => runner?.stop();
el('reset').onclick = reset;
el('restore').onclick = () => { reset(); code.value = starters[language]; saveDraft(); feedback('Example restored. Give it a try.', 'Run the original, then change turn_ticks to bring the light to the crew.'); };
function selectLocation(value: string) {
  reset(); selected = value;
  el<HTMLSelectElement>('target').value = value;
  el('mission-job').textContent = missions[selected].job;
  el('goal-angle').textContent = `${targets[selected].angle}°`; el('goal-scanner').textContent = `${targets[selected].scanner}°`;
  el('pointer-target').textContent = `target ${targets[selected].angle}°`; el('scanner-target').textContent = `target ${targets[selected].scanner}°`;
  feedback('New target. What will you change?', selected === 'reverse' ? 'The cove is left and below: try negative motor power and tilt the servo to 60°. Keep your code and experiment.' : 'Keep the same power. Predict how many ticks this new angle will need.'); showState();
}
el<HTMLSelectElement>('target').onchange = event => selectLocation((event.target as HTMLSelectElement).value);
el('next-rescue').onclick = () => {
  const next = locationOrder[locationOrder.indexOf(selected) + 1];
  if (next && completedLocations.has(selected) && status !== 'loading' && status !== 'running') selectLocation(next);
};
el('view-reset').onclick = () => scene?.reset(); el('top-view').onclick = () => scene?.top();
el('zoom-in').onclick = () => scene?.zoom(.85); el('zoom-out').onclick = () => scene?.zoom(1.18);
const family=attachFamily({
  draft:()=>({source:code.value,language,target:selected}),
  draftFor:lang=>lang===language?code.value:drafts[lang],
  stop:()=>runner?.stop(),
  load:(lang,source)=>{saveDraft();reset();language=lang;code.value=source;languageUI();saveDraft();},
  profile:(id,cloud)=>{
    saveDraft();reset();completedLocations.clear();
    draftPrefix=id?`robolab.profile.${id}`:'robolab.s01';
    for(const lang of ['python','java'] as const){
      let local:string|null=null;try{local=localStorage.getItem(`${draftPrefix}.${lang}`);}catch{}
      drafts[lang]=local??cloud[lang]?.source??starters[lang];
    }
    code.value=drafts[language];languageUI();saveDraft();showState();
  },
});
if(import.meta.env.VITE_HOSTED==='1') {
  document.querySelector('.build-status')!.textContent='Mission 1 is released in Python and Java. Sign in for hosted Java, saved student drafts, checked rescues and shared family progress. Open Curriculum & unlocks to see the learning path.';
  document.querySelector('footer span:last-child')!.textContent='Python + Java · Private family progress';
}
languageUI(); saveDraft(); showState();
