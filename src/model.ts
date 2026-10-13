/** Signal Station v1 + additive patrol v1. Fixed 20 ms ticks; no renderer or wall clock. */
export const DT = 0.02;
export const MAX_TICKS = 1500;
export type State = { angle: number; power: number; scanner: number; servoTarget: number; ticks: number; patrol?: { id: string; visited: number; dwell: number; bestDwell: number[] } };
export type Command = { op: 'motor' | 'servo' | 'wait' | 'angle' | 'scanner' | 'clock'; value?: number };
export type Target = { angle: number; scanner: number; patrol?: string };
export const PATROL_DWELL = 25;
export const patrols: Record<string, { start: number; angles: readonly number[]; tilt: number }> = {
  'patrol-ridge': { start: -90, angles: [-30, 30, 90], tilt: 90 },
  'patrol-extra': { start: -90, angles: [-45, 0, 45, 90], tilt: 90 },
  'patrol-cove': { start: 90, angles: [30, -30, -90], tilt: 60 },
};
export const targets: Record<string, Target> = {
  beacon: { angle: 60, scanner: 120 },
  farther: { angle: 90, scanner: 120 },
  reverse: { angle: -60, scanner: 60 },
  'sensor-left': { angle: 60, scanner: 120 },
  'sensor-right': { angle: 60, scanner: 120 },
  'sensor-transfer': { angle: -60, scanner: 60 },
  'patrol-ridge': { angle: 90, scanner: 90, patrol: 'patrol-ridge' },
  'patrol-extra': { angle: 90, scanner: 90, patrol: 'patrol-extra' },
  'patrol-cove': { angle: -90, scanner: 60, patrol: 'patrol-cove' },
};
export const lessonTargets = { L01: ['beacon', 'farther', 'reverse'], L02: ['sensor-left', 'sensor-right', 'sensor-transfer'], L03: ['patrol-ridge', 'patrol-extra', 'patrol-cove'] } as const;
export type LessonId = keyof typeof lessonTargets;
export const lessonIds = Object.keys(lessonTargets) as LessonId[];
export const lessonPrerequisites: Record<LessonId, readonly LessonId[]> = { L01: [], L02: ['L01'], L03: ['L02'] };
export function missingPrerequisite(lesson: LessonId, completed: string[]): LessonId | undefined {
  return lessonPrerequisites[lesson].find(id => !lessonTargets[id].every(t => completed.includes(t)));
}
export const modelVersion = (target: string) => targetLesson(target) === 'L03' ? 'signal-patrol-v1' : 'signal-station-v1';
export function targetLesson(target: string): LessonId {
  if (typeof target !== 'string' || !Object.hasOwn(targets, target)) throw new Error('Unknown rescue target.');
  return target.startsWith('patrol-') ? 'L03' : target.startsWith('sensor-') ? 'L02' : 'L01';
}
export function draftKey(lesson: LessonId, language: string): string { return lesson === 'L01' ? language : `${lesson}.${language}`; }
export function initialState(target = 'beacon'): State {
  targetLesson(target);
  const starts: Record<string, number> = { 'sensor-left': 30, 'sensor-right': 90, 'sensor-transfer': -30 };
  const patrol = Object.hasOwn(patrols, target) ? patrols[target] : undefined;
  return { angle: patrol?.start ?? starts[target] ?? 0, power: 0, scanner: 90, servoTarget: 90, ticks: 0, ...(patrol ? {patrol:{id:target,visited:0,dwell:0,bestDwell:patrol.angles.map(()=>0)}} : {}) };
}
const clamp = (x: number, min: number, max: number) => Math.max(min, Math.min(max, x));
export function validateCommand(input: unknown): Command {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected a robot command.');
  const r = input as Record<string, unknown>;
  if (Object.keys(r).some(k => k !== 'op' && k !== 'value')) throw new Error('Unknown command field.');
  const noValue = ['angle', 'scanner', 'clock'];
  if (typeof r.op !== 'string' || ![...noValue, 'motor', 'servo', 'wait'].includes(r.op)) throw new Error('Unknown robot command.');
  if (noValue.includes(r.op)) {
    if (r.value !== undefined) throw new Error('This sensor takes no argument.');
  } else {
    if (typeof r.value !== 'number' || !Number.isFinite(r.value)) throw new Error('Use a finite number.');
    if (r.op === 'motor' && Math.abs(r.value) > 1) throw new Error('Motor power must be between -1 and 1.');
    if (r.op === 'servo' && (r.value < 0 || r.value > 180)) throw new Error('Servo angle must be between 0 and 180 degrees.');
    if (r.op === 'wait' && (!Number.isInteger(r.value) || r.value < 1 || r.value > 600)) throw new Error('Wait needs 1–600 whole ticks (50 ticks = 1 second).');
  }
  return r as Command;
}
export function tick(s: State): State {
  if (s.ticks >= MAX_TICKS) throw new Error('30 simulated seconds reached. Try a shorter program.');
  const delta = clamp(s.servoTarget - s.scanner, -120 * DT, 120 * DT);
  const next = { ...s, angle: clamp(s.angle + s.power * 60 * DT, -150, 150), scanner: s.scanner + delta, ticks: s.ticks + 1 };
  if (s.patrol) {
    const route = patrols[s.patrol.id], angle = route.angles[s.patrol.visited];
    const holding = angle !== undefined && atPose(next, {angle, scanner:route.tilt}, 1e-9);
    const dwell = holding ? s.patrol.dwell + 1 : 0;
    const bestDwell=[...s.patrol.bestDwell];
    if(angle!==undefined)bestDwell[s.patrol.visited]=Math.max(bestDwell[s.patrol.visited],dwell);
    next.patrol = {bestDwell,id:s.patrol.id, visited:s.patrol.visited + (dwell >= PATROL_DWELL ? 1 : 0), dwell:dwell >= PATROL_DWELL ? 0 : dwell};
  }
  return next;
}
export function command(s: State, c: Command): { state: State; value: number | null } {
  validateCommand(c);
  if (c.op === 'motor') return { state: { ...s, power: c.value! }, value: null };
  if (c.op === 'servo') return { state: { ...s, servoTarget: c.value! }, value: null };
  if (c.op === 'angle') return { state: s, value: s.angle };
  if (c.op === 'scanner') return { state: s, value: s.scanner };
  if (c.op === 'clock') return { state: s, value: s.ticks * DT };
  throw new Error('Wait must advance individual fixed ticks.');
}
function atPose(s: State, target: Target, epsilon = 0): boolean {
  return s.power === 0 && Math.abs(s.servoTarget - s.scanner) < 1e-9 && Math.abs(s.angle - target.angle) <= 2 + epsilon && Math.abs(s.scanner - target.scanner) <= 2 + epsilon;
}
export function reached(s: State, target: Target): boolean {
  return s.ticks > 0 && atPose(s, target, target.patrol ? 1e-9 : 0) && (!target.patrol || (s.patrol?.id === target.patrol && s.patrol.visited === patrols[target.patrol].angles.length));
}
