import {openMission,openHints,readHints,openCommands} from '../learning-ui.ts';
import {test,expect,type Page} from '../workshop-fixture.ts';
import {patrolReference,patrolExtra,patrolTransfer} from '../../src/patrol-lesson.ts';
async function run(page:Page,source?:string){
 if(source!==undefined)await page.locator('#code').fill(source);
 await page.locator('#run').click();
 // Startup and execution have separate product deadlines.
 await expect(page.locator('#status-pill')).not.toHaveText('LOADING',{timeout:47000});
 await expect(page.locator('#status-pill')).toHaveText('FINISHED',{timeout:22000});
 // Explicit fixture check after successful practice; real server scoring is covered by family-ui.
 if((await page.locator('#feedback').getAttribute('class'))?.split(' ').includes('success')){await page.locator('#verify-cloud').click();await expect(page.locator('#stop-check')).toBeHidden();}
}
for(const lang of ['python','java'] as const){
 test(`Mission 3 ${lang}: starter to all patrols, hints, actual stops, camera and reset`,async({page})=>{
  test.setTimeout(180000);
  await page.goto('/');await openMission(page,'L03');await page.locator('#language').selectOption(lang);
  await expect(page.locator('#mission-job')).toContainText('rangers');await expect(page.locator('.real-world')).toContainText('inspection camera');await expect(page.locator('#value-guide')).toContainText('25 consecutive ticks');
  await expect(page.locator('#code')).toHaveValue(/repeats = 1/);await expect(page.locator('#show-solution')).toBeDisabled();
  await readHints(page);
  await run(page);await expect(page.locator('#feedback')).not.toHaveClass(/success/);await expect(page.locator('#patrol-progress')).toContainText('1 of 3');await expect(page.locator('#console')).toContainText('Repeat 1 stopped at -30');await expect(page.locator('#console')).not.toContainText('Repeat 2');
  await page.locator('#show-solution').click();await expect(page.locator('#solution-explanation')).toBeVisible();await expect(page.locator('#practice-progress')).toContainText('0 of 3');
  await run(page,patrolReference[lang]);await expect(page.locator('#feedback')).toHaveClass(/success/);await expect(page.locator('#patrol-progress .logged')).toHaveCount(3);await expect(page.locator('#console')).toContainText('Repeat 3 stopped at 90');await expect(page.locator('#time-value')).toHaveText('7.50s');
  await page.locator('#top-view').click();await expect(page.locator('#patrol-progress .logged')).toHaveCount(3);await expect(page.locator('#pointer-value')).toHaveText('90.0°');await page.locator('#view-reset').click();
  await page.screenshot({path:`test-results/mission-03-${lang}.png`,fullPage:true});await page.locator('.world-panel').screenshot({path:`test-results/mission-03-${lang}-scene.png`});
  await page.locator('#next-rescue').click();await expect(page.locator('#code')).toHaveValue(patrolReference[lang]);await expect(page.locator('#patrol-progress .logged')).toHaveCount(0);
  await run(page);await expect(page.locator('#feedback')).not.toHaveClass(/success/);await expect(page.locator('#patrol-progress .logged')).toHaveCount(0);
  await run(page,patrolExtra[lang]);await expect(page.locator('#feedback')).toHaveClass(/success/);await expect(page.locator('#patrol-progress .logged')).toHaveCount(4);await expect(page.locator('#time-value')).toHaveText('8.00s');
  await page.locator('#next-rescue').click();await run(page,patrolTransfer[lang]);await expect(page.locator('#feedback')).toHaveClass(/success/);await expect(page.locator('#pointer-value')).toHaveText('-90.0°');await expect(page.locator('#scanner-value')).toHaveText('60.0°');await expect(page.locator('#practice-progress')).toContainText('3 of 3');await expect(page.locator('#next-help')).toContainText('Mission');await expect(page.locator('#next-lesson')).toBeVisible();await page.locator('.world-panel').screenshot({path:`test-results/mission-03-${lang}-cove.png`});
  await page.locator('#reset').click();await expect(page.locator('#patrol-progress .logged')).toHaveCount(0);await expect(page.locator('#pointer-value')).toHaveText('90.0°');await expect(page.locator('#code')).toHaveValue(patrolTransfer[lang]);
  await openMission(page,'L01');await expect(page.locator('#patrol-progress')).toBeHidden();await expect(page.locator('#pointer-value')).toHaveText('0.0°');await openMission(page,'L03');await expect(page.locator('#code')).toHaveValue(patrolTransfer[lang]);
 });
 test(`Mission 3 ${lang}: invalid input, too few/excess loops, Stop and reset preserve drafts`,async({page})=>{
  test.setTimeout(180000);
  await page.goto('/');await openMission(page,'L03');await page.locator('#language').selectOption(lang);
  for(const n of [0,2,4]){await run(page,patrolReference[lang].replace('repeats = 3',`repeats = ${n}`));await expect(page.locator('#feedback')).not.toHaveClass(/success/);if(n===4){await expect(page.locator('#feedback-title')).toHaveText('All checkpoints logged. Check the final stop.');await expect(page.locator('#feedback')).toContainText('150.0°');}else await expect(page.locator('#feedback-title')).toHaveText('Some checkpoints still need light.');}
  await run(page,patrolReference[lang].replace(lang==='python'?'await wait(25)':'Robot.waitTicks(25)',lang==='python'?'await wait(10)':'Robot.waitTicks(10)'));await expect(page.locator('#feedback')).toContainText('10/25 ticks');await expect(page.locator('#patrol-progress .logged')).toHaveCount(0);
  const broken=lang==='python'?'for checkpoint in range(3)\n    pass':'public class Main { broken syntax }';
  for(const source of [broken,patrolReference[lang].replace('power = 0.5','power = 2')]){await page.locator('#code').fill(source);await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('ERROR',{timeout:47000});await expect(page.locator('#code')).toHaveValue(source);await expect(page.locator('#practice-progress')).toContainText('0 of 3');}
  const forever=lang==='python'?'while True: pass':'public class Main {public static void main(String[] args){while(true){}}}';
  await page.locator('#code').fill(forever);await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('RUNNING',{timeout:47000});await page.locator('#stop').click();await expect(page.locator('#status-pill')).toHaveText('STOPPED');await expect(page.locator('#patrol-progress .logged')).toHaveCount(0);
  await page.locator('#code').fill(patrolReference[lang]);await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('RUNNING',{timeout:47000});await page.locator('#reset').click();await expect(page.locator('#status-pill')).toHaveText('READY');await expect(page.locator('#patrol-progress .logged')).toHaveCount(0);await expect(page.locator('#code')).toHaveValue(patrolReference[lang]);
  await run(page);await expect(page.locator('#feedback')).toHaveClass(/success/);
 });
}
test('six local drafts, curriculum, reload and narrow fallback retain all missions',async({page})=>{
 await page.goto('/');for(const id of ['L01','L02','L03'])for(const lang of ['python','java']){await openMission(page,id);await page.locator('#language').selectOption(lang);await page.locator('#code').fill(`${lang==='python'?'#':'//'} ${id} ${lang} draft`);}
 await page.reload();await expect(page.locator('html')).toHaveAttribute('data-current-mission','L03');
 for(const id of ['L01','L02','L03'])for(const lang of ['python','java']){await openMission(page,id);await page.locator('#language').selectOption(lang);await expect(page.locator('#code')).toHaveValue(`${lang==='python'?'#':'//'} ${id} ${lang} draft`);}
 await page.locator('#curriculum-open').click();await expect(page.locator('[data-lesson="L03"]')).toBeVisible();await expect(page.locator('[data-lesson="L04"]')).toBeVisible();await page.locator('[data-lesson="L03"]').click();
 await page.locator('#code').fill(patrolReference.java);await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await page.screenshot({path:'test-results/mission-03-narrow.png',fullPage:true});await page.locator('.world-panel').screenshot({path:'test-results/mission-03-narrow-scene.png'});
 await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type:string,...args:unknown[]){if(type.includes('webgl'))return null;return (original as Function).apply(this,[type,...args]);} as typeof original;});
 await page.reload();await expect(page.locator('.webgl-warning')).toBeVisible();await expect(page.locator('#patrol-progress')).toContainText('0 of 3');await expect(page.locator('#code')).toHaveValue(patrolReference.java);await openCommands(page);await expect(page.locator('#value-guide')).toBeVisible();
});

// Existing checked prerequisites are a UI fixture; real progression is tested in family-ui.
test.use({checkedMissions:['L01', 'L02']});
