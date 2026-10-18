import {test,expect} from '../workshop-fixture.ts';
import {getLesson} from '../../src/lessons.ts';
// These response-race fixtures test UI semantics. Family model tests verify that
// a finished cancellation receipt can represent reached, missed, or error.
for(const outcome of ['reached','missed','error'])test(`Stop after a finished ${outcome} check reports its state without inventing completion`,async({page})=>{
 let done=false,release!:()=>void,started!:()=>void;const held=new Promise<void>(r=>release=r),ready=new Promise<void>(r=>started=r);
 await page.route('**/api/family',route=>route.fulfill({json:{profile:{id:'workshop-fixture',name:'Test pilot',role:'student'},drafts:{},history:[],students:[],completed:done&&outcome==='reached'?['beacon']:[]}}));
 await page.route('**/api/family/verify',async route=>{done=true;started();await held;await route.fulfill({json:{outcome,completed:outcome==='reached'?['beacon']:[]}}).catch(()=>{});});
 await page.route('**/api/family/cancel',route=>route.fulfill({json:{completed:true}}));
 try{await page.locator('#code').fill(getLesson('L01').reference.python);await page.locator('#verify-cloud').click();await ready;await expect(page.locator('#stop-check')).toBeVisible();await page.locator('#stop-check').click();await expect(page.locator('#progress-sync')).toHaveText('The check already finished. Progress refreshed.');await expect(page.locator('#practice-badges .earned')).toHaveCount(outcome==='reached'?1:0);await expect(page.locator('#run')).toBeEnabled();}finally{release();}
});

for(const status of [401,409])test(`a ${status} session rejection retires the check and allows sign-in and a fresh check`,async({page})=>{
 let signedIn=true,checks=0;
 const snapshot=()=>({profile:{id:'workshop-fixture',name:'Test pilot',role:'student'},drafts:{},history:[],students:[],completed:[],checkRevision:0});
 await page.route('**/api/family',route=>route.fulfill(signedIn?{json:snapshot()}:{status:401,json:{error:'Sign in again.'}}));
 await page.route('**/api/family/login',route=>{signedIn=true;return route.fulfill({json:{ok:true}});});
 await page.route('**/api/family/verify',route=>{if(++checks===1){signedIn=false;return route.fulfill({status,json:{error:status===401?'Your session expired. Sign in again.':'The signed-in profile changed in another tab. Sign in again before saving or running.'}});}return route.fulfill({json:{outcome:'missed',completed:[]}});});
 await page.locator('#code').fill('# retained before expiry');await page.locator('#verify-cloud').click();await expect(page.locator('#profile-label')).toHaveText('Guest practice');await expect(page.locator('#stop-check')).toBeHidden();await expect(page.locator('#run')).toBeEnabled();await expect(page.locator('#progress-sync')).toContainText('Sign in again');
 await page.locator('#family-open').click();await page.locator('#student-signin-open').click();await page.locator('#access-code').fill('test-code');await page.locator('#family-login button').click();await expect(page.locator('#profile-label')).toContainText('Test pilot');await page.getByRole('button',{name:'Close family progress'}).click();await page.locator('#verify-cloud').click();await expect(page.locator('#progress-sync')).toContainText('Check counted');await expect(page.locator('#stop-check')).toBeHidden();expect(checks).toBe(2);
});

test('confirmed Stop refreshes the admission revision before the next check',async({page})=>{
 let revision=0,release!:()=>void,started!:()=>void,resume!:()=>void,refreshStarted!:()=>void;const held=new Promise<void>(r=>release=r),ready=new Promise<void>(r=>started=r),refreshHeld=new Promise<void>(r=>resume=r),refreshReady=new Promise<void>(r=>refreshStarted=r);const revisions:number[]=[];
 await page.route('**/api/family',async route=>{if(revision===1){refreshStarted();await refreshHeld;}await route.fulfill({json:{profile:{id:'workshop-fixture',name:'Test pilot',role:'student'},drafts:{},history:[],students:[],completed:[],checkRevision:revision}});});
 await page.route('**/api/family/verify',async route=>{revisions.push(route.request().postDataJSON().checkRevision);revision++;if(revisions.length===1){started();await held;}await route.fulfill({json:{outcome:'missed',completed:[]}}).catch(()=>{});});
 await page.route('**/api/family/cancel',route=>route.fulfill({json:{completed:false}}));
 try{await page.locator('#verify-cloud').click();await ready;await page.locator('#stop-check').click();await refreshReady;await expect(page.locator('#verify-cloud')).toBeDisabled();resume();await expect(page.locator('#stop-check')).toBeHidden();await expect(page.locator('#progress-sync')).toContainText('Check not counted');await page.locator('#verify-cloud').click();await expect(page.locator('#progress-sync')).toContainText('Check counted');expect(revisions).toEqual([0,1]);}finally{release();resume();}
});
