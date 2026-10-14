import * as THREE from 'three';
import {armPose,parcelCases,GUARD,type ArmState,type Point} from './arm-model.ts';
/** Render trusted joint/payload positions; never infer a grasp or success here. */
export class ArmView {
 readonly root=new THREE.Group();
 private inner:THREE.Mesh;
 private outer:THREE.Mesh;
 private elbow:THREE.Mesh;
 private jaws=[new THREE.Group(),new THREE.Group()];
 private hand=new THREE.Group();
 private parcel:THREE.Group;
 private pickup:THREE.Group;
 private tray:THREE.Group;
 private labels:THREE.Sprite[]=[];
 constructor(){
  const material=(color:string)=>new THREE.MeshStandardMaterial({color,roughness:.62,metalness:.2});
  const dark=material('#213e48'),teal=material('#54b7aa'),amber=material('#efb55e'),lime=material('#d6f785'),steel=material('#b9d6d0');
  const box=(w:number,h:number,d:number,mat:THREE.Material,x:number,y:number,z:number,parent:THREE.Object3D=this.root)=>{
   const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  };
  box(4.2,.10,2.85,dark,0,-.065,.55);
  box(4,.015,2.65,material('#326363'),0,-.006,.55);
  const grid=new THREE.GridHelper(4,20,'#6d9790','#426e6b');grid.position.set(0,.004,.5);this.root.add(grid);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.24,.31,.3,40),dark);base.position.y=.15;this.root.add(base);
  const yaw=new THREE.Mesh(new THREE.TorusGeometry(.22,.018,8,48),lime);yaw.rotation.x=Math.PI/2;yaw.position.y=.312;this.root.add(yaw);
  for(const [a,text] of [[0,'0°'],[90,'90°'],[180,'180°']] as const){const r=a*Math.PI/180;this.label(text,{x:.43*Math.cos(r),y:.09,z:.43*Math.sin(r)},'#d6f785',.22);}
  this.inner=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1,20),teal);this.outer=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,1,20),amber);this.root.add(this.inner,this.outer);
  this.elbow=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.17,24),dark);this.root.add(this.elbow);
  box(.19,.065,.14,dark,0,.11,0,this.hand);
  for(let i=0;i<2;i++){
   box(.026,.13,.10,steel,0,.015,0,this.jaws[i]);box(.035,.025,.10,lime,i===0?.01:-.01,-.046,0,this.jaws[i]);this.hand.add(this.jaws[i]);
  }
  this.root.add(this.hand);
  this.parcel=new THREE.Group();box(.04,.08,.08,amber,0,0,0,this.parcel);box(.042,.014,.082,lime,0,.008,0,this.parcel);const parcelMarker=new THREE.Mesh(new THREE.TorusGeometry(.085,.007,8,32),new THREE.MeshBasicMaterial({color:'#fff2a6'}));parcelMarker.rotation.x=Math.PI/2;parcelMarker.position.y=-.035;this.parcel.add(parcelMarker);
  this.label('PARCEL',{x:0,y:.19,z:0},'#fff2a6',.28,this.parcel);this.root.add(this.parcel);
  const pad=(color:string,name:string)=>{const group=new THREE.Group();const mat=material(color);box(.44,.24,.4,dark,0,-.16,0,group);box(.46,.025,.42,mat,0,-.055,0,group);for(const x of [-.24,.24])box(.025,.10,.44,mat,x,-.04,0,group);this.root.add(group);this.label(name,{x:0,y:.4,z:0},color,.43,group);return group;};
  this.pickup=pad('#edba6f','PICKUP');this.tray=pad('#d6f785','RECEIVING TRAY');
  const {min,max}=GUARD;
  box(max.x-min.x,max.y-min.y,max.z-min.z,new THREE.MeshStandardMaterial({color:'#ed8d57',transparent:true,opacity:.48,roughness:.6}),0,(max.y+min.y)/2,(max.z+min.z)/2);
  for(const x of [min.x,max.x])for(const z of [min.z,max.z])box(.035,max.y,.035,amber,x,max.y/2,z);
  box(max.x-min.x,.035,max.z-min.z,amber,0,max.y,(min.z+max.z)/2);
  this.label('CLEAR THE GUARD',{x:0,y:.82,z:1.43},'#ffd19b',.55);
  // A simple dispatch station gives the receiving tray a useful destination.
  const worker=new THREE.Group();box(.12,.32,.13,teal,0,.43,0,worker);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.08,16,12),material('#e6c7a0'));head.position.y=.69;worker.add(head);
  for(const x of [-.04,.04])box(.04,.26,.055,dark,x,.15,0,worker);
  worker.position.set(-1.74,0,-.28);this.root.add(worker);this.label('DISPATCH',{x:-1.7,y:.94,z:-.28},'#bdd6d0',.38);
  this.root.visible=false;
 }
 private label(text:string,position:Point,color:string,width:number,parent:THREE.Object3D=this.root){
  const canvas=document.createElement('canvas');canvas.width=640;canvas.height=96;const ctx=canvas.getContext('2d')!;
  ctx.fillStyle='#132e34';ctx.fillRect(0,0,640,96);ctx.font='bold 42px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=color;ctx.fillText(text,320,48);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthWrite:false}));sprite.position.set(position.x,position.y,position.z);sprite.scale.set(width*2.4,width*.36,1);parent.add(sprite);this.labels.push(sprite);
 }
 private link(mesh:THREE.Mesh,a:Point,b:Point){
  const from=new THREE.Vector3(a.x,a.y,a.z),to=new THREE.Vector3(b.x,b.y,b.z),delta=to.clone().sub(from);
  mesh.position.copy(from).add(to).multiplyScalar(.5);mesh.scale.y=delta.length();mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
 }
 update(a:ArmState){
  const {joint,hand}=armPose(a.shoulder,a.elbow),c=parcelCases[a.id];
  this.link(this.inner,{x:0,y:.3,z:0},joint);this.link(this.outer,joint,hand);
  this.elbow.position.set(joint.x,joint.y,joint.z);
  const yaw=a.shoulder*Math.PI/180;
  this.elbow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(-Math.sin(yaw),0,Math.cos(yaw)));
  this.hand.position.set(hand.x,hand.y,hand.z);this.hand.rotation.y=-a.shoulder*Math.PI/180+Math.PI/2;
  this.jaws[0].position.x=-(a.gap/2000+.013);this.jaws[1].position.x=a.gap/2000+.013;
  this.parcel.position.set(a.parcel.x,a.parcel.y,a.parcel.z);this.parcel.rotation.y=-a.shoulder*Math.PI/180+Math.PI/2;
  for(const [pad,angle] of [[this.pickup,c.pickup],[this.tray,c.tray]] as const){const p=armPose(angle,0).hand;pad.position.set(p.x,p.y,p.z);}
 }
}
