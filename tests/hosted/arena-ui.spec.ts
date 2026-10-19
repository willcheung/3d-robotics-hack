import {test,expect,type Page} from '@playwright/test';
import {parentEmail,addStudents,studentCode} from '../helpers/email-ui.ts';
import {getLesson} from '../../src/lessons.ts';
test.skip(!process.env.FAMILY_UI_MEMORY,'Local disposable families only.');
const state=(page:Page)=>page.request.get('/api/family').then(r=>r.json());
async function score(page:Page,source:string){await page.locator('#code').fill(source);await page.locator('#verify-cloud').click();await expect(page.locator('#stop-check')).toBeHidden({timeout:60000});await expect(page.locator('#progress-sync')).toContainText('Challenge complete');}
test('parents earn the same mission badge, keep their own drafts, and compete with students',async({page,browser})=>{
 test.setTimeout(150000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.request.post('/__test/newday');await parentEmail(page,'arena-parent@example.test',true);
 await expect(page.locator('.arena-board tbody tr')).toHaveCount(1);await expect(page.locator('.arena-you')).toContainText('Parent');await expect(page.locator('.arena-you')).toContainText('Not ranked yet');
 const [code]=await addStudents(page,['Nova','Pixel']);await page.getByRole('button',{name:'Close family progress'}).click();await page.locator('#language').selectOption('java');
 for(const [target,source] of [['beacon',getLesson('L01').reference.java],['farther',getLesson('L01').reference.java.replace('turn_ticks = 100','turn_ticks = 150')],['reverse',getLesson('L01').transferReference.java]]){
  await page.locator('#target').selectOption(target);await score(page,source);
 }
 expect((await state(page)).arena.points).toBe(500);await expect(page.locator('#progress-sync')).toContainText('Mission badge earned · +200 bonus');
 const parentDraft=await page.locator('#code').inputValue();await page.locator('#family-open').click();await expect(page.locator('.arena-you .arena-points')).toHaveText('500');await expect(page.locator('.arena-badge.earned')).toHaveCount(1);
 await page.locator('.family-arena').evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:'test-results-family-ui/arena-parent-desktop.png',mask:[page.locator('#setup-receipt'),page.locator('#email-verification-notice'),page.locator('#parent-onboarding')]});
 await page.locator('.arena-admin>summary').click();await page.locator('.family-results article').filter({hasText:'Nova'}).getByText('View Nova’s progress',{exact:true}).click();await page.getByRole('button',{name:'Close family progress'}).click();await expect(page.locator('#code')).toHaveValue(parentDraft);
 const ctx=await browser.newContext();try{
  const child=await ctx.newPage();await studentCode(child,code);await expect(child.locator('.arena-admin')).toHaveCount(0);await expect(child.locator('.arena-board tbody tr')).toHaveCount(3);
  await child.getByRole('button',{name:'Close family progress'}).click();await child.locator('#language').selectOption('python');await child.locator('#code').fill(getLesson('L01').reference.python);await child.locator('#run').click();await expect(child.locator('#status-pill')).toHaveText('FINISHED',{timeout:60000});
  expect((await state(child)).arena.points).toBe(0);expect((await state(child)).completed).toEqual([]);await expect(child.locator('#score-guide')).toContainText('Run is free practice');
  await score(child,getLesson('L01').reference.python);expect((await state(child)).arena.points).toBe(100);
  await child.locator('#family-open').click();await expect(child.locator('.arena-you')).toContainText('Nova');await expect(child.locator('.arena-you .arena-rank')).toHaveText('#2');
  await child.setViewportSize({width:390,height:844});await child.locator('.family-arena').evaluate(e=>e.scrollIntoView({block:'start'}));await child.screenshot({path:'test-results-family-ui/arena-student-narrow.png'});
  expect(await child.locator('#family-dialog').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
  await child.locator('.arena-details>summary').click();await expect(child.locator('.arena-details')).toContainText('1 scored check');
  await child.reload();await child.locator('#family-open').click();await expect(child.locator('.arena-you .arena-points')).toHaveText('100');
 }finally{await ctx.close();}
 expect(errors).toEqual([]);
});
test('eleventh checked success earns 90, legacy parent progress stays private and ties remain shared',async({page})=>{
 test.setTimeout(90000);await page.request.post('/__test/newday');await parentEmail(page,'arena-band@example.test',true);const [code]=await addStudents(page,['Band pilot']);await page.locator('#family-logout').click();await studentCode(page,code);
 await page.request.post('/__test/arena');await page.locator('#family-refresh').click();await expect(page.locator('.arena-board')).toContainText('500');await expect(page.locator('.arena-own .arena-total')).toContainText('0');
 await page.getByRole('button',{name:'Close family progress'}).click();await expect(page.locator('#score-guide')).toContainText('10 scored checks · 90 points available');
 await page.locator('#language').selectOption('java');await score(page,getLesson('L01').reference.java);expect((await state(page)).arena.points).toBe(90);
 await page.locator('#family-open').click();await page.locator('.arena-details>summary').click();await expect(page.locator('.arena-details')).toContainText('11 scored checks');await expect(page.locator('.arena-details')).toContainText('90 points earned');
 await page.locator('.arena-rules>summary').click();await expect(page.locator('.arena-rules')).toContainText('checks 1–10');
 await page.keyboard.press('Escape');await expect(page.locator('#family-dialog')).toBeHidden();await page.locator('#code').fill('# keep my saved draft');await expect(page.locator('#save-help')).toContainText('Saved to your account');
 await page.locator('#family-open').click();await page.locator('#arena-continue').click();await expect(page.locator('#code')).toHaveValue('# keep my saved draft');await expect(page.locator('#target')).toHaveValue('farther');
 const data=await state(page);expect(JSON.stringify(data.participants)).not.toContain('recoveryEmail');expect(data.participants.find((p:any)=>p.role==='parent').arena.missions[0].checks).toBeNull();
});
