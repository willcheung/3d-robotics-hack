import {test as baseTest,expect,type BrowserContext,type Page} from '@playwright/test';
import {BlobStore,login,familyPath,hashCode} from '../../server/family-store.mjs';
import {del} from '@vercel/blob';
import {readFileSync} from 'node:fs';
const base=process.env.HOSTED_APP_ORIGIN||'http://127.0.0.1:4373';
const bypass=process.env.HOSTED_BYPASS_FILE?JSON.parse(readFileSync(process.env.HOSTED_BYPASS_FILE,'utf8')).bypassSecret:undefined;
const protectedHeaders:Record<string,string>=bypass?{'x-vercel-protection-bypass':bypass}:{};
async function protect(context:BrowserContext){if(bypass)await context.route(url=>url.origin===base,route=>route.continue({headers:{...route.request().headers(),...protectedHeaders}}));}
const test=baseTest.extend<{protection:void}>({protection:[async({context},use)=>{await protect(context);await use();},{auto:true}]});
const paths=new Set<string>();
async function remember(code:string,parent=false){if(process.env.FAMILY_UI_MEMORY==='1')return;paths.add(`invites/${hashCode(code)}.json`);if(parent)paths.add(familyPath((await login(new BlobStore(),code)).familyId));}
async function open(page:Page){await page.goto('/');await page.locator('#family-open').click();}
async function create(page:Page,name='Parent comet'){await open(page);await page.locator('#parent-name').fill(name);await page.getByRole('button',{name:'Create family',exact:true}).click();await expect(page.locator('#profile-label')).toContainText(name);const code=await page.locator('#setup-receipt input').inputValue();await remember(code,true);return code;}
async function signIn(context:BrowserContext,code:string){await protect(context);const r=await context.request.post(base+'/api/family/login',{headers:{Origin:base,...protectedHeaders},data:{code}});expect(r.status()).toBe(200);}
test.afterAll(async()=>{if(paths.size)await del([...paths]);});
test('parent creates a family, saves the code, adds a student and signs in on another device',async({page,browser})=>{
 const code=await create(page);await expect(page.locator('#setup-receipt input')).toHaveAttribute('type','password');
 await expect(page.locator('#setup-receipt')).toContainText('Add and verify a recovery email');
 await page.locator('#family-dialog').screenshot({path:'test-results-family-ui/create-family-desktop.png'});
 await page.locator('#setup-saved').click();await expect(page.locator('#student-name')).toBeFocused();
 expect(await page.evaluate(()=>sessionStorage.getItem('robolab-pending-family-setup'))).toBeNull();
 await page.locator('#student-name').fill('Nova');await page.getByRole('button',{name:'Add student',exact:true}).click();await expect(page.locator('.family-results')).toContainText('Nova');
 const studentCode=await page.locator('#new-code input').inputValue();await remember(studentCode);await expect(page.locator('#new-code input')).toHaveAttribute('type','password');
 const device=await browser.newContext();await signIn(device,code);const parent=await device.newPage();await parent.goto('/');await parent.locator('#family-open').click();await expect(parent.locator('.family-results')).toContainText('Nova');await expect(parent.locator('#setup-receipt')).toBeEmpty();
 const student=await browser.newContext();await signIn(student,studentCode);const child=await student.newPage();await child.goto('/');await expect(child.locator('#profile-label')).toContainText('Nova');await child.locator('#family-open').click();await expect(child.locator('#add-student')).toHaveCount(0);await expect(child.locator('#family-create')).toHaveCount(0);await expect(child.locator('#new-code')).toHaveCount(0);await device.close();await student.close();
});
test('unfinished setup survives reload and retrieves the same family and parent code',async({page})=>{
 const code=await create(page,'Parent retry'),profile=await page.locator('html').getAttribute('data-profile');
 await page.reload();await page.locator('#family-open').click();await expect(page.locator('#setup-resume')).toBeVisible();await page.locator('#setup-resume').click();
 await expect.poll(async()=>(await page.locator('#setup-receipt input').inputValue())===code).toBe(true);expect(await page.locator('html').getAttribute('data-profile')).toBe(profile);await page.locator('#setup-saved').click();
});
test('lost response retries setup without duplicating a family',async({page})=>{
 let requests=0,firstCode='',firstProfile='';
 await page.route('**/api/family/create',async route=>{
  requests++;const response=await route.fetch({headers:{...route.request().headers(),...protectedHeaders}});
  if(requests===1){const body=await response.json();firstCode=body.code;await remember(firstCode,true);const session=await page.request.get(base+'/api/family',{headers:protectedHeaders});firstProfile=(await session.json()).profile.id;await route.abort('failed');}else await route.fulfill({response});
 });
 await open(page);await page.locator('#parent-name').fill('Parent reconnect');await page.getByRole('button',{name:'Create family',exact:true}).dblclick();
 await expect(page.locator('#setup-resume')).toBeEnabled();expect(requests).toBe(1);await page.locator('#setup-resume').click();await expect(page.locator('#profile-label')).toContainText('Parent reconnect');await expect.poll(async()=>(await page.locator('#setup-receipt input').inputValue())===firstCode).toBe(true);expect(await page.locator('html').getAttribute('data-profile')).toBe(firstProfile);
});
test('narrow signup, clipboard success and manual-copy fallback are usable',async({page})=>{
 await page.setViewportSize({width:390,height:850});await open(page);await expect(page.getByRole('button',{name:'Create family',exact:true})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('#family-dialog').screenshot({path:'test-results-family-ui/create-family-narrow.png'});
 await page.locator('#parent-name').fill('Parent copy');await page.getByRole('button',{name:'Create family',exact:true}).click();await expect(page.locator('#setup-receipt input')).toBeVisible();const code=await page.locator('#setup-receipt input').inputValue();await remember(code,true);
 // Clipboard permission varies by device; test both successful and refused APIs.
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(value:string)=>{(window as unknown as {copied:string}).copied=value;}}}));
 await page.locator('#setup-receipt [data-copy]').click();expect((await page.evaluate(()=>(window as unknown as {copied:string}).copied))===code).toBe(true);await expect(page.locator('#setup-receipt .copy-status')).toContainText('Copied');
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied');}}}));await page.locator('#setup-receipt [data-copy]').click();await expect(page.locator('#setup-receipt input')).toHaveAttribute('type','text');await expect(page.locator('#setup-receipt .copy-status')).toContainText('code is selected');
 const selected=await page.locator('#setup-receipt input').evaluate((e:HTMLInputElement)=>e.selectionEnd!-e.selectionStart!);expect(selected).toBe(32);await page.locator('#setup-receipt [data-show]').click();await expect(page.locator('#setup-receipt input')).toHaveAttribute('type','password');
});
