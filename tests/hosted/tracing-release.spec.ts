import {test,expect,type BrowserContext} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {del} from '@vercel/blob';
import {BlobStore,provision,login,recordAttempt} from '../../server/family-store.mjs';
import {fixtureParent} from '../helpers/fixture-parent.ts';
import {openMission} from '../learning-ui.ts';
import {getLesson} from '../../src/lessons.ts';
import {lessonTargets} from '../../src/model.ts';

test.skip(process.env.HOSTED_TRACE_ACCEPTANCE!=='1','Requires explicitly authorized hosted tracing qualification.');
const origin=process.env.HOSTED_APP_ORIGIN!;
const bypass=process.env.HOSTED_BYPASS_FILE?JSON.parse(readFileSync(process.env.HOSTED_BYPASS_FILE,'utf8')).bypassSecret:undefined;
const paths=new Set<string>(),store=new BlobStore(),write=store.write.bind(store);
store.write=async(path:string,...args:unknown[])=>{if(!path.startsWith('limits/'))paths.add(path);return write(path,...args);};
let parentCode:string;
async function protect(context:BrowserContext){if(bypass)await context.route(url=>url.origin===origin,route=>route.continue({headers:{...route.request().headers(),'x-vercel-protection-bypass':bypass}}));}
test.beforeAll(async()=>{
 expect(origin).toMatch(/^https:\/\//);
 const fixture=await provision(store,{parentName:'Trace pilot'});parentCode=fixture.code;const session=await login(store,parentCode);
 // Access fixtures only: these historical milestones do not prove a checked
 // run. The separate full progression suite executes every actual prerequisite.
 for(const id of ['L01','L02','L03'] as const)for(const target of lessonTargets[id])await recordAttempt(store,session,{id:randomUUID(),language:'python',target,source:'# synthetic tracing access fixture',outcome:'reached',seconds:0},true);
});
test.afterAll(async()=>{if(paths.size)await del([...paths]);});
for(const language of ['python','java'] as const)for(const id of ['L01','L02','L03','L04'] as const){
 test(`hosted trace ${id} ${language}: actual lines, speed changes, motion Pause, Step and recovery`,async({page,context})=>{
  test.setTimeout(150000);await protect(context);await fixtureParent(context,store,parentCode,origin);await page.goto('/');
  await expect(page.locator('#profile-label')).toHaveText('Trace pilot · private family');await openMission(page,id);await page.locator('#language').selectOption(language);
  const source=getLesson(id).reference[language],rows=source.split('\n');
  const waitLine=rows.findIndex(row=>language==='python'?row.trim().startsWith('await wait('):row.trim().startsWith('Robot.waitTicks('))+1;
  expect(waitLine).toBeGreaterThan(0);
  await page.locator('#code').fill(source);await page.locator('#execution-speed').selectOption('0.5');
  await page.evaluate(()=>{(window as any).traceLines=[];new MutationObserver(()=>{const n=Number(document.querySelector('#code')!.getAttribute('data-execution-line'));const visits=(window as any).traceLines;if(n&&visits.at(-1)!==n)visits.push(n);}).observe(document.querySelector('#code')!,{attributes:true,attributeFilter:['data-execution-line']});});
  await page.evaluate(()=>{(window as any).motionSamples=[];new MutationObserver(()=>{const sim=parseFloat(document.querySelector('#time-value')!.textContent!);const samples=(window as any).motionSamples;if(sim&&samples.at(-1)?.sim!==sim)samples.push({sim,wall:performance.now(),speed:(document.querySelector('#execution-speed') as HTMLSelectElement).value});}).observe(document.querySelector('#time-value')!,{subtree:true,childList:true,characterData:true});});
  await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('RUNNING',{timeout:50000});
  await expect(page.locator('#code')).toHaveAttribute('data-execution-line',String(waitLine),{timeout:20000});
  await expect.poll(async()=>parseFloat((await page.locator('#time-value').textContent())!),{timeout:10000}).toBeGreaterThanOrEqual(.24);await page.locator('#pause').click();
  const frozen=await page.locator('.telemetry').innerText();await page.waitForTimeout(300);await expect.poll(()=>page.locator('.telemetry').innerText()).toBe(frozen);
  await expect(page.locator('#code')).toHaveAttribute('data-execution-line',String(waitLine));await expect(page.locator('#execution-line')).toBeVisible();
  await page.locator('#execution-speed').selectOption('2');await page.locator('#step').click();
  await expect(page.locator('#execution-status')).toContainText('Paused on',{timeout:20000});await expect(page.locator('#step')).toBeEnabled();
  expect(Number(await page.locator('#code').getAttribute('data-execution-line'))).toBeGreaterThan(waitLine);
  const firstWait={L01:'2.00s',L02:'1.00s',L03:'2.00s',L04:'0.80s'}[id];await expect(page.locator('#time-value')).toHaveText(firstWait);
  const afterStep=await page.locator('.telemetry').innerText();await page.waitForTimeout(200);await expect.poll(()=>page.locator('.telemetry').innerText()).toBe(afterStep);
  const samples=await page.evaluate(()=>(window as any).motionSamples as {sim:number,wall:number,speed:string}[]);
  for(const [speed,min,max] of [['0.5',.3,.8],['2',1.1,2.8]] as const){const moving=samples.filter(s=>s.speed===speed),a=moving[0],b=moving.at(-1)!;expect(moving.length).toBeGreaterThan(2);const rate=(b.sim-a.sim)*1000/(b.wall-a.wall);expect(rate,`observed ${speed}× motion rate`).toBeGreaterThan(min);expect(rate).toBeLessThan(max);}
  if(id==='L04')await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:test.info().outputPath(`${id}-${language}-paused.png`),fullPage:true});
  await page.locator('#pause').click();await expect(page.locator('#status-pill')).toHaveText('FINISHED',{timeout:60000});await expect(page.locator('#feedback')).toHaveClass(/success/);
  const finalTime={L01:'2.00s',L02:'1.00s',L03:'7.50s',L04:'6.40s'}[id];await expect(page.locator('#time-value')).toHaveText(finalTime);await expect(page.locator('#execution-line')).toBeHidden();
  const visits=await page.evaluate(()=>(window as any).traceLines as number[]);
  if(id==='L03')expect(visits.filter(n=>n===waitLine).length).toBe(3);
  if(id==='L02'){const untaken=rows.findIndex(row=>row.includes(language==='python'?'await motor(-0.5)':'Robot.motor(-0.5)'))+1;expect(visits).not.toContain(untaken);await expect(page.locator('#console')).toContainText('Decision: turn right');}
  // A second real run at normal speed must retain the exact final model time.
  await page.locator('#execution-speed').selectOption('1');await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('FINISHED',{timeout:70000});await expect(page.locator('#time-value')).toHaveText(finalTime);await expect(page.locator('#feedback')).toHaveClass(/success/);
  await page.locator('#reset').click();await expect(page.locator('#execution-line')).toBeHidden();await expect(page.locator('#code')).toHaveValue(source);
  // Retire a real suspended run, including a Java VM, and preserve the source.
  await page.locator('#run').click();await page.locator('#pause').click();await expect(page.locator('#code')).toHaveAttribute('data-execution-line',/\d+/,{timeout:50000});await page.locator('#stop').click();await expect(page.locator('#status-pill')).toHaveText('STOPPED');await expect(page.locator('#code')).toHaveValue(source);
  await expect.poll(async()=>{const r=await page.request.get(origin+'/api/family',{headers:bypass?{'x-vercel-protection-bypass':bypass}:{}});return (await r.json()).runBusy;},{timeout:30000}).toBe(false);
 });
}
