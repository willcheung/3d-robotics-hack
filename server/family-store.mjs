import {cleanValues} from '../src/run-values.ts';
import {initialArena,arenaSummary,challengePoints} from '../src/arena.ts';
import {get,put,list,BlobPreconditionFailedError} from '@vercel/blob';
import {randomBytes,randomUUID,createHash,createHmac} from 'node:crypto';
import {targets,lessonTargets,missingPrerequisite,modelVersion,targetLesson,draftKey} from '../src/model.ts';
export const hashCode=code=>createHash('sha256').update(code).digest('hex');
export const newCode=()=>randomBytes(24).toString('base64url');
export class HttpError extends Error {constructor(status,message,code){super(message);this.status=status;if(code)this.code=code;}}
// Conditional writes need the storage representation's strong ETag. Compression
// can turn a JSON response into W/"...", which cannot satisfy If-Match.
export class BlobStore {
 async listFamilies(cursor){const page=await list({prefix:"families/",limit:20,...(cursor?{cursor}:{})});return {paths:page.blobs.map(b=>b.pathname),cursor:page.hasMore?page.cursor:undefined};}
 async read(path){const r=await get(path,{access:'private',useCache:false,headers:{'Accept-Encoding':'identity'}});if(!r)return null;if(r.statusCode!==200)throw Error('Storage unavailable');return {value:await new Response(r.stream).json(),etag:r.blob.etag};}
 async write(path,value,etag){return put(path,JSON.stringify(value),{access:'private',addRandomSuffix:false,contentType:'application/json',...(etag?{ifMatch:etag}:{allowOverwrite:false})});}
}
export async function update(store,path,change){
 for(let i=0;i<7;i++){
  const before=await store.read(path);const next=structuredClone(before?.value??null);
  const result=await change(next);
  try{await store.write(path,result.value,before?.etag);return result.result;}
  catch(e){if(!(e instanceof BlobPreconditionFailedError)&&e.status!==412&&!/already exists|conditional request.*conflicting operation/i.test(e.message))throw e;
   await new Promise(r=>setTimeout(r,Math.min(800,50*2**i)+Math.floor(Math.random()*40)));}
 }
 throw new HttpError(409,'Your saved work changed in another tab. Refresh family progress and try again.');
}
export const familyPath=id=>`families/${id}.json`;
export function profileIn(family,session){const p=family?.profiles.find(p=>p.id===session.profileId&&p.active&&p.epoch===session.epoch);if(!p)throw new HttpError(401,'Please sign in again.');return p;}
export async function current(store,session){if(!session?.familyId)throw new HttpError(401,'Sign in to your family to save progress or run hosted Java.');const row=await store.read(familyPath(session.familyId));return {family:row?.value,profile:profileIn(row?.value,session)};}
export function view(family,profile){return {
 profile:{id:profile.id,name:profile.name,role:profile.role},
 drafts:profile.drafts,history:profile.history,
 students:family.profiles.filter(p=>p.role==='student'&&p.active).map(p=>({id:p.id,name:p.name,completed:p.completed,experiments:p.experiments,...(profile.role==='parent'?{lastActivity:p.lastActivity??p.history[0]?.at??null,missionCompleted:p.missionCompleted??{},recent:p.history.slice(0,3).map(a=>({target:a.target,outcome:a.outcome,verified:a.verified,at:a.at}))}:{})})),
 completed:profile.completed,
 arena:arenaSummary(profile.completed,profile.arena),checkRevision:profile.arena?.revision??0,
 participants:family.profiles.filter(p=>p.active&&['parent','student'].includes(p.role)).map(p=>({id:p.id,name:p.name,role:p.role,arena:arenaSummary(p.completed,p.arena)})).sort((a,b)=>b.arena.points-a.arena.points||a.name.localeCompare(b.name)).map((p,_,all)=>({...p,rank:p.arena.points?1+all.filter(other=>other.arena.points>p.arena.points).length:null})),
 ...(profile.role==='parent'?{recoveryEmail:profile.recovery?.email??null}:{}),
 runBusy:family.runs.some(r=>r.profileId===profile.id&&r.until>Date.now()),
 // Only safe family aggregates; drafts, history and parent settings stay private.
};}
export async function provision(store,{familyId=randomUUID(),parentName='Parent'}={}){
 const code=newCode(),profileId=randomUUID();
 const profile={id:profileId,name:parentName,role:'parent',epoch:1,active:true,drafts:{},history:[],completed:[],experiments:0};
 await store.write(familyPath(familyId),{version:1,id:familyId,profiles:[profile],runs:[],daily:{day:'',count:0}});
 await store.write(`invites/${hashCode(code)}.json`,{familyId,profileId,epoch:1});
 return {familyId,code};
}
export async function login(store,code){
 if(typeof code!=='string'||!/^[A-Za-z0-9_-]{32}$/.test(code))throw new HttpError(401,'That family access code is not valid.');
 const found=await store.read(`invites/${hashCode(code)}.json`);if(!found)throw new HttpError(401,'That family access code is not valid.');
 const session=found.value;const {profile}=await current(store,session);if(profile.accessHash&&profile.accessHash!==hashCode(code))throw new HttpError(401,'That family access code is not valid.');return session;
}
export async function addStudent(store,session,name){
 if(typeof name!=='string'||name.trim().length<1||name.trim().length>32)throw new HttpError(400,'Use a student alias from 1 to 32 characters.');
 const code=newCode(),id=randomUUID();
 await update(store,familyPath(session.familyId),f=>{
  const parent=profileIn(f,session);if(parent.role!=='parent')throw new HttpError(403,'Only the parent can add students.');
  if(f.profiles.length>=25||f.profiles.filter(p=>p.active&&p.role==='student').length>=6)throw new HttpError(400,'This family supports six active students.');
  f.profiles.push({id,name:name.trim(),role:'student',epoch:1,active:true,drafts:{},history:[],completed:[],experiments:0});return {value:f};
 });
 await store.write(`invites/${hashCode(code)}.json`,{familyId:session.familyId,profileId:id,epoch:1});
 return {id,code};
}
export async function studentAccess(store,session,id,revoke){
 const code=newCode();let epoch;
 await update(store,familyPath(session.familyId),f=>{
  if(profileIn(f,session).role!=='parent')throw new HttpError(403,'Only the parent can manage access.');
  const p=f.profiles.find(p=>p.id===id&&p.role==='student'&&p.active);if(!p)throw new HttpError(404,'Student not found.');
  p.epoch++;epoch=p.epoch;if(revoke)p.active=false;else p.accessHash=hashCode(code);return {value:f};
 });
 if(!revoke)await store.write(`invites/${hashCode(code)}.json`,{familyId:session.familyId,profileId:id,epoch});
 return revoke?{ok:true}:{code};
}
export function sourceInput(data){if(!data||!['java','python'].includes(data.language)||typeof data.source!=='string'||data.source.length>16000)throw new HttpError(400,'Choose Python or Java and keep source under 16,000 characters.');}
export async function saveDraft(store,session,data){
 sourceInput(data);if(!Number.isSafeInteger(data.revision)||data.revision<0)throw new HttpError(400,'Invalid draft revision.');
 const lesson=data.lesson??'L01';if(typeof lesson!=='string'||!Object.hasOwn(lessonTargets,lesson))throw new HttpError(400,'Unknown lesson.');const key=draftKey(lesson,data.language);
 if(data.target!==undefined && (typeof data.target!=='string'||!lessonTargets[lesson].includes(data.target)))throw new HttpError(400,'Challenge does not belong to this lesson.');
 return update(store,familyPath(session.familyId),f=>{const p=profileIn(f,session),old=p.drafts[key];
  if(old&&old.source===data.source&&old.target===data.target&&data.revision<=old.revision)return {value:f,result:old};
  if((old?.revision??0)!==data.revision)throw new HttpError(409,'A newer draft is saved in another tab. Your editor is safe. Refresh before replacing it.');
  const draft={source:data.source,revision:data.revision+1,...(data.target!==undefined?{target:data.target}:{})};p.drafts[key]=draft;return {value:f,result:draft};});
}
export const validAttempt=id=>typeof id==='string'&&/^[a-f0-9-]{36}$/.test(id);
const signature=data=>hashCode(JSON.stringify([data.source,data.language,data.target]));
const CHECK_RECEIPT_TTL=7*86400000;
export async function reserveRun(store,session,id,input,{practice=false}={}){
 if(!validAttempt(id))throw new HttpError(400,'Invalid run identifier.');
 return update(store,familyPath(session.familyId),f=>{
  const p=profileIn(f,session),now=Date.now(),day=new Date(now).toISOString().slice(0,10);
  const receipt=p.checkReceipts?.[id],historical=p.history.find(a=>a.id===id&&a.verified);
  if(receipt||historical){
   const matches=receipt?receipt.signature===signature(input??{}):historical.source===input?.source&&historical.language===input?.language&&historical.target===input?.target;
   if(!input||!matches)throw new HttpError(409,'This experiment is already checked with a different source.');
   return {value:f,result:{outcome:(receipt??historical).outcome,seconds:(receipt??historical).seconds,error:(receipt??historical).error,completed:p.completed,replayed:true}};
  }
  if(input&&(!Number.isSafeInteger(input.checkRevision)||input.checkRevision!==(p.arena?.revision??0)))throw new HttpError(409,'Scored checks changed. Refresh progress before submitting again.','STALE_CHECK');
  const recorded=p.attemptSeen?.[id]??p.history.find(a=>a.id===id);if(input&&recorded&&(recorded.signature??signature(recorded))!==signature(input))throw new HttpError(409,'That experiment already has a different source.');
  f.runs=f.runs.filter(r=>r.until>now);
  f.cancelled=(f.cancelled??[]).filter(r=>r.until>now);
  if(f.cancelled.some(r=>r.id===id&&r.profileId===p.id))throw new HttpError(409,'This check was cancelled. Start a new check.');
  if(f.runs.some(r=>r.profileId===p.id)||f.runs.length>=2)throw new HttpError(409,'A family run is still active. Stop it or try again shortly.');
  if(f.daily.day!==day)f.daily={day,count:0};
  if(f.daily.count>=60)throw new HttpError(429,'The family’s 60 hosted runs for today are used. Python practice is still available.');
  if(input){p.arena??=initialArena(p.completed);p.arena.revision++;}
  f.daily.count++;f.runs.push({id,profileId:p.id,until:now+(practice?360000:120000),...(input?{signature:signature(input),target:input.target,checkRevision:p.arena.revision}:{})});return {value:f,result:null};
 });
}
export async function releaseRun(store,session,id,checkRevision){await update(store,familyPath(session.familyId),f=>{if(!f)return {value:f};f.runs=f.runs.filter(r=>r.id!==id||r.profileId!==session.profileId||checkRevision!==undefined&&r.checkRevision!==checkRevision);return {value:f};});}
export async function recordAttempt(store,session,data,verified=false,scoredRevision){
 sourceInput(data);
 if(!validAttempt(data.id)||typeof data.target!=='string'||!Object.hasOwn(targets,data.target)||!['reached','missed','error','stopped','unavailable'].includes(data.outcome))throw new HttpError(400,'Invalid experiment.');
 return update(store,familyPath(session.familyId),f=>{
  const p=profileIn(f,session),old=p.history.find(a=>a.id===data.id),time=Date.now(),at=new Date(time).toISOString();
  p.checkReceipts=Object.fromEntries(Object.entries(p.checkReceipts??{}).filter(([,r])=>r.until>time).slice(-420));
  p.attemptSeen=Object.fromEntries(Object.entries(p.attemptSeen??{}).filter(([,r])=>r.until>time).slice(-420));
  const committed=p.checkReceipts[data.id],seen=p.attemptSeen[data.id];
  if((committed??seen)&& (committed??seen).signature!==signature(data))throw new HttpError(409,'That experiment already has a different source.');
  if(committed||seen&&!verified)return {value:f,result:{ok:true,completed:p.completed}};
  const missing=verified&&missingPrerequisite(targetLesson(data.target),p.completed);
  if(missing)throw new HttpError(403,`Complete checked Mission ${Number(missing.slice(1))} before checked Mission ${Number(targetLesson(data.target).slice(1))}.`);
  if(verified&&f.cancelled?.some(r=>r.id===data.id&&r.profileId===p.id))throw new HttpError(409,'Check stopped. No completion was awarded.');
  if(old&&(old.source!==data.source||old.language!==data.language||old.target!==data.target))throw new HttpError(409,'That experiment already has a different source.');
  if(old?.verified||old&&!verified)return {value:f,result:{ok:true}};
  let pointsEarned=0;
  if(verified&&scoredRevision!==undefined){
   const active=f.runs.find(r=>r.id===data.id&&r.profileId===p.id);
   if(!active||active.until<=time||active.checkRevision!==scoredRevision||p.arena?.revision!==scoredRevision||active.target!==data.target||active.signature!==signature(data))throw new HttpError(409,'This check is no longer active. Refresh progress.','STALE_CHECK');
   const before=arenaSummary(p.completed,p.arena).points,score=p.arena.challenges[data.target];
   if(score.points===null&&['reached','missed'].includes(data.outcome)){
    score.checks++;if(data.outcome==='reached')score.points=challengePoints(score.checks);
   }
   pointsEarned=arenaSummary(p.completed,p.arena).points-before;
   // Clear only this scored reservation inside the terminal conditional write.
   f.runs=f.runs.filter(r=>r!==active);
  }
  const attempt={id:data.id,source:data.source,language:data.language,target:data.target,lesson:targetLesson(data.target),lessonVersion:1,outcome:data.outcome,seconds:Number.isFinite(data.seconds)?Math.max(0,Math.min(30,data.seconds)):null,error:typeof data.error==='string'?data.error.slice(0,300):'',verified,at:old?.at??at,values:cleanValues(data.values),output:typeof data.output==='string'?data.output.slice(0,4000):'',version:modelVersion(data.target),sourceHash:hashCode(data.source),...(verified?{receipt:{model:modelVersion(data.target),runner:'sandbox-v1',snapshot:process.env.SANDBOX_SNAPSHOT_ID??'test-fixture'}}:{})};
  if(old)p.history=p.history.filter(a=>a.id!==data.id);
  if(!old&&!seen){p.experiments++;p.lastActivity=at;const week=weekStart(time);p.activity??={};p.activity[week]=(p.activity[week]??0)+1;p.activity=Object.fromEntries(Object.entries(p.activity).sort(([a],[b])=>a.localeCompare(b)).slice(-8));}
  p.attemptSeen[data.id]={signature:signature(data),until:time+CHECK_RECEIPT_TTL};
  p.history=[attempt,...p.history].slice(0,12);
  if(verified){
   p.checkReceipts[data.id]={signature:signature(data),until:time+CHECK_RECEIPT_TTL,outcome:data.outcome,seconds:attempt.seconds,error:attempt.error};
   if(data.outcome==='reached'&&!p.completed.includes(data.target)){
    const lesson=targetLesson(data.target);p.completed.push(data.target);p.challengeCompleted??={};p.challengeCompleted[data.target]=at;
    if(lessonTargets[lesson].every(t=>p.completed.includes(t))){p.missionCompleted??={};p.missionCompleted[lesson]??=at;}
   }
  }
  return {value:f,result:{ok:true,completed:p.completed,pointsEarned}};
 });
}

