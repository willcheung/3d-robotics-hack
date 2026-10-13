import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { readFile, stat } from 'node:fs/promises';
const config=JSON.parse(await readFile('.vercel/output/config.json','utf8'));
const target=process.argv[2];
assert.equal(config.version,3);
for (const file of ['LICENSE','THIRD-PARTY.md','licenses/CPYTHON-LICENSE.txt','licenses/CPYTHON-NOTICES.rst','licenses/HIGHLIGHTJS-LICENSE.txt']) assert.ok((await stat(`.vercel/output/static/${file}`)).size>100,`Missing distribution notice: ${file}`);
const policies=path=>config.routes.filter(r=>r.src&&new RegExp(r.src).test(path)).map(r=>r.headers?.['Content-Security-Policy']).filter(Boolean);
assert.equal((await stat('.vercel/output/static/index.html')).isFile(),true);
if(target==='runtime') {
  assert.equal(policies('/worker.js').length,1, 'The worker must receive exactly one CSP, without the frame policy overriding it.');
  assert.match(policies('/worker.js')[0],/worker-src 'none'/);
  assert.match(policies('/worker.js')[0],/wasm-unsafe-eval/);
  assert.match(policies('/')[0],/frame-ancestors https:/);
  assert.match(policies('/index.html')[0],/frame-ancestors https:/);
  assert.ok((await stat('.vercel/output/static/pyodide/pyodide.asm.wasm')).size>1_000_000);
  assert.ok((await stat('.vercel/output/static/pyodide/python_stdlib.zip')).size>1_000_000);
  assert.ok(!(await readFile('.vercel/output/static/frame.js','utf8')).includes('__APP_ORIGINS__'));
} else {
  assert.match(policies('/')[0],/frame-src https:/);
  assert.equal(policies('/assets/example.js').length,1);
  if(process.env.VITE_HOSTED==='1'){
    const root='.vercel/output/functions/api.func';
    for (const file of ['LICENSE','licenses/node_modules/@vercel/sandbox/LICENSE','licenses/node_modules/@vercel/blob/license.md','licenses/node_modules/iron-session/LICENSE.md']) assert.ok((await stat(`${root}/${file}`)).size>100);
    const fn=JSON.parse(await readFile(`${root}/.vc-config.json`,'utf8'));
    assert.equal(fn.runtime,'nodejs24.x');assert.equal(fn.maxDuration,90);assert.equal(fn.supportsResponseStreaming,true);assert.equal(fn.shouldAddHelpers,false);
    assert.ok(config.routes.some(r=>r.src==='/api/(.*)'&&r.dest==='/api?endpoint=$1'));
    for(const file of ['server/sandbox-relay.mjs','server/hosted-run.sh','server/python-run.py','java/Robot.java'])assert.ok((await stat(`${root}/${file}`)).isFile());
    assert.equal(typeof (await import(pathToFileURL(resolve(root,fn.handler)).href)).default,'function');
    const mailRoot='.vercel/output/functions/onboarding-mail.func',mailConfig=JSON.parse(await readFile(`${mailRoot}/.vc-config.json`,'utf8'));
    assert.deepEqual(mailConfig.experimentalTriggers,[{type:'queue/v2beta',topic:'robolab-onboarding-v1',consumer:'onboarding-mail'}]);
    assert.equal(mailConfig.shouldAddHelpers,true,'Queue SDK needs parsed req.body and res.status/json helpers.');
    assert.equal(typeof (await import(pathToFileURL(resolve(mailRoot,mailConfig.handler)).href)).default,'function');
    assert.ok(!config.routes.some(r=>String(r.dest).includes('onboarding-mail')),'Queue consumer must not be exposed through application routing.');
  }
}
console.log(`Verified ${target} package routes, security policy and required files.`);
