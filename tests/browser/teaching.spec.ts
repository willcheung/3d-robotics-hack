import {openMission,openNotes,openHints} from '../learning-ui.ts';
import {test,expect} from '../workshop-fixture.ts';
import {getLesson} from '../../src/lessons.ts';
test('each mission and language keeps its experiment context and a recoverable draft',async({page})=>{
 await page.goto('/');
 for(const id of ['L01','L02','L03','L04'] as const)for(const lang of ['python','java'] as const){
  await openMission(page,id);await page.locator('#language').selectOption(lang);
  await page.locator('#find-edit').click();
  const selection=await page.locator('#code').evaluate((node:HTMLTextAreaElement)=>node.value.slice(node.selectionStart,node.selectionEnd));
  expect(selection).toContain(id==='L01'?'turn_ticks':id==='L02'?'if':id==='L04'?'lift_ticks':'repeats');
  const target=getLesson(id).transferTarget;await page.locator('#target').selectOption(target);
  const source=`${lang==='python'?'#':'//'} my ${id} ${lang} experiment`;
  await page.locator('#code').fill(source);await openNotes(page);await page.locator('#prediction').fill('My prediction');await openNotes(page);await page.locator('#reflection').fill('My next change');
  await page.reload();await expect(page.locator('#target')).toHaveValue(target);await expect(page.locator('#code')).toHaveValue(source);await expect(page.locator('#prediction')).toHaveValue('My prediction');await expect(page.locator('#reflection')).toHaveValue('My next change');
  await page.locator('#restore').click();await page.locator('#restore').click();await page.reload();await page.locator('#return-draft').click();await expect(page.locator('#code')).toHaveValue(source);await expect(page.locator('#target')).toHaveValue(target);
  await openHints(page);await page.getByText('Hint 1',{exact:true}).click();await expect(page.getByText('Hint 1',{exact:true}).locator('..').locator('p')).toBeVisible();
 }
 // Switching and reloading restores all eight pairs, including the case, not just source.
 for(const id of ['L01','L02','L03','L04'] as const)for(const lang of ['python','java'] as const){
  await openMission(page,id);await page.locator('#language').selectOption(lang);await expect(page.locator('#target')).toHaveValue(getLesson(id).transferTarget);await expect(page.locator('#code')).toHaveValue(`${lang==='python'?'#':'//'} my ${id} ${lang} experiment`);
 }
});
test('notes are rendered as text and storage denial preserves a return copy in the tab',async({page})=>{
 await page.goto('/');await openNotes(page);await page.locator('#prediction').fill('<img src=x onerror=alert(1)>');await page.reload();await expect(page.locator('#prediction')).toHaveValue('<img src=x onerror=alert(1)>');await expect(page.locator('#lesson-coach img')).toHaveCount(0);await page.locator('#code').fill("print('note check')");await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('FINISHED');await expect(page.locator('#prediction-feedback')).toContainText('<img src=x onerror=alert(1)>');await expect(page.locator('#lesson-coach img')).toHaveCount(0);await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('quota');};});
 await page.locator('#target').selectOption('reverse');await page.locator('#code').fill('# own draft');await openNotes(page);await page.locator('#prediction').fill('<img src=x onerror=alert(1)>');
 await page.locator('#restore').click();await openMission(page,'L02');await openMission(page,'L01');await page.locator('#return-draft').click();await expect(page.locator('#code')).toHaveValue('# own draft');await expect(page.locator('#target')).toHaveValue('reverse');await expect(page.locator('#draft-status')).toContainText('this tab only');
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await page.screenshot({path:'test-results/teaching-narrow.png',fullPage:true});
});

// Existing checked prerequisites are a UI fixture; real progression is tested in family-ui.
test.use({checkedMissions:['L01', 'L02', 'L03']});
