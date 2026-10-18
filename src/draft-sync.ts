import {draftKey,type LessonId} from './model.ts';
export type SavedDraft={source:string;target?:string;revision:number};
export type DraftSnapshot={source:string;target:string;language:'python'|'java';lesson:LessonId};
type WriteIntent={id:string;draft:DraftSnapshot;revision:number};
const same=(a:{source:string;target?:string}|undefined,b:{source:string;target?:string}|undefined)=>!!a&&!!b&&a.source===b.source&&a.target===b.target;
const baseKey=(owner:string,key:string)=>`robolab.profile.${owner}.${key}.synced`;
export function readDraftBase(owner:string,key:string):SavedDraft|undefined{try{return JSON.parse(localStorage.getItem(baseKey(owner,key))||'null')??undefined;}catch{return undefined;}}
function remember(owner:string,key:string,draft:SavedDraft){try{localStorage.setItem(baseKey(owner,key),JSON.stringify(draft));}catch{/* The caller still preserves the editor and reports local storage failures. */}}
const intentPrefix=(owner:string)=>`robolab.profile.${owner}.saving.`;
function intents(owner:string):WriteIntent[]{
 const found:WriteIntent[]=[];
 try{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!key?.startsWith(intentPrefix(owner)))continue;let row;try{row=JSON.parse(localStorage.getItem(key)||'null');}catch{continue;}
  if(row&&key===intentPrefix(owner)+row.id&&Number.isSafeInteger(row.revision)&&row.revision>=0&&['L01','L02','L03','L04'].includes(row.draft?.lesson)&&['python','java'].includes(row.draft?.language)&&typeof row.draft?.source==='string'&&typeof row.draft?.target==='string')found.push(row);
 }}catch{/* Other locally saved work remains usable if an intent is corrupt. */}
 return found;
}
function forgetIntent(owner:string,intent:WriteIntent){try{localStorage.removeItem(intentPrefix(owner)+intent.id);}catch{}}
export function hasPendingDraft(owner:string,key:string){return intents(owner).some(i=>draftKey(i.draft.lesson,i.draft.language)===key);}
/** Prefer a newer cloud copy only when this device has no unsynced edits. */
export function chooseDraft(local:{source:string;target?:string}|undefined,cloud:SavedDraft|undefined,base:SavedDraft|undefined,pending=false){return cloud&&(!local||!pending&&(same(local,base)||same(local,cloud)))?cloud:local??cloud;}
export function draftSync(options:{request:(draft:DraftSnapshot & {revision:number})=>Promise<SavedDraft>;status:(text:string,conflicts:DraftSnapshot[])=>void}){
 let owner='',generation=0,cloud:Record<string,SavedDraft|undefined>={},pending=new Map<string,DraftSnapshot>(),conflicts=new Map<string,DraftSnapshot>();
 let active:{owner:string;generation:number;key:string}|undefined;
 let flight:Promise<void>|undefined,timer:ReturnType<typeof setTimeout>|undefined,retries=0,lastError:Error|undefined;
 let recovering=new Map<string,WriteIntent>();
 const recoveringKey=(key:string)=>[...recovering.values()].some(i=>draftKey(i.draft.lesson,i.draft.language)===key);
 const announce=(text:string)=>options.status(text,[...conflicts.values()]);
 const schedule=(delay=700)=>{clearTimeout(timer);timer=setTimeout(()=>void drain().catch(()=>{}),delay);};
 async function drain():Promise<void>{
  if(flight){await flight;return drain();}
  const recovery=[...recovering.values()].find(i=>!conflicts.has(draftKey(i.draft.lesson,i.draft.language)));
  const next=recovery?[draftKey(recovery.draft.lesson,recovery.draft.language),recovery.draft] as const:[...pending].find(([key])=>!conflicts.has(key));
  if(!owner||!next){if(conflicts.size)throw Error('Compare saved versions before continuing.');if(lastError)throw lastError;if(owner)announce('Saved to your account');return;}
  const [key,draft]=next,who=owner,version=generation;if(!recovery)pending.delete(key);const base=cloud[key]??{source:'',revision:0};
  if(!recovery&&same(base,draft)){remember(who,key,base);return drain();}
  const intent=recovery??{id:crypto.randomUUID(),draft,revision:base.revision};
  remember(who,key,base);active={owner:who,generation:version,key};announce('Saving to your account…');
  flight=(async()=>{
   try{
    // A request may commit after reload has destroyed its response handler.
    // Replay that exact conditional write before sending the current local edit.
    if(!recovery)localStorage.setItem(intentPrefix(who)+intent.id,JSON.stringify(intent));
    const saved=await options.request({...draft,revision:intent.revision});forgetIntent(who,intent);if(version!==generation)return;recovering.delete(intent.id);cloud[key]=saved;remember(who,key,saved);retries=0;lastError=undefined;announce(pending.size||recovering.size?'Saving your latest edits…':'Saved to your account');
   }
   catch(error){const status=(error as {status?:number}).status,rejected=status!==undefined&&status>=400&&status<500;if(rejected)forgetIntent(who,intent);if(version!==generation)return;if(rejected)recovering.delete(intent.id);else if(intents(who).some(i=>i.id===intent.id))recovering.set(intent.id,intent);lastError=error as Error;if(!pending.has(key))pending.set(key,draft);
    if((error as {status?:number}).status===409){conflicts.set(key,pending.get(key)!);announce('Another version is saved. Compare before replacing it.');}
    else{announce('Saved on this device · waiting to sync. '+(error as Error).message);if(retries<3)schedule([2000,8000,30000][retries++]);}
    throw error;
   }
  })();
  try{await flight;}finally{flight=undefined;active=undefined;}
  if(version===generation&&(pending.size||recovering.size))return drain();
 }
 return {
  profile(id:string,server:Record<string,SavedDraft|undefined>,local:DraftSnapshot[]){
   generation++;owner=id;cloud=server;pending=new Map();conflicts=new Map();recovering=new Map();clearTimeout(timer);retries=0;lastError=undefined;
   if(!id){announce('Guest drafts stay on this device. Sign in to keep progress.');return;}
   const acknowledged=new Set<string>();
   for(const intent of intents(id)){const key=draftKey(intent.draft.lesson,intent.draft.language),saved=cloud[key];
    if(saved&&saved.revision>intent.revision){if(same(saved,intent.draft)){acknowledged.add(key);remember(id,key,saved);}forgetIntent(id,intent);}
    else recovering.set(intent.id,intent);
   }
   for(const draft of local){const key=draftKey(draft.lesson,draft.language),saved=cloud[key],base=readDraftBase(id,key);
    if(same(draft,saved)&&!recoveringKey(key)){remember(id,key,saved!);continue;}
    // The caller omits untouched starters; existing local work without a
    // baseline is a first upload, not an already-saved draft.
    pending.set(key,draft);
    if(saved&&!acknowledged.has(key)&&(!base||base.revision!==saved.revision&&!same(base,saved)))conflicts.set(key,draft);
   }
   announce(conflicts.size?'This device and your account have different drafts. Compare saved versions.':pending.size||recovering.size?'Restoring unsynced edits…':'Saved to your account');if(pending.size||recovering.size)schedule();
  },
  change(draft:DraftSnapshot){if(!owner)return;const key=draftKey(draft.lesson,draft.language);if(same(draft,cloud[key])&&!pending.has(key)&&!recoveringKey(key)&&!(active?.owner===owner&&active.generation===generation&&active.key===key))return;pending.set(key,{...draft});if(conflicts.has(key))conflicts.set(key,{...draft});lastError=undefined;announce(conflicts.size?'Compare saved versions to sync this draft.':'Saving to your account…');schedule();},
  async flush(){clearTimeout(timer);lastError=undefined;await drain();},
  retry(){if(!owner)return;retries=0;lastError=undefined;schedule(0);},
  resolve(key:string,saved:SavedDraft){cloud[key]=saved;remember(owner,key,saved);pending.delete(key);conflicts.delete(key);for(const intent of intents(owner))if(draftKey(intent.draft.lesson,intent.draft.language)===key){forgetIntent(owner,intent);recovering.delete(intent.id);}lastError=undefined;announce('Saved to your account');if(pending.size||recovering.size)schedule();},
  conflicts:()=>[...conflicts.values()],
  busy:()=>!!flight||pending.size>0||recovering.size>0,
 };
}
