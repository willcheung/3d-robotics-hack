import { Sandbox } from '@vercel/sandbox';
import { writeFile } from 'node:fs/promises';
const receipt=process.argv[2];
if(!receipt)throw Error('Usage: node scripts/setup-hosted-sandbox.mjs <snapshot-receipt.json>. Creates billed provider resources; use only with deployment authorization.');
const s=await Sandbox.create({persistent:false,timeout:300000,resources:{vcpus:1},networkPolicy:'allow-all',tags:{purpose:'robolab-runtime-setup'}});
try {
 console.log(JSON.stringify({name:s.name,phase:'trusted runtime setup; no student source or app credentials'}));
 const setup=await s.runCommand({cmd:'sh',sudo:true,args:['-c','apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq openjdk-21-jdk-headless bubblewrap && mkdir -p /work && chmod 1777 /work && apt-get clean && rm -rf /var/lib/apt/lists/*'],signal:AbortSignal.timeout(180000)});
 if(setup.exitCode!==0) throw new Error((await setup.stderr()).slice(-2000));
 await s.update({networkPolicy:'deny-all'});
 const probe=await s.runCommand({cmd:'bwrap',sudo:true,args:['--unshare-all','--die-with-parent','--new-session','--ro-bind','/','/','--ro-bind','/proc','/proc','--dev','/dev','--tmpfs','/tmp','--perms','0777','--tmpfs','/work','--chdir','/work','--uid','10001','--gid','10001','--cap-drop','ALL','--clearenv','--setenv','PATH','/usr/bin:/bin','/bin/sh','-c','id; java -version; touch /work/ok; touch /etc/robolab-test 2>/dev/null; echo root_write_exit=$?; cat /proc/self/status | head -8']});
 console.log('Isolation probe',probe.exitCode,await probe.stdout(),await probe.stderr());
 if(probe.exitCode!==0) throw new Error('Isolation setup failed');
 const snap=await s.snapshot({expiration:0});
 await writeFile(receipt,JSON.stringify({snapshotId:snap.snapshotId,name:s.name},null,2));
 console.log(JSON.stringify({snapshotId:snap.snapshotId,status:snap.status}));
} finally {await s.stop();console.log('Setup sandbox stopped.');}
