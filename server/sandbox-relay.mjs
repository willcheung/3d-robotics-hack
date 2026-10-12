// Runs inside an ephemeral VM. Never receives application credentials or a model.
import http from 'node:http';
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { timingSafeEqual } from 'node:crypto';
import { StringDecoder } from 'node:string_decoder';
const key=Buffer.from(process.env.RELAY_KEY || '');
delete process.env.RELAY_KEY;
let child, started=false, runResponse;
const stop=()=>{if(child) {try {process.kill(-child.pid,'SIGKILL');} catch {} child=null;}};
const server=http.createServer(async(req,res)=>{
 const supplied=Buffer.from(req.headers.authorization || '');
 if(key.length<32 || supplied.length!==key.length || !timingSafeEqual(key,supplied)) {res.writeHead(403);res.end();return;}
 try {
  let raw=''; for await(const part of req) {raw+=part;if(Buffer.byteLength(raw)>70000) throw Error('Request too large');}
  if(req.method!=='POST') throw Error('POST required');
  if(req.url==='/reply') {
   const {id,value}=JSON.parse(raw);
   if(!child || !Number.isSafeInteger(id) || id<1 || !(value===null || typeof value==='number'&&Number.isFinite(value))) throw Error('Invalid reply');
   runResponse.write(JSON.stringify({replied:id})+'\n');
   child.stdin.write(String(value)+'\n');res.end('ok');return;
  }
  if(req.url!=='/start' || started) throw Error('Already started');
  const {source,language}=JSON.parse(raw);
  if(typeof source!=='string'||source.length>16000||!['java','python'].includes(language)) throw Error('Invalid program');
  started=true;
  await writeFile(`/opt/robot/${language==='java'?'Main.java':'student.py'}`,source,{mode:0o444});
  runResponse=res;
  res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store, no-transform','X-Accel-Buffering':'no','Content-Encoding':'identity'});
  res.flushHeaders();
  // All writable locations are memory-backed; no host mounts, network, sudo,
  // inherited credentials, or writable runtime. A VM deadline survives gateway loss.
  const args=['-n','/usr/bin/bwrap','--unshare-all','--die-with-parent','--new-session','--ro-bind','/','/','--ro-bind','/proc','/proc','--dev','/dev','--perms','1777','--tmpfs','/tmp','--perms','0777','--tmpfs','/work','--chdir','/work','--uid','10001','--gid','10001','--cap-drop','ALL','--clearenv','--setenv','PATH','/usr/bin:/bin','--setenv','HOME','/work','/bin/bash','/opt/robot/hosted-run.sh',language];
  child=spawn('/usr/bin/sudo',args,{detached:true,env:{PATH:'/usr/bin:/bin'},stdio:['pipe','pipe','pipe']});
  let bytes=0;
  const emit=data=>{if(!res.destroyed&&!res.write(JSON.stringify(data)+'\n')) stop();};
  for(const stream of ['stdout','stderr']) {
   const decoder=new StringDecoder('utf8');
   child[stream].on('data',chunk=>{bytes+=chunk.length;if(bytes>600000){emit({stream:'stderr',data:'Runtime output limit reached.\n'});stop();return;}emit({stream,data:decoder.write(chunk)});});
   child[stream].on('end',()=>{const tail=decoder.end();if(tail)emit({stream,data:tail});});
  }
  child.once('error',()=>{emit({stream:'stderr',data:'Runtime failed to start.\n'});res.end();});
  child.once('close',code=>{emit({exit:code??1});res.end();child=null;});
  res.once('close',stop);
 } catch {if(!res.headersSent)res.writeHead(400);res.end();}
});
server.listen(3000,'0.0.0.0');
setTimeout(()=>{stop();server.close();process.exit(0);},65000).unref();
