import {openSignIn} from '../learning-ui.ts';
import {expect,type Page} from '@playwright/test';
// Disposable local inbox only. Hosted provider delivery is a separate release gate.
export async function parentEmail(page:Page,email:string,create=false){
 await page.request.post('/__test/advance');await page.goto('/');await openSignIn(page,'parent');
 await page.locator('#parent-signin-email').fill(email);await page.locator('#parent-signin button').click();await expect(page.locator('#email-code')).toBeVisible();
 const message=await (await page.request.get('/__test/mail')).json();await page.locator('#email-code').fill(message.text.match(/\b\d{6}\b/)[0]);await page.locator('#parent-verify button').click();
 if(create){await expect(page.locator('#email-create')).toBeVisible();await page.locator('#email-create').click();}
 await expect(page.locator('#email-verification-notice')).toContainText(email);
}
export async function addStudents(page:Page,names:string[]){
 for(const [i,name] of names.entries()){if(i)await page.locator('#another-student').click();await page.locator(`[data-name="${i}"]`).fill(name);}
 await page.locator('#create-student-logins').click();await expect(page.locator('.student-login-card')).toHaveCount(names.length);
 return page.locator('.student-login-card input').evaluateAll(inputs=>inputs.map(input=>(input as HTMLInputElement).value));
}
export async function studentCode(page:Page,code:string){
 await page.goto('/');await openSignIn(page,'student');await page.locator('#access-code').fill(code);await page.locator('#family-login button').click();
 await expect(page.locator('#profile-label')).not.toHaveText('Guest practice');
}
