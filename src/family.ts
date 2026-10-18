import {draftSync,readDraftBase,type DraftSnapshot} from './draft-sync.ts';
import {getLesson} from './lessons.ts';
import {progressRows,challengeLabels} from './progress-view.ts';
import {valuesText,type RunValues} from './run-values.ts';
import {attachOnboarding,type OnboardingFamily} from './onboarding.ts';
import {curriculumHeader,curriculumRows,bindCurriculumPreviews} from './curriculum-view.ts';
import {lessonIds,lessonTargets,targetLesson,draftKey,type LessonId} from './model.ts';
type Language='python'|'java';
type Draft={source:string;revision:number;target?:string};
type Attempt={id:string;source:string;language:Language;target:string;outcome:string;seconds:number|null;error?:string;verified?:boolean;at?:string;values?:Partial<RunValues>;output?:string;owner?:string|null};
type Family=Omit<OnboardingFamily,'students'> & {recoveryEmail?:string|null;profile:{id:string;name:string;role:string};drafts:Partial<Record<string,Draft>>;history:Attempt[];students:{id:string;name:string;completed:string[];experiments:number;lastActivity?:string|null;missionCompleted?:Record<string,string>;recent?:{target:string;outcome:string;verified:boolean;at:string}[]}[];completed:string[]};
type Hooks={draft:()=>{source:string;language:Language;target:string;lesson:LessonId};lesson:()=>LessonId;openLesson:(lesson:LessonId,target?:string)=>void;draftFor:(language:Language,lesson?:LessonId)=>string;targetFor:(language:Language,lesson?:LessonId)=>string;load:(language:Language,source:string,lesson?:LessonId,target?:string)=>void;profile:(id:string|null,drafts:Family['drafts'],completed:string[])=>void;progress:(completed:string[],signedIn:boolean,pending?:string[])=>void;running:()=>boolean;checking:(active:boolean)=>void;canEdit:(lesson?:LessonId)=>boolean;stop:()=>void};
const hosted=import.meta.env.VITE_HOSTED==='1';
const escape=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function attachFamily(hooks:Hooks){
 let family:Family|null=null,checking=false,identity=0,refreshVersion=0,conflictLanguage:Language|undefined,conflictLesson:LessonId|undefined;
 let retiredRecoveryLink=false,switching=false;
 let draftRetry=false;
 let pending:Attempt[]=[],syncing=false,attemptRetries=0,attemptTimer:ReturnType<typeof setTimeout>|undefined;
 const readList=(key:string):Attempt[]=>{try{const rows=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(rows)?rows.filter(a=>a&&typeof a.id==='string'&&typeof a.source==='string').slice(0,12):[];}catch{return [];}};
 let localHistory:Attempt[]=readList('robolab.guest.history');
 const persist=(key:string,rows:Attempt[])=>{try{localStorage.setItem(key,JSON.stringify(rows.slice(0,12)));}catch{q('save-help').textContent='History is in this tab only. Device storage is unavailable.';}};
 function readRecoveryLink(){
  if(/^#(?:verify-email|recover-family)=/.test(location.hash)){
   retiredRecoveryLink=true;history.replaceState(null,'',location.pathname+location.search);
  }
  try{if(sessionStorage.getItem('robolab-recovery-link'))retiredRecoveryLink=true;sessionStorage.removeItem('robolab-recovery-link');}catch{}
 }
 readRecoveryLink();
 const shell=document.createElement('div');shell.innerHTML=`
 <nav class="learning-nav" aria-label="Learning and family"><button id="curriculum-open" aria-haspopup="dialog" aria-controls="curriculum-dialog">Curriculum & unlocks</button><button id="parent-signin-open">Parent sign in</button><button id="student-signin-open">Student sign in</button><button id="family-open" aria-haspopup="dialog" aria-controls="family-dialog">Family & progress</button><span id="profile-label">Guest practice</span></nav>
 <dialog id="curriculum-dialog" class="learning-dialog" aria-labelledby="curriculum-title">${curriculumHeader()}<p class="build-status">Run real Python or Java. Separate drafts; free retries and hints.</p></dialog>
 <dialog id="family-dialog" class="learning-dialog"><div class="dialog-heading"><h2>Family & progress</h2><button data-close aria-label="Close family progress">Close ✕</button></div><p>Take separate turns on the same missions and share family progress. Experiment freely: retries and help never cost points.</p><section id="email-verification-notice" class="verification-notice" role="status" aria-live="polite" aria-atomic="true" hidden></section><p id="family-message" role="status" aria-live="polite"></p><div id="student-link-flow"></div><div id="recovery-flow"></div><div id="setup-receipt"></div><div id="family-content"></div></dialog>`;
 document.body.append(shell);
 document.querySelector('#language-badge')!.before(shell.querySelector('.learning-nav')!);
 const q=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
 const dialog=(id:string)=>q<HTMLDialogElement>(id);
 shell.querySelectorAll<HTMLButtonElement>('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog')!.close());
 q('curriculum-open').onclick=()=>{renderCurriculum();dialog('curriculum-dialog').showModal();q('curriculum-dialog').scrollTop=0;};
 shell.querySelectorAll<HTMLAnchorElement>('[data-chapter]').forEach(link=>link.onclick=e=>{e.preventDefault();const heading=q('curriculum-'+link.dataset.chapter);heading.scrollIntoView({block:'start',behavior:'instant'});heading.focus({preventScroll:true});});
 q('family-open').onclick=()=>{render();dialog('family-dialog').showModal();if(family)void refresh().catch(e=>say(e.message));};
 for(const mode of ['parent','student'] as const)q(mode+'-signin-open').onclick=()=>{onboarding.open(mode);render();dialog('family-dialog').showModal();q(mode==='parent'?'parent-signin-email':'access-code')?.focus();};
 const toolbar=document.createElement('section');toolbar.className='family-tools';toolbar.hidden=!hosted;
 toolbar.innerHTML='<div><strong>Code & progress</strong><p id="save-help" role="status" aria-live="polite">Guest drafts stay on this device. Sign in to keep progress.</p><p id="progress-sync" role="status" aria-live="polite"></p></div><button id="history-open">Run history</button><button id="stop-check" hidden>Stop check</button><button id="retry-sync" hidden>Retry sync</button><button id="resolve-conflict" hidden>Compare saved versions</button>';
 toolbar.hidden=false;document.querySelector('.workbench')!.after(toolbar);
 const historyDialog=document.createElement('dialog');historyDialog.id='run-history';historyDialog.className='learning-dialog';historyDialog.setAttribute('aria-label','Run history');document.body.append(historyDialog);
 function clearPrivateViews(){historyDialog.close();historyDialog.replaceChildren();document.querySelectorAll('[data-draft-comparison]').forEach(node=>node.remove());}
 q('history-open').onclick=()=>{renderHistory();historyDialog.showModal();};
 let checkAbort:AbortController|undefined,checkId='',cancelPromise:Promise<unknown>|undefined;
 const say=(text:string)=>{q('family-message').textContent=text;};
 const progressMessage=(text:string)=>{q('progress-sync').textContent=text;};
 const saves=draftSync({request:draft=>request('/draft',draft),status:(text,conflicts)=>{q('save-help').textContent=text;draftRetry=text.includes('waiting to sync');q('retry-sync').hidden=!draftRetry&&!pending.length;q('resolve-conflict').hidden=!conflicts.length;if(conflicts[0]){conflictLanguage=conflicts[0].language;conflictLesson=conflicts[0].lesson;}}});
 function notifyProgress(){hooks.progress(family?.completed??[],!!family,pending.filter(a=>a.outcome==='reached'&&!family?.completed.includes(a.target)).map(a=>a.target));}
 function retainPending(){if(family)persist(`robolab.profile.${family.profile.id}.pending`,pending);notifyProgress();q('retry-sync').hidden=!draftRetry&&!pending.length;}
 async function stopCheck(){if(!checking||!checkAbort)return;const id=checkId;checkAbort.abort();pending=pending.filter(a=>a.id!==id);retainPending();cancelPromise=request('/cancel',{id});const result=await cancelPromise as {completed:boolean};if(result.completed)await refresh();progressMessage(result.completed?'The check already finished. Progress refreshed.':'Progress check stopped. Run again when you are ready.');}
 async function request(path:string,data?:unknown,signal?:AbortSignal,profileHeader=true){
  const requestedIdentity=identity;
  const response=await fetch('/api/family'+path,{method:data===undefined?'GET':'POST',headers:{...(data===undefined?{}:{'Content-Type':'application/json'}),...(profileHeader&&family&&path!=='/login'?{'X-RoboLab-Profile':family.profile.id}:{})},credentials:'same-origin',body:data===undefined?undefined:JSON.stringify(data),signal});
  const result=await response.json();if(!response.ok){if(requestedIdentity===identity&&family&&path!=='/login'&&!path.startsWith('/auth')&&(response.status===401||response.status===409&&result.error==='The signed-in profile changed in another tab. Sign in again before saving or running.')){identity++;switching=true;hooks.stop();family=null;pending=[];localHistory=readList('robolab.guest.history');clearPrivateViews();saves.profile('',{},[]);onboarding.clear();hooks.profile(null,{},[]);switching=false;notifyProgress();render();renderCurriculum();}if(response.status===409&&path==='/draft')q('resolve-conflict').hidden=false;throw Object.assign(Error(result.error||'Family service unavailable. Your code stays in the editor.'),{status:response.status,code:result.code});}return result;
 }
 const onboarding=attachOnboarding({request,refresh:()=>refresh(),say,render,close:()=>dialog('family-dialog').close(),signIn:async code=>{
  await stopCheck();hooks.stop();if(family)await saves.flush().catch(()=>{});
  await request('/login',{code});await refresh(true);say('Signed in. Your saved code and progress are ready.');
 }});
 async function refresh(switchProfile=false){
  const before=identity,version=++refreshVersion;const next:Family=await request('',undefined,undefined,!switchProfile);if(before!==identity||version!==refreshVersion)return;
  const changed=family?.profile.id!==next.profile.id;
  if(family&&!changed&&!switchProfile)next.drafts=family.drafts;
  family=next;
  if(switchProfile||changed){
   identity++;switching=true;clearPrivateViews();pending=readList(`robolab.profile.${next.profile.id}.pending`).filter(a=>a.owner===next.profile.id);localHistory=readList(`robolab.profile.${next.profile.id}.history`);hooks.profile(next.profile.id,next.drafts,next.completed);switching=false;
   const local=lessonIds.flatMap(lesson=>(['python','java'] as const).map(language=>({lesson,language,source:hooks.draftFor(language,lesson),target:hooks.targetFor(language,lesson)})));
   saves.profile(next.profile.id,next.drafts,local.filter(d=>next.drafts[draftKey(d.lesson,d.language)]||readDraftBase(next.profile.id,draftKey(d.lesson,d.language))||d.source!==getLesson(d.lesson).starters[d.language]||d.target!==lessonTargets[d.lesson][0]));attemptRetries=0;
  }
  notifyProgress();render();renderCurriculum();if(historyDialog.open)renderHistory();if(pending.length)scheduleAttempts();
 }
 function count(completed:string[],lesson:LessonId){return lessonTargets[lesson].filter(t=>completed.includes(t)).length;}
 function renderCurriculum(){
  q('curriculum-list').innerHTML=curriculumRows(family?.completed??[]);
  bindCurriculumPreviews(q('curriculum-list'));
  shell.querySelectorAll<HTMLButtonElement>('[data-lesson]').forEach(b=>b.onclick=()=>{hooks.openLesson(b.dataset.lesson as LessonId);dialog('curriculum-dialog').close();q(hooks.canEdit()?'code':'preview-title').focus({preventScroll:true});});
 }
 function renderVerificationNotice(){
  const notice=q('email-verification-notice');
  // Show only the server-confirmed address for this parent. A pending link must
  // not borrow a previous address's verified status, even if that link fails.
  const email=family?.profile.role==='parent'&&!retiredRecoveryLink?family.recoveryEmail:null;
  if(!email){notice.hidden=true;notice.replaceChildren();return;}
  // Keep an unchanged live region intact so ordinary re-renders do not announce it again.
  if(notice.querySelector('[data-verified-email]')?.textContent!==email){
   notice.innerHTML=`<span class="verification-icon" aria-hidden="true">✓</span><div><h3>Email verified</h3><p><strong data-verified-email>${escape(email)}</strong> is your verified parent email. Return with a fresh email code whenever you need to manage your family.</p></div>`;
  }
  notice.hidden=false;
 }
 function renderRecovery(){
  const host=q('recovery-flow');host.replaceChildren();if(!retiredRecoveryLink)return;
  host.innerHTML='<section class="code-receipt"><h3>Parents now sign in by email</h3><p>This older recovery link is no longer used. Continue with your verified parent email. Your students and saved work are kept.</p><button id="recovery-dismiss">Continue</button></section>';
  q('recovery-dismiss').onclick=()=>{retiredRecoveryLink=false;render();};
 }
 function render(){
  renderVerificationNotice();renderRecovery();onboarding.link(q('student-link-flow'),family);
  document.documentElement.dataset.profile=family?.profile.id??'';
  q('parent-signin-open').hidden=!!family||!hosted;q('student-signin-open').hidden=!!family||!hosted;
  q('family-open').textContent=family?.profile.role==='parent'?'Parent dashboard':family?'My progress':'Family & progress';
  q('family-dialog').querySelector('h2')!.textContent=family?.profile.role==='parent'?'Parent dashboard':family?'My progress':'Family & progress';
  q('profile-label').textContent=family?`${family.profile.name} · private family`:'Guest practice';
  if(!hosted){q('family-content').innerHTML='<p>Family accounts are available on the hosted release. This local workshop keeps anonymous practice drafts on this device.</p>';return;}
  if(!family){
   q('family-content').innerHTML='<div id="onboarding-entry"></div><div class="family-entry" id="student-entry"><section><h3>Student sign-in</h3><p>Enter the code your parent gave you to continue your saved work on any device. Lost your student code? Ask your parent for a replacement; your progress is kept.</p><form id="family-login"><label>Student code<input id="access-code" type="password" autocomplete="off" maxlength="32" required></label><button class="primary">Sign in</button></form></section></div><p>Try Mission 1 in Python without signing in. Sign in to check progress and unlock the next mission.</p><button id="guest-practice">Try Python without an account</button>';
   q<HTMLFormElement>('family-login').onsubmit=async e=>{e.preventDefault();const button=q('family-login').querySelector<HTMLButtonElement>('button')!;button.disabled=true;try{await stopCheck();hooks.stop();await request('/login',{code:q<HTMLInputElement>('access-code').value.trim()});await refresh(true);say('Signed in. Your saved code and progress are ready.');}catch(e){say((e as Error).message);}finally{button.disabled=false;}};
   onboarding.entry(q('onboarding-entry'),q('student-entry'));q('guest-practice').onclick=()=>dialog('family-dialog').close();return;
  }

  q('family-content').innerHTML=`<div class="family-heading"><h3>${escape(family.profile.name)}</h3><button id="family-refresh">Refresh progress</button><button id="family-logout">Sign out</button></div>
  <div id="parent-onboarding"></div>
  ${family.profile.role==='student'?`<h3>Your progress</h3>${progressMarkup(family.completed)}`:''}
  <h3>${family.profile.role==='parent'?"Your children's progress":'Shared family results'}</h3><p>Three completed challenges finish a mission. Progress updates automatically after a successful Run is confirmed. Each child keeps their own work.</p>
  <div class="family-results">${family.students.map(p=>{const rows=progressRows(p.completed),next=rows.find(r=>!r.complete);return `<article><strong>${escape(p.name)}</strong><span>${rows.filter(r=>r.complete).length} of ${rows.length} missions complete · ${p.experiments} runs</span><p>${next?`Next: ${escape(next.title)} · ${next.count}/3 challenges complete`:'All four missions complete. Try a changed case or revisit a favorite.'}</p>${family!.profile.role==='parent'?`<small>${p.lastActivity?'Last activity: '+escape(new Date(p.lastActivity).toLocaleString()):'No recorded activity yet'}</small><details><summary>View ${escape(p.name)}’s progress</summary>${progressMarkup(p.completed)}<p>Completion shows the robot met the objective. Ask your child to explain what changed and why.</p>${p.recent?.length?`<h4>Recent activity</h4><ul>${p.recent.map(a=>`<li>${escape(challengeLabels[a.target]??a.target)} · ${a.verified&&a.outcome==='reached'?'Completed':a.outcome==='reached'?'Practice passed':a.outcome==='missed'?'Tried again':escape(a.outcome)} · ${escape(new Date(a.at).toLocaleDateString())}</li>`).join('')}</ul>`:''}</details><details><summary>Manage student login</summary><small>${({waiting:'Waiting for first sign-in',ready:'Ready · student has signed in',existing:'Existing student'} as Record<string,string>)[family!.studentSignIns?.[p.id]??'existing']}</small>${family!.emailLogin?`<button data-code="${p.id}">New access code</button><button data-revoke="${p.id}">Revoke access</button>`:''}</details>`:''}</article>`;}).join('')||'<p>Add a student below to see their progress here.</p>'}</div>`;
  // Keep setup secondary once a family has students.
  if(family.profile.role==='parent'&&family.students.length)q('family-content').append(q('parent-onboarding'));
  q('family-refresh').onclick=()=>void refresh().catch(e=>say(e.message));
  q('family-logout').onclick=async()=>{try{await stopCheck();hooks.stop();const synced=await saves.flush().then(()=>true,()=>false);await request('/logout',{});identity++;switching=true;family=null;pending=[];localHistory=readList('robolab.guest.history');clearPrivateViews();saves.profile('',{},[]);onboarding.clear();hooks.profile(null,{},[]);localHistory=readList('robolab.guest.history');switching=false;notifyProgress();render();renderCurriculum();say(synced?'Signed out. Your drafts and progress are saved.':'Signed out. Unsynced edits are kept in this tab; return here to finish syncing.');}catch(e){say((e as Error).message);}};
  if(family.profile.role==='parent'){
   if(family.emailLogin)onboarding.parent(q('parent-onboarding'),family);
   else q('parent-onboarding').textContent='Parent access now uses email. Student logins and saved work are kept.';
   shell.querySelectorAll<HTMLButtonElement>('[data-code],[data-revoke]').forEach(b=>b.onclick=async()=>{const revoke=!!b.dataset.revoke;if(revoke&&!confirm('Revoke this student’s sign-in access? Their saved work will be retained.'))return;try{if(!revoke){await onboarding.replace(b.dataset.code!);return;}await request('/access',{id:b.dataset.revoke,revoke:true});await refresh();say('Student access revoked.');}catch(e){say((e as Error).message);}});
  }
 }
 function progressMarkup(completed:string[]){return progressRows(completed).map(row=>`<section class="mission-progress"><h4>${escape(row.title)} · ${row.complete?'✓ Complete':`${row.count}/3 challenges`}</h4><p>${escape(row.concept)}</p><ul class="rescue-checklist">${row.challenges.map(c=>`<li>${c.complete?'✓':'○'} ${escape(c.label)}</li>`).join('')}</ul></section>`).join('');}
 function renderHistory(){
  const rows=[...localHistory,...(family?.history??[])];const unique=[...new Map(rows.map(a=>[a.id,a])).values()].sort((a,b)=>(b.at??'').localeCompare(a.at??'')).slice(0,12);
  historyDialog.innerHTML=`<div class="dialog-heading"><h2>Run history</h2><button id="history-close">Close ✕</button></div><p>Latest 12 runs ${family?'for your profile':'on this device'}. Code contains the values you tried; final robot measurements appear below. Console output keeps up to 4,000 characters. Arbitrary variables are not recorded.</p><div class="experiment-list">${unique.map((a,i)=>`<article><div><strong>${escape(challengeLabels[a.target]??a.target)} · ${a.language==='java'?'Java':'Python'}</strong><span>${a.verified&&a.outcome==='reached'?'✓ Challenge complete':a.outcome==='reached'?'Practice passed · '+(pending.some(row=>row.id===a.id)?'waiting to sync':family?.completed.includes(a.target)?'challenge already complete':family?'not server confirmed':'on this device'):a.outcome==='missed'?'Not yet':escape(a.outcome)}${a.seconds!==null?` · ${a.seconds.toFixed(2)} simulated seconds`:''}</span><small>${a.at?escape(new Date(a.at).toLocaleString()):''}</small><p>${escape(valuesText(a.values??{}))}</p><details><summary>Code & console from this run</summary><pre class="history-code">${escape(a.source)}</pre><h4>Console output</h4><pre>${escape(a.output||a.error||'No printed output.')}</pre></details></div><button data-history="${i}">Restore this code</button></article>`).join('')||'<p>Your runs will appear here after you Run.</p>'}</div>`;
  q('history-close').onclick=()=>historyDialog.close();
  historyDialog.querySelectorAll<HTMLButtonElement>('[data-history]').forEach(button=>button.onclick=async()=>{
   const a=unique[Number(button.dataset.history)],who=identity,id=targetLesson(a.target),before=hooks.draft();if(!hooks.canEdit(id)){progressMessage('Finish the previous mission before restoring this run.');return;}
   try{if(family)await saves.flush();if(who!==identity)return;const now=hooks.draft();if(now.source!==before.source||now.language!==before.language||now.lesson!==before.lesson||now.target!==before.target){progressMessage('Your draft changed while saving. Restore again when ready.');return;}
    hooks.stop();hooks.load(a.language,a.source,id,a.target);historyDialog.close();progressMessage('Earlier code restored with a return copy of your draft. Run when ready.');
   }catch(e){progressMessage((e as Error).message);}
  });
 }
 function draftChanged(){if(!switching&&family&&hooks.canEdit())saves.change(hooks.draft());}
 q('resolve-conflict').onclick=async()=>{
  if(!family||!hooks.canEdit(conflictLesson))return;const who=identity,currentDraft=hooks.draft();if(conflictLanguage){currentDraft.language=conflictLanguage;currentDraft.lesson=conflictLesson??currentDraft.lesson;currentDraft.source=hooks.draftFor(conflictLanguage,currentDraft.lesson);currentDraft.target=hooks.targetFor(conflictLanguage,currentDraft.lesson);}
  try{
   const latest:Family=await request('');if(who!==identity)return;
   const key=draftKey(currentDraft.lesson,currentDraft.language),cloud=latest.drafts[key];if(!cloud){say('No saved draft found. Keep your editor and try again.');return;}
   const compare=document.createElement('dialog');compare.className='learning-dialog';compare.dataset.draftComparison='';
   compare.innerHTML='<div class="dialog-heading"><h2>Choose which draft to keep</h2><button id="conflict-cancel">Cancel</button></div><p>Another tab saved a newer version. Compare before replacing either version.</p><label>Your editor<textarea id="conflict-editor" readonly rows="8"></textarea></label><label>Saved on the server<textarea id="conflict-cloud" readonly rows="8"></textarea></label><div class="learning-nav"><button id="conflict-save">Keep editor & replace saved draft</button><button id="conflict-load">Use saved draft</button></div>';
   document.body.append(compare);q<HTMLTextAreaElement>('conflict-editor').value=currentDraft.source;q<HTMLTextAreaElement>('conflict-cloud').value=cloud.source;
   const contexts=document.createElement('p');contexts.textContent=`Editor challenge: ${currentDraft.target}. Saved challenge: ${cloud.target??'not recorded in this older save'}.`;compare.querySelector('p')!.after(contexts);
   const close=()=>{compare.close();compare.remove();};q('conflict-cancel').onclick=close;
   q('conflict-save').onclick=async()=>{try{if(who!==identity)return close();const saved=await request('/draft',{...currentDraft,revision:cloud.revision});if(who!==identity)return close();saves.resolve(key,saved);close();draftChanged();say('Your chosen editor version is saved.');}catch(e){close();say((e as Error).message);}};
   q('conflict-load').onclick=()=>{if(who!==identity)return close();if((hooks.draftFor(currentDraft.language,currentDraft.lesson)!==currentDraft.source || hooks.targetFor(currentDraft.language,currentDraft.lesson)!==currentDraft.target)){close();say('Your draft changed while comparing. Compare again to protect your latest edits.');return;}saves.resolve(key,cloud);hooks.load(currentDraft.language,cloud.source,currentDraft.lesson,cloud.target);q('resolve-conflict').hidden=true;close();say('Saved version loaded.');};
   compare.showModal();
  }catch(e){say((e as Error).message);}
 };
 q('stop-check').onclick=()=>void stopCheck().catch(e=>progressMessage(e.message));
 q('retry-sync').onclick=()=>{saves.retry();attemptRetries=0;scheduleAttempts(0);};
 function scheduleAttempts(delay=500){clearTimeout(attemptTimer);attemptTimer=setTimeout(()=>void syncAttempts(),delay);}
 async function syncAttempts(){
  if(syncing||!family||!pending.length)return;if(hooks.running()){scheduleAttempts(1000);return;}
  const a=pending[0],who=identity;syncing=true;let failed=false;
  try{
   await request('/attempt',a);if(who!==identity)return;
   if(a.outcome==='reached'&&!family.completed.includes(a.target)){
    checking=true;hooks.checking(true);checkId=a.id;cancelPromise=undefined;checkAbort=new AbortController();q('stop-check').hidden=false;progressMessage('Challenge passed · saving progress… You can keep editing.');
    const result=await request('/verify',a,checkAbort.signal);if(who!==identity)return;
    family.completed=result.completed;notifyProgress();
    progressMessage(result.outcome==='reached'?'✓ Challenge complete. Progress saved for your family.':result.error||'The server could not confirm this run. Your code and results are safe; try Run again.');
   }
   pending=pending.filter(row=>row.id!==a.id);retainPending();attemptRetries=0;await refresh();
  }catch(error){
   if(who===identity&&!checkAbort?.signal.aborted){failed=true;progressMessage('Your run is kept on this device. Progress is waiting to sync. '+(error as Error).message);
    const status=(error as {status?:number}).status;
    if(status===400||status===403){pending=pending.filter(row=>row.id!==a.id);retainPending();progressMessage((error as Error).message+' Your code remains in Run history.');}
    else if(status!==429&&status!==401&&attemptRetries<3)scheduleAttempts([2000,8000,30000][attemptRetries++]);
   }
  }finally{
   await Promise.resolve(cancelPromise).catch(()=>{});syncing=false;checking=false;checkAbort=undefined;hooks.checking(false);q('stop-check').hidden=true;
   if(who===identity)retainPending();if(pending.length&&(!failed||who!==identity))scheduleAttempts();
  }
 }
 async function record(a:Attempt){
  if((a.owner??null)!==(family?.profile.id??null))return;
  a={...a,at:new Date().toISOString(),output:a.output?.slice(0,4000)};
  localHistory=[a,...localHistory.filter(row=>row.id!==a.id)].slice(0,12);persist(family?`robolab.profile.${family.profile.id}.history`:'robolab.guest.history',localHistory);if(historyDialog.open)renderHistory();
  if(!family)return;
  // Keep the first successful snapshot per unfinished challenge while offline.
  if(a.outcome==='reached'&&pending.some(row=>row.target===a.target&&row.outcome==='reached'))return;
  if(pending.length>=12){progressMessage('Twelve runs are waiting to sync. Reconnect before saving more progress. Your latest code is kept.');return;}
  pending.push(a);retainPending();scheduleAttempts(0);
 }
 function onReturn(){if(document.visibilityState==='hidden')return;saves.retry();attemptRetries=0;scheduleAttempts();if(family&&(dialog('family-dialog').open||historyDialog.open))void refresh().catch(e=>say(e.message));}
 window.addEventListener('online',onReturn);window.addEventListener('focus',onReturn);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&family)void saves.flush().catch(()=>{});});
 window.addEventListener('hashchange',()=>{readRecoveryLink();onboarding.readLink();if(retiredRecoveryLink||onboarding.hasLink()){render();if(!dialog('family-dialog').open)dialog('family-dialog').showModal();}});
 if(hosted)void refresh().catch(()=>{render();}).finally(()=>{if((retiredRecoveryLink||onboarding.hasLink())&&!dialog('family-dialog').open)dialog('family-dialog').showModal();});else render();
 return {record,draftChanged,profileId:()=>family?.profile.id??null,isChecking:()=>checking};
}
