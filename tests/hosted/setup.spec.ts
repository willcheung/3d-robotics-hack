import {openSignIn} from '../learning-ui.ts';
import {test,expect} from '@playwright/test';
import {parentEmail,addStudents,studentCode} from '../helpers/email-ui.ts';
test.skip(!process.env.FAMILY_UI_MEMORY,'Disposable local inbox; real email delivery is a separate hosted gate.');
test('parents have email entry, students have code entry, and guest Python remains available',async({page})=>{
 await page.goto('/');await openSignIn(page,'parent');await expect(page.locator('#parent-signin-email')).toBeVisible();
 await expect(page.locator('#legacy-setup')).toHaveCount(0);await expect(page.locator('#family-create')).toHaveCount(0);await expect(page.locator('#family-forgot')).toHaveCount(0);
 await page.setViewportSize({width:390,height:844});await page.locator('#family-dialog').screenshot({path:'test-results-family-ui/email-only-entry-narrow.png'});
 await page.locator('[data-mode=student]').click();await expect(page.getByLabel('Student code',{exact:true})).toBeVisible();await expect(page.locator('#student-entry')).not.toContainText('parent code');
 await page.locator('#guest-practice').click();await expect(page.locator('#family-dialog')).not.toBeVisible();await expect(page.locator('#profile-label')).toHaveText('Guest practice');
});
test('new parents return by email and students retain separate codes and both-language saved drafts',async({page,browser})=>{
 await page.request.post('/__test/newday');await parentEmail(page,'email-only-parent@example.test',true);const profile=await page.locator('html').getAttribute('data-profile');
 const [code]=await addStudents(page,['New pilot']);await page.locator('#family-logout').click();await studentCode(page,code);await page.getByRole('button',{name:'Close family progress'}).click();
 for(const lang of ['python','java']){await page.locator('#language').selectOption(lang);await page.locator('#code').fill(`${lang} saved experiment`);await expect(page.locator('#save-help')).toContainText('Saved to your account');}
 const device=await browser.newContext();try{
  const parent=await device.newPage();await parentEmail(parent,'email-only-parent@example.test');expect(await parent.locator('html').getAttribute('data-profile')).toBe(profile);await expect(parent.locator('.family-results')).toContainText('New pilot');await expect(parent.locator('#setup-receipt')).toBeEmpty();
  await parent.locator('#family-logout').click();await studentCode(parent,code);await parent.getByRole('button',{name:'Close family progress'}).click();
  for(const lang of ['python','java']){await parent.locator('#language').selectOption(lang);await expect(parent.locator('#code')).toHaveValue(`${lang} saved experiment`);}
 }finally{await device.close();}
});
