import test from 'node:test';
import assert from 'node:assert/strict';
import {draftSync,chooseDraft,type DraftSnapshot} from '../src/draft-sync.ts';
const storage=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{value:{getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v)},configurable:true});
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
