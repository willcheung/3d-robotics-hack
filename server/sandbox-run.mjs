import { ExecutionBudget } from '../src/execution-budget.ts';
import { Sandbox } from '@vercel/sandbox';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { parseMessage, LIMITS } from '../src/protocol.ts';

/** A whole per-run VM, with the compiler and student inside a second Linux boundary. */
export class SandboxRun {
 constructor(source,onMessage,onClosed=()=>{},options={}) {
  if(typeof source!=='string'||source.length>LIMITS.source)throw Error('Program is too long (16,000 character limit).');
  if(!['java','python'].includes(options.language??'java'))throw Error('Unknown language');
  this.trace=options.trace===true;this.nextTraceId=2001;this.budget=new ExecutionBudget(LIMITS.runMs,()=>this.fail('20 second runtime work limit reached. Try fewer steps.'));
  this.source=source;this.options=options;this.onMessage=onMessage;this.onClosed=onClosed;
  this.dead=false;this.ready=false;this.output=0;this.nextId=1;this.pending=null;this.buffers={stdout:'',stderr:''};
  this.abort=new AbortController();this.timer=setTimeout(()=>this.fail('Runtime did not load in 45 seconds. Try again.'),LIMITS.loadMs);
  this.finished=this.start();
 }
 emit(message){if(!this.dead)return this.onMessage(message);}
 async start(){
  let cleanupError;
  try {
   if(!process.env.SANDBOX_SNAPSHOT_ID)throw Error('Hosted runtime is not configured. Your draft is safe.');
   // Do not abort creation: if Stop wins the race, retain the returned handle and stop it.
   this.sandbox=await Sandbox.create({source:{type:'snapshot',snapshotId:process.env.SANDBOX_SNAPSHOT_ID},persistent:false,timeout:this.trace?345000:65000,resources:{vcpus:1},ports:[3000],networkPolicy:'deny-all',tags:{app:'robolab',purpose:this.options.purpose??'practice'}});
   if(this.dead)return;
   this.control={name:this.sandbox.name,url:this.sandbox.domain(3000),key:randomBytes(32).toString('base64url')};
   await this.options.onSession?.(this.control);
   if(this.dead)return;
   await this.sandbox.runCommand({cmd:'mkdir',args:['-p','/opt/robot'],sudo:true});
   const files=await Promise.all(['sandbox-relay.mjs','hosted-run.sh','python-run.py'].map(async name=>({path:`/opt/robot/${name}`,content:await readFile(new URL(name,import.meta.url))})));
   for(const name of ['Robot.java','TraceMain.java'])files.push({path:`/opt/robot/${name}`,content:await readFile(new URL(`../java/${name}`,import.meta.url))});
   await this.sandbox.asUser('root').writeFiles(files);
   const prep=await this.sandbox.runCommand({cmd:'sh',sudo:true,args:['-c','javac --add-modules jdk.jdi -d /opt/robot /opt/robot/Robot.java /opt/robot/TraceMain.java && chmod -R a+rX /opt/robot && chown -R ubuntu:ubuntu /opt/robot']});
   if(prep.exitCode!==0)throw Error('Hosted robot runtime could not initialize.');
   if(this.dead)return;
   await this.sandbox.runCommand({cmd:'node',args:['/opt/robot/sandbox-relay.mjs'],env:{RELAY_KEY:this.control.key},detached:true});
   let response;
   for(let i=0;i<12&&!this.dead;i++) {
    try {response=await fetch(this.control.url+'/start',{method:'POST',headers:{Authorization:this.control.key,'Content-Type':'application/json'},body:JSON.stringify({source:this.source,language:this.options.language??'java',trace:this.trace}),signal:this.abort.signal});if(response.ok)break;} catch(e){if(this.dead)throw e;}
    await new Promise(r=>setTimeout(r,100));
   }
   this.source='';
   if(!response?.ok||!response.body)throw Error('Hosted robot connection could not start.');
   let buffer='';const decoder=new TextDecoder();
   for await(const chunk of response.body) {
    if(this.dead)break; buffer+=decoder.decode(chunk,{stream:true});
    if(buffer.length>100000)throw Error('Runtime message limit reached.');
    let at;while(!this.dead&&(at=buffer.indexOf('\n'))>=0) {
     const event=JSON.parse(buffer.slice(0,at));buffer=buffer.slice(at+1);
     if(Object.hasOwn(event,'replied')) {if(event.replied!==this.pending)throw Error('Unexpected robot reply.');this.pending=null;if(this.trace)this.budget.resume();}
     else if(event.stream==='stdout'||event.stream==='stderr')await this.data(event.stream,event.data);
     else if(Object.hasOwn(event,'exit')) {
      for(const stream of ['stdout','stderr'])if(this.buffers[stream])await this.line(stream,this.buffers[stream]);
      if(event.exit!==0||!this.ready||this.pending!==null)throw Error(this.ready?'Program stopped with an error. Read the console and try again.':'Compilation failed. Check the line shown in the console.');
      await this.emit({type:'done'});this.dead=true;
     } else throw Error('Invalid runtime envelope.');
    }
   }
   if(!this.dead)throw Error('Runtime connection ended early. Run again.');
  } catch(e){if(!this.dead)this.fail(e.message||'Hosted runtime unavailable. Try again.');}
  finally {
   this.dead=true;clearTimeout(this.timer);this.budget.stop();this.abort.abort();
   try {if(this.sandbox)await this.sandbox.stop();}catch{cleanupError=Error(`Sandbox cleanup was not confirmed; its ${this.trace?345:65}-second deadline remains active.`);}
   await this.onClosed(cleanupError);
  }
 }
 async data(stream,text){
  if(typeof text!=='string')throw Error('Invalid runtime output');
  this.buffers[stream]+=text;
  if(Buffer.byteLength(this.buffers[stream])>65536)throw Error('Console limit reached. Print less.');
  let at;while(!this.dead&&(at=this.buffers[stream].indexOf('\n'))>=0){const line=this.buffers[stream].slice(0,at);this.buffers[stream]=this.buffers[stream].slice(at+1);await this.line(stream,line);}
  if(Buffer.byteLength(this.buffers[stream])>8192)throw Error('Console line limit reached.');
 }
 async line(stream,line){
  if(Buffer.byteLength(line)>8192)throw Error('Console line limit reached.');
  if(stream==='stdout'&&line==='@compiled'&&!this.ready){this.ready=true;clearTimeout(this.timer);this.timer=setTimeout(()=>this.fail(this.trace?'Practice playback limit reached (5 minutes, including Pause). Run again.':'20 second run limit reached. Try fewer steps.'),this.trace?LIMITS.practiceMs:LIMITS.runMs);if(this.trace)this.budget.resume();await this.emit({type:'ready',...(this.trace?{tracing:true}:{})});return;}
  if(stream==='stdout'&&line.startsWith('@robot ')){
   const m=parseMessage(JSON.parse(line.slice(7)));
   if(this.trace&&m.type==='trace'){if(!this.ready||this.pending!==null||m.id!==this.nextTraceId++)throw Error('Invalid source line trace.');this.pending=m.id;this.budget.pause();await this.emit(m);return;}
   if(!this.ready||this.pending!==null||m.type!=='command'||m.id!==this.nextId||m.id>LIMITS.commands)throw Error('Invalid or overlapping robot command.');
   this.nextId++;this.pending=m.id;if(this.trace)this.budget.pause();await this.emit(m);return;
  }
  this.output+=Buffer.byteLength(line+'\n');if(this.output>LIMITS.output)throw Error('Console limit reached (8 KB). Try printing less.');
  await this.emit({type:'output',text:line+'\n'});
 }
 async reply(id,value){
  if(this.dead||id!==this.pending||!(value===null||typeof value==='number'&&Number.isFinite(value)))throw Error('Unexpected robot reply.');
  await relayReply(this.control,id,value,this.abort.signal);
 }
 fail(text){if(!this.dead)this.emit({type:'error',text});this.stop();}
 stop(){if(this.dead)return;this.dead=true;clearTimeout(this.timer);this.budget.stop();this.abort.abort();}
}
export async function relayReply(control,id,value,signal){
 const r=await fetch(control.url+'/reply',{method:'POST',headers:{Authorization:control.key,'Content-Type':'application/json'},body:JSON.stringify({id,value}),signal:signal??AbortSignal.timeout(5000)});
 if(!r.ok)throw Error('Robot connection was interrupted. Run again.');
}
export async function stopSandbox(control){const s=await Sandbox.get({name:control.name});if(s.status==='running')await s.stop();}
