import {appOrigins} from '../server/app-origins.mjs';
import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
export function origins() {
  const app = process.env.APP_ORIGIN || 'http://127.0.0.1:4173';
  const runtime = process.env.VITE_RUNTIME_ORIGIN || 'http://127.0.0.1:4174';
  for (const raw of [app, runtime]) {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol) || raw !== url.origin || url.username || url.password) throw new Error('Origins must be bare origins, without a path or credentials.');
    if (!['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol !== 'https:') throw new Error('Hosted origins must use HTTPS.');
  }
  if (app === runtime) throw new Error('App and runtime need separate origins.');
  const parents=appOrigins(app,process.env.APP_ALTERNATE_ORIGIN);
  if(parents.includes(runtime))throw new Error('App and runtime need separate origins.');
  return { app, runtime, parents };
}
export const workerCsp = "default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; worker-src 'none'";
export function headers(app, runtime) {
  return {
    app: { 'Content-Security-Policy': `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-src ${runtime}; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' },
    frame: { 'Content-Security-Policy': `default-src 'none'; script-src 'self'; worker-src 'self'; frame-ancestors ${appOrigins(app,process.env.APP_ALTERNATE_ORIGIN).join(' ')}; base-uri 'none'; form-action 'none'`, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' },
    worker: { 'Content-Security-Policy': workerCsp, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' },
  };
}
export async function buildRuntime() {
  const { app, runtime, parents } = origins();
  const runtimeDir=process.env.RUNTIME_DIST||'runtime-dist', appDir=process.env.APP_DIST||'dist';
  await mkdir(appDir,{recursive:true});
  await rm(runtimeDir, { recursive: true, force: true });
  await mkdir(`${runtimeDir}/pyodide`, { recursive: true });
  for (const file of ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']) await cp(`node_modules/pyodide/${file}`, `${runtimeDir}/pyodide/${file}`);
  for (const file of ['index.html', 'worker.js']) await cp(`runtime/${file}`, `${runtimeDir}/${file}`);
  const frame = (await readFile('runtime/frame.js', 'utf8')).replace('__APP_ORIGINS__', JSON.stringify(parents));
  await writeFile(`${runtimeDir}/frame.js`, frame);
  await cp('runtime/PYODIDE-LICENSE.txt', `${runtimeDir}/PYODIDE-LICENSE.txt`);
  await cp('THIRD-PARTY.md', `${runtimeDir}/THIRD-PARTY.md`);
  await cp('node_modules/three/LICENSE', `${appDir}/THREE-LICENSE.txt`);
  for (const dir of [appDir,runtimeDir]) {
    for (const file of ['LICENSE','THIRD-PARTY.md']) await cp(file,`${dir}/${file}`);
    await cp('licenses',`${dir}/licenses`,{recursive:true});
  }
  console.log(`Built app: ${appDir} (${app}); isolated Python: ${runtimeDir} (${runtime})`);
}
if (process.argv[1]?.endsWith('build-runtime.mjs')) await buildRuntime();
