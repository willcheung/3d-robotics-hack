import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
assert.ok(files.length>0,'Check a Git checkout, not an empty export.');
const pkg=JSON.parse(readFileSync('package.json','utf8')),lock=JSON.parse(readFileSync('package-lock.json','utf8'));
assert.equal(pkg.license,'MIT');assert.equal(lock.packages[''].license,'MIT');
assert.match(readFileSync('LICENSE','utf8'),/MIT License/);
for(const file of ['THIRD-PARTY.md','SECURITY.md','CONTRIBUTING.md','runtime/PYODIDE-LICENSE.txt','licenses/CPYTHON-LICENSE.txt','licenses/CPYTHON-NOTICES.rst','licenses/HIGHLIGHTJS-LICENSE.txt'])assert.ok(files.includes(file),`Missing publication file: ${file}`);
for(const [name,dependency] of Object.entries(lock.packages))if(name)assert.ok(dependency.license,`Missing dependency license: ${name}`);
for(const file of files){
 assert.ok(!/^(?:work|node_modules|dist|runtime-dist|test-results[^/]*|playwright-report|\.vercel)\//.test(file),`Private/generated path tracked: ${file}`);
 assert.ok(!/(?:^|\/)\.env(?:\.|$)/.test(file)||file==='.env.example',`Environment file tracked: ${file}`);
 assert.ok(!/\.(?:pem|key|p12|pfx|keystore)$/i.test(file),`Credential file tracked: ${file}`);
 if(!/\.(?:md|json|[cm]?js|ts|html|css|ya?ml|sh|py|java|txt)$/.test(file))continue;
 const text=readFileSync(file,'utf8');
 assert.ok(!/\/(?:Users|home)\/[A-Za-z][^/\s]*\//.test(text),`Personal machine path in ${file}`);
 if(file.endsWith('.md'))for(const [,link]of text.matchAll(/\]\(([^)]+)\)/g)){
  if(link.includes('://')||link.startsWith('#'))continue;
  assert.ok(existsSync(resolve(dirname(file),link.split('#')[0])),`Broken documentation link in ${file}: ${link}`);
 }
}
console.log(`Publication checks passed for ${files.length} tracked files. Secret scanning is a separate CI step; neither check guarantees the absence of all private information.`);
