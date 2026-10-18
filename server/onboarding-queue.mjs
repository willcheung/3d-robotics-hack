import {createHash} from 'node:crypto';
import {QueueClient} from '@vercel/queue';
import {BlobStore} from './family-store.mjs';
import {resendMailer} from './recovery.mjs';
import {onboardingService} from './onboarding.mjs';

export const ONBOARDING_TOPIC='robolab-onboarding-v1';
const queue=new QueueClient({region:'iad1'});
export async function enqueueOnboarding(message,{delaySeconds=0}={}){
 return queue.send(ONBOARDING_TOPIC,message,{retentionSeconds:86400,delaySeconds,idempotencyKey:`${process.env.VERCEL_DEPLOYMENT_ID??'local'}:${message.weeklyScan?`weekly-scan:${message.weeklyScan.week}:${createHash('sha256').update(message.weeklyScan.cursor).digest('hex')}`:message.authPath??`${message.familyId}:${message.eventId}:${message.cleanup?'cleanup':'send'}`}`});
}
// This function is private to the queue platform; it is not routed by the app.
export default queue.handleNodeCallback(async message=>{
 const service=onboardingService({store:new BlobStore(),password:process.env.SESSION_PASSWORD,appOrigin:process.env.APP_ORIGIN,mail:resendMailer(),enqueue:enqueueOnboarding});
 if(message.weeklyScan){if(process.env.WEEKLY_SUMMARY_ENABLED!=='1')return;const {scanWeekly}=await import('./weekly-summary.mjs');await scanWeekly({store:new BlobStore(),service,enqueue:enqueueOnboarding,...message.weeklyScan});}else await service.deliver(message);
 console.info('Onboarding queue delivery completed',{kind:message.authPath?'auth-expiry':message.cleanup?'mail-expiry':'mail'});
},{retry:(_error,metadata)=>({afterSeconds:Math.min(300,10*2**Math.min(metadata.deliveryCount,5))})});
