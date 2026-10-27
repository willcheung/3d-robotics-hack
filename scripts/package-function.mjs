import {build} from 'esbuild';
import {mkdir,copyFile,writeFile,readFile,readdir} from 'node:fs/promises';
const root='.vercel/output/functions/api.func';
await mkdir(`${root}/server`,{recursive:true});await mkdir(`${root}/java`,{recursive:true});
await build({entryPoints:['server/hosted-api.mjs'],outfile:`${root}/server/handler.mjs`,bundle:true,platform:'node',target:'node24',format:'esm',banner:{js:"import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);"}});
for(const file of ['sandbox-relay.mjs','hosted-run.sh','python-run.py'])await copyFile(`server/${file}`,`${root}/server/${file}`);
for(const file of ['Robot.java','TraceMain.java'])await copyFile(`java/${file}`,`${root}/java/${file}`);
await writeFile(`${root}/.vc-config.json`,JSON.stringify({runtime:'nodejs24.x',handler:'server/handler.mjs',launcherType:'Nodejs',maxDuration:360,memory:1024,shouldAddHelpers:false,supportsResponseStreaming:true,regions:['iad1']}));

const mailRoot='.vercel/output/functions/onboarding-mail.func';
await mkdir(mailRoot,{recursive:true});
await build({entryPoints:['server/onboarding-queue.mjs'],outfile:`${mailRoot}/handler.mjs`,bundle:true,platform:'node',target:'node24',format:'esm',banner:{js:"import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);"}});
await writeFile(`${mailRoot}/.vc-config.json`,JSON.stringify({runtime:'nodejs24.x',handler:'handler.mjs',launcherType:'Nodejs',maxDuration:60,memory:1024,shouldAddHelpers:true,regions:['iad1'],experimentalTriggers:[{type:'queue/v2beta',topic:'robolab-onboarding-v1',consumer:'onboarding-mail'}]}));

const weeklyRoot='.vercel/output/functions/weekly-summary.func';
await mkdir(weeklyRoot,{recursive:true});
await build({entryPoints:['server/weekly-summary.mjs'],outfile:`${weeklyRoot}/handler.mjs`,bundle:true,platform:'node',target:'node24',format:'esm',banner:{js:"import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);"}});
await writeFile(`${weeklyRoot}/.vc-config.json`,JSON.stringify({runtime:'nodejs24.x',handler:'handler.mjs',launcherType:'Nodejs',maxDuration:60,memory:1024,shouldAddHelpers:false,regions:['iad1']}));

// Retain the notices for bundled server dependencies as well as the app license.
for (const file of ['LICENSE','THIRD-PARTY.md']) {await copyFile(file,`${root}/${file}`);await copyFile(file,`${mailRoot}/${file}`);await copyFile(file,`${weeklyRoot}/${file}`);}
const packages=JSON.parse(await readFile('package-lock.json','utf8')).packages;
for (const [path,pkg] of Object.entries(packages)) {
  if (!path || pkg.dev) continue;
  let names; try { names=await readdir(path); } catch (error) { if(error.code==='ENOENT' && pkg.optional) continue; throw error; }
  const notices=names.filter(name=>/^(?:licen[sc]e|copying|notice)(?:[.-]|$)/i.test(name));
  if (!notices.length) continue; // Some package metadata points to its upstream notice.
  const destination=`${root}/licenses/${path}`; await mkdir(destination,{recursive:true});
  for (const file of notices) await copyFile(`${path}/${file}`,`${destination}/${file}`);
  const mailDestination=`${mailRoot}/licenses/${path}`;await mkdir(mailDestination,{recursive:true});
  for(const file of notices)await copyFile(`${path}/${file}`,`${mailDestination}/${file}`);
  const weeklyDestination=`${weeklyRoot}/licenses/${path}`;await mkdir(weeklyDestination,{recursive:true});for(const file of notices)await copyFile(`${path}/${file}`,`${weeklyDestination}/${file}`);
}
