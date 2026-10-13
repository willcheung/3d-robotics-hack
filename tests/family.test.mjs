import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createServer} from 'node:http';
import {provision,login,current,addStudent,studentAccess,saveDraft,reserveRun,releaseRun,recordAttempt,view} from '../server/family-store.mjs';
import {hostedApi} from '../server/hosted-api.mjs';
import {MemoryStore} from './helpers/memory-store.mjs';
async function fixtures(){const store=new MemoryStore(),seed=await provision(store),parent=await login(store,seed.code),a=await addStudent(store,parent,'A'),b=await addStudent(store,parent,'B');return {store,seed,parent,a:await login(store,a.code),b:await login(store,b.code)};}
const attempt=(extra={})=>({id:randomUUID(),language:'python',source:'print(1)',target:'beacon',outcome:'reached',seconds:2,...extra});
test('separate families/students, parent-only provisioning, private code, rotation and revocation',async()=>{
 const {store,parent,a,b}=await fixtures();
 await assert.rejects(addStudent(store,a,'forbidden'),e=>e.status===403);
 await saveDraft(store,a,{language:'python',source:'PRIVATE A',revision:0});
 const fb=await current(store,b);assert.equal(JSON.stringify(view(fb.family,fb.profile)).includes('PRIVATE A'),false);
 const second=await provision(store);const outsider=await login(store,second.code);assert.equal((await current(store,outsider)).family.profiles.length,1);
 await assert.rejects(studentAccess(store,outsider,a.profileId,true),e=>e.status===404);
 const rotated=await studentAccess(store,parent,a.profileId,false);await assert.rejects(current(store,a),e=>e.status===401);
 const fresh=await login(store,rotated.code);assert.equal((await current(store,fresh)).profile.drafts.python.source,'PRIVATE A');
 await studentAccess(store,parent,a.profileId,true);await assert.rejects(login(store,rotated.code),e=>e.status===401);
});
test('atomic draft conflicts preserve source; missing/type/size errors are rejected',async()=>{
 const {store,a}=await fixtures();
 const r=await Promise.allSettled(['a','b'].map(source=>saveDraft(store,a,{language:'java',source,revision:0})));
 assert.equal(r.filter(v=>v.status==='fulfilled').length,1);assert.equal(r.find(v=>v.status==='rejected').reason.status,409);
 assert.equal((await current(store,a)).profile.drafts.java.revision,1);
 await assert.rejects(saveDraft(store,a,{language:'java',source:'x'.repeat(16001),revision:1}),e=>e.status===400);
});
test('experiments are idempotent, bounded, source-immutable and cannot claim unlocks',async()=>{
 const {store,a}=await fixtures(),item=attempt();
 await recordAttempt(store,a,{...item,verified:true,score:999});await recordAttempt(store,a,item);
 let p=(await current(store,a)).profile;assert.equal(p.experiments,1);assert.deepEqual(p.completed,[]);
 await assert.rejects(recordAttempt(store,a,{...item,source:'different'}),e=>e.status===409);
 await recordAttempt(store,a,item,true);p=(await current(store,a)).profile;assert.deepEqual(p.completed,['beacon']);assert.equal(p.experiments,1);
 for(let i=0;i<15;i++)await recordAttempt(store,a,attempt({outcome:'stopped'}));
 p=(await current(store,a)).profile;assert.equal(p.history.length,12);assert.deepEqual(p.completed,['beacon']);
});
test('atomic per-student/family gates and daily budgets survive competing reservations',async()=>{
 const {store,a,b}=await fixtures(),id=randomUUID();
 const r=await Promise.allSettled([reserveRun(store,a,id),reserveRun(store,a,randomUUID())]);assert.equal(r.filter(v=>v.status==='fulfilled').length,1);
 await reserveRun(store,b,randomUUID());await assert.rejects(reserveRun(store,a,randomUUID()),e=>e.status===409);
 await releaseRun(store,a,id);
 // Expired reservations recover without losing the durable daily count.
 const row=[...store.rows.values()].find(r=>r.value.id===a.familyId);row.value.runs=[];row.value.daily.count=60;
 await assert.rejects(reserveRun(store,a,randomUUID()),e=>e.status===429);
});
test('HTTP boundary: sessions, CSRF, stale profile, forged results and other-family capabilities',async()=>{
 const {store,seed}=await fixtures();let api;
 const server=createServer((req,res)=>void api(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}`;api=hostedApi({store,appOrigin:origin,password:'a-test-only-password-that-is-at-least-32-characters'});
 const post=(path,data,cookie='',headers={})=>fetch(origin+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie,...headers},body:JSON.stringify(data)});
 try{
  assert.equal((await fetch(origin+'/api/family')).status,401);
  assert.equal((await post('/api/family/login',{code:seed.code},'',{Origin:'https://foreign.test'})).status,403);
  const entered=await post('/api/family/login',{code:seed.code});assert.equal(entered.status,200);const cookie=entered.headers.get('set-cookie').split(';')[0];
  const data=await (await fetch(origin+'/api/family',{headers:{Cookie:cookie}})).json();const profile={'X-RoboLab-Profile':data.profile.id};
  assert.equal((await post('/api/family/draft',{language:'python',source:'private',revision:0},cookie,{'X-RoboLab-Profile':randomUUID()})).status,409);
  assert.equal((await post('/api/family/attempt',attempt({verified:true}),cookie,profile)).status,200);
  assert.equal((await post('/api/family/verify',attempt({target:'sensor-left'}),cookie,profile)).status,403);
  const after=await (await fetch(origin+'/api/family',{headers:{Cookie:cookie}})).json();assert.deepEqual(after.completed,[]);
  assert.equal((await post('/api/java/reply',{session:'forged',id:1,value:1},cookie,profile)).status,403);
  assert.equal((await post('/api/family/logout',{},cookie)).status,200);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('durable cancellation wins creation and result races without awarding completion',async()=>{
 const {cancelRun,bindRun}=await import('../server/family-store.mjs');
 const {store,a,b}=await fixtures(),early=attempt();
 await cancelRun(store,a,early.id);await assert.rejects(reserveRun(store,a,early.id),e=>e.status===409);
 const active=attempt();await reserveRun(store,a,active.id);assert.equal(await bindRun(store,a,active.id,'test-sandbox'),true);
 assert.equal((await cancelRun(store,b,active.id)).name,undefined,'another student cannot cancel this VM');
 assert.equal((await cancelRun(store,a,active.id)).name,'test-sandbox');await assert.rejects(recordAttempt(store,a,active,true),e=>e.status===409);assert.deepEqual((await current(store,a)).profile.completed,[]);
 await releaseRun(store,a,active.id);
 const finished=attempt();await reserveRun(store,a,finished.id);await recordAttempt(store,a,finished,true);assert.equal((await cancelRun(store,a,finished.id)).completed,true);
});

const setupPassword='test-only-setup-password-with-at-least-32-characters';
const setupKey=()=>randomUUID().replaceAll('-','');
const {createFamily,setupIdentity,SIGNUP_LIMIT_PATH,SERVICE_LIMIT_PATH,reserveServiceRun,releaseServiceRun,familyPath}=await import('../server/family-store.mjs');
test('family setup retries are atomic, recover partial writes and never expose access credentials in progress',async()=>{
 const store=new MemoryStore(),data={name:' Parent ',key:setupKey()};
 const results=await Promise.all([createFamily(store,data,setupPassword),createFamily(store,data,setupPassword)]);
 assert.equal(results[0].code,results[1].code);assert.deepEqual(results[0].session,results[1].session);
 assert.equal([...store.rows.keys()].filter(p=>p.startsWith('families/')).length,1);
 assert.equal((await store.read(SIGNUP_LIMIT_PATH)).value.keys.length,1);
 const {family,profile}=await current(store,await login(store,results[0].code));assert.equal(profile.name,'Parent');assert.equal(profile.role,'parent');
 assert.equal(JSON.stringify(family).includes(results[0].code),false);assert.equal(JSON.stringify(family).includes(data.key),false);
 assert.equal(JSON.stringify(view(family,profile)).includes('registration'),false);
 const child=await addStudent(store,results[0].session,'Nova');assert.equal((await current(store,await login(store,child.code))).profile.role,'student');
 const partial=new MemoryStore(),write=partial.write.bind(partial);let failed=false;
 partial.write=async(path,...args)=>{if(path.startsWith('invites/')&&!failed){failed=true;throw Error('connection lost');}return write(path,...args);};
 await assert.rejects(createFamily(partial,data,setupPassword),/connection lost/);
 const recovered=await createFamily(partial,data,setupPassword);assert.equal(recovered.code,results[0].code);await login(partial,recovered.code);
 assert.equal((await partial.read(SIGNUP_LIMIT_PATH)).value.keys.length,1);
});
test('setup validation, changed retries and global daily signup limits preserve existing families',async()=>{
 const store=new MemoryStore(),now=Date.parse('2026-10-11T12:00:00Z');
 for(const data of [{name:'',key:setupKey()},{name:'x'.repeat(33),key:setupKey()},{name:'Parent',key:'short'}])await assert.rejects(createFamily(store,data,setupPassword,{now}),e=>e.status===400);
 assert.equal(store.rows.size,0);
 const original={name:'Parent',key:setupKey()},created=await createFamily(store,original,setupPassword,{now});
 await assert.rejects(createFamily(store,{...original,name:'Other'},setupPassword,{now}),e=>e.status===409);
 await assert.rejects(createFamily(store,original,setupPassword+'rotated',{now}),e=>e.status===409);
 for(let i=0;i<8;i++)await createFamily(store,{name:'Parent',key:setupKey()},setupPassword,{now});
 const last=await Promise.allSettled([0,1].map(()=>createFamily(store,{name:'Parent',key:setupKey()},setupPassword,{now})));
 assert.equal(last.filter(r=>r.status==='fulfilled').length,1);assert.equal(last.find(r=>r.status==='rejected').reason.status,429);
 assert.equal((await createFamily(store,original,setupPassword,{now})).code,created.code);
 await createFamily(store,{name:'Tomorrow',key:setupKey()},setupPassword,{now:now+86400000});
 assert.equal((await store.read(SIGNUP_LIMIT_PATH)).value.keys.length,1);
 assert.equal((await current(store,created.session)).profile.name,'Parent');
});
test('global hosted run cap spans families with idempotent, expiring and daily reservations',async()=>{
 const store=new MemoryStore(),a={familyId:'family-a',profileId:'a'},b={familyId:'family-b',profileId:'b'},c={familyId:'family-c',profileId:'c'},now=Date.parse('2026-10-11T12:00:00Z'),id=randomUUID();
 const concurrent=await Promise.allSettled([a,b,c].map(s=>reserveServiceRun(store,s,id,{now})));
 assert.equal(concurrent.filter(r=>r.status==='fulfilled').length,2);assert.equal(concurrent.find(r=>r.status==='rejected').reason.status,429);
 const accepted=[a,b,c].filter((_,i)=>concurrent[i].status==='fulfilled');
 await reserveServiceRun(store,accepted[0],id,{now});assert.equal((await store.read(SERVICE_LIMIT_PATH)).value.count,2);
 await releaseServiceRun(store,{familyId:'outsider'},id);assert.equal((await store.read(SERVICE_LIMIT_PATH)).value.runs.length,2);
 await releaseServiceRun(store,accepted[0],id);assert.equal((await store.read(SERVICE_LIMIT_PATH)).value.runs.length,1);
 await reserveServiceRun(store,c,randomUUID(),{now:now+120001});assert.equal((await store.read(SERVICE_LIMIT_PATH)).value.runs.length,1);
 store.rows.get(SERVICE_LIMIT_PATH).value.count=120;
 await assert.rejects(reserveServiceRun(store,a,randomUUID(),{now:now+120002}),e=>e.status===429);
 await reserveServiceRun(store,a,randomUUID(),{now:now+86400000});assert.equal((await store.read(SERVICE_LIMIT_PATH)).value.count,1);
});
test('public setup HTTP boundary auto-signs in parents, protects existing sessions and cleans denied run leases',async()=>{
 const store=new MemoryStore();let api,started=0;
 class NeverRun{constructor(){started++;throw Error('unexpected compute');}}
 const server=createServer((req,res)=>void api(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}`;api=hostedApi({store,Run:NeverRun,appOrigin:origin,password:setupPassword});
 const post=(path,data,cookie='',headers={})=>fetch(origin+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie,...headers},body:JSON.stringify(data)});
 const read=cookie=>fetch(origin+'/api/family',{headers:{Cookie:cookie}}).then(r=>r.json());
 try{
  const data={name:'Parent',key:setupKey()};
  assert.equal((await post('/api/family/create',data,'',{Origin:'https://foreign.test'})).status,403);assert.equal(store.rows.size,0);
  assert.equal((await post('/api/family/create',{name:'Parent',key:'bad'})).status,400);
  const created=await post('/api/family/create',data);assert.equal(created.status,200);const parentCode=(await created.json()).code,cookie=created.headers.get('set-cookie').split(';')[0];
  const parent=await read(cookie);assert.equal(parent.profile.role,'parent');assert.equal(parent.profile.name,'Parent');
  assert.equal((await post('/api/family/create',data,cookie)).status,200);
  assert.equal((await post('/api/family/create',{name:'Other',key:setupKey()},cookie)).status,409);assert.equal((await read(cookie)).profile.id,parent.profile.id);
  const headers={'X-RoboLab-Profile':parent.profile.id};
  const child=await post('/api/family/students',{name:'Nova'},cookie,headers);assert.equal(child.status,200);const childCode=(await child.json()).code;
  const childLogin=await post('/api/family/login',{code:childCode});const childCookie=childLogin.headers.get('set-cookie').split(';')[0];
  assert.equal((await post('/api/family/create',data,childCookie)).status,409);
  const childProfile=(await read(childCookie)).profile;
  assert.equal((await post('/api/family/students',{name:'Forbidden'},childCookie,{'X-RoboLab-Profile':childProfile.id})).status,403);
  assert.equal((await post('/api/family/login',{code:parentCode})).status,200);
  await store.write(SERVICE_LIMIT_PATH,{day:new Date().toISOString().slice(0,10),count:120,runs:[]});
  for(const path of ['/api/java/run','/api/family/verify']){
   const denied=await post(path,attempt(),cookie,headers);assert.equal(denied.status,429);assert.match((await denied.json()).error,/allowance/);
   assert.deepEqual((await current(store,await login(store,parentCode))).family.runs,[]);
  }
  assert.equal(started,0);
  // A revoked cookie may start a new family, but cannot resurrect its old one.
  const session=await login(store,childCode);store.rows.get(familyPath(session.familyId)).value.profiles.find(p=>p.id===session.profileId).active=false;
  assert.equal((await post('/api/family/create',{name:'New parent',key:setupKey()},childCookie)).status,200);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});

