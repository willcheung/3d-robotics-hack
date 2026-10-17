import {openMission} from '../learning-ui.ts';
import {test, expect} from '../workshop-fixture.ts';

test('top navigation opens dialogs without replacing the active draft', async ({page}) => {
  await page.goto('/');
  const code = page.locator('#code');
  await code.fill('# my unfinished experiment');
  const curriculum = page.getByRole('banner').getByRole('button', {name:'Curriculum & unlocks'});
  const family = page.getByRole('banner').getByRole('button', {name:'Family & progress'});
  await curriculum.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#curriculum-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(curriculum).toBeFocused();
  await family.click();
  await expect(page.locator('#family-dialog')).toBeVisible();
  await page.getByRole('button', {name:'Close family progress'}).click();
  await expect(family).toBeFocused();
  await expect(code).toHaveValue('# my unfinished experiment');
  await curriculum.click();
  await page.getByRole('button', {name:'Open Mission 4 →'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-current-mission','L04');
  await expect(page.locator('#curriculum-dialog')).not.toBeVisible();
  await openMission(page,'L01');
  await expect(code).toHaveValue('# my unfinished experiment');
});

test('every mission keeps the workbench and editable code in the laptop viewport', async ({page}) => {
  await page.setViewportSize({width:1366,height:900});
  await page.goto('/');
  for (const lesson of ['L01','L02','L03','L04']) {
    await openMission(page,lesson);
    for (const language of ['python','java']) {
      await page.locator('#language').selectOption(language);
      const position = await page.evaluate(() => {
        const top = (selector:string) => document.querySelector(selector)!.getBoundingClientRect().top + scrollY;
        return {workbench:top('.workbench'), code:top('#code'), run:top('#run'), job:top('#mission-job')};
      });
      expect(position.workbench).toBeLessThan(340);
      expect(position.code).toBeLessThan(600);
      expect(position.run).toBeLessThan(position.code);
      expect(position.job).toBeLessThan(position.run);
      await expect(page.locator('#mission-job')).not.toBeEmpty();
      await page.locator('#find-edit').click();
      await expect(page.locator('#code')).toBeFocused();
    }
  }
});

test('navigation and mission choices fit narrow and tablet screens', async ({page}) => {
  await page.goto('/');
  for (const width of [320,390,768,1024]) {
    await page.setViewportSize({width,height:900});
    for (const lesson of ['L01','L04']) {
      await openMission(page,lesson);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      for (const selector of ['#curriculum-open','#family-open','#target']) {
        const box = await page.locator(selector).boundingBox();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x+box!.width).toBeLessThanOrEqual(width);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }
      await page.locator('#family-open').click();
      await expect(page.locator('#family-dialog')).toBeVisible();
      await page.keyboard.press('Escape');
    }
  }
});

// Existing checked prerequisites are a UI fixture; real progression is tested in family-ui.
test.use({checkedMissions:['L01', 'L02', 'L03']});
