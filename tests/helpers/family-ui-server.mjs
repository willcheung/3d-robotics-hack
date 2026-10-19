import {sealData,getIronSession} from 'iron-session';
import {provision,login,addStudent,saveDraft,recordAttempt,newCode,createFamily,familyPath,update} from '../../server/family-store.mjs';
import {recoveryIndex} from '../../server/recovery.mjs';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {hostedApi} from '../../server/hosted-api.mjs';
import {onboardingService} from '../../server/onboarding.mjs';
import {MemoryStore} from './memory-store.mjs';
import {headers} from '../../scripts/build-runtime.mjs';
import {javaApi} from '../../server/java-api.mjs';
import {buildRuntime} from '../../scripts/build-runtime.mjs';
import {JavaRun} from '../../server/java-run.mjs';
import {lessonTargets} from '../../src/model.ts';
import {initialArena} from '../../src/arena.ts';
import {parseMessage} from '../../src/protocol.ts';
const origin='http://127.0.0.1:4473',root=path.resolve('work/family-ui-dist');
const messages=[],store=new MemoryStore();let time=Date.now();
// Real local isolated Java checks exercise unlocks through the application API.
// Never fall back to cloud services from this disposable account test server.
class LocalCheck extends JavaRun {
 constructor(source,onMessage,onClosed,options){
  if(options.purpose!=='progress-check')throw Error('Use the local practice endpoint.');
  super(source,message=>onMessage(parseMessage(message)),onClosed,{image:options.language==='python'?'robolab-python-check:s01':'robolab-java:s02'});
 }
}
const jobs=[],mail={enabled:true,send:async message=>{if(!messages.some(m=>m.id===message.id))messages.push(message);return {id:'test-only'};}},password='test-only-family-ui-session-password-32-characters',enqueue=async(message,options)=>{jobs.push({message,options});};
const onboarding=onboardingService({store,password,appOrigin:origin,mail,enqueue,now:()=>time});
const api=hostedApi({store,enqueue,Run:LocalCheck,mail,recoveryNow:()=>time,appOrigin:origin,password:'test-only-family-ui-session-password-32-characters'});
const java=javaApi(origin);
const server=http.createServer(async(req,res)=>{
 // Synthetic scoring boundary only. Never bundled into the production handler.
 if(req.url==='/__test/arena'&&req.method==='POST'){
  const session=await getIronSession(req,res,{password,cookieName:'robolab-local'});
  await update(store,familyPath(session.familyId),f=>{for(const p of f.profiles){
   if(p.role==='parent')p.completed=[...lessonTargets.L01];
   p.arena=initialArena(p.completed);
   if(p.id===session.profileId&&p.role==='student')p.arena.challenges.beacon.checks=10;
  }return {value:f};});res.end('ok');return;
 }
 // Test-only persisted prerequisites for draft/navigation fixtures. The real
 // unlock test never calls this endpoint and executes every checked program.
 if(req.url==='/__test/completed'&&req.method==='POST'){
  const session=await getIronSession(req,res,{password,cookieName:'robolab-local'});
  await update(store,familyPath(session.familyId),f=>{f.profiles.find(p=>p.id===session.profileId).completed=[...lessonTargets.L01,...lessonTargets.L02,...lessonTargets.L03];return {value:f};});
  res.end('ok');return;
 }
 if(req.url==='/__test/legacy'&&req.method==='POST'){
  const parts=[];for await(const part of req)parts.push(part);const data=JSON.parse(Buffer.concat(parts).toString()||'{}');
  const setupKey=newCode(),created=data.unfinished?await createFamily(store,{name:'Legacy parent',key:setupKey},password):await provision(store,{parentName:'Legacy parent'});
  const parent=await login(store,created.code),child=await addStudent(store,parent,'Returning pilot'),student=await login(store,child.code);
  for(const lesson of ['L01','L02','L03'])for(const language of ['python','java'])await saveDraft(store,student,{lesson,language,source:`${lesson} ${language} returning draft`,target:{L01:'reverse',L02:'sensor-transfer',L03:'patrol-cove'}[lesson],revision:0});
  await recordAttempt(store,student,{id:crypto.randomUUID(),source:'earlier work',language:'python',target:'beacon',outcome:'reached'},true);
  await update(store,familyPath(student.familyId),f=>{f.profiles.find(p=>p.id===student.profileId).completed=[...lessonTargets.L01,...lessonTargets.L02];return {value:f};});
  if(data.verified){const email=data.email??'verified-parent@example.test',index=recoveryIndex(email,password);await update(store,familyPath(parent.familyId),f=>{f.profiles[0].recovery={email,index,verifiedAt:new Date().toISOString()};return {value:f};});await store.write(index,{families:[parent.familyId]});}
  res.writeHead(200,{'Content-Type':'application/json',...(data.session?{'Set-Cookie':`robolab-local=${await sealData(parent,{password,ttl:3600})}; Path=/; HttpOnly; SameSite=Strict`}:{})});
  res.end(JSON.stringify({code:created.code,studentCode:child.code,profileId:parent.profileId,...(data.unfinished?{setupKey}:{})}));return;
 }

 if(req.url==='/__test/drain'&&req.method==='POST'){for(const job of jobs.splice(0)){if(!job.options?.delaySeconds)await onboarding.deliver(job.message);}res.end('ok');return;}
 if(req.url==='/__test/messages'){res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(messages));return;}
 if(req.url==='/__test/mail'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(messages.at(-1)??null));return;}
 if(req.url==='/__test/newday'&&req.method==='POST'){time+=86400000;res.end('ok');return;}
 if(req.url==='/__test/advance'&&req.method==='POST'){time+=61000;res.end('ok');return;}
 if(await java.handle(req,res))return;
 if(await api(req,res))return;
 const pathname=new URL(req.url,origin).pathname,file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{const content=await readFile(file);res.writeHead(200,{...headers(origin,'http://127.0.0.1:4474').app,'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream'});res.end(content);}catch{res.writeHead(404);res.end();}
});
process.env.APP_ORIGIN=origin;process.env.VITE_RUNTIME_ORIGIN='http://127.0.0.1:4474';process.env.RUNTIME_DIST='work/family-runtime';
await buildRuntime();
const runtimeRoot=path.resolve(process.env.RUNTIME_DIST),policy=headers(origin,'http://127.0.0.1:4474');
const runtime=http.createServer(async(req,res)=>{const pathname=new URL(req.url,origin).pathname,file=path.resolve(runtimeRoot,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(runtimeRoot+path.sep)){res.writeHead(403);res.end();return;}
 try{const content=await readFile(file);res.writeHead(200,{...(pathname==='/worker.js'?policy.worker:policy.frame),'Content-Type':({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.wasm':'application/wasm','.json':'application/json','.zip':'application/zip'})[path.extname(file)]||'application/octet-stream'});res.end(content);}catch{res.writeHead(404);res.end();}});
runtime.listen(4474,'127.0.0.1');server.listen(4473,'127.0.0.1');
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{await java.stop();runtime.close();server.close(()=>process.exit());});
