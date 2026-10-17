import { test, expect, type Page } from '@playwright/test';
const runtimeOrigin = process.env.VITE_RUNTIME_ORIGIN || 'http://127.0.0.1:4174';
const good = `from robot import motor, servo, wait, angle
await servo(120)
await motor(0.5)
await wait(100)
await motor(0)
print("ANGLE", round(await angle()))`;
async function run(page: Page, source: string) {
  await page.getByLabel('Python code', {exact:true}).fill(source);
  await page.getByRole('button', {name:'Run code'}).click();
}
async function done(page: Page) { await expect(page.locator('#runtime-label')).toHaveText('Program finished'); }
async function error(page: Page, text: string | RegExp) { await expect(page.locator('#feedback')).toHaveClass(/error/); await expect(page.getByLabel('Python console')).toContainText(text); }
test.beforeEach(async ({ page }) => { await page.goto('/'); });
test('diagram labels connect each real command to its moving part and follow camera views', async ({page}) => {
  const motor = page.locator('#motor-label'), servo = page.locator('#servo-label');
  await expect(motor).toContainText('motor(power)'); await expect(servo).toContainText('servo(degrees)');
  await expect(page.locator('.motion-key')).toContainText('wait(ticks) lets both movements advance');
  await expect(page.locator('.scene')).toHaveClass(/scene-labeled/);
  const endpoints = () => page.locator('.component-lines circle').evaluateAll(nodes => nodes.map(n => [n.getAttribute('cx'), n.getAttribute('cy')]));
  await expect.poll(async () => (await endpoints()).every(pair => pair.every(v => v !== null && Number.isFinite(Number(v))))).toBe(true);
  await page.getByRole('region', {name:'Robot workbench'}).screenshot({path:'test-results/s01-component-labels.png'});
  await run(page, 'from robot import motor, wait\nawait motor(0.5)\nawait wait(50)\nawait motor(0)'); await done(page);
  await expect(page.locator('#pointer-value')).toHaveText('30.0°'); await expect(page.locator('#scanner-value')).toHaveText('90.0°');
  await run(page, 'from robot import servo, wait\nawait servo(120)\nawait wait(50)'); await done(page);
  await expect(page.locator('#pointer-value')).toHaveText('0.0°'); await expect(page.locator('#scanner-value')).toHaveText('120.0°');
  const before = await endpoints();
  await page.getByRole('button',{name:'Top view',exact:true}).click();
  await expect.poll(endpoints).not.toEqual(before);
  await expect(motor).toBeVisible(); await expect(servo).toBeVisible();
  await page.getByRole('region', {name:'Robot workbench'}).screenshot({path:'test-results/s01-component-labels-top.png'});
  await page.getByRole('button',{name:'Reset camera',exact:true}).click();
  await expect(page.locator('#pointer-value')).toHaveText('0.0°'); await expect(page.locator('#scanner-value')).toHaveText('120.0°');
  await page.setViewportSize({width:390,height:844});
  const boxes = await page.locator('.component-label').evaluateAll(nodes => nodes.map(n => {
    const r=n.getBoundingClientRect(); return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};
  }));
  for(const box of boxes){expect(box.left).toBeGreaterThanOrEqual(0);expect(box.right).toBeLessThanOrEqual(390);}
  expect(boxes[0].top).toBeGreaterThan(boxes[1].bottom);
  await page.getByRole('region', {name:'Robot workbench'}).screenshot({path:'test-results/s01-component-labels-mobile.png'});
});
test('fresh launch, real edit, wrong/reference program, reset/restore, persistent draft', async ({ page }, testInfo) => {
  await expect(page.getByRole('heading', {name:'Signal Station.'})).toBeVisible();
  await expect(page.locator('#mission-job')).toContainText('so the rescue team can find their pickup point');
  await expect(page.locator('.real-world-help')).toHaveJSProperty('open',false);
  await page.locator('.real-world-help>summary').click();
  await expect(page.getByRole('heading', {name:'Point a camera at a doorway.'})).toBeVisible();
  await page.locator('.real-world-help>summary').click();
  await expect(page.locator('#crew-status')).toHaveText('North ridge crew · waiting for light');
  await page.screenshot({path:'test-results/s01-waiting.png',fullPage:true});
  const source = await page.getByLabel('Python code', {exact:true}).inputValue();
  const cold = Date.now();
  await page.getByRole('button', {name:'Run code'}).click(); await done(page);
  testInfo.annotations.push({type:'cold-start-through-one-second-simulation-ms',description:String(Date.now()-cold)});
  await expect(page.locator('#pointer-value')).toHaveText('30.0°'); await expect(page.locator('#feedback')).not.toHaveClass(/success/);
  await expect(page.locator('#crew-status')).toHaveText('North ridge crew · waiting for light');
  const warm=Date.now(); await run(page,source.replace('turn_ticks = 50','turn_ticks = 100')); await done(page);
  testInfo.annotations.push({type:'warm-start-through-two-second-simulation-ms',description:String(Date.now()-warm)});
  await expect(page.locator('#feedback-title')).toHaveText('Crew located. Pickup point lit!');
  await expect(page.locator('#crew-status')).toHaveText('North ridge crew located · pickup point lit');
  await expect(page.locator('#pointer-value')).toHaveText('60.0°'); await expect(page.locator('#scanner-value')).toHaveText('120.0°');
  await page.screenshot({path:'test-results/s01-success.png',fullPage:true});
  await page.getByRole('button',{name:'Reset robot'}).click();
  await expect(page.locator('#crew-status')).toHaveText('North ridge crew · waiting for light');
  await expect(page.locator('#pointer-value')).toHaveText('0.0°'); await expect(page.getByLabel('Python code',{exact:true})).toHaveValue(/turn_ticks = 100/);
  await page.reload(); await expect(page.getByLabel('Python code',{exact:true})).toHaveValue(/turn_ticks = 100/);
  await page.getByRole('button',{name:'Restore example'}).click(); await expect(page.getByLabel('Python code',{exact:true})).toHaveValue(source);
  await page.getByRole('button',{name:'Run code'}).click(); await done(page); await expect(page.locator('#pointer-value')).toHaveText('30.0°');
});
test('Python variables, loops, function and sensor-dependent branch', async ({page}) => {
  await run(page, `from robot import motor, servo, wait, angle, scanner, clock
async def sweep(goal):
    await motor(0.5)
    while await angle() < goal - 0.01:
        await wait(10)
    await motor(0)
await servo(120)
await sweep(60)
assert abs(await angle() - 60) < 0.01
assert await scanner() == 120
assert await clock() == 2
print('LOOP FUNCTION SENSOR PASS')`);
  await done(page); await expect(page.locator('#feedback')).toHaveClass(/success/); await expect(page.getByLabel('Python console')).toContainText('LOOP FUNCTION SENSOR PASS');
});
test('await accepts settings; only wait advances motion and sensors observe completed ticks', async ({page}) => {
  await run(page, `from robot import motor, servo, wait, angle, scanner, clock
await servo(120)
await motor(0.5)
assert await angle() == 0
assert await scanner() == 90
assert await clock() == 0
await wait(5)
assert abs(await angle() - 3) < 0.000001
assert abs(await scanner() - 102) < 0.000001
assert await clock() == 0.1
await motor(0)
await wait(45)
assert abs(await angle() - 3) < 0.000001
assert await scanner() == 120
assert await clock() == 1
print('AWAIT SETTINGS, SHARED TIME, SENSOR READS PASS')`);
  await done(page);
  await expect(page.getByLabel('Python console')).toContainText('AWAIT SETTINGS, SHARED TIME, SENSOR READS PASS');
  await expect(page.locator('#pointer-value')).toHaveText('3.0°');
  await expect(page.locator('#scanner-value')).toHaveText('120.0°');
  await expect(page.locator('#time-value')).toHaveText('1.00s');
  await expect(page.locator('#feedback')).not.toHaveClass(/success/);
});
test('both transfer targets and overshoot produce correct feedback', async ({page}) => {
  await page.getByLabel('Challenge target').selectOption('farther');
  await expect(page.locator('#mission-job')).toContainText('east lookout');
  await run(page,good.replace('wait(100)','wait(150)')); await done(page); await expect(page.locator('#feedback')).toHaveClass(/success/);
  await expect(page.locator('#crew-status')).toHaveText('East lookout crew located · pickup point lit');
  await page.screenshot({path:'test-results/s01-east-lookout.png',fullPage:true});
  await page.getByLabel('Challenge target').selectOption('reverse');
  await expect(page.locator('#mission-job')).toContainText('Turn left and tilt the searchlight down');
  await expect(page.locator('#crew-status')).toHaveText('Lower cove crew · waiting for light');
  await run(page,good.replace('servo(120)','servo(60)').replace('motor(0.5)','motor(-0.5)')); await done(page); await expect(page.locator('#feedback')).toHaveClass(/success/);
  await expect(page.locator('#crew-status')).toHaveText('Lower cove crew located · pickup point lit');
  await page.screenshot({path:'test-results/s01-lower-cove.png',fullPage:true});
  await page.getByLabel('Challenge target').selectOption('beacon');
  await run(page,good.replace('wait(100)','wait(150)')); await done(page); await expect(page.locator('#feedback')).not.toHaveClass(/success/);
  await expect(page.locator('#crew-status')).toHaveText('North ridge crew · waiting for light');
  // A correct direction alone cannot locate the crew: the beam must reach their height.
  await run(page,good.replace('servo(120)','servo(90)')); await done(page);
  await expect(page.locator('#pointer-value')).toHaveText('60.0°');
  await expect(page.locator('#crew-status')).toHaveText('North ridge crew · waiting for light');
  await expect(page.locator('#feedback')).not.toHaveClass(/success/);
});
test('camera orbit, pan, zoom, top/reset and keyboard never move mechanism', async ({page}) => {
  await run(page,good); await done(page);
  const canvas=page.locator('canvas'); const box=(await canvas.boundingBox())!;
  const before=await canvas.screenshot();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down(); await page.mouse.move(box.x+box.width/2+90,box.y+box.height/2+30,{steps:10}); await page.mouse.up();
  await page.mouse.down({button:'right'}); await page.mouse.move(box.x+box.width/2+40,box.y+box.height/2+70,{steps:8}); await page.mouse.up({button:'right'});
  await page.mouse.wheel(0,-120);
  expect(Buffer.compare(before,await canvas.screenshot())).not.toBe(0);
  await page.getByRole('button',{name:'Top view',exact:true}).click(); await page.getByRole('button',{name:'Zoom in',exact:true}).click(); await page.getByRole('button',{name:'Zoom out',exact:true}).click();
  await expect(page.getByRole('button',{name:/graphics|ECO/})).toHaveCount(0);
  await canvas.focus(); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowUp'); await page.keyboard.press('Home');
  await page.getByRole('button',{name:'Reset camera',exact:true}).click();
  await expect(page.locator('#pointer-value')).toHaveText('60.0°'); await expect(page.locator('#scanner-value')).toHaveText('120.0°'); await expect(page.locator('#time-value')).toHaveText('2.00s');
});
test('hard stop infinite Python loop, retain code, new worker recovers', async ({page}) => {
  const source='while True:\n    pass'; await run(page,source);
  await expect(page.locator('#runtime-label')).toHaveText('Python is running');
  await page.getByRole('button',{name:'Stop',exact:true}).click();
  await expect(page.locator('#runtime-label')).toHaveText('Worker stopped'); await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByLabel('Python code',{exact:true})).toHaveValue(source);
  await run(page,good); await done(page); await expect(page.locator('#feedback')).toHaveClass(/success/);
});
test('automatic deadline terminates infinite loop', async ({page}) => {
  await run(page,'while True:\n    pass');
  await expect(page.locator('#feedback')).toHaveClass(/error/,{timeout:35000}); await expect(page.getByLabel('Python console')).toContainText('20 second run limit'); await expect(page.locator('iframe')).toHaveCount(0);
});
test('output flood is bounded, terminates and can run again', async ({page}) => {
  await run(page,"while True:\n    print('x' * 1024)"); await error(page,/Console limit/);
  expect((await page.getByLabel('Python console').innerText()).length).toBeLessThan(12500);
  await run(page,'print("RECOVERED")'); await done(page); await expect(page.getByLabel('Python console')).toHaveText('RECOVERED\n');
});
test('syntax/runtime/API errors show source and preserve draft', async ({page}) => {
  await run(page,'broken ='); await error(page,/student.py|SyntaxError/); await expect(page.getByLabel('Python code',{exact:true})).toHaveValue('broken =');
  await run(page,'1 / 0'); await error(page,'ZeroDivisionError');
  await run(page,'from robot import motor\nawait motor(2)'); await error(page,'Motor power');
  await run(page,'from robot import wait\nawait wait(0.5)'); await error(page,'whole ticks');
});
test('reset during wait cancels old commands, fast new run remains isolated', async ({page}) => {
  await run(page,'from robot import motor, wait\nawait motor(1)\nawait wait(600)');
  await expect(page.locator('#pointer-value')).not.toHaveText('0.0°');
  await page.getByRole('button',{name:'Reset robot'}).click(); await expect(page.locator('iframe')).toHaveCount(0);
  await run(page,'print("CLEAN")'); await done(page); await expect(page.locator('#pointer-value')).toHaveText('0.0°'); await expect(page.locator('#time-value')).toHaveText('0.00s');
});
test('student JS cannot forge scores, extra fields or unordered messages', async ({page}) => {
  const messages = [{type:'done',score:100}, {type:'command',id:1,command:{op:'setState',value:60}}, {type:'command',id:2,command:{op:'motor',value:1}}];
  for (const message of messages){
    await run(page,`import js, json\nfrom pyodide.ffi import to_js\njs.postMessage(to_js(json.loads('${JSON.stringify(message)}'), dict_converter=js.Object.fromEntries))\nawait __import__('asyncio').sleep(1)`);
    await error(page,/Unexpected runtime fields|Unknown robot command|ordered/); await expect(page.locator('#pointer-value')).toHaveText('0.0°');
  }
  await run(page,"import js\nfrom pyodide.ffi import to_js\njs.postMessage(to_js({'type':'done'}, dict_converter=js.Object.fromEntries))");
  await done(page); await expect(page.locator('#feedback')).not.toHaveClass(/success/);
});
test('SOP and CSP prevent actual fetch/socket/worker escape through Python JS interop', async ({page}) => {
  await run(page, `import js, asyncio
from pyodide.ffi import create_proxy, to_js
def violation(event):
    print('CSP', event.effectiveDirective, event.blockedURI)
js.addEventListener('securitypolicyviolation', create_proxy(violation))
try:
    await js.fetch('${process.env.APP_ORIGIN || 'http://127.0.0.1:4173'}/')
    print('UNSAFE APP FETCH')
except Exception:
    print('APP FETCH BLOCKED')
try:
    await js.fetch('https://example.com/')
    print('UNSAFE NETWORK')
except Exception:
    print('NETWORK BLOCKED')
socket_result = asyncio.get_event_loop().create_future()
def socket_open(event):
    if not socket_result.done(): socket_result.set_result('UNSAFE SOCKET OPEN')
def socket_error(event):
    if not socket_result.done(): socket_result.set_result('SOCKET BLOCKED')
try:
    sock = js.WebSocket.new('wss://example.com/socket')
    sock.addEventListener('open', create_proxy(socket_open))
    sock.addEventListener('error', create_proxy(socket_error))
    print(await asyncio.wait_for(socket_result, 3))
except Exception as e:
    print('SOCKET BLOCKED', type(e).__name__)
try:
    js.Worker.new('/worker.js', to_js({'type':'module'}, dict_converter=js.Object.fromEntries))
    print('NESTED WORKER CONSTRUCTED')
except Exception:
    print('NESTED WORKER BLOCKED')
print('HAS DOCUMENT', hasattr(js, 'document'))
print('HAS LOCALSTORAGE', hasattr(js, 'localStorage'))
print('HAS PARENT', hasattr(js, 'parent'))
await asyncio.sleep(0.2)`);
  await done(page);
  const consoleText=await page.getByLabel('Python console').innerText();
  expect(consoleText).toContain('APP FETCH BLOCKED'); expect(consoleText).toContain('NETWORK BLOCKED'); expect(consoleText).toContain('SOCKET BLOCKED'); expect(consoleText).not.toContain('UNSAFE');
  expect(consoleText).toContain('HAS DOCUMENT False'); expect(consoleText).toContain('HAS LOCALSTORAGE False'); expect(consoleText).toContain('HAS PARENT False');
  expect(consoleText).toContain('CSP worker-src');
  expect(consoleText).toContain('CSP connect-src');
});
test('runtime headers, pinned WASM asset loading, no cross-origin app access from iframe', async ({page,request}) => {
  const worker=await request.get(`${runtimeOrigin}/worker.js`);
  expect(worker.headers()['content-security-policy']).toContain("worker-src 'none'");
  expect(worker.headers()['content-security-policy']).toContain("connect-src 'self'");
  const wasm=await request.get(`${runtimeOrigin}/pyodide/pyodide.asm.wasm`); expect(wasm.ok()).toBeTruthy(); expect(wasm.headers()['content-type']).toBe('application/wasm');
  const stdlib=await request.get(`${runtimeOrigin}/pyodide/python_stdlib.zip`); expect(stdlib.ok()).toBeTruthy();
  await run(page,'while True:\n    pass'); await expect(page.locator('#runtime-label')).toHaveText('Python is running');
  const frame=page.frames().find(f=>f.url().startsWith(runtimeOrigin))!;
  const canRead=await frame.evaluate(()=>{try{return Boolean(parent.document.body)}catch{return false}}); expect(canRead).toBe(false);
  await page.getByRole('button',{name:'Stop',exact:true}).click();
});
test('narrow screen and reduced motion remain usable', async ({page}) => {
  await page.setViewportSize({width:390,height:844}); await page.emulateMedia({reducedMotion:'reduce'}); await page.reload();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await expect(page.getByLabel('Python code',{exact:true})).toBeVisible();
  await run(page,good); await done(page); await expect(page.locator('#feedback')).toHaveClass(/success/);
  await page.screenshot({path:'test-results/s01-mobile.png',fullPage:true});
});
test('unavailable runtime keeps code, allows Stop and recovery', async ({page}) => {
  await page.route(`${runtimeOrigin}/**`, route=>route.abort());
  await run(page,'print("KEPT")'); await expect(page.locator('#runtime-label')).toHaveText('Loading real Python…');
  await page.getByRole('button',{name:'Stop',exact:true}).click(); await expect(page.getByLabel('Python code',{exact:true})).toHaveValue('print("KEPT")');
  await page.unroute(`${runtimeOrigin}/**`); await page.getByRole('button',{name:'Run code'}).click(); await done(page); await expect(page.getByLabel('Python console')).toContainText('KEPT');
});
test('running source snapshot is stable while student edits the next draft', async ({page}) => {
  await run(page,good); await expect(page.locator('#runtime-label')).toHaveText('Python is running');
  await page.getByLabel('Python code',{exact:true}).fill('print("NEXT DRAFT")'); await done(page);
  await expect(page.locator('#feedback')).toHaveClass(/success/); await expect(page.getByLabel('Python code',{exact:true})).toHaveValue('print("NEXT DRAFT")');
  await page.getByRole('button',{name:'Run code'}).click(); await done(page); await expect(page.getByLabel('Python console')).toContainText('NEXT DRAFT'); await expect(page.locator('#pointer-value')).toHaveText('0.0°');
});
test('slow browser frames catch up without skipping fixed model ticks', async ({page}) => {
  await run(page, good.replace('wait, angle', 'wait, angle, clock') + '\nprint("SIMULATED", await clock())');
  await expect(page.locator('#runtime-label')).toHaveText('Python is running');
  // Compete for the UI thread like software rendering on a slow machine.
  // This does not replace clocks, model functions, messages, or real Python.
  await page.evaluate(() => {
    const until = performance.now() + 12000;
    const busyFrame = () => {
      if (performance.now() >= until) return;
      const end = performance.now() + 120;
      while (performance.now() < end) { /* bounded main-thread work */ }
      requestAnimationFrame(busyFrame);
    };
    requestAnimationFrame(busyFrame);
  });
  await expect(page.locator('#runtime-label')).toHaveText('Program finished', {timeout:8000});
  await expect(page.locator('#feedback')).toHaveClass(/success/);
  await expect(page.locator('#pointer-value')).toHaveText('60.0°');
  await expect(page.getByLabel('Python console')).toHaveText('ANGLE 60\nSIMULATED 2\n');
});
test('unsupported WebGL explains fallback and Python still works', async ({page}) => {
  await page.addInitScript(()=>{
    const getContext=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){ if(type.startsWith('webgl'))return null; return getContext.apply(this,[type,...args] as never); } as typeof getContext;
  });
  await page.reload(); await expect(page.getByText('3D needs WebGL.',{exact:false})).toBeVisible();
  await run(page,good); await done(page); await expect(page.locator('#feedback')).toHaveClass(/success/);
});
test('render cadence and runtime startup evidence on the test machine', async ({page,browser},testInfo) => {
  const stats=await page.evaluate(async()=>{
    const intervals:number[]=[];let previous=performance.now();
    await new Promise<void>(resolve=>{function frame(now:number){intervals.push(now-previous);previous=now;if(intervals.length<90)requestAnimationFrame(frame);else resolve()} requestAnimationFrame(frame)});
    const canvas=document.querySelector('canvas')!;const gl=canvas.getContext('webgl2')!; const info=gl.getExtension('WEBGL_debug_renderer_info');
    return {fps:1000/(intervals.slice(5).reduce((a,b)=>a+b,0)/85),renderer:info?gl.getParameter(info.UNMASKED_RENDERER_WEBGL):'unavailable',userAgent:navigator.userAgent};
  });
  await testInfo.attach('render-metrics',{body:JSON.stringify({...stats,browser:browser.version(),platform:process.platform,arch:process.arch},null,2),contentType:'application/json'});
  expect(stats.fps).toBeGreaterThan(0); // Record measured performance; no invented cross-device benchmark claim.
});

