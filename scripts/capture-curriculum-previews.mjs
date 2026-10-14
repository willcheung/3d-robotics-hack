// Requires a local Vite dev server (not the built preview server).
// PREVIEW_ORIGIN=http://127.0.0.1:5187 node scripts/capture-curriculum-previews.mjs
// Optionally set ARM_PREVIEW_ORIGIN to a local checkout containing ArmView.
// These are illustrative model poses, not execution/learning acceptance evidence.
import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const output=new URL('../public/curriculum/',import.meta.url);
await mkdir(output,{recursive:true});
const local=value=>{
 const url=new URL(value);
 if(!['127.0.0.1','localhost','[::1]'].includes(url.hostname))throw Error('Capture only a disposable local server.');
 return url.origin;
};
const origin=local(process.env.PREVIEW_ORIGIN||'http://127.0.0.1:5187');
const armOrigin=process.env.ARM_PREVIEW_ORIGIN?local(process.env.ARM_PREVIEW_ORIGIN):null;
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage({viewport:{width:800,height:510},deviceScaleFactor:1,reducedMotion:'reduce'});
 const blank=async base=>{
  await page.route(base+'/',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><body style="margin:0"><div id="preview" style="width:800px;height:510px"></div></body></html>'}));
  await page.goto(base+'/');
 };
 await blank(origin);
 await page.evaluate(async()=>{
  const {StationScene}=await import('/src/scene.ts');
  const model=await import('/src/model.ts');
  // The catalog image omits the workshop's HTML command labels.
  StationScene.prototype.updateLabels=function(){};
  const scene=new StationScene(document.getElementById('preview'));
  scene.zoom(.94);scene.controls.target.set(0,1.65,0);scene.controls.update();
  window.capturePreview=(target,angle,tilt)=>scene.update({...model.initialState(target),angle,scanner:tilt,servoTarget:tilt},model.targets[target],target==='beacon');
 });
 for(const [id,target,angle,tilt] of [['L01','beacon',60,120],['L02','sensor-right',90,120],['L03','patrol-ridge',-30,90]]){
  await page.evaluate(([target,angle,tilt])=>window.capturePreview(target,angle,tilt),[target,angle,tilt]);
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.screenshot({path:new URL(id+'.png',output).pathname});
 }
 if(armOrigin){
  await blank(armOrigin);
  await page.evaluate(async()=>{
   const THREE=await import('/node_modules/three/build/three.module.js');
   const {ArmView}=await import('/src/arm-scene.ts');
   const {initialArm}=await import('/src/arm-model.ts');
   const scene=new THREE.Scene();scene.background=new THREE.Color('#142d31');
   const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(800,510);renderer.setPixelRatio(1);
   document.getElementById('preview').append(renderer.domElement);
   scene.add(new THREE.HemisphereLight('#e3ffef','#254047',3));
   const sun=new THREE.DirectionalLight('#fff1d0',5);sun.position.set(-3,8,4);scene.add(sun);
   const arm=new ArmView();arm.root.visible=true;arm.update(initialArm('parcel-across'));scene.add(arm.root);
   // Workshop labels obscure the small catalog image; the brief supplies context.
   arm.labels.forEach(label=>label.visible=false);
   const camera=new THREE.PerspectiveCamera(37,800/510,.1,60);camera.position.set(2.6,2.7,-3.7);camera.lookAt(0,.35,.5);
   renderer.render(scene,camera);
   renderer.setAnimationLoop(()=>renderer.render(scene,camera));
  });
  await page.screenshot({path:new URL('L04.png',output).pathname});
 }
 console.log(`Captured L01–L03${armOrigin?' and L04':''} model previews.`);
}finally{await browser.close();}
