import {test} from 'node:test';
import assert from 'node:assert/strict';
import {command, initialState, tick, type Command} from '../src/model.ts';
import {explainSuccess} from '../src/run-explanation.ts';

function simulate(target:string, commands:Command[]) {
  let state=initialState(target);
  for(const c of commands) {
    if(c.op==='wait')for(let n=0;n<c.value!;n++)state=tick(state);
    else state=command(state,c).state;
  }
  return state;
}
test('explanation follows actual alternative timing, direction and inclusive tolerance, not reference code',()=>{
  const commands:Command[]=[{op:'servo',value:120},{op:'motor',value:1},{op:'wait',value:51},{op:'motor',value:0}];
  const state=simulate('beacon',commands), explanation=explainSuccess(state,'beacon')!;
  assert.match(explanation.observation,/0° → 61.2°/);
  assert.match(explanation.reason,/60° ±2°/);
  assert.doesNotMatch(explanation.reason,/half power|100 ticks/);
  assert.equal(explainSuccess({...state,power:1},'beacon'),undefined);
  assert.equal(explainSuccess({...state,servoTarget:150},'beacon'),undefined);
  assert.equal(explainSuccess({...state,angle:62.01},'beacon'),undefined);
  assert.equal(explainSuccess(initialState(),'beacon'),undefined);
});
test('a hard-coded sensor rescue does not receive credit for a conditional decision',()=>{
  const state=simulate('sensor-right',[{op:'servo',value:120},{op:'motor',value:-1},{op:'wait',value:25},{op:'motor',value:0}]);
  const explanation=explainSuccess(state,'sensor-right')!;
  assert.match(explanation.observation,/90° → 60°/);
  assert.match(explanation.reason,/Passing this start alone/);
  assert.doesNotMatch(explanation.reason,/your (branch|condition|sensor)/i);
});
test('checkpoint explanation requires logged holds, not reaching the final angle',()=>{
  const move:Command[]=[{op:'motor',value:.5},{op:'wait',value:100},{op:'motor',value:0}];
  assert.equal(explainSuccess(simulate('patrol-ridge',[...move,...move,...move]),'patrol-ridge'),undefined);
  const step:Command[]=[...move,{op:'wait',value:25}];
  const state=simulate('patrol-ridge',[...step,...step,...step]);
  assert.match(explainSuccess(state,'patrol-ridge')!.observation,/3 of 3 checkpoints logged/);
  assert.match(explainSuccess(state,'patrol-ridge')!.reason,/25 consecutive ticks \(0.5 seconds\)/);
  assert.doesNotMatch(explainSuccess(state,'patrol-ridge')!.reason,/your loop/i);
});
test('parcel explanation requires actual delivery and settled release, not just reaching the tray',()=>{
  const commands:Command[]=[{op:'elbow',value:0},{op:'wait',value:40},{op:'grip',value:0},{op:'wait',value:25},{op:'elbow',value:70},{op:'wait',value:80},{op:'shoulder',value:135},{op:'wait',value:70},{op:'elbow',value:0},{op:'wait',value:80}];
  assert.equal(explainSuccess(simulate('parcel-moved',commands),'parcel-moved'),undefined);
  const delivered=simulate('parcel-moved',[...commands,{op:'grip',value:80},{op:'wait',value:25}]);
  assert.match(explainSuccess(delivered,'parcel-moved')!.observation,/jaws 80 mm open/);
  assert.equal(explainSuccess({...delivered,arm:{...delivered.arm!,collision:true}},'parcel-moved'),undefined);
});
