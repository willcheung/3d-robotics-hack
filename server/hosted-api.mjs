import {runValues} from '../src/run-values.ts';
import {getIronSession,sealData,unsealData} from 'iron-session';
import {appOrigins} from './app-origins.mjs';
import {resendMailer} from './recovery.mjs';
import {onboardingService,onboardingView} from './onboarding.mjs';
import {enqueueOnboarding} from './onboarding-queue.mjs';
import {randomUUID} from 'node:crypto';
import {BlobStore,HttpError,current,view,profileIn,login,addStudent,studentAccess,saveDraft,reserveRun,releaseRun,recordAttempt,sourceInput,bindRun,cancelRun,reserveServiceRun,releaseServiceRun} from './family-store.mjs';
import {SandboxRun,relayReply,stopSandbox} from './sandbox-run.mjs';
import {initialState,command,tick,reached,targets,missingPrerequisite,targetLesson} from '../src/model.ts';
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
async function body(req){let size=0;const parts=[];for await(const part of req){size+=part.length;if(size>70000)throw new HttpError(413,'Request too large.');parts.push(part);}try{const data=JSON.parse(Buffer.concat(parts).toString('utf8'));if(!data||typeof data!=='object'||Array.isArray(data))throw Error();return data;}catch{throw new HttpError(400,'Invalid request.');}}
export function hostedApi({store=new BlobStore(),Run=SandboxRun,appOrigin=process.env.APP_ORIGIN,password=process.env.SESSION_PASSWORD,mail=resendMailer(),alternateOrigin=process.env.APP_ALTERNATE_ORIGIN,recoveryOrigin=process.env.RECOVERY_ORIGIN,recoveryNow,enqueue=enqueueOnboarding}={}){
 const allowed=appOrigin?appOrigins(appOrigin,alternateOrigin):[];
 if(recoveryOrigin&&!allowed.includes(recoveryOrigin))throw Error('Recovery links must use a configured workshop origin.');
 const onboarding=onboardingService({store,password,appOrigin:recoveryOrigin??appOrigin,mail,now:recoveryNow,enqueue});
 return async function handle(req,res){
  const url=new URL(req.url,'http://local');
  const endpoint=url.searchParams.get('endpoint');
  const path=url.pathname==='/api'&&endpoint&&/^(family|java)(\/[a-z]+)?$/.test(endpoint)?`/api/${endpoint}`:url.pathname;
  if(!path.startsWith('/api/'))return false;
  try {
   if(!appOrigin||!password||password.length<32)throw new HttpError(503,'Family services are not configured. Python practice remains available.');
   if(req.method!=='GET'&&(req.method!=='POST'||!allowed.includes(req.headers.origin)||!req.headers['content-type']?.startsWith('application/json')))throw new HttpError(403,'Use this workshop to make changes.');
   const session=await getIronSession(req,res,{password,cookieName:appOrigin.startsWith('https:')?'__Host-robolab':'robolab-local',ttl:7*24*3600,cookieOptions:{secure:appOrigin.startsWith('https:'),httpOnly:true,sameSite:'strict',path:'/'}});
   const ip=req.headers['x-vercel-forwarded-for']?.split(',')[0]??req.socket?.remoteAddress??'unknown';
   if(['/api/family/authstart','/api/family/authverify','/api/family/authfinish'].includes(path)&&req.method==='POST'){
    let active;
    if(session.familyId){try{active=await current(store,session);if(!path.endsWith('authfinish'))throw new HttpError(409,'Sign out before using another parent email. Your saved work will be kept.');}catch(e){if(e.status!==401)throw e;}}
    const data=await body(req);
    if(data.parentCode!==undefined||data.parentSetupKey!==undefined||data.connect)throw new HttpError(410,'Parent-code setup is retired. Sign in with your parent email. Student logins and saved work are kept.');
    if(path.endsWith('authstart'))json(res,200,await onboarding.start(data,ip));
    else if(path.endsWith('authverify'))json(res,200,await onboarding.verify(data,ip));
    else {const result=await onboarding.finish(data,active?session:undefined);if(active&&(result.session.profileId!==session.profileId||result.session.familyId!==session.familyId))throw new HttpError(409,'Sign out before switching families.');Object.assign(session,result.session);await session.save();json(res,200,{ok:true});}
    return true;
   }
   if(['/api/family/create','/api/family/forgot','/api/family/recover','/api/family/email','/api/family/emailverify'].includes(path))throw new HttpError(410,'Parents now sign in by email. Use Parent sign in, then Continue with email. Your students and saved work are kept.');
   if(path==='/api/family/login'&&req.method==='POST'){
    const data=await body(req),entered=await login(store,data.code),{profile}=await current(store,entered);
    if(profile.role!=='student')throw new HttpError(403,'Parents sign in by email. Choose Parent, then Continue with email.');
    Object.assign(session,entered);await session.save();try{await onboarding.studentSignedIn(session);}catch{/* A durable login is usable even while notification storage/delivery is down. */}json(res,200,{ok:true});return true;
   }
   if(path==='/api/family/logout'&&req.method==='POST'){session.destroy();json(res,200,{ok:true});return true;}
   const {family,profile}=await current(store,session);
   const expected=req.headers['x-robolab-profile'];
   if(expected&&expected!==profile.id||req.method==='POST'&&expected!==profile.id)throw new HttpError(409,'The signed-in profile changed in another tab. Sign in again before saving or running.');
   if(path==='/api/family'&&req.method==='GET'){const clean=await onboarding.cleanupExpired(session,family),active=profileIn(clean,session);json(res,200,{...view(clean,active),...onboardingView(clean,active)});return true;}
   if(req.method!=='POST')throw new HttpError(405,'POST required.');
   const data=await body(req);
   if(path==='/api/family/studentreplace'){json(res,200,await onboarding.replace(session,data));return true;}
   if(path==='/api/family/studentbatch'){json(res,200,await onboarding.students(session,data));return true;}
   if(path==='/api/family/mailretry'){json(res,200,await onboarding.retry(session,data.id));return true;}
   if(path==='/api/family/notifications'){json(res,200,await onboarding.preferences(session,data));return true;}
   if(path==='/api/family/students'){json(res,200,await addStudent(store,session,data.name));return true;}
   if(path==='/api/family/access'){json(res,200,await studentAccess(store,session,data.id,data.revoke===true));return true;}
   if(path==='/api/family/draft'){json(res,200,await saveDraft(store,session,data));return true;}
   if(path==='/api/family/cancel'){const cancelled=await cancelRun(store,session,data.id,data.checkRevision);if(cancelled.name)await stopSandbox({name:cancelled.name});json(res,200,{completed:cancelled.completed,...(cancelled.stale?{stale:true}:{})});return true;}
   if(path==='/api/family/attempt'){json(res,200,await recordAttempt(store,session,data,false));return true;}
   if(path==='/api/java/reply'||path==='/api/java/stop'){
    if(typeof data.session!=='string'||data.session.length>4096)throw new HttpError(400,'Invalid run.');
    const c=await unsealData(data.session,{password,ttl:90});
    if(c.familyId!==session.familyId||c.profileId!==profile.id||c.epoch!==profile.epoch||!(c.expires>Date.now()))throw new HttpError(403,'That run is not yours or has expired.');
    if(path.endsWith('/stop'))await stopSandbox(c);
    else {if(!Number.isSafeInteger(data.id)||data.id<1||data.id>2000||!(data.value===null||typeof data.value==='number'&&Number.isFinite(data.value)))throw new HttpError(400,'Invalid reply.');await relayReply(c,data.id,data.value);}
    json(res,200,{ok:true});return true;
   }
   if(path==='/api/java/run'||path==='/api/family/verify'){
    const verify=path.endsWith('/verify');sourceInput({...data,language:verify?data.language:'java'});
    if(verify&&(typeof data.target!=='string'||!Object.hasOwn(targets,data.target)))throw new HttpError(400,'Unknown rescue target.');
    const missing=verify&&missingPrerequisite(targetLesson(data.target),profile.completed);
    if(missing)throw new HttpError(403,`Check all three Mission ${Number(missing.slice(1))} rescues to unlock checked Mission ${Number(targetLesson(data.target).slice(1))} progress. You can preview this mission until it unlocks.`);
    const id=verify?data.id:randomUUID(),receipt=await reserveRun(store,session,id,verify?data:undefined);if(receipt){json(res,200,receipt);return true;}
    let run,state=initialState(verify?data.target:'beacon'),outcome='error',error='',output='',done=false,terminal,released=false,serviceReserved=false;
    const release=async()=>{const results=await Promise.allSettled([releaseRun(store,session,id,verify?data.checkRevision+1:undefined),...(serviceReserved?[releaseServiceRun(store,session,id)]:[])]);const failed=results.find(r=>r.status==='rejected');if(failed)throw failed.reason;released=true;};
    try {
     await reserveServiceRun(store,session,id);serviceReserved=true;
     if(!verify){res.writeHead(200,{'Content-Type':'application/x-ndjson','Cache-Control':'no-store, no-transform','X-Content-Type-Options':'nosniff'});res.flushHeaders?.();}
     run=new Run(data.source,async message=>{
      if(verify){
       if(message.type==='command'){
        let value=null;
        try{if(message.command.op==='wait')for(let i=0;i<message.command.value;i++)state=tick(state);else {const next=command(state,message.command);state=next.state;value=next.value;}await run.reply(message.id,value);}catch(e){run.fail(e.message);}
       } else if(message.type==='output')output=(output+message.text).slice(0,4000);
       else if(message.type==='error')error=message.text;
       else if(message.type==='done'){done=true;outcome=reached(state,targets[data.target])?'reached':'missed';}
      } else if(message.type==='done'||message.type==='error')terminal=message;
      else if(!res.destroyed&&!res.write(JSON.stringify(message)+'\n'))run.stop();
     },e=>{if(e){error=e.message;outcome='error';done=false;}},{language:verify?data.language:'java',purpose:verify?'progress-check':'practice',onSession:async c=>{
      if(verify){if(!await bindRun(store,session,id,c.name,data.checkRevision+1))run.stop();}
      else {const handle=await sealData({...c,familyId:session.familyId,profileId:profile.id,epoch:profile.epoch,expires:Date.now()+90000},{password,ttl:90});if(!res.destroyed)res.write(JSON.stringify({type:'session',id:handle})+'\n');}
     }});
     res.once('close',()=>run.stop());
     await run.finished;
     if(!verify)await release();
     if(!verify&&terminal&&!res.destroyed)res.write(JSON.stringify(terminal)+'\n');
     if(verify&&!res.destroyed){
      if(!done&& !error)error='Check was interrupted. Your source is safe; try again.';
      const result={...data,outcome,seconds:state.ticks*.02,error,values:runValues(state),output};
      const saved=await recordAttempt(store,session,result,true,data.checkRevision+1);
      await release();
      json(res,200,{outcome,seconds:result.seconds,error,pointsEarned:saved.pointsEarned??0,completed:(await current(store,session)).profile.completed});
     }
    } finally {if(!released)await release();if(!verify&&res.headersSent&&!res.destroyed)res.end();}
    return true;
   }
   throw new HttpError(404,'Unknown family operation.');
  } catch(e){if(!res.headersSent)json(res,e.status??503,{error:e.status?e.message:'Family service unavailable. Your editor is safe; try again shortly.',...(e.status&&e.code?{code:e.code}:{})});else if(!res.destroyed)res.end();return true;}
 };
}
const deployedHandler=hostedApi();
export default async function handler(req,res){if(!await deployedHandler(req,res))json(res,404,{error:'Not found.'});}
