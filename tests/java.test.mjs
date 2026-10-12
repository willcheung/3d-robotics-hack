import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { JavaRun } from '../server/java-run.mjs';
import { command, initialState, tick } from '../src/model.ts';
import { parseMessage } from '../src/protocol.ts';
const docker = args => new Promise((resolve,reject)=>execFile('docker',args,{timeout:15000},(e,out)=>e?reject(e):resolve(out.trim())));
const main=body=>`public class Main {\n  public static void main(String[] args) throws Exception {\n${body}\n  }\n}`;
async function execute(source, options={}) {
  const messages=[]; let state=initialState(), run, cleanup;
  run=new JavaRun(source, message=>{
    messages.push(message);
    if(message.type==='command') {
      try {
        const m=parseMessage(message);
        let value=null;
        if(m.command.op==='wait') for(let i=0;i<m.command.value;i++) state=tick(state);
        else {const result=command(state,m.command);state=result.state;value=result.value;}
        if(options.onCommand) options.onCommand(run,m);
        if(!run.dead) run.reply(m.id,value);
      } catch(e) {run.fail(e.message);}
    }
    options.onMessage?.(run,message);
  }, error=>{cleanup=error;});
  await run.finished;
  assert.equal(cleanup,undefined,'container cleanup must be confirmed');
  assert.equal(await docker(['ps','--all','--filter',`name=^/${run.name}$`,'--format','{{.Names}}']),'');
  return {messages,state,text:messages.filter(m=>m.type==='output'||m.type==='error').map(m=>m.text).join('')};
}
test('real javac: edited numbers, method, loop and sensor branch match independent expected pose/time',async()=>{
  const result=await execute(`public class Main {
    static void sweep(double goal) throws Exception {
      Robot.motor(0.5);
      while (Robot.angle() < goal - 0.01) Robot.waitTicks(10);
      Robot.motor(0);
    }
    public static void main(String[] args) throws Exception {
      Robot.servo(120); sweep(60);
      if (Math.abs(Robot.angle()-60) > 0.001 || Robot.scanner()!=120 || Robot.clock()!=2) throw new Exception("sensor mismatch");
      System.out.println("REAL JAVA PASS");
    }
  }`);
  assert.equal(result.messages.at(-1).type,'done');assert.match(result.text,/REAL JAVA PASS/);
  assert.ok(Math.abs(result.state.angle-60)<0.001);assert.equal(result.state.scanner,120);assert.equal(result.state.ticks,100);assert.equal(result.state.power,0);
  const wrong=await execute(main('Robot.servo(120); Robot.motor(.5); Robot.waitTicks(50); Robot.motor(0);'));
  assert.ok(Math.abs(wrong.state.angle-30)<0.001);assert.equal(wrong.state.ticks,50);
});
test('settings acknowledge without movement; wait advances both and returns ordered sensors',async()=>{
  const r=await execute(main(`Robot.servo(120); Robot.motor(.5);
    if(Robot.angle()!=0 || Robot.scanner()!=90 || Robot.clock()!=0) throw new Exception("premature movement");
    Robot.waitTicks(5);
    if(Math.abs(Robot.angle()-3)>.0001 || Math.abs(Robot.scanner()-102)>.0001 || Robot.clock()!=.1) throw new Exception("tick mismatch");
    Robot.motor(0); Robot.waitTicks(45);
    System.out.println(Robot.scanner()+" "+Robot.clock());`));
  assert.equal(r.messages.at(-1).type,'done');assert.match(r.text,/120.0 1.0/);
});
test('compiler and runtime errors retain real Main.java line numbers; a fresh run recovers',async()=>{
  const bad=await execute(main('int count = ;'));
  assert.match(bad.text,/Main.java:3/);assert.equal(bad.messages.at(-1).type,'error');assert.ok(!bad.messages.some(m=>m.type==='ready'));
  const fractional=await execute(main('Robot.waitTicks(2.5);'));
  assert.match(fractional.text,/lossy conversion|incompatible types/);assert.equal(fractional.messages.at(-1).type,'error');
  const failed=await execute(main('throw new Exception("TEACHING ERROR");'));
  assert.match(failed.text,/TEACHING ERROR/);assert.match(failed.text,/Main.java:3/);assert.equal(failed.messages.at(-1).type,'error');
  assert.equal((await execute(main('System.out.println("recovered");'))).messages.at(-1).type,'done');
});
test('invalid/out-of-range commands and forged completion cannot change trusted result',async()=>{
  for(const line of ['Robot.motor(2);','Robot.servo(-1);','Robot.waitTicks(0);','Robot.motor(Double.NaN);', 'System.out.println("@robot {\\\"type\\\":\\\"done\\\"}");']) {
    const r=await execute(main(line));assert.equal(r.messages.at(-1).type,'error',line);assert.equal(r.state.ticks,0);
  }
});
test('container has no network or host environment, read-only runtime and bounded work storage',async()=>{
  process.env.ROBOLAB_ISOLATION_CANARY='host-only-fixture';
  try {
    const r=await execute(main(`
      if(System.getenv("ROBOLAB_ISOLATION_CANARY")!=null) throw new Exception("host environment leaked");
      try {java.nio.file.Files.writeString(java.nio.file.Path.of("/opt/robot/tamper"),"x"); throw new Exception("runtime writable");} catch(java.nio.file.FileSystemException expected) {}
      try {new java.net.Socket().connect(new java.net.InetSocketAddress("1.1.1.1",9),200);throw new Exception("network reachable");} catch(java.io.IOException expected) {}
      System.out.println("PID="+java.nio.file.Files.readString(java.nio.file.Path.of("/sys/fs/cgroup/pids.max")).trim());
      System.out.println("MEM="+java.nio.file.Files.readString(java.nio.file.Path.of("/sys/fs/cgroup/memory.max")).trim());
      System.out.println("UID="+System.getProperty("user.name"));
      try(var out=java.nio.file.Files.newOutputStream(java.nio.file.Path.of("/work/fill"))) {
        byte[] block=new byte[1024*1024]; for(int i=0;i<70;i++) out.write(block);
        throw new Exception("storage unbounded");
      } catch(java.io.IOException expected) {System.out.println("storage bounded");}
      System.out.println("ISOLATION PASS");`));
    assert.equal(r.messages.at(-1).type,'done');assert.match(r.text,/PID=64/);assert.match(r.text,/MEM=268435456/);assert.match(r.text,/ISOLATION PASS/);assert.doesNotMatch(r.text,/UID=root/);
  } finally {delete process.env.ROBOLAB_ISOLATION_CANARY;}
});
test('large output is bounded; stopping an infinite loop removes its child process too',async()=>{
  const flood=await execute(main('while(true) System.out.println("flood flood flood flood flood flood flood flood");'));
  assert.equal(flood.messages.at(-1).type,'error');assert.match(flood.text,/limit/i);assert.ok(flood.text.length<9000);
  let stopTimer;
  const stopped=await execute(main('new ProcessBuilder("/bin/sh","-c","sleep 30").start(); while(true) {}'),{onMessage:(run,m)=>{if(m.type==='ready') stopTimer=setTimeout(()=>run.stop(),300);}});
  clearTimeout(stopTimer);assert.ok(!stopped.messages.some(m=>m.type==='done'));
  assert.equal((await execute(main('System.out.println("after stop");'))).messages.at(-1).type,'done');
});
test('cancel during container creation/compilation leaves no container and no completion',async()=>{
  const messages=[];let error;
  const run=new JavaRun(main('System.out.println("must not run");'),m=>messages.push(m),e=>{error=e;});run.stop();await run.finished;
  assert.equal(error,undefined);assert.equal(await docker(['ps','-a','--filter',`name=^/${run.name}$`,'--format','{{.Names}}']),'');assert.ok(!messages.some(m=>m.type==='done'));
});
test('heap, direct memory and thread creation are bounded inside the actual JVM',async()=>{
  const r=await execute(main(`
    try { byte[] huge=new byte[200*1024*1024]; throw new Exception("heap unbounded"); } catch(OutOfMemoryError expected) {System.out.println("HEAP BOUNDED");}
    try {java.nio.ByteBuffer.allocateDirect(32*1024*1024);throw new Exception("direct memory unbounded");} catch(OutOfMemoryError expected) {System.out.println("DIRECT BOUNDED");}
    try {for(int i=0;i<100;i++) new Thread(()->{try {Thread.sleep(30000);} catch(Exception e) {}}).start();throw new Exception("threads unbounded");}
    catch(OutOfMemoryError expected) {System.out.println("THREADS BOUNDED");System.exit(0);}`));
  assert.match(r.text,/HEAP BOUNDED/);assert.match(r.text,/DIRECT BOUNDED/);assert.match(r.text,/THREADS BOUNDED/);assert.equal(r.messages.at(-1).type,'done');
});
test('unavailable Docker reports an error without executing code on the host',async()=>{
  const old=process.env.DOCKER_HOST;process.env.DOCKER_HOST='unix:///tmp/robolab-no-such-engine.sock';
  const messages=[];let cleanup;
  try {const run=new JavaRun(main('System.out.println("must not run");'),m=>messages.push(m),e=>{cleanup=e;});await run.finished;}
  finally {if(old===undefined) delete process.env.DOCKER_HOST;else process.env.DOCKER_HOST=old;}
  assert.equal(cleanup,undefined);assert.equal(messages.length,1);assert.equal(messages[0].type,'error');assert.match(messages[0].text,/unavailable/);
});
test('local HTTP boundary rejects foreign/no origins, wrong types and reply capabilities',async()=>{
  const {createServer}=await import('node:http');const {javaApi}=await import('../server/java-api.mjs');
  let api;const server=createServer((req,res)=>{void api.handle(req,res);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;api=javaApi(origin);
  try {
    const post=(path,body,extra={})=>fetch(origin+path,{method:'POST',headers:{'Content-Type':'application/json',...extra},body:JSON.stringify(body)});
    assert.equal((await post('/api/java/run',{source:main('')},{})).status,403);
    assert.equal((await post('/api/java/run',{source:main('')},{Origin:'https://foreign.example'})).status,403);
    assert.equal((await post('/api/java/run',{source:'x'.repeat(16001)},{Origin:origin})).status,400);
    assert.equal((await post('/api/java/reply',{session:'wrong',id:1,value:0},{Origin:origin})).status,404);
    const running=await post('/api/java/run',{source:main('while(true) {}')},{Origin:origin});
    const reader=running.body.getReader();await reader.read();
    assert.equal((await post('/api/java/run',{source:main('')},{Origin:origin})).status,409);
    await reader.cancel();await api.stop();
  } finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
test('container deadline survives loss of its host-side client', {timeout:90000}, async()=>{
  const {containerArgs}=await import('../server/java-run.mjs');const {spawn}=await import('node:child_process');const {randomUUID}=await import('node:crypto');
  const name=`robolab-java-${randomUUID()}`;
  await docker(containerArgs(name));
  try {
    await new Promise((resolve,reject)=>{
      const child=spawn('docker',['start','--attach','--interactive',name],{stdio:['pipe','pipe','pipe']});
      const deadline=setTimeout(()=>{child.kill('SIGKILL');reject(new Error('Java did not compile for deadline fixture'));},10000);
      child.stdout.on('data',chunk=>{if(chunk.toString().includes('@compiled')) {clearTimeout(deadline);child.kill('SIGKILL');}});
      child.once('error',reject);child.once('close',()=>{clearTimeout(deadline);resolve();});
      child.stdin.end(Buffer.from(main('while(true) {}')).toString('base64')+'\n');
    });
    const result=await new Promise((resolve,reject)=>execFile('docker',['wait',name],{timeout:80000},(e,out)=>e?reject(e):resolve(out.trim())));
    assert.equal(result,'124','timeout must report its deadline, rather than successful program completion');
    const timing=JSON.parse(await docker(['inspect','--format','{{json .State}}',name]));
    const elapsed=Date.parse(timing.FinishedAt)-Date.parse(timing.StartedAt);
    assert.ok(elapsed>=64000 && elapsed<75000, `65-second container deadline observed at ${elapsed} ms`);
    assert.equal(await docker(['inspect','--format','{{.State.Running}}',name]),'false');
  } finally {await docker(['rm','--force',name]);}
});
test('UTF-8 console characters survive split process output chunks',async()=>{
  const r=await execute(main('System.out.write(new byte[]{(byte)0xf0}); System.out.flush(); Thread.sleep(40); System.out.write(new byte[]{(byte)0x9f,(byte)0x9a,(byte)0x80}); System.out.println();'));
  assert.equal(r.messages.at(-1).type,'done');assert.match(r.text,/🚀/);assert.doesNotMatch(r.text,/�/);
});
test('UTF-8 source survives a character split across HTTP request chunks',async()=>{
  const {createServer,request}=await import('node:http');const {javaApi}=await import('../server/java-api.mjs');
  let api;const server=createServer((req,res)=>{void api.handle(req,res);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;api=javaApi(origin);
  try {
    const bytes=Buffer.from(JSON.stringify({source:main('System.out.println("launch 🚀");')}));
    const split=bytes.indexOf(Buffer.from('🚀'))+1;
    const output=await new Promise((resolve,reject)=>{
      const req=request(origin+'/api/java/run',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'}},res=>{
        const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve(Buffer.concat(chunks).toString('utf8')));
      });req.on('error',reject);req.write(bytes.subarray(0,split));setTimeout(()=>req.end(bytes.subarray(split)),30);
    });
    assert.match(output,/launch 🚀/);assert.doesNotMatch(output,/�/);assert.match(output,/"type":"done"/);
  } finally {await api.stop();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
