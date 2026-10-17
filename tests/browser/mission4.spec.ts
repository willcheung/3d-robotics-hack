import {openMission,openNotes,openHints,readHints} from '../learning-ui.ts';
import {test,expect,type Page} from '../workshop-fixture.ts';
import {armReference,armMoved,armTransfer} from '../../src/arm-lesson.ts';
async function run(page:Page,source?:string){
 if(source!==undefined)await page.locator('#code').fill(source);
 await page.locator('#run').click();await expect(page.locator('#status-pill')).not.toHaveText('LOADING',{timeout:47000});await expect(page.locator('#status-pill')).toHaveText('FINISHED',{timeout:22000});
}
for(const lang of ['python','java'] as const){
 test(`Mission 4 ${lang}: diagnose the early turn, deliver all three parcels and retain prior worlds`,async({page})=>{
  test.setTimeout(180000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await openMission(page,'L04');await page.locator('#language').selectOption(lang);
  await expect(page.locator('#mission-job')).toContainText('dispatch worker');await expect(page.locator('#arm-progress')).toContainText('Shoulder 30°');await expect(page.locator('#arm-progress')).toContainText('Shoulder 150°');await expect(page.locator('#gripper-label')).toBeVisible();await expect(page.locator('#show-solution')).toBeDisabled();
  await page.locator('#find-edit').click();expect(await page.locator('#code').evaluate((e:HTMLTextAreaElement)=>e.value.slice(e.selectionStart,e.selectionEnd))).toContain('lift_ticks');
  await openNotes(page);await page.locator('#prediction').fill('The target is 70°, but ten ticks only lifts 9° before turning.');
  await run(page);await expect(page.locator('#feedback-title')).toHaveText('The arm hit the guard.');await expect(page.locator('#arm-progress')).toContainText('PARCEL · HELD');await expect(page.locator('#console')).toContainText('Before turn, elbow: 9');await expect(page.locator('#prediction-feedback')).toContainText('guard contact');
  await expect(page.locator('#scanner-target')).toHaveText('commanded 70°');await expect(page.locator('#pointer-target')).toHaveText('commanded 150°');
  await readHints(page);
  await page.locator('#show-solution').click();await expect(page.locator('#solution-explanation')).toContainText('80 ticks');
  await run(page,armReference[lang]);await expect(page.locator('#feedback')).toHaveClass(/success/);await expect(page.locator('#arm-progress')).toContainText('PARCEL · DELIVERED');await expect(page.locator('#console')).toContainText('After closing, holding: 1');await expect(page.locator('#console')).toContainText('After opening, holding: 0');await expect(page.locator('#time-value')).toHaveText('6.40s');
  await page.locator('#top-view').click();await expect(page.locator('#arm-progress')).toContainText('DELIVERED');await page.locator('#view-reset').click();await page.locator('.world-panel').screenshot({path:`test-results/mission-04-${lang}-delivered.png`});
  await page.locator('#next-rescue').click();await expect(page.locator('#code')).toHaveValue(armReference[lang]);await run(page);await expect(page.locator('#feedback-title')).toContainText('released before a safe handoff');await expect(page.locator('#arm-progress')).toContainText('PARCEL · DROPPED');
  await run(page,armMoved[lang]);await expect(page.locator('#feedback')).toHaveClass(/success/);
  await page.locator('#next-rescue').click();await run(page,armTransfer[lang]);await expect(page.locator('#feedback')).toHaveClass(/success/);await expect(page.locator('#practice-progress')).toContainText('3 of 3');await expect(page.locator('#next-help')).toContainText('Check & save progress');await expect(page.locator('#next-lesson')).toBeHidden();
  await page.locator('#reset').click();await expect(page.locator('#arm-progress')).toContainText('PARCEL · WAITING');await expect(page.locator('#pointer-value')).toHaveText('150.0°');await expect(page.locator('#scanner-value')).toHaveText('35.0°');await expect(page.locator('#code')).toHaveValue(armTransfer[lang]);
  await openMission(page,'L01');await expect(page.locator('#arm-progress')).toBeHidden();await expect(page.locator('#gripper-label')).toBeHidden();await expect(page.locator('#pointer-value')).toHaveText('0.0°');await expect(page.locator('#servo-label')).toContainText('tilts');
  await openMission(page,'L03');await expect(page.locator('#patrol-progress')).toBeVisible();await expect(page.locator('#arm-progress')).toBeHidden();
  await openMission(page,'L04');await expect(page.locator('#code')).toHaveValue(armTransfer[lang]);await expect(page.locator('#target')).toHaveValue('parcel-return');expect(errors).toEqual([]);
 });
 test(`Mission 4 ${lang}: empty jaws, early release, errors and Stop recover without losing code`,async({page})=>{
  test.setTimeout(180000);await page.goto('/');await openMission(page,'L04');await page.locator('#language').selectOption(lang);
  const prefix=lang==='python'?'await ':'Robot.',wait=lang==='python'?'wait':'waitTicks';
  const noGrasp=armReference[lang].replace(`${prefix}grip(0)`,`${prefix}grip(100)`);await run(page,noGrasp);await expect(page.locator('#feedback-title')).toContainText('still on its pickup pad');
  const early=armReference[lang].replace(`${prefix}shoulder(destination)`,`${prefix}grip(100)${lang==='java'?';':''}\n${prefix}${wait}(25)${lang==='java'?';':''}\n${prefix}shoulder(destination)`);await run(page,early);await expect(page.locator('#arm-progress')).toContainText('DROPPED');
  const errors=lang==='python'?['from robot import elbow\nawait elbow(True)','from robot import shoulder\nawait shoulder(181)','await = broken']:['public class Main {public static void main(String[] args) throws Exception {Robot.elbow(91);}}','public class Main {broken syntax}'];
  for(const source of errors){await page.locator('#code').fill(source);await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('ERROR',{timeout:47000});await expect(page.locator('#code')).toHaveValue(source);}
  const forever=lang==='python'?'while True: pass':'public class Main {public static void main(String[] args){while(true){}}}';await page.locator('#code').fill(forever);await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('RUNNING',{timeout:47000});await page.locator('#stop').click();await expect(page.locator('#status-pill')).toHaveText('STOPPED');await expect(page.locator('#code')).toHaveValue(forever);
  await run(page,armReference[lang]);await expect(page.locator('#feedback')).toHaveClass(/success/);
  await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('RUNNING',{timeout:47000});await page.locator('#reset').click();await expect(page.locator('#status-pill')).toHaveText('READY');await expect(page.locator('#arm-progress')).toContainText('WAITING');await expect(page.locator('#code')).toHaveValue(armReference[lang]);
 });
}
test('Parcel Port narrow layout, keyboard camera, eight local contexts and WebGL fallback',async({page})=>{
 await page.goto('/');await openMission(page,'L04');await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await page.locator('#scene canvas').focus();await page.keyboard.press('ArrowLeft');await page.keyboard.press('Home');await expect(page.locator('#pointer-value')).toHaveText('30.0°');
 await page.locator('.world-panel').screenshot({path:'test-results/mission-04-narrow-scene.png'});await page.locator('#code-panel').screenshot({path:'test-results/mission-04-narrow-code.png'});await openNotes(page);await page.locator('#lesson-coach').screenshot({path:'test-results/mission-04-narrow-coach.png'});
 await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type:string,...args:unknown[]){if(type.includes('webgl'))return null;return (original as Function).apply(this,[type,...args]);} as typeof original;});
 await page.reload();await expect(page.locator('.webgl-warning')).toBeVisible();await expect(page.locator('#arm-progress')).toContainText('WAITING');await expect(page.locator('#value-guide')).toContainText('0..100 millimetres');
});

// Existing checked prerequisites are a UI fixture; real progression is tested in family-ui.
test.use({checkedMissions:['L01', 'L02', 'L03']});
