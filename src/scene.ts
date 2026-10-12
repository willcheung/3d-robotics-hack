import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { State, Target } from './model.ts';
export class StationScene {
  private renderer: THREE.WebGLRenderer;
  private camera = new THREE.PerspectiveCamera(37, 1, .1, 60);
  private controls: OrbitControls;
  private world = new THREE.Scene();
  private pointer = new THREE.Group();
  private scanner = new THREE.Group();
  private target = new THREE.Group();
  private crew = new THREE.Group();
  private crewMarker: THREE.Mesh;
  private crewLight: THREE.MeshStandardMaterial;
  private crewBadge: THREE.Mesh;
  private waitingBadge: THREE.Mesh;
  private crewSupport: THREE.Mesh;
  private signal: THREE.Mesh;
  private motorAnchor = new THREE.Vector3(-.62, .495, 1.05);
  private servoAnchor = new THREE.Object3D();
  private projected = new THREE.Vector3();
  private dirty = true;
  private reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  constructor(private container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor('#11272b');
    this.renderer.domElement.tabIndex = 0;
    this.renderer.domElement.setAttribute('aria-label', '3D rescue searchlight: motor(power) turns the base, direction pointer and whole tower left or right; servo(degrees) tilts the lamp up or down at its side joint. wait(ticks) advances both movements. Drag to orbit, right-drag to pan, scroll to zoom. Arrow keys orbit; plus and minus zoom; Home resets the view.');
    this.renderer.domElement.setAttribute('role', 'img');
    container.append(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.addEventListener('change', () => { this.dirty = true; });
    this.controls.enableDamping = !this.reduceMotion;
    this.controls.minDistance = 4; this.controls.maxDistance = 13;
    this.controls.maxPolarAngle = Math.PI / 2 - .03;
    this.reset();
    this.world.fog = new THREE.Fog('#11272b', 12, 28);
    this.world.add(new THREE.HemisphereLight('#e3ffef', '#254047', 3));
    const sun = new THREE.DirectionalLight('#fff1d0', 5); sun.position.set(-3, 8, 4); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -6; sun.shadow.camera.right = 6; sun.shadow.camera.top = 6; sun.shadow.camera.bottom = -6;
    sun.shadow.bias = -.0004; this.world.add(sun);
    const rim = new THREE.DirectionalLight('#7edbc6', 3); rim.position.set(4, 3, -5); this.world.add(rim);
    const mat = (color: string, metalness = .1, roughness = .65) => new THREE.MeshStandardMaterial({ color, metalness, roughness });
    const dark = mat('#23383e'), teal = mat('#318b80'), mint = mat('#b3cbc0'), steel = mat('#a1b0ab', .7, .3), lime = mat('#d5f674');
    const box = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = this.world) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
    };
    const cylinder = (r: number, h: number, m: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = this.world) => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 64), m); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
    };
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat('#183237')); floor.rotation.x = -Math.PI / 2; floor.position.y = -.11; floor.receiveShadow = true; this.world.add(floor);
    const grid = new THREE.GridHelper(30, 60, '#295052', '#234246'); grid.position.y = -.1; this.world.add(grid);
    // Original instrument board: motor dial, brushed deck, scanner and visible fasteners.
    box(4.35, .26, 3.1, dark, 0, .06, 0);
    box(4.2, .14, 2.96, teal, 0, .25, 0);
    box(3.99, .035, 2.75, mint, 0, .338, 0);
    for (const x of [-1.84, 1.84]) for (const z of [-1.2, 1.2]) {
      cylinder(.075, .035, steel, x, .375, z);
      box(.085, .008, .012, dark, x, .396, z);
    }
    for (const x of [-1.6, 1.6]) for (const z of [-1, 1]) cylinder(.21, .16, dark, x, -.06, z);
    cylinder(1.13, .13, mat('#3c837e'), -.62, .43, -.03);
    cylinder(1.06, .024, mat('#233e42'), -.62, .506, -.03);
    for (let angle = -150; angle <= 180; angle += 10) {
      const a = THREE.MathUtils.degToRad(angle);
      const long = angle % 30 === 0;
      const mark = box(.022, .008, long ? .13 : .07, long ? mint : teal, -.62 + Math.sin(a) * .94, .524, -.03 - Math.cos(a) * .94);
      mark.rotation.y = -a;
      if (long && angle <= 150) {
        const label = this.text(String(angle), '#c4d8cf', .20); label.position.set(-.62 + Math.sin(a) * .73, .535, -.03 - Math.cos(a) * .73); label.rotation.x = -Math.PI / 2; this.world.add(label);
      }
    }
    this.pointer.position.set(-.62, .585, -.03);
    cylinder(.25, .17, steel, 0, .005, 0, this.pointer);
    cylinder(.19, .19, mat('#8be1d4'), 0, .025, 0, this.pointer);
    box(.11, .08, .88, lime, 0, .07, -.4, this.pointer);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(.115, .22, 3), lime); tip.rotation.x = -Math.PI / 2; tip.position.set(0, .07, -.91); this.pointer.add(tip);
    cylinder(.055, .015, dark, 0, .13, 0, this.pointer);
    this.world.add(this.pointer);
    const targetRing = new THREE.Mesh(new THREE.TorusGeometry(.115, .025, 12, 40), new THREE.MeshBasicMaterial({ color: '#d8fa81' }));
    targetRing.rotation.x = -Math.PI / 2; this.target.add(targetRing);
    const targetBeam = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, .3, 16), new THREE.MeshBasicMaterial({ color: '#dcff94', transparent: true, opacity: .5 })); targetBeam.position.y = .15; this.target.add(targetBeam); this.world.add(this.target);
    // One useful machine: the motor turns the tower, then its servo tilts the light.
    cylinder(.10, .78, steel, 0, .54, 0, this.pointer);
    box(.68, .1, .28, dark, 0, .93, 0, this.pointer);
    for (const x of [-.32, .32]) box(.08, .42, .28, teal, x, 1.09, 0, this.pointer);
    this.scanner.position.set(0, 1.215, 0);
    box(.53, .4, .52, mat('#eec76b'), 0, 0, 0, this.scanner);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .16, 40), dark); lens.rotation.x = Math.PI / 2; lens.position.set(0, 0, -.29); this.scanner.add(lens);
    const glass = new THREE.Mesh(new THREE.CircleGeometry(.14, 40), new THREE.MeshBasicMaterial({ color: '#fff6b2', side: THREE.DoubleSide })); glass.position.set(0, 0, -.378); this.scanner.add(glass);
    const beam = new THREE.Mesh(new THREE.ConeGeometry(.24, 4, 32, 1, true), new THREE.MeshBasicMaterial({ color: '#ffe7a0', transparent: true, opacity: .16, depthWrite: false, side: THREE.DoubleSide }));
    beam.rotation.x = Math.PI / 2; beam.position.z = -2.38; this.scanner.add(beam);
    const beamLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -.38), new THREE.Vector3(0, 0, -4.38)]), new THREE.LineBasicMaterial({ color: '#ffdc7b', transparent: true, opacity: .65 })); this.scanner.add(beamLine);
    this.pointer.add(this.scanner);
    // A visible servo housing and axle at the lamp's tilt joint, on the turning tower.
    const servoMaterial = mat('#f3bf75');
    box(.22, .28, .30, servoMaterial, .43, 1.215, 0, this.pointer);
    const servoAxle = cylinder(.09, .20, steel, .32, 1.215, 0, this.pointer);
    servoAxle.rotation.z = Math.PI / 2;
    this.servoAnchor.position.set(.55, 1.215, 0); this.pointer.add(this.servoAnchor);
    box(.66, .28, .8, dark, 1.25, .5, .08);
    box(.5, .025, .5, teal, 1.25, .655, .08);
    const powerBadge = this.text('POWER', '#d5e6de', .22); powerBadge.rotation.x = -Math.PI/2; powerBadge.position.set(1.25,.675,.08); this.world.add(powerBadge);
    // The receiving crew is physically on the beam's bearing and elevation.
    this.crewLight = mat('#627f7a');
    box(1.05, .12, .78, this.crewLight, 0, -.29, 0, this.crew);
    for (const x of [-.24, .24]) {
      const jacket = mat('#df9b61');
      box(.14, .30, .12, jacket, x, .06, 0, this.crew);
      for (const dx of [-.045, .045]) box(.04, .15, .055, dark, x + dx, -.16, 0, this.crew);
      const head = new THREE.Mesh(new THREE.SphereGeometry(.085, 16, 12), mat('#efd3a0')); head.position.set(x, .29, 0); this.crew.add(head);
      const arm = box(.045, .25, .055, jacket, x + .11, .15, 0, this.crew); arm.rotation.z = -.65;
    }
    this.crewMarker = new THREE.Mesh(new THREE.TorusGeometry(.43, .025, 12, 40), new THREE.MeshBasicMaterial({ color: '#e5b97c' }));
    this.crewMarker.rotation.x = -Math.PI/2; this.crewMarker.position.y = -.22; this.crew.add(this.crewMarker);
    this.waitingBadge = this.text('CREW WAITING', '#ffda9d', .59); this.waitingBadge.position.set(0,.65,0); this.crew.add(this.waitingBadge);
    this.crewBadge = this.text('CREW LOCATED', '#d5f674', .59); this.crewBadge.position.set(0,.65,0); this.crew.add(this.crewBadge);
    this.world.add(this.crew);
    this.crewSupport = new THREE.Mesh(new THREE.CylinderGeometry(.42, .66, 1, 5), mat('#3d5c5c'));
    this.crewSupport.castShadow = true; this.crewSupport.receiveShadow = true; this.world.add(this.crewSupport);
    box(.71, .04, .28, dark, 1.2, .383, 1.05);
    this.signal = cylinder(.06, .055, new THREE.MeshStandardMaterial({ color: '#d5f674', emissive: '#d5f674', emissiveIntensity: .6 }), 1.45, .415, 1.05);
    const badge = this.text('SIGNAL / 01', '#d5e6de', .45); badge.rotation.x = -Math.PI/2; badge.position.set(-.6,.37,1.3); this.world.add(badge);
    // Cable on the board connects the motor housing and servo module.
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(.3,.38,.7),new THREE.Vector3(.6,.40,.85),new THREE.Vector3(.85,.43,.6),new THREE.Vector3(1,.48,.4)]);
    this.world.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 30, .028, 8, false), mat('#eabf66')));
    new ResizeObserver(() => this.resize()).observe(container);
    this.renderer.domElement.addEventListener('keydown', e => {
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key)) {
        e.preventDefault();
        if (e.key === 'Home') this.reset();
        else if (['+','=','-'].includes(e.key)) this.zoom(e.key === '-' ? 1.15 : .87);
        else {
          const offset = this.camera.position.clone().sub(this.controls.target); const spherical = new THREE.Spherical().setFromVector3(offset);
          spherical.theta += e.key === 'ArrowLeft' ? -.15 : e.key === 'ArrowRight' ? .15 : 0;
          spherical.phi = THREE.MathUtils.clamp(spherical.phi + (e.key === 'ArrowUp' ? -.1 : e.key === 'ArrowDown' ? .1 : 0), .12, Math.PI/2-.04);
          this.camera.position.copy(this.controls.target).add(new THREE.Vector3().setFromSpherical(spherical)); this.controls.update();
        }
      }
    });
    this.resize();
    container.classList.add('scene-labeled');
    this.renderer.setAnimationLoop(() => {
      this.controls.update();
      if (this.dirty) {
        this.dirty = false;
        this.waitingBadge.quaternion.copy(this.camera.quaternion); this.crewBadge.quaternion.copy(this.camera.quaternion);
        this.renderer.render(this.world, this.camera);
        this.updateLabels();
      }
    });
  }
  private updateLabels() {
    const width = this.container.clientWidth, height = this.container.clientHeight;
    const overlay = this.container.querySelector<SVGSVGElement>('.component-lines')!;
    overlay.setAttribute('viewBox', `0 0 ${width} ${height}`);
    for (const part of ['motor', 'servo'] as const) {
      if (part === 'motor') this.projected.copy(this.motorAnchor);
      else this.servoAnchor.getWorldPosition(this.projected);
      this.projected.project(this.camera);
      const x = (this.projected.x + 1) * width / 2, y = (1 - this.projected.y) * height / 2;
      const group = overlay.querySelector<SVGGElement>(`[data-part="${part}"]`)!;
      // Keep the written key readable when the learner pans a part off-screen.
      // Never point to a clamped screen edge and imply the part is there.
      const visible = this.projected.z >= -1 && this.projected.z <= 1 && x >= 0 && x <= width && y >= 0 && y <= height;
      group.style.display = visible ? '' : 'none';
      if (!visible) continue;
      const label = this.container.querySelector<HTMLElement>(`#${part}-label`)!;
      const startX = label.offsetLeft + (part === 'motor' ? label.offsetWidth : 0);
      const startY = label.offsetTop + label.offsetHeight / 2;
      const line = group.querySelector('line')!;
      line.setAttribute('x1', String(startX)); line.setAttribute('y1', String(startY));
      line.setAttribute('x2', String(x)); line.setAttribute('y2', String(y));
      const dot = group.querySelector('circle')!;
      dot.setAttribute('cx', String(x)); dot.setAttribute('cy', String(y));
    }
  }
  private text(value: string, color: string, size: number) {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 52px monospace'; ctx.fillText(value, 256, 64);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(new THREE.PlaneGeometry(size * 2.5, size * .625), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  }
  private resize() { const w = this.container.clientWidth, h = this.container.clientHeight; if (!w || !h) return; this.renderer.setSize(w, h); this.camera.aspect = w/h; this.camera.updateProjectionMatrix(); this.dirty = true; }

  reset() { this.camera.position.set(2.5, 5.6, 8.8); this.controls.target.set(0,1.05,0); this.controls.update(); }
  top() { this.camera.position.set(.01,10,.01); this.controls.target.set(0,1.05,0); this.controls.update(); }
  zoom(factor: number) { const offset = this.camera.position.clone().sub(this.controls.target); offset.multiplyScalar(factor).clampLength(4,13); this.camera.position.copy(this.controls.target).add(offset); this.controls.update(); }
  update(s: State, goal: Target, success: boolean) {
    this.dirty = true;
    this.pointer.rotation.y = -THREE.MathUtils.degToRad(s.angle);
    this.scanner.rotation.x = THREE.MathUtils.degToRad(s.scanner - 90);
    const a = THREE.MathUtils.degToRad(goal.angle); this.target.position.set(-.62+Math.sin(a)*1.01,.56,-.03-Math.cos(a)*1.01);
    this.crew.position.set(-.62 + Math.sin(a)*2.6, 1.8 + Math.tan(THREE.MathUtils.degToRad(goal.scanner - 90))*2.6, -.03 - Math.cos(a)*2.6);
    const supportHeight = Math.max(.04, this.crew.position.y - .24);
    this.crewSupport.scale.y = supportHeight; this.crewSupport.position.set(this.crew.position.x, supportHeight/2 - .1, this.crew.position.z);
    this.crewLight.color.set(success ? '#afce60' : '#627f7a'); this.crewLight.emissive.set(success ? '#516e24' : '#000000');
    (this.crewMarker.material as THREE.MeshBasicMaterial).color.set(success ? '#d5f674' : '#e5b97c');
    this.crewBadge.visible = success; this.waitingBadge.visible = !success;
    (this.signal.material as THREE.MeshStandardMaterial).emissiveIntensity = success ? 2 : .3;
  }
}
