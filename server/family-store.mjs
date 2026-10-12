import {get,put,BlobPreconditionFailedError} from '@vercel/blob';
import {randomBytes,randomUUID,createHash,createHmac} from 'node:crypto';
export const hashCode=code=>createHash('sha256').update(code).digest('hex');
export const newCode=()=>randomBytes(24).toString('base64url');
export class HttpError extends Error {constructor(status,message){super(message);this.status=status;}}
// Conditional writes need the storage representation's strong ETag. Compression
// can turn a JSON response into W/"...", which cannot satisfy If-Match.
export class BlobStore {
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
 students:family.profiles.filter(p=>p.role==='student'&&p.active).map(p=>({id:p.id,name:p.name,completed:p.completed,experiments:p.experiments})),
 completed:profile.completed,
 ...(profile.role==='parent'?{recoveryEmail:profile.recovery?.email??null}:{}),
 runBusy:family.runs.some(r=>r.profileId===profile.id&&r.until>Date.now()),
 // Independent attempts share progress. No client-reported score or rankings.
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
  p.epoch++;epoch=p.epoch;if(revoke)p.active=false;return {value:f};
 });
 if(!revoke)await store.write(`invites/${hashCode(code)}.json`,{familyId:session.familyId,profileId:id,epoch});
 return revoke?{ok:true}:{code};
}
export function sourceInput(data){if(!data||!['java','python'].includes(data.language)||typeof data.source!=='string'||data.source.length>16000)throw new HttpError(400,'Choose Python or Java and keep source under 16,000 characters.');}
export async function saveDraft(store,session,data){
 sourceInput(data);if(!Number.isSafeInteger(data.revision)||data.revision<0)throw new HttpError(400,'Invalid draft revision.');
 return update(store,familyPath(session.familyId),f=>{const p=profileIn(f,session),old=p.drafts[data.language];
  if((old?.revision??0)!==data.revision)throw new HttpError(409,'A newer draft is saved in another tab. Your editor is safe. Refresh before replacing it.');
  const draft={source:data.source,revision:data.revision+1};p.drafts[data.language]=draft;return {value:f,result:draft};});
}
export const validAttempt=id=>typeof id==='string'&&/^[a-f0-9-]{36}$/.test(id);
export async function reserveRun(store,session,id){
 if(!validAttempt(id))throw new HttpError(400,'Invalid run identifier.');
 return update(store,familyPath(session.familyId),f=>{
  const p=profileIn(f,session),now=Date.now(),day=new Date(now).toISOString().slice(0,10);
  if(p.history.some(a=>a.id===id&&a.verified))throw new HttpError(409,'This experiment is already checked.');
  f.runs=f.runs.filter(r=>r.until>now);
  f.cancelled=(f.cancelled??[]).filter(r=>r.until>now);
  if(f.cancelled.some(r=>r.id===id&&r.profileId===p.id))throw new HttpError(409,'This check was cancelled. Start a new check.');
  if(f.runs.some(r=>r.profileId===p.id)||f.runs.length>=2)throw new HttpError(409,'A family run is still active. Stop it or try again shortly.');
  if(f.daily.day!==day)f.daily={day,count:0};
  if(f.daily.count>=60)throw new HttpError(429,'The family’s 60 hosted runs for today are used. Python practice is still available.');
  f.daily.count++;f.runs.push({id,profileId:p.id,until:now+120000});return {value:f};
 });
}
export async function releaseRun(store,session,id){await update(store,familyPath(session.familyId),f=>{if(!f)return {value:f};f.runs=f.runs.filter(r=>r.id!==id||r.profileId!==session.profileId);return {value:f};});}
export async function recordAttempt(store,session,data,verified=false){
 sourceInput(data);
 if(!validAttempt(data.id)||!['beacon','farther','reverse'].includes(data.target)||!['reached','missed','error','stopped','unavailable'].includes(data.outcome))throw new HttpError(400,'Invalid experiment.');
 return update(store,familyPath(session.familyId),f=>{
  const p=profileIn(f,session),old=p.history.find(a=>a.id===data.id);
  if(verified&&f.cancelled?.some(r=>r.id===data.id&&r.profileId===p.id))throw new HttpError(409,'Check stopped. No completion was awarded.');
  if(old&&(old.source!==data.source||old.language!==data.language||old.target!==data.target))throw new HttpError(409,'That experiment already has a different source.');
  if(old?.verified||old&&!verified)return {value:f,result:{ok:true}};
  const attempt={id:data.id,source:data.source,language:data.language,target:data.target,outcome:data.outcome,seconds:Number.isFinite(data.seconds)?Math.max(0,Math.min(30,data.seconds)):null,error:typeof data.error==='string'?data.error.slice(0,300):'',verified,at:new Date().toISOString(),version:'signal-station-v1',sourceHash:hashCode(data.source),...(verified?{receipt:{model:'signal-station-v1',runner:'sandbox-v1',snapshot:process.env.SANDBOX_SNAPSHOT_ID??'test-fixture'}}:{})};
  if(old)p.history=p.history.filter(a=>a.id!==data.id);else p.experiments++;
  p.history=[attempt,...p.history].slice(0,12);
  if(verified&&data.outcome==='reached'&&!p.completed.includes(data.target))p.completed.push(data.target);
  return {value:f,result:{ok:true,completed:p.completed}};
 });
}

