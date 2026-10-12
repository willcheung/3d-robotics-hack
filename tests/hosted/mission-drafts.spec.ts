import {test,expect} from '@playwright/test';
test.skip(!process.env.FAMILY_UI_MEMORY,'Local account storage integration; cloud acceptance is separate.');
test('mission/language drafts sync independently, past experiments restore safely, and a second device resumes',async({page,browser})=>{
 await page.goto('/');await page.locator('#family-open').click();await page.locator('#parent-name').fill('Mission parent');await page.getByRole('button',{name:'Create family',exact:true}).click();await expect(page.locator('#setup-receipt input')).toBeVisible();const code=await page.locator('#setup-receipt input').inputValue();await page.locator('#setup-saved').click();await page.getByRole('button',{name:'Close family progress'}).click();
 for(const id of ['L01','L02'])for(const lang of ['python','java']){
  await page.locator('#lesson').selectOption(id);await page.locator('#language').selectOption(lang);await page.locator('#code').fill(`${id} ${lang} saved`);await page.locator('#save-cloud').click();await expect(page.locator('#save-help')).toContainText('Draft saved');
 }
 const profile=await page.locator('html').getAttribute('data-profile');
 const response=await page.request.post('/api/family/attempt',{headers:{Origin:'http://127.0.0.1:4473','X-RoboLab-Profile':profile!},data:{id:crypto.randomUUID(),source:'# older sensor experiment',language:'python',target:'sensor-right',outcome:'missed',seconds:1}});expect(response.status()).toBe(200);
 await page.locator('#lesson').selectOption('L01');await page.locator('#code').fill('latest mission one java');await page.locator('#family-open').click();await page.locator('#family-refresh').click();await expect(page.locator('[data-history]')).toHaveCount(1);await page.locator('[data-history]').click();
 await expect(page.locator('#lesson')).toHaveValue('L02');await expect(page.locator('#target')).toHaveValue('sensor-right');await expect(page.locator('#code')).toHaveValue('# older sensor experiment');await expect(page.locator('#status-pill')).toHaveText('READY');
 await page.locator('#save-cloud').click();await expect(page.locator('#save-help')).toContainText('Draft saved');
 const other=await browser.newContext();const device=await other.newPage();await device.goto('/');await device.locator('#family-open').click();await device.locator('#access-code').fill(code);await device.getByRole('button',{name:'Sign in',exact:true}).click();await expect(device.locator('#profile-label')).toContainText('Mission parent');await device.getByRole('button',{name:'Close family progress'}).click();
 await device.locator('#language').selectOption('java');await expect(device.locator('#code')).toHaveValue('latest mission one java');await device.locator('#lesson').selectOption('L02');await expect(device.locator('#code')).toHaveValue('L02 java saved');await device.locator('#language').selectOption('python');await expect(device.locator('#code')).toHaveValue('# older sensor experiment');
 await device.locator('#curriculum-open').click();await expect(device.locator('[data-lesson="L02"]').locator('..')).toContainText('checked completion locked');await expect(device.locator('[data-lesson="L03"]')).toHaveCount(0);await other.close();
});
