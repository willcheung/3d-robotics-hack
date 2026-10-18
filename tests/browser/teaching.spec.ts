import {openMission,readHints} from '../learning-ui.ts';
import {test,expect} from '../workshop-fixture.ts';
import {getLesson} from '../../src/lessons.ts';
test.use({checkedMissions:['L01','L02','L03']});
test('each mission and language keeps its challenge and a recoverable draft without note forms',async({page})=>{
 await page.goto('/');await expect(page.locator('#experiment-notes,[data-note],#prediction,#reflection')).toHaveCount(0);
 for(const id of ['L01','L02','L03','L04'] as const)for(const lang of ['python','java'] as const){
  await openMission(page,id);await page.locator('#language').selectOption(lang);await page.locator('#find-edit').click();
  const selection=await page.locator('#code').evaluate((node:HTMLTextAreaElement)=>node.value.slice(node.selectionStart,node.selectionEnd));expect(selection).toContain(id==='L01'?'turn_ticks':id==='L02'?'if':id==='L04'?'lift_ticks':'repeats');
  const target=getLesson(id).transferTarget;await page.locator('#target').selectOption(target);const source=`${lang==='python'?'#':'//'} my ${id} ${lang} experiment`;await page.locator('#code').fill(source);
  await page.reload();await expect(page.locator('#target')).toHaveValue(target);await expect(page.locator('#code')).toHaveValue(source);
  await page.locator('#restore').click();await page.locator('#restore').click();await page.reload();await page.locator('#return-draft').click();await expect(page.locator('#code')).toHaveValue(source);await expect(page.locator('#target')).toHaveValue(target);await readHints(page,1);
 }
 for(const id of ['L01','L02','L03','L04'] as const)for(const lang of ['python','java'] as const){await openMission(page,id);await page.locator('#language').selectOption(lang);await expect(page.locator('#target')).toHaveValue(getLesson(id).transferTarget);await expect(page.locator('#code')).toHaveValue(`${lang==='python'?'#':'//'} my ${id} ${lang} experiment`);}
});
test('legacy notes stay preserved, and denied storage still keeps a return copy in this tab',async({page})=>{
 await page.goto('/');await page.evaluate(()=>{const key='robolab.profile.workshop-fixture.python.experiment';const old=JSON.parse(localStorage.getItem(key)!);old.prediction='<img src=x onerror=alert(1)>';old.reflection='Earlier thinking';localStorage.setItem(key,JSON.stringify(old));});await page.reload();await page.locator('#code').fill('# new code');await page.locator('#target').selectOption('reverse');await page.locator('#restore').click();await page.locator('#return-draft').click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('robolab.profile.workshop-fixture.python.experiment')!).prediction)).toBe('<img src=x onerror=alert(1)>');await expect(page.locator('#experiment-notes,#lesson-coach')).toHaveCount(0);
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('quota');};});await page.locator('#code').fill('# own draft');await page.locator('#restore').click();await openMission(page,'L02');await openMission(page,'L01');await page.locator('#return-draft').click();await expect(page.locator('#code')).toHaveValue('# own draft');await expect(page.locator('#target')).toHaveValue('reverse');await expect(page.locator('#draft-status')).toContainText('this tab only');
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await page.screenshot({path:'test-results/teaching-narrow.png',fullPage:true});
});
