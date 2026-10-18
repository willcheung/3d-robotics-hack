import {test,expect,type Page} from '@playwright/test';
import {parentEmail,addStudents,studentCode} from '../helpers/email-ui.ts';
import {getLesson} from '../../src/lessons.ts';
test.skip(!process.env.FAMILY_UI_MEMORY,'Disposable local accounts and isolated runtimes only.');
async function setup(page:Page,key:string){await page.request.post('/__test/newday');await parentEmail(page,`${key}@example.test`,true);const codes=await addStudents(page,['Recovery A','Recovery B']);await page.locator('#family-logout').click();await studentCode(page,codes[0]);await page.getByRole('button',{name:'Close family progress'}).click();return codes;}
async function state(page:Page){return (await page.request.get('/api/family')).json();}
const headers=(profile:string)=>({Origin:'http://127.0.0.1:4473','X-RoboLab-Profile':profile});

test('returning a draft after reload settles an older in-flight example save before fresh-device resume',async({page,browser})=>{
 const [code]=await setup(page,'reload-return');const source='# My draft must survive a late example save';await page.locator('#code').fill(source);await expect(page.locator('#save-help')).toContainText('Saved to your account');const before=await state(page);
 let first=true,release!:()=>void,started!:()=>void,delivered!:(status:number)=>void;const held=new Promise<void>(r=>release=r),ready=new Promise<void>(r=>started=r),late=new Promise<number>(r=>delivered=r);
 await page.route('**/api/family/draft',async route=>{
  if(!first){await route.continue();return;}first=false;const data=route.request().postDataJSON();started();await held;
  // Model a request already on the wire when its page is destroyed. It still
  // reaches the real disposable API after the new page restores the draft.
  try{await route.abort();}catch{}
  delivered((await page.request.post('/api/family/draft',{headers:headers(before.profile.id),data})).status());
 });
 try{
  await page.locator('#restore').click();await page.locator('#restore').click();await ready;await page.reload();await page.locator('#return-draft').click();await expect(page.locator('#code')).toHaveValue(source);await expect(page.locator('#save-help')).toContainText('Saved to your account');
  release();expect(await late).toBe(409);expect((await state(page)).drafts.python.source).toBe(source);
  const fresh=await browser.newContext();try{const next=await fresh.newPage();await studentCode(next,code);await next.getByRole('button',{name:'Close family progress'}).click();await expect(next.locator('#code')).toHaveValue(source);}finally{await fresh.close();}
 }finally{release();}
});

test('an older local-only draft uploads without another edit and resumes on a fresh browser',async({page,browser})=>{
 const [code]=await setup(page,'older-draft');const profile=(await state(page)).profile.id;
 await page.evaluate(id=>localStorage.setItem(`robolab.profile.${id}.python`,'# older local work'),profile);await page.reload();
 await expect(page.locator('#code')).toHaveValue('# older local work');await expect.poll(async()=>(await state(page)).drafts.python?.source).toBe('# older local work');await expect(page.locator('#save-help')).toContainText('Saved to your account');
 const ctx=await browser.newContext();try{const next=await ctx.newPage();await studentCode(next,code);await next.getByRole('button',{name:'Close family progress'}).click();await expect(next.locator('#code')).toHaveValue('# older local work');}finally{await ctx.close();}
});

test('conflicts preserve both versions while allowing signout and sibling switching',async({page})=>{
 const codes=await setup(page,'conflicting-drafts');await page.locator('#code').fill('# saved baseline');await expect(page.locator('#save-help')).toContainText('Saved to your account');const before=await state(page);
 await page.request.post('/api/family/draft',{headers:headers(before.profile.id),data:{lesson:'L01',language:'python',target:'beacon',source:'# cloud edit',revision:before.drafts.python.revision}});
 await page.locator('#code').fill('# private local edit');await expect(page.locator('#resolve-conflict')).toBeVisible();await page.locator('#resolve-conflict').click();await expect(page.locator('#conflict-editor')).toHaveValue('# private local edit');await expect(page.locator('#conflict-cloud')).toHaveValue('# cloud edit');await page.locator('#conflict-cancel').click();
 await page.locator('#family-open').click();await page.locator('#family-logout').click();await expect(page.locator('#profile-label')).toHaveText('Guest practice');expect(await page.evaluate(id=>localStorage.getItem(`robolab.profile.${id}.python`),before.profile.id)).toBe('# private local edit');
 await studentCode(page,codes[1]);await page.getByRole('button',{name:'Close family progress'}).click();await expect(page.locator('#code')).not.toHaveValue('# private local edit');await expect(page.locator('#resolve-conflict')).toBeHidden();await page.locator('#family-open').click();await page.locator('#family-logout').click();
 await studentCode(page,codes[0]);await page.getByRole('button',{name:'Close family progress'}).click();await expect(page.locator('#code')).toHaveValue('# private local edit');await expect(page.locator('#resolve-conflict')).toBeVisible();expect((await state(page)).drafts.python.source).toBe('# cloud edit');await page.locator('#resolve-conflict').click();await page.locator('#conflict-load').click();await expect(page.locator('#code')).toHaveValue('# cloud edit');await page.locator('#return-draft').click();await expect(page.locator('#code')).toHaveValue('# private local edit');await expect(page.locator('#save-help')).toContainText('Saved to your account');
});