// Cancellation is durable across stateless Functions, including creation races.
export async function bindRun(store,session,id,name,checkRevision){
 return update(store,familyPath(session.familyId),f=>{
  profileIn(f,session);
  const row=f.runs.find(r=>r.id===id&&r.profileId===session.profileId&&(checkRevision===undefined||r.checkRevision===checkRevision));
  const allowed=!!row&&!f.cancelled?.some(r=>r.id===id&&r.profileId===session.profileId);
  if(allowed)row.name=name;
  return {value:f,result:allowed};
 });
}
export async function cancelRun(store,session,id,checkRevision){
 if(!validAttempt(id))throw new HttpError(400,'Invalid check identifier.');
 return update(store,familyPath(session.familyId),f=>{
  const p=profileIn(f,session),now=Date.now();
  const completed=!!p.checkReceipts?.[id]||p.history.some(a=>a.id===id&&a.verified);
  const row=f.runs.find(r=>r.id===id&&r.profileId===p.id);
  if(!completed&&(row?.checkRevision!==undefined&&row.checkRevision!==checkRevision||!row&&checkRevision!==undefined&&checkRevision<(p.arena?.revision??0)))return {value:f,result:{completed:false,stale:true}};
  if(!completed){
   f.cancelled=(f.cancelled??[]).filter(r=>r.until>now&&!(r.id===id&&r.profileId===p.id));
   if(f.cancelled.length>=100)throw new HttpError(429,'Please wait before starting more checks.');
   f.cancelled.push({id,profileId:p.id,until:now+120000});
  }
  return {value:f,result:{completed,name:row?.name}};
 });
}

