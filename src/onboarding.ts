type Card={id:string;name:string;code:string};
type Mail={id:string;kind:string;status:string};
export type OnboardingFamily={emailLogin?:boolean;recoveryEmail?:string|null;profile:{id:string;name:string;role:string};students:{id:string;name:string}[];notifyFirst?:boolean;onboardingMail?:Mail[];studentSignIns?:Record<string,string>};
type Options={request:(path:string,data?:unknown)=>Promise<any>;refresh:()=>Promise<void>;signIn:(code:string)=>Promise<void>;say:(text:string)=>void;render:()=>void;close:()=>void};
const esc=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const key=()=>btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24)))).replace(/\+/g,'-').replace(/\//g,'_');
const read=(name:string)=>{try{return JSON.parse(sessionStorage.getItem(name)||'null');}catch{return null;}};
const keep=(name:string,value:unknown)=>{try{value?sessionStorage.setItem(name,JSON.stringify(value)):sessionStorage.removeItem(name);}catch{}};
export function attachOnboarding(o:Options){
 type Challenge={key:string;email:string;expiresAt?:number;resendAt?:number};
 let challenge:Challenge|null=read('robolab-email-challenge'),families:{id:string;name:string;students:string[]}[]|null=null;
 let mode:'parent'|'student'='parent',busy=false,names=[''],cards:Card[]=[],eventId='',timer:ReturnType<typeof setInterval>|undefined;
 let cardOwner='',batch:{id:string;names:string[];owner:string}|null=read('robolab-student-batch');
 let replacement:{id:string;studentId:string;owner:string}|null=read('robolab-student-replacement');
 let studentLink:string|null=read('robolab-student-link');
 function readLink(){const match=location.hash.match(/^#student-login=([A-Za-z0-9_-]{32})$/);if(match){studentLink=match[1];keep('robolab-student-link',studentLink);history.replaceState(null,'',location.pathname+location.search);}}
 readLink();
 const field=<T extends HTMLElement=HTMLElement>(host:HTMLElement,selector:string)=>host.querySelector<T>(selector)!;
 async function act(button:HTMLButtonElement,run:()=>Promise<void>){if(busy)return;busy=true;button.disabled=true;try{await run();}catch(e){o.say((e as Error).message);}finally{busy=false;button.disabled=false;}}
 function clearAuth(){challenge=null;families=null;keep('robolab-email-challenge',null);}
 function clearCards(){cards=[];eventId='';batch=null;replacement=null;names=[''];keep('robolab-student-batch',null);keep('robolab-student-replacement',null);}
 async function finish(data:unknown){await o.request('/authfinish',data);clearAuth();await o.refresh();o.say('Email verified. You’re signed in. Add student nicknames to get their login cards.');}
 function entry(host:HTMLElement,legacy:HTMLElement){
  if(timer)clearInterval(timer);
  host.innerHTML=`<div class="account-tabs" role="group" aria-label="Choose who is signing in"><button data-mode="parent" aria-pressed="${mode==='parent'}">Parent</button><button data-mode="student" aria-pressed="${mode==='student'}">Student</button></div><div id="parent-entry"></div>`;
  legacy.hidden=mode!=='student';
  host.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode as typeof mode;o.render();});
  const panel=field(host,'#parent-entry');panel.hidden=mode!=='parent';
  if(families){
   panel.innerHTML=families.length?`<h3>Choose your family</h3><p>Your email is verified. Continue where you left off.</p>${families.map(f=>`<button data-family="${esc(f.id)}">${esc(f.name)} · ${esc(f.students.join(', ')||'No students yet')}</button>`).join('')}`:'<h3>Email verified — create your family</h3><p>Next, add student nicknames. Each child gets a private login, with no email or password needed.</p><button id="email-create" class="primary">Create family</button><button id="old-family">I already have a parent code</button>';
   panel.querySelectorAll<HTMLButtonElement>('[data-family]').forEach(b=>b.onclick=()=>void act(b,()=>finish({key:challenge!.key,familyId:b.dataset.family})));
   const create=panel.querySelector<HTMLButtonElement>('#email-create');if(create)create.onclick=()=>void act(create,()=>finish({key:challenge!.key,create:true}));
   const old=panel.querySelector<HTMLButtonElement>('#old-family');if(old)old.onclick=()=>{mode='student';o.render();};return;
  }
  if(challenge?.expiresAt){
   panel.innerHTML=`<h3>Check your email</h3><p>We sent a sign-in code to <strong>${esc(challenge.email)}</strong>. Check spam if it hasn’t arrived. Enter it here within 10 minutes.</p><form id="parent-verify"><label>Six-digit sign-in code<input id="email-code" autocomplete="one-time-code" inputmode="numeric" pattern="[0-9]{6}" minlength="6" maxlength="6" required></label><button class="primary">Continue</button></form><div class="code-actions"><button id="email-resend">Resend code</button><button id="email-change">Change email / start again</button></div><p id="email-countdown" role="status"></p>`;
   field<HTMLFormElement>(panel,'form').onsubmit=e=>{e.preventDefault();const code=field<HTMLInputElement>(panel,'#email-code').value.trim();void act(field(panel,'form button'),async()=>{const r=await o.request('/authverify',{key:challenge!.key,code});families=r.families;if(families!.length===1)await finish({key:challenge!.key,familyId:families![0].id});else{o.render();o.say('Email verified.');}});};
   const countdown=()=>{if(!challenge)return;const seconds=Math.max(0,Math.ceil(((challenge.resendAt??0)-Date.now())/1000));field<HTMLButtonElement>(panel,'#email-resend').disabled=busy||seconds>0;field(panel,'#email-countdown').textContent=challenge.expiresAt!<=Date.now()?'Code expired. Choose Start again to get a new code.':seconds?`Resend available in ${seconds}s.`:'You can resend if needed.';};countdown();timer=setInterval(countdown,1000);
   field<HTMLButtonElement>(panel,'#email-resend').onclick=e=>void act(e.currentTarget as HTMLButtonElement,async()=>{const r=await o.request('/authstart',{...challenge,resend:true});challenge={...challenge!,...r,expiresAt:Date.now()+r.expiresAt-r.serverNow,resendAt:Date.now()+r.resendAt-r.serverNow};keep('robolab-email-challenge',challenge);o.render();o.say('Sign-in code resent. Its original 10-minute expiry still applies.');});
   field(panel,'#email-change').onclick=()=>{clearAuth();o.render();};
   queueMicrotask(()=>field<HTMLInputElement>(panel,'#email-code').focus());return;
  }
  panel.innerHTML='<h3>Save progress for your family</h3><p>New or returning parent? Start with your email. We’ll send a short sign-in code — no password to remember.</p><form id="parent-signin"><label>Parent email<input id="parent-signin-email" type="email" autocomplete="email" maxlength="254" required placeholder="you@example.com"></label><button class="primary">Continue with email</button></form><p>Students don’t need an email address. Their private login cards come next.</p>';
  if(challenge)field<HTMLInputElement>(panel,'input').value=challenge.email;
  field<HTMLFormElement>(panel,'form').onsubmit=e=>{e.preventDefault();void act(field(panel,'button'),async()=>{const email=field<HTMLInputElement>(panel,'input').value.trim();if(!challenge||challenge.email!==email)challenge={key:key(),email};keep('robolab-email-challenge',challenge);const r=await o.request('/authstart',challenge);challenge={...challenge!,...r,expiresAt:Date.now()+r.expiresAt-r.serverNow,resendAt:Date.now()+r.resendAt-r.serverNow};keep('robolab-email-challenge',challenge);o.render();o.say('Sign-in email sent.');});};
 }
 function link(host:HTMLElement,family:OnboardingFamily|null){
  host.replaceChildren();if(!studentLink)return;
  host.innerHTML=`<section class="code-receipt"><h3>Your student login is ready</h3><p>${family?'This will switch from '+esc(family.profile.name)+'. We’ll save the current draft first.':'Choose Start learning to sign in and load your saved work.'}</p><button id="student-start" class="primary">Start learning</button><button id="student-dismiss">Dismiss link</button></section>`;
  field(host,'#student-dismiss').onclick=()=>{studentLink=null;keep('robolab-student-link',null);o.render();};
  field<HTMLButtonElement>(host,'#student-start').onclick=e=>void act(e.currentTarget as HTMLButtonElement,async()=>{await o.signIn(studentLink!);studentLink=null;keep('robolab-student-link',null);clearAuth();clearCards();o.render();o.close();});
 }
 function parent(host:HTMLElement,family:OnboardingFamily){
  if(cardOwner&&cardOwner!==family.profile.id||batch&&batch.owner!==family.profile.id||replacement&&replacement.owner!==family.profile.id)clearCards();cardOwner=family.profile.id;
  const remaining=6-family.students.length;
  host.innerHTML=`<section class="student-onboarding"><h3>Student logins</h3><p>Add a nickname, then share a private login link or card. Students return with that same code to continue their saved work.</p><div id="student-cards"></div>${remaining>0?`${family.students.length&&!batch?'<details><summary>Add more students</summary>':''}<form id="student-batch"><div id="nickname-rows"></div><button type="button" id="another-student">Add another student</button><p>We’ll email these new logins together to your verified parent address. Keep the email private.</p><button class="primary" id="create-student-logins">${batch?'Resume student setup':'Create student logins'}</button></form>${family.students.length&&!batch?'</details>':''}`:'<p>All six student spaces are in use.</p>'}<label class="notification-choice"><input id="first-signin-choice" type="checkbox" ${family.notifyFirst!==false?'checked':''}>Email me once when each new student first signs in</label><small>Future sign-ins and lesson activity stay quiet.</small><div class="onboarding-mail"></div></section>`;
  if(remaining>0){
   if(batch)names=[...batch.names];names=names.slice(0,remaining);
   const rows=()=>{field(host,'#nickname-rows').innerHTML=names.map((name,i)=>`<label>Student ${i+1} nickname<input data-name="${i}" value="${esc(name)}" maxlength="32" required autocomplete="off" placeholder="e.g. Pilot"></label>`).join('');host.querySelectorAll<HTMLInputElement>('[data-name]').forEach(input=>input.oninput=()=>{names[Number(input.dataset.name)]=input.value;});field<HTMLButtonElement>(host,'#another-student').disabled=names.length>=remaining||!!batch;};rows();
   field(host,'#another-student').onclick=()=>{names.push('');rows();host.querySelectorAll<HTMLInputElement>('[data-name]').item(names.length-1).focus();};
   field<HTMLFormElement>(host,'form').onsubmit=e=>{e.preventDefault();void act(field(host,'#create-student-logins'),async()=>{batch??={owner:family.profile.id,id:crypto.randomUUID(),names:names.map(n=>n.trim())};keep('robolab-student-batch',batch);const result=await o.request('/studentbatch',batch);cards=result.cards;eventId=result.eventId;batch=null;keep('robolab-student-batch',null);names=[''];await o.refresh();o.say('Student logins are ready. Copy or print their cards now; email delivery is shown below.');});};
  }
  field<HTMLInputElement>(host,'#first-signin-choice').onchange=e=>void act(e.currentTarget as unknown as HTMLButtonElement,async()=>{await o.request('/notifications',{notifyFirst:(e.target as HTMLInputElement).checked});await o.refresh();o.say('Email preference saved.');});
  const mailHost=field(host,'.onboarding-mail');
  const labels:Record<string,string>={pending:'Email pending',sending:'Email pending',retry:'Email needs retry',sent:'Email sent',cancelled:'Email cancelled — access or preferences changed',expired:'Email expired — generate a new login if needed'};
  function mailStatus(rows:Mail[]){
  mailHost.innerHTML=rows.map(m=>`<p>${m.kind==='first'?'First-sign-in confirmation':'Student login details'}: <strong>${labels[m.status]??'Email pending'}</strong>${m.status==='retry'?` <button data-mail-retry="${esc(m.id)}">Retry email</button>`:''}</p>`).join('');
  mailHost.querySelectorAll<HTMLButtonElement>('[data-mail-retry]').forEach(b=>b.onclick=()=>void act(b,async()=>{await o.request('/mailretry',{id:b.dataset.mailRetry});await o.refresh();}));
  }
  mailStatus(family.onboardingMail??[]);
  let polls=0;
  async function pollMail(){
   if(!mailHost.isConnected||!host.closest<HTMLDialogElement>('dialog')?.open||polls++>=20)return;
   try{const next:OnboardingFamily=await o.request('');if(next.profile.id!==family.profile.id)return;mailStatus(next.onboardingMail??[]);if(next.onboardingMail?.some(m=>['pending','sending'].includes(m.status)))setTimeout(()=>void pollMail(),3000);}catch{/* Manual Refresh remains available during an outage. */}
  }
  if(family.onboardingMail?.some(m=>['pending','sending'].includes(m.status)))setTimeout(()=>void pollMail(),3000);
  renderCards(field(host,'#student-cards'));
 }
 function renderCards(host:HTMLElement){
  host.replaceChildren();if(!cards.length)return;
  host.innerHTML='<h4>Ready to share</h4><p>These private cards are shown for this setup. Your email contains a copy.</p><div class="student-card-grid"></div><button id="print-student-cards">Print cards</button>';
  const grid=field(host,'.student-card-grid');
  for(const c of cards){const card=document.createElement('article');card.className='student-login-card';card.innerHTML=`<h4>${esc(c.name)}</h4><label>Private student code<input type="password" readonly autocomplete="off" aria-label="${esc(c.name)} student code"></label><div class="code-actions"><button data-copy-link>Copy login link</button><button data-copy-code>Copy code</button><button data-show>Show code</button></div><p class="copy-status" role="status"></p><button data-start>Let this student start here</button>`;const input=field<HTMLInputElement>(card,'input');input.value=c.code;
   const show=field<HTMLButtonElement>(card,'[data-show]');show.onclick=()=>{input.value=c.code;input.type=input.type==='password'?'text':'password';show.textContent=input.type==='password'?'Show code':'Hide code';};
   const copy=async(value:string)=>{try{await navigator.clipboard.writeText(value);field(card,'.copy-status').textContent='Copied. Share privately with this student.';}catch{input.type='text';input.value=value;input.focus();input.select();field(card,'.copy-status').textContent='Copy is unavailable. The text is selected: use your device’s Copy command.';}};
   field(card,'[data-copy-link]').onclick=()=>void copy(`${location.origin}/#student-login=${c.code}`);field(card,'[data-copy-code]').onclick=()=>void copy(c.code);
   field<HTMLButtonElement>(card,'[data-start]').onclick=e=>void act(e.currentTarget as HTMLButtonElement,async()=>{await o.signIn(c.code);clearCards();o.close();});grid.append(card);
  }
  field(host,'#print-student-cards').onclick=()=>{
   const print=document.createElement('section');print.id='login-card-print';print.innerHTML=`<h1>RoboLab student logins</h1>${cards.map(c=>`<article><h2>${esc(c.name)}</h2><p>Open ${esc(location.origin)} and choose Student.</p><p>Student code: <strong>${esc(c.code)}</strong></p><p>Keep this card private. Use the same code next time to continue your progress.</p></article>`).join('')}`;document.body.append(print);document.body.classList.add('printing-login-cards');try{window.print();}finally{print.remove();document.body.classList.remove('printing-login-cards');}
  };
 }
 async function replace(studentId:string){
  if(!replacement&&!confirm('Create and email a replacement student code? Their old code and sessions will stop working. Saved work is kept.'))return;
  if(replacement&&replacement.studentId!==studentId)throw Error('Finish the pending code replacement first.');
  replacement??={owner:cardOwner,id:crypto.randomUUID(),studentId};keep('robolab-student-replacement',replacement);
  const result=await o.request('/studentreplace',replacement);cards=result.cards;eventId=result.eventId;replacement=null;keep('robolab-student-replacement',null);await o.refresh();o.say('Replacement login ready. Saved work is kept.');
 }
 return {entry,link,parent,replace,readLink,hasLink:()=>!!studentLink,clear:()=>{clearAuth();clearCards();},eventId:()=>eventId};
}
