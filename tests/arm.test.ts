import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialState,command,tick,reached,targets,validateCommand,modelVersion,type State,type Command} from '../src/model.ts';
import {armPose,guardContact,initialArm,tickArm,armReached} from '../src/arm-model.ts';
const near=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
function steps(s:State,n:number){for(let i=0;i<n;i++)s=tick(s);return s;}
function set(s:State,op:Command['op'],value:number){return command(s,{op,value}).state;}
function picked(){let s=initialState('parcel-across');s=steps(set(s,'elbow',0),40);return steps(set(s,'grip',0),25);}
function deliver(id='parcel-across',lift=80,destination=targets[id].angle){let s=initialState(id);for(const [op,value] of [['elbow',0],['wait',40],['grip',0],['wait',25],['elbow',70],['wait',lift],['shoulder',destination],['wait',70],['elbow',0],['wait',80],['grip',100],['wait',25]] as [Command['op'],number][]){s=op==='wait'?steps(s,value):set(s,op,value);}return s;}
test('arm coordinates match independent anchor calculations, endpoints and two joint axes',()=>{
 const p=armPose(30,0).hand;near(p.x,1.385640646055102);near(p.y,.3);near(p.z,.8);
 const high=armPose(30,70).hand;near(high.x,.929778829);near(high.y,1.051754097);near(high.z,.536808057);
 near(armPose(150,0).hand.x,-1.385640646055102);near(armPose(135,0).hand.z,1.1313708498984762);
 near(armPose(0,90).hand.x,.8);near(armPose(0,90).hand.y,1.1);near(armPose(180,0).hand.x,-1.6);
});
test('settings/readings preserve time and snapshots; waits move all arm actuators at fixed independent rates',()=>{
 const original=initialState('parcel-across'),saved=structuredClone(original);
 let s=set(set(set(original,'shoulder',60),'elbow',70),'grip',80);
 assert.equal(command(s,{op:'shoulderAngle'}).value,30);assert.equal(command(s,{op:'elbowAngle'}).value,35);assert.equal(command(s,{op:'aperture'}).value,100);assert.equal(command(s,{op:'holding'}).value,0);assert.equal(s.ticks,0);
 s=steps(s,5);near(s.arm!.shoulder,39);near(s.arm!.elbow,39.5);near(s.arm!.gap,80);near(command(s,{op:'clock'}).value!,.1);assert.deepEqual(original,saved);
 s=steps(s,40);near(s.arm!.shoulder,60);near(s.arm!.elbow,70);near(s.arm!.gap,80);
});
test('numeric limits and wrong-world calls fail without changing either model',()=>{
 for(const [op,max] of [['shoulder',180],['elbow',90],['grip',100]] as const){for(const value of [0,max,1.25])assert.doesNotThrow(()=>validateCommand({op,value}));for(const value of [-.01,max+.01,NaN,Infinity,true,'30',null])assert.throws(()=>validateCommand({op,value}));}
 for(const op of ['shoulderAngle','elbowAngle','aperture','holding'])assert.throws(()=>validateCommand({op,value:1}));
 for(const op of ['motor','servo','angle','scanner'] as const)assert.throws(()=>command(initialState('parcel-across'),{op,...(['motor','servo'].includes(op)?{value:0}:{})}),/Light commands/);
 assert.throws(()=>command(initialState(),{op:'grip',value:0}),/Mission 4/);assert.throws(()=>initialArm('__proto__'));
 assert.equal(modelVersion('beacon'),'signal-station-v1');assert.equal(modelVersion('patrol-ridge'),'signal-patrol-v1');assert.equal(modelVersion('parcel-across'),'parcel-arm-v1');
});
test('all three deliveries move the parcel, release in their own tray, and finish in 320 ticks',()=>{
 for(const id of ['parcel-across','parcel-moved','parcel-return']){const s=deliver(id);assert.equal(reached(s,targets[id]),true);assert.equal(s.ticks,320);assert.equal(s.arm!.payload,'delivered');assert.equal(s.arm!.gap,100);assert.equal(command(s,{op:'holding'}).value,0);assert.deepEqual(s,deliver(id),'deterministic replay');}
 const held=picked();assert.equal(held.arm!.payload,'held');assert.equal(held.arm!.gap,40);assert.equal(command(held,{op:'holding'}).value,1);assert.equal(reached(held,targets['parcel-across']),false);
 const carried=steps(set(held,'elbow',70),80);near(carried.arm!.parcel.y,1.051754097);assert.deepEqual(held,picked(),'later movement cannot mutate old payload snapshot');
});
test('empty closure cannot attach later; moving joints cannot grasp; open and retry can recover',()=>{
 let s=steps(set(initialState('parcel-across'),'grip',0),25);assert.equal(s.arm!.payload,'waiting');assert.equal(s.arm!.graspMissed,true);
 s=steps(set(s,'elbow',0),40);assert.equal(s.arm!.payload,'waiting');s=steps(set(s,'grip',100),25);s=steps(set(s,'grip',0),25);assert.equal(s.arm!.payload,'held');
 const a=initialArm('parcel-across');a.elbow=0;a.elbowTarget=1;a.gap=41;a.gripTarget=0;assert.equal(tickArm(a,.02).payload,'waiting');
});
test('grasp tolerance and opening threshold are inclusive with no duplicate delivery',()=>{
 const a=initialArm('parcel-across');a.elbow=0;a.elbowTarget=0;a.gap=41;a.gripTarget=0;
 for(const [offset,wanted] of [[.04,'held'],[.04001,'waiting']] as const){const copy=structuredClone(a);copy.parcel.x+=offset;assert.equal(tickArm(copy,.02).payload,wanted);}
 const held=picked().arm!;const still=tickArm({...held,gap:44,gripTarget:45},.02);assert.equal(still.payload,'held');assert.equal(tickArm({...still,gripTarget:46},.02).payload,'dropped');
 const done=deliver().arm!;assert.equal(tickArm({...done,gripTarget:0},.02).payload,'delivered');assert.equal(armReached({...done,gap:79,gripTarget:79},done.id),false);assert.equal(armReached({...done,gap:80,gripTarget:80},done.id),true);assert.equal(armReached(done,'parcel-moved'),false);
});
test('release requires settled joints and the selected tray; early opening drops rather than throws',()=>{
 const a=picked().arm!,tray=armPose(150,0).hand;
 for(const [offset,wanted] of [[.06,'delivered'],[.06001,'dropped']] as const){
  // Offset the selected tray by rotating an exactly settled hand; solve angle independently.
  const degrees=2*Math.asin(offset/(2*1.6))*180/Math.PI;
  const release={...a,shoulder:150-degrees,shoulderTarget:150-degrees,gap:44,gripTarget:100,parcel:tray};
  assert.equal(tickArm(release,.02).payload,wanted);
 }
 const moving={...a,shoulder:149,shoulderTarget:150,elbow:0,elbowTarget:1,gap:44,gripTarget:100};assert.equal(tickArm(moving,.02).payload,'dropped');
 const wrong=deliver('parcel-moved',80,150);assert.equal(wrong.arm!.payload,'dropped');assert.equal(reached(wrong,targets['parcel-moved']),false);
 let s=steps(set(picked(),'grip',100),25);assert.equal(s.arm!.payload,'dropped');near(s.arm!.parcel.y,.04);const dropped=structuredClone(s.arm!.parcel);s=steps(set(s,'elbow',70),80);assert.deepEqual(s.arm!.parcel,dropped);
});
test('guard contact is swept and inclusive; short lift freezes at a safe snapshot until reset',()=>{
 assert.equal(guardContact({x:-2,y:.3,z:1.2},{x:2,y:.3,z:1.2},0),true);assert.equal(guardContact({x:-2,y:.65,z:1.2},{x:2,y:.65,z:1.2},0),true);assert.equal(guardContact({x:-2,y:.651,z:1.2},{x:2,y:.651,z:1.2},0),false);
 const s=deliver('parcel-across',10);assert.equal(s.arm!.collision,true);assert.equal(s.arm!.payload,'held');assert.equal(reached(s,targets['parcel-across']),false);
 assert.equal(s.arm!.elbowTarget,70);assert.equal(s.arm!.shoulderTarget,150);assert.equal(s.arm!.gripTarget,0);assert.ok(s.arm!.elbow<70,'collision freezes actual lift without changing the commanded lift');
 const frozen=structuredClone(s.arm);assert.deepEqual(steps(set(s,'shoulder',0),10).arm,frozen);assert.equal(initialState('parcel-across').arm!.collision,false);assert.equal(reached(deliver(),targets['parcel-across']),true);
 // Both endpoints are clear but the path crosses the guard. The sweep must catch it.
 const a=initialArm('parcel-across');a.elbow=0;a.elbowTarget=0;a.shoulderTarget=150;assert.equal(tickArm(a,2).collision,true);
});
test('bounded run and old-world snapshots are preserved',()=>{
 assert.throws(()=>tick({...initialState('parcel-across'),ticks:1500}),/30 simulated seconds/);
 const old=initialState();assert.deepEqual(old,{angle:0,power:0,scanner:90,servoTarget:90,ticks:0});
 let s=steps(set(set(old,'servo',120),'motor',.5),100);s=set(s,'motor',0);assert.equal(reached(s,targets.beacon),true);
});