// A random setup key is a temporary credential: retries derive the same parent
// code without storing it in plaintext or creating a second family.
export const SIGNUP_LIMIT_PATH='limits/family-signup-v1.json';
export const SERVICE_LIMIT_PATH='limits/hosted-runs-v1.json';
export function setupIdentity(key,password){
 if(typeof key!=='string'||!/^[A-Za-z0-9_-]{32}$/.test(key))throw new HttpError(400,'Please restart family setup.');
 const digest=label=>createHmac('sha256',password).update(label+key).digest('base64url');
 return {familyId:hashCode('family:'+key),profileId:hashCode('parent:'+key),code:digest('access:').slice(0,32),keyHash:hashCode(key)};
}
export async function createFamily(store,{name,key},password,{now=Date.now()}={}){
 if(typeof name!=='string'||!name.trim()||name.trim().length>32)throw new HttpError(400,'Use a parent nickname from 1 to 32 characters.');
 name=name.trim();const {familyId,profileId,code,keyHash}=setupIdentity(key,password),path=familyPath(familyId),codeHash=hashCode(code);
 const matches=f=>{if(f&&(f.registration?.keyHash!==keyHash||f.registration?.codeHash!==codeHash||f.profiles[0]?.name!==name))throw new HttpError(409,'This setup changed. Sign in with your saved parent code.');};
 const existing=await store.read(path);matches(existing?.value);
 if(!existing){
  await update(store,SIGNUP_LIMIT_PATH,old=>{
   const day=new Date(now).toISOString().slice(0,10),quota=old?.day===day?old:{day,keys:[]};
   if(!quota.keys.includes(keyHash)){if(quota.keys.length>=10)throw new HttpError(429,'Family setup has reached today’s limit. Please try again tomorrow. Python practice is still available.');quota.keys.push(keyHash);}
   return {value:quota};
  });
 }
 await update(store,path,f=>{matches(f);return {value:f??{version:1,id:familyId,registration:{keyHash,codeHash},profiles:[{id:profileId,name,role:'parent',epoch:1,active:true,drafts:{},history:[],completed:[],experiments:0}],runs:[],daily:{day:'',count:0}}};});
 const invitation={familyId,profileId,epoch:1};
 await update(store,`invites/${codeHash}.json`,old=>{if(old&&(old.familyId!==familyId||old.profileId!==profileId))throw new HttpError(409,'Please restart family setup.');return {value:old??invitation};});
 await current(store,invitation);return {code,session:invitation};
}
// Public family creation must not multiply the service's compute allowance.
export async function reserveServiceRun(store,session,id,{now=Date.now(),practice=false}={}){
 return update(store,SERVICE_LIMIT_PATH,old=>{
  const day=new Date(now).toISOString().slice(0,10),quota=old??{day,count:0,runs:[]};
  quota.runs=quota.runs.filter(r=>r.until>now);
  if(quota.day!==day){quota.day=day;quota.count=0;}
  const key=session.familyId+':'+session.profileId+':'+id;
  if(quota.runs.some(r=>r.key===key))return {value:quota};
  if(quota.runs.length>=2)throw new HttpError(429,'The hosted robots are busy. Please try again shortly. Python practice is available.');
  if(quota.count>=120)throw new HttpError(429,'Today’s hosted run allowance is used. Please return tomorrow; Python practice is still available.');
  quota.count++;quota.runs.push({key,until:now+(practice?360000:120000)});return {value:quota};
 });
}
export async function releaseServiceRun(store,session,id){
 await update(store,SERVICE_LIMIT_PATH,quota=>{if(!quota)return {value:{day:'',count:0,runs:[]}};quota.runs=quota.runs.filter(r=>r.key!==session.familyId+':'+session.profileId+':'+id);return {value:quota};});
}

/** Monday 00:00 UTC reporting windows; historical completions have no invented date. */
export function weekStart(time=Date.now()){const d=new Date(time);d.setUTCHours(0,0,0,0);d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return d.toISOString().slice(0,10);}
