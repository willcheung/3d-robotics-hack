import type {Page} from '@playwright/test';

/** Use the learner's entry points when optional support is needed. */
export async function openNotes(page:Page) {
  await page.getByRole('button',{name:'Add note',exact:true}).click();
}
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
