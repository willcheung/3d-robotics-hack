import {test,expect} from '@playwright/test';
import {javaStarter} from '../../src/starters.ts';
import {sensorJava,sensorReference,sensorTransfer} from '../../src/lessons.ts';
test.skip(!process.env.FAMILY_UI_MEMORY,'Local account storage integration; cloud acceptance is separate.');
test('a student unlocks Mission 2 with real checked rescues; saved completion survives a new device and stays separate from a sibling',async({page,browser})=>{
 test.setTimeout(90000);
 await page.goto('/');await page.locator('#family-open').click();await page.locator('#parent-name').fill('QA parent');await page.getByRole('button',{name:'Create family',exact:true}).click();await expect(page.locator('#setup-receipt input')).toBeVisible();await page.locator('#setup-saved').click();
 const codes:string[]=[];
 for(const name of ['Pilot A','Pilot B']){await page.locator('#student-name').fill(name);await page.getByRole('button',{name:'Add student',exact:true}).click();await expect(page.locator('.family-results')).toContainText(name);codes.push(await page.locator('#new-code input').inputValue());}
 await page.locator('#family-logout').click();await page.locator('#access-code').fill(codes[0]);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.locator('#profile-label')).toContainText('Pilot A');await page.getByRole('button',{name:'Close family progress'}).click();
 await page.locator('#lesson').selectOption('L02');await page.locator('#language').selectOption('java');await page.locator('#code').fill(sensorReference.java);await page.locator('#verify-cloud').click();await expect(page.locator('#save-help')).toContainText('Check all three Mission 1 rescues');
 async function check(target:string,source:string,passed=true){await page.locator('#target').selectOption(target);await page.locator('#code').fill(source);await page.locator('#verify-cloud').click();await expect(page.locator('#save-help')).toContainText(passed?'Rescue checked and saved':'checked program missed');await expect(page.locator('#stop-check')).toBeHidden();}
 await page.locator('#lesson').selectOption('L01');
 const base=javaStarter.replace('turn_ticks = 50','turn_ticks = 100');
 await check('beacon',base);await check('farther',base.replace('turn_ticks = 100','turn_ticks = 150'));await check('reverse',base.replace('motor(0.5)','motor(-0.5)').replace('servo(120)','servo(60)'));
 await page.locator('#curriculum-open').click();await expect(page.locator('[data-lesson="L02"]').locator('..')).toContainText('Available · Mission 2');await page.locator('[data-lesson="L02"]').click();
 await check('sensor-left',sensorJava,false);await check('sensor-left',sensorReference.java);await check('sensor-right',sensorReference.java);await check('sensor-transfer',sensorTransfer.java);
 await page.locator('#save-cloud').click();await expect(page.locator('#save-help')).toContainText('Draft saved');
 await page.locator('#family-open').click();await expect(page.locator('#family-content')).toContainText('Mission 2 complete');
 await expect(page.locator('.family-results article').filter({hasText:'Pilot A'})).toContainText('Mission 2: 3/3 badges');await expect(page.locator('.family-results article').filter({hasText:'Pilot B'})).toContainText('Mission 2: 0/3 badges');
 await page.screenshot({path:'test-results-family-ui/mission-02-family-progress.png',fullPage:true});
 const other=await browser.newContext();const device=await other.newPage();
 try{
  await device.goto('/');await device.locator('#family-open').click();await device.locator('#access-code').fill(codes[0]);await device.getByRole('button',{name:'Sign in',exact:true}).click();await expect(device.locator('#family-content')).toContainText('Mission 2 complete');await device.getByRole('button',{name:'Close family progress'}).click();
  await device.locator('#lesson').selectOption('L02');await device.locator('#language').selectOption('java');await expect(device.locator('#code')).toHaveValue(sensorTransfer.java);
  await device.locator('#family-open').click();await device.locator('#family-logout').click();await device.locator('#access-code').fill(codes[1]);await device.getByRole('button',{name:'Sign in',exact:true}).click();await expect(device.locator('#profile-label')).toContainText('Pilot B');await device.getByRole('button',{name:'Close family progress'}).click();
  await device.locator('#curriculum-open').click();await expect(device.locator('[data-lesson="L02"]').locator('..')).toContainText('checked completion locked');await device.locator('[data-lesson="L02"]').click();await expect(device.locator('#code')).toHaveValue(sensorJava);
 }finally{await other.close();}
});
test('a pending progress check keeps the visible mission, language and rescue consistent',async({page})=>{
 await page.goto('/');await page.locator('#family-open').click();await page.locator('#parent-name').fill('Navigation tester');await page.getByRole('button',{name:'Create family',exact:true}).click();await expect(page.locator('#setup-receipt input')).toBeVisible();await page.locator('#setup-saved').click();await page.getByRole('button',{name:'Close family progress'}).click();
 await page.locator('#lesson').selectOption('L02');
 // Hold only the response to exercise navigation during an in-flight check.
 // This fixture makes no runtime or completion claim.
 let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/api/family/verify',async route=>{await gate;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({outcome:'missed'})});});
 try{
  await page.locator('#verify-cloud').click();await expect(page.locator('#stop-check')).toBeVisible();
  await page.locator('#target').selectOption('sensor-transfer');await expect(page.locator('#target')).toHaveValue('sensor-left');
  await expect(page.locator('#mission-job')).toContainText('starts at 30°');await expect(page.locator('#pointer-value')).toHaveText('30.0°');
  await expect(page.locator('#feedback')).toContainText('Stop the check before changing rescues');
  await page.locator('#language').selectOption('java');await expect(page.locator('#language')).toHaveValue('python');
  await page.locator('#lesson').selectOption('L01');await expect(page.locator('#lesson')).toHaveValue('L02');
 }finally{release();}
 await expect(page.locator('#stop-check')).toBeHidden();await page.locator('#target').selectOption('sensor-transfer');await expect(page.locator('#pointer-value')).toHaveText('-30.0°');
});
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
