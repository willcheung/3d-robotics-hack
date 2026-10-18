import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {MemoryStore} from './helpers/memory-store.mjs';
import {onboardingService,onboardingView,MAIL_TTL} from '../server/onboarding.mjs';
import {provision,login,addStudent,current,update,familyPath,weekStart} from '../server/family-store.mjs';
import {recoveryIndex,EMAIL_LIMIT_PATH} from '../server/recovery.mjs';
import {weeklyHandler,scanWeekly} from '../server/weekly-summary.mjs';
const password='weekly-summary-test-only-long-secret',origin='https://app.example.test',week='2026-10-05';
async function fixture(){
 const store=new MemoryStore(),messages=[],jobs=[];let time=Date.parse('2026-10-11T12:00:00Z'),queueDown=false,mailDown=false;
 const parent=await login(store,(await provision(store)).code),children=[];for(const name of ['Pilot A','Pilot B'])children.push(await login(store,(await addStudent(store,parent,name)).code));
 const email='weekly-parent@example.test';await update(store,familyPath(parent.familyId),f=>{f.profiles[0].recovery={email,index:recoveryIndex(email,password)};f.profiles[1].drafts.python={source:'PRIVATE STUDENT SOURCE',revision:1};return {value:f};});
 const enqueue=async(message,options)=>{if(queueDown)throw Error('queue down');jobs.push({message,options});};
 const service=onboardingService({store,password,appOrigin:origin,weeklyEnabled:true,now:()=>time,enqueue,mail:{enabled:true,send:async message=>{if(mailDown)throw Error('mail down');if(!messages.some(m=>m.id===message.id))messages.push(message);return {id:'fixture-mail'};}}});
 await service.preferences(parent,{notifyWeekly:true});
 const activity=()=>update(store,familyPath(parent.familyId),f=>{f.profiles[1].activity={[week]:18};f.profiles[1].completed=['beacon','farther','reverse'];f.profiles[1].missionCompleted={L01:'2026-10-10T18:00:00Z'};f.profiles[2].activity={[week]:2};return {value:f};});
 return {store,parent,children,service,messages,jobs,enqueue,activity,advance:ms=>time+=ms,queueDown:b=>queueDown=b,mailDown:b=>mailDown=b,now:()=>time};
}
test('weekly digest uses durable activity and first-completion dates, all children and one receipt',async()=>{
 const f=await fixture();await f.activity();f.advance(28*3600000);
 await Promise.all([f.service.weekly(f.parent.familyId,week),f.service.weekly(f.parent.familyId,week)]);const job=f.jobs.find(j=>j.message.eventId)?.message;await f.service.deliver(job);await f.service.deliver(job);await f.service.weekly(f.parent.familyId,week);
 assert.equal(f.messages.length,1);const message=f.messages[0];assert.match(message.text,/Pilot A: 18 runs/);assert.match(message.text,/Pilot B: 2 runs/);assert.match(message.text,/Completed Mission 1/);assert.ok(!message.text.includes('PRIVATE STUDENT SOURCE'));assert.ok(!message.text.includes('Student code:'));assert.equal((await current(f.store,f.children[0])).profile.history.length,0);
 const {family,profile}=await current(f.store,f.parent);assert.equal(onboardingView(family,profile).notifyWeekly,true);assert.equal(onboardingView(family,family.profiles[1]).notifyWeekly,undefined);
 await assert.rejects(f.service.preferences(f.children[0],{notifyWeekly:false}),e=>e.status===403);
});
test('quiet weeks and historical completion without dates never generate a digest',async()=>{
 const f=await fixture();await update(f.store,familyPath(f.parent.familyId),row=>{row.profiles[1].completed=['beacon','farther','reverse'];return {value:row};});f.advance(28*3600000);assert.equal((await f.service.weekly(f.parent.familyId,week)).queued,false);assert.equal(f.jobs.length,0);
});
for(const change of ['opt-out','email','revoke','disabled'])test(`weekly consent and recipient validation cancels ${change} before delivery`,async()=>{
 const f=await fixture();await f.activity();f.advance(28*3600000);await f.service.weekly(f.parent.familyId,week);const job=f.jobs[0].message;
 if(change==='opt-out')await f.service.preferences(f.parent,{notifyWeekly:false});
 if(change==='email')await update(f.store,familyPath(f.parent.familyId),row=>{row.profiles[0].recovery.index='new-recipient';return {value:row};});
 if(change==='revoke')await update(f.store,familyPath(f.parent.familyId),row=>{row.profiles[1].active=false;return {value:row};});
 const deliver=change==='disabled'?onboardingService({store:f.store,password,appOrigin:origin,weeklyEnabled:false,now:f.now,mail:{enabled:true,send:()=>{throw Error('must not send');}}}).deliver:f.service.deliver;
 await deliver(job);assert.equal(f.messages.length,0);assert.equal((await current(f.store,f.parent)).family.onboarding.events[job.eventId].status,'cancelled');
});
test('queue and provider failure retry the same summary; accepted delivery replay does not send twice',async()=>{
 const f=await fixture();await f.activity();f.advance(28*3600000);f.queueDown(true);await assert.rejects(f.service.weekly(f.parent.familyId,week));f.queueDown(false);await f.service.weekly(f.parent.familyId,week);const job=f.jobs[0].message;
 f.mailDown(true);await assert.rejects(f.service.deliver(job));f.mailDown(false);
 const write=f.store.write.bind(f.store);let lost=true;f.store.write=async(path,value,etag)=>{if(lost&&value?.onboarding?.events?.[job.eventId]?.status==='sent'){lost=false;throw Error('lost receipt write');}return write(path,value,etag);};
 await assert.rejects(f.service.deliver(job));await f.service.deliver(job);assert.equal(f.messages.length,1);
});
test('optional summaries preserve authentication capacity and expire without a late duplicate',async()=>{
 const f=await fixture();await f.activity();f.advance(28*3600000);await f.service.weekly(f.parent.familyId,week);await f.store.write(EMAIL_LIMIT_PATH,{day:new Date(f.now()).toISOString().slice(0,10),count:48,emails:{},ips:{}});await assert.rejects(f.service.deliver(f.jobs[0].message));assert.equal(f.messages.length,0);f.advance(MAIL_TTL+1);await f.service.deliver(f.jobs[0].message);assert.equal(f.messages.length,0);assert.equal((await current(f.store,f.parent)).family.onboarding.events[f.jobs[0].message.eventId].payload,undefined);
});
test('reporting weeks use UTC Mondays across DST and never accept incomplete/future weeks',async()=>{
 assert.equal(weekStart(Date.parse('2026-11-01T09:30:00Z')),'2026-10-26');assert.equal(weekStart(Date.parse('2026-11-02T00:00:00Z')),'2026-11-02');const f=await fixture();await assert.rejects(f.service.weekly(f.parent.familyId,'2026-10-12'));await assert.rejects(f.service.weekly(f.parent.familyId,'2026-10-06'));
});
test('weekly entry requires explicit enablement and a secret; queue scanning is bounded and resumable',async()=>{
 const f=await fixture();await f.activity();f.advance(28*3600000);const secret='test-only-cron-secret-with-32-characters';let enabled=true;
 const handle=weeklyHandler({store:f.store,service:f.service,enqueue:f.enqueue,secret,enabled,now:f.now}),server=createServer((req,res)=>handle(req,res));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url=`http://127.0.0.1:${server.address().port}`;
 try{assert.equal((await fetch(url)).status,403);assert.equal((await fetch(url,{headers:{Authorization:'Bearer '+secret}})).status,200);assert.equal(f.messages.length,0);assert.equal(f.jobs[0].message.weeklyScan.week,week);await scanWeekly({store:f.store,service:f.service,enqueue:f.enqueue,...f.jobs[0].message.weeklyScan});assert.ok(f.jobs.some(j=>j.message.eventId));}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
