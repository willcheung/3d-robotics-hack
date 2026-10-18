import {timingSafeEqual} from 'node:crypto';
import {BlobStore,weekStart} from './family-store.mjs';
import {onboardingService} from './onboarding.mjs';
import {resendMailer} from './recovery.mjs';
import {enqueueOnboarding} from './onboarding-queue.mjs';
export async function scanWeekly({store,service,enqueue,week,cursor}){
 const page=await store.listFamilies(cursor);
 for(const path of page.paths){const match=path.match(/^families\/([-a-f0-9]{36,64})\.json$/);if(match)await service.weekly(match[1],week);}
 if(page.cursor)await enqueue({weeklyScan:{week,cursor:page.cursor}});
 return {families:page.paths.length,continued:!!page.cursor};
}
export function weeklyHandler({store=new BlobStore(),enqueue=enqueueOnboarding,secret=process.env.CRON_SECRET,enabled=process.env.WEEKLY_SUMMARY_ENABLED==='1',now=()=>Date.now(),service=onboardingService({store,password:process.env.SESSION_PASSWORD,appOrigin:process.env.APP_ORIGIN,mail:resendMailer(),enqueue,now})}={}){
 return async(req,res)=>{
  const respond=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
  const wanted=Buffer.from('Bearer '+(secret??'')),provided=Buffer.from(req.headers.authorization??'');
  if(!enabled||!secret||secret.length<32)return respond(503,{error:'Weekly delivery is not enabled.'});
  if(req.method!=='GET'||wanted.length!==provided.length||!timingSafeEqual(wanted,provided))return respond(403,{error:'Forbidden.'});
  // One daily trigger recovers missed queue publication without repeating a week.
  const week=weekStart(Date.parse(weekStart(now())+'T00:00:00Z')-86400000);
  try{await enqueue({weeklyScan:{week,cursor:''}});respond(200,{ok:true});}catch{respond(503,{error:'Summary dispatch will retry. Learning remains available.'});}
 };
}
export default weeklyHandler();
