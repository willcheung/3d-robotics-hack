import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {sealData} from 'iron-session';
import {MemoryStore} from './helpers/memory-store.mjs';
import {onboardingService,AUTH_TTL} from '../server/onboarding.mjs';
import {hostedApi} from '../server/hosted-api.mjs';
import {provision,login,current,addStudent,saveDraft,recordAttempt,update,familyPath,newCode,createFamily} from '../server/family-store.mjs';
const password='parent-email-transition-test-only-password';
async function fixture(){
 const store=new MemoryStore(),seed=await provision(store),parent=await login(store,seed.code),child=await addStudent(store,parent,'Pilot'),student=await login(store,child.code),messages=[];
 let time=Date.now();const mail={enabled:true,send:async m=>{messages.push(m);return {id:'fixture-mail'};}};
 const service=onboardingService({store,password,appOrigin:'https://example.test',mail,now:()=>time,enqueue:async()=>{}});
 async function proof(email='parent@example.test'){const key=newCode();await service.start({key,email});await service.verify({key,code:messages.at(-1).text.match(/\b\d{6}\b/)[0]});return key;}
 return {store,seed,parent,child,student,messages,mail,service,proof,advance:ms=>{time+=ms;}};
}
test('connecting an old family preserves all profiles, student codes, six drafts, history and completion',async()=>{
 const f=await fixture();
 for(const lesson of ['L01','L02','L03'])for(const language of ['python','java'])await saveDraft(f.store,f.student,{lesson,language,source:`${lesson} ${language} original work`,target:{L01:'reverse',L02:'sensor-transfer',L03:'patrol-cove'}[lesson],revision:0});
 await recordAttempt(f.store,f.student,{id:crypto.randomUUID(),source:'saved attempt',language:'python',target:'beacon',outcome:'reached'},true);
 const before=structuredClone((await current(f.store,f.student)).profile),key=await f.proof();
 const [a,b]=await Promise.all([f.service.finish({key,parentCode:f.seed.code}),f.service.finish({key,parentCode:f.seed.code})]);
 assert.deepEqual(a,b);assert.deepEqual(a.session,f.parent);assert.equal((await current(f.store,a.session)).profile.emailLogin,true);
 assert.deepEqual((await current(f.store,await login(f.store,f.child.code))).profile,before);
 assert.equal([...f.store.rows.keys()].filter(p=>p.startsWith('families/')).length,1);
 f.advance(61000);const next=await f.proof();assert.deepEqual((await f.service.finish({key:next,familyId:f.parent.familyId})).session,f.parent);
 await assert.rejects(f.service.finish({key:next,parentCode:f.seed.code}),/already uses email/);
 assert.ok(!JSON.stringify([...f.store.rows.values()]).includes(f.seed.code));
});
test('email linking rejects missing proof, student codes, other active families and an existing different verified address',async()=>{
 const f=await fixture(),key=newCode();
 await assert.rejects(f.service.finish({key,parentCode:f.seed.code}),/incorrect, expired or used/);
 const valid=await f.proof();await assert.rejects(f.service.finish({key:valid,parentCode:f.child.code}),/Student codes cannot/);
 const other=await provision(f.store),otherSession=await login(f.store,other.code);
 await assert.rejects(f.service.finish({key:valid,parentCode:f.seed.code},otherSession),/Sign out/);
 await update(f.store,familyPath(f.parent.familyId),r=>{r.profiles[0].recovery={email:'different@example.test',index:'old-index'};return {value:r};});
 await assert.rejects(f.service.finish({key:valid,parentCode:f.seed.code}),/already has a verified email/);
 assert.equal((await current(f.store,f.parent)).profile.emailLogin,undefined);
});
test('two competing emails cannot reassign the same family; a committed connection retries after a lost response',async()=>{
 const f=await fixture(),a=await f.proof('a@example.test'),b=await f.proof('b@example.test');
 const r=await Promise.allSettled([a,b].map(key=>f.service.finish({key,parentCode:f.seed.code})));
 assert.equal(r.filter(x=>x.status==='fulfilled').length,1);
 const winner=r[0].status==='fulfilled'?a:b;assert.deepEqual((await f.service.finish({key:winner,parentCode:f.seed.code})).session,f.parent);
 f.advance(AUTH_TTL);await assert.rejects(f.service.finish({key:winner,parentCode:f.seed.code}),/expired/);
});
test('partial index/family writes keep a recoverable family and cannot turn a bound connection into signup',async()=>{
 for(const failAt of ['index','family','response']){
  const f=await fixture(),key=await f.proof(),write=f.store.write.bind(f.store);let failed=false;
  f.store.write=async(path,value,...rest)=>{
   const match=failAt==='index'?path.startsWith('recovery-emails/'):path===familyPath(f.parent.familyId)&&value.profiles[0].emailLogin;
   if(match&&!failed){failed=true;if(failAt==='response')await write(path,value,...rest);throw Error('lost write');}
   return write(path,value,...rest);
  };
  // The recovery index's path is hashed; detect it independently from its contents.
  if(failAt==='index')f.store.write=async(path,value,...rest)=>{if(Array.isArray(value?.families)&&!failed){failed=true;throw Error('lost write');}return write(path,value,...rest);};
  await assert.rejects(f.service.finish({key,parentCode:f.seed.code}),/lost write/);
  if(failAt!=='response')await assert.rejects(f.service.finish({key,create:true}),/already connected/);
  assert.deepEqual((await f.service.finish({key,parentCode:f.seed.code})).session,f.parent);
  f.advance(61000);const next=await f.proof();assert.deepEqual((await f.service.finish({key:next,familyId:f.parent.familyId})).session,f.parent);
  assert.equal([...f.store.rows.keys()].filter(p=>p.startsWith('families/')).length,1);
 }
});
test('unfinished legacy setup can connect after its invite write failed, but cannot create a family or revive a rotated credential',async()=>{
 const f=await fixture(),setupKey=newCode(),write=f.store.write.bind(f.store);let failed=false;
 f.store.write=async(path,...args)=>{if(path.startsWith('invites/')&&!failed){failed=true;throw Error('invite not saved');}return write(path,...args);};
 await assert.rejects(createFamily(f.store,{name:'Interrupted parent',key:setupKey},password),/invite not saved/);
 const key=await f.proof();const linked=await f.service.finish({key,parentSetupKey:setupKey});assert.equal((await current(f.store,linked.session)).profile.emailLogin,true);
 assert.deepEqual(await f.service.finish({key,parentSetupKey:setupKey}),linked);
 const count=[...f.store.rows.keys()].filter(p=>p.startsWith('families/')).length;
 await assert.rejects(f.service.finish({key,parentSetupKey:newCode()}),/not saved/);assert.equal([...f.store.rows.keys()].filter(p=>p.startsWith('families/')).length,count);
 await update(f.store,familyPath(linked.session.familyId),r=>{r.profiles[0].epoch++;return {value:r};});
 await assert.rejects(f.service.finish({key,parentSetupKey:setupKey}),e=>e.status===401);
});
test('HTTP accepts student codes only, retires legacy credential endpoints and preserves sessions on failed parent login',async()=>{
 const f=await fixture();let api;const server=createServer((req,res)=>void api(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;api=hostedApi({store:f.store,password,appOrigin:base,mail:f.mail,enqueue:async()=>{}});
 const post=(path,data,cookie='',headers={})=>fetch(base+'/api/family'+path,{method:'POST',headers:{origin:base,'content-type':'application/json',cookie,...headers},body:JSON.stringify(data)});
 try{
  const signed=await post('/login',{code:f.child.code});assert.equal(signed.status,200);const cookie=signed.headers.get('set-cookie').split(';')[0];
  assert.equal((await post('/login',{code:f.seed.code},cookie)).status,403);
  const state=await (await fetch(base+'/api/family',{headers:{cookie}})).json();assert.equal(state.profile.id,f.student.profileId);
  for(const path of ['/create','/forgot','/recover','/email','/emailverify']){const r=await post(path,{code:f.seed.code,key:newCode()},cookie);assert.equal(r.status,410);assert.equal(r.headers.get('set-cookie'),null);}
  assert.equal((await post('/create',{},'',{origin:'https://foreign.test'})).status,403);
  const key=await f.proof();assert.equal((await post('/authfinish',{key,parentCode:f.seed.code},cookie)).status,409);
  const connected=await post('/authfinish',{key,parentCode:f.seed.code});assert.equal(connected.status,200);assert.match(connected.headers.get('set-cookie'),/HttpOnly/i);
  assert.equal((await post('/login',{code:f.seed.code})).status,403);assert.equal((await post('/login',{code:f.child.code})).status,200);
  assert.equal((await post('/authfinish',{key,parentCode:f.seed.code})).status,200,'same challenge can retry after its response was lost');
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('an existing legacy parent session can connect only its own family and requires a current profile header',async()=>{
 const f=await fixture();let api;const server=createServer((req,res)=>void api(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;api=hostedApi({store:f.store,password,appOrigin:base,mail:f.mail,enqueue:async()=>{}});
 const cookie='robolab-local='+await sealData(f.parent,{password,ttl:3600});
 const post=(path,data,profile)=>fetch(base+'/api/family'+path,{method:'POST',headers:{origin:base,'content-type':'application/json',cookie,...(profile?{'x-robolab-profile':profile}:{})},body:JSON.stringify(data)});
 try{
  const key=newCode(),data={key,email:'legacy-session@example.test'};
  assert.equal((await post('/authstart',data)).status,409);assert.equal((await post('/authstart',data,'other-profile')).status,409);
  assert.equal((await post('/authstart',data,f.parent.profileId)).status,200);
  assert.equal((await post('/authverify',{key,code:f.messages.at(-1).text.match(/\b\d{6}\b/)[0]},f.parent.profileId)).status,200);
  const other=await provision(f.store);assert.equal((await post('/authfinish',{key,parentCode:other.code},f.parent.profileId)).status,409);
  assert.equal((await post('/authfinish',{key,parentCode:f.seed.code},f.parent.profileId)).status,200);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
