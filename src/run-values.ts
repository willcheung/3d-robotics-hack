import type {State} from './model.ts';
export type RunValues = {direction:number;tilt:number;motor:number;ticks:number;checkpoints?:number;shoulder?:number;elbow?:number;gap?:number;parcel?:string;collision?:boolean};
/** A compact final observation, not a trace of arbitrary program variables. */
export function runValues(s:State):RunValues {
 return {direction:s.angle,tilt:s.scanner,motor:s.power,ticks:s.ticks,...(s.patrol?{checkpoints:s.patrol.visited}:{}),...(s.arm?{shoulder:s.arm.shoulder,elbow:s.arm.elbow,gap:s.arm.gap,parcel:s.arm.payload,collision:s.arm.collision}: {})};
}
export function cleanValues(input:unknown):Partial<RunValues> {
 if(!input||typeof input!=='object')return {};
 const row=input as Record<string,unknown>,result:Record<string,unknown>={};
 for(const k of ['direction','tilt','motor','ticks','checkpoints','shoulder','elbow','gap'])if(typeof row[k]==='number'&&Number.isFinite(row[k])&&Math.abs(row[k])<=10000)result[k]=row[k];
 if(typeof row.parcel==='string'&&row.parcel.length<=32)result.parcel=row.parcel;
 if(typeof row.collision==='boolean')result.collision=row.collision;
 return result;
}
export function valuesText(v:Partial<RunValues>):string {
 const n=(x:number)=>Number(x.toFixed(1));
 return [v.shoulder!==undefined?`Shoulder ${n(v.shoulder)}°`:v.direction!==undefined?`Direction ${n(v.direction)}°`:'',v.elbow!==undefined?`Elbow ${n(v.elbow)}°`:v.tilt!==undefined?`Tilt ${n(v.tilt)}°`:'',v.motor!==undefined&&v.shoulder===undefined?`Motor ${v.motor}`:'',v.gap!==undefined?`Jaws ${n(v.gap)} mm`:'',v.parcel!==undefined?`Parcel: ${v.parcel}`:'',v.collision?'Guard contact':'',v.checkpoints!==undefined?`${v.checkpoints} checkpoints logged`:'',v.ticks!==undefined?`${v.ticks} ticks`:''].filter(Boolean).join(' · ');
}
