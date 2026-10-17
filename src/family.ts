import {attachOnboarding,type OnboardingFamily} from './onboarding.ts';
import {curriculumHeader,curriculumRows,bindCurriculumPreviews} from './curriculum-view.ts';
import {lessonTargets,targetLesson,draftKey,type LessonId} from './model.ts';
type Language='python'|'java';
type Draft={source:string;revision:number;target?:string};
type Attempt={id:string;source:string;language:Language;target:string;outcome:string;seconds:number|null;error?:string;verified?:boolean;at?:string};
type Family=Omit<OnboardingFamily,'students'> & {recoveryEmail?:string|null;profile:{id:string;name:string;role:string};drafts:Partial<Record<string,Draft>>;history:Attempt[];students:{id:string;name:string;completed:string[];experiments:number}[];completed:string[]};
type Hooks={draft:()=>{source:string;language:Language;target:string;lesson:LessonId};lesson:()=>LessonId;openLesson:(lesson:LessonId,target?:string)=>void;draftFor:(language:Language,lesson?:LessonId)=>string;targetFor:(language:Language,lesson?:LessonId)=>string;load:(language:Language,source:string,lesson?:LessonId,target?:string)=>void;profile:(id:string|null,drafts:Family['drafts'],completed:string[])=>void;progress:(completed:string[],signedIn:boolean)=>void;checking:(active:boolean)=>void;canEdit:(lesson?:LessonId)=>boolean;stop:()=>void};
const hosted=import.meta.env.VITE_HOSTED==='1';
const escape=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function attachFamily(hooks:Hooks){
 let family:Family|null=null,checking=false,identity=0,refreshVersion=0,conflictLanguage:Language|undefined,conflictLesson:LessonId|undefined;
 let retiredRecoveryLink=false;
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
 q('family-open').onclick=()=>{render();dialog('family-dialog').showModal();};
 for(const mode of ['parent','student'] as const)q(mode+'-signin-open').onclick=()=>{onboarding.open(mode);render();dialog('family-dialog').showModal();q(mode==='parent'?'parent-signin-email':'access-code')?.focus();};
 const toolbar=document.createElement('section');toolbar.className='family-tools';toolbar.hidden=!hosted;
 toolbar.innerHTML='<div><strong>Keep your progress</strong><p id="save-help" role="status" aria-live="polite">Sign in to save drafts and share checked progress.</p></div><button id="save-cloud">Save draft</button><button id="verify-cloud">Check & save progress</button><button id="stop-check" hidden>Stop check</button><button id="resolve-conflict" hidden>Compare saved versions</button>';
 document.querySelector('.workbench')!.after(toolbar);
 let checkAbort:AbortController|undefined,checkId='',cancelPromise:Promise<unknown>|undefined;
 async function stopCheck(){if(!checking||!checkAbort)return;checkAbort.abort();cancelPromise=request('/cancel',{id:checkId});const result=await cancelPromise as {completed:boolean};say(result.completed?'The check had already finished. Refresh progress to see its result.':'Check stopped. No completion was awarded.');}
 const say=(text:string)=>{q('family-message').textContent=text;q('save-help').textContent=text;};
 async function request(path:string,data?:unknown,signal?:AbortSignal,profileHeader=true){
  const requestedIdentity=identity;
  const response=await fetch('/api/family'+path,{method:data===undefined?'GET':'POST',headers:{...(data===undefined?{}:{'Content-Type':'application/json'}),...(profileHeader&&family&&path!=='/login'?{'X-RoboLab-Profile':family.profile.id}:{})},credentials:'same-origin',body:data===undefined?undefined:JSON.stringify(data),signal});
  const result=await response.json();if(!response.ok){if(requestedIdentity===identity&&family&&path!=='/login'&&!path.startsWith('/auth')&&(response.status===401||response.status===409&&result.error==='The signed-in profile changed in another tab. Sign in again before saving or running.')){identity++;hooks.stop();family=null;onboarding.clear();hooks.profile(null,{},[]);hooks.progress([],false);render();renderCurriculum();}if(response.status===409&&path==='/draft')q('resolve-conflict').hidden=false;throw Object.assign(Error(result.error||'Family service unavailable. Your code stays in the editor.'),{status:response.status,code:result.code});}return result;
 }
 const onboarding=attachOnboarding({request,refresh:()=>refresh(),say,render,close:()=>dialog('family-dialog').close(),signIn:async code=>{
  await stopCheck();hooks.stop();if(family&&hooks.canEdit())await save();
  await request('/login',{code});await refresh(true);say('Signed in. Your saved code and progress are ready.');
 }});
 async function refresh(switchProfile=false){
  const before=identity,version=++refreshVersion;const next:Family=await request('',undefined,undefined,!switchProfile);if(before!==identity||version!==refreshVersion)return;
  const changed=family?.profile.id!==next.profile.id;
  if(family&&!changed&&!switchProfile)next.drafts=family.drafts;
  family=next;
  if(switchProfile||changed){identity++;hooks.profile(next.profile.id,next.drafts,next.completed);}
  hooks.progress(next.completed,true);render();renderCurriculum();
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
  q('profile-label').textContent=family?`${family.profile.name} · private family`:'Guest practice';
  if(!hosted){q('family-content').innerHTML='<p>Family accounts are available on the hosted release. This local workshop keeps anonymous practice drafts on this device.</p>';return;}
  if(!family){
   q('family-content').innerHTML='<div id="onboarding-entry"></div><div class="family-entry" id="student-entry"><section><h3>Student sign-in</h3><p>Enter the code your parent gave you to continue your saved work on any device. Lost your student code? Ask your parent for a replacement; your progress is kept.</p><form id="family-login"><label>Student code<input id="access-code" type="password" autocomplete="off" maxlength="32" required></label><button class="primary">Sign in</button></form></section></div><p>Try Mission 1 in Python without signing in. Sign in to check progress and unlock the next mission.</p><button id="guest-practice">Try Python without an account</button>';
   q<HTMLFormElement>('family-login').onsubmit=async e=>{e.preventDefault();const button=q('family-login').querySelector<HTMLButtonElement>('button')!;button.disabled=true;try{await stopCheck();hooks.stop();await request('/login',{code:q<HTMLInputElement>('access-code').value.trim()});await refresh(true);say('Signed in. Your saved code and progress are ready.');}catch(e){say((e as Error).message);}finally{button.disabled=false;}};
   onboarding.entry(q('onboarding-entry'),q('student-entry'));q('guest-practice').onclick=()=>dialog('family-dialog').close();return;
  }

  q('family-content').innerHTML=`<div class="family-heading"><h3>${escape(family.profile.name)}</h3><button id="family-refresh">Refresh progress</button><button id="family-logout">Sign out</button></div>
  <div id="parent-onboarding"></div>
  ${family.profile.role==='student'?`<h3>Mission 1 · checked rescues</h3><p>${count(family.completed,'L01')} of 3 completed. ${count(family.completed,'L01')===3?'Mission 1 complete. Mission 2 unlocked!':'Use Check & save progress after adapting your program.'}</p><ul class="rescue-checklist">${[['beacon','North ridge'],['farther','East lookout'],['reverse','Lower cove']].map(([id,name])=>`<li>${family!.completed.includes(id)?'✓':'○'} ${name}</li>`).join('')}</ul>
  <h3>Mission 2 · recovery badges</h3><p>${count(family.completed,'L02')} of 3 checked. ${count(family.completed,'L01')<3?'Finish all 3 checked challenges in Mission 1 to unlock Mission 2.':count(family.completed,'L02')===3?'Mission 2 complete. Mission 3 unlocked!':'Read the sensor, choose a turn, then try the lower-cove transfer.'}</p><ul class="rescue-checklist">${[['sensor-left','Right-turn rescue'],['sensor-right','Left-turn rescue'],['sensor-transfer','Transfer rescue']].map(([id,name])=>`<li>${family!.completed.includes(id)?'✓':'○'} ${name}</li>`).join('')}</ul>
  <h3>Mission 3 · patrol badges</h3><p>${count(family.completed,'L03')} of 3 checked. ${count(family.completed,'L02')<3?'Finish all 3 checked challenges in Mission 2 to unlock Mission 3.':count(family.completed,'L03')===3?'Mission 3 complete. Mission 4 unlocked!':'Log every checkpoint in each patrol, then adapt to the cove return.'}</p><ul class="rescue-checklist">${[['patrol-ridge','Ridge sweep'],['patrol-extra','Extra checkpoint'],['patrol-cove','Cove return']].map(([id,name])=>`<li>${family!.completed.includes(id)?'✓':'○'} ${name}</li>`).join('')}</ul>
  <h3>Mission 4 · parcel deliveries</h3><p>${count(family.completed,'L04')} of 3 checked. ${count(family.completed,'L03')<3?'Finish all 3 checked challenges in Mission 3 to unlock Mission 4.':count(family.completed,'L04')===3?'Mission 4 complete. Mission 5 is coming soon.':'Pick up, carry clear and release each parcel.'}</p><ul class="rescue-checklist">${[['parcel-across','Across the guard'],['parcel-moved','Moved receiving tray'],['parcel-return','Return delivery']].map(([id,name])=>`<li>${family!.completed.includes(id)?'✓':'○'} ${name}</li>`).join('')}</ul>
  `:''}<h3>${family.profile.role==='parent'?"Your children's progress":'Shared family results'}</h3><p>These are separate student attempts. Checked rescues are re-run on the server. Practice logs do not unlock missions. Competition rankings and live co-control are not part of this release.</p>
  <div class="family-results">${family.students.map(p=>`<article><strong>${escape(p.name)}</strong>${family!.profile.role==='parent'?`<small>${({waiting:'Waiting for first sign-in',ready:'Ready · student has signed in',existing:'Existing student'} as Record<string,string>)[family!.studentSignIns?.[p.id]??'existing']}</small>`:''}<span>${count(p.completed,'L01')}/3 checked rescues · Mission 2: ${count(p.completed,'L02')}/3 badges · Mission 3: ${count(p.completed,'L03')}/3 patrols · Mission 4: ${count(p.completed,'L04')}/3 deliveries · ${p.experiments} experiments</span>${family!.profile.role==='parent'&&family!.emailLogin?`<button data-code="${p.id}">New access code</button><button data-revoke="${p.id}">Revoke access</button>`:''}</article>`).join('')||'<p>No student profiles yet.</p>'}</div>
  <h3>Recent experiments</h3><p>Last 12 saved experiments. Loading one saves your current draft first and never runs code automatically.</p><div class="experiment-list">${family.history.map((a,i)=>`<article><div><strong>${a.language==='java'?'Java':'Python'} · ${escape(a.target)}</strong><span>${escape(a.outcome)} · ${a.verified?'server checked':'practice log'}${a.seconds!==null?` · ${a.seconds.toFixed(2)} simulated seconds`:''}</span></div><button data-history="${i}">Load code</button></article>`).join('')||'<p>Your experiments will appear here after you Run.</p>'}</div>`;
  q('family-refresh').onclick=()=>void refresh().catch(e=>say(e.message));
  q('family-logout').onclick=async()=>{try{await stopCheck();hooks.stop();await request('/logout',{});identity++;family=null;onboarding.clear();hooks.profile(null,{},[]);hooks.progress([],false);render();renderCurriculum();say('Signed out. Student drafts remain saved privately.');}catch(e){say((e as Error).message);}};
  if(family.profile.role==='parent'){
   if(family.emailLogin)onboarding.parent(q('parent-onboarding'),family);
   else q('parent-onboarding').textContent='Parent access now uses email. Student logins and saved work are kept.';
   shell.querySelectorAll<HTMLButtonElement>('[data-code],[data-revoke]').forEach(b=>b.onclick=async()=>{const revoke=!!b.dataset.revoke;if(revoke&&!confirm('Revoke this student’s sign-in access? Their saved work will be retained.'))return;try{if(!revoke){await onboarding.replace(b.dataset.code!);return;}await request('/access',{id:b.dataset.revoke,revoke:true});await refresh();say('Student access revoked.');}catch(e){say((e as Error).message);}});
  }
  shell.querySelectorAll<HTMLButtonElement>('[data-history]').forEach(b=>b.onclick=async()=>{if(checking){say('Stop the progress check before loading code.');return;}const a=family!.history[Number(b.dataset.history)],who=identity,id=targetLesson(a.target),before=hooks.draft();if(!hooks.canEdit(id)){say('Finish the previous mission before loading code here.');return;}try{if(hooks.canEdit())await save();if(a.language!==hooks.draft().language||id!==hooks.lesson())await save(a.language,id);if(who!==identity)return;const now=hooks.draft();if(now.source!==before.source||now.language!==before.language||now.lesson!==before.lesson||now.target!==before.target){say('Your draft changed while saving. It is safe; load the experiment again when ready.');return;}hooks.stop();hooks.load(a.language,a.source,id,a.target);dialog('family-dialog').close();say('Earlier code loaded. Your previous draft was saved first. Run when you are ready.');}catch(e){say((e as Error).message);}});
 }
 async function save(destination?:Language,destinationLesson=hooks.lesson()){
  if(!family){render();dialog('family-dialog').showModal();throw Error('Sign in to save a private draft.');}
  if(!hooks.canEdit(destinationLesson))throw Error('Read-only preview. Finish the previous mission before saving here.');
  const current=hooks.draft();if(destination){current.language=destination;current.lesson=destinationLesson;current.source=hooks.draftFor(destination,destinationLesson);current.target=hooks.targetFor(destination,destinationLesson);}conflictLanguage=current.language;conflictLesson=current.lesson;const key=draftKey(current.lesson,current.language),revision=family.drafts[key]?.revision??0,who=identity;
  const saved:Draft=await request('/draft',{...current,revision});
  if(who!==identity)return;
  family.drafts[key]=saved;q('resolve-conflict').hidden=true;say('Draft saved with its challenge to your profile. Notes stay on this device. You can continue on another device.');
 }
 q('resolve-conflict').onclick=async()=>{
  if(!family||!hooks.canEdit(conflictLesson))return;const who=identity,currentDraft=hooks.draft();if(conflictLanguage){currentDraft.language=conflictLanguage;currentDraft.lesson=conflictLesson??currentDraft.lesson;currentDraft.source=hooks.draftFor(conflictLanguage,currentDraft.lesson);currentDraft.target=hooks.targetFor(conflictLanguage,currentDraft.lesson);}
  try{
   const latest:Family=await request('');if(who!==identity)return;
   const key=draftKey(currentDraft.lesson,currentDraft.language),cloud=latest.drafts[key];if(!cloud){say('No saved draft found. Keep your editor and try again.');return;}
   const compare=document.createElement('dialog');compare.className='learning-dialog';
   compare.innerHTML='<div class="dialog-heading"><h2>Choose which draft to keep</h2><button id="conflict-cancel">Cancel</button></div><p>Another tab saved a newer version. Compare before replacing either version.</p><label>Your editor<textarea id="conflict-editor" readonly rows="8"></textarea></label><label>Saved on the server<textarea id="conflict-cloud" readonly rows="8"></textarea></label><div class="learning-nav"><button id="conflict-save">Keep editor & replace saved draft</button><button id="conflict-load">Use saved draft</button></div>';
   document.body.append(compare);q<HTMLTextAreaElement>('conflict-editor').value=currentDraft.source;q<HTMLTextAreaElement>('conflict-cloud').value=cloud.source;
   const contexts=document.createElement('p');contexts.textContent=`Editor challenge: ${currentDraft.target}. Saved challenge: ${cloud.target??'not recorded in this older save'}.`;compare.querySelector('p')!.after(contexts);
   const close=()=>{compare.close();compare.remove();};q('conflict-cancel').onclick=close;
   q('conflict-save').onclick=async()=>{try{if(who!==identity)return close();const saved=await request('/draft',{...currentDraft,revision:cloud.revision});family!.drafts[key]=saved;q('resolve-conflict').hidden=true;close();say('Your chosen editor version is saved.');}catch(e){close();say((e as Error).message);}};
   q('conflict-load').onclick=()=>{if(who!==identity)return close();if(checking){say('Stop the progress check before loading code.');return;}if((hooks.draftFor(currentDraft.language,currentDraft.lesson)!==currentDraft.source || hooks.targetFor(currentDraft.language,currentDraft.lesson)!==currentDraft.target)){close();say('Your draft changed while comparing. Compare again to protect your latest edits.');return;}family!.drafts[key]=cloud;hooks.load(currentDraft.language,cloud.source,currentDraft.lesson,cloud.target);q('resolve-conflict').hidden=true;close();say('Saved version loaded.');};
   compare.showModal();
  }catch(e){say((e as Error).message);}
 };
 q('save-cloud').onclick=()=>void save().catch(e=>say(e.message));
 q('stop-check').onclick=()=>void stopCheck().catch(e=>say(e.message));
 q('verify-cloud').onclick=async()=>{
  if(checking||!hooks.canEdit())return;if(!family){render();dialog('family-dialog').showModal();return;}
  hooks.stop();const draft=hooks.draft(),who=identity;checking=true;hooks.checking(true);checkId=crypto.randomUUID();cancelPromise=undefined;checkAbort=new AbortController();
  q<HTMLButtonElement>('verify-cloud').disabled=true;q('stop-check').hidden=false;say('Checking your actual program in an isolated server runtime…');
  try{const r=await request('/verify',{...draft,id:checkId},checkAbort.signal);if(who!==identity)return;await refresh();say(r.outcome==='reached'?'Rescue checked and saved! Your family can see this progress.':r.error||'The checked program missed this target. Keep experimenting—there is no retry penalty.');}
  catch(e){if(!checkAbort.signal.aborted)say((e as Error).message);}
  finally{await Promise.resolve(cancelPromise).catch(()=>{});checking=false;hooks.checking(false);q<HTMLButtonElement>('verify-cloud').disabled=!hooks.canEdit();q('stop-check').hidden=true;}
 };
 window.addEventListener('hashchange',()=>{readRecoveryLink();onboarding.readLink();if(retiredRecoveryLink||onboarding.hasLink()){render();if(!dialog('family-dialog').open)dialog('family-dialog').showModal();}});
 if(hosted)void refresh().catch(()=>{render();}).finally(()=>{if((retiredRecoveryLink||onboarding.hasLink())&&!dialog('family-dialog').open)dialog('family-dialog').showModal();});else render();
 return {record:async(a:Attempt)=>{if(!family)return;const who=identity;try{await request('/attempt',a);if(who===identity)await refresh();}catch(e){say(`Experiment was not synced: ${(e as Error).message}`);}},isChecking:()=>checking};
}
