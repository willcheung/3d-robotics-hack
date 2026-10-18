import {openMission,readHints,openSignIn} from '../learning-ui.ts';
import {fixtureParent} from '../helpers/fixture-parent.ts';
import {test,expect,type BrowserContext,type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {del} from '@vercel/blob';
import {BlobStore,provision,login,familyPath,addStudent} from '../../server/family-store.mjs';
import {getLesson,sensorReference,sensorTransfer} from '../../src/lessons.ts';
import {patrolReference,patrolExtra,patrolTransfer} from '../../src/patrol-lesson.ts';
import {armReference,armMoved,armTransfer} from '../../src/arm-lesson.ts';
import {lessonTargets} from '../../src/model.ts';

// Explicit opt-in: these checks consume existing hosted-run quotas and create
// disposable private records. They do not exercise email delivery or reset quotas.
test.skip(process.env.HOSTED_RELEASE_ACCEPTANCE!=='1','Requires authorized live release acceptance.');
test.use({actionTimeout:30000});
const origin=process.env.HOSTED_APP_ORIGIN!;
const bypass=process.env.HOSTED_BYPASS_FILE?JSON.parse(readFileSync(process.env.HOSTED_BYPASS_FILE,'utf8')).bypassSecret:undefined;
const headers=bypass?{'x-vercel-protection-bypass':bypass}:{};
const paths=new Set<string>();
async function protect(context:BrowserContext){
 if(bypass)await context.route(url=>url.origin===origin,route=>route.continue({headers:{...route.request().headers(),...headers}}));
}
async function signIn(page:Page,code:string,name:string){
 await page.goto(origin);await openSignIn(page,'student');
 await page.locator('#access-code').fill(code);await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page.locator('#profile-label')).toContainText(name);await page.getByRole('button',{name:'Close family progress'}).click();
}
async function run(page:Page,source:string,passed:boolean){
 await page.locator('#code').fill(source);await page.locator('#run').click();
 await expect(page.locator('#status-pill')).toHaveText('FINISHED',{timeout:70000});
 if(passed)await expect(page.locator('#feedback')).toHaveClass(/success/);else await expect(page.locator('#feedback')).not.toHaveClass(/success/);
}
async function confirmed(page:Page,target:string){
 await page.locator('#verify-cloud').click();
 await expect.poll(async()=>(await (await page.request.get(origin+'/api/family',{headers})).json()).completed,{timeout:80000}).toContain(target);await expect(page.locator('#stop-check')).toBeHidden();
}
test.afterAll(async()=>{if(paths.size)await del([...paths]);});
test('hosted Missions 1–4: both runtimes, checked unlocks, recovery and eight saved experiments on a new device',async({browser})=>{
 test.setTimeout(900000);expect(origin).toMatch(/^https:\/\//);
 const store=new BlobStore(),write=store.write.bind(store);
 store.write=async(path:string,...args:unknown[])=>{paths.add(path);return write(path,...args);};
 const parent=await provision(store,{parentName:'Release parent'});
 const parentContext=await browser.newContext();await protect(parentContext);const parentPage=await parentContext.newPage();
 await fixtureParent(parentContext,store,parent.code,origin);
 const cards:{code:string;name:string}[]=[];
 for(const name of ['Release Python','Release Java']){const card=await addStudent(store,await login(store,parent.code),name);cards.push({code:card.code,name});}
 await parentPage.goto(origin);await parentPage.locator('#family-open').click();
 const parentSession=await login(store,parent.code);paths.add(familyPath(parentSession.familyId));
 for(const [index,language] of (['python','java'] as const).entries()){
  const context=await browser.newContext({viewport:{width:1440,height:1050}});await protect(context);const page=await context.newPage();
  await signIn(page,cards[index].code,cards[index].name);await page.locator('#language').selectOption(language);
  const family=async()=>{const r=await page.request.get(origin+'/api/family',{headers});expect(r.status()).toBe(200);return r.json();};
  expect((await family()).completed).toEqual([]);expect((await family()).drafts).toEqual({});
  await openMission(page,'L03');await expect(page.locator('#run')).toBeDisabled();await expect(page.locator('#code')).not.toBeEditable();await expect(page.locator('#unlock-help')).toContainText('Mission 1');
  await openMission(page,'L04');await expect(page.locator('#run')).toBeDisabled();await expect(page.locator('#code')).not.toBeEditable();
  for(const id of ['L01','L02','L03','L04'] as const){
   const lesson=getLesson(id);await openMission(page,id);await page.locator('#target').selectOption(lessonTargets[id][0]);
   await page.locator('#find-edit').click();const selected=await page.locator('#code').evaluate((el:HTMLTextAreaElement)=>el.value.slice(el.selectionStart,el.selectionEnd));
   expect(selected).toContain(id==='L01'?'turn_ticks':id==='L02'?'if':id==='L03'?'repeats':'lift_ticks');
   await run(page,lesson.starters[language],false);await expect(page.locator('#experiment-notes')).toHaveCount(0);
   await readHints(page);
   await page.locator('#show-solution').click();await expect(page.locator('#solution-explanation')).toBeVisible();
   const refs=id==='L01'?[lesson.reference[language],lesson.reference[language].replace('turn_ticks = 100','turn_ticks = 150'),lesson.transferReference[language]]:id==='L02'?[sensorReference[language],sensorReference[language],sensorTransfer[language]]:id==='L03'?[patrolReference[language],patrolExtra[language],patrolTransfer[language]]:[armReference[language],armMoved[language],armTransfer[language]];
   for(const [n,target] of lessonTargets[id].entries()){
    await page.locator('#target').selectOption(target);await run(page,refs[n],true);
    if(n===2)await page.locator('.world-panel').screenshot({path:test.info().outputPath(`${id}-${language}-completed.png`)});
    await confirmed(page,target);
   }
   await expect(page.locator('#save-help')).toContainText('Saved to your account');
   await page.screenshot({path:test.info().outputPath(`${id}-${language}.png`),fullPage:true});
   console.log(`${language} ${id}: starter miss, three successful practice runs and checked challenges passed.`);
  }
  expect((await family()).completed).toHaveLength(12);expect((await family()).recoveryEmail).toBeUndefined();
  await page.locator('#reset').click();await expect(page.locator('#pointer-value')).toHaveText('150.0°');
  await page.locator('#code').fill(language==='python'?'if :':'public class Main { broken syntax }');await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('ERROR',{timeout:70000});
  await page.locator('#code').fill(language==='python'?'while True: pass':'public class Main { public static void main(String[] args) { while(true) {} } }');await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('RUNNING',{timeout:50000});await page.locator('#stop').click();await expect(page.locator('#status-pill')).toHaveText('STOPPED');
  await expect.poll(async()=>(await family()).runBusy,{timeout:30000}).toBe(false);await run(page,armTransfer[language],true);
  // Save all eight lesson/language contexts independently, preserving the case.
  const saved=new Map<string,string>();
  for(const id of ['L01','L02','L03','L04'] as const)for(const lang of ['python','java'] as const){
   await openMission(page,id);await page.locator('#language').selectOption(lang);await page.locator('#target').selectOption(getLesson(id).transferTarget);
   const source=getLesson(id).transferReference[lang]+`\n${lang==='python'?'#':'//'} ${cards[index].name} ${id} ${lang} saved`;
   saved.set(id+lang,source);await page.locator('#code').fill(source);await expect(page.locator('#save-help')).toContainText('Saved to your account');
  }
  await page.reload();await expect(page.locator('#code')).toHaveValue(saved.get('L04java')!);
  await page.locator('#restore').click();await page.locator('#restore').click();await page.reload();await page.locator('#return-draft').click();await expect(page.locator('#code')).toHaveValue(saved.get('L04java')!);await expect(page.locator('#target')).toHaveValue('parcel-return');await expect(page.locator('#save-help')).toContainText('Saved to your account');
  const fresh=await browser.newContext();await protect(fresh);const resume=await fresh.newPage();await signIn(resume,cards[index].code,cards[index].name);
  for(const id of ['L01','L02','L03','L04'] as const)for(const lang of ['python','java'] as const){
   await openMission(resume,id);await resume.locator('#language').selectOption(lang);await expect(resume.locator('#code')).toHaveValue(saved.get(id+lang)!);await expect(resume.locator('#target')).toHaveValue(getLesson(id).transferTarget);await expect(resume.locator('#experiment-notes')).toHaveCount(0);
  }
  await resume.locator('#family-open').click();await expect(resume.locator('#family-content > .mission-progress').last()).toContainText('✓ Complete');await resume.getByRole('button',{name:'Close family progress'}).click();
  await resume.setViewportSize({width:390,height:844});expect(await resume.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await resume.screenshot({path:test.info().outputPath(`${language}-resume-narrow.png`),fullPage:true});
  await fresh.close();await context.close();
  console.log(`${language}: errors, Stop/retry, all eight saved code/challenge pairs, restore and fresh-device resume passed.`);
 }
 await parentPage.locator('#family-refresh').click();await expect(parentPage.locator('.family-results article')).toHaveCount(2);
 for(const card of cards)await expect(parentPage.locator('.family-results article').filter({hasText:card.name})).toContainText('4 of 4 missions complete');
 await parentContext.close();
});
