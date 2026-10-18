import {expect, type Page} from '@playwright/test';

/** Use the learner's entry points when optional support is needed. */
export async function openHints(page:Page) {
  await page.locator('[data-help="hints-help"]').click();
}
export async function openCommands(page:Page) {
  await page.locator('[data-help="commands-help"]').click();
}

export async function openMission(page:Page,id:string) {
  await page.locator('#curriculum-open').click();
  await page.locator(`[data-lesson="${id}"]`).click();
}
/** All three graduated hints remain reachable, without stacking answer panels. */
export async function readHints(page:Page, count=3) {
  await openHints(page);
  for(let index=1;index<=count;index++) {
    await expect(page.locator('#hint-level')).toHaveText(`Hint ${index} of 3`);
    await expect(page.locator('#hint-text')).toBeVisible();
    await expect(page.locator('#hint-text')).not.toBeEmpty();
    if(index<count)await page.locator('#next-hint').click();
  }
}
