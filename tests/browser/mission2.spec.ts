import {test,expect,type Page} from '@playwright/test';
import {sensorReference,sensorTransfer} from '../../src/lessons.ts';
async function run(page:Page,source?:string){if(source!==undefined)await page.locator('#code').fill(source);await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('FINISHED');}
for(const language of ['python','java'] as const){
 test(`Mission 2 ${language}: real starter, prediction, both branches, transfer, badges and reset`,async({page})=>{
  await page.goto('/');await page.locator('#lesson').selectOption('L02');await page.locator('#language').selectOption(language);
  await expect(page.locator('#mission-job')).toContainText('30°');await expect(page.locator('#pointer-value')).toHaveText('30.0°');
  await expect(page.locator('.real-world')).toContainText('robot arm');await expect(page.locator('#value-guide')).not.toContainText('turn_ticks');await expect(page.locator('#value-guide')).toContainText('50 ticks = 1 second');await expect(page.locator('#motor-label')).toContainText('SENSOR · angle()');
  await page.locator('#prediction').fill('My current > comparison chooses left from 30°, so I expect 0°.');await expect(page.locator('#prediction-feedback')).toContainText('not an automatically graded answer');
  for(const label of ['Hint 1','Hint 2','Hint 3']){await page.getByText(label,{exact:true}).click();await expect(page.getByText(label,{exact:true}).locator('..').locator('p')).toBeVisible();}
  await expect(page.locator('#practice-progress')).toContainText('0 of 3');
  await expect(page.locator('#show-solution')).toBeDisabled();await run(page);
  await expect(page.locator('#feedback')).not.toHaveClass(/success/);await expect(page.locator('#practice-progress')).toContainText('0 of 3');
  await expect(page.locator('#feedback')).toContainText('Read, Decision and Now');
  await page.locator('#show-solution').click();await expect(page.locator('#solution-explanation')).toBeVisible();
  const decision=language==='python'?'decision_angle':'decisionAngle';
  await run(page,sensorReference[language].replace(`${decision} = 60`,`${decision} = 1.0472`));await expect(page.locator('#feedback')).not.toHaveClass(/success/);
  await run(page,sensorReference[language]);await expect(page.locator('#feedback')).toHaveClass(/success/);await expect(page.locator('#console')).toContainText('Decision: turn right');await expect(page.locator('#pointer-value')).toHaveText('60.0°');
  await expect(page.locator('#feedback')).toContainText('north ridge crew');await expect(page.locator('#feedback')).toContainText('sensor reading chose the turn');
  await page.locator('#next-rescue').click();await expect(page.locator('#code')).toHaveValue(sensorReference[language]);await expect(page.locator('#pointer-value')).toHaveText('90.0°');
  await run(page);await expect(page.locator('#feedback')).toHaveClass(/success/);await expect(page.locator('#console')).toContainText('Decision: turn left');await expect(page.locator('#practice-progress')).toContainText('2 of 3');
  await page.locator('#next-rescue').click();await run(page);await expect(page.locator('#feedback')).not.toHaveClass(/success/);
  await run(page,sensorTransfer[language]);await expect(page.locator('#feedback')).toHaveClass(/success/);await expect(page.locator('#pointer-value')).toHaveText('-60.0°');await expect(page.locator('#scanner-value')).toHaveText('60.0°');await expect(page.locator('#practice-progress')).toContainText('3 of 3');await expect(page.locator('#next-help')).toContainText('Continue to Mission 3');
  await page.screenshot({path:`test-results/s03-${language}-transfer.png`,fullPage:true});await page.locator('.world-panel').screenshot({path:`test-results/s03-${language}-diagram.png`});
  await page.locator('#reset').click();await expect(page.locator('#pointer-value')).toHaveText('-30.0°');await expect(page.locator('#crew-status')).toContainText('waiting');await expect(page.locator('#code')).toHaveValue(sensorTransfer[language]);
  await page.locator('#target').selectOption('sensor-left');await run(page,sensorReference[language]);await expect(page.locator('#practice-progress')).toContainText('3 of 3');
 });
}
for(const language of ['python','java'] as const){
 test(`Mission 2 ${language}: comparison value chooses a branch, not a destination`,async({page})=>{
  await page.goto('/');await page.locator('#lesson').selectOption('L02');await page.locator('#language').selectOption(language);
  const decision=language==='python'?'decision_angle':'decisionAngle';
  await expect(page.locator('#value-guide')).toContainText(decision);
  const nearby=sensorReference[language].replace(`${decision} = 60`,`${decision} = 70`);
  for(const target of ['sensor-left','sensor-right']){
   await page.locator('#target').selectOption(target);await run(page,nearby);
   await expect(page.locator('#console')).toContainText('decision angle: 70');
   await expect(page.locator('#console')).toContainText(target==='sensor-left'?'Decision: turn right':'Decision: turn left');
   await expect(page.locator('#console')).toContainText('Now: 60 degrees');
   await expect(page.locator('#pointer-value')).toHaveText('60.0°');await expect(page.locator('#feedback')).toHaveClass(/success/);
   await expect(page.locator('#goal-angle')).toHaveText('60°');
  }
  // Crossing the measured value changes the branch, while the crew stays put.
  await run(page,nearby.replace(`${decision} = 70`,`${decision} = 110`));
  await expect(page.locator('#console')).toContainText('Decision: turn right');await expect(page.locator('#pointer-value')).toHaveText('120.0°');
  await expect(page.locator('#goal-angle')).toHaveText('60°');await expect(page.locator('#feedback')).not.toHaveClass(/success/);
  // More time changes the distance even with the same comparison and branch.
  await page.locator('#target').selectOption('sensor-left');
  await run(page,nearby.replace(language==='python'?'await wait(50)':'Robot.waitTicks(50)',language==='python'?'await wait(100)':'Robot.waitTicks(100)'));
  await expect(page.locator('#console')).toContainText('Decision: turn right');await expect(page.locator('#pointer-value')).toHaveText('90.0°');
  await expect(page.locator('#feedback')).not.toHaveClass(/success/);
  // A saved draft with the previous variable name remains untouched and runnable.
  const legacy=sensorReference[language].replaceAll(decision,'goal');
  await page.locator('#code').fill(legacy);await page.reload();await expect(page.locator('#code')).toHaveValue(legacy);
  await run(page);await expect(page.locator('#pointer-value')).toHaveText('60.0°');await expect(page.locator('#feedback')).toHaveClass(/success/);
 });
}
test('four independent drafts, reload, curriculum navigation and storage denial',async({page})=>{
 await page.goto('/');await page.locator('#code').fill('# mission one python');await page.locator('#language').selectOption('java');await page.locator('#code').fill('// mission one java');
 await page.locator('#curriculum-open').click();await page.locator('[data-lesson="L02"]').click();await expect(page.locator('#code')).toHaveValue(/double reading = Robot.angle/);await page.locator('#code').fill('// mission two java');
 await page.locator('#language').selectOption('python');await page.locator('#code').fill('# mission two python');await page.reload();await expect(page.locator('#lesson')).toHaveValue('L02');await expect(page.locator('#code')).toHaveValue('# mission two python');
 await page.locator('#language').selectOption('java');await expect(page.locator('#code')).toHaveValue('// mission two java');
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('quota');};});
 await page.locator('#lesson').selectOption('L01');await expect(page.locator('#code')).toHaveValue('// mission one java');await page.locator('#language').selectOption('python');await expect(page.locator('#code')).toHaveValue('# mission one python');
 await page.locator('#lesson').selectOption('L02');await expect(page.locator('#code')).toHaveValue('# mission two python');await expect(page.locator('#draft-status')).toContainText('this tab only');
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await page.locator('#code').fill(sensorReference.python);await page.locator('.world-panel').screenshot({path:'test-results/s03-diagram-narrow.png'});await page.screenshot({path:'test-results/s03-narrow.png',fullPage:true});
});
for(const language of ['python','java'] as const)test(`Mission 2 ${language}: invalid input, stop and mission switch preserve source without badges`,async({page})=>{
 await page.goto('/');await page.locator('#lesson').selectOption('L02');await page.locator('#language').selectOption(language);
 const good=sensorReference[language],bad=good.replace(language==='python'?'await wait(50)':'Robot.waitTicks(50)',language==='python'?'await wait(0)':'Robot.waitTicks(0)');
 await page.locator('#code').fill(bad);await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('ERROR');await expect(page.locator('#code')).toHaveValue(bad);await expect(page.locator('#practice-progress')).toContainText('0 of 3');
 const forever=language==='python'?'while True: pass':'public class Main { public static void main(String[] args) { while(true) {} } }';
 await page.locator('#code').fill(forever);await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('RUNNING');await page.locator('#stop').click();await expect(page.locator('#status-pill')).toHaveText('STOPPED');
 await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('RUNNING');await page.locator('#lesson').selectOption('L01');await expect(page.locator('#pointer-value')).toHaveText('0.0°');await expect(page.locator('#status-pill')).toHaveText('READY');
 await page.locator('#lesson').selectOption('L02');await expect(page.locator('#code')).toHaveValue(forever);await expect(page.locator('#pointer-value')).toHaveText('30.0°');await run(page,good);await expect(page.locator('#feedback')).toHaveClass(/success/);
});
