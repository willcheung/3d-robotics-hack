import {openMission} from '../learning-ui.ts';
import {parentEmail,addStudents,studentCode} from '../helpers/email-ui.ts';
import {test,expect,type Page} from '@playwright/test';
import {getLesson,type Language} from '../../src/lessons.ts';
import {lessonIds,lessonTargets,type LessonId} from '../../src/model.ts';
import {patrolExtra} from '../../src/patrol-lesson.ts';
import {armMoved} from '../../src/arm-lesson.ts';
test.skip(!process.env.FAMILY_UI_MEMORY,'Disposable local accounts and isolated runtimes; providers are a separate gate.');
const sourceFor=(id:LessonId,index:number,language:Language)=>index===2?getLesson(id).transferReference[language]:index===0?getLesson(id).reference[language]:id==='L01'?getLesson(id).reference[language].replace('turn_ticks = 100','turn_ticks = 150'):id==='L03'?patrolExtra[language]:id==='L04'?armMoved[language]:getLesson(id).reference[language];
async function state(page:Page){return (await page.request.get('/api/family')).json();}
async function run(page:Page,source:string){await page.locator('#code').fill(source);await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('FINISHED',{timeout:60000});}
for(const language of ['python','java'] as const)test(`${language}: practice then scored checks complete all four missions and updates the parent, reload and another device`,async({page,browser})=>{
 test.setTimeout(240000);await page.request.post('/__test/newday');await parentEmail(page,`${language}-progress-parent@example.test`,true);const codes=await addStudents(page,['Pilot A','Pilot B']);
 const ctx=await browser.newContext(),child=await ctx.newPage();
 try{
  await studentCode(child,codes[0]);await child.getByRole('button',{name:'Close family progress'}).click();await child.locator('#language').selectOption(language);
  await expect(child.locator('#save-cloud,#experiment-notes,[data-note]')).toHaveCount(0);
  for(const id of lessonIds){
   await openMission(child,id);await expect(child.locator('#code')).toBeEditable();
   await run(child,getLesson(id).wrong[language]);await expect(child.locator('#feedback')).not.toHaveClass(/success/);
   expect((await state(child)).completed.filter((t:string)=>(lessonTargets[id] as readonly string[]).includes(t))).toHaveLength(0);
   for(const [index,target] of lessonTargets[id].entries()){
    await child.locator('#target').selectOption(target);await run(child,sourceFor(id,index,language));await expect(child.locator('#run-explanation')).toBeVisible();
    expect((await state(child)).completed).not.toContain(target);await child.locator('#verify-cloud').click();await expect.poll(async()=>(await state(child)).completed,{timeout:60000}).toContain(target);await expect(child.locator('#practice-badges .earned')).toHaveCount(index+1);await expect(child.locator('#stop-check')).toBeHidden();
    if(id==='L01'&&index===0){await child.reload();await expect(child.locator('#practice-badges .earned')).toHaveCount(1);await expect(child.locator('#code')).toHaveValue(sourceFor(id,index,language));}
   }
   await expect(child.locator('#practice-current')).toHaveText(`Mission ${Number(id.slice(1))} complete`);await expect(child.locator('#practice-progress')).toHaveText('3 of 3 challenges complete');
   await child.locator('#family-open').click();await child.locator('.arena-details>summary').click();await expect(child.locator('.arena-details .mission-progress').nth(lessonIds.indexOf(id)).locator('li')).toHaveText(lessonTargets[id].map(t=>new RegExp('^✓ ')));await child.getByRole('button',{name:'Close family progress'}).click();
   await page.locator('#family-refresh').click();const card=page.locator('.arena-board tbody tr').filter({hasText:'Pilot A'});await expect(card).toContainText(`${lessonIds.indexOf(id)+1} of 4 missions complete`);await expect(page.locator('.arena-board tbody tr').filter({hasText:'Pilot B'})).toContainText('0 of 4 missions complete');
  }
  expect((await state(child)).history.length).toBe(12);expect((await state(child)).students.find((p:any)=>p.name==='Pilot A').experiments).toBe(28);
  await child.locator('#history-open').click();await expect(child.locator('#run-history')).toContainText('Parcel: delivered');await expect(child.locator('#run-history')).toContainText('mm');await child.locator('#run-history details').first().locator('summary').click();await expect(child.locator('.history-code').first()).toHaveText(sourceFor('L04',2,language));await child.locator('#history-close').click();
  await child.screenshot({path:`test-results-family-ui/automatic-${language}-complete.png`,fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:`test-results-family-ui/parent-${language}-progress.png`,fullPage:true});
  const next=await browser.newContext();try{const device=await next.newPage();await studentCode(device,codes[0]);await device.getByRole('button',{name:'Close family progress'}).click();await device.locator('#language').selectOption(language);for(const id of lessonIds){await openMission(device,id);await expect(device.locator('#code')).toHaveValue(sourceFor(id,2,language));await expect(device.locator('#target')).toHaveValue(lessonTargets[id][2]);await expect(device.locator('#practice-badges .earned')).toHaveCount(3);}
   await device.locator('#family-open').click();await device.locator('#family-logout').click();await studentCode(device,codes[1]);await device.getByRole('button',{name:'Close family progress'}).click();await openMission(device,'L04');await expect(device.locator('#code')).not.toBeEditable();await expect(device.locator('#unlock-help')).toContainText('Mission 1');
  }finally{await next.close();}
 }finally{await ctx.close();}
});

