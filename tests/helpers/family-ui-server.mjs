import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {hostedApi} from '../../server/hosted-api.mjs';
import {MemoryStore} from './memory-store.mjs';
import {headers} from '../../scripts/build-runtime.mjs';
import {JavaRun} from '../../server/java-run.mjs';
import {parseMessage} from '../../src/protocol.ts';
const origin='http://127.0.0.1:4473',root=path.resolve('work/family-ui-dist');
const messages=[],store=new MemoryStore();let time=Date.now();
// Real local isolated Java checks exercise unlocks through the application API.
// Never fall back to cloud services from this disposable account test server.
class LocalCheck extends JavaRun {
 constructor(source,onMessage,onClosed,options){
  if(options.language!=='java'||options.purpose!=='progress-check')throw Error('This local account fixture supports checked Java only.');
  super(source,message=>onMessage(parseMessage(message)),onClosed);
 }
}
const api=hostedApi({store,Run:LocalCheck,mail:{enabled:true,send:async message=>{messages.push(message);return {id:'test-only'};}},recoveryNow:()=>time,appOrigin:origin,password:'test-only-family-ui-session-password-32-characters'});
const server=http.createServer(async(req,res)=>{
 if(req.url==='/__test/mail'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(messages.at(-1)??null));return;}
 if(req.url==='/__test/advance'&&req.method==='POST'){time+=61000;res.end('ok');return;}
 if(await api(req,res))return;
 const pathname=new URL(req.url,origin).pathname,file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{const content=await readFile(file);res.writeHead(200,{...headers(origin,'http://127.0.0.1:4474').app,'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream'});res.end(content);}catch{res.writeHead(404);res.end();}
});
server.listen(4473,'127.0.0.1');
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit()));
