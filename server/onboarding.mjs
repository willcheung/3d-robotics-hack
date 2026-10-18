import {createHmac,randomBytes,randomInt,createCipheriv,createDecipheriv,timingSafeEqual,hkdfSync} from 'node:crypto';
import {HttpError,update,current,profileIn,familyPath,hashCode,createFamily,setupIdentity,validAttempt,login,weekStart} from './family-store.mjs';
import {normalizeEmail,recoveryIndex,EMAIL_LIMIT_PATH} from './recovery.mjs';

export const AUTH_TTL=10*60*1000;
export const MAIL_TTL=23*60*60*1000; // Strictly inside Resend's 24-hour deduplication window.
const keyPattern=/^[A-Za-z0-9_-]{32}$/;
const invalid=()=>new HttpError(400,'That code is incorrect, expired or used. Check the email or request a new code.');
const hmac=(password,value)=>createHmac('sha256',password).update(value).digest('hex');
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const requireKey=key=>{if(typeof key!=='string'||!keyPattern.test(key))throw invalid();};
const authPath=(password,key)=>`parent-auth/${hmac(password,'challenge:'+key)}.json`;
const tokenCode=(password,label)=>createHmac('sha256',password).update(label).digest('base64url').slice(0,32);
const parentIn=f=>f?.profiles.find(p=>p.active&&p.role==='parent');

// The session secret is already high entropy. Domain-separated HKDF keeps mail
// encryption independent of cookie sealing and OTP verifiers; no new credential.
function encryptionKey(password){return hkdfSync('sha256',password,'robolab-onboarding','mail-envelope-v1',32);}
function seal(password,id,value){
 const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',encryptionKey(password),iv);
 cipher.setAAD(Buffer.from(id));
 const body=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);
 return {v:1,iv:iv.toString('base64'),body:body.toString('base64'),tag:cipher.getAuthTag().toString('base64')};
}
function open(password,id,box){
 if(box?.v!==1)throw new Error('Mail payload unavailable');
 const cipher=createDecipheriv('aes-256-gcm',encryptionKey(password),Buffer.from(box.iv,'base64'));
 cipher.setAAD(Buffer.from(id));cipher.setAuthTag(Buffer.from(box.tag,'base64'));
 return JSON.parse(Buffer.concat([cipher.update(Buffer.from(box.body,'base64')),cipher.final()]).toString());
}

// Share the existing global email cap. Optional notices leave 12 sends for
// requested authentication; stable event reservations make retries free.
async function emailAllowance(store,password,{email,ip='unknown',id,kind,now}){
 return update(store,EMAIL_LIMIT_PATH,old=>{
  const day=new Date(now).toISOString().slice(0,10),q=old?.day===day?old:{day,count:0,emails:{},ips:{}};
  q.events??={};if(q.events[id])return {value:q};
  const address=hmac(password,'onboarding-email:'+email),source=hmac(password,'ip:'+ip);
  q.onboarding??={};const row=q.onboarding[address]??{auth:0,setup:0,first:0,lastAuth:0};
  if(q.count>=60||['first','weekly'].includes(kind)&&q.count>=48||(row[kind]??0)>=(kind==='first'?6:kind==='weekly'?5:5))throw new HttpError(429,'Email limit reached. Your existing login and saved work are safe. Please try again later.');
  if(kind==='auth'&&(now-row.lastAuth<60000||(q.ips[source]??0)>=20))throw new HttpError(429,'Please wait a minute before requesting another code.');
  q.count++;row[kind]=(row[kind]??0)+1;if(kind==='auth'){row.lastAuth=now;q.ips[source]=(q.ips[source]??0)+1;}
  q.onboarding[address]=row;q.events[id]=true;return {value:q};
 });
}

