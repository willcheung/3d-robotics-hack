/** Signal Station v1. Fixed 20 ms ticks; no wall clock or renderer in the model. */
export const DT = 0.02;
export const MAX_TICKS = 1500;
export type State = { angle: number; power: number; scanner: number; servoTarget: number; ticks: number };
export type Command = { op: 'motor' | 'servo' | 'wait' | 'angle' | 'scanner' | 'clock'; value?: number };
export type Target = { angle: number; scanner: number };
export const targets: Record<string, Target> = {
  beacon: { angle: 60, scanner: 120 },
  farther: { angle: 90, scanner: 120 },
  reverse: { angle: -60, scanner: 60 },
  'sensor-left': { angle: 60, scanner: 120 },
  'sensor-right': { angle: 60, scanner: 120 },
  'sensor-transfer': { angle: -60, scanner: 60 },
};
export const lessonTargets = { L01: ['beacon', 'farther', 'reverse'], L02: ['sensor-left', 'sensor-right', 'sensor-transfer'] } as const;
export type LessonId = keyof typeof lessonTargets;
export function targetLesson(target: string): LessonId {
  if (typeof target !== 'string' || !Object.hasOwn(targets, target)) throw new Error('Unknown rescue target.');
  return target.startsWith('sensor-') ? 'L02' : 'L01';
}
export function draftKey(lesson: LessonId, language: string): string { return lesson === 'L01' ? language : `${lesson}.${language}`; }
export function initialState(target = 'beacon'): State {
  targetLesson(target);
  const starts: Record<string, number> = { 'sensor-left': 30, 'sensor-right': 90, 'sensor-transfer': -30 };
  return { angle: starts[target] ?? 0, power: 0, scanner: 90, servoTarget: 90, ticks: 0 };
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
  return { ...s, angle: clamp(s.angle + s.power * 60 * DT, -150, 150), scanner: s.scanner + delta, ticks: s.ticks + 1 };
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
export function reached(s: State, target: Target): boolean {
  return s.ticks > 0 && s.power === 0 && Math.abs(s.servoTarget - s.scanner) < 1e-9 && Math.abs(s.angle - target.angle) <= 2 && Math.abs(s.scanner - target.scanner) <= 2;
}
