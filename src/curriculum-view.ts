import {curriculum} from './curriculum.ts';
import {lessonIds, lessonTargets, type LessonId} from './model.ts';
import './curriculum.css';
import {missionAccess} from './progression.ts';

type CurriculumId = typeof curriculum[number][0];
type Preview = {job:string;skill:string;caption:string;alt:string;kind:'scene'|'concept'};

// Previews describe the task, never a solution or evidence of student completion.
export const previews = {
 L01:{job:'A crew is waiting on the ridge. Turn and tilt the searchlight so rescuers can find them.',skill:'Values, motor power & servo angles',caption:'Bring the pickup point into the light.',alt:'The rescue searchlight aimed upward at a crew on a lit ridge platform.',kind:'scene'},
 L02:{job:'The light has drifted off target. Read its direction and make your code choose a correction.',skill:'Sensor readings & if/else',caption:'Which way should the light turn?',alt:'The searchlight pointing past the waiting crew before a direction correction.',kind:'scene'},
 L03:{job:'The rangers need their route checked. Move, stop and hold the beam at every checkpoint.',skill:'Loops & repeating a sequence',caption:'One light. Several checkpoints.',alt:'The searchlight beside three numbered patrol checkpoints, with its beam on the first.',kind:'scene'},
 L04:{job:'A worker needs a parcel. Coordinate two arm joints and a gripper to make the handoff.',skill:'Coordinating joints & grip',caption:'Pick up. Move. Release into the tray.',alt:'The Parcel Port arm model with its gripper, parcel, guard and receiving tray beside the dispatch worker.',kind:'scene'},
 L05:{job:'Two bays need deliveries. Write one handoff function and give it a different destination each time.',skill:'Functions & destination parameters',caption:'One reusable handoff. Different destinations.',alt:'An arm with repeated handoff arrows toward two separately labeled receiving bays.',kind:'concept'},
 L06:{job:'The receiving tray has moved. Find out why the old program misses, then adapt it to the new job.',skill:'Predicting, testing & debugging',caption:'A changed job needs a new experiment.',alt:'An arm beside the old tray position and a clearly marked new tray position.',kind:'concept'},
 R01:{job:'The dock team needs a battery. Coordinate the rover’s two wheel motors to deliver it and stop.',skill:'Two-wheel coordination',caption:'Your first rover delivery.',alt:'A two-wheel rover carrying a battery toward a labeled delivery dock.',kind:'concept'},
 R01b:{job:'A loading bay is off to the side. Read the rover’s heading, turn toward it and stop facing the bay.',skill:'Heading feedback & bounded while loops',caption:'Measure the turn as you go.',alt:'A rover with a curved heading arrow pointing toward a side loading bay.',kind:'concept'},
 R02:{job:'Bring supplies within reach of the waiting person. Read distance to stop with a safe gap.',skill:'Distance feedback & stopping',caption:'Close enough to help. Room to stop.',alt:'A rover facing a person, with a distance ray and a marked stopping gap.',kind:'concept'},
 R03:{job:'Several stations need supplies. Put the route steps in a list and send the rover on its delivery round.',skill:'Lists, arrays & reusable movement',caption:'Turn a route into data.',alt:'A rover route connecting three numbered delivery stations in order.',kind:'concept'},
 R04:{job:'The rover’s reading is misleading or missing. Diagnose the problem and bring it to a controlled stop.',skill:'Units, sensor validity & safe recovery',caption:'A missing reading is not a clear path.',alt:'A stopped rover before a barrier, with an unavailable sensor reading shown as a question mark.',kind:'concept'},
 C01:{job:'The relief station needs its supplies unloaded. Dock the rover, then coordinate the arm’s handoff.',skill:'Phases & coordinating two machines',caption:'Arrive, stop, then unload.',alt:'A stopped rover docked beside an arm that moves a parcel into a relief-station tray.',kind:'concept'},
 P01:{job:'The rover must stop at an inspection strip. Compare light readings and choose a useful threshold.',skill:'Brightness samples & calibration',caption:'Learn what bright looks like here.',alt:'A downward rover light sensor above dark floor and a bright inspection strip, with two labeled samples.',kind:'concept'},
 P02:{job:'A supply label tells the team where a parcel belongs. Read its red, green and blue values—or report unknown.',skill:'RGB classification & unknown readings',caption:'Use the readings to identify the label.',alt:'A parcel color sensor with red, green and blue sample bars plus a question-mark label for an unknown sample.',kind:'concept'},
 C02:{job:'Relief parcels are arriving with different labels. Read each label, then use the arm to sort the supplies.',skill:'Combining classification & handoff',caption:'Read the label. Choose the right bay.',alt:'An arm sorting parcels into bays labeled A and B, with an unknown-label holding area.',kind:'concept'},
 C03:{job:'Guide supplies along a marked route. Watch for obstacles and finish at the matching dock.',skill:'Sensor priorities & combined control',caption:'Follow the route, but know when to stop.',alt:'A rover beside a bright route, an obstacle and a labeled destination dock.',kind:'concept'},
 V01:{job:'Find the marked inspection area in a small camera image. Use the pixels to explain where it is.',skill:'Image grids, rows & columns',caption:'A camera image is a grid of samples.',alt:'A robot-mounted camera beside a pixel grid containing a distinct marked region.',kind:'concept'},
 V02:{job:'Move the rover beneath an inspection marker. Combine its image position with distance to line up and stop.',skill:'Image position & distance feedback',caption:'Line up using the camera’s view.',alt:'A rover approaching an overhead marker, with image-center and marker-offset guides.',kind:'concept'},
 F01:{job:'A science team needs its instrument back intact. Adjust thrust to slow the capsule before touchdown.',skill:'Thrust, velocity & gentle landing',caption:'Slow the descent before reaching the pad.',alt:'A capsule above a landing pad, with separate downward velocity and upward thrust arrows.',kind:'concept'},
 F02:{job:'Send the capsule to a measurement band, hold it there for a reading, then bring the instrument home.',skill:'Launch, measurement & return phases',caption:'The job ends with a gentle return.',alt:'A vertical capsule mission showing ascent, a measurement band and descent to the landing pad.',kind:'concept'},
} satisfies Record<CurriculumId, Preview>;

