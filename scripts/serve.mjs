import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { hostedApi } from '../server/hosted-api.mjs';
import { javaApi } from '../server/java-api.mjs';
import { buildRuntime, origins, headers } from './build-runtime.mjs';
const dev = process.argv.includes('--dev');
const { app, runtime } = origins();
const h = headers(app, runtime);
const java = process.env.ROBOLAB_HOSTED==='1'?{handle:hostedApi({appOrigin:app}),stop:async()=>{}}:javaApi(app);
if (dev) {
  await (await import('node:fs/promises')).mkdir('dist', { recursive: true });
  await buildRuntime();
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
if (dev) {
  const { createServer } = await import('vite');
  const vite = await createServer({ server: { host: '127.0.0.1', port: Number(new URL(app).port), strictPort: true } });
  vite.middlewares.use((req,res,next)=>{ void java.handle(req,res).then(handled=>{if(!handled) next();}); });
  await vite.listen(); servers.push(vite);
} else {
  const server = http.createServer((req, res) => { void java.handle(req,res).then(handled=>{if(!handled) void serve(process.env.APP_DIST||'dist',req,res,false);}); });
  await listen(server, Number(new URL(app).port)); servers.push(server);
}
const workerServer = http.createServer((req, res) => { void serve(process.env.RUNTIME_DIST||'runtime-dist', req, res, true); });
await listen(workerServer, Number(new URL(runtime).port)); servers.push(workerServer);
console.log(`Signal Station: ${app}\nCredential-free Python origin: ${runtime}\nCtrl+C stops both servers.`);
const stop = async () => { await java.stop(); for (const s of servers) s.close(); process.exit(0); };
process.on('SIGTERM', stop); process.on('SIGINT', stop);
