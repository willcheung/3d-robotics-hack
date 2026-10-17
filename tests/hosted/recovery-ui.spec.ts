import {openMission} from '../learning-ui.ts';
import {test,expect} from '@playwright/test';
import {parentEmail,studentCode} from '../helpers/email-ui.ts';
test.skip(!process.env.FAMILY_UI_MEMORY,'Synthetic legacy families and local inbox only.');
const otp=async(page:any)=>(await (await page.request.get('/__test/mail')).json()).text.match(/\b\d{6}\b/)[0];
async function connect(page:any,email:string,code:string){
 await page.goto('/');await page.locator('#family-open').click();await page.locator('.recovery-help summary').click();await page.locator('#connect-email').click();
 await page.locator('#parent-signin-email').fill(email);await page.locator('#connect-parent-code').fill(code);await page.locator('#parent-signin button').click();await expect(page.locator('#email-code')).toBeVisible();
}
test('legacy parent connects once, retries a lost response, and preserves all six student experiments on a new device',async({page,browser})=>{
 await page.request.post('/__test/newday');const seed=await (await page.request.post('/__test/legacy',{data:{}})).json();
 await connect(page,'connected-parent@example.test',seed.code);await page.locator('#email-code').fill(await otp(page));
 let lost=true;await page.route('**/api/family/authfinish',async route=>{const r=await route.fetch();if(lost){lost=false;await route.abort('failed');}else await route.fulfill({response:r});});
 await page.locator('#parent-verify button').click();await expect(page.locator('#legacy-connect button')).toBeVisible();await page.locator('#legacy-connect button').click();await expect(page.locator('#email-verification-notice')).toContainText('connected-parent@example.test');
 expect(await page.locator('html').getAttribute('data-profile')).toBe(seed.profileId);await expect(page.locator('.family-results')).toContainText('Returning pilot');
 await page.reload();await page.locator('#family-open').click();await expect(page.locator('#email-verification-notice')).toBeVisible();await expect(page.locator('#connect-parent-code')).toHaveCount(0);
 await page.locator('#family-logout').click();await page.locator('[data-mode=student]').click();await page.locator('#access-code').fill(seed.code);await page.locator('#family-login button').click();await expect(page.locator('#family-message')).toContainText('Parents sign in by email');await expect(page.locator('#profile-label')).toHaveText('Guest practice');
 const device=await browser.newContext();try{
  const returning=await device.newPage();await parentEmail(returning,'connected-parent@example.test');expect(await returning.locator('html').getAttribute('data-profile')).toBe(seed.profileId);
  await returning.locator('#family-logout').click();await studentCode(returning,seed.studentCode);await expect(returning.locator('#email-verification-notice')).toBeHidden();await expect(returning.locator('.rescue-checklist').first()).toContainText('✓ North ridge');await returning.getByRole('button',{name:'Close family progress'}).click();
  for(const lesson of ['L01','L02','L03'])for(const lang of ['python','java']){await openMission(returning,lesson);await returning.locator('#language').selectOption(lang);await expect(returning.locator('#code')).toHaveValue(`${lesson} ${lang} returning draft`);await expect(returning.locator('#target')).toHaveValue(({L01:'reverse',L02:'sensor-transfer',L03:'patrol-cove'} as Record<string,string>)[lesson]);}
 }finally{await device.close();}
});
test('connection keeps input after a wrong code, fits a narrow screen, and cannot use a student code',async({page})=>{
 await page.request.post('/__test/newday');const seed=await (await page.request.post('/__test/legacy',{data:{}})).json();await page.setViewportSize({width:390,height:844});
 await connect(page,'retry-parent@example.test',seed.studentCode);await page.locator('#email-code').fill(await otp(page));await page.locator('#parent-verify button').click();await expect(page.locator('#family-message')).toContainText('Student codes cannot');await expect(page.locator('#connect-parent-code')).toHaveValue(seed.studentCode);
 expect(await page.locator('#family-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);await page.locator('#family-dialog').screenshot({path:'test-results-family-ui/connect-email-narrow.png'});
 await page.locator('#connect-parent-code').fill(seed.code);await page.locator('#legacy-connect button').click();await expect(page.locator('#email-verification-notice')).toContainText('retry-parent@example.test');
});
test('an unfinished setup resumes after reload without making a second family',async({page})=>{
 await page.request.post('/__test/newday');const seed=await (await page.request.post('/__test/legacy',{data:{unfinished:true}})).json();
 await page.goto('/');await page.evaluate(key=>sessionStorage.setItem('robolab-pending-family-setup',JSON.stringify({name:'Legacy parent',key})),seed.setupKey);await page.reload();await page.locator('#family-open').click();await expect(page.locator('#parent-entry')).toContainText('unfinished family setup');
 await page.locator('#parent-signin-email').fill('unfinished-parent@example.test');await page.locator('#parent-signin button').click();await expect(page.locator('#email-code')).toBeVisible();await page.reload();await page.locator('#family-open').click();await page.locator('#email-code').fill(await otp(page));await page.locator('#parent-verify button').click();await expect(page.locator('#email-verification-notice')).toContainText('unfinished-parent@example.test');expect(await page.locator('html').getAttribute('data-profile')).toBe(seed.profileId);expect(await page.evaluate(()=>sessionStorage.getItem('robolab-pending-family-setup'))).toBeNull();
});
test('verified recovery parents use email directly; old links cannot change authentication or expose email to students',async({page})=>{
 await page.request.post('/__test/newday');const email='verified-parent-with-a-long-address@example.test',seed=await (await page.request.post('/__test/legacy',{data:{verified:true,email}})).json();
 await parentEmail(page,email);expect(await page.locator('html').getAttribute('data-profile')).toBe(seed.profileId);await expect(page.locator('#connect-parent-code')).toHaveCount(0);
 await page.setViewportSize({width:390,height:844});await page.locator('#email-verification-notice').screenshot({path:'test-results-family-ui/email-only-verified-narrow.png'});
 await page.goto('/#recover-family=retired-link');await expect(page.locator('#recovery-flow')).toContainText('no longer used');await expect(page.locator('#email-verification-notice')).toBeHidden();expect(new URL(page.url()).hash).toBe('');await page.locator('#recovery-dismiss').click();await expect(page.locator('#email-verification-notice')).toBeVisible();
 await page.locator('#family-logout').click();await studentCode(page,seed.studentCode);await expect(page.locator('#email-verification-notice')).toBeHidden();await expect(page.locator('#family-dialog')).not.toContainText(email);
});
test('an already signed-in code-only parent connects email without replacing the profile or local editor',async({page})=>{
 await page.request.post('/__test/newday');const seed=await (await page.request.post('/__test/legacy',{data:{session:true}})).json();await page.goto('/');await page.locator('#code').fill('# parent experiment still here');await page.locator('#family-open').click();
 await page.locator('#parent-signin-email').fill('active-parent@example.test');await page.locator('#connect-parent-code').fill(seed.code.slice(0,-1)+(seed.code.endsWith('A')?'B':'A'));await page.locator('#parent-signin button').click();await page.locator('#email-code').fill(await otp(page));await page.locator('#parent-verify button').click();await expect(page.locator('#legacy-connect button')).toBeVisible();await expect(page.locator('html')).toHaveAttribute('data-profile',seed.profileId);await expect(page.locator('#code')).toHaveValue('# parent experiment still here');await page.locator('#connect-parent-code').fill(seed.code);await page.locator('#legacy-connect button').click();await expect(page.locator('#email-verification-notice')).toContainText('active-parent@example.test');expect(await page.locator('html').getAttribute('data-profile')).toBe(seed.profileId);await page.getByRole('button',{name:'Close family progress'}).click();await expect(page.locator('#code')).toHaveValue('# parent experiment still here');
});
