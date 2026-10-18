import {openMission} from '../learning-ui.ts';
import {test, expect, type Page} from '../workshop-fixture.ts';
import {patrolReference} from '../../src/patrol-lesson.ts';
import {armReference} from '../../src/arm-lesson.ts';
import {openHints, readHints} from '../learning-ui.ts';

async function finished(page:Page, source:string) {
  await page.locator('#code').fill(source);
  await page.locator('#run').click();
  await expect(page.locator('#status-pill')).not.toHaveText('LOADING',{timeout:47000});
  await expect(page.locator('#status-pill')).toHaveText('FINISHED',{timeout:22000});
}
const station=(java:boolean,ticks=51)=>java
  ? `public class Main {public static void main(String[] args) throws Exception {Robot.servo(120);Robot.motor(1);Robot.waitTicks(${ticks});Robot.motor(0);}}`
  : `from robot import motor, servo, wait\nawait servo(120)\nawait motor(1)\nawait wait(${ticks})\nawait motor(0)`;

for(const language of ['python','java'] as const)test(`${language}: success teaches measured outcomes across all missions and clears on recovery`,async({page})=>{
  test.setTimeout(180000);
  const java=language==='java';
  await page.goto('/');await page.locator('#language').selectOption(language);
  await finished(page,station(java));
  await expect(page.locator('#result-label')).toBeVisible();
  await expect(page.locator('#run-observation')).toHaveText('Direction 0° → 61.2° · tilt 120° · motor off.');
  await expect(page.locator('#run-reason')).toContainText('60° ±2°');
  await page.locator('#code').fill(java?'// next experiment':'# next experiment');
  await expect(page.locator('#run-observation')).toContainText('61.2°');
  await expect(page.locator('#run-explanation')).toContainText('From the last run');
  await page.screenshot({path:`test-results/feedback-${language}-desktop.png`,fullPage:true});
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.locator('#feedback').screenshot({path:`test-results/feedback-${language}-narrow.png`});
  await page.setViewportSize({width:1440,height:1000});
  await finished(page,java?'public class Main {public static void main(String[] args){System.out.println("Challenge complete: 60 degrees");}}':'print("Challenge complete: 60 degrees")');
  await expect(page.locator('#run-explanation')).toBeHidden();await expect(page.locator('#result-label')).toBeHidden();
  await openMission(page,'L02');
  // No sensor or condition: feedback must describe the motion without inventing a decision.
  await finished(page,station(java,25));
  await expect(page.locator('#run-observation')).toContainText('30° → 60°');
  await expect(page.locator('#run-reason')).toContainText('Passing this start alone');
  await page.locator('#next-rescue').click();await expect(page.locator('#run-explanation')).toBeHidden();
  await finished(page,station(java,25));await expect(page.locator('#run-explanation')).toBeHidden();
  await openMission(page,'L03');
  await finished(page,patrolReference[language]);
  await expect(page.locator('#run-observation')).toContainText('3 of 3 checkpoints logged in order');
  await expect(page.locator('#run-reason')).toContainText('25 consecutive ticks (0.5 seconds)');
  await page.locator('#reset').click();await expect(page.locator('#run-explanation')).toBeHidden();
  await openMission(page,'L04');
  await finished(page,armReference[language]);
  await expect(page.locator('#run-observation')).toContainText('Parcel in the tray');
  await expect(page.locator('#run-reason')).toContainText('waiting gives the joints time');
  await page.locator('#code').fill(java?'public class Main {public static void main(String[] args) {while(true){}}}':'while True: pass');
  await page.locator('#run').click();await expect(page.locator('#run-explanation')).toBeHidden();
  await expect(page.locator('#status-pill')).toHaveText('RUNNING');await page.locator('#stop').click();
  await expect(page.locator('#run-explanation')).toBeHidden();
  await page.locator('#code').fill(java?'public class Main { broken syntax }':'if broken syntax');
  await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('ERROR',{timeout:47000});
  await expect(page.locator('#run-explanation')).toBeHidden();
  await page.reload();await expect(page.locator('#result-label')).toBeHidden();
});

test('hints progressively reveal help without revealing the worked example or editing the draft',async({page})=>{
  await page.goto('/');const draft=await page.locator('#code').inputValue();
  await readHints(page);await expect(page.locator('#next-hint')).toBeHidden();
  await expect(page.locator('#show-solution')).toBeVisible();await expect(page.locator('#show-solution')).toBeDisabled();
  await page.locator('#previous-hint').click();await expect(page.locator('#hint-level')).toHaveText('Hint 2 of 3');
  await page.locator('#previous-hint').focus();await page.keyboard.press('Enter');
  await expect(page.locator('#next-hint')).toBeFocused();await expect(page.locator('#hint-level')).toHaveText('Hint 1 of 3');
  await page.keyboard.press('Enter');await page.keyboard.press('Enter');
  await expect(page.locator('#previous-hint')).toBeFocused();
  await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('FINISHED');
  await openHints(page);await expect(page.locator('#worked-availability')).toBeHidden();
  await page.locator('#show-solution').click();await expect(page.locator('#hint-step')).toBeHidden();
  await expect(page.locator('#solution-explanation')).toBeVisible();
  await expect(page.locator('#previous-hint')).toBeFocused();await page.keyboard.press('Enter');
  await expect(page.locator('#hint-level')).toHaveText('Hint 3 of 3');
  await expect(page.locator('#solution-explanation')).toBeHidden();
  await expect(page.locator('#code')).toHaveValue(draft);
  await page.locator('#hints-help').screenshot({path:'test-results/feedback-hints.png'});
});

test.use({checkedMissions:['L01','L02','L03']});