// Cancellation is durable across stateless Functions, including creation races.
export async function bindRun(store,session,id,name){
 return update(store,familyPath(session.familyId),f=>{
  profileIn(f,session);
  const row=f.runs.find(r=>r.id===id&&r.profileId===session.profileId);
  const allowed=!!row&&!f.cancelled?.some(r=>r.id===id&&r.profileId===session.profileId);
  if(allowed)row.name=name;
  return {value:f,result:allowed};
 });
}
export async function cancelRun(store,session,id){
 if(!validAttempt(id))throw new HttpError(400,'Invalid check identifier.');
 return update(store,familyPath(session.familyId),f=>{
  const p=profileIn(f,session),now=Date.now();
  const completed=p.history.some(a=>a.id===id&&a.verified);
  if(!completed){
   f.cancelled=(f.cancelled??[]).filter(r=>r.until>now&&!(r.id===id&&r.profileId===p.id));
   if(f.cancelled.length>=100)throw new HttpError(429,'Please wait before starting more checks.');
   f.cancelled.push({id,profileId:p.id,until:now+120000});
  }
  const row=f.runs.find(r=>r.id===id&&r.profileId===p.id);
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
export async function reserveServiceRun(store,session,id,{now=Date.now()}={}){
 return update(store,SERVICE_LIMIT_PATH,old=>{
  const day=new Date(now).toISOString().slice(0,10),quota=old??{day,count:0,runs:[]};
  quota.runs=quota.runs.filter(r=>r.until>now);
  if(quota.day!==day){quota.day=day;quota.count=0;}
  const key=session.familyId+':'+session.profileId+':'+id;
  if(quota.runs.some(r=>r.key===key))return {value:quota};
  if(quota.runs.length>=2)throw new HttpError(429,'The hosted robots are busy. Please try again shortly. Python practice is available.');
  if(quota.count>=120)throw new HttpError(429,'Today’s hosted run allowance is used. Please return tomorrow; Python practice is still available.');
  quota.count++;quota.runs.push({key,until:now+120000});return {value:quota};
 });
}
export async function releaseServiceRun(store,session,id){
 await update(store,SERVICE_LIMIT_PATH,quota=>{if(!quota)return {value:{day:'',count:0,runs:[]}};quota.runs=quota.runs.filter(r=>r.key!==session.familyId+':'+session.profileId+':'+id);return {value:quota};});
}