test('malformed runtime paths cannot crash the local server', async ({request}) => {
  const bad=await request.get(`${runtimeOrigin}/%`); expect(bad.status()).toBe(400);
  const post=await request.post(`${runtimeOrigin}/worker.js`,{data:'ignored'}); expect(post.status()).toBe(405);
  expect((await request.get('/')).ok()).toBe(true);
});
test('missing runtime hits startup deadline and preserves the source', async ({page}) => {
  await page.clock.install();
  await page.route(`${runtimeOrigin}/**`,route=>route.abort());
  await run(page,'print("PRESERVED")');
  await page.clock.fastForward(45001);
  await error(page,'Python did not load in 45 seconds'); await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.getByLabel('Python code',{exact:true})).toHaveValue('print("PRESERVED")');
});

test('teaching copy, keyboard editing, undo, indentation, escape and shortcut Run work', async ({page}) => {
  await expect(page.getByText('Python · Mission 1',{exact:true})).toBeVisible();
  await expect(page.locator('.build-status')).toContainText('Run real Python or Java');
  await expect(page.locator('#value-guide')).toContainText('50 ticks = 1 second');
  await page.locator('.real-world-help>summary').click();
  await expect(page.getByText('REAL LIFE MACHINES / ROBOTS',{exact:true})).toBeVisible();
  await page.locator('.real-world-help>summary').click();
  const editor = page.getByLabel('Python code',{exact:true});
  await expect(editor).toHaveValue(/# Store the waiting time: 1 to 600 whole ticks per wait/);
  await editor.fill(''); await editor.pressSequentially('for i in range(2):'); await editor.press('Enter');
  await editor.pressSequentially('print(i)');
  await expect(editor).toHaveValue('for i in range(2):\n    print(i)');
  await editor.press('Home'); await editor.press('Shift+Tab');
  await expect(editor).toHaveValue('for i in range(2):\nprint(i)');
  await editor.press('ControlOrMeta+z');
  await expect(editor).toHaveValue('for i in range(2):\n    print(i)');
  await editor.press('ControlOrMeta+Shift+z');
  await expect(editor).toHaveValue('for i in range(2):\nprint(i)');
  await editor.press('ControlOrMeta+z');
  await expect(editor).toHaveValue('for i in range(2):\n    print(i)');
  await editor.press('ControlOrMeta+a'); await editor.press('Tab');
  await expect(editor).toHaveValue('    for i in range(2):\n        print(i)');
  await editor.press('Shift+Tab'); await expect(editor).toHaveValue('for i in range(2):\n    print(i)');
  await editor.press('Escape'); await editor.press('Tab');
  await expect(editor).not.toBeFocused();
  await editor.focus(); await editor.press('ControlOrMeta+Enter'); await done(page);
  await expect(page.getByLabel('Python console')).toHaveText('0\n1\n');
  await page.reload(); await expect(editor).toHaveValue('for i in range(2):\n    print(i)');
});

test('invalid robot values stop without losing code or unlocking progress', async ({page}) => {
  const cases = [
    ['motor(-1.01)', 'between -1 and 1'], ['motor(1.01)', 'between -1 and 1'],
    ['servo(-0.01)', 'between 0 and 180'], ['servo(180.01)', 'between 0 and 180'],
    ['wait(0)', '1–600 whole ticks'], ['wait(601)', '1–600 whole ticks'], ['wait(2.5)', '1–600 whole ticks'],
    ['motor("0.5")', 'finite number'], ['servo(float("nan"))', 'finite number'],
  ];
  for (const [call, message] of cases) {
    const source = `from robot import motor, servo, wait\nawait ${call}\nprint("SHOULD NOT RUN")`;
    await run(page,source); await error(page,message);
    await expect(page.getByLabel('Python console')).not.toContainText('SHOULD NOT RUN');
    await expect(page.getByLabel('Python code',{exact:true})).toHaveValue(source);
    await expect(page.locator('#next-rescue')).toBeDisabled();
    await expect(page.locator('#practice-progress')).toHaveText('0 of 3 completed this visit');
  }
});

test('range edges and travel clamps finish after a delayed Python startup', async ({page}) => {
  let delayed = false;
  await page.route(url=>url.origin===runtimeOrigin && url.searchParams.has('parent'), async route => {
    delayed = true;
    await new Promise(resolve => setTimeout(resolve, 4000));
    await route.continue();
  });
  await run(page,`from robot import motor, servo, wait, angle, scanner, clock
await motor(-1)
await servo(0)
await wait(1)
await motor(1)
await servo(180)
await wait(600)
await motor(0)
print(round(await angle()), round(await scanner()), round(await clock(), 2))`);
  // Loading and execution have separate budgets. Do not charge a 12-second
  // simulation for cold startup; keep the 15-second execution assertion.
  await expect(page.locator('#runtime-label')).toHaveText('Python is running');
  expect(delayed).toBe(true);
  await done(page); await expect(page.getByLabel('Python console')).toHaveText('150 180 12.02\n');
  await expect(page.locator('#feedback')).not.toHaveClass(/error|success/);
});

test('next rescue preserves code, counts unique successes and advances to Mission 2 without losing Mission 1', async ({page}) => {
  const next=page.locator('#next-rescue'); await expect(next).toBeDisabled();
  await run(page,good.replace('wait(100)','wait(50)')); await done(page); await expect(next).toBeDisabled();
  await run(page,good); await done(page); await expect(next).toBeEnabled();
  await page.getByRole('button',{name:'Run code'}).click(); await done(page);
  await expect(page.locator('#practice-progress')).toHaveText('1 of 3 crew locations reached in this visit.');
  await next.click(); await expect(page.getByLabel('Challenge target')).toHaveValue('farther');
  await expect(page.getByLabel('Python code',{exact:true})).toHaveValue(good); await expect(next).toBeDisabled();
  await run(page,good.replace('wait(100)','wait(150)')); await done(page); await next.click();
  await expect(page.getByLabel('Challenge target')).toHaveValue('reverse');
  await run(page,good.replace('servo(120)','servo(60)').replace('motor(0.5)','motor(-0.5)')); await done(page);
  await expect(page.locator('#practice-progress')).toHaveText('3 of 3 crew locations reached in this visit.');
  await expect(next).toBeHidden(); await expect(page.locator('#next-help')).toContainText('Continue to Mission 2');
  await page.locator('#next-lesson').click();await expect(page.locator('#lesson')).toHaveValue('L02');await expect(page.locator('#code')).toHaveValue(/reading = await angle/);
  await page.locator('#lesson').selectOption('L01');await expect(page.locator('#code')).toHaveValue(/motor\(-0.5\)/);
  await page.screenshot({path:'test-results/s01-complete.png',fullPage:true});
  await page.reload(); await expect(page.locator('#practice-progress')).toHaveText('0 of 3 crew locations reached in this visit.');
  await expect(page.getByLabel('Python code',{exact:true})).toHaveValue(/motor\(-0.5\)/);
});

test('storage failure and oversized source preserve an editable draft and recover', async ({page}) => {
  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('Blocked storage'); }; Storage.prototype.setItem = () => { throw new Error('Blocked storage'); }; });
  await page.reload(); await expect(page.locator('#draft-status')).toHaveText('Latest work is in this tab only');
  const source='#'+'x'.repeat(16000); await run(page,source); await error(page,'16,000 character limit');
  await expect(page.getByLabel('Python code',{exact:true})).toHaveValue(source);
  await expect(page.locator('iframe')).toHaveCount(0);
  await run(page,good); await done(page); await expect(page.locator('#feedback')).toHaveClass(/success/);
});

test('duplicate keyboard Run and target changes cannot mix workers or unlock stale progress', async ({page}) => {
  await run(page,'from robot import motor, wait\nawait motor(1)\nawait wait(600)');
  await expect(page.locator('#runtime-label')).toHaveText('Python is running');
  await page.getByLabel('Python code',{exact:true}).press('ControlOrMeta+Enter');
  await expect(page.locator('iframe')).toHaveCount(1);
  await page.getByLabel('Challenge target').selectOption('reverse');
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('#pointer-value')).toHaveText('0.0°');
  await expect(page.locator('#practice-progress')).toHaveText('0 of 3 crew locations reached in this visit.');
  await run(page,good.replace('servo(120)','servo(60)').replace('motor(0.5)','motor(-0.5)')); await done(page);
  await expect(page.locator('#pointer-value')).toHaveText('-60.0°');
  await expect(page.locator('#practice-progress')).toHaveText('1 of 3 crew locations reached in this visit.');
  await expect(page.locator('#crew-status')).toContainText('Lower cove crew located');
});