test('different students with the same attempt ID consume and release separate service slots',async()=>{
 const store=new MemoryStore(),id=randomUUID(),a={familyId:'same-family',profileId:'a'},b={familyId:'same-family',profileId:'b'},outsider={familyId:'other-family',profileId:'c'};
 await Promise.all([reserveServiceRun(store,a,id),reserveServiceRun(store,b,id)]);
 assert.equal((await store.read(SERVICE_LIMIT_PATH)).value.count,2);
 assert.equal((await store.read(SERVICE_LIMIT_PATH)).value.runs.length,2);
 await assert.rejects(reserveServiceRun(store,outsider,id),e=>e.status===429);
 await releaseServiceRun(store,a,id);assert.equal((await store.read(SERVICE_LIMIT_PATH)).value.runs.length,1);
 await reserveServiceRun(store,b,id);assert.equal((await store.read(SERVICE_LIMIT_PATH)).value.count,2,'retry keeps the other student’s reservation');
 await reserveServiceRun(store,outsider,id);assert.equal((await store.read(SERVICE_LIMIT_PATH)).value.runs.length,2);
});

test('lesson drafts isolate languages/lessons, retain legacy keys and enforce per-lesson conflicts',async()=>{
 const {store,a,b}=await fixtures();
 await saveDraft(store,a,{language:'python',source:'legacy mission one',revision:0});
 await saveDraft(store,a,{language:'python',lesson:'L02',source:'sensor python',revision:0});
 await saveDraft(store,a,{language:'java',lesson:'L02',source:'sensor java',revision:0});
 const drafts=(await current(store,a)).profile.drafts;
 assert.equal(drafts.python.source,'legacy mission one');assert.equal(drafts['L02.python'].source,'sensor python');assert.equal(drafts['L02.java'].source,'sensor java');
 assert.deepEqual((await current(store,b)).profile.drafts,{});
 await assert.rejects(saveDraft(store,a,{language:'python',lesson:'L02',source:'stale',revision:0}),e=>e.status===409);
 for(const lesson of ['L04',['L02'],{}])await assert.rejects(saveDraft(store,a,{language:'python',lesson,source:'future',revision:0}),e=>e.status===400);
});
test('Mission 2 checked unlocks require Mission 1; practice, errors and another student cannot earn badges',async()=>{
 const {store,a,b}=await fixtures(),sensor=attempt({target:'sensor-left'});
 await recordAttempt(store,a,{...sensor,verified:true,lesson:'L01',lessonVersion:999});
 await assert.rejects(recordAttempt(store,a,sensor,true),e=>e.status===403);assert.deepEqual((await current(store,a)).profile.completed,[]);
 for(const target of ['beacon','farther','reverse'])await recordAttempt(store,a,attempt({target}),true);
 await recordAttempt(store,a,sensor,true);let p=(await current(store,a)).profile;assert.equal(p.completed.length,4);assert.equal(p.history[0].lesson,'L02');assert.equal(p.history[0].lessonVersion,1);
 for(const outcome of ['error','stopped','missed','unavailable'])await recordAttempt(store,a,attempt({target:'sensor-right',outcome}),true);
 assert.equal((await current(store,a)).profile.completed.includes('sensor-right'),false);
 await assert.rejects(recordAttempt(store,b,attempt({target:'sensor-right'}),true),e=>e.status===403);
 assert.deepEqual((await current(store,b)).profile.completed,[]);
});


