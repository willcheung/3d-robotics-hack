import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createServer} from 'node:http';
import {sealData} from 'iron-session';
import {challengePoints,initialArena,arenaSummary} from '../src/arena.ts';
import {arenaMarkup} from '../src/arena-view.ts';
import {lessonTargets} from '../src/model.ts';
import {MemoryStore} from './helpers/memory-store.mjs';
import {provision,login,addStudent,current,view,reserveRun,recordAttempt,releaseRun,cancelRun,bindRun,update,familyPath,studentAccess} from '../server/family-store.mjs';
import {hostedApi} from '../server/hosted-api.mjs';
async function fixture(){const store=new MemoryStore(),seed=await provision(store,{parentName:'Parent builder'}),parent=await login(store,seed.code),student=await login(store,(await addStudent(store,parent,'Nova')).code);return {store,parent,student};}
async function start(store,session,extra={}){const p=(await current(store,session)).profile;const input={id:randomUUID(),source:'test source',language:'python',target:'beacon',checkRevision:p.arena?.revision??0,...extra};await reserveRun(store,session,input.id,input);return input;}
async function finish(store,session,input,outcome='reached'){return recordAttempt(store,session,{...input,outcome,seconds:2},true,input.checkRevision+1);}
async function check(store,session,target,outcome='reached',extra={}){const input=await start(store,session,{target,...extra});const result=await finish(store,session,input,outcome);await releaseRun(store,session,input.id,input.checkRevision+1);return {input,result};}
const summary=async(store,session)=>{const p=(await current(store,session)).profile;return arenaSummary(p.completed,p.arena);};

