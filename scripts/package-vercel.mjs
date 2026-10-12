import { cp, mkdir, writeFile, rm } from 'node:fs/promises';
import { headers, origins } from './build-runtime.mjs';
const { app, runtime } = origins();
if (![app,runtime].every(origin => origin.startsWith('https://'))) throw new Error('Vercel packaging requires explicit APP_ORIGIN and VITE_RUNTIME_ORIGIN HTTPS origins.');
const target = process.argv[2];
if (!['app','runtime'].includes(target)) throw new Error('Choose app or runtime.');
const h = headers(app,runtime);
const output = '.vercel/output';
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await cp(target==='app'?'dist':'runtime-dist',`${output}/static`,{recursive:true});
await rm(`${output}/static/vercel.json`,{force:true});
const routes = target === 'app' ? [{src:'/(.*)',headers:h.app,continue:true}] : [
  {src:'^/worker\\.js$',headers:h.worker,continue:true},
  {src:'^/(?:index\\.html)?$',headers:h.frame,continue:true},
  {src:'/pyodide/(.*)',headers:{'X-Content-Type-Options':'nosniff'},continue:true},
];
if(target==='app'&&process.env.VITE_HOSTED==='1'){
  await import('./package-function.mjs');
  routes.push({src:'/api/(.*)',dest:'/api?endpoint=$1'});
}
routes.push({handle:'filesystem'});
await writeFile(`${output}/config.json`,JSON.stringify({version:3,routes},null,2));
console.log(`Packaged ${target} as Vercel Build Output v3. No deployment performed.`);
