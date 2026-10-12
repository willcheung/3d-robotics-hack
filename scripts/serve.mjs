import http from 'node:http';
import { readFile, stat, cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { hostedApi } from '../server/hosted-api.mjs';
import { javaApi } from '../server/java-api.mjs';
import { buildRuntime, origins, headers } from './build-runtime.mjs';
const dev = process.argv.includes('--dev');
const { app, runtime } = origins();
const h = headers(app, runtime);
const java = process.env.ROBOLAB_HOSTED==='1'?{handle:hostedApi({appOrigin:app}),stop:async()=>{}}:javaApi(app);
let appRoot=process.env.APP_DIST||'dist', runtimeRoot=process.env.RUNTIME_DIST||'runtime-dist', previewRoot;
if (dev) {
  await (await import('node:fs/promises')).mkdir('dist', { recursive: true });
  await buildRuntime();
} else {
  // Keep this preview's app and Python assets together even if a later build
  // replaces dist/runtime-dist with files configured for different origins.
  previewRoot=await mkdtemp(path.join(tmpdir(),'robolab-preview-'));
  try {
    await cp(appRoot,path.join(previewRoot,'app'),{recursive:true});
    await cp(runtimeRoot,path.join(previewRoot,'runtime'),{recursive:true});
    appRoot=path.join(previewRoot,'app');runtimeRoot=path.join(previewRoot,'runtime');
    for(const file of [path.join(appRoot,'index.html'),path.join(runtimeRoot,'index.html'),path.join(runtimeRoot,'frame.js'),path.join(runtimeRoot,'worker.js')]) {
      if(!(await stat(file)).isFile())throw Error(`Missing preview file: ${file}`);
    }
  } catch(error) {
    await rm(previewRoot,{recursive:true,force:true});
    throw new Error('Preview build is incomplete. Build the app and Python runtime with matching origins before starting the preview.',{cause:error});
  }
}
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm', '.json': 'application/json', '.zip': 'application/zip', '.svg': 'image/svg+xml', '.png': 'image/png' };
async function serve(root, req, res, runtimeServer) {
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname); }
  catch { res.writeHead(400); res.end('Invalid path'); return; }
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(path.resolve(root) + path.sep)) { res.writeHead(403); res.end(); return; }
  const policy = runtimeServer ? (pathname === '/worker.js' ? h.worker : h.frame) : h.app;
  try {
    if (!(await stat(file)).isFile() || path.basename(file) === 'vercel.json') throw new Error('not found');
    res.writeHead(200, { ...policy, 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await readFile(file));
  } catch { res.writeHead(404, policy); res.end('Not found'); }
}
const servers = [];
const listen = (server, port) => new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
const cleanup = async () => {
  await java.stop();
  await Promise.all(servers.map(close=>close()));
  if(previewRoot)await rm(previewRoot,{recursive:true,force:true});
};
try {
  if (dev) {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { host: '127.0.0.1', port: Number(new URL(app).port), strictPort: true } });
    vite.middlewares.use((req,res,next)=>{ void java.handle(req,res).then(handled=>{if(!handled) next();}); });
    await vite.listen(); servers.push(()=>vite.close());
  } else {
    const server = http.createServer((req, res) => { void java.handle(req,res).then(handled=>{if(!handled) void serve(appRoot,req,res,false);}); });
    await listen(server, Number(new URL(app).port)); servers.push(()=>new Promise(resolve=>server.close(resolve)));
  }
  const workerServer = http.createServer((req, res) => { void serve(runtimeRoot, req, res, true); });
  await listen(workerServer, Number(new URL(runtime).port)); servers.push(()=>new Promise(resolve=>workerServer.close(resolve)));
} catch(error) { await cleanup(); throw error; }
console.log(`Signal Station: ${app}\nCredential-free Python origin: ${runtime}\nCtrl+C stops both servers.`);
let stopping=false;
const stop = async () => { if(stopping)return;stopping=true;await cleanup();process.exit(0); };
process.on('SIGTERM', stop); process.on('SIGINT', stop);
