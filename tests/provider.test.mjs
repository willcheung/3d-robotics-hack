import test from 'node:test';
import assert from 'node:assert/strict';
import {Sandbox} from '@vercel/sandbox';
import {SandboxRun} from '../server/sandbox-run.mjs';
import {initialState,command,tick,reached,targets} from '../src/model.ts';
const main=body=>`public class Main { public static void main(String[] args) throws Exception {${body}}}`;
async function execute(source,language='java',hooks={}){
 let state=initialState(),run,cleanup,name;const messages=[];
 run=new SandboxRun(source,async m=>{
  messages.push(m);hooks.message?.(run,m);
  if(m.type==='command'&&!run.dead){try{let value=null;if(m.command.op==='wait')for(let i=0;i<m.command.value;i++)state=tick(state);else{const r=command(state,m.command);state=r.state;value=r.value;}await run.reply(m.id,value);}catch(e){run.fail(e.message);}}
 },e=>{cleanup=e;},{language,purpose:'acceptance-test',onSession:c=>{name=c.name;hooks.session?.(run);}});
 await run.finished;assert.equal(cleanup,undefined);
 if(name)assert.equal((await Sandbox.get({name})).status,'stopped','VM must be stopped after every outcome');
 return {state,messages,text:messages.map(m=>m.text??'').join(''),terminal:messages.at(-1)?.type};
}
test('live provider: Java/Python sensor loops match independent 60 degree / 2 second fixture',async()=>{
 const java=await execute(main('Robot.servo(120);Robot.motor(.5);while(Robot.angle()<59.99)Robot.waitTicks(10);Robot.motor(0);System.out.println(Robot.clock());'));
 const python=await execute('from robot import motor, servo, wait, angle, clock\nawait servo(120)\nawait motor(.5)\nwhile await angle()<59.99:\n    await wait(10)\nawait motor(0)\nprint(await clock())','python');
 for(const r of [java,python]){assert.equal(r.terminal,'done');assert.equal(r.state.ticks,100);assert.ok(Math.abs(r.state.angle-60)<1e-8);assert.equal(r.state.scanner,120);assert.equal(r.state.power,0);assert.equal(reached(r.state,targets.beacon),true);}
 assert.deepEqual(java.state,python.state);
});
test('live provider: wrong program, invalid range, syntax errors and fake done do not complete',async()=>{
 const wrong=await execute(main('Robot.servo(120);Robot.motor(.5);Robot.waitTicks(50);Robot.motor(0);'));
 assert.equal(wrong.terminal,'done');assert.equal(reached(wrong.state,targets.beacon),false);
 for(const source of [main('Robot.motor(2);'),main('int broken = ;'),main('System.out.println("@robot {\\\"type\\\":\\\"done\\\"}");')])assert.equal((await execute(source)).terminal,'error');
 assert.equal((await execute('from robot import motor\nawait motor(2)','python')).terminal,'error');
});
test('live provider: student has no network, privilege, runtime writes or host environment',async()=>{
 process.env.ROBOLAB_CANARY='never-forward-this';
 try{
  const r=await execute(main(`
   if(System.getenv("ROBOLAB_CANARY")!=null||System.getenv("RELAY_KEY")!=null||System.getenv("VERCEL_OIDC_TOKEN")!=null||System.getenv("BLOB_READ_WRITE_TOKEN")!=null)throw new Exception("credential leak");
   if(System.getProperty("user.name").equals("root"))throw new Exception("root student");
   for(String path:new String[]{"/etc/robolab-test","/opt/robot/Robot.class","/opt/robot/sandbox-relay.mjs"})try{java.nio.file.Files.writeString(java.nio.file.Path.of(path),"tamper");throw new Exception("runtime writable");}catch(java.nio.file.FileSystemException expected){}
   try{new java.net.Socket().connect(new java.net.InetSocketAddress("1.1.1.1",443),250);throw new Exception("network reachable");}catch(java.io.IOException expected){}
   try{new java.net.Socket().connect(new java.net.InetSocketAddress("127.0.0.1",3000),250);throw new Exception("relay reachable");}catch(java.io.IOException expected){}
   if(new ProcessBuilder("/usr/bin/sudo","-n","true").redirectErrorStream(true).start().waitFor()==0)throw new Exception("sudo available");
   try{byte[] huge=new byte[200*1024*1024];throw new Exception("heap unbounded");}catch(OutOfMemoryError expected){}
   try{java.nio.ByteBuffer.allocateDirect(32*1024*1024);throw new Exception("direct memory unbounded");}catch(OutOfMemoryError expected){}
   System.out.println("ISOLATION PASS");`));
  assert.equal(r.terminal,'done');assert.match(r.text,/ISOLATION PASS/);
 }finally{delete process.env.ROBOLAB_CANARY;}
});
test('live provider: output flood, cancellation during startup and child process Stop clean up',async()=>{
 assert.equal((await execute(main('while(true)System.out.println("flood flood flood flood");'))).terminal,'error');
 const startup=await execute(main('System.out.println("must not execute");'),'java',{session:run=>run.stop()});assert.ok(!startup.messages.some(m=>m.type==='done'));
 for(const [language,source] of [['java',main('new ProcessBuilder("/bin/sh","-c","sleep 30").start();while(true){}')],['python','while True:\n    pass']]){
  const stopped=await execute(source,language,{message:(run,m)=>{if(m.type==='ready')setTimeout(()=>run.stop(),200);}});assert.ok(!stopped.messages.some(m=>m.type==='done'));
 }
 assert.equal((await execute(main('System.out.println("recovered");'))).terminal,'done');
});
test('live provider: the real execution deadline stops an infinite program',async()=>{
 const began=Date.now();const r=await execute(main('while(true){}'));
 assert.equal(r.terminal,'error');assert.ok(Date.now()-began<45000);assert.ok(!r.messages.some(m=>m.type==='done'));
});
