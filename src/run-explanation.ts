import {initialState, patrols, PATROL_DWELL, reached, targets, targetLesson, type State} from './model.ts';

export type RunExplanation = {observation: string; reason: string};
const degrees = (value: number) => `${Number(value.toFixed(1))}°`;

/** Explain measured success, never infer a student's branch/loop from output or source. */
export function explainSuccess(state: State, selected: string): RunExplanation | undefined {
  const target = targets[selected];
  if (!reached(state, target)) return;
  const lesson = targetLesson(selected);
  if (lesson === 'L04') return {
    observation: `Parcel in the tray · no guard contact · joints settled · jaws ${Number(state.arm!.gap.toFixed(1))} mm open.`,
    reason: 'The gripper picked up the parcel and released it at the receiving tray. Moving the loaded arm clear of the guard made the handoff possible. Joint commands set destinations; waiting gives the joints time to reach them.',
  };
  if (lesson === 'L03') {
    const route = patrols[selected];
    return {
      observation: `${state.patrol!.visited} of ${route.angles.length} checkpoints logged in order · finished stopped at ${degrees(state.angle)}.`,
      reason: `Each checkpoint logged only after ${PATROL_DWELL} consecutive ticks (0.5 seconds) stopped with the beam aimed and tilt settled. Passing through would not count. A loop can repeat the move → stop → hold sequence; the robot's holds, not a printed counter, earn progress.`,
    };
  }
  return {
    observation: `Direction ${degrees(initialState(selected).angle)} → ${degrees(state.angle)} · tilt ${degrees(state.scanner)} · motor off.`,
    reason: lesson === 'L02'
      ? `The beam finished within 2° of the crew's direction (${degrees(target.angle)}) and tilt (${degrees(target.scanner)}), with its tilt settled and motor stopped. A comparison chooses a branch; motor power and waiting determine how far the beam moves. Passing this start alone does not show that the decision handles another start.`
      : `Motor power and time spent waiting moved the beam into the crew's direction range (${degrees(target.angle)} ±2°). The settled tilt is also within 2° of ${degrees(target.scanner)}. Stopping the motor keeps the light on the pickup point.`,
  };
}
