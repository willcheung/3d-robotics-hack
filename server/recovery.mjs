import {createHmac} from 'node:crypto';
import {HttpError,hashCode,newCode,update,current,profileIn,familyPath,login} from './family-store.mjs';
const TTL=15*60*1000;
const invalid=()=>new HttpError(400,'This link is invalid, expired or already used. Request a new email.');
const tokenParts=token=>{if(typeof token!=='string'||!/^([a-f0-9-]{36}|[a-f0-9]{64})\.[A-Za-z0-9_-]{32}$/.test(token))throw invalid();return token.split('.');};
export function normalizeEmail(value){
 if(typeof value!=='string')throw new HttpError(400,'Enter a valid parent email address.');
 const email=value.trim().toLowerCase();
 if(email.length>254||! /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,63}$/.test(email)||email.includes('..'))throw new HttpError(400,'Enter a valid parent email address.');
 return email;
}
export const recoveryIndex=(email,password)=>'recovery-index/'+createHmac('sha256',password).update('email:'+email).digest('hex')+'.json';
export const EMAIL_LIMIT_PATH='limits/recovery-email-v1.json';
// Shared CAS quotas bound both email expense and anonymous index probing. No raw
// email or IP is written to the quota document. Unknown addresses count equally.
async function allowance(store,email,password,ip,now){
 const digest=v=>createHmac('sha256',password).update(v).digest('hex');
 return update(store,EMAIL_LIMIT_PATH,old=>{
  const day=new Date(now).toISOString().slice(0,10),q=old?.day===day?old:{day,count:0,emails:{},ips:{}};
  const e=digest('email:'+email),i=digest('ip:'+ip),entry=q.emails[e]??{count:0,at:0};
  if(q.count>=60||entry.count>=5||now-entry.at<60000||(q.ips[i]??0)>=20)throw new HttpError(429,'Please wait before requesting another email. Daily limits reset tomorrow.');
  q.count++;q.emails[e]={count:entry.count+1,at:now};q.ips[i]=(q.ips[i]??0)+1;return {value:q};
 });
}
export function recoveryService({store,password,appOrigin,mail,now=()=>Date.now()}){
 const ready=()=>{if(!mail?.enabled)throw new HttpError(503,'Email recovery is not configured yet. Keep your parent code safe.');};
 const send=async(email,purpose,links)=>mail.send({to:email,subject:purpose==='verify'?'Verify your RoboLab recovery email':'Recover your RoboLab family',text:purpose==='verify'?`You requested recovery email setup for RoboLab. Open this link while signed in as the parent, then choose Verify email:\n\n${links[0]}\n\nThis link expires in 15 minutes. It does not sign you in or change your code. If you did not request this, ignore this email.`:`You requested a new parent access code for RoboLab. Open the link for your family, then choose Create replacement parent code:\n\n${links.map((link,i)=>`Family ${i+1}: ${link}`).join('\n\n')}\n\nLinks expire in 15 minutes. Your students and saved progress will be kept. The previous parent code and parent sessions will stop working only after you confirm. If you did not request this, ignore this email.`,id:newCode()});
 return {
  enabled:!!mail?.enabled,
  async begin(session,data,ip='unknown'){
   ready();const {profile}=await current(store,session);if(profile.role!=='parent')throw new HttpError(403,'Only parents can set recovery email.');
   const auth=await login(store,data.code);if(auth.familyId!==session.familyId||auth.profileId!==session.profileId)throw new HttpError(403,'Enter this family’s current parent code.');
   const email=normalizeEmail(data.email),time=now();await allowance(store,email,password,ip,time);
   const nonce=newCode(),token=session.familyId+'.'+nonce;
   await update(store,familyPath(session.familyId),f=>{const p=profileIn(f,session);p.emailPending={email,hash:hashCode(token),until:time+TTL,epoch:p.epoch};return {value:f};});
   await send(email,'verify',[appOrigin+'/#verify-email='+token]);return {ok:true};
  },
  async verify(session,token){
   ready();const [familyId]=tokenParts(token);if(familyId!==session.familyId)throw invalid();
   const {profile}=await current(store,session),pending=profile.emailPending;
   if(profile.role!=='parent'||!pending||pending.hash!==hashCode(token)||pending.until<=now()||pending.epoch!==profile.epoch)throw invalid();
   const index=recoveryIndex(pending.email,password);
   // A stale index entry cannot recover anything: forgot rechecks the family's
   // verified address. Writing the index first makes a failed family CAS retryable.
   await update(store,index,old=>{const refs=old?.families??[];if(!refs.includes(familyId)){if(refs.length>=20)throw new HttpError(400,'This address has reached its family limit.');refs.push(familyId);}return {value:{families:refs}};});
   await update(store,familyPath(familyId),f=>{const p=profileIn(f,session),r=p.emailPending;if(p.role!=='parent'||!r||r.hash!==hashCode(token)||r.until<=now()||r.epoch!==p.epoch)throw invalid();p.recovery={email:r.email,index,verifiedAt:new Date(now()).toISOString()};delete p.emailPending;delete p.resetPending;delete p.recovered;return {value:f};});
   return {ok:true};
  },
  async forgot(data,ip='unknown'){
   ready();const email=normalizeEmail(data.email),time=now();await allowance(store,email,password,ip,time);
   const index=recoveryIndex(email,password),refs=(await store.read(index))?.value.families??[],links=[];
   for(const familyId of refs){
    const token=familyId+'.'+newCode();
    const row=await store.read(familyPath(familyId));if(!row?.value.profiles.some(p=>p.role==='parent'&&p.active&&p.recovery?.index===index))continue;
    const allowed=await update(store,familyPath(familyId),f=>{const p=f?.profiles.find(p=>p.role==='parent'&&p.active&&p.recovery?.index===index);if(!p)return {value:f,result:false};p.resetPending={hash:hashCode(token),until:time+TTL,epoch:p.epoch,index};return {value:f,result:true};});
    if(allowed)links.push(appOrigin+'/#recover-family='+token);
   }
   // Delivery failures must not reveal whether this address has a family.
   // The same neutral receipt allows another request after the cooldown.
   if(links.length)try{await send(email,'recover',links);}catch{/* No account or token details in public errors/logs. */}
   return {ok:true,message:'If that email is verified for a family, a recovery link is on its way. Check your inbox and spam folder. Students should ask their parent for a replacement student code.'};
  },
  async recover(data){
   ready();const [familyId]=tokenParts(data.token);
   if(typeof data.key!=='string'||!/^[A-Za-z0-9_-]{32}$/.test(data.key))throw invalid();
   const tokenHash=hashCode(data.token),keyHash=hashCode(data.key),time=now();
   // Each competing recovery gets a distinct opaque session epoch, so an
   // abandoned invite stays invalid even with an older epoch-only reader.
   const recoveryEpoch=hashCode('recovery-epoch:'+data.token+':'+data.key);
   const code=createHmac('sha256',password).update('recovered:'+data.token+':'+data.key).digest('base64url').slice(0,32),codeHash=hashCode(code);
   const validate=p=>{
    if(!p?.active||p.role!=='parent')throw invalid();
    if(p.recovered?.hash===tokenHash&&p.recovered.keyHash===keyHash&&p.recovered.until>time&&p.recovered.epoch===p.epoch&&p.accessHash===codeHash)return p.epoch;
    const r=p.resetPending;if(!r||r.hash!==tokenHash||r.until<=time||r.epoch!==p.epoch||r.index!==p.recovery?.index)throw invalid();return recoveryEpoch;
   };
   const row=await store.read(familyPath(familyId)),parent=row?.value.profiles.find(p=>p.role==='parent'),epoch=validate(parent);
   const session={familyId,profileId:parent.id,epoch};
   await update(store,`invites/${codeHash}.json`,old=>({value:old??session}));
   await update(store,familyPath(familyId),f=>{const p=f?.profiles.find(p=>p.id===parent.id),next=validate(p);if(next!==epoch)throw invalid();if(p.epoch!==epoch){p.epoch=epoch;p.accessHash=codeHash;p.recovered={hash:tokenHash,keyHash,until:time+TTL,epoch};delete p.resetPending;delete p.emailPending;}return {value:f};});
   await login(store,code);return {code,session};
  }
 };
}
// Only server-side configuration enters this adapter. Messages and provider
// responses are never logged; raw tokens belong only in the recipient's email.
export function resendMailer({key=process.env.RESEND_API_KEY,from=process.env.RECOVERY_EMAIL_FROM,fetcher=fetch}={}){
 return {enabled:!!key&&!!from,async send({to,subject,text,id}){
  const response=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':'robolab-recovery/'+id},body:JSON.stringify({from,to:[to],subject,text}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new HttpError(503,'Email could not be sent. Wait a minute and try again. Your existing access code still works.');
  const result=await response.json();if(!result.id)throw new HttpError(503,'Email delivery could not be confirmed. Please try again shortly.');return {id:result.id};
 }};
}
