import {test,expect} from '@playwright/test';
import {openSignIn} from '../learning-ui.ts';

// These fixtures exercise navigation only; real authentication is covered by family-ui.
test.beforeEach(async({page})=>{
  await page.route('**/api/family**',route=>route.fulfill({status:401,json:{error:'Sign in to continue.'}}));
});

test('one guest entry supports keyboard choices, dismissal, and modal return without changing the draft',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.locator('#code').fill('# keep this guest experiment');
  const entry=page.getByRole('banner').getByRole('button',{name:'Sign in',exact:true});
  await expect(page.getByRole('banner').getByRole('button')).toHaveCount(2);
  await expect(page.locator('#parent-signin-open')).toBeHidden();
  await entry.focus();await page.keyboard.press('Enter');
  await expect(entry).toHaveAttribute('aria-expanded','true');
  await page.keyboard.press('Tab');await expect(page.locator('#student-signin-open')).toBeFocused();
  await page.keyboard.press('Tab');await expect(page.locator('#parent-signin-open')).toBeFocused();
  await page.keyboard.press('Escape');await expect(entry).toBeFocused();await expect(page.locator('#signin-options')).toBeHidden();
  await page.keyboard.press('ArrowDown');await expect(page.locator('#student-signin-open')).toBeFocused();
  await page.keyboard.press('ArrowDown');await expect(page.locator('#parent-signin-open')).toBeFocused();
  await page.keyboard.press('Enter');await expect(page.locator('#parent-signin-email')).toBeFocused();
  await expect(page.locator('#student-entry')).toBeHidden();await expect(page.locator('#signin-options')).toBeHidden();
  await page.keyboard.press('Escape');await expect(entry).toBeFocused();
  await openSignIn(page,'student');await expect(page.locator('#access-code')).toBeFocused();await expect(page.locator('#parent-entry')).toBeHidden();
  await page.getByRole('button',{name:'Close family progress'}).click();await expect(entry).toBeFocused();
  await entry.click();await page.locator('h1').click();await expect(page.locator('#signin-options')).toBeHidden();
  await entry.click();await page.keyboard.press('Tab');await page.keyboard.press('Tab');await page.keyboard.press('Tab');
  await expect(page.locator('#signin-options')).toBeHidden();await expect(entry).toHaveAttribute('aria-expanded','false');
  await expect(page.locator('#code')).toHaveValue('# keep this guest experiment');expect(errors).toEqual([]);
});

for(const role of ['student','parent'])test(`${role} keeps direct progress access and returns to guest choices on sign-out`,async({page})=>{
  let signedIn=true;
  await page.route('**/api/family**',route=>{
    if(new URL(route.request().url()).pathname.endsWith('/logout')){signedIn=false;return route.fulfill({json:{ok:true}});}
    return route.fulfill(signedIn?{json:{profile:{id:'nav-'+role,name:'Navigation '+role,role},drafts:{},history:[],students:[],completed:[]}}:{status:401,json:{error:'Sign in to continue.'}});
  });
  await page.goto('/');const entry=page.locator('#family-open');
  await expect(entry).toHaveText(role==='parent'?'Parent dashboard':'My progress');await expect(entry).toHaveAttribute('aria-haspopup','dialog');
  await entry.click();await expect(page.locator('#family-dialog')).toBeVisible();await expect(page.locator('#signin-options')).toBeHidden();
  await page.locator('#family-logout').click();await expect(entry).toHaveText('Sign in ⌄');
  await page.keyboard.press('Escape');await expect(entry).toBeFocused();
  await openSignIn(page,'parent');await expect(page.locator('#parent-signin-email')).toBeFocused();
});

test('guest navigation and dropdown fit narrow, tablet and desktop screens',async({page})=>{
  await page.goto('/');
  for(const width of [320,390,768,1024,1366]){
    await page.setViewportSize({width,height:900});await page.locator('#family-open').click();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    for(const selector of ['#curriculum-open','#family-open','#signin-options','#student-signin-open','#parent-signin-open']){
      const box=(await page.locator(selector).boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width);expect(box.height).toBeGreaterThanOrEqual(44);
    }
    if(width===390||width===1366)await page.screenshot({path:`test-results/account-menu-${width}.png`});
    await page.keyboard.press('Escape');
  }
});
