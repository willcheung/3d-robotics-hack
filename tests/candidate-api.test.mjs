// Protected generated URLs cannot use the live frame's exact parent origin.
// Test their real streaming/API configuration directly; browser acceptance uses
// the protected staging pair, then repeats on the public alias after promotion.
import test from 'node:test';import assert from 'node:assert/strict';import {randomBytes,randomUUID} from 'node:crypto';import {readFile} from 'node:fs/promises';import {del} from '@vercel/blob';
import {initialState,command,tick,reached,targets} from '../src/model.ts';
import {hashCode,familyPath} from '../server/family-store.mjs';
test('protected production candidate creates a family and streams real Java plus checked Python',async()=>{
 const candidate=process.env.HOSTED_CANDIDATE_URL,origin=process.env.HOSTED_APP_ORIGIN;
 assert.ok(candidate?.startsWith('https:')&&origin?.startsWith('https:'),'Set explicit candidate and app origins');
 const {bypassSecret}=JSON.parse(await readFile(process.env.HOSTED_BYPASS_FILE)),paths=[];
 let cookie='',profile='',handle;
 const headers=()=>({'Content-Type':'application/json',Origin:origin,'x-vercel-protection-bypass':bypassSecret,Cookie:cookie,...(profile?{'X-RoboLab-Profile':profile}:{})});
 const post=(path,data)=>fetch(candidate+path,{method:'POST',headers:headers(),body:JSON.stringify(data),signal:AbortSignal.timeout(80000)});
 const get=()=>fetch(candidate+'/api/family',{headers:headers()}).then(r=>r.json());
 try{
  const created=await post('/api/family/create',{name:'Candidate fixture',key:randomBytes(24).toString('base64url')});assert.equal(created.status,200);const code=(await created.json()).code;
  cookie=created.headers.get('set-cookie').split(';')[0];let state=await get();profile=state.profile.id;
  // New family IDs are derived from setup keys; discover this fixture using only its code.
  const {BlobStore,login,SERVICE_LIMIT_PATH}=await import('../server/family-store.mjs');const privateStore=new BlobStore(),session=await login(privateStore,code);paths.push(familyPath(session.familyId),`invites/${hashCode(code)}.json`);
  const student=await post('/api/family/students',{name:'Candidate student'});assert.equal(student.status,200);const childCode=(await student.json()).code;paths.push(`invites/${hashCode(childCode)}.json`);
  const entered=await post('/api/family/login',{code:childCode});assert.equal(entered.status,200);cookie=entered.headers.get('set-cookie').split(';')[0];profile='';state=await get();profile=state.profile.id;assert.equal(state.profile.role,'student');
  const source='public class Main { public static void main(String[] args) throws Exception { Robot.servo(120); Robot.motor(.5); Robot.waitTicks(100); Robot.motor(0); } }';
  const run=await post('/api/java/run',{source});assert.equal(run.status,200);assert.match(run.headers.get('content-type'),/ndjson/);
  let model=initialState(),pending='',done=false;const decoder=new TextDecoder();
  for await(const chunk of run.body){pending+=decoder.decode(chunk,{stream:true});let end;while((end=pending.indexOf('\n'))>=0){const line=pending.slice(0,end);pending=pending.slice(end+1);if(!line)continue;const m=JSON.parse(line);
   if(m.type==='session')handle=m.id;
   if(m.type==='error')throw Error(m.text);
   if(m.type==='done')done=true;
   if(m.type==='command'){let value=null;if(m.command.op==='wait')for(let i=0;i<m.command.value;i++)model=tick(model);else {const next=command(model,m.command);model=next.state;value=next.value;}assert.ok(handle);const reply=await post('/api/java/reply',{session:handle,id:m.id,value});assert.equal(reply.status,200);}
  }}
  assert.equal(done,true);assert.equal(reached(model,targets.beacon),true);
  const verified=await post('/api/family/verify',{id:randomUUID(),language:'python',target:'beacon',source:'from robot import servo, motor, wait\nawait servo(120)\nawait motor(.5)\nawait wait(100)\nawait motor(0)'});assert.equal(verified.status,200);const result=await verified.json();assert.equal(result.outcome,'reached');assert.deepEqual((await get()).completed,['beacon']);assert.equal((await get()).runBusy,false);assert.equal((await privateStore.read(SERVICE_LIMIT_PATH)).value.runs.filter(r=>r.key.startsWith(session.familyId+':')).length,0);
 }finally{if(handle)await post('/api/java/stop',{session:handle}).catch(()=>{});if(paths.length)await del(paths);}
});
