import { spawn, execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { StringDecoder } from 'node:string_decoder';

export const JAVA_IMAGE = 'robolab-java:s02';
export const JAVA_LIMITS = Object.freeze({ source:16000, output:8192, line:8192, compileMs:45000, runMs:20000, commands:2000 });
export function containerArgs(name,image=JAVA_IMAGE) {
  return ['create','--name',name,'--interactive','--network','none','--read-only','--cap-drop','ALL',
    '--security-opt','no-new-privileges','--memory','256m','--memory-swap','256m','--cpus','1','--pids-limit','64',
    '--ulimit','nofile=128:128','--ulimit','core=0:0','--log-driver','none',
    '--tmpfs','/work:rw,noexec,nosuid,nodev,size=64m,uid=10001,gid=10001,mode=700',
    '--tmpfs','/tmp:rw,noexec,nosuid,nodev,size=8m,uid=10001,gid=10001,mode=700',image];
}
function docker(args) {
  return new Promise((resolve,reject) => execFile('docker',args,{timeout:15000,maxBuffer:65536},(error,stdout) => error ? reject(new Error('Java sandbox is unavailable. Your draft is safe; try Python or ask the workshop owner to start Java.')) : resolve(stdout.trim())));
}
/** One disposable container, including compilation. No source ever executes on the host. */
export class JavaRun {
  constructor(source, onMessage, onClosed = () => {}, {image=JAVA_IMAGE} = {}) {
    if (typeof source !== 'string' || source.length > JAVA_LIMITS.source) throw new Error('Program is too long (16,000 character limit).');
    this.image=image;this.source=source; this.onMessage=onMessage; this.onClosed=onClosed;
    this.name=`robolab-java-${randomUUID()}`; this.dead=false; this.compiled=false;
    this.pending=null; this.nextId=1; this.output=0; this.buffers={out:'',err:''}; this.decoders={out:new StringDecoder('utf8'),err:new StringDecoder('utf8')}; this.child=null;
    this.timer=setTimeout(()=>this.fail('Java compilation exceeded 45 seconds. Simplify the program and try again.'),JAVA_LIMITS.compileMs);
    this.finished=this.start();
  }
  emit(message) { if (!this.dead) this.onMessage(message); }
  async start() {
    try {
      await docker(containerArgs(this.name,this.image));
      this.created=true;
      if (this.dead) return;
      await new Promise(resolve => {
        const child=this.child=spawn('docker',['start','--attach','--interactive',this.name],{stdio:['pipe','pipe','pipe']});
        child.stdin.on('error',()=>{});
        child.stdout.on('data',chunk=>this.data('out',chunk));
        child.stderr.on('data',chunk=>this.data('err',chunk));
        child.once('error',()=>{ this.fail('Java sandbox could not start. Try again.'); resolve(); });
        child.once('close',code=>{
          if (!this.dead) {
            for (const stream of ['out','err']) { this.buffers[stream]+=this.decoders[stream].end(); if(this.buffers[stream]) this.line(stream,this.buffers[stream]); }
            if (!this.dead && code===0 && this.compiled && this.pending===null) this.emit({type:'done'});
            else if (!this.dead) this.emit({type:'error',text:this.compiled ? 'Java stopped with an error. Read the console and check your Main.java line.' : 'Java could not compile. Check the Main.java line shown in the console.'});
          }
          this.dead=true; resolve();
        });
        child.stdin.write(Buffer.from(this.source).toString('base64')+'\n');
        this.source='';
      });
    } catch(e) { this.fail(e.message); }
    finally {
      this.dead=true; clearTimeout(this.timer);
      try { if(this.created) await docker(['rm','--force',this.name]); }
      catch { /* Preserve failure visibly; the container still has hard resource limits. */ this.onClosed(new Error(`Cleanup could not be confirmed for ${this.name}.`)); return; }
      this.onClosed();
    }
  }
  data(stream,chunk) {
    if (this.dead) return;
    // Decode streaming UTF-8 without allowing an unterminated line to grow.
    this.buffers[stream]+=this.decoders[stream].write(chunk);
    if (Buffer.byteLength(this.buffers[stream]) > 65536) return this.fail('Java output limit reached. Print less, then Run again.');
    let at;
    while (!this.dead && (at=this.buffers[stream].indexOf('\n')) !== -1) {
      const line=this.buffers[stream].slice(0,at); this.buffers[stream]=this.buffers[stream].slice(at+1);
      this.line(stream,line);
    }
    if (Buffer.byteLength(this.buffers[stream]) > JAVA_LIMITS.line) this.fail('Java output line limit reached. Print less.');
  }
  line(stream,line) {
    if (this.dead) return;
    if (Buffer.byteLength(line)>JAVA_LIMITS.line) return this.fail('Java output line limit reached.');
    if (stream==='out' && line==='@compiled' && !this.compiled) {
      this.compiled=true; clearTimeout(this.timer);
      this.timer=setTimeout(()=>this.fail('20 second run limit reached. Try fewer steps, then Run again.'),JAVA_LIMITS.runMs);
      this.emit({type:'ready'}); return;
    }
    if (stream==='out' && line.startsWith('@robot ')) {
      try {
        const msg=JSON.parse(line.slice(7));
        if (!this.compiled || this.pending!==null || msg.type!=='command' || Object.keys(msg).length!==3 || msg.id!==this.nextId || this.nextId>JAVA_LIMITS.commands) throw new Error();
        this.pending=msg.id; this.nextId++; this.emit(msg); return;
      } catch { return this.fail('Invalid or overlapping Java robot command.'); }
    }
    this.output+=Buffer.byteLength(line+'\n');
    if(this.output>JAVA_LIMITS.output) return this.fail('Console limit reached (8 KB). Try printing less.');
    this.emit({type:'output',text:line+'\n'});
  }
  reply(id,value) {
    if (this.dead || !this.compiled || id!==this.pending || !(value===null || (typeof value==='number' && Number.isFinite(value)))) throw new Error('Unexpected robot reply.');
    this.pending=null; this.child.stdin.write(String(value)+'\n');
  }
  fail(text) { if (!this.dead) this.emit({type:'error',text}); this.stop(); }
  stop() {
    if (this.dead) return;
    this.dead=true; clearTimeout(this.timer);
    // Disconnect the CLI and kill the entire container, including child processes.
    this.child?.kill('SIGKILL');
    // start() waits for CLI close and removes the container in finally. If
    // cancellation raced with creation, it removes the newly created container.
  }
}
