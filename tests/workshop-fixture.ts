import {test as base,expect} from '@playwright/test';
import {lessonTargets,type LessonId} from '../src/model.ts';

/** Account-state fixture only. Python/Java still run in their real local runtimes.
 * Actual checked progression and identity isolation live in mission-drafts.spec.
 */
export const test=base.extend<{checkedMissions:LessonId[]}>({
  checkedMissions:[[],{option:true}],
  page:async({page,checkedMissions},use)=>{
    const completed=checkedMissions.flatMap(id=>[...lessonTargets[id]]);const drafts:Record<string,any>={};
    await page.route('**/api/family**',async route=>{
      const path=new URL(route.request().url()).pathname,data=route.request().method()==='POST'?route.request().postDataJSON():null;
      if(path.endsWith('/draft')){const key=data.lesson==='L01'?data.language:data.lesson+'.'+data.language;drafts[key]={source:data.source,target:data.target,revision:data.revision+1};await route.fulfill({json:drafts[key]});return;}
      // Synthetic API projection only. Real trusted verification is covered by
      // both-language family journeys; this fixture does not prove a check.
      if(path.endsWith('/verify')){if(!completed.includes(data.target))completed.push(data.target);await route.fulfill({json:{outcome:'reached',completed:[...completed]}});return;}
      if(path.endsWith('/attempt')){await route.fulfill({json:{ok:true}});return;}
      const snapshot={profile:{id:'workshop-fixture',name:'Test pilot',role:'student'},drafts,history:[],students:[],completed:[...completed]};
      await route.fulfill({json:snapshot});
    });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-profile','workshop-fixture');
    await use(page);
  },
});
export {expect};
export type {Page} from '@playwright/test';
