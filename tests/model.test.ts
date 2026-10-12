import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, tick, command, reached, targets, validateCommand, MAX_TICKS } from '../src/model.ts';
import { parseMessage, permittedOrigin } from '../src/protocol.ts';
const advance = (s: ReturnType<typeof initialState>, n: number) => { for (let i = 0; i < n; i++) s = tick(s); return s; };
test('independent 60 degree/sec motor fixture and 120 degree/sec servo fixture', () => {
  let s = command(initialState(), { op: 'motor', value: .5 }).state;
  s = command(s, { op: 'servo', value: 180 }).state;
  s = advance(s, 25);
  assert.ok(Math.abs(s.angle - 15) < 1e-9); assert.ok(Math.abs(s.scanner - 150) < 1e-9);
  assert.equal(command(s, { op: 'clock' }).value, .5);
  s = advance(s, 75); s = command(s, { op: 'motor', value: 0 }).state;
  assert.ok(Math.abs(s.angle - 60) < 1e-9); assert.equal(s.scanner, 180);
  assert.equal(reached(s, targets.beacon), false);
});
test('reference, wrong duration, powered motor, and target tolerance', () => {
  let s = command(initialState(), { op: 'motor', value: .5 }).state;
  s = command(s, { op: 'servo', value: 120 }).state;
  s = advance(s, 50); assert.equal(reached(s, targets.beacon), false);
  s = advance(s, 50); assert.equal(reached(s, targets.beacon), false);
  s = command(s, { op: 'motor', value: 0 }).state;
  assert.equal(reached(s, targets.beacon), true);
  assert.equal(reached({...s, servoTarget: 180}, targets.beacon), false);
  assert.equal(reached({ ...s, angle: 62.01 }, targets.beacon), false);
  assert.equal(reached({ ...s, angle: 62 }, targets.beacon), true);
});
test('reverse, clamps, servo arrival, reproducible replay and reset', () => {
  const run = () => {
    let s = command(initialState(), { op: 'motor', value: -1 }).state;
    s = command(s, { op: 'servo', value: 0 }).state;
    return advance(s, 250);
  };
  assert.deepEqual(run(), run()); assert.equal(run().angle, -150); assert.equal(run().scanner, 0);
  assert.deepEqual(initialState(), { angle: 0, power: 0, scanner: 90, servoTarget: 90, ticks: 0 });
  assert.throws(() => tick({ ...initialState(), ticks: MAX_TICKS }), /30 simulated seconds/);
});
test('reject invalid values and forged authoritative fields', () => {
  for (const c of [null, [], {op:'score',value:100}, {op:'motor',value:NaN}, {op:'motor',value:Infinity}, {op:'motor',value:2}, {op:'servo',value:-1}, {op:'servo',value:181}, {op:'wait',value:1.5}, {op:'wait',value:0}, {op:'wait',value:601}, {op:'angle',value:0}, {op:'motor',value:true}, {op:'servo',value:'60'}, {op:'motor',value:0, success:true}]) assert.throws(() => validateCommand(c));
  for (const m of [{type:'success'}, {type:'done',score:100}, {type:'command',id:0,command:{op:'angle'}}, {type:'command',id:1,command:{op:'setState',value:60}}, {type:'output',text:'x'.repeat(8193)}]) assert.throws(() => parseMessage(m));
});
test('documented inclusive input ranges accept edges and reject just-outside values', () => {
  for (const [op, values] of [['motor', [-1, -.5, 0, .5, 1]], ['servo', [0, 60.5, 90, 120, 180]], ['wait', [1, 50, 600]]] as const) {
    for (const value of values) assert.doesNotThrow(() => validateCommand({op, value}));
  }
  for (const [op, values] of [['motor', [-1.001, 1.001]], ['servo', [-.001, 180.001]], ['wait', [0, 601, 2.5]]] as const) {
    for (const value of values) assert.throws(() => validateCommand({op, value}));
  }
  // Travel stops are a different contract from command ranges: clamp, no error.
  const stoppedAtLimit = advance(command(initialState(), {op:'motor',value:1}).state, 600);
  assert.equal(stoppedAtLimit.angle, 150);
  assert.equal(stoppedAtLimit.ticks * .02, 12);
});
test('runtime is a distinct constrained origin', () => {
  assert.equal(permittedOrigin('http://127.0.0.1:4174', 'http://127.0.0.1:4173'), 'http://127.0.0.1:4174');
  for (const origin of ['http://evil.example','https://app.example','https://user:pass@runtime.example','https://runtime.example/path','data:text/html,hello']) assert.throws(() => permittedOrigin(origin, 'https://app.example'));
});
