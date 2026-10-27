import {test,expect,type Page} from '../workshop-fixture.ts';
import {openMission} from '../learning-ui.ts';
import {pythonStarter,javaStarter} from '../../src/starters.ts';
import {sensorReference} from '../../src/lessons.ts';
import {patrolReference} from '../../src/patrol-lesson.ts';
import {armReference} from '../../src/arm-lesson.ts';

const sources = {
 python: 'from robot import motor, wait, angle\nfor repeat in range(2):\n    if repeat == 0:\n        await motor(0.5)\n    else:\n        await motor(0)\n    await wait(5)\nprint(await angle())',
 java: 'public class Main {\n public static void main(String[] args) throws Exception {\n  for (int repeat=0; repeat<2; repeat++) {\n   if (repeat==0) {\n    Robot.motor(0.5);\n   } else {\n    Robot.motor(0);\n   }\n   Robot.waitTicks(5);\n  }\n  System.out.println(Robot.angle());\n }\n}',
};
async function ready(page:Page) {
 await expect(page.locator('#status-pill')).not.toHaveText('LOADING',{timeout:47000});
 await expect(page.locator('#code')).toHaveAttribute('data-execution-line',/\d+/);
}
async function line(page:Page){return Number(await page.locator('#code').getAttribute('data-execution-line'));}
async function step(page:Page){await page.locator('#step').click();await expect(page.locator('#execution-status')).toContainText('Paused on');await expect(page.locator('#step')).toBeEnabled();}
for(const language of ['python','java'] as const){
 test(`${language}: real line visits, loops, branches and one-line stepping`,async({page})=>{
  await page.locator('#language').selectOption(language);await page.locator('#code').fill(sources[language]);
  await page.locator('#run').click();await page.locator('#pause').click();await ready(page);
  const visited:number[]=[];
  for(let i=0;i<35;i++){
   if(await page.locator('#status-pill').textContent()!=='RUNNING')break;
   visited.push(await line(page));
   await page.locator('#step').click();
   await expect.poll(async()=>await page.locator('#status-pill').textContent()==='FINISHED'||await page.locator('#step').isEnabled(),{timeout:5000}).toBe(true);
   if(await page.locator('#status-pill').textContent()!=='RUNNING')break;
   await expect(page.locator('#execution-status')).toContainText('Paused on');
  }
  await expect(page.locator('#status-pill')).toHaveText('FINISHED');
  const motor=language==='python'?4:5,other=language==='python'?6:7,wait=language==='python'?7:9;
  expect(visited.indexOf(motor)).toBeLessThan(visited.indexOf(other));
  expect(visited.filter(n=>n===wait)).toHaveLength(2);
  expect(visited.filter(n=>n===(language==='python'?3:4))).toHaveLength(2);
  await expect(page.locator('#pointer-value')).toHaveText('3.0°');
  await expect(page.locator('#time-value')).toHaveText('0.20s');
  await expect(page.locator('#execution-line')).toBeHidden();
 });
 test(`${language}: Pause freezes motion, Step finishes wait, edits and Stop recover`,async({page})=>{
  const source=language==='python'?'from robot import motor, wait\nawait motor(.5)\nawait wait(100)\nawait motor(0)':'public class Main {\n public static void main(String[] args) throws Exception {\n Robot.motor(.5);\n Robot.waitTicks(100);\n Robot.motor(0);\n }\n}';
  await page.locator('#language').selectOption(language);await page.locator('#execution-speed').selectOption('0.5');await page.locator('#code').fill(source);await page.locator('#run').click();await ready(page);
  await expect(page.locator('#pointer-value')).not.toHaveText('0.0°');
  await page.locator('#pause').click();const frozen=await page.locator('#time-value').textContent();
  await page.waitForTimeout(300);await expect(page.locator('#time-value')).toHaveText(frozen!);
  await expect(page.locator('#code')).toHaveAttribute('data-execution-line',String(language==='python'?3:4));
  await page.locator('#execution-speed').selectOption('2');await step(page);
  await expect(page.locator('#time-value')).toHaveText('2.00s');await expect(page.locator('#pointer-value')).toHaveText('60.0°');
  await expect(page.locator('#code')).toHaveAttribute('data-execution-line',String(language==='python'?4:5));
  await page.locator('#code').fill(source+'\n');await expect(page.locator('#execution-line')).toBeHidden();await expect(page.locator('#execution-status')).toContainText('when you pressed Run');
  await page.locator('#code').fill(source);await expect(page.locator('#execution-line')).toBeVisible();
  await page.screenshot({path:`test-results/tracing-${language}-desktop.png`,fullPage:true});
  await page.locator('#stop').click();await expect(page.locator('#status-pill')).toHaveText('STOPPED');await expect(page.locator('#execution-line')).toBeHidden();await expect(page.locator('#code')).toHaveValue(source);
  await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('FINISHED',{timeout:47000});
 });
 for(const mission of ['L01','L02','L03','L04'] as const){
  test(`${mission} ${language}: traced reference preserves model result at both speeds`,async({page})=>{
   test.setTimeout(120000);await openMission(page,mission);await page.locator('#language').selectOption(language);
   const source=mission==='L01'?(language==='python'?pythonStarter:javaStarter).replace('turn_ticks = 50','turn_ticks = 100').replace('turnTicks = 50','turnTicks = 100'):mission==='L02'?sensorReference[language]:mission==='L03'?patrolReference[language]:armReference[language];
   await page.locator('#code').fill(source);
   const times:string[]=[];
   for(const speed of ['2','0.5']){
    await page.locator('#execution-speed').selectOption(speed);await page.locator('#run').click();await ready(page);
    await expect(page.locator('#status-pill')).toHaveText('FINISHED',{timeout:50000});await expect(page.locator('#feedback')).toHaveClass(/success/);
    times.push((await page.locator('#time-value').textContent())!);
   }
   expect(times[0]).toBe(times[1]);
  });
 }
}
test.use({checkedMissions:['L01','L02','L03']});

