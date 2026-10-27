import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JavaRun} from '../server/java-run.mjs';
import {initialState,command,tick} from '../src/model.ts';
async function execute(source,{trace=true,onTrace}={}){
 let run,state=initialState(),cleanup;const messages=[];
 run=new JavaRun(source,m=>{
  messages.push(m);
  if(m.type==='trace'){onTrace?.(m,run);if(!run.dead)run.reply(m.id,null);}
  if(m.type==='command'){
   let value=null;
   if(m.command.op==='wait')for(let i=0;i<m.command.value;i++)state=tick(state);
   else {const next=command(state,m.command);state=next.state;value=next.value;}
   run.reply(m.id,value);
  }
 },error=>{cleanup=error;},{trace});
 await run.finished;assert.equal(cleanup,undefined);return {messages,state};
}
const source=`public class Main {
 static void move(double power) throws Exception {
  Robot.motor(power);
  Robot.waitTicks(5);
 }
 public static void main(String[] args) throws Exception {
  for(int i=0;i<2;i++) {
   if(i==0) {
    move(.5);
   } else {
    move(0);
   }
  }
  System.out.println(Robot.angle());
 }
}`;
test('JDI follows actual branches, repeated loop lines and helper bodies with unchanged bytecode results',async()=>{
 const traced=await execute(source),plain=await execute(source,{trace:false});
 assert.equal(traced.messages.at(-1).type,'done');assert.deepEqual(traced.state,plain.state);
 const lines=traced.messages.filter(m=>m.type==='trace').map(m=>m.line);
 assert.equal(lines.filter(l=>l===3).length,2);assert.equal(lines.filter(l=>l===4).length,2);
 assert.equal(lines.filter(l=>l===8).length,2);assert.ok(lines.indexOf(9)<lines.indexOf(11));
 assert.equal(traced.state.ticks,10);assert.ok(Math.abs(traced.state.angle-3)<1e-8);
 assert.ok(traced.messages.some(m=>m.type==='output'&&m.text.trim()==='3.0'));
});
test('Stop from a real suspended Java line retires the entire debugged process',async()=>{
 const result=await execute(source,{onTrace:(m,run)=>run.stop()});
 assert.equal(result.messages.filter(m=>m.type==='trace').length,1);assert.equal(result.messages.some(m=>m.type==='done'),false);assert.equal(result.state.ticks,0);
});
test('Java syntax errors retain original Main.java line numbers with tracing enabled',async()=>{
 const result=await execute('public class Main {\n public static void main(String[] args) {\n broken syntax\n }\n}');
 assert.equal(result.messages.some(m=>m.type==='trace'),false);assert.equal(result.messages.at(-1).type,'error');assert.match(result.messages.filter(m=>m.type==='output').map(m=>m.text).join(''),/Main.java:3/);
});

test('returning an argument helper restores the caller line before its robot effect',async()=>{
 const result=await execute(`public class Main {
 static double power() {
  return 0.5;
 }
 public static void main(String[] args) throws Exception {
  Robot.motor(power());
 }
}`);
 const at=result.messages.findIndex(m=>m.type==='command');
 assert.equal(result.messages[at-1].type,'trace');assert.equal(result.messages[at-1].line,6);
});
test('traced API errors preserve the useful actuator range explanation',async()=>{
 const result=await execute('public class Main { public static void main(String[] args) throws Exception { Robot.motor(2); } }');
 assert.equal(result.messages.at(-1).type,'error');assert.match(result.messages.at(-1).text,/power/i);
});
