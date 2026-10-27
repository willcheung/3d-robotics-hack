/** Local Java sandbox transport. All server output is still validated by Runner. */
export class JavaTransport {
  private abort = new AbortController();
  private session = '';
  private dead = false;
  constructor(source: string, private message: (value: unknown) => void, private error: (text: string) => void) {
    void this.start(source);
  }
  private async start(source: string) {
    try {
      const response = await fetch('/api/java/run', {method:'POST',headers:{'Content-Type':'application/json','X-RoboLab-Profile':document.documentElement.dataset.profile??''},body:JSON.stringify({source,trace:true}),credentials:'same-origin',signal:this.abort.signal});
      if(!response.ok) {const failure=await response.json().catch(()=>({}));throw new Error(failure.error||'Java is unavailable. Your draft is safe.');}
      if(!response.headers.get('content-type')?.includes('application/x-ndjson') || !response.body) throw new Error(response.status===409 ? 'Java is still stopping the previous run. Try again in a moment.' : 'Java is unavailable on this workshop. You can keep your Java draft and switch to Python.');
      const reader=response.body.getReader(), decoder=new TextDecoder(); let buffer='';
      while(!this.dead) {
        const part=await reader.read(); if(part.done) break;
        buffer+=decoder.decode(part.value,{stream:true});
        if(buffer.length>65536) throw new Error('Java response exceeded its limit.');
        let at;
        while(!this.dead && (at=buffer.indexOf('\n'))!==-1) {
          const line=buffer.slice(0,at); buffer=buffer.slice(at+1);
          const data=JSON.parse(line);
          if(data.type==='session') {
            if(this.session || Object.keys(data).length!==2 || typeof data.id!=='string' || data.id.length<36 || data.id.length>4096) throw new Error('Invalid Java session.');
            this.session=data.id;
          } else {if(!this.session) throw new Error('Java session missing.');this.message(data);}
        }
      }
      if(!this.dead) throw new Error('Java connection ended unexpectedly. Try again.');
    } catch(e) {if(!this.dead) this.error(e instanceof Error ? e.message : 'Java connection failed.');}
  }
  send(data: Record<string,unknown>) {
    if(this.dead || data.type!=='reply') return;
    void fetch('/api/java/reply',{method:'POST',headers:{'Content-Type':'application/json','X-RoboLab-Profile':document.documentElement.dataset.profile??''},credentials:'same-origin',body:JSON.stringify({session:this.session,id:data.id,value:data.value}),signal:this.abort.signal})
      .then(r=>{if(!r.ok && !this.dead) this.error('Java robot connection was interrupted. Run again.');})
      .catch(()=>{if(!this.dead) this.error('Java robot connection was interrupted. Run again.');});
  }
  stop() {if(this.dead)return;this.dead=true;this.abort.abort();if(this.session.length>36)void fetch('/api/java/stop',{method:'POST',headers:{'Content-Type':'application/json','X-RoboLab-Profile':document.documentElement.dataset.profile??''},credentials:'same-origin',body:JSON.stringify({session:this.session}),keepalive:true}).catch(()=>{});}
}
