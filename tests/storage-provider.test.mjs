import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {del} from '@vercel/blob';
import {BlobStore,provision,login,addStudent,reserveRun,releaseRun,recordAttempt,saveDraft,current} from '../server/family-store.mjs';
test('private Blob strong ETags and concurrent cleanup/history/draft writes preserve every update',async()=>{
 const paths=new Set(),s=new BlobStore(),write=s.write.bind(s);s.write=async(path,...args)=>{paths.add(path);return write(path,...args);};
 try{
  const seed=await provision(s),parent=await login(s,seed.code),child=await addStudent(s,parent,'Storage fixture'),session=await login(s,child.code),id=randomUUID();
  await reserveRun(s,session,id);
  await recordAttempt(s,session,{id:randomUUID(),language:'python',source:'# A long commented source\n'.repeat(200),target:'beacon',outcome:'missed',seconds:2});
  const row=await s.read(`families/${session.familyId}.json`);assert.ok(!row.etag.startsWith('W/'),'If-Match must use the strong storage ETag, even for compressible JSON');
  await Promise.all([releaseRun(s,session,id),recordAttempt(s,session,{id:randomUUID(),language:'java',source:'// sample',target:'beacon',outcome:'error'}),saveDraft(s,session,{language:'java',source:'// draft',revision:0})]);
  const {family,profile}=await current(s,session);assert.equal(family.runs.length,0);assert.equal(profile.experiments,2);assert.equal(profile.drafts.java.revision,1);
  const conflict=await Promise.allSettled(['one','two'].map(source=>saveDraft(s,session,{language:'java',source,revision:1})));assert.equal(conflict.filter(x=>x.status==='fulfilled').length,1);assert.equal(conflict.find(x=>x.status==='rejected').reason.status,409);
 }finally{await del([...paths]);}
});
test('real Blob concurrent signup retries return one family and preserve later student data',async()=>{
 const {createFamily,hashCode,familyPath,reserveServiceRun,releaseServiceRun,SERVICE_LIMIT_PATH}=await import('../server/family-store.mjs');
 const {randomBytes}=await import('node:crypto');
 const store=new BlobStore(),data={name:'Setup concurrency fixture',key:randomBytes(24).toString('base64url')},password=randomBytes(48).toString('base64url'),paths=new Set();
 // Keep shared quota records; delete only this test's private family/invites.
 const write=store.write.bind(store);store.write=async(path,...args)=>{if(!path.startsWith('limits/'))paths.add(path);return write(path,...args);};
 try{
  const results=await Promise.all([createFamily(store,data,password),createFamily(store,data,password)]);
  assert.equal(results[0].code===results[1].code,true);assert.deepEqual(results[0].session,results[1].session);
  const student=await addStudent(store,results[0].session,'Existing student');
  await createFamily(store,data,password);
  const {family}=await current(store,results[0].session);assert.equal(family.profiles.length,2);assert.equal((await login(store,student.code)).familyId,family.id);
  assert.equal(JSON.stringify((await store.read(familyPath(family.id))).value).includes(results[0].code),false);
  assert.equal(paths.has(`invites/${hashCode(results[0].code)}.json`),true);
  const childSession=await login(store,student.code),id=randomUUID(),sessions=[results[0].session,childSession];
  try{await Promise.all(sessions.map(s=>reserveServiceRun(store,s,id)));const quota=(await store.read(SERVICE_LIMIT_PATH)).value;assert.equal(quota.runs.filter(r=>r.key.startsWith(family.id+':')).length,2);await releaseServiceRun(store,sessions[0],id);assert.equal((await store.read(SERVICE_LIMIT_PATH)).value.runs.filter(r=>r.key.startsWith(family.id+':')).length,1);}finally{await Promise.all(sessions.map(s=>releaseServiceRun(store,s,id)));}
 }finally{if(paths.size)await del([...paths]);}
});
