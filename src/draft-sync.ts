import {draftKey,type LessonId} from './model.ts';
export type SavedDraft={source:string;target?:string;revision:number};
export type DraftSnapshot={source:string;target:string;language:'python'|'java';lesson:LessonId};
const same=(a:{source:string;target?:string}|undefined,b:{source:string;target?:string}|undefined)=>!!a&&!!b&&a.source===b.source&&a.target===b.target;
const baseKey=(owner:string,key:string)=>`robolab.profile.${owner}.${key}.synced`;
export function readDraftBase(owner:string,key:string):SavedDraft|undefined{try{return JSON.parse(localStorage.getItem(baseKey(owner,key))||'null')??undefined;}catch{return undefined;}}
function remember(owner:string,key:string,draft:SavedDraft){try{localStorage.setItem(baseKey(owner,key),JSON.stringify(draft));}catch{/* The caller still preserves the editor and reports local storage failures. */}}
/** Prefer a newer cloud copy only when this device has no unsynced edits. */
export function chooseDraft(local:{source:string;target?:string}|undefined,cloud:SavedDraft|undefined,base:SavedDraft|undefined){return cloud&&(!local||same(local,base)||same(local,cloud))?cloud:local??cloud;}
export function draftSync(options:{request:(draft:DraftSnapshot & {revision:number})=>Promise<SavedDraft>;status:(text:string,conflicts:DraftSnapshot[])=>void}){
 let owner='',generation=0,cloud:Record<string,SavedDraft|undefined>={},pending=new Map<string,DraftSnapshot>(),conflicts=new Map<string,DraftSnapshot>();
 let active:{owner:string;generation:number;key:string}|undefined;
 let flight:Promise<void>|undefined,timer:ReturnType<typeof setTimeout>|undefined,retries=0,lastError:Error|undefined;
 const announce=(text:string)=>options.status(text,[...conflicts.values()]);
 const schedule=(delay=700)=>{clearTimeout(timer);timer=setTimeout(()=>void drain().catch(()=>{}),delay);};
 async function drain():Promise<void>{
  if(flight){await flight;return drain();}
  const next=[...pending].find(([key])=>!conflicts.has(key));
  if(!owner||!next){if(conflicts.size)throw Error('Compare saved versions before continuing.');if(lastError)throw lastError;if(owner)announce('Saved to your account');return;}
  const [key,draft]=next,who=owner,version=generation;pending.delete(key);const base=cloud[key]??{source:'',revision:0};
  if(same(base,draft)){remember(who,key,base);return drain();}
  remember(who,key,base);active={owner:who,generation:version,key};announce('Saving to your account…');
  flight=(async()=>{
   try{const saved=await options.request({...draft,revision:base.revision});if(version!==generation)return;cloud[key]=saved;remember(who,key,saved);retries=0;lastError=undefined;announce(pending.size?'Saving your latest edits…':'Saved to your account');}
   catch(error){if(version!==generation)return;lastError=error as Error;if(!pending.has(key))pending.set(key,draft);
    if((error as {status?:number}).status===409){conflicts.set(key,pending.get(key)!);announce('Another version is saved. Compare before replacing it.');}
    else{announce('Saved on this device · waiting to sync. '+(error as Error).message);if(retries<3)schedule([2000,8000,30000][retries++]);}
    throw error;
   }
  })();
  try{await flight;}finally{flight=undefined;active=undefined;}
  if(version===generation&&pending.size)return drain();
 }
 return {
  profile(id:string,server:Record<string,SavedDraft|undefined>,local:DraftSnapshot[]){
   generation++;owner=id;cloud=server;pending=new Map();conflicts=new Map();clearTimeout(timer);retries=0;lastError=undefined;
   if(!id){announce('Guest drafts stay on this device. Sign in to keep progress.');return;}
   for(const draft of local){const key=draftKey(draft.lesson,draft.language),saved=cloud[key],base=readDraftBase(id,key);
    if(same(draft,saved)){remember(id,key,saved!);continue;}
    // The caller omits untouched starters; existing local work without a
    // baseline is a first upload, not an already-saved draft.
    pending.set(key,draft);
    if(saved&&(!base||base.revision!==saved.revision&&!same(base,saved)))conflicts.set(key,draft);
   }
   announce(conflicts.size?'This device and your account have different drafts. Compare saved versions.':pending.size?'Restoring unsynced edits…':'Saved to your account');if(pending.size)schedule();
  },
  change(draft:DraftSnapshot){if(!owner)return;const key=draftKey(draft.lesson,draft.language);if(same(draft,cloud[key])&&!pending.has(key)&&!(active?.owner===owner&&active.generation===generation&&active.key===key))return;pending.set(key,{...draft});if(conflicts.has(key))conflicts.set(key,{...draft});lastError=undefined;announce(conflicts.size?'Compare saved versions to sync this draft.':'Saving to your account…');schedule();},
  async flush(){clearTimeout(timer);lastError=undefined;await drain();},
  retry(){if(!owner)return;retries=0;lastError=undefined;schedule(0);},
  resolve(key:string,saved:SavedDraft){cloud[key]=saved;remember(owner,key,saved);pending.delete(key);conflicts.delete(key);lastError=undefined;announce('Saved to your account');if(pending.size)schedule();},
  conflicts:()=>[...conflicts.values()],
  busy:()=>!!flight||pending.size>0,
 };
}
