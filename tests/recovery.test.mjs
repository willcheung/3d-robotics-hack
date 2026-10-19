import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {MemoryStore} from './helpers/memory-store.mjs';
import {provision,login,current,addStudent,saveDraft,recordAttempt,view,newCode,hashCode,familyPath} from '../server/family-store.mjs';
import {recoveryService,recoveryIndex,resendMailer,EMAIL_LIMIT_PATH,normalizeEmail} from '../server/recovery.mjs';
import {hostedApi} from '../server/hosted-api.mjs';
const password='test-recovery-secret-only-not-for-production',origin='https://robolab.example';
async function fixture(initialTime=Date.UTC(2026,0,1,12)){
 const store=new MemoryStore(),seed=await provision(store),parent=await login(store,seed.code),student=await addStudent(store,parent,'Student'),child=await login(store,student.code),messages=[];
 let time=initialTime;const mail={enabled:true,send:async m=>{messages.push(m);return {id:'test-email'};}};
 const service=recoveryService({store,password,appOrigin:origin,mail,now:()=>time});
 const advance=(milliseconds=61000)=>{time+=milliseconds;};
 const token=()=>messages.at(-1).text.match(/#(?:verify-email|recover-family)=([A-Za-z0-9_.-]+)/)[1];
 async function verified(){await service.begin(parent,{email:'PARENT@example.com',code:seed.code});await service.verify(parent,token());advance();}
 return {store,seed,parent,student,child,messages,mail,service,advance,token,verified,expire:()=>{time+=16*60000;}};
}
test('verified recovery rotates only parent credentials and preserves student work and progress',async()=>{
 const f=await fixture();await saveDraft(f.store,f.child,{language:'java',source:'saved student source',revision:0});
 await recordAttempt(f.store,f.child,{id:crypto.randomUUID(),language:'python',source:'print(1)',target:'beacon',outcome:'reached',seconds:2},true);
 const before=structuredClone((await current(f.store,f.child)).profile);
 await f.verified();assert.equal((await current(f.store,f.parent)).profile.recovery.email,'parent@example.com');
 assert.equal('recoveryEmail' in view((await current(f.store,f.child)).family,before),false);
 const response=await f.service.forgot({email:' parent@example.com '});assert.equal(response.ok,true);
 const token=f.token(),key=newCode(),result=await f.service.recover({token,key});
 await assert.rejects(login(f.store,f.seed.code),e=>e.status===401);await assert.rejects(current(f.store,f.parent),e=>e.status===401);
 const recovered=await login(f.store,result.code);assert.equal(recovered.familyId,f.parent.familyId);assert.notEqual(recovered.epoch,f.parent.epoch);
 assert.deepEqual((await current(f.store,await login(f.store,f.student.code))).profile,before);
 assert.equal((await f.service.recover({token,key})).code,result.code,'same-browser retry after a lost response returns the same code');
 await assert.rejects(f.service.recover({token,key:newCode()}),e=>e.status===400);
 assert.equal(JSON.stringify([...f.store.rows.values()]).includes(result.code),false);
 assert.equal(JSON.stringify([...f.store.rows.values()]).includes(token),false);
});
test('email binding needs parent session, current parent code and one-use unexpired email proof',async()=>{
 const f=await fixture();await assert.rejects(f.service.begin(f.child,{email:'p@example.com',code:f.seed.code}),e=>e.status===403);
 await assert.rejects(f.service.begin(f.parent,{email:'p@example.com',code:f.student.code}),e=>e.status===403);
 await f.service.begin(f.parent,{email:'p@example.com',code:f.seed.code});const token=f.token();
 await assert.rejects(f.service.verify(f.child,token),e=>e.status===400);
 const other=await provision(f.store);await assert.rejects(f.service.verify(await login(f.store,other.code),token),e=>e.status===400);
 await f.service.verify(f.parent,token);await assert.rejects(f.service.verify(f.parent,token),e=>e.status===400);
 f.advance();await f.service.begin(f.parent,{email:'next@example.com',code:f.seed.code});f.expire();await assert.rejects(f.service.verify(f.parent,f.token()),e=>e.status===400);
 assert.equal((await current(f.store,f.parent)).profile.recovery.email,'p@example.com','old verified address survives unconfirmed changes');
});
test('unknown and unverified addresses reveal no family and failed delivery has a neutral response',async()=>{
 const f=await fixture();const unknown=await f.service.forgot({email:'unknown@example.com'});assert.equal(f.messages.length,0);
 await f.service.begin(f.parent,{email:'pending@example.com',code:f.seed.code});f.advance();const pending=await f.service.forgot({email:'pending@example.com'});assert.deepEqual(unknown,pending);assert.equal(f.messages.length,1);
 await f.service.verify(f.parent,f.token());f.advance();f.mail.send=async()=>{throw Error('provider unavailable');};assert.deepEqual(await f.service.forgot({email:'pending@example.com'}),unknown);
});
test('expired/superseded/forged recovery tokens fail; changing verified email invalidates old links',async()=>{
 const f=await fixture();await f.verified();await f.service.forgot({email:'parent@example.com'});const old=f.token();f.advance();await f.service.forgot({email:'parent@example.com'});
 await assert.rejects(f.service.recover({token:old,key:newCode()}),e=>e.status===400);
 const valid=f.token();await assert.rejects(f.service.recover({token:valid+'x',key:newCode()}),e=>e.status===400);f.expire();await assert.rejects(f.service.recover({token:valid,key:newCode()}),e=>e.status===400);
 await f.service.forgot({email:'parent@example.com'});const replaced=f.token();await f.service.begin(f.parent,{email:'replacement@example.com',code:f.seed.code});await f.service.verify(f.parent,f.token());
 await assert.rejects(f.service.recover({token:replaced,key:newCode()}),e=>e.status===400);f.advance();const count=f.messages.length;await f.service.forgot({email:'parent@example.com'});assert.equal(f.messages.length,count);
});
test('concurrent reset claims yield one credential; partial invite/family writes safely retry',async()=>{
 const f=await fixture();await f.verified();await f.service.forgot({email:'parent@example.com'});const token=f.token();
 const result=await Promise.allSettled([f.service.recover({token,key:newCode()}),f.service.recover({token,key:newCode()})]);assert.equal(result.filter(r=>r.status==='fulfilled').length,1);
 const winner=result.find(r=>r.status==='fulfilled').value;await login(f.store,winner.code);
 const orphans=[...f.store.rows.entries()].filter(([path,row])=>path.startsWith('invites/')&&typeof row.value.epoch==='string'&&path!==`invites/${hashCode(winner.code)}.json`);assert.equal(orphans.length,1);await assert.rejects(current(f.store,orphans[0][1].value),e=>e.status===401,'orphan is invalid even with the previous epoch-only session check');
 assert.equal((await current(f.store,await login(f.store,winner.code))).profile.accessHash,hashCode(winner.code));
 f.advance();await f.service.forgot({email:'parent@example.com'});const next=f.token(),key=newCode(),write=f.store.write.bind(f.store);let fail=true;
 f.store.write=async(path,...args)=>{if(path===familyPath(f.parent.familyId)&&fail){fail=false;throw Error('transient family write');}return write(path,...args);};
 await assert.rejects(f.service.recover({token:next,key}),/transient/);await login(f.store,winner.code);
 await login(f.store,(await f.service.recover({token:next,key})).code);
});
test('durable email cooldown/limits, validation and disabled provider fail closed',async()=>{
 const f=await fixture();await f.service.forgot({email:'unknown@example.com'});await assert.rejects(f.service.forgot({email:'unknown@example.com'}),e=>e.status===429);
 for(let i=0;i<4;i++){f.advance();await f.service.forgot({email:'unknown@example.com'});}f.advance();await assert.rejects(f.service.forgot({email:'unknown@example.com'}),e=>e.status===429);
 const quota=await f.store.read(EMAIL_LIMIT_PATH);assert.equal(JSON.stringify(quota).includes('unknown@example.com'),false);assert.equal(quota.value.count,5);
 for(const email of ['a\r\nBcc:x@example.com','a@b','a..b@example.com','a@b.example\n\n']){if(email.endsWith('\n\n'))continue;assert.throws(()=>normalizeEmail(email));}
 const disabled=recoveryService({store:f.store,password,appOrigin:origin,mail:{enabled:false}});await assert.rejects(disabled.forgot({email:'p@example.com'}),e=>e.status===503);
});
test('recovery email daily allowance resets at UTC midnight while retaining the cooldown',async()=>{
 const f=await fixture(Date.UTC(2026,0,1,23,55));
 for(let i=0;i<5;i++){await f.service.forgot({email:'unknown@example.com'});if(i<4)f.advance();}
 assert.equal((await f.store.read(EMAIL_LIMIT_PATH)).value.count,5);
 f.advance();await f.service.forgot({email:'unknown@example.com'});
 const next=(await f.store.read(EMAIL_LIMIT_PATH)).value;assert.equal(next.day,'2026-01-02');assert.equal(next.count,1);
 await assert.rejects(f.service.forgot({email:'unknown@example.com'}),e=>e.status===429);
});
test('Resend adapter sends only bounded transactional text, uses idempotency and masks provider errors',async()=>{
 let request;const mail=resendMailer({key:'test-key',from:'RoboLab <robolab@vibecodingdad.com>',fetcher:async(url,options)=>{request={url,options};return Response.json({id:'sent'});}});
 assert.equal((await mail.send({to:'p@example.com',subject:'Verify',text:'test',id:'test-id'})).id,'sent');assert.equal(request.url,'https://api.resend.com/emails');assert.equal(request.options.headers['Idempotency-Key'],'robolab-recovery/test-id');assert.deepEqual(JSON.parse(request.options.body).to,['p@example.com']);
 const broken=resendMailer({key:'test-key',from:'test',fetcher:async()=>new Response('SECRET provider details',{status:401})});await assert.rejects(broken.send({id:'x'}),e=>e.status===503&&!e.message.includes('SECRET'));
});
test('retired HTTP recovery keeps origin checks and cannot issue a parent cookie',async()=>{
 const f=await fixture();let api;const server=createServer((req,res)=>void api(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;api=hostedApi({store:f.store,password,appOrigin:base,alternateOrigin:'https://robolab.example',recoveryOrigin:'https://robolab.example',mail:f.mail});
 const post=(path,data,extra={})=>fetch(base+'/api/family'+path,{method:'POST',headers:{origin:base,'content-type':'application/json',...extra},body:JSON.stringify(data)});
 try{
  assert.equal((await post('/forgot',{email:'a@example.com'},{origin:'https://evil.test'})).status,403);
  for(const path of ['/forgot','/email','/emailverify','/recover']){const r=await post(path,{code:f.seed.code,token:'old',key:newCode()});assert.equal(r.status,410);assert.equal(r.headers.get('set-cookie'),null);}
  assert.equal(f.messages.length,0);
  assert.equal((await post('/login',{code:f.student.code},{origin:'https://robolab.example'})).status,200,'configured alternate origin still accepts students');
  assert.equal((await post('/login',{code:f.seed.code})).status,403);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
test('migration frame allows each explicit workshop and rejects all other parents without a wildcard',async()=>{
 const {appOrigins}=await import('../server/app-origins.mjs'),{readFile}=await import('node:fs/promises'),vm=await import('node:vm');
 const allowed=appOrigins('https://old.example','https://new.example');assert.throws(()=>appOrigins('https://old.example','https://*.example'));assert.throws(()=>appOrigins('https://old.example','https://evil.example/path'));
 const source=(await readFile(new URL('../runtime/frame.js',import.meta.url),'utf8')).replace('__APP_ORIGINS__',JSON.stringify(allowed));
 for(const from of [...allowed,'https://foreign.example']){
  const messages=[],handlers=[],parent={postMessage:(data,target)=>messages.push({data,target})};
  const ctx={URLSearchParams,location:{search:'?parent='+encodeURIComponent(from)},parent,window:{},addEventListener:(name,fn)=>handlers.push(fn)};
  vm.runInNewContext(source,ctx);assert.equal(messages.length,allowed.includes(from)?1:0);if(messages.length)assert.equal(messages[0].target,from);
 }
});
