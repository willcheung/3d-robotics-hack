import {test as base,expect} from '@playwright/test';
import {lessonTargets,type LessonId} from '../src/model.ts';

/** Account-state fixture only. Python/Java still run in their real local runtimes.
 * Actual checked progression and identity isolation live in mission-drafts.spec.
 */
export const test=base.extend<{checkedMissions:LessonId[]}>({
  checkedMissions:[[],{option:true}],
  page:async({page,checkedMissions},use)=>{
    await page.route('**/api/family**',async route=>{
      const snapshot={profile:{id:'workshop-fixture',name:'Test pilot',role:'student'},drafts:{},history:[],students:[],completed:checkedMissions.flatMap(id=>[...lessonTargets[id]])};
      await route.fulfill({json:snapshot});
    });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-profile','workshop-fixture');
    await use(page);
  },
});
export {expect};
export type {Page} from '@playwright/test';
