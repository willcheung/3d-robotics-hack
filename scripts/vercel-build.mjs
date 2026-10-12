import { spawnSync } from 'node:child_process';
const target=process.env.VERCEL_TARGET;
if (!['app','runtime'].includes(target)) throw new Error('Set VERCEL_TARGET to app or runtime for this project.');
for(const args of [['run','build'],['exec','--','node','scripts/package-vercel.mjs',target],['exec','--','node','scripts/check-vercel.mjs',target]]) {
  const run=spawnSync('npm',args,{stdio:'inherit'}); if(run.status!==0)process.exit(run.status || 1);
}