export function onboardingService({store,password,appOrigin,mail,enqueue,now=()=>Date.now(),weeklyEnabled=process.env.WEEKLY_SUMMARY_ENABLED==='1'}){
 const ready=()=>{if(!mail?.enabled)throw new HttpError(503,'Email sign-in is unavailable right now. Please retry later. Existing sessions and student codes still work.');};
 const proof=async key=>{
  requireKey(key);const row=(await store.read(authPath(password,key)))?.value;
  if(!row?.verified||row.until<=now())throw invalid();return row;
 };
 async function memberships(email){
  const index=recoveryIndex(email,password),ids=(await store.read(index))?.value.families??[],found=[];
  for(const id of ids){const f=(await store.read(familyPath(id)))?.value,p=parentIn(f);
   if(p?.recovery?.index===index&&p.recovery.email===email)found.push({id,name:p.name,students:f.profiles.filter(s=>s.active&&s.role==='student').map(s=>s.name),session:{familyId:id,profileId:p.id,epoch:p.epoch}});
  }return found;
 }
 async function publish(familyId,eventId,cleanup=false,delaySeconds=0){
  if(!enqueue)return false;
  try{await enqueue({familyId,eventId,cleanup},{delaySeconds});return true;}catch{return false;}
 }
 function scrub(f){
  for(const e of Object.values(f.onboarding?.events??{}))if(e.until<=now()){delete e.payload;if(!['sent','cancelled'].includes(e.status))e.status='expired';}
  for(const b of Object.values(f.onboarding?.batches??{}))if(b.until<=now())delete b.cards;
 }
 function readCards(f,id,batch){
  if(batch.until<=now()||!batch.cards)throw new HttpError(400,'These login cards expired. Your students are saved; generate replacement codes if needed.','batch-receipt-unavailable');
  const cards=open(password,'cards:'+id,batch.cards);
  if(cards.some(c=>!f.profiles.some(p=>p.id===c.id&&p.active&&p.accessHash===hashCode(c.code))))throw new HttpError(409,'These cards have been replaced or revoked. Use the latest login cards.','batch-receipt-unavailable');
  return {cards,eventId:id};
 }
 function newEvent(f,id,kind,payload,profiles=[]){
  const parent=parentIn(f);if(!parent?.recovery)throw new HttpError(403,'Verify your parent email before emailing student logins.');
  return {id,kind,created:now(),until:now()+MAIL_TTL,status:'pending',emailIndex:parent.recovery.index,parentId:parent.id,profiles,payload:seal(password,id,{...payload,to:parent.recovery.email})};
 }
 async function retry(session,id){
  const {family,profile}=await current(store,session);if(profile.role!=='parent')throw new HttpError(403,'Only parents can retry email.');
  const e=family.onboarding?.events?.[id];if(!e)throw new HttpError(404,'Email not found.');
  if(e.until<=now())throw new HttpError(400,'These temporary login details expired. Generate a new code if needed; saved work is kept.');
  if(['sent','cancelled'].includes(e.status))return {ok:true};
  if(!await publish(session.familyId,id))throw new HttpError(503,'Email is waiting to retry. The student codes still work.');
  await update(store,familyPath(session.familyId),f=>{profileIn(f,session);const next=f.onboarding.events[id];if(next.status==='retry')next.status='pending';return {value:f};});
  return {ok:true};
 }
 return {
  enabled:!!mail?.enabled,
  async start({email,key,resend=false},ip='unknown'){
   ready();requireKey(key);email=normalizeEmail(email);const path=authPath(password,key),time=now();
   const existing=(await store.read(path))?.value;
   if(existing&&(existing.email!==email||existing.until<=time||existing.verified||existing.attempts>=5))throw invalid();
   if(!existing)await emailAllowance(store,password,{email,ip,id:hmac(password,path+':send:0'),kind:'auth',now:time});
   // Queue expiry before writing a sensitive challenge, including the crash
   // window between challenge persistence and sending the first message.
   if(enqueue){try{await enqueue({authPath:path},{delaySeconds:Math.max(1,Math.ceil(((existing?.until??time+AUTH_TTL)-now())/1000))});}catch{throw new HttpError(503,'Email sign-in is temporarily unavailable. Please retry.');}}
   const candidate=String(randomInt(1000000)).padStart(6,'0');
   const row=await update(store,path,old=>{
    if(old){if(old.email!==email||old.until<=time||old.verified||old.attempts>=5)throw invalid();return {value:old,result:old};}
    const value={email,until:time+AUTH_TTL,attempts:0,hash:hmac(password,path+':'+candidate),code:seal(password,path,candidate),created:time,send:0};return {value,result:value};
   });
   let generation=row.send;
   if(resend){
    generation=await update(store,path,r=>{if(r.until<=time||r.verified||r.attempts>=5)throw invalid();if(time-(r.sentAt??r.created)<60000)throw new HttpError(429,'Wait a minute before resending.');r.send++;r.sentAt=time;return {value:r,result:r.send};});
   }
   const id=hmac(password,path+':send:'+generation);
   await emailAllowance(store,password,{email,ip,id,kind:'auth',now:time});
   await mail.send({to:email,subject:'Your RoboLab sign-in code',text:`Your RoboLab sign-in code is:\n\n${open(password,path,row.code)}\n\nEnter it in the browser where you requested it. It expires 10 minutes after the original request. This code signs you in and verifies your email. If you did not request it, ignore this email.`,id:'auth-'+id});
   await update(store,path,r=>{if(r&&!r.verified)r.sentAt=time;return {value:r};});
   return {ok:true,serverNow:time,expiresAt:row.until,resendAt:time+60000};
  },
  async verify({key,code},ip='unknown'){
   ready();requireKey(key);if(typeof code!=='string'||!/^\d{6}$/.test(code))throw invalid();
   const path=authPath(password,key),before=(await store.read(path))?.value;if(!before||before.until<=now())throw invalid();
   // Bound guesses across challenges as well as on one six-digit code.
   await update(store,'limits/parent-auth-attempts-v1.json',old=>{
    const day=new Date(now()).toISOString().slice(0,10),q=old?.day===day?old:{day,emails:{},ips:{}};
    const e=hmac(password,before.email),i=hmac(password,ip);
    if((q.emails[e]??0)>=25||(q.ips[i]??0)>=100)throw new HttpError(429,'Too many code attempts. Please try again tomorrow.');
    q.emails[e]=(q.emails[e]??0)+1;q.ips[i]=(q.ips[i]??0)+1;return {value:q};
   });
   const accepted=await update(store,path,r=>{
    if(!r||r.until<=now()||r.attempts>=5)return {value:r,result:false};
    if(!equal(r.hash,hmac(password,path+':'+code))){r.attempts++;return {value:r,result:false};}
    r.verified=true;delete r.code;return {value:r,result:true};
   });
   if(!accepted)throw invalid();
   const rows=await memberships(before.email);
   return {ok:true,families:rows.map(({id,name,students})=>({id,name,students})),email:before.email};
  },
  async finish({key,familyId,create=false,parentCode,parentSetupKey},expected){
   const verified=await proof(key);
   if(parentCode!==undefined||parentSetupKey!==undefined){
    // A legacy code can connect its existing family only after fresh email
    // proof. It never creates a code-authenticated browser session.
    if(create||familyId||parentCode!==undefined&&parentSetupKey!==undefined)throw new HttpError(400,'Connect your existing family or create a new one, not both.');
    let legacy;
    if(parentSetupKey!==undefined){
     const id=setupIdentity(parentSetupKey,password),f=(await store.read(familyPath(id.familyId)))?.value;
     if(!f||f.registration?.keyHash!==id.keyHash||f.registration.codeHash!==hashCode(id.code))throw new HttpError(400,'That unfinished setup was not saved. Start again with email to create your family.');
     parentCode=id.code;legacy={familyId:id.familyId,profileId:id.profileId,epoch:1};
    }else legacy=await login(store,parentCode);
    const {profile}=await current(store,legacy);
    const linkId=hmac(password,'connect:'+key),codeHash=hashCode(parentCode);
    if(profile.role!=='parent')throw new HttpError(403,'Use your old parent code to connect this family. Student codes cannot connect an email.');
    if(expected&&(expected.familyId!==legacy.familyId||expected.profileId!==legacy.profileId))throw new HttpError(409,'Sign out before switching families.');
    const check=p=>{
     if(verified.until<=now())throw invalid();
     if(p.accessHash&&p.accessHash!==codeHash||p.emailLogin&&p.emailConnectedWith!==linkId)throw new HttpError(403,'This family already uses email sign-in. Return with its verified email.');
     if(p.recovery&&p.recovery.email!==verified.email)throw new HttpError(403,'This family already has a verified email. Sign in with that address.');
    };
    check(profile);
    await update(store,authPath(password,key),r=>{
     if(!r?.verified||r.until<=now())throw invalid();
     if(r.familyId&&r.familyId!==legacy.familyId)throw new HttpError(409,'This email request is already connected to another family. Start again.');
     r.familyId=legacy.familyId;return {value:r};
    });
    const index=recoveryIndex(verified.email,password);
    // Index first: a partial write is harmless until the authoritative family
    // matches it. After the family commits, email sign-in is already usable.
    await update(store,index,r=>{r??={families:[]};if(!r.families.includes(legacy.familyId))r.families.push(legacy.familyId);return {value:r};});
    await update(store,familyPath(legacy.familyId),f=>{
     const p=profileIn(f,legacy);check(p);
     p.recovery={email:verified.email,index,verifiedAt:p.recovery?.verifiedAt??new Date(now()).toISOString()};
     p.emailLogin=true;p.emailConnectedWith=linkId;f.onboarding??={events:{},batches:{},notifyFirst:true};return {value:f};
    });
    return {session:legacy};
   }
   let rows=await memberships(verified.email),chosen=rows.find(f=>f.id===familyId);
   if(!chosen&&create&&rows.length){const bound=(await proof(key)).familyId;chosen=rows.find(r=>r.id===bound);}
   if(verified.familyId&&chosen&&verified.familyId!==chosen.id)throw new HttpError(409,'This email request is already connected to another family. Start again.');
   if(expected&&(!chosen||chosen.session.familyId!==expected.familyId||chosen.session.profileId!==expected.profileId))throw new HttpError(409,'Sign out before switching families.');
   if(!chosen&&rows.length)throw new HttpError(400,'Choose your existing family.');
   if(!chosen){
    if(!create)throw new HttpError(400,'Choose Create family to continue.');
    const setupKey=tokenCode(password,'email-family:'+verified.email);
    await update(store,authPath(password,key),r=>{if(!r?.verified||r.until<=now())throw invalid();const id=setupIdentity(setupKey,password).familyId;if(r.familyId&&r.familyId!==id)throw new HttpError(409,'This email request is already connected to another family. Start again.');r.familyId=id;return {value:r};});
    const created=await createFamily(store,{name:'Parent',key:setupKey},password,{now:now()});
    const index=recoveryIndex(verified.email,password);
    await update(store,familyPath(created.session.familyId),f=>{const p=profileIn(f,created.session);
     if(p.recovery&&p.recovery.index!==index)throw new HttpError(409,'This family uses another email. Use its current sign-in method.');
     p.recovery={email:verified.email,index,verifiedAt:new Date(now()).toISOString()};p.emailLogin=true;f.onboarding??={events:{},batches:{},notifyFirst:true};return {value:f};});
    await update(store,index,r=>{r??={families:[]};if(!r.families.includes(created.session.familyId))r.families.push(created.session.familyId);return {value:r};});
    chosen={id:created.session.familyId,session:created.session};
   }
   // Recheck the authoritative family after resolving an index; an old email
   // proof must not survive a concurrent address change or parent revocation.
   const {profile}=await current(store,chosen.session);
   if(profile.recovery?.email!==verified.email)throw invalid();
   await update(store,familyPath(chosen.session.familyId),f=>{const p=profileIn(f,chosen.session);if(p.recovery?.email!==verified.email)throw invalid();p.emailLogin=true;f.onboarding??={events:{},batches:{},notifyFirst:true};return {value:f};});
   return {session:chosen.session};
  },
  async students(session,{id,names}){
   ready();if(!validAttempt(id)||!Array.isArray(names)||names.length<1||names.length>6||names.some(n=>typeof n!=='string'||!n.trim()||n.trim().length>32||/[\u0000-\u001f\u007f]/.test(n)))throw new HttpError(400,'Enter one to six student nicknames, each on one line and up to 32 characters.');
   names=names.map(n=>n.trim());const {family,profile}=await current(store,session);
   if(profile.role!=='parent'||!profile.recovery)throw new HttpError(403,'Sign in with your verified parent email first.');
   const inputHash=hashCode(JSON.stringify(names)),batch=family.onboarding?.batches?.[id];
   if(batch){if(batch.inputHash!==inputHash)throw new HttpError(409,'This student request changed. Start a new batch.');return readCards(family,id,batch);}
   const cards=names.map((name,i)=>({name,id:hmac(password,session.familyId+':student:'+id+':'+i),code:tokenCode(password,session.familyId+':code:'+id+':'+i)}));
   for(const card of cards)await update(store,`invites/${hashCode(card.code)}.json`,old=>({value:old??{familyId:session.familyId,profileId:card.id,epoch:1}}));
   const event=newEvent(family,id,'setup',{subject:'Your RoboLab student logins',text:`Your students are ready to learn. Keep these private:\n\n${cards.map(c=>`${c.name}\nStudent code: ${c.code}\nStart learning: ${appOrigin}/#student-login=${c.code}`).join('\n\n')}\n\nParent dashboard: ${appOrigin}/\nStudents use their own code; no email or password is needed. Their progress stays with their profile.`,cards},cards.map(c=>({id:c.id,hash:hashCode(c.code)})));
   // Publish before committing so a crash after the family write cannot lose
   // the mail intent. A consumer that arrives early retries the missing event.
   const queued=await publish(session.familyId,id);
   await update(store,familyPath(session.familyId),f=>{
    const p=profileIn(f,session);if(p.role!=='parent'||p.recovery?.index!==event.emailIndex)throw new HttpError(403,'Parent email changed. Sign in again.');
    f.onboarding??={events:{},batches:{},notifyFirst:true};scrub(f);
    const old=f.onboarding.batches[id];if(old){if(old.inputHash!==inputHash)throw new HttpError(409,'This request changed.');return {value:f};}
    if(f.profiles.filter(p=>p.active&&p.role==='student').length+cards.length>6||f.profiles.length+cards.length>25)throw new HttpError(400,'This family supports six active students. Remove an extra nickname and try again.','batch-uncommitted');
    for(const c of cards)f.profiles.push({id:c.id,name:c.name,role:'student',epoch:1,accessHash:hashCode(c.code),active:true,drafts:{},history:[],completed:[],experiments:0,onboardingStudent:true,firstSignedInAt:null});
    event.status=queued?'pending':'retry';f.onboarding.events[id]=event;f.onboarding.batches[id]={inputHash,until:event.until,cards:seal(password,'cards:'+id,cards)};return {value:f};
   });
   return {cards,eventId:id};
  },
  async replace(session,{id,studentId}){
   ready();if(!validAttempt(id)||typeof studentId!=='string')throw new HttpError(400,'Invalid replacement request.');
   const {family,profile}=await current(store,session);
   if(profile.role!=='parent'||!profile.recovery)throw new HttpError(403,'Sign in with your verified parent email first.');
   const inputHash=hashCode('replace:'+studentId),old=family.onboarding?.batches?.[id];
   if(old){if(old.inputHash!==inputHash)throw new HttpError(409,'This replacement request changed.');return readCards(family,id,old);}
   const student=family.profiles.find(p=>p.id===studentId&&p.role==='student'&&p.active);
   if(!student)throw new HttpError(404,'Active student not found.');
   const epoch=student.epoch+1,code=tokenCode(password,session.familyId+':replacement:'+id),cards=[{id:studentId,name:student.name,code}];
   await update(store,`invites/${hashCode(code)}.json`,r=>({value:r??{familyId:session.familyId,profileId:studentId,epoch}}));
   const event=newEvent(family,id,'setup',{subject:'Your RoboLab replacement student login',text:`New login for ${student.name}\n\nStudent code: ${code}\nStart learning: ${appOrigin}/#student-login=${code}\n\nThe previous code and sessions no longer work. Saved code and progress are kept.\nParent dashboard: ${appOrigin}/`},[{id:studentId,hash:hashCode(code)}]);
   const queued=await publish(session.familyId,id);
   await update(store,familyPath(session.familyId),f=>{
    const p=profileIn(f,session);if(p.role!=='parent'||p.recovery?.index!==event.emailIndex)throw new HttpError(403,'Parent email changed. Sign in again.');
    f.onboarding??={events:{},batches:{},notifyFirst:true};scrub(f);
    if(f.onboarding.batches[id])return {value:f};
    const next=f.profiles.find(p=>p.id===studentId&&p.active);
    if(!next||next.epoch!==student.epoch||next.accessHash!==student.accessHash)throw new HttpError(409,'Student access changed. Refresh before replacing the code.');
    next.epoch=epoch;next.accessHash=hashCode(code);
    event.status=queued?'pending':'retry';f.onboarding.events[id]=event;f.onboarding.batches[id]={inputHash,until:event.until,cards:seal(password,'cards:'+id,cards)};
    return {value:f};
   });return {cards,eventId:id};
  },
  async studentSignedIn(session){
   const {family,profile}=await current(store,session);
   if(profile.role!=='student'||!profile.onboardingStudent||profile.firstSignedInAt)return;
   const id='first-'+profile.id,parent=parentIn(family),notify=family.onboarding?.notifyFirst!==false&&!!parent?.recovery;
   const event=notify?newEvent(family,id,'first',{subject:`${profile.name} signed in to RoboLab`,text:`${profile.name} successfully signed in to RoboLab. Their account is ready.\n\nView family progress: ${appOrigin}/\n\nThis is a one-time setup confirmation. Future student sign-ins will not send an email. You can turn off first-sign-in confirmations in Family & progress.`},[{id:profile.id,hash:profile.accessHash}]):null;
   const queued=event?await publish(session.familyId,id):false;
   await update(store,familyPath(session.familyId),f=>{const p=profileIn(f,session);if(p.firstSignedInAt)return {value:f};p.firstSignedInAt=new Date(now()).toISOString();if(event){f.onboarding??={events:{},batches:{},notifyFirst:true};event.status=queued?'pending':'retry';f.onboarding.events[id]=event;}return {value:f};});
  },
  async preferences(session,{notifyFirst,notifyWeekly}){
   if(notifyFirst===undefined&&notifyWeekly===undefined||notifyFirst!==undefined&&typeof notifyFirst!=='boolean'||notifyWeekly!==undefined&&typeof notifyWeekly!=='boolean')throw new HttpError(400,'Choose a valid email preference.');
   await update(store,familyPath(session.familyId),f=>{if(profileIn(f,session).role!=='parent')throw new HttpError(403,'Only parents manage notifications.');f.onboarding??={events:{},batches:{},notifyFirst:true};if(notifyFirst!==undefined)f.onboarding.notifyFirst=notifyFirst;
    if(notifyWeekly!==undefined){if(notifyWeekly&&!f.onboarding.notifyWeekly)f.onboarding.weeklySince=now();f.onboarding.notifyWeekly=notifyWeekly;}
    return {value:f};});return {ok:true};
  },
  async weekly(familyId,week){
   if(!weeklyEnabled)return {queued:false};
   const start=Date.parse(week+'T00:00:00Z'),end=start+7*86400000;
   if(!Number.isFinite(start)||weekStart(start)!==week||end>now()||now()-end>=7*86400000)throw new Error('Invalid summary week');
   const path=familyPath(familyId);
   const id=await update(store,path,f=>{
    if(!f)return {value:f,result:null};scrub(f);const parent=parentIn(f),settings=f.onboarding;
    if(!settings?.notifyWeekly||!parent?.recovery||!settings.weeklySince||settings.weeklySince>=end)return {value:f,result:null};
    const eventId='weekly-'+week+'-'+parent.recovery.index.split('/').at(-1).slice(0,32),old=settings.events?.[eventId];
    if(old)return {value:f,result:['pending','retry'].includes(old.status)&&old.until>now()?eventId:null};
    const students=f.profiles.filter(p=>p.active&&p.role==='student'),active=students.filter(p=>(p.activity?.[week]??0)>0||Object.values(p.missionCompleted??{}).some(at=>Date.parse(at)>=start&&Date.parse(at)<end));
    if(!active.length)return {value:f,result:null};
    const rows=active.map(p=>{
     const name=p.name.replace(/[\r\n]/g,' '),runs=p.activity?.[week]??0;
     const newly=Object.entries(p.missionCompleted??{}).filter(([,at])=>Date.parse(at)>=start&&Date.parse(at)<end).map(([lesson])=>'Mission '+Number(lesson.slice(1)));
     const progress=newly.length?`${name} completed ${new Intl.ListFormat('en-US',{style:'long',type:'conjunction'}).format(newly)}.`:`${name} kept practicing.`;
     return `${name} ran code ${runs} ${runs===1?'time':'times'} this week.\n${progress}\n\nAsk ${name}:\n"What did you change in your code? What did the robot do?"`;
    });
    const dates=new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).formatRange(start,end-1);
    const text=`RoboLab family progress\n${dates}\n\n${rows.join('\n\n')}\n\nSee each child's current mission and next challenge in your parent dashboard:\n${appOrigin}/\n\nRoboLab saves progress automatically when your child passes a challenge. A mission is complete when all three challenges are passed. Ask your child to explain how their code helped the robot.\n\nYou can turn weekly emails on or off in your parent dashboard. We only send a summary for weeks when your family is active.\n\nFor questions or feedback, email robolab@vibecodingdad.com.\n\nRoboLab team`;
    const event=newEvent(f,eventId,'weekly',{subject:'Your RoboLab weekly family summary',text},active.map(p=>({id:p.id})));
    settings.events??={};settings.events[eventId]=event;
    // Receipt metadata stays for eight weeks; sensitive mail payload expires in 23h.
    for(const [key,e] of Object.entries(settings.events))if(e.kind==='weekly'&&e.created<now()-56*86400000)delete settings.events[key];
    return {value:f,result:eventId};
   });
   if(id&&!await publish(familyId,id))throw new Error('Weekly summary is waiting for the queue');
   return {queued:!!id};
  },
  retry,
  async cleanupExpired(session,family){
   const expired=Object.values(family.onboarding?.events??{}).some(e=>e.payload&&e.until<=now())||Object.values(family.onboarding?.batches??{}).some(b=>b.cards&&b.until<=now());
   if(!expired)return family;
   return update(store,familyPath(session.familyId),f=>{profileIn(f,session);scrub(f);return {value:f,result:f};});
  },
  async deliver({familyId,eventId,cleanup=false,authPath:cleanupPath}){
   if(cleanupPath){
    if(!/^parent-auth\/[a-f0-9]{64}\.json$/.test(cleanupPath))throw new Error('Invalid cleanup request');
    await update(store,cleanupPath,r=>{if(!r)return {value:r};if(r.until>now())throw new Error('Cleanup arrived early');return {value:{until:r.until,expired:true}};});return;
   }
   if(typeof familyId!=='string'||!/^[-a-f0-9]{36,64}$/.test(familyId)||typeof eventId!=='string'||!/^[-a-z0-9]{1,80}$/.test(eventId))throw new Error('Invalid mail event');
   const path=familyPath(familyId),lease=randomBytes(16).toString('hex');
   const event=await update(store,path,f=>{
    if(!f?.onboarding?.events?.[eventId])throw new Error('Mail intent not committed yet');
    scrub(f);const e=f.onboarding.events[eventId];
    if(cleanup||['sent','cancelled','expired'].includes(e.status))return {value:f,result:null};
    if(e.leaseUntil>now())throw new Error('Mail is already being delivered');
    const p=parentIn(f),valid=p?.id===e.parentId&&p.recovery?.index===e.emailIndex&&e.profiles.every(binding=>f.profiles.some(s=>s.id===binding.id&&s.active&&(!binding.hash||s.accessHash===binding.hash)));
    if(!valid||e.kind==='first'&&f.onboarding.notifyFirst===false||e.kind==='weekly'&&(!weeklyEnabled||f.onboarding.notifyWeekly!==true)){e.status='cancelled';delete e.payload;return {value:f,result:null};}
    e.status='sending';e.lease=lease;e.leaseUntil=now()+30000;return {value:f,result:e};
   });
   if(!event)return;
   try{
    if(enqueue&&!await publish(familyId,eventId,true,Math.max(1,Math.ceil((event.until-now())/1000))))throw new Error('Cleanup queue unavailable');
    const payload=open(password,eventId,event.payload);
    await emailAllowance(store,password,{email:payload.to,id:familyId+':'+eventId,kind:event.kind,now:now()});
    const latest=(await store.read(path))?.value,recipient=parentIn(latest);
    if(!recipient||recipient.id!==event.parentId||recipient.recovery?.index!==event.emailIndex||event.kind==='weekly'&&(!weeklyEnabled||latest.onboarding?.notifyWeekly!==true)||event.kind==='first'&&latest.onboarding?.notifyFirst===false||!event.profiles.every(binding=>latest.profiles.some(p=>p.id===binding.id&&p.active&&(!binding.hash||p.accessHash===binding.hash)))){
     await update(store,path,f=>{const e=f.onboarding.events[eventId];if(e.lease===lease){e.status='cancelled';delete e.payload;delete e.lease;delete e.leaseUntil;}return {value:f};});return;
    }
    const sent=await mail.send({to:payload.to,subject:payload.subject,text:payload.text,id:'onboarding-'+familyId+'-'+eventId});
    await update(store,path,f=>{const e=f.onboarding.events[eventId];if(e.lease===lease){e.status='sent';e.providerId=sent.id;delete e.payload;delete e.lease;delete e.leaseUntil;}return {value:f};});

   }catch{
    await update(store,path,f=>{const e=f.onboarding.events[eventId];if(e.lease===lease){e.status='retry';delete e.lease;delete e.leaseUntil;}return {value:f};});
    throw new Error('Onboarding email awaiting retry');
   }
  }
 };
}

export function onboardingView(family,profile){
 if(profile.role!=='parent')return {};
 const o=family.onboarding;return {emailLogin:!!profile.emailLogin,notifyWeekly:o?.notifyWeekly===true,weeklyDeliveryReady:process.env.WEEKLY_SUMMARY_ENABLED==='1',notifyFirst:o?.notifyFirst!==false,onboardingMail:Object.values(o?.events??{}).slice(-12).map(e=>({id:e.id,kind:e.kind,status:e.until<=Date.now()&&!['sent','cancelled'].includes(e.status)?'expired':e.status})),studentSignIns:Object.fromEntries(family.profiles.filter(p=>p.role==='student').map(p=>[p.id,p.onboardingStudent?(p.firstSignedInAt?'ready':'waiting'):'existing']))};
}
