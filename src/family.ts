import {curriculum} from './curriculum.ts';
import {lessonTargets,targetLesson,draftKey,type LessonId} from './model.ts';
type Language='python'|'java';
type Draft={source:string;revision:number};
type Attempt={id:string;source:string;language:Language;target:string;outcome:string;seconds:number|null;error?:string;verified?:boolean;at?:string};
type Family={recoveryEmail?:string|null;recoveryEnabled?:boolean;profile:{id:string;name:string;role:string};drafts:Partial<Record<string,Draft>>;history:Attempt[];students:{id:string;name:string;completed:string[];experiments:number}[];completed:string[]};
type Hooks={draft:()=>{source:string;language:Language;target:string;lesson:LessonId};lesson:()=>LessonId;openLesson:(lesson:LessonId,target?:string)=>void;draftFor:(language:Language,lesson?:LessonId)=>string;load:(language:Language,source:string,lesson?:LessonId,target?:string)=>void;profile:(id:string|null,drafts:Family['drafts'])=>void;stop:()=>void};
const hosted=import.meta.env.VITE_HOSTED==='1';
const escape=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
export function attachFamily(hooks:Hooks){
 let family:Family|null=null,checking=false,identity=0,conflictLanguage:Language|undefined,conflictLesson:LessonId|undefined;
 type Setup={name:string;key:string};
 const setupStorage='robolab-pending-family-setup';
 type RecoveryLink={mode:'verify-email'|'recover-family';token:string;key:string};
 let recoveryLink:RecoveryLink|undefined;
 const recoveryStorage='robolab-recovery-link';
 const freshKey=()=>btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24)))).replace(/\+/g,'-').replace(/\//g,'_');
 function readRecoveryLink(){
  try{const saved=JSON.parse(sessionStorage.getItem(recoveryStorage)||'null');if(saved&&['verify-email','recover-family'].includes(saved.mode)&&typeof saved.token==='string'&&typeof saved.key==='string')recoveryLink=saved;}catch{}
  const match=location.hash.match(/^#(verify-email|recover-family)=([A-Za-z0-9_.-]+)$/);
  if(match){
   recoveryLink={mode:match[1] as RecoveryLink['mode'],token:match[2],key:recoveryLink?.token===match[2]?recoveryLink.key:freshKey()};
   try{sessionStorage.setItem(recoveryStorage,JSON.stringify(recoveryLink));}catch{}
   history.replaceState(null,'',location.pathname+location.search);
  }
 }
 readRecoveryLink();
 function clearRecovery(){recoveryLink=undefined;try{sessionStorage.removeItem(recoveryStorage);}catch{}}
 let pendingSetup:Setup|undefined,parentCode='',studentCode='',creating=false;
 try{const saved=JSON.parse(sessionStorage.getItem(setupStorage)||'null');if(saved&&typeof saved.name==='string'&&/^[A-Za-z0-9_-]{32}$/.test(saved.key))pendingSetup=saved;}catch{/* Setup still works when browser storage is unavailable. */}
 function keepSetup(value:Setup|undefined){pendingSetup=value;try{if(value)sessionStorage.setItem(setupStorage,JSON.stringify(value));else sessionStorage.removeItem(setupStorage);}catch{/* Keep the retry credential in memory for this page. */}}

 const shell=document.createElement('div');shell.innerHTML=`
 <nav class="learning-nav" aria-label="Learning and family"><button id="curriculum-open">Curriculum & unlocks</button><button id="family-open">Family & progress</button><span id="profile-label">Guest practice</span></nav>
 <dialog id="curriculum-dialog" class="learning-dialog"><div class="dialog-heading"><h2>Your robotics curriculum</h2><button data-close aria-label="Close curriculum">Close ✕</button></div><p>16 core sessions, about an hour each, plus 4 optional extensions. Missions 1 and 2 are available for practice. Checked Mission 2 completion unlocks after all three Mission 1 rescues. More missions become playable as they are built and their prerequisites are met.</p><div id="curriculum-list" class="curriculum-grid"></div><p>Completing a rescue shows that your program worked. Explain why it worked and how a real robot could use it to check your understanding.</p></dialog>
 <dialog id="family-dialog" class="learning-dialog"><div class="dialog-heading"><h2>Family & progress</h2><button data-close aria-label="Close family progress">Close ✕</button></div><p>Take separate turns on the same missions and share family progress. Experiment freely: retries and help never cost points.</p><section id="email-verification-notice" class="verification-notice" role="status" aria-live="polite" aria-atomic="true" hidden></section><p id="family-message" role="status" aria-live="polite"></p><div id="recovery-flow"></div><div id="setup-receipt"></div><div id="family-content"></div></dialog>`;
 document.querySelector('.intro')!.before(shell);
 const q=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
 const dialog=(id:string)=>q<HTMLDialogElement>(id);
 shell.querySelectorAll<HTMLButtonElement>('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog')!.close());
 q('curriculum-open').onclick=()=>{renderCurriculum();dialog('curriculum-dialog').showModal();};
 q('family-open').onclick=()=>{render();dialog('family-dialog').showModal();};
 const toolbar=document.createElement('section');toolbar.className='family-tools';toolbar.hidden=!hosted;
 toolbar.innerHTML='<div><strong>Keep your progress</strong><p id="save-help">Sign in to save code and share checked rescues with your family.</p></div><button id="save-cloud">Save draft</button><button id="verify-cloud">Check & save progress</button><button id="stop-check" hidden>Stop check</button><button id="resolve-conflict" hidden>Compare saved versions</button>';
 document.querySelector('.practice-nav')!.after(toolbar);
 let checkAbort:AbortController|undefined,checkId='',cancelPromise:Promise<unknown>|undefined;
 async function stopCheck(){if(!checking||!checkAbort)return;checkAbort.abort();cancelPromise=request('/cancel',{id:checkId});const result=await cancelPromise as {completed:boolean};say(result.completed?'The check had already finished. Refresh progress to see its result.':'Check stopped. No completion was awarded.');}
 const say=(text:string)=>{q('family-message').textContent=text;q('save-help').textContent=text;};
 async function request(path:string,data?:unknown,signal?:AbortSignal){
  const response=await fetch('/api/family'+path,{method:data===undefined?'GET':'POST',headers:{...(data===undefined?{}:{'Content-Type':'application/json'}),...(family&&path!=='/login'?{'X-RoboLab-Profile':family.profile.id}:{})},credentials:'same-origin',body:data===undefined?undefined:JSON.stringify(data),signal});
  const result=await response.json();if(!response.ok){if(response.status===409&&path==='/draft')q('resolve-conflict').hidden=false;throw Error(result.error||'Family service unavailable. Your code stays in the editor.');}return result;
 }
 async function refresh(switchProfile=false){
  const before=identity;const next:Family=await request('');if(before!==identity)return;
  const changed=family?.profile.id!==next.profile.id;
  if(family&&!changed&&!switchProfile)next.drafts=family.drafts;
  if(family&&changed)parentCode='';
  family=next;
  if(changed)studentCode='';
  if(switchProfile||changed){identity++;hooks.profile(next.profile.id,next.drafts);}
  render();renderCurriculum();
 }
 function count(completed:string[],lesson:LessonId){return lessonTargets[lesson].filter(t=>completed.includes(t)).length;}
 function renderCurriculum(){
  q('curriculum-list').innerHTML=curriculum.map(([id,title,purpose,prereq],i)=>{
   const released=i<2,complete=released&&count(family?.completed??[],id as LessonId)===3,unlocked=i===0||count(family?.completed??[],'L01')===3;
   return `<article class="curriculum-card ${released?'released':''}"><span class="eyebrow">${id} ${i>=16?'· OPTIONAL':''}</span><h3>${escape(title)}</h3><p>${escape(purpose)}</p><p class="curriculum-state">${released?(complete?`✓ Mission ${i+1} complete`:unlocked?`Available · Mission ${i+1}`:'Practice available · checked completion locked'):'Coming soon'}</p><small>${released?(i===0?'Check all three rescue locations to complete this mission.':'Check Mission 1 first, then earn three checked recovery badges. Retries and hints are free.'):`Prerequisite: ${escape(prereq)}. This mission is not playable yet.`}</small>${released?`<button ${i===0?'id="revisit-mission"':''} data-lesson="${id}">Open Mission ${i+1} →</button>`:''}</article>`;
  }).join('');
  shell.querySelectorAll<HTMLButtonElement>('[data-lesson]').forEach(b=>b.onclick=()=>{hooks.openLesson(b.dataset.lesson as LessonId);dialog('curriculum-dialog').close();q('code').focus();});
 }
 // Codes are shown only to the parent who just generated them, never in progress data.
 function codeReceipt(container:HTMLElement,code:string,label:string,help:string){
  container.innerHTML=`<section class="code-receipt"><h3>${label}</h3><p>${help}</p><label>${label}<input class="generated-code" type="password" readonly autocomplete="off" spellcheck="false" aria-label="${label}"></label><div class="code-actions"><button type="button" data-copy>Copy code</button><button type="button" data-show aria-pressed="false">Show code</button></div><p class="copy-status" role="status"></p></section>`;
  const input=container.querySelector<HTMLInputElement>('input')!;input.value=code;
  const show=container.querySelector<HTMLButtonElement>('[data-show]')!;
  show.onclick=()=>{const visible=input.type==='password';input.type=visible?'text':'password';show.textContent=visible?'Hide code':'Show code';show.setAttribute('aria-pressed',String(visible));};
  container.querySelector<HTMLButtonElement>('[data-copy]')!.onclick=async()=>{
   const status=container.querySelector<HTMLElement>('.copy-status')!;
   try{await navigator.clipboard.writeText(code);status.textContent='Copied. Save it privately before leaving this page.';}
   catch{input.type='text';show.textContent='Hide code';show.setAttribute('aria-pressed','true');input.focus();input.select();status.textContent='Copy is unavailable here. The code is selected: use your device’s Copy command.';}
  };
 }
 function renderSetup(){
  const receipt=q('setup-receipt');receipt.replaceChildren();
  if(parentCode){
   codeReceipt(receipt,parentCode,'Parent access code','Your family is ready. Save this code in your password manager. It lets you return on another device and manage student access. Add and verify a recovery email below so you can replace a lost parent code.');
   const saved=document.createElement('button');saved.id='setup-saved';saved.textContent='I saved my code — add students';
   saved.onclick=()=>{parentCode='';keepSetup(undefined);render();q<HTMLInputElement>('student-name')?.focus();};receipt.append(saved);
  }else if(pendingSetup){
   receipt.innerHTML='<section class="code-receipt"><h3>Finish your family setup</h3><p>This tab has an unfinished setup. Resume it to retrieve the same parent code and keep the same family.</p><button id="setup-resume">Resume family setup</button></section>';
   q<HTMLButtonElement>('setup-resume').disabled=creating;q('setup-resume').onclick=()=>void create();
  }
 }
 async function create(){
  if(creating)return;
  if(!pendingSetup){
   const name=q<HTMLInputElement>('parent-name').value.trim();if(!name){say('Enter a parent nickname.');return;}
   const bytes=crypto.getRandomValues(new Uint8Array(24));
   keepSetup({name,key:btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_')});
  }
  creating=true;render();say('Creating your family…');
  try{const result=await request('/create',pendingSetup);parentCode=result.code;await refresh(true);say('Family created. Save your parent code, then add each student below.');}
  catch(e){say((e as Error).message);}
  finally{creating=false;render();q('setup-receipt').scrollIntoView({block:'nearest'});}
 }
 function renderVerificationNotice(){
  const notice=q('email-verification-notice');
  // Show only the server-confirmed address for this parent. A pending link must
  // not borrow a previous address's verified status, even if that link fails.
  const email=family?.profile.role==='parent'&&!recoveryLink?family.recoveryEmail:null;
  if(!email){notice.hidden=true;notice.replaceChildren();return;}
  // Keep an unchanged live region intact so ordinary re-renders do not announce it again.
  if(notice.querySelector('[data-verified-email]')?.textContent!==email){
   notice.innerHTML=`<span class="verification-icon" aria-hidden="true">✓</span><div><h3>Email verified</h3><p><strong data-verified-email>${escape(email)}</strong> is ready for parent account recovery. If you lose your parent code, choose “Lost your parent code?” to regain access.</p></div>`;
  }
  notice.hidden=false;
 }
 function renderRecovery(){
  const host=q('recovery-flow');host.replaceChildren();if(!recoveryLink)return;
  const isVerify=recoveryLink.mode==='verify-email';
  host.innerHTML=`<section class="code-receipt"><h3>${isVerify?'Verify parent recovery email':'Recover your family'}</h3><p>${isVerify?'Sign in with your current parent code, then confirm this email. This protects your family from an email being linked by someone else.':'Create a replacement parent code for the family linked to this email. Your old parent code and parent sessions will stop working. Student codes, drafts and progress will be kept.'}</p><button id="recovery-confirm" class="primary">${isVerify?'Verify email':'Create replacement parent code'}</button><button id="recovery-dismiss">Dismiss link</button></section>`;
  q<HTMLButtonElement>('recovery-confirm').disabled=isVerify&&family?.profile.role!=='parent';
  q('recovery-dismiss').onclick=()=>{clearRecovery();render();};
  q('recovery-confirm').onclick=async()=>{const link=recoveryLink;if(!link)return;const button=q<HTMLButtonElement>('recovery-confirm');button.disabled=true;
   try{await stopCheck();hooks.stop();if(isVerify){await request('/emailverify',{token:link.token});clearRecovery();await refresh();say('Recovery email verified. You can now recover a lost parent code by email.');q('email-verification-notice').scrollIntoView({block:'nearest'});}
   else{const result=await request('/recover',{token:link.token,key:link.key});parentCode=result.code;studentCode='';keepSetup(undefined);clearRecovery();await refresh(true);say('Parent access recovered. Save your new parent code. Your students and their progress are still here.');}}
   catch(e){say((e as Error).message);}finally{render();}
  };
 }
 function render(){
  renderVerificationNotice();renderRecovery();renderSetup();
  document.documentElement.dataset.profile=family?.profile.id??'';
  q('profile-label').textContent=family?`${family.profile.name} · private family`:'Guest practice';
  if(!hosted){q('family-content').innerHTML='<p>Family accounts are available on the hosted release. This local workshop keeps anonymous practice drafts on this device.</p>';return;}
  if(!family){
   q('family-content').innerHTML=`<div class="family-entry"><section><h3>Join your family</h3><p>Students: enter the code your parent gave you to continue your saved work on any device. Lost your student code? Ask your parent for a new one; your progress is kept.</p><form id="family-login"><label>Family access code<input id="access-code" type="password" autocomplete="off" maxlength="32" required></label><button class="primary">Sign in</button></form><details class="recovery-help"><summary>Lost your parent code?</summary><form id="family-forgot"><label>Verified parent email<input id="forgot-email" type="email" autocomplete="email" maxlength="254" required></label><button>Send recovery email</button></form><p>Recovery works after you verify an email in your parent account. Student codes come from your parent.</p></details></section>${pendingSetup?'':`<section><h3>New here? Create a family</h3><p>Parents: set up your family, then make a separate access code for each student. No child email is needed.</p><form id="family-create"><label>Parent nickname<input id="parent-name" maxlength="32" required placeholder="e.g. Parent" autocomplete="off"></label><button class="primary">Create family</button></form><small>You’ll receive a private parent code to save. No email or password is required.</small></section>`}</div><p>Python practice is available without signing in; hosted Java and shared progress require family access.</p>`;
   q<HTMLFormElement>('family-login').onsubmit=async e=>{e.preventDefault();try{await request('/login',{code:q<HTMLInputElement>('access-code').value.trim()});parentCode='';studentCode='';keepSetup(undefined);await refresh(true);say('Signed in. Saved progress belongs to this profile.');}catch(e){say((e as Error).message);}};
   q<HTMLFormElement>('family-forgot').onsubmit=async e=>{e.preventDefault();const button=q('family-forgot').querySelector<HTMLButtonElement>('button')!;button.disabled=true;try{const result=await request('/forgot',{email:q<HTMLInputElement>('forgot-email').value});say(result.message);}catch(e){say((e as Error).message);}finally{button.disabled=false;}};
   if(!pendingSetup)q<HTMLFormElement>('family-create').onsubmit=e=>{e.preventDefault();void create();};return;
  }
  q('family-content').innerHTML=`<div class="family-heading"><h3>${escape(family.profile.name)}</h3><button id="family-refresh">Refresh progress</button><button id="family-logout">Sign out</button></div>
  ${family.profile.role==='parent'?`<section class="recovery-settings"><h3>Parent recovery email</h3><p>${family.recoveryEmail?`Verified: <strong>${escape(family.recoveryEmail)}</strong>. Use “Lost your parent code?” on the sign-in screen to recover access.`:'Add an email now so losing your parent code does not lock you out of your family.'}</p>${family.recoveryEnabled?`<form id="parent-email"><label>Parent email<input id="recovery-email" type="email" autocomplete="email" maxlength="254" required></label><label>Current parent code<input id="recovery-parent-code" type="password" autocomplete="off" maxlength="32" required></label><button>Send verification email</button></form><p>Open the email while signed in as this parent and choose Verify email. Links last 15 minutes. Your current verified address stays active until a replacement is verified. No student email is needed.</p>`:'<p>Email recovery is not configured yet. Keep your parent code safe.</p>'}</section>`:''}
  <h3>Mission 1 · checked rescues</h3><p>${count(family.completed,'L01')} of 3 completed. ${count(family.completed,'L01')===3?'Mission 1 complete. Checked Mission 2 progress unlocked!':'Use Check & save progress after adapting your program.'}</p><ul class="rescue-checklist">${[['beacon','North ridge'],['farther','East lookout'],['reverse','Lower cove']].map(([id,name])=>`<li>${family!.completed.includes(id)?'✓':'○'} ${name}</li>`).join('')}</ul>
  <h3>Mission 2 · recovery badges</h3><p>${count(family.completed,'L02')} of 3 checked. ${count(family.completed,'L01')<3?'Complete checked Mission 1 to unlock these badges; practice is always available.':count(family.completed,'L02')===3?'Mission 2 complete. Mission 3 is coming soon.':'Read the sensor, choose a turn, then try the lower-cove transfer.'}</p><ul class="rescue-checklist">${[['sensor-left','Right-turn rescue'],['sensor-right','Left-turn rescue'],['sensor-transfer','Transfer rescue']].map(([id,name])=>`<li>${family!.completed.includes(id)?'✓':'○'} ${name}</li>`).join('')}</ul>
  <h3>Shared family results</h3><p>These are separate student attempts. Checked rescues are re-run on the server. Practice logs do not unlock missions. Competition rankings and live co-control are not part of this release.</p>
  <div class="family-results">${family.students.map(p=>`<article><strong>${escape(p.name)}</strong><span>${count(p.completed,'L01')}/3 checked rescues · Mission 2: ${count(p.completed,'L02')}/3 badges · ${p.experiments} experiments</span>${family!.profile.role==='parent'?`<button data-code="${p.id}">New access code</button><button data-revoke="${p.id}">Revoke access</button>`:''}</article>`).join('')||'<p>No student profiles yet.</p>'}</div>
  ${family.profile.role==='parent'?'<form id="add-student"><label>Student alias<input id="student-name" maxlength="32" required placeholder="Use a nickname"></label><button>Add student</button></form><p>Up to six students. Each code signs in only to its own profile. Generating a new code signs out that student’s older sessions.</p><div id="new-code"></div>':''}
  <h3>Recent experiments</h3><p>Last 12 saved experiments. Loading one saves your current draft first and never runs code automatically.</p><div class="experiment-list">${family.history.map((a,i)=>`<article><div><strong>${a.language==='java'?'Java':'Python'} · ${escape(a.target)}</strong><span>${escape(a.outcome)} · ${a.verified?'server checked':'practice log'}${a.seconds!==null?` · ${a.seconds.toFixed(2)} simulated seconds`:''}</span></div><button data-history="${i}">Load code</button></article>`).join('')||'<p>Your experiments will appear here after you Run.</p>'}</div>`;
  q('family-refresh').onclick=()=>void refresh().catch(e=>say(e.message));
  q('family-logout').onclick=async()=>{try{await stopCheck();hooks.stop();await request('/logout',{});identity++;family=null;parentCode='';studentCode='';hooks.profile(null,{});render();renderCurriculum();say('Signed out. Student drafts remain saved privately.');}catch(e){say((e as Error).message);}};
  if(family.profile.role==='parent'){
   if(family.recoveryEnabled)q<HTMLFormElement>('parent-email').onsubmit=async e=>{e.preventDefault();const button=q('parent-email').querySelector<HTMLButtonElement>('button')!;button.disabled=true;try{await request('/email',{email:q<HTMLInputElement>('recovery-email').value,code:q<HTMLInputElement>('recovery-parent-code').value.trim()});q<HTMLInputElement>('recovery-parent-code').value='';say('Verification email sent. Open its link while signed in as this parent, then choose Verify email.');}catch(e){say((e as Error).message);}finally{button.disabled=false;}};
   if(studentCode)codeReceipt(q('new-code'),studentCode,'Student access code','Share this code privately with the student. Each student signs in with their own code. A newly generated code replaces their previous one.');
   q<HTMLFormElement>('add-student').onsubmit=async e=>{e.preventDefault();const button=q('add-student').querySelector<HTMLButtonElement>('button')!;button.disabled=true;try{const r=await request('/students',{name:q<HTMLInputElement>('student-name').value});studentCode=r.code;await refresh();q('new-code').scrollIntoView({block:'nearest'});}catch(e){say((e as Error).message);}finally{button.disabled=false;}};
   shell.querySelectorAll<HTMLButtonElement>('[data-code],[data-revoke]').forEach(b=>b.onclick=async()=>{const revoke=!!b.dataset.revoke;if(revoke&&!confirm('Revoke this student’s sign-in access? Their saved work will be retained.'))return;try{const r=await request('/access',{id:b.dataset.code??b.dataset.revoke,revoke});studentCode=r.code??'';await refresh();if(r.code)q('new-code').scrollIntoView({block:'nearest'});else say('Student access revoked.');}catch(e){say((e as Error).message);}});
  }
  shell.querySelectorAll<HTMLButtonElement>('[data-history]').forEach(b=>b.onclick=async()=>{if(checking){say('Stop the progress check before loading code.');return;}const a=family!.history[Number(b.dataset.history)],who=identity,id=targetLesson(a.target),before=hooks.draft();try{await save();if(a.language!==hooks.draft().language||id!==hooks.lesson())await save(a.language,id);if(who!==identity)return;const now=hooks.draft();if(now.source!==before.source||now.language!==before.language||now.lesson!==before.lesson){say('Your draft changed while saving. It is safe; load the experiment again when ready.');return;}hooks.stop();hooks.load(a.language,a.source,id,a.target);dialog('family-dialog').close();say('Earlier code loaded. Your previous draft was saved first. Run when you are ready.');}catch(e){say((e as Error).message);}});
 }
 async function save(destination?:Language,destinationLesson=hooks.lesson()){
  if(!family){render();dialog('family-dialog').showModal();throw Error('Sign in to save a private draft.');}
  const current=hooks.draft();if(destination){current.language=destination;current.lesson=destinationLesson;current.source=hooks.draftFor(destination,destinationLesson);}conflictLanguage=current.language;conflictLesson=current.lesson;const key=draftKey(current.lesson,current.language),revision=family.drafts[key]?.revision??0,who=identity;
  const saved:Draft=await request('/draft',{...current,revision});
  if(who!==identity)return;
  family.drafts[key]=saved;q('resolve-conflict').hidden=true;say('Draft saved to your profile. You can continue on another device.');
 }
 q('resolve-conflict').onclick=async()=>{
  if(!family)return;const who=identity,currentDraft=hooks.draft();if(conflictLanguage){currentDraft.language=conflictLanguage;currentDraft.lesson=conflictLesson??currentDraft.lesson;currentDraft.source=hooks.draftFor(conflictLanguage,currentDraft.lesson);}
  try{
   const latest:Family=await request('');if(who!==identity)return;
   const key=draftKey(currentDraft.lesson,currentDraft.language),cloud=latest.drafts[key];if(!cloud){say('No saved draft found. Keep your editor and try again.');return;}
   const compare=document.createElement('dialog');compare.className='learning-dialog';
   compare.innerHTML='<div class="dialog-heading"><h2>Choose which draft to keep</h2><button id="conflict-cancel">Cancel</button></div><p>Another tab saved a newer version. Compare before replacing either version.</p><label>Your editor<textarea id="conflict-editor" readonly rows="8"></textarea></label><label>Saved on the server<textarea id="conflict-cloud" readonly rows="8"></textarea></label><div class="learning-nav"><button id="conflict-save">Keep editor & replace saved draft</button><button id="conflict-load">Use saved draft</button></div>';
   document.body.append(compare);q<HTMLTextAreaElement>('conflict-editor').value=currentDraft.source;q<HTMLTextAreaElement>('conflict-cloud').value=cloud.source;
   const close=()=>{compare.close();compare.remove();};q('conflict-cancel').onclick=close;
   q('conflict-save').onclick=async()=>{try{if(who!==identity)return close();const saved=await request('/draft',{...currentDraft,revision:cloud.revision});family!.drafts[key]=saved;q('resolve-conflict').hidden=true;close();say('Your chosen editor version is saved.');}catch(e){close();say((e as Error).message);}};
   q('conflict-load').onclick=()=>{if(who!==identity)return close();if(checking){say('Stop the progress check before loading code.');return;}if(hooks.draftFor(currentDraft.language,currentDraft.lesson)!==currentDraft.source){close();say('Your draft changed while comparing. Compare again to protect your latest edits.');return;}family!.drafts[key]=cloud;hooks.load(currentDraft.language,cloud.source,currentDraft.lesson);q('resolve-conflict').hidden=true;close();say('Saved version loaded.');};
   compare.showModal();
  }catch(e){say((e as Error).message);}
 };
 q('save-cloud').onclick=()=>void save().catch(e=>say(e.message));
 q('stop-check').onclick=()=>void stopCheck().catch(e=>say(e.message));
 q('verify-cloud').onclick=async()=>{
  if(checking)return;if(!family){render();dialog('family-dialog').showModal();return;}
  hooks.stop();const draft=hooks.draft(),who=identity;checking=true;checkId=crypto.randomUUID();cancelPromise=undefined;checkAbort=new AbortController();
  q<HTMLButtonElement>('verify-cloud').disabled=true;q('stop-check').hidden=false;say('Checking your actual program in an isolated server runtime…');
  try{const r=await request('/verify',{...draft,id:checkId},checkAbort.signal);if(who!==identity)return;await refresh();say(r.outcome==='reached'?'Rescue checked and saved! Your family can see this progress.':r.error||'The checked program missed this target. Keep experimenting—there is no retry penalty.');}
  catch(e){if(!checkAbort.signal.aborted)say((e as Error).message);}
  finally{await Promise.resolve(cancelPromise).catch(()=>{});checking=false;q<HTMLButtonElement>('verify-cloud').disabled=false;q('stop-check').hidden=true;}
 };
 window.addEventListener('hashchange',()=>{readRecoveryLink();if(recoveryLink){render();if(!dialog('family-dialog').open)dialog('family-dialog').showModal();}});
 if(hosted)void refresh().catch(()=>{render();}).finally(()=>{if(recoveryLink&&!dialog('family-dialog').open)dialog('family-dialog').showModal();});else render();
 return {record:async(a:Attempt)=>{if(!family)return;const who=identity;try{await request('/attempt',a);if(who===identity)await refresh();}catch(e){say(`Experiment was not synced: ${(e as Error).message}`);}},isChecking:()=>checking};
}