for(const language of ['python','java'] as const){
 test(`${language}: helpers, untaken branch, error cleanup and context changes`,async({page})=>{
  const source=language==='python'?'from robot import motor, wait\ndef power():\n    return 0.5\nasync def move():\n    await motor(power())\n    await wait(5)\nawait move()\nif False:\n    await motor(-1)\nawait motor(0)':'public class Main {\n static double power() {\n  return 0.5;\n }\n static void move() throws Exception {\n  Robot.motor(power());\n  Robot.waitTicks(5);\n }\n public static void main(String[] args) throws Exception {\n  move();\n  if(Robot.angle()<0) {\n   Robot.motor(-1);\n  }\n  Robot.motor(0);\n }\n}';
  await page.locator('#language').selectOption(language);await page.locator('#code').fill(source);
  await page.evaluate(()=>{(window as any).commandLines=[];window.addEventListener('message',event=>{if(event.data?.payload?.type==='command')(window as any).commandLines.push({op:event.data.payload.command.op,line:Number(document.querySelector('#code')!.getAttribute('data-execution-line'))});});});
  await page.evaluate(()=>{(window as any).traceVisits=[];new MutationObserver(()=>{const n=Number(document.querySelector('#code')!.getAttribute('data-execution-line'));if(n)(window as any).traceVisits.push(n);}).observe(document.querySelector('#code')!,{attributes:true,attributeFilter:['data-execution-line']});});
  await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('FINISHED',{timeout:47000});
  const visits=await page.evaluate(()=>(window as any).traceVisits as number[]);
  if(language==='python'){const commands=await page.evaluate(()=>(window as any).commandLines);expect(commands.find((m:any)=>m.op==='motor').line).toBe(5);}
  expect(visits).toContain(3);expect(visits).toContain(language==='python'?6:7);expect(visits).not.toContain(language==='python'?9:12);
  await expect(page.locator('#pointer-value')).toHaveText('3.0°');
  const invalid=language==='python'?'from robot import motor\nawait motor(2)':'public class Main { public static void main(String[] a) throws Exception { Robot.motor(2); } }';
  await page.locator('#code').fill(invalid);await page.locator('#run').click();await expect(page.locator('#status-pill')).toHaveText('ERROR',{timeout:47000});await expect(page.locator('#execution-line')).toBeHidden();await expect(page.locator('#pause')).toBeDisabled();await expect(page.locator('#code')).toHaveValue(invalid);
  await page.locator('#code').fill(source);await page.locator('#run').click();await page.locator('#pause').click();await ready(page);
  await page.locator('#language').selectOption(language==='python'?'java':'python');await expect(page.locator('#execution-line')).toBeHidden();await expect(page.locator('#step')).toBeDisabled();
  await page.waitForTimeout(150);await expect(page.locator('#status-pill')).toHaveText('READY');
 });
}
test('Python unsupported stack switching retains ordinary Run without a stuck Pause',async({page})=>{
 // A real runtime with its feature absent, not a fabricated sequence of lines.
 await page.route('**/worker.js',async route=>{const response=await route.fetch();let body=await response.text();body=body.replace('can_run_sync()\n`);','False\n`);');await route.fulfill({response,body});});
 await page.locator('#execution-speed').selectOption('0.25');await page.locator('#code').fill('from robot import wait\nawait wait(5)');await page.locator('#run').click();await page.locator('#pause').click();
 await expect(page.locator('#status-pill')).toHaveText('FINISHED',{timeout:47000});await expect(page.locator('#time-value')).toHaveText('0.10s');await expect(page.locator('#execution-speed')).toHaveValue('1');await expect(page.locator('#execution-line')).toBeHidden();
});
test('paused highlight stays aligned while scrolling; narrow controls fit and keyboard focus stays usable',async({page})=>{
 await page.locator('#code').fill('# comment\n'.repeat(40)+'x = 1\nprint(x)');await page.locator('#run').click();await page.locator('#pause').click();await ready(page);
 await expect(page.locator('#code')).toHaveAttribute('data-execution-line','41');
 const aligned=await page.evaluate(()=>{const code=document.querySelector<HTMLTextAreaElement>('#code')!,marker=document.querySelector<HTMLElement>('#execution-line')!;return Math.abs(parseFloat(marker.style.top)-(40*parseFloat(getComputedStyle(code).lineHeight)-code.scrollTop))<1;});expect(aligned).toBe(true);
 await page.locator('#code').focus();await page.locator('#code').press('Escape');await page.locator('#code').press('Tab');await expect(page.locator('#code')).not.toBeFocused();
 await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
 await page.screenshot({path:'test-results/tracing-narrow.png',fullPage:true});await page.locator('#stop').click();
});
