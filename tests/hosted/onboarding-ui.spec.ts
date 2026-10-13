import {test,expect} from '@playwright/test';
test.skip(!process.env.FAMILY_UI_MEMORY,'Disposable inbox tests; real staging delivery is a separate gate.');
async function mail(request:any){return (await request.get('/__test/mail')).json();}
async function begin(page:any,email:string){await page.goto('/');await page.locator('#family-open').click();await page.locator('#parent-signin-email').fill(email);await page.getByRole('button',{name:'Continue with email',exact:true}).click();await expect(page.locator('#email-code')).toBeVisible();}
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
  for(const language of ['python','java']){await child.locator('#language').selectOption(language);await child.locator('#code').fill(`${language} personal draft`);await child.locator('#save-cloud').click();await expect(child.locator('#save-help')).toContainText('Draft saved');}
  await request.post('/__test/drain');await page.locator('#family-refresh').click();await expect(page.locator('.family-results article').filter({hasText:'Pilot A'})).toContainText('Ready · student has signed in');
  const first=(await mail(request));expect(first.subject).toBe('Pilot A signed in to RoboLab');
  await child.locator('#family-open').click();await child.locator('#family-logout').click();await child.goto(`/#student-login=${code}`);await child.locator('#student-start').click();await request.post('/__test/drain');expect((await mail(request)).id).toBe(first.id);
  for(const language of ['python','java']){await child.locator('#language').selectOption(language);await expect(child.locator('#code')).toHaveValue(`${language} personal draft`);}
  await child.goto(`/#student-login=${sibling}`);await child.locator('#student-start').click();await expect.poll(async()=> (await child.locator('#profile-label').textContent())?.includes('Pilot B')?'ok':await child.locator('#family-message').textContent()).toBe('ok');await expect(child.locator('#code')).not.toHaveValue('java personal draft');
  await page.locator('#first-signin-choice').uncheck();await expect(page.locator('#family-message')).toContainText('preference saved');await request.post('/__test/drain');expect((await mail(request)).id).toBe(first.id);
  // Replacement is explicit, retry-safe and keeps the profile's drafts.
  page.once('dialog',d=>d.accept());await page.locator('.family-results article').filter({hasText:'Pilot A'}).locator('[data-code]').click();await expect(page.locator('.student-login-card')).toHaveCount(1);const replacement=await page.locator('.student-login-card input').inputValue();expect(replacement===code).toBe(false);
  await child.goto(`/#student-login=${replacement}`);await child.locator('#student-start').click();await child.locator('#language').selectOption('python');await expect(child.locator('#code')).toHaveValue('python personal draft');await request.post('/__test/drain');
  await page.locator('#family-logout').click();await request.post('/__test/advance');await begin(page,'onboarding-parent@example.test');await page.locator('#email-code').fill((await mail(request)).text.match(/\b\d{6}\b/)[0]);await page.locator('#parent-verify button').click();await expect(page.locator('.family-results article')).toHaveCount(2);await expect(page.locator('#email-create')).toHaveCount(0);
 }finally{await other.close();}
});
test('parent entry is keyboard usable at narrow width and preserves a failed request for retry',async({page,request})=>{
 await request.post('/__test/advance');await page.setViewportSize({width:390,height:844});await page.goto('/');await page.locator('#family-open').click();await expect(page.locator('#student-entry')).toBeHidden();await page.locator('#parent-signin-email').fill('keyboard-parent@example.test');await page.locator('#parent-signin-email').press('Enter');await expect(page.locator('#email-code')).toBeFocused();
 await page.locator('#family-dialog').screenshot({path:'test-results-family-ui/onboarding-code-narrow.png'});expect(await page.locator('#family-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
 await page.locator('#email-code').fill('bad');await page.locator('#email-code').press('Enter');await expect(page.locator('#email-code')).toBeVisible();
 await page.locator('#email-change').click();await expect(page.locator('#parent-signin-email')).toBeVisible();await page.locator('[data-mode=student]').click();await expect(page.locator('#access-code')).toBeVisible();await expect(page.locator('#parent-entry')).toBeHidden();
});
