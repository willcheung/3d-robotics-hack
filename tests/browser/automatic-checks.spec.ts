import {test,expect} from '../workshop-fixture.ts';
import {getLesson} from '../../src/lessons.ts';
// These response-race fixtures test UI semantics. Family model tests verify that
// a finished cancellation receipt can represent reached, missed, or error.
for(const outcome of ['reached','missed','error'])test(`Stop after a finished ${outcome} check reports its state without inventing completion`,async({page})=>{
 let done=false,release!:()=>void,started!:()=>void;const held=new Promise<void>(r=>release=r),ready=new Promise<void>(r=>started=r);
 await page.route('**/api/family',route=>route.fulfill({json:{profile:{id:'workshop-fixture',name:'Test pilot',role:'student'},drafts:{},history:[],students:[],completed:done&&outcome==='reached'?['beacon']:[]}}));
 await page.route('**/api/family/verify',async route=>{done=true;started();await held;await route.fulfill({json:{outcome,completed:outcome==='reached'?['beacon']:[]}}).catch(()=>{});});
 await page.route('**/api/family/cancel',route=>route.fulfill({json:{completed:true}}));
 try{await page.locator('#code').fill(getLesson('L01').reference.python);await page.locator('#run').click();await ready;await expect(page.locator('#stop-check')).toBeVisible();await page.locator('#stop-check').click();await expect(page.locator('#progress-sync')).toHaveText('The check already finished. Progress refreshed.');await expect(page.locator('#practice-badges .earned')).toHaveCount(outcome==='reached'?1:0);await expect(page.locator('#run')).toBeEnabled();}finally{release();}
});
