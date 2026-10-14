import {parentEmail,addStudents,studentCode} from '../helpers/email-ui.ts';
import {test,expect} from '@playwright/test';
import {javaStarter} from '../../src/starters.ts';
import {sensorJava,sensorReference,sensorTransfer} from '../../src/lessons.ts';
import {armJava,armReference,armMoved,armTransfer} from '../../src/arm-lesson.ts';
import {patrolJava,patrolReference,patrolExtra,patrolTransfer} from '../../src/patrol-lesson.ts';
test.skip(!process.env.FAMILY_UI_MEMORY,'Local account storage integration; cloud acceptance is separate.');
test('a student unlocks Missions 2–4 with real checked rescues; saved completion survives a new device and stays separate from a sibling',async({page,browser})=>{
 test.setTimeout(90000);
 await page.request.post('/__test/newday');await parentEmail(page,'progression-parent@example.test',true);
 const codes=await addStudents(page,['Pilot A','Pilot B']);
 await page.locator('#family-logout').click();await page.locator('[data-mode=student]').click();await page.locator('#access-code').fill(codes[0]);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.locator('#profile-label')).toContainText('Pilot A');await page.getByRole('button',{name:'Close family progress'}).click();
 await page.locator('#lesson').selectOption('L04');await page.locator('#language').selectOption('java');await page.locator('#verify-cloud').click();await expect(page.locator('#save-help')).toContainText('Check all three Mission 3 rescues');
 await page.locator('#lesson').selectOption('L02');await page.locator('#language').selectOption('java');await page.locator('#code').fill(sensorReference.java);await page.locator('#verify-cloud').click();await expect(page.locator('#save-help')).toContainText('Check all three Mission 1 rescues');
 async function check(target:string,source:string,passed=true){await page.locator('#target').selectOption(target);await page.locator('#code').fill(source);await page.locator('#verify-cloud').click();await expect(page.locator('#save-help')).toContainText(passed?'Rescue checked and saved':'checked program missed');await expect(page.locator('#stop-check')).toBeHidden();}
 await page.locator('#lesson').selectOption('L01');
 const base=javaStarter.replace('turn_ticks = 50','turn_ticks = 100');
 await check('beacon',base);await check('farther',base.replace('turn_ticks = 100','turn_ticks = 150'));await check('reverse',base.replace('motor(0.5)','motor(-0.5)').replace('servo(120)','servo(60)'));
 await page.locator('#curriculum-open').click();await expect(page.locator('[data-lesson="L02"]').locator('..')).toContainText('Available · Mission 2');await page.locator('[data-lesson="L02"]').click();
 await check('sensor-left',sensorJava,false);await check('sensor-left',sensorReference.java);await check('sensor-right',sensorReference.java);await check('sensor-transfer',sensorTransfer.java);
 await page.locator('#save-cloud').click();await expect(page.locator('#save-help')).toContainText('Draft saved');
 await page.locator('#curriculum-open').click();await expect(page.locator('[data-lesson="L03"]').locator('..')).toContainText('Available · Mission 3');await page.locator('[data-lesson="L03"]').click();
 await check('patrol-ridge',patrolJava,false);await check('patrol-ridge',patrolReference.java);await check('patrol-extra',patrolExtra.java);await check('patrol-cove',patrolTransfer.java);
 await page.locator('#save-cloud').click();await expect(page.locator('#save-help')).toContainText('Draft saved');
 await page.locator('#family-open').click();
 await expect(page.getByRole('heading',{name:'Mission 3 · patrol badges'}).locator('xpath=following-sibling::ul[1]').locator('li')).toHaveText(['✓ Ridge sweep','✓ Extra checkpoint','✓ Cove return']);
 await expect(page.getByRole('heading',{name:'Mission 4 · parcel deliveries'}).locator('xpath=following-sibling::ul[1]').locator('li')).toHaveText(['○ Across the guard','○ Moved receiving tray','○ Return delivery']);
 await page.getByRole('button',{name:'Close family progress'}).click();
 await page.locator('#lesson').selectOption('L04');
 await check('parcel-across',armJava,false);await check('parcel-across',armReference.java);await check('parcel-moved',armMoved.java);await check('parcel-return',armTransfer.java);
 await page.locator('#save-cloud').click();await expect(page.locator('#save-help')).toContainText('Draft saved');
 await page.locator('#family-open').click();await expect(page.locator('#family-content')).toContainText('Mission 3 complete');
 await expect(page.getByRole('heading',{name:'Mission 4 · parcel deliveries'}).locator('xpath=following-sibling::ul[1]').locator('li')).toHaveText(['✓ Across the guard','✓ Moved receiving tray','✓ Return delivery']);
 await expect(page.locator('#family-content')).toContainText('Mission 4 complete');
 await expect(page.locator('.family-results article').filter({hasText:'Pilot A'})).toContainText('Mission 2: 3/3 badges');await expect(page.locator('.family-results article').filter({hasText:'Pilot B'})).toContainText('Mission 2: 0/3 badges');await expect(page.locator('.family-results article').filter({hasText:'Pilot A'})).toContainText('Mission 3: 3/3 patrols');await expect(page.locator('.family-results article').filter({hasText:'Pilot A'})).toContainText('Mission 4: 3/3 deliveries');await expect(page.locator('.family-results article').filter({hasText:'Pilot B'})).toContainText('Mission 4: 0/3 deliveries');
 await page.screenshot({path:'test-results-family-ui/mission-02-family-progress.png',fullPage:true});
 const other=await browser.newContext();const device=await other.newPage();
 try{
  await device.goto('/');await device.locator('#family-open').click();await device.locator('[data-mode=student]').click();await device.locator('#access-code').fill(codes[0]);await device.getByRole('button',{name:'Sign in',exact:true}).click();await expect(device.locator('#family-content')).toContainText('Mission 2 complete');await device.getByRole('button',{name:'Close family progress'}).click();
  await device.locator('#lesson').selectOption('L02');await device.locator('#language').selectOption('java');await expect(device.locator('#code')).toHaveValue(sensorTransfer.java);await expect(device.locator('#target')).toHaveValue('sensor-transfer');await device.locator('#lesson').selectOption('L03');await expect(device.locator('#code')).toHaveValue(patrolTransfer.java);await expect(device.locator('#target')).toHaveValue('patrol-cove');await device.locator('#lesson').selectOption('L04');await expect(device.locator('#code')).toHaveValue(armTransfer.java);await expect(device.locator('#target')).toHaveValue('parcel-return');
  await device.locator('#family-open').click();await device.locator('#family-logout').click();await device.locator('[data-mode=student]').click();await device.locator('#access-code').fill(codes[1]);await device.getByRole('button',{name:'Sign in',exact:true}).click();await expect(device.locator('#profile-label')).toContainText('Pilot B');await device.getByRole('button',{name:'Close family progress'}).click();
  await device.locator('#curriculum-open').click();await expect(device.locator('[data-lesson="L02"]').locator('..')).toContainText('checked completion locked');await device.locator('[data-lesson="L02"]').click();await expect(device.locator('#code')).toHaveValue(sensorJava);await device.locator('#lesson').selectOption('L03');await expect(device.locator('#code')).toHaveValue(patrolJava);await expect(device.locator('#target')).toHaveValue('patrol-ridge');await expect(device.locator('#prediction')).toHaveValue('');await device.locator('#verify-cloud').click();await expect(device.locator('#save-help')).toContainText('Check all three Mission 2 rescues');
  // Denied persistence still keeps this profile's newest draft in memory across sign-out/in.
  await device.locator('#family-open').click();await device.locator('#family-logout').click();await device.locator('[data-mode=student]').click();await device.locator('#access-code').fill(codes[0]);await device.getByRole('button',{name:'Sign in',exact:true}).click();await expect(device.locator('#profile-label')).toContainText('Pilot A');await device.getByRole('button',{name:'Close family progress'}).click();
  await device.locator('#lesson').selectOption('L03');await device.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('quota');};});await device.locator('#code').fill('// latest in-memory cove experiment');await device.locator('#prediction').fill('memory note');
  await device.locator('#family-open').click();await device.locator('#family-logout').click();await device.locator('[data-mode=student]').click();await device.locator('#access-code').fill(codes[0]);await device.getByRole('button',{name:'Sign in',exact:true}).click();await expect(device.locator('#profile-label')).toContainText('Pilot A');await device.getByRole('button',{name:'Close family progress'}).click();await device.locator('#lesson').selectOption('L03');await expect(device.locator('#code')).toHaveValue('// latest in-memory cove experiment');await expect(device.locator('#prediction')).toHaveValue('memory note');await expect(device.locator('#target')).toHaveValue('patrol-cove');
 }finally{await other.close();}
});
for(const id of ['L02','L03','L04'])test(`a pending ${id} progress check keeps the visible mission, language and scenario consistent`,async({page})=>{
 await page.request.post('/__test/newday');await parentEmail(page,`navigation-${id.toLowerCase()}@example.test`,true);await page.getByRole('button',{name:'Close family progress'}).click();
 await page.locator('#lesson').selectOption(id);
 const scene=({L02:{first:'sensor-left',next:'sensor-transfer',job:'starts at 30°',angle:'30.0°',nextAngle:'-30.0°'},L03:{first:'patrol-ridge',next:'patrol-cove',job:'rangers',angle:'-90.0°',nextAngle:'90.0°'},L04:{first:'parcel-across',next:'parcel-return',job:'dispatch worker',angle:'30.0°',nextAngle:'150.0°'}} as const)[id as 'L02'|'L03'|'L04'];
 // Hold only the response to exercise navigation during an in-flight check.
 // This fixture makes no runtime or completion claim.
 let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/api/family/verify',async route=>{await gate;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({outcome:'missed'})});});
 try{
  await page.locator('#verify-cloud').click();await expect(page.locator('#stop-check')).toBeVisible();
  await page.locator('#target').selectOption(scene.next);await expect(page.locator('#target')).toHaveValue(scene.first);
  await expect(page.locator('#mission-job')).toContainText(scene.job);await expect(page.locator('#pointer-value')).toHaveText(scene.angle);
  await expect(page.locator('#feedback')).toContainText('Stop the check before changing rescues');
  await page.locator('#language').selectOption('java');await expect(page.locator('#language')).toHaveValue('python');
  await page.locator('#lesson').selectOption('L01');await expect(page.locator('#lesson')).toHaveValue(id);
 }finally{release();}
 await expect(page.locator('#stop-check')).toBeHidden();await page.locator('#target').selectOption(scene.next);await expect(page.locator('#pointer-value')).toHaveText(scene.nextAngle);
});
test('mission/language drafts sync independently, past experiments restore safely, and a second device resumes',async({page,browser})=>{
 await page.request.post('/__test/newday');await parentEmail(page,'draft-parent@example.test',true);const [code]=await addStudents(page,['Mission student']);await page.locator('#family-logout').click();await studentCode(page,code);await page.getByRole('button',{name:'Close family progress'}).click();
 for(const id of ['L01','L02','L03','L04'])for(const lang of ['python','java']){
  await page.locator('#lesson').selectOption(id);await page.locator('#language').selectOption(lang);await page.locator('#target').selectOption(({L01:'reverse',L02:'sensor-transfer',L03:'patrol-cove',L04:'parcel-return'} as Record<string,string>)[id]);await page.locator('#code').fill(`${id} ${lang} saved`);await page.locator('#save-cloud').click();await expect(page.locator('#save-help')).toContainText('Draft saved');
 }
 const profile=await page.locator('html').getAttribute('data-profile');
 const response=await page.request.post('/api/family/attempt',{headers:{Origin:'http://127.0.0.1:4473','X-RoboLab-Profile':profile!},data:{id:crypto.randomUUID(),source:'# older sensor experiment',language:'python',target:'sensor-right',outcome:'missed',seconds:1}});expect(response.status()).toBe(200);
 await page.locator('#lesson').selectOption('L01');await page.locator('#code').fill('latest mission one java');await page.locator('#family-open').click();await page.locator('#family-refresh').click();await expect(page.locator('[data-history]')).toHaveCount(1);await page.locator('[data-history]').click();
 await expect(page.locator('#lesson')).toHaveValue('L02');await expect(page.locator('#target')).toHaveValue('sensor-right');await expect(page.locator('#code')).toHaveValue('# older sensor experiment');await expect(page.locator('#status-pill')).toHaveText('READY');
 await page.locator('#save-cloud').click();await expect(page.locator('#save-help')).toContainText('Draft saved');
 const other=await browser.newContext();const device=await other.newPage();await device.goto('/');await device.locator('#family-open').click();await device.locator('[data-mode=student]').click();await device.locator('#access-code').fill(code);await device.getByRole('button',{name:'Sign in',exact:true}).click();await expect(device.locator('#profile-label')).toContainText('Mission student');await device.getByRole('button',{name:'Close family progress'}).click();
 await device.locator('#language').selectOption('java');await expect(device.locator('#code')).toHaveValue('latest mission one java');await device.locator('#lesson').selectOption('L02');await expect(device.locator('#code')).toHaveValue('L02 java saved');await device.locator('#language').selectOption('python');await expect(device.locator('#code')).toHaveValue('# older sensor experiment');await expect(device.locator('#target')).toHaveValue('sensor-right');await device.locator('#lesson').selectOption('L03');await expect(device.locator('#code')).toHaveValue('L03 python saved');await device.locator('#language').selectOption('java');await expect(device.locator('#code')).toHaveValue('L03 java saved');await device.locator('#lesson').selectOption('L04');await expect(device.locator('#code')).toHaveValue('L04 java saved');await expect(device.locator('#target')).toHaveValue('parcel-return');await device.locator('#language').selectOption('python');await expect(device.locator('#code')).toHaveValue('L04 python saved');await expect(device.locator('#target')).toHaveValue('parcel-return');
 await device.locator('#curriculum-open').click();await expect(device.locator('[data-lesson="L02"]').locator('..')).toContainText('checked completion locked');await expect(device.locator('[data-lesson="L03"]').locator('..')).toContainText('checked completion locked');await expect(device.locator('[data-lesson="L04"]').locator('..')).toContainText('checked completion locked');await expect(device.locator('[data-lesson="L05"]')).toHaveCount(0);await other.close();
});
