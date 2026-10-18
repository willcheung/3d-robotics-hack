import {openSignIn} from '../learning-ui.ts';
import {test,expect} from '@playwright/test';
test.skip(!process.env.FAMILY_UI_MEMORY,'Disposable inbox tests; real staging delivery is a separate gate.');
async function mail(request:any){return (await request.get('/__test/mail')).json();}
async function begin(page:any,email:string){await page.goto('/');await openSignIn(page,'parent');await page.locator('#parent-signin-email').fill(email);await page.getByRole('button',{name:'Continue with email',exact:true}).click();await expect(page.locator('#email-code')).toBeVisible();}
test('email onboarding, batch retry, student links, first-only notices and both-language drafts survive new devices',async({page,browser,request})=>{
 test.setTimeout(60000);await request.post('/__test/newday');
 await begin(page,'onboarding-parent@example.test');const otp=(await mail(request)).text.match(/\b\d{6}\b/)[0];
 await page.locator('#email-code').fill(otp==='000000'?'000001':'000000');await page.locator('#parent-verify button').click();await expect(page.locator('#family-message')).toContainText('incorrect');
 await page.locator('#email-code').fill(otp);await page.locator('#parent-verify button').click();await expect(page.locator('#email-create')).toBeVisible();
 // Simulate the response disappearing after the server has set its cookie.
 let lost=true;await page.route('**/api/family/authfinish',async route=>{const response=await route.fetch();if(lost){lost=false;await route.abort('failed');}else await route.fulfill({response});});
 await page.locator('#email-create').click();await expect(page.locator('#email-create')).toBeEnabled();await page.locator('#email-create').click();await expect(page.locator('#student-batch')).toBeVisible();
 await expect(page.locator('#email-verification-notice')).toContainText('Email verified');await expect(page.locator('#setup-receipt')).toBeEmpty();await expect(page.locator('#parent-email')).toHaveCount(0);
 await page.locator('[data-name="0"]').fill('Pilot A');await page.locator('#another-student').click();await page.locator('[data-name="1"]').fill('Pilot B');
 let batchLost=true;await page.route('**/api/family/studentbatch',async route=>{const response=await route.fetch();if(batchLost){batchLost=false;await route.abort('failed');}else await route.fulfill({response});});
 await page.locator('#create-student-logins').click();await expect(page.locator('#create-student-logins')).toBeEnabled();await page.reload();await page.locator('#family-open').click();await page.locator('#create-student-logins').click();await expect(page.locator('.student-login-card')).toHaveCount(2);await expect(page.locator('.family-results article')).toHaveCount(2);
 const cards=page.locator('.student-login-card'),code=await cards.nth(0).locator('input').inputValue(),sibling=await cards.nth(1).locator('input').inputValue();await expect(cards.nth(0).locator('input')).toHaveAttribute('type','password');
 await page.setViewportSize({width:390,height:844});expect(await page.locator('#family-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
 await page.locator('#family-dialog').screenshot({path:'test-results-family-ui/onboarding-parent-narrow.png'});
 await cards.nth(0).screenshot({path:'test-results-family-ui/onboarding-card-narrow.png'});
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied');}}}));await cards.nth(0).locator('[data-copy-link]').click();await expect(cards.nth(0).locator('.copy-status')).toContainText('selected');await expect(cards.nth(0).locator('input')).toHaveValue(`http://127.0.0.1:4473/#student-login=${code}`);
 // Keep screenshots private; printing is checked structurally without saving credentials.
 await page.evaluate(()=>{window.print=()=>{(window as any).printCards=document.querySelectorAll('#login-card-print article').length;};});await page.locator('#print-student-cards').click();expect(await page.evaluate(()=>(window as any).printCards)).toBe(2);await expect(page.locator('#login-card-print')).toHaveCount(0);
 await request.post('/__test/drain');await page.locator('#family-refresh').click();await expect(page.locator('.onboarding-mail')).toContainText('Email sent');
 const combined=await mail(request);expect(combined.text.includes(code)&&combined.text.includes(sibling)).toBe(true);
 const other=await browser.newContext(),child=await other.newPage();
 try{
  await child.goto(`/#student-login=${code}`);await expect(child.locator('#student-start')).toBeVisible();expect(new URL(child.url()).hash).toBe('');await expect(child.locator('#profile-label')).toHaveText('Guest practice');
  await request.post('/__test/drain');expect((await mail(request)).id).toBe(combined.id);
  await child.locator('#student-start').click();await expect(child.locator('#profile-label')).toContainText('Pilot A');await expect(child.locator('#family-dialog')).not.toBeVisible();
  for(const language of ['python','java']){await child.locator('#language').selectOption(language);await child.locator('#code').fill(`${language} personal draft`);await expect(child.locator('#save-help')).toContainText('Saved to your account');}
  await request.post('/__test/drain');await page.locator('#family-refresh').click();await expect(page.locator('.family-results article').filter({hasText:'Pilot A'})).toContainText('Ready · student has signed in');
  const first=(await mail(request));expect(first.subject).toBe('Pilot A signed in to RoboLab');
  await child.locator('#family-open').click();await child.locator('#family-logout').click();await child.goto(`/#student-login=${code}`);await child.locator('#student-start').click();await request.post('/__test/drain');expect((await mail(request)).id).toBe(first.id);
  for(const language of ['python','java']){await child.locator('#language').selectOption(language);await expect(child.locator('#code')).toHaveValue(`${language} personal draft`);}
  await child.goto(`/#student-login=${sibling}`);await child.locator('#student-start').click();await expect.poll(async()=> (await child.locator('#profile-label').textContent())?.includes('Pilot B')?'ok':await child.locator('#family-message').textContent()).toBe('ok');await expect(child.locator('#code')).not.toHaveValue('java personal draft');
  await page.locator('#first-signin-choice').uncheck();await expect(page.locator('#family-message')).toContainText('preference saved');await request.post('/__test/drain');expect((await mail(request)).id).toBe(first.id);
  // Replacement is explicit, retry-safe and keeps the profile's drafts.
  await page.locator('.family-results article').filter({hasText:'Pilot A'}).getByText('Manage student login',{exact:true}).click();page.once('dialog',d=>d.accept());await page.locator('.family-results article').filter({hasText:'Pilot A'}).locator('[data-code]').click();await expect(page.locator('.student-login-card')).toHaveCount(1);const replacement=await page.locator('.student-login-card input').inputValue();expect(replacement===code).toBe(false);
  await child.goto(`/#student-login=${replacement}`);await child.locator('#student-start').click();await child.locator('#language').selectOption('python');await expect(child.locator('#code')).toHaveValue('python personal draft');await request.post('/__test/drain');
  await page.locator('#family-logout').click();await request.post('/__test/advance');await begin(page,'onboarding-parent@example.test');await page.locator('#email-code').fill((await mail(request)).text.match(/\b\d{6}\b/)[0]);await page.locator('#parent-verify button').click();await expect(page.locator('.family-results article')).toHaveCount(2);await expect(page.locator('#email-create')).toHaveCount(0);
  // A lost final batch must remain recoverable even when it fills all six spaces.
  await page.locator('.student-onboarding details summary').click();await page.locator('[data-name="0"]').fill('Pilot C');
  for(const [i,name] of ['Pilot D','Pilot E','Pilot F'].entries()){await page.locator('#another-student').click();await page.locator(`[data-name="${i+1}"]`).fill(name);}
  batchLost=true;await page.locator('#create-student-logins').click();await expect(page.locator('#create-student-logins')).toBeEnabled();await page.reload();await page.locator('#family-open').click();await expect(page.locator('#create-student-logins')).toBeVisible();await page.locator('#create-student-logins').click();await expect(page.locator('.student-login-card')).toHaveCount(4);await expect(page.locator('.family-results article')).toHaveCount(6);
 }finally{await other.close();}
});
test('parent entry is keyboard usable at narrow width and preserves a failed request for retry',async({page,request})=>{
 await request.post('/__test/advance');await page.setViewportSize({width:390,height:844});await page.goto('/');await openSignIn(page,'parent');await expect(page.locator('#student-entry')).toBeHidden();await page.locator('#parent-signin-email').fill('keyboard-parent@example.test');await page.locator('#parent-signin-email').press('Enter');await expect(page.locator('#email-code')).toBeFocused();
 await page.locator('#family-dialog').screenshot({path:'test-results-family-ui/onboarding-code-narrow.png'});expect(await page.locator('#family-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
 await page.locator('#email-code').fill('bad');await page.locator('#email-code').press('Enter');await expect(page.locator('#email-code')).toBeVisible();
 await page.locator('#email-change').click();await expect(page.locator('#parent-signin-email')).toBeVisible();await page.locator('[data-mode=student]').click();await expect(page.locator('#access-code')).toBeVisible();await expect(page.locator('#parent-entry')).toBeHidden();
});

test('accidental nickname rows can be removed or left blank without duplicate students',async({page,browser})=>{
 await page.request.post('/__test/newday');await begin(page,'removable-parent@example.test');await page.locator('#email-code').fill((await mail(page.request)).text.match(/\b\d{6}\b/)[0]);await page.locator('#parent-verify button').click();await page.locator('#email-create').click();
 await page.locator('[data-name="0"]').fill('Kept pilot');await page.locator('#another-student').click();await page.locator('[data-name="1"]').fill('Remove me');await page.locator('#another-student').click();
 await page.getByRole('button',{name:'Remove student 2'}).click();await expect(page.locator('[data-name]')).toHaveCount(2);await expect(page.locator('[data-name="1"]')).toBeFocused();await expect(page.locator('[data-name="0"]')).toHaveValue('Kept pilot');
 await page.locator('#create-student-logins').click();await expect(page.locator('.student-login-card')).toHaveCount(1);await expect(page.locator('.family-results article')).toHaveCount(1);await expect(page.locator('#family-content > .mission-progress')).toHaveCount(0);
 await page.setViewportSize({width:390,height:844});expect(await page.locator('#family-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);await page.locator('#family-dialog').screenshot({path:'test-results-family-ui/family-entry-narrow.png'});
 await page.request.post('/__test/advance');const device=await browser.newContext();try{const returning=await device.newPage();await begin(returning,'removable-parent@example.test');await returning.locator('#email-code').fill((await mail(page.request)).text.match(/\b\d{6}\b/)[0]);await returning.locator('#parent-verify button').click();await expect(returning.locator('#family-message')).toContainText('already has a RoboLab account');await expect(returning.locator('.family-results article')).toHaveCount(1);await expect(returning.locator('#email-create')).toHaveCount(0);}finally{await device.close();}
});

test('expired proof can restart and a rejected batch can be edited',async({page,request})=>{
 await request.post('/__test/newday');await begin(page,'recovery-parent@example.test');await page.locator('#email-code').fill((await mail(request)).text.match(/\b\d{6}\b/)[0]);await page.locator('#parent-verify button').click();
 await request.post('/__test/newday');await page.locator('#email-create').click();await expect(page.locator('#family-message')).toContainText('expired');await page.locator('#email-restart').click();await expect(page.locator('#parent-signin-email')).toBeVisible();
 await page.locator('#parent-signin-email').fill('recovery-parent@example.test');await page.locator('#parent-signin button').click();await page.locator('#email-code').fill((await mail(request)).text.match(/\b\d{6}\b/)[0]);await page.locator('#parent-verify button').click();await page.locator('#email-create').click();
 await page.locator('[data-name="0"]').fill('Keep me');await page.locator('#another-student').click();await page.locator('[data-name="1"]').fill('Remove me');
 let reject=true;await page.route('**/api/family/studentbatch',async route=>{if(reject){reject=false;await route.fulfill({status:400,json:{error:'This family supports six active students.',code:'batch-uncommitted'}});}else await route.continue();});
 await page.locator('#create-student-logins').click();await expect(page.locator('[data-name="0"]')).toBeEditable();await page.getByRole('button',{name:'Remove student 2'}).click();await page.locator('#create-student-logins').click();await expect(page.locator('.student-login-card')).toHaveCount(1);
});

test('late replacement credentials never appear after switching parents',async({page,request})=>{
 await request.post('/__test/newday');await begin(page,'delayed-parent@example.test');await page.locator('#email-code').fill((await mail(request)).text.match(/\b\d{6}\b/)[0]);await page.locator('#parent-verify button').click();await page.locator('#email-create').click();await page.locator('[data-name="0"]').fill('Private A');await page.locator('#create-student-logins').click();await expect(page.locator('.student-login-card')).toHaveCount(1);
 let release!:()=>void;const held=new Promise<void>(resolve=>release=resolve);let fetched!:()=>void;const ready=new Promise<void>(resolve=>fetched=resolve);
 await page.route('**/api/family/studentreplace',async route=>{const response=await route.fetch();fetched();await held;await route.fulfill({response});});
 await page.getByText('Manage student login',{exact:true}).click();page.once('dialog',d=>d.accept());await page.locator('[data-code]').click();await ready;await page.locator('#family-logout').click();
 await page.locator('#parent-signin-email').fill('other-parent@example.test');await page.locator('#parent-signin button').click();await page.locator('#email-code').fill((await mail(request)).text.match(/\b\d{6}\b/)[0]);await page.locator('#parent-verify button').click();await page.locator('#email-create').click();await expect(page.locator('#student-batch')).toBeVisible();
 release();await expect(page.locator('.student-login-card')).toHaveCount(0);await page.locator('#family-refresh').click();await expect(page.locator('#family-content')).not.toContainText('Private A');await expect(page.locator('#family-message')).not.toContainText('Replacement login ready');
});

test('weekly preference persists without claiming delivery and remains parent-only',async({page,request,browser})=>{
 await request.post('/__test/newday');await begin(page,'weekly-choice@example.test');await page.locator('#email-code').fill((await mail(request)).text.match(/\b\d{6}\b/)[0]);await page.locator('#parent-verify button').click();await page.locator('#email-create').click();await page.locator('[data-name="0"]').fill('Weekly pilot');await page.locator('#create-student-logins').click();const code=await page.locator('.student-login-card input').inputValue();
 await expect(page.locator('#weekly-summary-choice')).not.toBeChecked();await page.locator('#weekly-summary-choice').check();await expect(page.locator('#family-message')).toContainText('Weekly email preference saved');await expect(page.locator('.student-onboarding')).toContainText('delivery is currently unavailable');await page.reload();await page.locator('#family-open').click();await expect(page.locator('#weekly-summary-choice')).toBeChecked();await page.locator('#weekly-summary-choice').uncheck();await expect(page.locator('#family-message')).toContainText('Weekly email preference saved');
 const ctx=await browser.newContext();try{const child=await ctx.newPage();await child.goto('/');await openSignIn(child,'student');await child.locator('#access-code').fill(code);await child.locator('#family-login button').click();await expect(child.locator('#profile-label')).toContainText('Weekly pilot');await expect(child.locator('#weekly-summary-choice')).toHaveCount(0);}finally{await ctx.close();}
});
