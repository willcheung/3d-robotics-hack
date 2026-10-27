import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
const bundle=await build({entryPoints:['src/runner.ts'],bundle:true,write:false,platform:'node',format:'esm',define:{'import.meta.env.VITE_RUNTIME_ORIGIN':'"http://127.0.0.1:4174"'}});
const {Runner}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
function fixture(){
 const replies=[],snapshots=[];
 globalThis.location={origin:'http://127.0.0.1:4173'};
 globalThis.window={addEventListener(){},removeEventListener(){}};
 globalThis.document={body:{append(){}},createElement(){return {sandbox:{add(){}},contentWindow:{postMessage:m=>replies.push(m)},remove(){}};}};
 const runner=new Runner('await motor(.5)\nawait wait(5)',{snapshot:s=>snapshots.push(s),status(){},output(){}});
 return {runner,replies,snapshots};
}
test('Pause after a line acknowledgement gates a delayed non-wait command and sensor reply',async()=>{
 const {runner,replies,snapshots}=fixture();
 try {
  await runner.receivePayload({type:'ready',tracing:true});await runner.receivePayload({type:'trace',id:2001,line:1});
  runner.pause();const command=runner.receivePayload({type:'command',id:1,command:{op:'motor',value:.5}});
  await sleep(40);assert.equal(snapshots.at(-1).power,0);assert.equal(replies.some(m=>m.id===1),false);
  runner.step();await command;assert.equal(snapshots.at(-1).power,.5);
  const boundary=runner.receivePayload({type:'trace',id:2002,line:2});await sleep(20);runner.pause();
  // Stop releases the next boundary without acknowledging stale work.
  runner.stop();await boundary;assert.equal(replies.some(m=>m.id===2002),false);
 } finally {runner.stop();}
});
test('unsupported tracing resets slow playback and releases pre-load Pause',async()=>{
 const {runner}=fixture();
 try {
  runner.setSpeed(.25);runner.pause();await runner.receivePayload({type:'ready',tracing:false});
  assert.equal(runner.playback.speed,1);assert.equal(runner.playback.paused,false);
  await runner.receivePayload({type:'command',id:1,command:{op:'wait',value:1}});
 } finally {runner.stop();}
});
test('invalid, overlapping and stale line messages cannot update model state',async()=>{
 const {runner,snapshots,replies}=fixture();
 await runner.receivePayload({type:'ready',tracing:true});runner.pause();
 const pending=runner.receivePayload({type:'trace',id:2001,line:1});
 await runner.receivePayload({type:'trace',id:2002,line:2});await pending;
 assert.equal(runner.dead,true);assert.equal(snapshots.at(-1).ticks,0);assert.equal(replies.some(m=>m.id===2001),false);
});