export const chapters = [
 {id:'searchlight',title:'Start at the Signal Station',label:'Searchlight',first:'L01',description:'One machine. Three new ways to control it.'},
 {id:'arm',title:'A hand with the heavy lifting',label:'Robotic arm',first:'L04',description:'Coordinate a handoff, then make it reusable.'},
 {id:'rover',title:'Send the rescue rover',label:'Rescue rover',first:'R01',description:'Take your code from the workbench to the delivery route.'},
 {id:'combined',title:'Read the world. Bring it together.',label:'Sensors & combined missions',first:'C01',description:'Combine familiar machines, then add new ways to sense.'},
 {id:'optional',title:'Explore a little further',label:'Optional extensions',first:'V01',description:'Try camera-guided missions or a one-axis science capsule.'},
] as const;

const escape = (s:string) => s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const titleFor = (id:string) => curriculum.find(row=>row[0]===id)?.[1] ?? id;

export function curriculumHeader() {
 return `<div class="curriculum-heading"><span class="eyebrow">YOUR ROBOTICS CURRICULUM</span><button data-close aria-label="Close curriculum" autofocus>Close ✕</button></div>
 <div class="curriculum-intro"><h2 id="curriculum-title">Give your code a mission.</h2><p class="curriculum-summary">16 core lessons · 4 optional extensions · ${lessonIds.length} playable now in Python + Java</p></div>
 <nav class="curriculum-chapters" aria-label="Curriculum chapters">${chapters.map(c=>`<a href="#curriculum-${c.id}" data-chapter="${c.id}">${c.label}</a>`).join('')}</nav>
 <div id="curriculum-list"></div><p class="curriculum-footer">Finish all 3 challenges to unlock the next mission. Successful runs save progress automatically when signed in. Locked missions have read-only previews; retries and hints are free. A successful run shows that your program worked; explaining why and adapting it checks your understanding.</p>
 <p class="curriculum-footer">Plan for about an hour per lesson, with pause and resume when needed. This is a pacing goal to test in class, not a time limit. Concept diagrams show planned missions; their design may change.</p>`;
}

