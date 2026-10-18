import test from 'node:test';
import assert from 'node:assert/strict';
import {draftSync,chooseDraft,hasPendingDraft,type DraftSnapshot} from '../src/draft-sync.ts';
const storage=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{value:{get length(){return storage.size;},key:(i:number)=>[...storage.keys()][i]??null,getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v),removeItem:(k:string)=>storage.delete(k)},configurable:true});
const draft=(source:string):DraftSnapshot=>({lesson:'L01',language:'python',target:'beacon',source});
test('serialized autosave keeps edits made during a delayed response and advances revisions',async()=>{
 storage.clear();let release!:(value:any)=>void;const requests:any[]=[];const cloud:any={python:{source:'base',target:'beacon',revision:1}};
 const sync=draftSync({status:()=>{},request:async data=>{requests.push(data);if(requests.length===1)return new Promise(resolve=>release=resolve);return {...data,revision:data.revision+1};}});
 sync.profile('one',cloud,[draft('base')]);sync.change(draft('first'));const flushed=sync.flush();await Promise.resolve();sync.change(draft('second'));release({...draft('first'),revision:2});await flushed;
 assert.deepEqual(requests.map(r=>[r.source,r.revision]),[['first',1],['second',2]]);assert.equal(cloud.python.source,'second');sync.profile('',{},[]);
});
test('an old identity response cannot mutate the new profile or status',async()=>{
 storage.clear();let release!:(value:any)=>void;let status='';const cloud:any={python:{source:'base',target:'beacon',revision:1}};
 const sync=draftSync({status:text=>status=text,request:()=>new Promise(resolve=>release=resolve)});sync.profile('one',cloud,[draft('base')]);sync.change(draft('old owner edit'));const flight=sync.flush();await Promise.resolve();sync.profile('two',{},[]);release({...draft('old owner edit'),revision:2});await flight;
 assert.equal(cloud.python.source,'base');assert.equal(status,'Saved to your account');sync.profile('',{},[]);
});
test('unsynced local edits conflict with a newer cloud copy, while untouched local drafts adopt cloud',async()=>{
 storage.clear();const base={source:'base',target:'beacon',revision:1},cloud={source:'other device',target:'beacon',revision:2};let sends=0;
 assert.equal(chooseDraft(base,cloud,base),cloud);assert.equal(chooseDraft(draft('unsynced'),cloud,base)?.source,'unsynced');
 const sync=draftSync({status:()=>{},request:async d=>{sends++;return {...d,revision:d.revision+1};}});sync.profile('one',{python:base},[draft('base')]);sync.profile('one',{python:cloud},[draft('unsynced')]);assert.equal(sync.conflicts().length,1);await assert.rejects(sync.flush(),/Compare/);assert.equal(sends,0);sync.resolve('python',cloud);sync.change(draft('chosen local'));await sync.flush();assert.equal(sends,1);sync.profile('',{},[]);
});
test('undo to the previously saved source during an in-flight edit saves the undo last',async()=>{
 storage.clear();let release!:(value:any)=>void;const requests:any[]=[],cloud:any={python:{source:'A',target:'beacon',revision:1}};
 const sync=draftSync({status:()=>{},request:async data=>{requests.push(data);if(requests.length===1)return new Promise(resolve=>release=resolve);return {...data,revision:data.revision+1};}});sync.profile('undo',cloud,[draft('A')]);sync.change(draft('B'));const flight=sync.flush();await Promise.resolve();sync.change(draft('A'));release({...draft('B'),revision:2});await flight;assert.deepEqual(requests.map(r=>r.source),['B','A']);assert.equal(cloud.python.source,'A');sync.profile('',{},[]);
});
test('restoring the saved draft before debounce settles the status without a redundant write',async()=>{
 storage.clear();let status='',sends=0;const cloud={python:{source:'A',target:'beacon',revision:1}};const sync=draftSync({status:text=>status=text,request:async d=>{sends++;return {...d,revision:d.revision+1};}});sync.profile('restore',cloud,[draft('A')]);sync.change(draft('B'));sync.change(draft('A'));await sync.flush();assert.equal(status,'Saved to your account');assert.equal(sends,0);sync.profile('',{},[]);
});
test('a pre-autosave local draft without cloud or a baseline uploads on sign-in',async()=>{
 storage.clear();const sent:any[]=[];const sync=draftSync({status:()=>{},request:async d=>{sent.push(d);return {...d,revision:1};}});sync.profile('returning',{},[draft('older device work')]);await sync.flush();assert.equal(sent[0].source,'older device work');assert.equal(sent[0].revision,0);sync.profile('',{},[]);
});
test('reload settles an unacknowledged example save before saving the returned draft',async()=>{
 storage.clear();let server={source:'A',target:'beacon',revision:1};let release!:()=>void;const sent:string[]=[];
 const commit=(d:DraftSnapshot & {revision:number})=>{if(d.source===server.source&&d.target===server.target&&d.revision<=server.revision)return {...server};if(d.revision!==server.revision)throw Object.assign(Error('conflict'),{status:409});server={source:d.source,target:d.target,revision:d.revision+1};return {...server};};
 const old=draftSync({status:()=>{},request:d=>new Promise((resolve,reject)=>{release=()=>{try{resolve(commit(d));}catch(e){reject(e);}};})});
 old.profile('reload',{python:{...server}},[draft('A')]);old.change(draft('example'));const abandoned=old.flush();await Promise.resolve();old.profile('',{},[]);
 let status='';const fresh=draftSync({status:text=>status=text,request:async d=>{sent.push(d.source);return commit(d);}});
 fresh.profile('reload',{python:{...server}},[draft('example')]);fresh.change(draft('A'));await fresh.flush();release();await abandoned;
 assert.equal(server.source,'A');assert.deepEqual(sent,['example','A']);assert.equal(status,'Saved to your account');fresh.profile('',{},[]);
});
test('a committed save with a lost reply preserves the local undo on reload',async()=>{
 storage.clear();const base={source:'A',target:'beacon',revision:1};let server={...base},release!:(d:any)=>void;
 const old=draftSync({status:()=>{},request:async d=>{server={source:d.source,target:d.target,revision:2};return new Promise(resolve=>release=resolve);}});old.profile('lost',{python:{...base}},[draft('A')]);old.change(draft('example'));const abandoned=old.flush();await Promise.resolve();old.profile('',{},[]);
 assert.equal(hasPendingDraft('lost','python'),true);assert.equal(chooseDraft(draft('A'),server,base,hasPendingDraft('lost','python'))?.source,'A');
 const fresh=draftSync({status:()=>{},request:async d=>{assert.equal(d.revision,2);server={source:d.source,target:d.target,revision:3};return {...server};}});fresh.profile('lost',{python:{...server}},[draft('A')]);assert.equal(fresh.conflicts().length,0);await fresh.flush();release({source:'example',target:'beacon',revision:2});await abandoned;assert.equal(server.source,'A');assert.equal(hasPendingDraft('lost','python'),false);fresh.profile('',{},[]);
});
test('retry settles an uncertain write before the latest undo and keeps other-device conflicts explicit',async()=>{
 storage.clear();let server={source:'A',target:'beacon',revision:1},fail=true;const requests:string[]=[];
 const sync=draftSync({status:()=>{},request:async d=>{requests.push(d.source);if(fail){fail=false;server={source:d.source,target:d.target,revision:2};throw Error('reply lost');}if(d.source===server.source&&d.revision<server.revision)return {...server};assert.equal(d.revision,server.revision);server={source:d.source,target:d.target,revision:d.revision+1};return {...server};}});
 sync.profile('retry',{python:{...server}},[draft('A')]);sync.change(draft('example'));await assert.rejects(sync.flush(),/reply lost/);sync.change(draft('A'));await sync.flush();assert.deepEqual(requests,['example','example','A']);assert.equal(server.source,'A');assert.equal(hasPendingDraft('retry','python'),false);sync.profile('',{},[]);
 storage.clear();let release!:(d:any)=>void;const old=draftSync({status:()=>{},request:()=>new Promise(resolve=>release=resolve)});old.profile('conflict',{python:{source:'A',target:'beacon',revision:1}},[draft('A')]);old.change(draft('example'));const flight=old.flush();await Promise.resolve();old.profile('',{},[]);
 let writes=0;const fresh=draftSync({status:()=>{},request:async d=>{writes++;return {...d,revision:3};}});fresh.profile('other-owner',{},[]);await fresh.flush();assert.equal(writes,0);fresh.profile('conflict',{python:{source:'another device',target:'beacon',revision:2}},[draft('A')]);await assert.rejects(fresh.flush(),/Compare/);assert.equal(writes,0);release({source:'example',target:'beacon',revision:2});await flight;fresh.profile('',{},[]);
});
test('a rejected invalid draft does not block a corrected edit and corrupt journals do not hide valid saves',async()=>{
 storage.clear();storage.set('robolab.profile.invalid.saving.corrupt','{');const sent:string[]=[];
 const sync=draftSync({status:()=>{},request:async d=>{sent.push(d.source);if(d.source==='invalid')throw Object.assign(Error('invalid draft'),{status:400});return {...d,revision:1};}});sync.profile('invalid',{},[]);sync.change(draft('invalid'));await assert.rejects(sync.flush(),/invalid draft/);assert.equal(hasPendingDraft('invalid','python'),false);sync.change(draft('corrected'));await sync.flush();assert.deepEqual(sent,['invalid','corrected']);sync.profile('',{},[]);
});
