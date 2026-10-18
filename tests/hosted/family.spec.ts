import {openSignIn} from '../learning-ui.ts';
import {fixtureParent} from '../helpers/fixture-parent.ts';
import {test as baseTest,expect,type BrowserContext,type Page} from '@playwright/test';
import {BlobStore,provision,login,addStudent,hashCode} from '../../server/family-store.mjs';
import {del} from '@vercel/blob';
import {readFileSync} from 'node:fs';
const bypass=process.env.HOSTED_BYPASS_FILE?JSON.parse(readFileSync(process.env.HOSTED_BYPASS_FILE,'utf8')).bypassSecret:undefined;
const protectedHeaders:Record<string,string>=bypass?{'x-vercel-protection-bypass':bypass}:{};
async function protect(context:BrowserContext){if(bypass)await context.route(url=>url.origin===base,route=>route.continue({headers:{...route.request().headers(),...protectedHeaders}}));}
const test=baseTest.extend<{protection:void}>({protection:[async({context},use)=>{await protect(context);await use();},{auto:true}]});
const base=process.env.HOSTED_APP_ORIGIN||'http://127.0.0.1:4373';
const main=(n=100)=>`public class Main { public static void main(String[] args) throws Exception { Robot.servo(120); Robot.motor(.5); Robot.waitTicks(${n}); Robot.motor(0); } }`;
const python='from robot import motor, servo, wait\nawait servo(120)\nawait motor(.5)\nawait wait(100)\nawait motor(0)';
async function confirmedRun(page:Page){const target=await page.locator('#target').inputValue();await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('FINISHED',{timeout:60000});await page.locator('#verify-cloud').click();await expect.poll(async()=>(await (await page.request.get(base+'/api/family',{headers:protectedHeaders})).json()).completed,{timeout:80000}).toContain(target);await expect(page.locator('#stop-check')).toBeHidden();}
const paths=new Set<string>();
const store=new BlobStore();const write=store.write.bind(store);store.write=async(path:string,...args:unknown[])=>{paths.add(path);return write(path,...args);};
let parentCode:string,codeA:string,codeB:string;
async function signIn(context:BrowserContext,code:string){await protect(context);if(code===parentCode){await fixtureParent(context,store,code,base);return;}const r=await context.request.post(base+'/api/family/login',{headers:{Origin:base,...protectedHeaders},data:{code}});expect(r.status()).toBe(200);}
test.beforeAll(async()=>{const f=await provision(store);parentCode=f.code;const p=await login(store,parentCode);codeA=(await addStudent(store,p,'Nova')).code;codeB=(await addStudent(store,p,'Orion')).code;});
test.afterAll(async()=>{if(paths.size)await del([...paths]);});
test('family sign-in, curriculum availability, real hosted Java and saved cross-device drafts',async({browser,page})=>{
 await page.goto('/');await openSignIn(page,'student');await page.locator('#access-code').fill(codeA);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.locator('#profile-label')).toContainText('Nova');
 await page.getByRole('button',{name:'Close family progress'}).click();
 await page.locator('#language').selectOption('java');await page.locator('#code').fill(main());
 await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('FINISHED',{timeout:60000});await expect(page.locator('#feedback-title')).toContainText('Crew located');
 await expect(page.locator('#save-help')).toContainText('Saved to your account');
 const device=await browser.newContext();await signIn(device,codeA);const other=await device.newPage();await other.goto('/');await expect(other.locator('#profile-label')).toContainText('Nova');await other.locator('#language').selectOption('java');await expect(other.locator('#code')).toHaveValue(main());await device.close();
 await page.locator('#curriculum-open').click();await expect(page.locator('.curriculum-card')).toHaveCount(20);await expect(page.locator('.curriculum-state').filter({hasText:'Coming soon'})).toHaveCount(16);await expect(page.locator('#revisit-mission')).toBeVisible();
 await page.locator('#curriculum-dialog').screenshot({path:'test-results-hosted/curriculum-desktop.png'});
});
test('server-checked Python progress is shared; practice claims cannot unlock; second child stays separate',async({browser,page})=>{
 await signIn(page.context(),codeA);await page.goto('/');await expect(page.locator('#profile-label')).toContainText('Nova');await page.locator('#code').fill(python);
 await confirmedRun(page);
 const b=await browser.newContext();await signIn(b,codeB);const other=await b.newPage();await other.goto('/');await expect(other.locator('#profile-label')).toContainText('Orion');await other.locator('#family-open').click();
 await expect(other.locator('.arena-board tbody tr').filter({hasText:'Nova'})).toContainText('1/12 challenges');await expect(other.locator('.arena-you')).toContainText('0/12 challenges');await expect(other.locator('#family-content')).not.toContainText('from robot import');
 await other.locator('#family-dialog').screenshot({path:'test-results-hosted/family-results.png'});await b.close();
});
test('Java compiler error, infinite-loop Stop and recovery preserve editable source',async({page})=>{
 await signIn(page.context(),codeB);await page.goto('/');await expect(page.locator('#profile-label')).toContainText('Orion');await page.locator('#language').selectOption('java');
 await page.locator('#code').fill('public class Main { broken syntax }');await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('ERROR',{timeout:60000});await expect(page.locator('#console')).toContainText('Main.java');
 await page.locator('#code').fill(main().replace('Robot.servo(120); Robot.motor(.5); Robot.waitTicks(100); Robot.motor(0);','while(true) {}'));await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('RUNNING',{timeout:60000});await page.locator('#stop').click();await expect(page.locator('#status-pill')).toHaveText('STOPPED');
 await expect.poll(async()=>{const r=await page.request.get(base+'/api/family',{headers:protectedHeaders});return (await r.json()).runBusy;},{timeout:25000}).toBe(false);
 // Observe cleanup, then keep the real startup and execution budgets separate.
 await page.locator('#code').fill(main());
 await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('RUNNING',{timeout:45000});await expect(page.locator('#status-pill')).toHaveText('FINISHED',{timeout:25000});
});
test('Python works without sign-in; syntax colors, Stop and narrow curriculum remain usable',async({page})=>{
 await page.setViewportSize({width:390,height:850});await page.goto('/');await page.locator('#code').fill(python);await expect(page.locator('.hljs-keyword').first()).toBeVisible();await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('FINISHED',{timeout:60000});await expect(page.locator('#feedback-title')).toContainText('Crew located');
 await page.locator('#code').fill('while True:\n    pass');await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('RUNNING');await page.locator('#stop').click();await expect(page.locator('#status-pill')).toHaveText('STOPPED');
 await page.locator('#curriculum-open').click();await expect(page.locator('#curriculum-dialog')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.locator('#curriculum-dialog').screenshot({path:'test-results-hosted/curriculum-narrow.png'});
});
test('parent sees provisioned student aliases and revokes a signed-in child',async({browser,page})=>{
 const generated=(await addStudent(store,await login(store,parentCode),'Comet')).code;paths.add(`invites/${hashCode(generated)}.json`);
 await signIn(page.context(),parentCode);await page.goto('/');await expect(page.locator('#profile-label')).toContainText('Parent');await page.locator('#family-open').click();await expect(page.locator('.family-results')).toContainText('Comet');
 const child=await browser.newContext();await signIn(child,codeB);const other=await child.newPage();await other.goto('/');await expect(other.locator('#profile-label')).toContainText('Orion');
 await page.locator('.arena-admin>summary').click();await page.locator('.family-results article').filter({hasText:'Orion'}).getByText('Manage student login',{exact:true}).click();page.once('dialog',d=>d.accept());await page.locator('.family-results article').filter({hasText:'Orion'}).getByRole('button',{name:'Revoke access'}).click();await expect(page.locator('#family-message')).toContainText('revoked');
 await other.locator('#code').fill('# revoked account edit');await expect(other.locator('#profile-label')).toHaveText('Guest practice');await child.close();
});
test('conflicting devices compare versions and keep the chosen source',async({browser,page})=>{
 await signIn(page.context(),codeA);const second=await browser.newContext();await signIn(second,codeA);const other=await second.newPage();
 await page.goto('/');await other.goto('/');await expect(page.locator('#profile-label')).toContainText('Nova');await expect(other.locator('#profile-label')).toContainText('Nova');
 await page.locator('#code').fill('print("first device")');await expect(page.locator('#save-help')).toContainText('Saved to your account');
 await other.locator('#code').fill('print("second device")');await expect(other.locator('#resolve-conflict')).toBeVisible();await expect(other.locator('#code')).toHaveValue('print("second device")');
 await other.locator('#resolve-conflict').click();await expect(other.locator('#conflict-editor')).toHaveValue('print("second device")');await expect(other.locator('#conflict-cloud')).toHaveValue('print("first device")');await other.locator('#conflict-save').click();await expect(other.locator('#save-help')).toContainText('Saved to your account');
 await second.close();
});
test('all three checked rescues complete Mission 1 without unlocking unbuilt missions',async({page})=>{
 await signIn(page.context(),codeA);await page.goto('/');await expect(page.locator('#profile-label')).toContainText('Nova');
 for(const [target,source,language] of [['beacon',python,'python'],['farther',main(150),'java'],['reverse','from robot import motor, servo, wait\nawait servo(60)\nawait motor(-.5)\nawait wait(100)\nawait motor(0)','python']]){
  await page.locator('#language').selectOption(language);await page.locator('#target').selectOption(target);await page.locator('#code').fill(source);await confirmedRun(page);
 }
 await page.locator('#curriculum-open').click();await expect(page.locator('.curriculum-state').first()).toHaveText('✓ Mission 1 complete');await expect(page.locator('.curriculum-state').filter({hasText:'Coming soon'})).toHaveCount(16);
});
test('cancelling a server check does not record an unconfirmed completion',async({page})=>{
 await signIn(page.context(),codeA);const state=await (await page.request.get(base+'/api/family',{headers:protectedHeaders})).json(),id=crypto.randomUUID();
 const input={id,source:'while True:\n    pass # cancellation fixture',language:'python',target:'beacon'};
 const h={Origin:base,...protectedHeaders,'X-RoboLab-Profile':state.profile.id};const checking=page.request.post(base+'/api/family/verify',{headers:h,data:{...input,checkRevision:state.checkRevision},timeout:90000});
 await expect.poll(async()=>(await (await page.request.get(base+'/api/family',{headers:protectedHeaders})).json()).runBusy,{timeout:30000}).toBe(true);
 const cancelled=await page.request.post(base+'/api/family/cancel',{headers:h,data:{id,checkRevision:state.checkRevision+1}});expect(cancelled.ok()).toBe(true);expect((await cancelled.json()).stale).toBeUndefined();await checking;
 const after=await (await page.request.get(base+'/api/family',{headers:protectedHeaders})).json();expect(after.arena.missions.flatMap((m:any)=>m.challenges).find((c:any)=>c.target==='beacon').checks).toBe(state.arena.missions.flatMap((m:any)=>m.challenges).find((c:any)=>c.target==='beacon').checks);expect(after.history.some((a:{id:string;verified:boolean;outcome:string})=>a.id===id&&a.verified&&a.outcome==='reached')).toBe(false);
});
test('a sign-in change in another tab cannot save old student code to the new profile',async({page})=>{
 await signIn(page.context(),codeA);await page.goto('/');await expect(page.locator('#profile-label')).toContainText('Nova');await page.locator('#code').fill('print("belongs only to Nova")');
 const profile=await page.locator('html').getAttribute('data-profile');
 await signIn(page.context(),parentCode);await page.locator('#code').fill('print("belongs only to Nova") # after switch');await expect(page.locator('#profile-label')).toHaveText('Guest practice');await expect(page.locator('#code')).not.toHaveValue('print("belongs only to Nova")');
 expect(await page.evaluate(key=>localStorage.getItem(key),`robolab.profile.${profile}.python`)).toBe('print("belongs only to Nova") # after switch');
 const state=await (await page.request.get(base+'/api/family',{headers:protectedHeaders})).json();expect(state.profile.name).toBe('Parent');expect(JSON.stringify(state.drafts)).not.toContain('belongs only to Nova');
});

test('restoring Java history preserves unsaved drafts in both languages',async({page})=>{
 await signIn(page.context(),codeA);await page.goto('/');await expect(page.locator('#profile-label')).toContainText('Nova');
 await page.locator('#language').selectOption('java');await page.locator('#code').fill('// Java draft worth keeping');
 await page.locator('#language').selectOption('python');await page.locator('#code').fill('# Python draft worth keeping');
 await page.locator('#history-open').click();await page.locator('.experiment-list article').filter({hasText:'Java'}).first().getByRole('button',{name:'Restore this code'}).click();
 await expect(page.locator('#family-dialog')).not.toBeVisible();await expect(page.locator('#language')).toHaveValue('java');await expect(page.locator('#code')).toHaveValue(main(150));
 const state=await (await page.request.get(base+'/api/family',{headers:protectedHeaders})).json();
 await page.locator('#return-draft').click();await expect(page.locator('#code')).toHaveValue('// Java draft worth keeping');expect(state.drafts.python.source).toBe('# Python draft worth keeping');
 await expect(page.locator('#status-pill')).toHaveText('READY');
});
test('separate families cannot see or modify each other through the hosted API',async({browser,page})=>{
 const separate=await provision(store);await fixtureParent(page.context(),store,separate.code,base);await page.goto('/');await expect(page.locator('#profile-label')).toContainText('Parent');
 const a=await browser.newContext();await signIn(a,codeA);const own=await (await a.request.get(base+'/api/family',{headers:protectedHeaders})).json();
 const foreign=await (await page.request.get(base+'/api/family',{headers:protectedHeaders})).json();expect(foreign.students).toEqual([]);expect(foreign.history).toEqual([]);expect(foreign.drafts).toEqual({});
 const denied=await page.request.post(base+'/api/family/access',{headers:{Origin:base,...protectedHeaders,'X-RoboLab-Profile':foreign.profile.id},data:{id:own.profile.id,revoke:true}});expect(denied.status()).toBe(404);
 expect((await a.request.get(base+'/api/family',{headers:protectedHeaders})).status()).toBe(200);await a.close();
});
test('deployed security headers, worker isolation, camera and editor recovery',async({page})=>{
 await page.goto('/');await page.locator('#code').fill(python);await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('FINISHED',{timeout:60000});
 for(const name of ['Top view','Zoom in','Zoom out','Reset camera'])await page.getByRole('button',{name,exact:true}).click();
 await expect(page.locator('#pointer-value')).toHaveText('60.0°');await expect(page.locator('#scanner-value')).toHaveText('120.0°');
 await page.locator('#reset').click();await expect(page.locator('#pointer-value')).toHaveText('0.0°');await expect(page.locator('#code')).toHaveValue(python);
 await page.locator('#code').fill('while True:\n    pass');await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('RUNNING');
 const frame=page.frames().find(f=>f!==page.mainFrame()&&f.url().startsWith('http'))!;expect(frame).toBeTruthy();const runtime=new URL(frame.url()).origin;expect(runtime).not.toBe(base);
 expect(await frame.evaluate(()=>{try{return Boolean(parent.document.body)}catch{return false}})).toBe(false);
 const worker=await page.request.get(runtime+'/worker.js');expect(worker.headers()['content-security-policy']).toContain("worker-src 'none'");expect(worker.headers()['content-security-policy']).toContain("connect-src 'self'");
 const wasm=await page.request.get(runtime+'/pyodide/pyodide.asm.wasm');expect(wasm.status()).toBe(200);expect(wasm.headers()['content-type']).toBe('application/wasm');
 await page.locator('#stop').click();await expect(page.locator('iframe')).toHaveCount(0);page.once('dialog',d=>d.accept());await page.locator('#restore').click();await expect(page.locator('#code')).toHaveValue(/from robot import/);
 await page.reload();await expect(page.locator('#language')).toHaveValue('python');await expect(page.locator('#code')).not.toHaveValue('while True:\n    pass');
 await signIn(page.context(),codeA);const cookies=await page.context().cookies(base);const session=cookies.find(c=>c.name===(base.startsWith('https:')?'__Host-robolab':'robolab-local'))!;expect(session.httpOnly).toBe(true);expect(session.sameSite).toBe('Strict');if(base.startsWith('https:'))expect(session.secure).toBe(true);
});
