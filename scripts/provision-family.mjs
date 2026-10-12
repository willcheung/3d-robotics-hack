import {writeFile} from 'node:fs/promises';
import {BlobStore,provision} from '../server/family-store.mjs';
const receipt=process.argv[2];
if(!receipt)throw Error('Usage: node scripts/provision-family.mjs <private-receipt.json>. Requires the intended private Blob token.');
// Reserve a new private file before creating remote data. Never print access codes.
await writeFile(receipt,'Provisioning in progress. Do not retry blindly.',{flag:'wx',mode:0o600});
const family=await provision(new BlobStore());
await writeFile(receipt,JSON.stringify(family,null,2),{mode:0o600});
console.log('Parent access receipt saved privately to the requested file.');
