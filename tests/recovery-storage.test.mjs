import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {del} from '@vercel/blob';
import {BlobStore,provision,login,addStudent,saveDraft,current,newCode} from '../server/family-store.mjs';import {recoveryService} from '../server/recovery.mjs';
test('real Blob email verification and concurrent recovery preserve student data and yield one parent credential',async()=>{
 const store=new BlobStore(),paths=new Set(),write=store.write.bind(store),messages=[];store.write=async(path,...args)=>{if(!path.startsWith('limits/'))paths.add(path);return write(path,...args);};
 const email=`fixture-${randomUUID()}@example.com`,password=newCode()+newCode();let now=Date.now();
 const service=recoveryService({store,password,appOrigin:'https://robolab.example',now:()=>now,mail:{enabled:true,send:async m=>{messages.push(m);return {id:'fixture-only-no-delivery'};}}});
 const token=()=>messages.at(-1).text.match(/#(?:verify-email|recover-family)=([A-Za-z0-9_.-]+)/)[1];
 try{
  const seed=await provision(store),parent=await login(store,seed.code),student=await addStudent(store,parent,'Recovery storage fixture'),child=await login(store,student.code);
  await saveDraft(store,child,{language:'python',source:'# persisted before recovery',revision:0});await service.begin(parent,{email,code:seed.code},email);await service.verify(parent,token());now+=61000;await service.forgot({email},email);
  const reset=token(),attempts=await Promise.allSettled([service.recover({token:reset,key:newCode()}),service.recover({token:reset,key:newCode()})]);assert.equal(attempts.filter(a=>a.status==='fulfilled').length,1);
  await login(store,attempts.find(a=>a.status==='fulfilled').value.code);await assert.rejects(login(store,seed.code),e=>e.status===401);
  assert.equal((await current(store,await login(store,student.code))).profile.drafts.python.source,'# persisted before recovery');
 }finally{if(paths.size)await del([...paths]);}
});