export function curriculumRows(completed:readonly string[]) {
 return chapters.map((chapter,index)=>{
  const start=curriculum.findIndex(row=>row[0]===chapter.first);
  const end=index+1<chapters.length?curriculum.findIndex(row=>row[0]===chapters[index+1].first):curriculum.length;
  return `<section class="curriculum-chapter" aria-labelledby="curriculum-${chapter.id}"><div class="curriculum-chapter-heading"><h3 id="curriculum-${chapter.id}" tabindex="-1">${chapter.title}</h3><p>${chapter.description}</p></div><div class="curriculum-grid">${curriculum.slice(start,end).map(([id,title,,prereq],offset)=>{
   const i=start+offset, preview=previews[id], optional=chapter.id==='optional';
   const released=lessonIds.includes(id as LessonId), lesson=id as LessonId;
   const access=released?missionAccess(lesson,completed):undefined;
   const complete=access?.complete, missing=access?.required;
   const state=released?(complete?`✓ Mission ${i+1} complete`:!missing?`Available · Mission ${i+1}`:'Locked · read-only preview'):'Coming soon';
   const detail=released?(complete?'All checked challenges complete. Revisit and experiment freely.':missing?access!.message:`Check all ${lessonTargets[lesson].length} challenges to complete this mission. Retries and hints are free.`):`Planned after ${prereq.split(' + ').map(titleFor).join(' + ')}. This mission is not playable yet.`;
   return `<article class="curriculum-card ${released?'released':'upcoming'}" data-curriculum-id="${id}" aria-labelledby="curriculum-title-${id}">
    <figure class="curriculum-preview"><span class="preview-fallback">Preview unavailable</span><img src="/curriculum/${id}.${preview.kind==='scene'?'png':'svg'}" width="800" height="510" loading="${i===0?'eager':'lazy'}" decoding="async" alt="${escape(preview.alt)}"><span class="preview-kind">${preview.kind==='scene'?'MODEL PREVIEW':'CONCEPT DIAGRAM · PLANNED MISSION'}</span><figcaption>${escape(preview.caption)}</figcaption></figure>
    <div class="curriculum-copy"><span class="eyebrow">${optional?`OPTIONAL ${String(offset+1).padStart(2,'0')}`:`MISSION ${String(i+1).padStart(2,'0')}`} · ${id}</span><h4 id="curriculum-title-${id}">${escape(title)}</h4><p class="curriculum-job">${escape(preview.job)}</p><p class="curriculum-skill"><strong>You’ll learn</strong> · ${escape(preview.skill)}</p><p class="curriculum-state">${state}</p><small>${escape(detail)}</small>${released?`<button ${i===0?'id="revisit-mission"':''} data-lesson="${id}">${missing?'Preview':complete?'Revisit':'Open'} Mission ${i+1} →</button>`:''}</div>
   </article>`;
  }).join('')}</div></section>`;
 }).join('');
}

export function bindCurriculumPreviews(root:HTMLElement) {
 root.querySelectorAll<HTMLImageElement>('.curriculum-preview img').forEach(img=>{
  const fallback=()=>img.closest('figure')!.classList.add('preview-unavailable');
  img.addEventListener('error',fallback,{once:true});
  if(img.complete&&!img.naturalWidth)fallback();
 });
}