test('lost scored reply stays unconfirmed until refresh, preserving the submitted snapshot and draft',async({page})=>{
 test.setTimeout(60000);await page.request.post('/__test/newday');await parentEmail(page,'immutable-parent@example.test',true);const [code]=await addStudents(page,['Immutable pilot']);await page.locator('#family-logout').click();await studentCode(page,code);await page.getByRole('button',{name:'Close family progress'}).click();
 const requests:any[]=[];let release!:()=>void;const held=new Promise<void>(resolve=>release=resolve);
 await page.route('**/api/family/verify',async route=>{requests.push(route.request().postDataJSON());const response=await route.fetch();if(requests.length===1){await held;await route.abort('failed');}else await route.fulfill({response});});
 try{await run(page,getLesson('L01').reference.python);await page.locator('#verify-cloud').click();await expect(page.locator('#stop-check')).toBeVisible();await page.locator('#code').fill('# edit after Run');await page.locator('#target').selectOption('farther');await page.locator('#language').selectOption('java');await expect(page.locator('#target')).toHaveValue('beacon');await expect(page.locator('#run')).toBeDisabled();release();
  await expect(page.locator('#progress-sync')).toContainText('Result not confirmed');expect(requests).toHaveLength(1);expect(requests[0].source).toBe(getLesson('L01').reference.python);expect(requests[0].target).toBe('beacon');await page.locator('#family-open').click();await page.locator('#family-refresh').click();await page.getByRole('button',{name:'Close family progress'}).click();await expect(page.locator('#stop-check')).toBeHidden();
  await page.locator('#language').selectOption('python');await expect(page.locator('#code')).toHaveValue('# edit after Run');await expect(page.locator('#target')).toHaveValue('farther');await expect(page.locator('#practice-badges .earned')).toHaveCount(1);expect((await state(page)).students[0].experiments).toBe(2);
 }finally{release();}
});

test('eight draft/challenge pairs autosave; history restore keeps a return copy and a second device resumes',async({page,browser})=>{
 test.setTimeout(60000);await page.request.post('/__test/newday');await parentEmail(page,'draft-parent@example.test',true);const [code]=await addStudents(page,['Draft pilot']);await page.locator('#family-logout').click();await studentCode(page,code);await page.getByRole('button',{name:'Close family progress'}).click();await page.request.post('/__test/completed');await page.reload();await expect(page.locator('#profile-label')).toContainText('Draft pilot');
 for(const id of lessonIds)for(const language of ['python','java']){await openMission(page,id);await page.locator('#language').selectOption(language);await page.locator('#target').selectOption(lessonTargets[id][2]);await page.locator('#code').fill(`${id} ${language} draft`);await expect(page.locator('#save-help')).toContainText('Saved to your account');}
 const profile=await page.locator('html').getAttribute('data-profile');await page.request.post('/api/family/attempt',{headers:{Origin:'http://127.0.0.1:4473','X-RoboLab-Profile':profile!},data:{id:crypto.randomUUID(),source:'# older sensor values',language:'python',target:'sensor-right',outcome:'missed',seconds:1,output:'<img src=x onerror=alert(1)>',values:{direction:30,tilt:120}}});
 await page.locator('#family-open').click();await page.locator('#family-refresh').click();await page.getByRole('button',{name:'Close family progress'}).click();await page.locator('#history-open').click();await page.locator('#run-history summary').click();await expect(page.locator('#run-history')).toContainText('<img src=x onerror=alert(1)>');await expect(page.locator('#run-history img')).toHaveCount(0);await page.locator('[data-history]').click();await expect(page.locator('#code')).toHaveValue('# older sensor values');await expect(page.locator('#target')).toHaveValue('sensor-right');await expect(page.locator('#status-pill')).toHaveText('READY');await page.locator('#return-draft').click();await expect(page.locator('#code')).toHaveValue('L02 python draft');await expect(page.locator('#target')).toHaveValue('sensor-transfer');await expect(page.locator('#save-help')).toContainText('Saved to your account');
 const next=await browser.newContext();try{const device=await next.newPage();await studentCode(device,code);await device.getByRole('button',{name:'Close family progress'}).click();for(const id of lessonIds)for(const language of ['python','java']){await openMission(device,id);await device.locator('#language').selectOption(language);await expect(device.locator('#code')).toHaveValue(`${id} ${language} draft`);await expect(device.locator('#target')).toHaveValue(lessonTargets[id][2]);}}finally{await next.close();}
});
