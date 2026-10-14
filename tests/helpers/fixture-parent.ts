import {sealData} from 'iron-session';
import {login,update,familyPath,current} from '../../server/family-store.mjs';
import type {BrowserContext} from '@playwright/test';
// Only for a disposable family provisioned by the calling hosted test. This is
// a parent-session fixture, NOT evidence of parent email sign-in or delivery.
// Auth is covered by local inbox tests and a separately authorized real-inbox check.
export async function fixtureParent(context:BrowserContext,store:any,code:string,origin:string){
 const password=process.env.SESSION_PASSWORD;if(!password)throw Error('Fixture parent requires the configured session secret.');
 const session=await login(store,code);if((await current(store,session)).profile.role!=='parent')throw Error('Expected a disposable parent fixture.');
 await update(store,familyPath(session.familyId),(f:any)=>{f.profiles.find((p:any)=>p.id===session.profileId).emailLogin=true;return {value:f};});
 const value=await sealData(session,{password,ttl:3600});
 await context.addCookies([{name:origin.startsWith('https:')?'__Host-robolab':'robolab-local',value,url:origin,httpOnly:true,secure:origin.startsWith('https:'),sameSite:'Strict'}]);
 return session;
}