test('offline edits retry on reconnect; expired sessions clear private history and comparison UI',async({page,context})=>{
 await setup(page,'offline-history');await context.setOffline(true);await page.locator('#code').fill('# offline private edit');await expect(page.locator('#save-help')).toContainText('waiting to sync');await expect(page.locator('#retry-sync')).toBeVisible();await context.setOffline(false);await expect(page.locator('#save-help')).toContainText('Saved to your account');const before=await state(page);expect(before.drafts.python.source).toBe('# offline private edit');
 await page.request.post('/api/family/attempt',{headers:headers(before.profile.id),data:{id:crypto.randomUUID(),source:'# private historic source',language:'python',target:'beacon',outcome:'missed',seconds:1}});await page.locator('#family-open').click();await page.locator('#family-refresh').click();await page.getByRole('button',{name:'Close family progress'}).click();await page.locator('#history-open').click();await expect(page.locator('#run-history')).toContainText('# private historic source');
 await page.route('**/api/family',route=>route.fulfill({status:401,json:{error:'Your session expired. Sign in again.'}}));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.locator('#profile-label')).toHaveText('Guest practice');await expect(page.locator('#run-history')).not.toBeVisible();await expect(page.locator('#run-history')).not.toContainText('# private historic source');await expect(page.locator('[data-draft-comparison]')).toHaveCount(0);await page.locator('#history-open').click();await expect(page.locator('#run-history')).not.toContainText('# private historic source');
});

test('quota pending is honest and retryable; successful repeat runs do not claim pending confirmation',async({page})=>{
 test.setTimeout(60000);await setup(page,'quota-retry');const requests:any[]=[];let limited=true;
 await page.route('**/api/family/verify',async route=>{requests.push(route.request().postDataJSON());if(limited)await route.fulfill({status:429,json:{error:'Daily check limit reached. Try later.'}});else await route.continue();});
 await page.locator('#code').fill(getLesson('L01').reference.python);await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('FINISHED');await expect(page.locator('#progress-sync')).toContainText('Daily check limit');await expect(page.locator('#practice-badges .earned')).toHaveCount(0);await expect(page.locator('#practice-badges .pending')).toHaveCount(1);await expect(page.locator('#run')).toBeEnabled();limited=false;await page.locator('#retry-sync').click();await expect.poll(async()=>(await state(page)).completed,{timeout:60000}).toContain('beacon');expect(requests[1].id).toBe(requests[0].id);await expect(page.locator('#stop-check')).toBeHidden();
 await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('FINISHED');await expect.poll(async()=>(await state(page)).history.length).toBe(2);await expect(page.locator('#retry-sync')).toBeHidden();await page.locator('#history-open').click();await expect(page.locator('#run-history .experiment-list article').first()).toContainText('Practice passed · challenge already complete');await expect(page.locator('#run-history')).not.toContainText('waiting to sync');expect(requests).toHaveLength(2);expect((await state(page)).students[0].experiments).toBe(2);
});

for(const sameStudent of [false,true])test(`late conflict responses cannot mutate a ${sameStudent?'new session for the same':'different'} student`,async({page})=>{
 test.setTimeout(60000);const codes=await setup(page,`delayed-conflict-${sameStudent}`);await page.locator('#code').fill('# baseline');await expect(page.locator('#save-help')).toContainText('Saved to your account');const before=await state(page);
 await page.request.post('/api/family/draft',{headers:headers(before.profile.id),data:{lesson:'L01',language:'python',target:'beacon',source:'# other device',revision:before.drafts.python.revision}});
 await page.locator('#code').fill('# PRIVATE_A_DRAFT');await expect(page.locator('#resolve-conflict')).toBeVisible();
 let expire!:()=>void,attemptStarted!:()=>void,release!:()=>void,saveStarted!:()=>void;const expired=new Promise<void>(r=>expire=r),attemptReady=new Promise<void>(r=>attemptStarted=r),held=new Promise<void>(r=>release=r),saveReady=new Promise<void>(r=>saveStarted=r);
 await page.route('**/api/family/attempt',async route=>{attemptStarted();await expired;await route.fulfill({status:401,json:{error:'Session expired. Sign in again.'}});});
 await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('FINISHED');await attemptReady;await page.locator('#resolve-conflict').click();
 let delay=true;await page.route('**/api/family/draft',async route=>{if(delay){delay=false;const response=await route.fetch();saveStarted();await held;await route.fulfill({response});}else await route.continue();});
 try{await page.locator('#conflict-save').click();await saveReady;expire();await expect(page.locator('#profile-label')).toHaveText('Guest practice');await page.unroute('**/api/family/attempt');
  await page.locator('#student-signin-open').click();await page.locator('#access-code').fill(codes[sameStudent?0:1]);await page.locator('#family-login button').click();await expect(page.locator('#profile-label')).toContainText(sameStudent?'Recovery A':'Recovery B');await page.getByRole('button',{name:'Close family progress'}).click();await page.locator('#code').fill('# next session work');await expect(page.locator('#save-help')).toContainText('Saved to your account');const next=await state(page),key=`robolab.profile.${next.profile.id}.python.synced`,baseline=await page.evaluate(k=>localStorage.getItem(k),key);
  release();await expect.poll(()=>page.evaluate(k=>localStorage.getItem(k),key)).toBe(baseline);await page.locator('#code').fill('# another next session edit');await expect(page.locator('#save-help')).toContainText('Saved to your account');await expect(page.locator('#resolve-conflict')).toBeHidden();expect((await state(page)).drafts.python.source).toBe('# another next session edit');
 }finally{expire();release();}
});