test('Mission 3 keeps prior work, requires checked Mission 2 and ignores claimed version/completion',async()=>{
 const {store,a,b}=await fixtures();
 for(const [lesson,language] of [['L01','python'],['L02','java'],['L03','python'],['L03','java']])await saveDraft(store,a,{lesson,language,source:lesson+' '+language,revision:0});
 await assert.rejects(recordAttempt(store,a,attempt({target:'patrol-ridge'}),true),e=>e.status===403);
 await recordAttempt(store,a,attempt({target:'patrol-ridge',lesson:'L01',version:'forged',verified:true}));assert.equal((await current(store,a)).profile.completed.length,0);
 for(const target of ['beacon','farther','reverse','sensor-left','sensor-right','sensor-transfer'])await recordAttempt(store,a,attempt({target}),true);
 const reached=attempt({target:'patrol-ridge',lesson:'L02',lessonVersion:999,version:'forged'});await recordAttempt(store,a,reached,true);await recordAttempt(store,a,reached,true);
 const p=(await current(store,a)).profile;assert.equal(p.completed.length,7);assert.equal(p.history[0].lesson,'L03');assert.equal(p.history[0].lessonVersion,1);assert.equal(p.history[0].receipt.model,'signal-patrol-v1');assert.equal(p.drafts.python.source,'L01 python');assert.equal(p.drafts['L02.java'].source,'L02 java');assert.equal(p.drafts['L03.python'].source,'L03 python');assert.equal(p.drafts['L03.java'].source,'L03 java');
 for(const outcome of ['missed','error','stopped','unavailable'])await recordAttempt(store,a,attempt({target:'patrol-extra',outcome}),true);
 assert.equal((await current(store,a)).profile.completed.includes('patrol-extra'),false);await assert.rejects(recordAttempt(store,b,attempt({target:'patrol-extra'}),true),e=>e.status===403);
});

test('draft saves pair valid challenge context with code, keep old clients compatible and isolate profiles',async()=>{
 const {store,a,b}=await fixtures();
 const saved=await saveDraft(store,a,{lesson:'L03',language:'java',source:'cove code',target:'patrol-cove',revision:0});
 assert.equal(saved.target,'patrol-cove');
 await assert.rejects(saveDraft(store,a,{lesson:'L03',language:'java',source:'bad pair',target:'beacon',revision:1}),e=>e.status===400);
 await assert.rejects(saveDraft(store,a,{lesson:'L03',language:'java',source:'stale',target:'patrol-ridge',revision:0}),e=>e.status===409);
 assert.deepEqual((await current(store,a)).profile.drafts['L03.java'],saved);
 assert.equal((await current(store,b)).profile.drafts['L03.java'],undefined);
 const legacy=await saveDraft(store,a,{lesson:'L03',language:'java',source:'older client',revision:1});
 assert.equal(legacy.target,undefined,'do not silently attach old scenario to changed source from legacy client');
});
