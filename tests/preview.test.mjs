import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {createServer} from 'node:net';
import {mkdtemp,mkdir,writeFile,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

async function freePort() {
  const server=createServer();
  server.listen(0,'127.0.0.1');await once(server,'listening');
  const port=server.address().port;
  await new Promise(resolve=>server.close(resolve));return port;
}
async function preview(t,root,appOverride) {
  const app=appOverride||`http://127.0.0.1:${await freePort()}`;
  let runtime;do {runtime=`http://127.0.0.1:${await freePort()}`;} while(runtime===app);
  const child=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,ROBOLAB_HOSTED:'0',APP_ORIGIN:app,VITE_RUNTIME_ORIGIN:runtime,APP_DIST:path.join(root,'app'),RUNTIME_DIST:path.join(root,'runtime'),TMPDIR:root,TMP:root,TEMP:root},stdio:['ignore','pipe','pipe']});
  const exited=once(child,'exit');let stopped=false;
  const stop=async()=>{if(stopped)return;stopped=true;if(child.exitCode===null&&child.signalCode===null)child.kill('SIGTERM');await exited;};
  t.after(stop);
  await new Promise((resolve,reject)=>{
    let output='';const timer=setTimeout(()=>reject(Error(`Preview did not start: ${output}`)),10000);
    const finish=(error)=>{clearTimeout(timer);error?reject(error):resolve();};
    child.stdout.on('data',data=>{output+=data;if(output.includes('Ctrl+C stops both servers.'))finish();});
    child.stderr.on('data',data=>{output+=data;});
    child.once('exit',()=>finish(Error(`Preview exited before listening: ${output}`)));
    child.once('error',finish);
  });
  return {app,runtime,stop};
}
async function fixture(root,version) {
  // Static HTTP fixtures test asset isolation, not Python execution.
  for(const dir of ['app','runtime'])await mkdir(path.join(root,dir),{recursive:true});
  for(const [file,text] of [['app/index.html',`<script src="/bundle.js"></script>${version}`],['app/bundle.js',`app-${version}`],['runtime/index.html',`runtime-${version}`],['runtime/frame.js',`frame-${version}`],['runtime/worker.js',`worker-${version}`]])await writeFile(path.join(root,file),text);
}
test('running preview keeps paired assets when another build replaces the source directories', {timeout:30000},async t=>{
  const root=await mkdtemp(path.join(tmpdir(),'robolab-preview-test-'));t.after(()=>rm(root,{recursive:true,force:true}));
  await fixture(root,'A');const first=await preview(t,root);
  const initial=await fetch(first.app);assert.match(initial.headers.get('content-security-policy'),new RegExp(`frame-src ${first.runtime.replaceAll('.','\\.')};`));
  assert.match(await initial.text(),/>A$/);
  await rm(path.join(root,'app'),{recursive:true});await rm(path.join(root,'runtime'),{recursive:true});await fixture(root,'B');
  assert.match(await (await fetch(first.app)).text(),/>A$/,'an open preview must not switch to another build');
  assert.equal(await (await fetch(first.app+'/bundle.js')).text(),'app-A');
  assert.equal(await (await fetch(first.runtime+'/frame.js')).text(),'frame-A');
  assert.equal(await (await fetch(first.runtime+'/worker.js')).text(),'worker-A');
  const second=await preview(t,root);
  assert.match(await (await fetch(second.app)).text(),/>B$/,'a new preview picks up the new build');
  assert.equal(await (await fetch(second.runtime+'/frame.js')).text(),'frame-B');
  await first.stop();await second.stop();
  assert.deepEqual((await readdir(root)).filter(name=>name.startsWith('robolab-preview-')),[],'shutdown removes temporary snapshots');
});
test('failed preview startup cleans its snapshot without disturbing an existing preview', {timeout:30000},async t=>{
  const root=await mkdtemp(path.join(tmpdir(),'robolab-preview-test-'));t.after(()=>rm(root,{recursive:true,force:true}));
  await fixture(root,'A');const running=await preview(t,root);
  await assert.rejects(preview(t,root,running.app),/EADDRINUSE/);
  assert.match(await (await fetch(running.app)).text(),/>A$/);
  assert.equal((await readdir(root)).filter(name=>name.startsWith('robolab-preview-')).length,1,'only the running preview owns a snapshot');
  await running.stop();assert.deepEqual((await readdir(root)).filter(name=>name.startsWith('robolab-preview-')),[]);
});
test('incomplete build fails before listening and leaves no preview snapshot', {timeout:30000},async t=>{
  const root=await mkdtemp(path.join(tmpdir(),'robolab-preview-test-'));t.after(()=>rm(root,{recursive:true,force:true}));
  await fixture(root,'A');await rm(path.join(root,'runtime','worker.js'));
  await assert.rejects(preview(t,root),/Preview build is incomplete/);
  assert.deepEqual((await readdir(root)).filter(name=>name.startsWith('robolab-preview-')),[]);
});
