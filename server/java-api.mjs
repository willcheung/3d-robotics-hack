import { randomUUID } from 'node:crypto';
import { JavaRun } from './java-run.mjs';

export function javaApi(appOrigin) {
  let active=null;
  const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  async function body(req) {
    const chunks=[]; let bytes=0;
    for await(const chunk of req) {bytes+=chunk.length; if(bytes>70000) throw new Error('Request too large.'); chunks.push(chunk);}
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
  return { stop:async()=>{if(active){active.run.stop();await active.run.finished;}}, async handle(req,res) {
    if(!req.url?.startsWith('/api/java/')) return false;
    // This local development API is deliberately not enabled on a public host.
    if(req.headers.origin!==appOrigin || req.headers.host!==new URL(appOrigin).host || req.method!=='POST' || !req.headers['content-type']?.startsWith('application/json')) {json(res,403,{error:'Only this workshop may use the Java sandbox.'});return true;}
    try {
      const data=await body(req);
      if(req.url==='/api/java/run') {
        if(active?.run.dead) await active.run.finished;
        if(active) {json(res,409,{error:'Java is still stopping another run. Try again in a moment.'});return true;}
        if(!data || Object.keys(data).length!==1 || typeof data.source!=='string' || data.source.length>16000) {json(res,400,{error:'Java source must be at most 16,000 characters.'});return true;}
        const id=randomUUID();
        res.writeHead(200,{'Content-Type':'application/x-ndjson','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
        res.write(JSON.stringify({type:'session',id})+'\n');
        const session={id,run:null}; active=session;
        const run=session.run=new JavaRun(data.source,message=>{
          if(res.destroyed) return;
          if(!res.write(JSON.stringify(message)+'\n')) run.stop();
        },error=>{if(error) console.error(error.message);else if(active===session) active=null;res.end();});
        res.once('close',()=>run.stop());
      } else if(req.url==='/api/java/reply') {
        if(!active || data?.session!==active.id || Object.keys(data).length!==3) {json(res,404,{error:'Java run is no longer active.'});return true;}
        active.run.reply(data.id,data.value); json(res,200,{ok:true});
      } else json(res,404,{error:'Unknown Java operation.'});
    } catch(e) {if(!res.headersSent) json(res,400,{error:e.message});else res.end();}
    return true;
  }};
}
