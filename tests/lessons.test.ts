import {test} from 'node:test';
import assert from 'node:assert/strict';
import {lessons,validateLessons,type Lesson} from '../src/lessons.ts';
import {initialState,command,tick,reached,targets,targetLesson} from '../src/model.ts';
test('lesson schema rejects incomplete teaching, missing both-language fixtures and invalid navigation',()=>{
  assert.doesNotThrow(()=>validateLessons(lessons));
  for(const key of ['job','beneficiary','consequence','application','source','otherApplications','conceptId','concept','recap','units','comments','transfer','prerequisites','hints','scenarios','next','version','transferTarget'] as const){const copy=structuredClone(lessons);delete (copy[1] as unknown as Record<string,unknown>)[key];assert.throws(()=>validateLessons(copy),key);}
  for(const kind of ['starters','reference','wrong','transferReference'] as const)for(const lang of ['python','java'] as const){const copy=structuredClone(lessons);copy[1][kind][lang]='';assert.throws(()=>validateLessons(copy));}
  assert.throws(()=>validateLessons([...lessons,lessons[0]]),/Duplicate/);
  const unknown=structuredClone(lessons);unknown[1].prerequisites=['missing' as Lesson['id']];assert.throws(()=>validateLessons(unknown),/Unknown/);
  const cycle=structuredClone(lessons);cycle[0].prerequisites=['L02'];assert.throws(()=>validateLessons(cycle),/Cyclic/);
  const unreleased=structuredClone(lessons);unreleased[1].next='L03' as Lesson['id'];assert.throws(()=>validateLessons(unreleased),/Unreleased/);
});
test('authored starts, direction readings and independent one-second corrections',()=>{
  for(const [id,start,power,goal,tilt] of [['sensor-left',30,.5,60,120],['sensor-right',90,-.5,60,120],['sensor-transfer',-30,-.5,-60,60]] as const){
    let state=initialState(id);assert.equal(state.angle,start);assert.equal(state.ticks,0);assert.equal(targetLesson(id),'L02');
    state=command(state,{op:'servo',value:tilt}).state;state=command(state,{op:'motor',value:power}).state;
    assert.equal(command(state,{op:'angle'}).value,start);assert.equal(state.scanner,90,'settings do not advance motion');
    for(let i=0;i<50;i++)state=tick(state);
    assert.ok(Math.abs(state.angle-goal)<1e-9);assert.equal(state.scanner,tilt);assert.equal(state.ticks,50);
    assert.equal(reached(state,targets[id]),false,'powered motor cannot complete');
    state=command(state,{op:'motor',value:0}).state;assert.equal(reached(state,targets[id]),true);
    assert.equal(reached({...state,angle:goal+2.001},targets[id]),false);
    assert.deepEqual(initialState(id),{angle:start,power:0,scanner:90,servoTarget:90,ticks:0});
  }
  assert.throws(()=>initialState(['sensor-left'] as unknown as string));assert.throws(()=>initialState('forged'));assert.throws(()=>initialState('__proto__'));
});
