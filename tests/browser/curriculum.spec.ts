import {test,expect} from '@playwright/test';

test('all 20 mission previews load, with truthful availability and optional states',async({page})=>{
 await page.goto('/');await page.locator('#curriculum-open').click();
 const dialog=page.locator('#curriculum-dialog'),cards=dialog.locator('.curriculum-card');
 await expect(cards).toHaveCount(20);await expect(dialog.locator('[data-lesson]')).toHaveCount(3);
 await expect(dialog.locator('.curriculum-state').filter({hasText:'Coming soon'})).toHaveCount(17);
 await expect(dialog.locator('.preview-kind').filter({hasText:'CONCEPT DIAGRAM'})).toHaveCount(16);
 await expect(dialog.locator('#curriculum-optional').locator('..').locator('..').locator('.curriculum-card')).toHaveCount(4);
 // A model screenshot does not unlock the unmerged Mission 4 candidate.
 await expect(dialog.locator('[data-curriculum-id="L04"] .preview-kind')).toHaveText('MODEL PREVIEW');
 await expect(dialog.locator('[data-curriculum-id="L04"] button')).toHaveCount(0);
 for(const card of await cards.all()){
  await card.scrollIntoViewIfNeeded();const image=card.locator('img');
  await expect(image).toHaveAttribute('alt',/.{25}/);
  await expect.poll(()=>image.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
 }
 await expect(dialog.locator('canvas')).toHaveCount(0);
});

test('chapter navigation stays inside the curriculum; Escape and Close return focus',async({page})=>{
 await page.goto('/');await page.locator('#code').fill('# keep this experiment');
 const hash=new URL(page.url()).hash;
 await page.locator('#curriculum-open').click();await expect(page.getByRole('button',{name:'Close curriculum'})).toBeFocused();
 const first=page.locator('.curriculum-card').first();
 const layout=await first.evaluate(el=>({card:el.getBoundingClientRect().width,parent:el.parentElement!.getBoundingClientRect().width,image:el.querySelector('figure')!.getBoundingClientRect(),copy:el.querySelector('.curriculum-copy')!.getBoundingClientRect()}));
 expect(Math.abs(layout.card-layout.parent)).toBeLessThan(2);expect(layout.copy.x).toBeGreaterThan(layout.image.x);
 await page.locator('[data-chapter="rover"]').click();await expect(page.locator('#curriculum-rover')).toBeFocused();
 expect(await page.locator('#curriculum-dialog').evaluate(el=>el.scrollTop)).toBeGreaterThan(800);
 expect(new URL(page.url()).hash).toBe(hash);await page.keyboard.press('Escape');
 await expect(page.locator('#curriculum-open')).toBeFocused();await expect(page.locator('#code')).toHaveValue('# keep this experiment');
 await page.locator('#curriculum-open').click();await page.getByRole('button',{name:'Close curriculum'}).click();await expect(page.locator('#curriculum-open')).toBeFocused();
});

test('opening missions through previews preserves all language drafts and selected challenges',async({page})=>{
 await page.goto('/');
 const targets={L01:'reverse',L02:'sensor-transfer',L03:'patrol-cove'};
 for(const language of ['python','java'])for(const [lesson,target] of Object.entries(targets)){
  await page.locator('#language').selectOption(language);
  await page.locator('#curriculum-open').click();await page.locator(`[data-lesson="${lesson}"]`).click();
  await expect(page.locator('#code')).toBeFocused();
  await page.locator('#target').selectOption(target);await page.locator('#code').fill(`${language==='java'?'//':'#'} ${lesson} ${language} preview navigation`);
 }
 await page.reload();
 for(const language of ['python','java'])for(const [lesson,target] of Object.entries(targets)){
  await page.locator('#language').selectOption(language);await page.locator('#curriculum-open').click();await page.locator(`[data-lesson="${lesson}"]`).click();
  await expect(page.locator('#code')).toHaveValue(`${language==='java'?'//':'#'} ${lesson} ${language} preview navigation`);await expect(page.locator('#target')).toHaveValue(target);
 }
});

test('image failure leaves the mission brief, fallback and entry usable',async({page})=>{
 await page.route('**/curriculum/*',route=>route.abort());await page.goto('/');await page.locator('#curriculum-open').click();
 const card=page.locator('[data-curriculum-id="L01"]');await expect(card.locator('.preview-fallback')).toBeVisible();
 await expect(card.locator('.curriculum-job')).toContainText('crew');await expect(card.locator('.curriculum-skill')).toContainText('motor power');
 await card.locator('button').click();await expect(page.locator('#lesson')).toHaveValue('L01');await expect(page.locator('#code')).toBeFocused();
});

test('narrow and enlarged layouts keep every row and the persistent close control reachable',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.locator('#curriculum-open').click();
 for(const card of await page.locator('.curriculum-card').all()){
  await card.scrollIntoViewIfNeeded();
  const box=await card.evaluate(el=>{const a=el.querySelector('figure')!.getBoundingClientRect(),b=el.querySelector('.curriculum-copy')!.getBoundingClientRect();return {imageBottom:a.bottom,copyTop:b.top,width:el.scrollWidth,available:el.clientWidth};});
  expect(box.copyTop).toBeGreaterThanOrEqual(box.imageBottom-1);expect(box.width).toBeLessThanOrEqual(box.available+1);
  await expect(page.getByRole('button',{name:'Close curriculum'})).toBeVisible();
 }
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('#curriculum-dialog').evaluate(el=>el.scrollTop=0);
 await page.screenshot({path:'test-results/curriculum-narrow.png'});
 // Enlarged text exercises reflow independently of the viewport-size test.
 await page.addStyleTag({content:'#curriculum-dialog{font-size:200%} #curriculum-dialog :is(p,small,h4,.eyebrow,button,a){font-size:1em!important}'});
 await page.locator('[data-chapter="optional"]').click();await expect(page.locator('#curriculum-optional')).toBeFocused();
 expect(await page.locator('#curriculum-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
 await page.keyboard.press('Escape');await expect(page.locator('#curriculum-open')).toBeFocused();
});
