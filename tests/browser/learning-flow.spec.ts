import {test,expect} from '@playwright/test';
import {openNotes,openHints,openCommands} from '../learning-ui.ts';

test('optional support opens from the editor without replacing code or changing the challenge',async({page})=>{
 await page.goto('/');
 for(const id of ['experiment-notes','hints-help','commands-help','recovery-help','output-panel'])await expect(page.locator('#'+id)).toHaveJSProperty('open',false);
 await page.locator('#code').fill('# my unfinished experiment');
 await page.locator('#target').selectOption('reverse');
 await openNotes(page);await expect(page.locator('#prediction')).toBeFocused();
 await page.locator('#prediction').fill('I expect a left turn.');
 await page.locator('#reflection').fill('Try a longer wait next.');
 await page.locator('#experiment-notes>summary').click();
 await openHints(page);await page.getByText('Hint 1',{exact:true}).click();
 await expect(page.getByText('Hint 1',{exact:true}).locator('..').locator('p')).toBeVisible();
 await expect(page.locator('#show-solution')).toBeDisabled();
 await openCommands(page);await expect(page.locator('#value-guide')).toBeVisible();
 await expect(page.locator('#value-guide')).toContainText('1 to 600 whole ticks');
 await page.locator('#recovery-help>summary').click();await expect(page.locator('.recovery-guide')).toContainText('return copy');
 await expect(page.locator('#code')).toHaveValue('# my unfinished experiment');
 await expect(page.locator('#target')).toHaveValue('reverse');
 await page.reload();await expect(page.locator('#experiment-notes')).toHaveJSProperty('open',false);
 await openNotes(page);await expect(page.locator('#prediction')).toHaveValue('I expect a left turn.');
 await expect(page.locator('#reflection')).toHaveValue('Try a longer wait next.');
});

test('selected challenge and unique completion are distinct in the top progress strip',async({page})=>{
 await page.goto('/');await page.locator('#target').selectOption('reverse');
 await expect(page.locator('#practice-current')).toHaveText('Practice · Rescue 3 of 3');
 await expect(page.locator('#practice-progress')).toHaveText('0 of 3 completed this visit');
 await expect(page.locator('#practice-badges [aria-current]')).toHaveAttribute('aria-label',/Lower cove: not completed, current/);
 await page.locator('#code').fill('from robot import motor, servo, wait\nawait servo(60)\nawait motor(-0.5)\nawait wait(100)\nawait motor(0)');
 for(let i=0;i<2;i++){
  await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('FINISHED',{timeout:60000});
  await expect(page.locator('#feedback')).toHaveClass(/success/);
  await expect(page.locator('#practice-progress')).toHaveText('1 of 3 completed this visit');
 }
 await expect(page.locator('#practice-badges .earned')).toHaveCount(1);
 await page.locator('#target').selectOption('beacon');await expect(page.locator('#practice-current')).toContainText('Rescue 1 of 3');
 await expect(page.locator('#practice-progress')).toHaveText('1 of 3 completed this visit');
 await page.reload();await expect(page.locator('#practice-progress')).toHaveText('0 of 3 completed this visit');
});

test('prediction and results stay beside Run and describe the executed note',async({page})=>{
 await page.setViewportSize({width:1280,height:800});await page.goto('/');
 await expect(page.locator('#predict-prompt')).toBeInViewport();await expect(page.locator('#run')).toBeInViewport();
 await expect(page.locator('#code')).toBeInViewport();
 const scene=await page.locator('#scene').boundingBox();
 await page.locator('#code').fill('from robot import motor, servo, wait\nawait servo(120)\nawait motor(0.5)\nawait wait(200)\nawait motor(0)');
 await openNotes(page);await page.locator('#prediction').fill('This run should pass the crew.');
 await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('RUNNING',{timeout:60000});
 await openNotes(page);await page.locator('#prediction').fill('A note for the next run.');
 await expect(page.locator('#status-pill')).toHaveText('FINISHED',{timeout:25000});
 await expect(page.locator('#prediction-feedback')).toContainText('This run should pass the crew.');
 await expect(page.locator('#prediction-feedback')).not.toContainText('A note for the next run.');
 await page.evaluate(()=>scrollTo(0,0));
 await expect(page.locator('#feedback')).toBeInViewport();await expect(page.locator('#reflect-prompt')).toBeVisible();
 expect((await page.locator('#scene').boundingBox())!.height).toBe(scene!.height);
 await page.locator('#code').fill('await = broken');await page.locator('#run').click();
 await expect(page.locator('#status-pill')).toHaveText('ERROR',{timeout:60000});
 await expect(page.locator('#output-panel')).toHaveJSProperty('open',true);
 await expect(page.locator('#console')).toContainText('SyntaxError');
 await expect(page.locator('#code')).toHaveValue('await = broken');
});
