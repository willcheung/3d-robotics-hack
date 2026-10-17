import {test,expect} from '@playwright/test';
import {openMission} from '../learning-ui.ts';
import {lessonTargets} from '../../src/model.ts';

test('guest previews block edits, keyboard runs and world controls while preserving drafts',async({page})=>{
  await page.setViewportSize({width:1366,height:900});
  await page.goto('/');
  await page.locator('#code').fill('# unfinished mission one');
  await page.evaluate(()=>{
    localStorage.setItem('robolab.s01.L02.python','# old mission two draft');
    localStorage.setItem('robolab.completed','["beacon","farther","reverse"]');
  });
  await page.reload();
  for(const id of ['L02','L03','L04']){
    await openMission(page,id);
    await expect(page.locator('#mission-access')).toContainText('Finish all 3 challenges in Mission 1');
    await expect(page.locator('#mission-access')).toContainText('Check & save progress');
    await expect(page.locator('#code')).not.toBeEditable();
    for(const control of ['run','restore','return-draft','language','target','verify-cloud','save-cloud','reset'])await expect(page.locator('#'+control)).toBeDisabled();
    await expect(page.locator('#scene')).toHaveJSProperty('inert',true);
    await expect(page.locator('#next-lesson')).toBeHidden();
    const source=await page.locator('#code').inputValue();
    await page.locator('#code').focus();await page.keyboard.press('Tab');
    await page.locator('#code').focus();await page.keyboard.press('Enter');await page.keyboard.press('Control+Enter');await page.keyboard.press('Meta+Enter');
    await expect(page.locator('#code')).toHaveValue(source);
    await expect(page.locator('#status-pill')).toHaveText('READY');
    expect((await page.locator('.workbench').boundingBox())!.y).toBeLessThan(400);
  }
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'test-results/guided-locked-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(390);
  await page.screenshot({path:'test-results/guided-locked-mobile.png',fullPage:true});
  await page.locator('#return-mission').click();await expect(page.locator('#code')).toBeEditable();
  await expect(page.locator('#code')).toHaveValue('# unfinished mission one');
  await openMission(page,'L02');await expect(page.locator('#code')).toHaveValue('# old mission two draft');
  await page.reload();await expect(page.locator('#code')).not.toBeEditable();
  await expect(page.locator('#code')).toHaveValue('# old mission two draft');
  await expect(page.locator('select#lesson')).toHaveCount(0);
});

for(const failure of [401,409])test(`${failure}: an expired or changed session removes checked access and keeps the outgoing profile draft private`,async({page})=>{
  let expired=false;
  await page.route('**/api/family**',route=>route.fulfill(expired?{status:failure,json:{error:failure===401?'Sign in again.':'The signed-in profile changed in another tab. Sign in again before saving or running.'}}:{json:{profile:{id:'returning-pilot',name:'Returning pilot',role:'student'},drafts:{},history:[],students:[],completed:[...lessonTargets.L01]}}));
  await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-profile','returning-pilot');
  await openMission(page,'L02');await page.locator('#code').fill('# private mission two draft');
  expired=true;await page.locator('#family-open').click();await page.locator('#family-refresh').click();
  await expect(page.locator('#profile-label')).toHaveText('Guest practice');
  await page.getByRole('button',{name:'Close family progress'}).click();
  await openMission(page,'L02');await expect(page.locator('#code')).not.toBeEditable();
  await expect(page.locator('#code')).not.toHaveValue('# private mission two draft');
  expect(await page.evaluate(()=>localStorage.getItem('robolab.profile.returning-pilot.L02.python'))).toBe('# private mission two draft');
});

test('a delayed pre-check refresh cannot take away the newly unlocked mission',async({page})=>{
  let completed=['beacon','farther'],hold=false,release!:()=>void;
  const gate=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/api/family**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(path.endsWith('/verify')){completed=[...lessonTargets.L01];await route.fulfill({json:{outcome:'reached'}});return;}
    const snapshot={profile:{id:'pilot',name:'Pilot',role:'student'},drafts:{},history:[],students:[],completed:[...completed]};
    if(hold){hold=false;await gate;}
    await route.fulfill({json:snapshot});
  });
  await page.goto('/');await expect(page.locator('#checked-progress')).toHaveText('Checked: 2/3');
  try{
    await page.locator('#family-open').click();hold=true;await page.locator('#family-refresh').click();
    await page.getByRole('button',{name:'Close family progress'}).click();
    await page.locator('#verify-cloud').click();await expect(page.locator('#next-lesson')).toBeVisible();
    const older=page.waitForResponse(response=>new URL(response.url()).pathname==='/api/family');
    release();await older;
    await page.locator('#next-lesson').click();await expect(page.locator('#code')).toBeEditable();
    await expect(page.locator('html')).toHaveAttribute('data-current-mission','L02');
  }finally{release();}
});

test('a delayed failure from an old profile cannot sign out the new learner',async({page})=>{
  let profile='old-pilot',hold=false,release!:()=>void;
  const gate=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/api/family**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(path.endsWith('/logout')){await route.fulfill({json:{ok:true}});return;}
    if(path.endsWith('/login')){profile='new-pilot';await route.fulfill({json:{ok:true}});return;}
    if(hold){hold=false;await gate;await route.fulfill({status:401,json:{error:'Old session expired.'}});return;}
    await route.fulfill({json:{profile:{id:profile,name:profile,role:'student'},drafts:{},history:[],students:[],completed:[...lessonTargets.L01]}});
  });
  await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-profile','old-pilot');
  try{
    await page.locator('#family-open').click();hold=true;await page.locator('#family-refresh').click();
    await page.locator('#family-logout').click();await page.locator('[data-mode=student]').click();
    await page.locator('#access-code').fill('new-pilot');await page.locator('#family-login button').click();
    await expect(page.locator('html')).toHaveAttribute('data-profile','new-pilot');
    const older=page.waitForResponse(response=>response.status()===401);
    release();await older;await page.getByRole('button',{name:'Close family progress'}).click();
    await openMission(page,'L02');await expect(page.locator('#code')).toBeEditable();
    await expect(page.locator('html')).toHaveAttribute('data-profile','new-pilot');
  }finally{release();}
});
