import {lessonIds,lessonTargets,type LessonId} from './model.ts';

export type ChallengeScore={checks:number|null;points:number|null};
export type ArenaState={revision:number;challenges:Record<string,ChallengeScore>};
export type ArenaSummary=ReturnType<typeof arenaSummary>;
export type ArenaParticipant={id:string;name:string;role:'parent'|'student';rank:number|null;arena:ArenaSummary};
export const badgeNames:Record<LessonId,string>={L01:'Signal finder',L02:'Sensor scout',L03:'Patrol keeper',L04:'Parcel pilot'};

/** Checks 1–10 earn 100, 11–20 earn 90, etc. Practice never calls this. */
export function challengePoints(successfulCheck:number){
 if(!Number.isSafeInteger(successfulCheck)||successfulCheck<1)throw Error('Invalid scored check count.');
 return Math.max(50,100-10*Math.floor((successfulCheck-1)/10));
}
/** Initialize before adding new completion: old checked work has unknown counts. */
export function initialArena(completed:readonly string[]):ArenaState{
 return {revision:0,challenges:Object.fromEntries(lessonIds.flatMap(id=>lessonTargets[id].map(target=>[target,completed.includes(target)?{checks:null,points:100}:{checks:0,points:null}])))};
}
export function arenaSummary(completed:readonly string[],saved?:ArenaState){
 const state=saved??initialArena(completed);
 const missions=lessonIds.map(id=>{
  const challenges=lessonTargets[id].map(target=>{
   const score=state.challenges[target];
   if(!score||score.checks!==null&&(!Number.isSafeInteger(score.checks)||score.checks<0)||score.points!==null&&![50,60,70,80,90,100].includes(score.points))throw Error('Saved scoring is unavailable.');
   return {target,checks:score.checks,points:score.points,available:score.points??challengePoints((score.checks??0)+1)};
  });
  const complete=challenges.every(c=>c.points!==null);
  return {id,complete,challenges,points:challenges.reduce((sum,c)=>sum+(c.points??0),0)+(complete?200:0),checks:challenges.some(c=>c.checks===null)?null:challenges.reduce((sum,c)=>sum+c.checks!,0)};
 });
 return {points:missions.reduce((sum,m)=>sum+m.points,0),badges:missions.filter(m=>m.complete).map(m=>m.id),checked:missions.reduce((sum,m)=>sum+m.challenges.filter(c=>c.points!==null).length,0),missions};
}
