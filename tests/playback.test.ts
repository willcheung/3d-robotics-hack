import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Playback,type PlaybackState} from '../src/playback.ts';
import {ExecutionBudget} from '../src/execution-budget.ts';
import {parseMessage} from '../src/protocol.ts';
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
test('Pause blocks a line; Step permits exactly one line including same-line loop visits',async()=>{
 const states:PlaybackState[]=[];const playback=new Playback(s=>states.push(s));
 playback.pause();let first=false,second=false;
 const execution=(async()=>{await playback.atLine(3);first=true;await playback.atLine(3);second=true;})();
 await sleep(30);assert.equal(first,false);playback.step();await sleep(30);
 assert.equal(first,true);assert.equal(second,false);assert.deepEqual(states.at(-1),{paused:true,stepping:false,line:3});
 playback.step();await execution;assert.equal(second,true);playback.stop();
});
test('Pause during motion freezes remaining playback time; Resume cannot catch up',async()=>{
 const playback=new Playback(()=>{});let finished=false;
 const delay=playback.delay(160).then(()=>{finished=true;});
 await sleep(25);playback.pause();await sleep(180);assert.equal(finished,false);
 playback.resume();await sleep(25);assert.equal(finished,false);await delay;playback.stop();
});
test('Stop releases paused line and motion gates, including Step during a wait',async()=>{
 const playback=new Playback(()=>{});playback.pause();const line=playback.atLine(8);playback.stop();await line;
 const other=new Playback(()=>{});other.pause();const wait=other.delay(20);other.step();await wait;other.stop();
});
test('runtime work budget excludes learner-controlled waits but retains cumulative work',async()=>{
 let expired=false;const budget=new ExecutionBudget(90,()=>{expired=true;});budget.resume();await sleep(25);budget.pause();await sleep(110);assert.equal(expired,false);budget.resume();await sleep(90);assert.equal(expired,true);budget.stop();
});
test('trace protocol rejects forged fields, noninteger/out-of-range IDs and source lines',()=>{
 assert.deepEqual(parseMessage({type:'trace',id:2001,line:7}),{type:'trace',id:2001,line:7});
 for(const change of [{id:2000},{id:12001},{id:2001.1},{line:0},{line:16002},{line:'7'},{score:100}])assert.throws(()=>parseMessage({type:'trace',id:2001,line:7,...change}));
 assert.throws(()=>parseMessage({type:'done',tracing:true}));
});
