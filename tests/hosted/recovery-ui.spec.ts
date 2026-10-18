import {openMission,openSignIn} from '../learning-ui.ts';
import {test,expect} from '@playwright/test';
import {parentEmail,studentCode} from '../helpers/email-ui.ts';
test.skip(!process.env.FAMILY_UI_MEMORY,'Disposable account tests only.');
// The owner retired pre-email connection. Keep preservation and denial evidence.
test('parent entry is visible, old setup cannot revive connection, and student work remains',async({page})=>{
 await page.request.post('/__test/newday');const seed=await (await page.request.post('/__test/legacy',{data:{unfinished:true}})).json();
 await page.goto('/');await page.evaluate(key=>sessionStorage.setItem('robolab-pending-family-setup',JSON.stringify({key})),seed.setupKey);await page.reload();
 await expect(page.getByRole('banner').getByRole('button',{name:'Sign in',exact:true})).toBeVisible();await openSignIn(page,'parent');
 await expect(page.locator('#parent-signin-email')).toBeVisible();await expect(page.locator('#family-dialog')).not.toContainText('old parent code');await expect(page.locator('#connect-email')).toHaveCount(0);
 await page.getByRole('button',{name:'Close family progress'}).click();await openSignIn(page,'student');await page.locator('#access-code').fill(seed.studentCode);await page.locator('#family-login button').click();await expect(page.locator('#profile-label')).toContainText('Returning pilot');
 await page.getByRole('button',{name:'Close family progress'}).click();
 for(const lesson of ['L01','L02','L03'])for(const lang of ['python','java']){await openMission(page,lesson);await page.locator('#language').selectOption(lang);await expect(page.locator('#code')).toHaveValue(`${lesson} ${lang} returning draft`);}
});
test('verified recovery parents use email directly; old links cannot change authentication or expose email to students',async({page})=>{
 await page.request.post('/__test/newday');const email='verified-parent-with-a-long-address@example.test',seed=await (await page.request.post('/__test/legacy',{data:{verified:true,email}})).json();
 await parentEmail(page,email);expect(await page.locator('html').getAttribute('data-profile')).toBe(seed.profileId);await expect(page.locator('#connect-parent-code')).toHaveCount(0);
 await page.setViewportSize({width:390,height:844});await page.locator('#email-verification-notice').screenshot({path:'test-results-family-ui/email-only-verified-narrow.png'});
 await page.goto('/#recover-family=retired-link');await expect(page.locator('#recovery-flow')).toContainText('no longer used');await expect(page.locator('#email-verification-notice')).toBeHidden();expect(new URL(page.url()).hash).toBe('');await page.locator('#recovery-dismiss').click();await expect(page.locator('#email-verification-notice')).toBeVisible();
 await page.locator('#family-logout').click();await studentCode(page,seed.studentCode);await expect(page.locator('#email-verification-notice')).toBeHidden();await expect(page.locator('#family-dialog')).not.toContainText(email);
});
