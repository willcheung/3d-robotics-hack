import {test} from 'node:test';
import assert from 'node:assert/strict';
import {command,initialState,tick,reached,targets,patrols,type State} from '../src/model.ts';
const wait=(state:State,n:number)=>{for(let i=0;i<n;i++)state=tick(state);return state;};
function patrol(id='patrol-ridge',repeats=3,travel=100,power=.5,tilt=90,hold=25,stop=true){
  let s=command(initialState(id),{op:'servo',value:tilt}).state;
  for(let i=0;i<repeats;i++){
    s=command(s,{op:'motor',value:power}).state;s=wait(s,travel);
    if(stop)s=command(s,{op:'motor',value:0}).state;
    s=wait(s,hold);
  }return s;
}
test('independent route traces log all ordered checkpoints with exact elapsed time',()=>{
  for(const [id,n,time,power,tilt,total] of [['patrol-ridge',3,100,.5,90,375],['patrol-extra',4,75,.5,90,400],['patrol-cove',3,100,-.5,60,375]] as const){
    const result=patrol(id,n,time,power,tilt);assert.equal(result.ticks,total);assert.equal(result.patrol?.visited,n);assert.equal(result.patrol?.dwell,0);
    assert.ok(Math.abs(result.angle-patrols[id].angles.at(-1)!)<1e-9);assert.equal(result.scanner,tilt);assert.equal(reached(result,targets[id]),true);
    assert.deepEqual(patrol(id,n,time,power,tilt),result);assert.equal(initialState(id).patrol?.visited,0);
  }
});
test('24 ticks is short, interrupted dwell resets, and only next checkpoint can log',()=>{
  let s=patrol('patrol-ridge',1,100,.5,90,24);assert.equal(s.patrol?.visited,0);assert.equal(s.patrol?.dwell,24);
  const snapshot=s;s=tick(s);assert.equal(s.patrol?.visited,1);assert.deepEqual(snapshot.patrol,{id:'patrol-ridge',visited:0,dwell:24,bestDwell:[24,0,0]},'old snapshots are immutable');
  s=wait(s,100);assert.equal(s.patrol?.visited,1,'duplicate dwell cannot advance next point');
  let interrupted=patrol('patrol-ridge',1,100,.5,90,24);interrupted=command(interrupted,{op:'motor',value:.5}).state;interrupted=tick(interrupted);assert.equal(interrupted.patrol?.dwell,0);
  interrupted=command(interrupted,{op:'motor',value:0}).state;interrupted=wait(interrupted,24);assert.equal(interrupted.patrol?.visited,0);assert.equal(tick(interrupted).patrol?.visited,1);
  const lastOnly=patrol('patrol-ridge',1,300);assert.ok(Math.abs(lastOnly.angle-90)<1e-9);assert.equal(lastOnly.patrol?.visited,0);assert.equal(reached(lastOnly,targets['patrol-ridge']),false);
});
test('inclusive patrol tolerance and settled/zero power requirements',()=>{
  for(const axis of ['angle','scanner'] as const)for(const delta of [-2,2,-2.001,2.001]){
    let s:State={...initialState('patrol-ridge'),angle:-30,scanner:90,servoTarget:90};
    s[axis]+=delta;if(axis==='scanner')s.servoTarget=s.scanner;
    s=wait(s,25);assert.equal(s.patrol?.visited,Math.abs(delta)<=2?1:0);
  }
  let unsettled={...initialState('patrol-ridge'),angle:-30,scanner:60,servoTarget:90};unsettled=wait(unsettled,25);assert.equal(unsettled.patrol?.visited,0);assert.ok(unsettled.patrol!.dwell<25);
  assert.equal(patrol('patrol-ridge',3,100,.5,90,25,false).patrol?.visited,0);
});
test('zero/too few/excess repeats, spacing, wrong tilt, missing dwell and forged commands cannot pass',()=>{
  for(const s of [patrol('patrol-ridge',0),patrol('patrol-ridge',2),patrol('patrol-ridge',4),patrol('patrol-ridge',3,99,.5,60),patrol('patrol-ridge',3,100,.5,90,0),patrol('patrol-extra'),patrol('patrol-cove')])assert.equal(reached(s,targets[s.patrol!.id]),false);
  assert.equal(reached(patrol(),targets['patrol-extra']),false,'route identity is authoritative');
  assert.throws(()=>command(initialState('patrol-ridge'),{op:'patrol',visited:3} as never),/Unknown/);
  const all=patrol();assert.equal(reached({...all,power:.01},targets['patrol-ridge']),false);assert.equal(reached({...all,angle:150},targets['patrol-ridge']),false);
  assert.throws(()=>patrol('patrol-ridge',13),/30 simulated seconds/);
});

test('diagnostics retain short holds without awarding checkpoints or leaking across runs',()=>{
 const s=patrol('patrol-ridge',3,100,.5,90,10);
 assert.equal(s.patrol?.visited,0);assert.equal(s.patrol?.dwell,0);
 assert.deepEqual(s.patrol?.bestDwell,[10,0,0]);assert.equal(reached(s,targets['patrol-ridge']),false);
 assert.deepEqual(initialState('patrol-ridge').patrol?.bestDwell,[0,0,0]);
});
