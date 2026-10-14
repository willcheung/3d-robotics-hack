/** Parcel arm v1: yaw, lift and jaw gap. Pure geometry; no renderer or student state. */
export type Point = {x:number;y:number;z:number};
export const parcelCases:Record<string,{pickup:number;tray:number}> = {
  'parcel-across':{pickup:30,tray:150},
  'parcel-moved':{pickup:30,tray:135},
  'parcel-return':{pickup:150,tray:30},
};
export const GUARD = {min:{x:-.35,y:0,z:1},max:{x:.35,y:.65,z:1.75}};
export type ArmState = {
  id:string;shoulder:number;shoulderTarget:number;elbow:number;elbowTarget:number;
  gap:number;gripTarget:number;parcel:Point;payload:'waiting'|'held'|'dropped'|'delivered';
  collision:boolean;graspMissed:boolean;
};
const radians=(degrees:number)=>degrees*Math.PI/180;
export function armPose(shoulder:number,elbow:number):{joint:Point;hand:Point}{
  const s=radians(shoulder),e=radians(elbow),radius=.8+.8*Math.cos(e);
  return {joint:{x:.8*Math.cos(s),y:.3,z:.8*Math.sin(s)},hand:{x:radius*Math.cos(s),y:.3+.8*Math.sin(e),z:radius*Math.sin(s)}};
}
export function initialArm(id:string):ArmState {
  if(!Object.hasOwn(parcelCases,id))throw Error('Unknown parcel case.');
  const {pickup}=parcelCases[id];
  return {id,shoulder:pickup,shoulderTarget:pickup,elbow:35,elbowTarget:35,gap:100,gripTarget:100,parcel:armPose(pickup,0).hand,payload:'waiting',collision:false,graspMissed:false};
}
export const jointsSettled=(a:ArmState)=>Math.abs(a.shoulder-a.shoulderTarget)<1e-9&&Math.abs(a.elbow-a.elbowTarget)<1e-9;
export const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const approach=(actual:number,target:number,step:number)=>actual+Math.max(-step,Math.min(step,target-actual));
/** Slab intersection against a conservatively expanded guard; contact is a hit. */
export function guardContact(a:Point,b:Point,radius:number):boolean {
  let enter=0,leave=1;
  for(const axis of ['x','y','z'] as const){
    const lo=GUARD.min[axis]-radius,hi=GUARD.max[axis]+radius,d=b[axis]-a[axis];
    if(Math.abs(d)<1e-12){if(a[axis]<lo||a[axis]>hi)return false;continue;}
    const t1=(lo-a[axis])/d,t2=(hi-a[axis])/d;
    enter=Math.max(enter,Math.min(t1,t2));leave=Math.min(leave,Math.max(t1,t2));
    if(enter>leave)return false;
  }
  return true;
}
function sweptCollision(old:ArmState,next:ArmState):boolean {
  const steps=Math.max(1,Math.ceil(Math.max(Math.abs(next.shoulder-old.shoulder),Math.abs(next.elbow-old.elbow))/.1));
  for(let i=0;i<=steps;i++){
    const t=i/steps,pose=armPose(old.shoulder+(next.shoulder-old.shoulder)*t,old.elbow+(next.elbow-old.elbow)*t);
    // 0.005 m covers the maximum intervening point motion at 0.1° substeps.
    if(guardContact({x:0,y:.3,z:0},pose.joint,.045)||guardContact(pose.joint,pose.hand,.045)||
       (old.payload==='held'&&guardContact(pose.hand,pose.hand,.065)))return true;
  }
  return false;
}
export function tickArm(a:ArmState,dt:number):ArmState {
  if(a.collision)return a;
  const next={...a,shoulder:approach(a.shoulder,a.shoulderTarget,90*dt),elbow:approach(a.elbow,a.elbowTarget,45*dt),gap:approach(a.gap,a.gripTarget,200*dt)};
  // Freeze the safe actual pose but retain the student's targets for diagnosis.
  if(sweptCollision(a,next))return {...a,collision:true};
  const hand=armPose(next.shoulder,next.elbow).hand;
  if(a.payload==='waiting'&&a.gap>40&&next.gap<=40){
    if(jointsSettled(next)&&distance(hand,a.parcel)<=.04+1e-9){next.payload='held';next.graspMissed=false;}
    else next.graspMissed=true;
  }
  if(next.payload==='held'){
    next.gap=Math.max(40,next.gap);next.parcel=hand;
    if(next.gap>45){
      const tray=armPose(parcelCases[a.id].tray,0).hand;
      if(jointsSettled(next)&&distance(hand,tray)<=.06+1e-9){next.payload='delivered';next.parcel=tray;}
      else {next.payload='dropped';next.parcel={...hand,y:.04};}
    }
  }
  return next;
}
export function armReached(a:ArmState,id:string):boolean {
  return a.id===id&&!a.collision&&a.payload==='delivered'&&jointsSettled(a)&&a.gap>=80&&Math.abs(a.gap-a.gripTarget)<1e-9;
}
