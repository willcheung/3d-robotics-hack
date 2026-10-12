import { test, expect, type Page } from '@playwright/test';
const main=(body:string)=>`public class Main {\n    public static void main(String[] args) throws Exception {\n${body}\n    }\n}`;
const good=main('Robot.servo(120); Robot.motor(.5); Robot.waitTicks(100); Robot.motor(0); System.out.println("ANGLE " + Math.round(Robot.angle()));');
async function java(page:Page) {await page.getByLabel('Programming language').selectOption('java');}
async function run(page:Page,source:string) {await page.getByLabel('Java code',{exact:true}).fill(source);await page.getByRole('button',{name:'Run code'}).click();}
async function done(page:Page) {await expect(page.locator('#runtime-label')).toHaveText('Program finished');}
test.beforeEach(async({page})=>{await page.goto('/');await java(page);});
test('Java starter teaches syntax, editable real code misses then rescues; progress survives language switch',async({page})=>{
  const editor=page.getByLabel('Java code',{exact:true}), source=await editor.inputValue();
  await expect(editor).toHaveValue(/int turn_ticks = 50;/);await expect(editor).toHaveValue(/Java calls need no await/);await expect(page.locator('#editor-help')).toContainText('Robot.waitTicks');
  await page.screenshot({path:'test-results/s02-java-starter.png',fullPage:true});
  await page.getByRole('button',{name:'Run code'}).click();await done(page);
  await expect(page.locator('#pointer-value')).toHaveText('30.0°');await expect(page.locator('#feedback')).not.toHaveClass(/success/);
  await run(page,source.replace('int turn_ticks = 50;','int turn_ticks = 100;'));await done(page);
  await expect(page.locator('#feedback')).toHaveClass(/success/);await expect(page.locator('#console')).toContainText('Direction: 60 degrees');
  await page.screenshot({path:'test-results/s02-java-success.png',fullPage:true});
  await page.getByLabel('Programming language').selectOption('python');
  await expect(page.locator('#practice-progress')).toContainText('1 of 3');
  await expect(page.getByLabel('Python code',{exact:true})).toHaveValue(/from robot import/);
  await java(page);await expect(editor).toHaveValue(/int turn_ticks = 100;/);
  await page.getByRole('button',{name:'Restore example'}).click();await expect(editor).toHaveValue(source);
  await page.getByLabel('Programming language').selectOption('python');await expect(page.getByLabel('Python code',{exact:true})).toHaveValue(/turn_ticks = 50/);
});
test('separate drafts survive reload and undo never crosses languages',async({page})=>{
  const editor=page.getByLabel('Java code',{exact:true});await editor.fill('// saved java');
  await page.getByLabel('Programming language').selectOption('python');
  const py=page.getByLabel('Python code',{exact:true});await py.fill('# saved python');await py.press('End');await py.pressSequentially(' edited');
  await java(page);await expect(editor).toHaveValue('// saved java');await editor.focus();await editor.press('ControlOrMeta+z');await expect(editor).not.toHaveValue(/saved python/);
  await editor.fill('// final java');await page.reload();await expect(page.getByLabel('Java code',{exact:true})).toHaveValue('// final java');
  await page.getByLabel('Programming language').selectOption('python');await expect(py).toHaveValue('# saved python edited');
});
test('Java braces indent, keyboard Run works, and compiler/runtime failures recover without losing source',async({page})=>{
  const editor=page.getByLabel('Java code',{exact:true});await editor.fill('');await editor.pressSequentially('public class Main {');await editor.press('Enter');await expect(editor).toHaveValue('public class Main {\n    ');
  const broken=main('int count = ;');await run(page,broken);await expect(page.locator('#feedback')).toHaveClass(/error/);await expect(page.locator('#console')).toContainText('Main.java:3');await expect(editor).toHaveValue(broken);
  await run(page,main('throw new Exception("MY ERROR");'));await expect(page.locator('#console')).toContainText('MY ERROR');await expect(page.locator('#feedback')).toHaveClass(/error/);
  await editor.fill(good);await editor.press('ControlOrMeta+Enter');await done(page);await expect(page.locator('#feedback')).toHaveClass(/success/);
});
test('real Java sensor method and loop match Python on both transfer rescues',async({page})=>{
  for(const [target,goal,tilt,power] of [['farther',90,120,.5],['reverse',-60,60,-.5]] as const) {
    await page.getByLabel('Challenge target').selectOption(target);
    await run(page,`public class Main {static void aim(double target, double power) throws Exception {
      Robot.motor(power); while(Math.abs(Robot.angle()-target) > .01) Robot.waitTicks(10); Robot.motor(0);
    } public static void main(String[] args) throws Exception {Robot.servo(${tilt}); aim(${goal},${power});System.out.println(Robot.clock());}}`);
    await done(page);await expect(page.locator('#feedback')).toHaveClass(/success/);await expect(page.locator('#pointer-value')).toHaveText(`${goal.toFixed(1)}°`);
  }
});
test('Stop, Reset and language switch cancel infinite Java and preserve both drafts',async({page})=>{
  const forever=main('Robot.motor(.5); Robot.waitTicks(10); while(true) {}');
  await run(page,forever);await expect(page.locator('#runtime-label')).toHaveText('Java is running');
  await page.getByRole('button',{name:'Stop',exact:true}).click();await expect(page.locator('#status-pill')).toHaveText('STOPPED');await expect(page.getByLabel('Java code',{exact:true})).toHaveValue(forever);
  await run(page,forever);await expect(page.locator('#runtime-label')).toHaveText('Java is running');
  await page.getByLabel('Programming language').selectOption('python');await page.getByLabel('Python code',{exact:true}).fill('print("PYTHON AFTER JAVA")');await page.getByRole('button',{name:'Run code'}).click();await done(page);await expect(page.locator('#console')).toContainText('PYTHON AFTER JAVA');
  await java(page);await expect(page.getByLabel('Java code',{exact:true})).toHaveValue(forever);
  await run(page,good);await expect(page.locator('#runtime-label')).toHaveText('Java is running');await page.getByRole('button',{name:'Reset robot'}).click();await expect(page.locator('#pointer-value')).toHaveText('0.0°');
  await run(page,good);await done(page);await expect(page.locator('#feedback')).toHaveClass(/success/);
});
test('Java output flood/range errors are bounded; no false success; new run recovers',async({page})=>{
  await run(page,main('Robot.motor(2);'));await expect(page.locator('#feedback')).toHaveClass(/error/);await expect(page.locator('#console')).toContainText('power');
  await run(page,main('while(true) System.out.println("flood flood flood flood");'));await expect(page.locator('#feedback')).toHaveClass(/error/);await expect(page.locator('#console')).toContainText('limit');
  expect((await page.locator('#console').textContent())!.length).toBeLessThan(9200);
  await run(page,good);await done(page);await expect(page.locator('#feedback')).toHaveClass(/success/);
});
test('Java runtime outage preserves source and Python still works',async({page})=>{
  await page.route('**/api/java/run',route=>route.fulfill({status:503,body:'unavailable'}));await run(page,good);
  await expect(page.locator('#feedback')).toHaveClass(/error/);await expect(page.getByLabel('Java code',{exact:true})).toHaveValue(good);await expect(page.locator('#console')).toContainText('Java is unavailable');
  await page.getByLabel('Programming language').selectOption('python');await page.getByLabel('Python code',{exact:true}).fill('print("PYTHON AVAILABLE")');await page.getByRole('button',{name:'Run code'}).click();await done(page);await expect(page.locator('#console')).toContainText('PYTHON AVAILABLE');
});
test('narrow Java editor, help and controls remain readable; storage denial retains both drafts in memory',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('.code-panel').screenshot({path:'test-results/s02-java-editor-narrow.png'});
  await page.getByLabel('Java code',{exact:true}).fill('// narrow java');
  await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('storage denied');};});
  await page.getByLabel('Programming language').selectOption('python');await page.getByLabel('Python code',{exact:true}).fill('# in memory');await java(page);await expect(page.getByLabel('Java code',{exact:true})).toHaveValue('// narrow java');
  await expect(page.locator('#draft-status')).toContainText('this tab only');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({path:'test-results/s02-java-narrow.png',fullPage:true});
});
test('Java wall-clock deadline terminates an infinite loop without user Stop',async({page})=>{
  await run(page,main('while(true) {}'));await expect(page.locator('#runtime-label')).toHaveText('Java is running');
  await expect(page.locator('#feedback')).toHaveClass(/error/,{timeout:25000});await expect(page.locator('#console')).toContainText('20 second run limit');
  await run(page,good);await done(page);await expect(page.locator('#feedback')).toHaveClass(/success/);
});
