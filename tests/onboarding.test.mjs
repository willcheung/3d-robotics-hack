import test from 'node:test';
import assert from 'node:assert/strict';
import {MemoryStore} from './helpers/memory-store.mjs';
import {onboardingService,onboardingView,AUTH_TTL,MAIL_TTL} from '../server/onboarding.mjs';
import {newCode,login,current,familyPath,update,studentAccess,provision,addStudent,saveDraft,recordAttempt,hashCode} from '../server/family-store.mjs';
import {EMAIL_LIMIT_PATH} from '../server/recovery.mjs';
const password='onboarding-test-only-long-secret-not-production',origin='https://app.example.test';
function fixture(){
 const store=new MemoryStore(),messages=[],jobs=[],sent=new Map();let time=Date.now(),mailDown=false,queueDown=false;
 const mail={enabled:true,send:async m=>{if(mailDown)throw Error('mail unavailable');if(!sent.has(m.id)){messages.push(m);sent.set(m.id,{id:'provider-'+sent.size});}return sent.get(m.id);}};
 const service=onboardingService({store,password,appOrigin:origin,mail,now:()=>time,enqueue:async (job,options)=>{if(queueDown)throw Error('queue unavailable');jobs.push({job,options});}});
 const code=()=>messages.at(-1).text.match(/\b\d{6}\b/)[0];
 async function parent(email='parent@example.test'){
  const key=newCode();await service.start({key,email});await service.verify({key,code:code()});
  return {key,...await service.finish({key,create:true})};
 }
 return {store,messages,jobs,mail,service,parent,code,advance:ms=>{time+=ms;},mailDown:value=>{mailDown=value;},queueDown:value=>{queueDown=value;}};
}
test('email code verifies once per browser challenge and creates/resumes one family without rotating work',async()=>{
 const f=fixture(),key=newCode();await f.service.start({key,email:' PARENT@example.test '});const code=f.code();
 assert.deepEqual((await f.service.verify({key,code})).families,[]);
 const [a,b]=await Promise.all([f.service.finish({key,create:true}),f.service.finish({key,create:true})]);assert.deepEqual(a,b);
 const child=(await f.service.students(a.session,{id:crypto.randomUUID(),names:['Pilot']})).cards[0],childSession=await login(f.store,child.code);
 await saveDraft(f.store,childSession,{language:'python',lesson:'L02',source:'saved code',revision:0});
 const before=(await current(f.store,childSession)).profile;
 f.advance(61000);const next=newCode();await f.service.start({key:next,email:'parent@example.test'});
 const verified=await f.service.verify({key:next,code:f.code()});assert.equal(verified.families.length,1);assert.equal(verified.families[0].id,a.session.familyId);
 await assert.rejects(f.service.finish({key:next,create:true}),/Choose your existing/);
 assert.deepEqual((await f.service.finish({key:next,familyId:a.session.familyId})).session,a.session);
 assert.deepEqual((await current(f.store,childSession)).profile,before);
 const stored=JSON.stringify([...f.store.rows.values()]);assert.ok(!stored.includes(child.code));assert.ok(!stored.includes('"code":"'+code+'"'));
});
test('wrong, expired, swapped and exhausted parent codes do not authenticate; retries retain attempts',async()=>{
 const f=fixture(),key=newCode();await f.service.start({key,email:'p@example.test'});const code=f.code(),wrong=code==='000000'?'000001':'000000';
 await assert.rejects(f.service.verify({key:newCode(),code}),e=>e.status===400);
 for(let i=0;i<4;i++)await assert.rejects(f.service.verify({key,code:wrong}),e=>e.status===400);
 f.advance(61000);await f.service.start({key,email:'p@example.test',resend:true});assert.equal(f.code(),code,'resend keeps same code and attempt budget');
 await assert.rejects(f.service.verify({key,code:wrong}),e=>e.status===400);
 await assert.rejects(f.service.verify({key,code}),e=>e.status===400);
 const g=fixture(),other=newCode();await g.service.start({key:other,email:'p@example.test'});const correct=g.code();g.advance(AUTH_TTL);
 await assert.rejects(g.service.verify({key:other,code:correct}),e=>e.status===400);
 await assert.rejects(g.service.finish({key:other,create:true}),e=>e.status===400);
});
test('sign-in send retry reuses mail identity and quota; mail outage is explicit and recoverable',async()=>{
 const f=fixture(),key=newCode();f.mailDown(true);
 await assert.rejects(f.service.start({key,email:'p@example.test'}),/mail unavailable/);
 f.mailDown(false);await f.service.start({key,email:'p@example.test'});const code=f.code();await f.service.start({key,email:'p@example.test'});
 assert.equal(f.messages.length,1);assert.equal((await f.store.read(EMAIL_LIMIT_PATH)).value.count,1);
 await assert.rejects(f.service.start({key,email:'other@example.test'}),e=>e.status===400);
 await assert.rejects(f.service.start({key:newCode(),email:'p@example.test'}),e=>e.status===429);
 assert.equal((await f.service.verify({key,code})).email,'p@example.test');
});
test('student batch retries return identical profiles/codes and one combined email',async()=>{
 const f=fixture(),{session}=await f.parent(),data={id:crypto.randomUUID(),names:['Pilot A','Pilot B']};
 const [a,b]=await Promise.all([f.service.students(session,data),f.service.students(session,data)]);assert.deepEqual(a,b);
 assert.equal((await current(f.store,session)).family.profiles.length,3);
 await assert.rejects(f.service.students(session,{...data,names:['Changed']}),e=>e.status===409);
 await f.service.deliver({familyId:session.familyId,eventId:data.id});await f.service.deliver({familyId:session.familyId,eventId:data.id});
 assert.equal(f.messages.length,2);assert.match(f.messages[1].text,/Pilot A/);assert.match(f.messages[1].text,/Pilot B/);
 assert.ok(f.messages[1].text.includes(a.cards[0].code));assert.equal(f.messages[1].to,'parent@example.test');
 assert.ok(!JSON.stringify([...f.store.rows.values()]).includes(a.cards[0].code));
 const childSession=await login(f.store,a.cards[0].code),{family,profile}=await current(f.store,childSession);assert.deepEqual(onboardingView(family,profile),{});
 await assert.rejects(f.service.students(childSession,{id:crypto.randomUUID(),names:['Intruder']}),e=>e.status===403);
});
test('first interactive student sign-in records one notice across races and later code replacements',async()=>{
 const f=fixture(),{session}=await f.parent(),batch=await f.service.students(session,{id:crypto.randomUUID(),names:['Pilot']});
 const child=await login(f.store,batch.cards[0].code);assert.equal(f.messages.length,1,'helper authentication does not send mail');
 await Promise.all([f.service.studentSignedIn(child),f.service.studentSignedIn(child)]);
 const eventId='first-'+child.profileId;await f.service.deliver({familyId:child.familyId,eventId});
 await f.service.studentSignedIn(child);await f.service.deliver({familyId:child.familyId,eventId});
 const rotated=await studentAccess(f.store,session,child.profileId,false);await f.service.studentSignedIn(await login(f.store,rotated.code));
 assert.equal(f.messages.filter(m=>m.subject.includes('signed in')).length,1);
 const {family,profile}=await current(f.store,session);assert.equal(onboardingView(family,profile).studentSignIns[child.profileId],'ready');
 assert.equal(Object.keys(family.onboarding.events).filter(id=>id.startsWith('first-')).length,1);
});
test('opt-out is rechecked at delivery, old students stay quiet and students cannot set preferences',async()=>{
 const f=fixture(),{session}=await f.parent(),old=await addStudent(f.store,session,'Existing'),newStudent=(await f.service.students(session,{id:crypto.randomUUID(),names:['New']})).cards[0];
 await f.service.studentSignedIn(await login(f.store,old.code));
 const child=await login(f.store,newStudent.code);await f.service.studentSignedIn(child);
 await assert.rejects(f.service.preferences(child,{notifyFirst:false}),e=>e.status===403);
 await f.service.preferences(session,{notifyFirst:false});await f.service.deliver({familyId:session.familyId,eventId:'first-'+child.profileId});
 assert.equal(f.messages.length,1);
 const {family,profile}=await current(f.store,session);assert.equal(onboardingView(family,profile).studentSignIns[old.id],'existing');
});
test('delayed credential email is suppressed after code rotation, revoke, address change or expiry',async()=>{
 for(const change of ['rotate','revoke','email','expire']){
  const f=fixture(),{session}=await f.parent(),batch=await f.service.students(session,{id:crypto.randomUUID(),names:['Pilot']});
  if(change==='rotate'||change==='revoke')await studentAccess(f.store,session,batch.cards[0].id,change==='revoke');
  if(change==='email')await update(f.store,familyPath(session.familyId),r=>{r.profiles[0].recovery.index='different';return {value:r};});
  if(change==='expire')f.advance(MAIL_TTL);
  await f.service.deliver({familyId:session.familyId,eventId:batch.eventId});assert.equal(f.messages.length,1,change);
  assert.equal((await current(f.store,session)).family.onboarding.events[batch.eventId].payload,undefined);
 }
});
test('queue/provider outages preserve usable cards and durable retry; provider acceptance replay is deduplicated',async()=>{
 const f=fixture(),{session}=await f.parent();f.queueDown(true);
 const batch=await f.service.students(session,{id:crypto.randomUUID(),names:['Pilot']});await login(f.store,batch.cards[0].code);
 assert.equal((await current(f.store,session)).family.onboarding.events[batch.eventId].status,'retry');
 f.queueDown(false);await f.service.retry(session,batch.eventId);f.mailDown(true);
 await assert.rejects(f.service.deliver({familyId:session.familyId,eventId:batch.eventId}),/awaiting retry/);f.mailDown(false);
 const write=f.store.write.bind(f.store);let lost=true;
 f.store.write=async(path,value,...args)=>{if(path===familyPath(session.familyId)&&value.onboarding?.events[batch.eventId]?.status==='sent'&&lost){lost=false;throw Error('lost after provider accepted');}return write(path,value,...args);};
 await assert.rejects(f.service.deliver({familyId:session.familyId,eventId:batch.eventId}),/awaiting retry/);
 await f.service.deliver({familyId:session.familyId,eventId:batch.eventId});assert.equal(f.messages.length,2);
 assert.equal((await current(f.store,session)).family.onboarding.events[batch.eventId].status,'sent');
});
test('signup and student orphan writes do not grant access and expired temporary cards are inaccessible',async()=>{
 const f=fixture(),{session}=await f.parent(),write=f.store.write.bind(f.store);let fail=true;
 f.store.write=async(path,...args)=>{if(path===familyPath(session.familyId)&&fail){fail=false;throw Error('family unavailable');}return write(path,...args);};
 const data={id:crypto.randomUUID(),names:['Pilot']};await assert.rejects(f.service.students(session,data),/family unavailable/);
 const orphan=[...f.store.rows.entries()].find(([p,r])=>p.startsWith('invites/')&&r.value.profileId!==session.profileId)[1].value;
 await assert.rejects(current(f.store,orphan),e=>e.status===401);
 const batch=await f.service.students(session,data);await login(f.store,batch.cards[0].code);f.advance(MAIL_TTL);
 await assert.rejects(f.service.students(session,data),/expired/);await f.service.deliver({familyId:session.familyId,eventId:batch.eventId,cleanup:true});
 assert.equal((await current(f.store,session)).family.onboarding.batches[data.id].cards,undefined);
});
test('mail envelope tampering fails closed and respects one active delivery lease',async()=>{
 const f=fixture(),{session}=await f.parent(),batch=await f.service.students(session,{id:crypto.randomUUID(),names:['Pilot']});
 await update(f.store,familyPath(session.familyId),r=>{r.onboarding.events[batch.eventId].payload.tag=Buffer.alloc(16).toString('base64');return {value:r};});
 await assert.rejects(f.service.deliver({familyId:session.familyId,eventId:batch.eventId}),/awaiting retry/);assert.equal(f.messages.length,1);
});
test('replacement requests replay one credential and retain work, while stale/orphan cards cannot sign in',async()=>{
 const f=fixture(),{session}=await f.parent(),batch=await f.service.students(session,{id:crypto.randomUUID(),names:['Pilot']});
 const card=batch.cards[0],child=await login(f.store,card.code);await saveDraft(f.store,child,{language:'java',lesson:'L02',source:'saved Java',revision:0});
 const data={id:crypto.randomUUID(),studentId:card.id},[a,b]=await Promise.all([f.service.replace(session,data),f.service.replace(session,data)]);assert.deepEqual(a,b);
 await assert.rejects(login(f.store,card.code),e=>e.status===401);await assert.rejects(current(f.store,child),e=>e.status===401);
 const next=await login(f.store,a.cards[0].code);assert.equal((await current(f.store,next)).profile.drafts['L02.java'].source,'saved Java');
 await assert.rejects(f.service.students(session,{id:batch.eventId,names:['Pilot']}),/replaced or revoked/);
 await f.service.deliver({familyId:session.familyId,eventId:data.id});assert.equal(f.messages.filter(m=>m.subject.includes('replacement')).length,1);
 await assert.rejects(f.service.replace(next,data),e=>e.status===403);
});
test('authentication payload cleanup and mail cleanup retries preserve expiry bounds',async()=>{
 const f=fixture(),{session,key}=await f.parent();const auth=f.jobs.find(j=>j.job.authPath).job;
 await assert.rejects(f.service.deliver(auth),/early/);f.advance(AUTH_TTL);await f.service.deliver(auth);
 const row=(await f.store.read(auth.authPath)).value;assert.deepEqual(Object.keys(row).sort(),['expired','until']);await assert.rejects(f.service.finish({key,create:true}),e=>e.status===400);
 const batch=await f.service.students(session,{id:crypto.randomUUID(),names:['Pilot']});f.queueDown(true);
 await assert.rejects(f.service.deliver({familyId:session.familyId,eventId:batch.eventId}),/awaiting retry/);assert.equal(f.messages.length,1);
 f.queueDown(false);await f.service.deliver({familyId:session.familyId,eventId:batch.eventId});assert.equal(f.messages.length,2);
 f.advance(MAIL_TTL);await f.service.deliver({familyId:session.familyId,eventId:batch.eventId,cleanup:true});assert.equal((await current(f.store,session)).family.onboarding.batches[batch.eventId].cards,undefined);
});
test('email memberships are rechecked after address changes and cannot switch an active family',async()=>{
 const f=fixture(),{session}=await f.parent(),key=newCode();f.advance(61000);await f.service.start({key,email:'parent@example.test'});await f.service.verify({key,code:f.code()});
 const other=(await provision(f.store));const active=await login(f.store,other.code);
 await assert.rejects(f.service.finish({key,familyId:session.familyId},active),e=>e.status===409);
 await update(f.store,familyPath(session.familyId),r=>{r.profiles[0].recovery.email='new@example.test';r.profiles[0].recovery.index='new-index';return {value:r};});
 await assert.rejects(f.service.finish({key,familyId:session.familyId}),e=>e.status===400);
});
test('queue and quota failures do not accumulate sensitive unscheduled challenges',async()=>{
 const f=fixture(),key=newCode();f.queueDown(true);await assert.rejects(f.service.start({key,email:'p@example.test'}),e=>e.status===503);
 assert.equal([...f.store.rows.keys()].filter(k=>k.startsWith('parent-auth/')).length,0);
 f.queueDown(false);await f.service.start({key,email:'p@example.test'});const before=f.store.rows.size;
 await assert.rejects(f.service.start({key:newCode(),email:'p@example.test'}),e=>e.status===429);assert.equal(f.store.rows.size,before);
});
test('a delivery lease prevents concurrent mail sends and recovers after a worker crash',async()=>{
 const f=fixture(),{session}=await f.parent(),batch=await f.service.students(session,{id:crypto.randomUUID(),names:['Pilot']});
 await update(f.store,familyPath(session.familyId),r=>{Object.assign(r.onboarding.events[batch.eventId],{status:'sending',lease:'crashed',leaseUntil:Date.now()+30000});return {value:r};});
 await assert.rejects(f.service.deliver({familyId:session.familyId,eventId:batch.eventId}),/already being delivered/);f.advance(31000);
 await Promise.allSettled([f.service.deliver({familyId:session.familyId,eventId:batch.eventId}),f.service.deliver({familyId:session.familyId,eventId:batch.eventId})]);assert.equal(f.messages.length,2);
});
