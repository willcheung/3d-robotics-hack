import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {del} from '@vercel/blob';
import {BlobStore,newCode,login,current,saveDraft,provision,addStudent} from '../server/family-store.mjs';
import {onboardingService} from '../server/onboarding.mjs';

// Opt-in provider suite: real private Blob CAS, fixture mail/queue. Actual inbox
// delivery is a separate protected-staging gate, never implied by this test.
test('real Blob onboarding races create one family/batch/first-login event and preserve both drafts',async()=>{
 const store=new BlobStore(),paths=new Set(),write=store.write.bind(store),messages=[];
 store.write=async(path,...args)=>{if(!path.startsWith('limits/'))paths.add(path);return write(path,...args);};
 const service=onboardingService({store,password:newCode()+newCode(),appOrigin:'https://fixture.example',enqueue:async()=>{},mail:{enabled:true,send:async m=>{messages.push(m);return {id:'fixture-only-no-delivery'};}}});
 try{
  const key=newCode();await service.start({key,email:`fixture-${randomUUID()}@example.com`},'provider-fixture');
  await service.verify({key,code:messages[0].text.match(/\b\d{6}\b/)[0]});
  const parents=await Promise.all([service.finish({key,create:true}),service.finish({key,create:true})]);assert.deepEqual(parents[0],parents[1]);
  const data={id:randomUUID(),names:['Storage pilot']},batches=await Promise.all([service.students(parents[0].session,data),service.students(parents[0].session,data)]);assert.deepEqual(batches[0],batches[1]);
  const child=await login(store,batches[0].cards[0].code);
  await Promise.all([service.studentSignedIn(child),service.studentSignedIn(child),saveDraft(store,child,{language:'python',lesson:'L01',source:'# Python remains',revision:0}),saveDraft(store,child,{language:'java',lesson:'L01',source:'// Java remains',revision:0})]);
  const {family,profile}=await current(store,child);assert.equal(family.profiles.length,2);assert.equal(Object.values(family.onboarding.events).filter(e=>e.kind==='first').length,1);
  assert.equal(profile.drafts.python.source,'# Python remains');assert.equal(profile.drafts.java.source,'// Java remains');
  await service.studentSignedIn(child);assert.equal(Object.values((await current(store,child)).family.onboarding.events).filter(e=>e.kind==='first').length,1);
  assert.ok(!JSON.stringify(family).includes(batches[0].cards[0].code));
 }finally{if(paths.size)await del([...paths]);}
});

test('real Blob legacy connection has one email winner and preserves six student drafts',async()=>{
 const store=new BlobStore(),paths=new Set(),write=store.write.bind(store),messages=[];
 store.write=async(path,...args)=>{if(!path.startsWith('limits/'))paths.add(path);return write(path,...args);};
 const service=onboardingService({store,password:newCode()+newCode(),appOrigin:'https://fixture.example',enqueue:async()=>{},mail:{enabled:true,send:async m=>{messages.push(m);return {id:'fixture-only-no-delivery'};}}});
 try{
  const parent=await provision(store,{parentName:'Connection fixture'}),session=await login(store,parent.code),student=await addStudent(store,session,'Connection pilot'),child=await login(store,student.code);
  for(const lesson of ['L01','L02','L03'])for(const language of ['python','java'])await saveDraft(store,child,{lesson,language,source:`${lesson} ${language} stays`,revision:0});
  const before=structuredClone((await current(store,child)).profile),attempts=[];
  for(let i=0;i<2;i++){
   const key=newCode(),email=`connection-${randomUUID()}@example.com`;await service.start({key,email},'provider-connection-fixture');
   await service.verify({key,code:messages.at(-1).text.match(/\b\d{6}\b/)[0]});attempts.push({key,email});
  }
  const results=await Promise.allSettled(attempts.map(({key})=>service.finish({key,parentCode:parent.code})));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  const winner=results.findIndex(r=>r.status==='fulfilled'),loser=1-winner;
  assert.equal(results[loser].reason.status,403);
  assert.deepEqual((await service.finish({key:attempts[winner].key,parentCode:parent.code})).session,session);
  assert.equal((await current(store,session)).profile.recovery.email,attempts[winner].email);
  assert.deepEqual((await current(store,await login(store,student.code))).profile,before);
 }finally{if(paths.size)await del([...paths]);}
});