test('independent reward boundaries, mission floor/ceiling and 4/12/23 example',()=>{
 for(const [n,expected] of [[1,100],[10,100],[11,90],[20,90],[21,80],[30,80],[31,70],[40,70],[41,60],[50,60],[51,50],[200,50]])assert.equal(challengePoints(n),expected);
 for(const n of [0,-1,1.5,NaN,Infinity])assert.throws(()=>challengePoints(n));
 assert.equal([4,12,23].reduce((s,n)=>s+challengePoints(n),200),470);
 const complete=Object.values(lessonTargets).flat();const a=initialArena(complete);assert.equal(arenaSummary(complete,a).points,2000);
 for(const target of complete)a.challenges[target]={checks:51,points:50};assert.equal(arenaSummary(complete,a).missions[0].points,350);
});
test('ten misses lower only the next reward; first success freezes points across languages and replays',async()=>{
 const {store,student}=await fixture();
 for(let n=0;n<10;n++)await check(store,student,'beacon','missed');
 let s=await summary(store,student);assert.equal(s.points,0);assert.deepEqual(s.missions[0].challenges[0],{target:'beacon',checks:10,points:null,available:90});
 const {input,result}=await check(store,student,'beacon');assert.equal(result.pointsEarned,90);assert.equal((await summary(store,student)).points,90);
 assert.equal((await reserveRun(store,student,input.id,input)).replayed,true);
 await check(store,student,'beacon','missed',{language:'java'});s=await summary(store,student);assert.equal(s.points,90);assert.equal(s.missions[0].challenges[0].checks,11);
 await check(store,student,'farther');const last=await check(store,student,'reverse');assert.equal(last.result.pointsEarned,300);s=await summary(store,student);assert.equal(s.points,490);assert.deepEqual(s.badges,['L01']);
});
test('parents and students have identical scoring, independent progress and shared ranks without private data',async()=>{
 const {store,parent,student}=await fixture();
 await update(store,familyPath(parent.familyId),f=>{f.profiles[0].recovery={email:'private-parent@example.test'};f.profiles[0].drafts.python={source:'PRIVATE PARENT CODE'};return {value:f};});
 for(const session of [parent,student])for(const target of lessonTargets.L01)await check(store,session,target);
 const state=await current(store,student),data=view(state.family,state.profile);assert.equal(data.students.length,1);assert.equal(data.participants.length,2);
 assert.deepEqual(data.participants.map(p=>p.rank),[1,1]);assert.deepEqual(data.participants.map(p=>p.arena.points),[500,500]);assert.deepEqual(data.participants.map(p=>p.arena.badges),[['L01'],['L01']]);
 assert.ok(!JSON.stringify(data).includes('PRIVATE PARENT CODE'));assert.ok(!JSON.stringify(data).includes('private-parent@example.test'));
 const outsider=await provision(store),other=await login(store,outsider.code);const foreign=await current(store,other);assert.equal(view(foreign.family,foreign.profile).participants.length,1);
 await studentAccess(store,parent,student.profileId,true);const after=await current(store,parent);assert.equal(view(after.family,after.profile).participants.length,1);
});
test('legacy baseline initializes before new success and mixed unknown counts survive conditional retry',async()=>{
 const {store,parent}=await fixture();await recordAttempt(store,parent,{id:randomUUID(),source:'old',language:'java',target:'beacon',outcome:'reached'},true);
 assert.equal((await summary(store,parent)).missions[0].challenges[0].checks,null);
 for(let n=0;n<10;n++)await check(store,parent,'farther','missed');
 const original=store.write.bind(store);let retry=true;store.write=async(...args)=>{if(retry&&args[1]?.profiles?.[0]?.arena?.challenges.farther.points===90){retry=false;const e=Error('conditional conflict');e.status=412;throw e;}return original(...args);};
 await check(store,parent,'farther');await check(store,parent,'reverse');const s=await summary(store,parent);
 assert.equal(retry,false);assert.equal(s.points,490);assert.equal(s.missions[0].checks,null);assert.equal(s.missions[0].challenges[0].points,100);assert.equal(s.missions[0].challenges[1].checks,11);
});
test('errors, practice, Stop-first and late replies do not consume scored checks; terminal-first survives Stop',async()=>{
 const {store,student}=await fixture();
 for(const outcome of ['error','stopped','unavailable'])await check(store,student,'beacon',outcome);
 await recordAttempt(store,student,{id:randomUUID(),source:'practice',language:'python',target:'beacon',outcome:'reached',score:999,checks:999});
 assert.equal((await summary(store,student)).missions[0].challenges[0].checks,0);
 const stopped=await start(store,student);await cancelRun(store,student,stopped.id,stopped.checkRevision+1);await assert.rejects(finish(store,student,stopped),e=>e.status===409);await releaseRun(store,student,stopped.id,stopped.checkRevision+1);
 const terminal=await start(store,student);await finish(store,student,terminal);assert.equal((await cancelRun(store,student,terminal.id,terminal.checkRevision+1)).completed,true);
 assert.equal((await summary(store,student)).points,100);assert.equal((await summary(store,student)).missions[0].challenges[0].checks,1);
 const newer=await start(store,student,{target:'farther'});assert.equal((await cancelRun(store,student,terminal.id,terminal.checkRevision+1)).completed,true);await finish(store,student,newer,'error');
});
test('stale nonce cannot be reused after errors, receipt/history eviction or competing tabs',async()=>{
 const {store,student}=await fixture(),input=await start(store,student);await finish(store,student,input,'error');
 await update(store,familyPath(student.familyId),f=>{const p=f.profiles.find(p=>p.id===student.profileId);p.history=[];p.checkReceipts={};p.attemptSeen={};return {value:f};});
 await assert.rejects(reserveRun(store,student,input.id,input),e=>e.code==='STALE_CHECK');
 const currentRevision=(await current(store,student)).profile.arena.revision;
 const results=await Promise.allSettled([1,2].map(()=>start(store,student,{checkRevision:currentRevision})));assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
});
test('expired result, bind, Stop and cleanup cannot affect a replacement reservation with the same ID',async()=>{
 const {store,student}=await fixture(),old=await start(store,student);
 await update(store,familyPath(student.familyId),f=>{f.runs[0].until=Date.now()-1;return {value:f};});
 const replacement=await start(store,student,{id:old.id});
 await assert.rejects(finish(store,student,old),e=>e.code==='STALE_CHECK');
 assert.equal(await bindRun(store,student,old.id,'old-vm',old.checkRevision+1),false);
 assert.equal((await cancelRun(store,student,old.id,old.checkRevision+1)).stale,true);
 await releaseRun(store,student,old.id,old.checkRevision+1);assert.equal((await current(store,student)).family.runs.length,1);
 await finish(store,student,replacement,'missed');assert.equal((await summary(store,student)).missions[0].challenges[0].checks,1);
});
test('markup labels parent competition, safe names, zero rank and legacy counts',()=>{
 const a=arenaSummary(['beacon']);const html=arenaMarkup([{id:'parent',name:'<script>Parent</script>',role:'parent',rank:1,arena:a}], 'parent',a);
 assert.ok(html.includes('>Parent</span>'));assert.ok(html.includes('>You</span>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(html.includes('Total checks not recorded'));
 const empty=arenaSummary([]);assert.ok(arenaMarkup([{id:'p',name:'Parent',role:'parent',rank:null,arena:empty}],'p',empty).includes('Not ranked yet'));
});

test('HTTP ignores forged results/points, counts real terminal outcomes, replays safely and keeps reservation until commit',async()=>{
 const {store,parent}=await fixture();let api,started=0,heldDuringCommit=false;
 class FixtureRun{
  constructor(source,emit){started++;this.finished=Promise.resolve().then(async()=>{
   if(source==='good')for(const [i,command] of [{op:'motor',value:.5},{op:'servo',value:120},{op:'wait',value:100},{op:'motor',value:0},{op:'wait',value:40}].entries())await emit({type:'command',id:i+1,command});
   await emit(source==='error'?{type:'error',text:'fixture error'}:{type:'done'});
  });}
  async reply(){} stop(){} fail(){}
 }
 const original=store.write.bind(store);store.write=async(path,value,etag)=>{if(value?.profiles?.[0]?.arena?.challenges.beacon.points===100&&!heldDuringCommit){heldDuringCommit=true;const still=await current(store,parent);assert.equal(still.family.runs.length,1);await assert.rejects(start(store,parent),e=>e.status===409);}return original(path,value,etag);};
 const server=createServer((req,res)=>void api(req,res));await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`,password='test-only-arena-password-at-least-32-characters',cookie='robolab-local='+await sealData(parent,{password,ttl:3600});api=hostedApi({store,Run:FixtureRun,appOrigin:origin,password});
 const post=data=>fetch(origin+'/api/family/verify',{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json','X-RoboLab-Profile':parent.profileId},body:JSON.stringify(data)});
 try{
  const first={id:randomUUID(),checkRevision:0,source:'wrong',language:'python',target:'beacon',score:2000,outcome:'reached',checks:1};let response=await post(first);assert.equal(response.status,200);assert.equal((await response.json()).outcome,'missed');assert.equal((await summary(store,parent)).points,0);
  const good={...first,id:randomUUID(),source:'good',checkRevision:1};response=await post(good);assert.equal(response.status,200);assert.equal((await response.json()).pointsEarned,100);assert.equal(heldDuringCommit,true);
  response=await post(good);assert.equal((await response.json()).replayed,true);assert.equal(started,2);assert.equal((await summary(store,parent)).missions[0].challenges[0].checks,2);
  assert.deepEqual((await current(store,parent)).family.runs,[]);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
