import {OutdoorTraces} from './outdoor-traces.js';
import {OutdoorObjects} from './outdoor-objects.js';
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { badge, type SatieBadge } from 'satie-runtime/badge';
import type { MountedMixer, SatieScene } from 'satie-runtime/three';
import type { RuntimeContract } from 'satie-runtime/contracts';
import './style.css';
import {buildParadise,ParadiseAmbience,createDoor,personalize,moods,islandBounds,islandHeight} from './paradise-world.js';
import {EdenControls} from './eden-controls';
import {mountOutdoorMixer} from './outdoor-mixer.js';
import {MovementInput,isEditing} from './movement-input.js';

const canvas = getElement<HTMLCanvasElement>('world');
const welcome = getElement<HTMLElement>('welcome');
const startButton = getElement<HTMLButtonElement>('start');
const status = getElement<HTMLElement>('status');
const volumeControl = getElement<HTMLInputElement>('volume');
const volumeValue = getElement<HTMLOutputElement>('volume-value');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.3;
renderer.xr.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#c0e5e9');
scene.fog = new THREE.FogExp2('#c0e5e9', 0.006);

const rig = new THREE.Group();
scene.add(rig);

const camera = new THREE.PerspectiveCamera(68, 1, 0.08, 100);
camera.position.set(0, 1.6, 0);
camera.rotation.order = 'YXZ';
rig.add(camera);
rig.rotation.y = Math.PI;
renderer.xr.setReferenceSpaceType('local-floor');

const worldRoot = new THREE.Group();
worldRoot.name = 'courtyard';
scene.add(worldRoot);

const stone = new THREE.MeshStandardMaterial({ color: '#77796b', roughness: 0.92 });
const paleStone = new THREE.MeshStandardMaterial({ color: '#aaa58e', roughness: 0.78 });
const soil = new THREE.MeshStandardMaterial({ color: '#344033', roughness: 1 });
const leaves = new THREE.MeshStandardMaterial({ color: '#405940', roughness: 0.95 });
const darkLeaves = new THREE.MeshStandardMaterial({ color: '#2c4435', roughness: 0.95 });
const water = new THREE.MeshStandardMaterial({
  color: '#739b91',
  roughness: 0.22,
  metalness: 0.12,
  transparent: true,
  opacity: 0.88,
});
const brass = new THREE.MeshStandardMaterial({ color: '#b28b4d', roughness: 0.38, metalness: 0.55 });
const lanternGlass = new THREE.MeshStandardMaterial({
  color: '#f5cb78',
  emissive: '#e49d42',
  emissiveIntensity: 1.6,
  roughness: 0.3,
});

scene.add(new THREE.HemisphereLight('#d3ded0', '#202c20', 1.35));
const moonlight = new THREE.DirectionalLight('#c2d0c6', 1.25);
moonlight.position.set(-5, 10, 4);
scene.add(moonlight);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 24), stone);
ground.rotation.x = -Math.PI / 2;
ground.position.set(0, -0.04, 8);
ground.receiveShadow = true;
worldRoot.add(ground);

const soilPatch = new THREE.Mesh(new THREE.CircleGeometry(1.05, 32), soil);
soilPatch.rotation.x = -Math.PI / 2;
soilPatch.position.set(-1.55, -0.015, 1.6);
worldRoot.add(soilPatch);

function makeHost(id: string, position: readonly [number, number, number]): THREE.Group {
  const host = new THREE.Group();
  host.name = id;
  host.userData.satieId = id;
  host.position.set(...position);
  worldRoot.add(host);
  return host;
}

function addMesh(
  host: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: readonly [number, number, number] = [0, 0, 0],
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  host.add(mesh);
  return mesh;
}

function addWall(
  position: readonly [number, number, number],
  size: readonly [number, number, number],
): void {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(...size), paleStone);
  wall.position.set(...position);
  wall.castShadow = true;
  wall.receiveShadow = true;
  worldRoot.add(wall);
}

const fountain = makeHost('central_fountain', [0, 0, 6]);
addMesh(fountain, new THREE.CylinderGeometry(0.9, 1, 0.18, 40), paleStone, [0, 0.24, 0]);
addMesh(fountain, new THREE.CylinderGeometry(0.72, 0.78, 0.12, 40), stone, [0, 0.39, 0]);
addMesh(fountain, new THREE.CylinderGeometry(0.66, 0.66, 0.025, 40), water, [0, 0.46, 0]);
addMesh(fountain, new THREE.CylinderGeometry(0.12, 0.2, 0.45, 16), paleStone, [0, 0.66, 0]);
addMesh(fountain, new THREE.SphereGeometry(0.12, 16, 12), water, [0, 0.93, 0]);

function createLantern(
  id: string,
  position: readonly [number, number, number],
): void {
  const lantern = makeHost(id, position);
  addMesh(lantern, new THREE.CylinderGeometry(0.055, 0.08, 0.8, 10), brass, [0, 0.4, 0]);
  addMesh(lantern, new THREE.CylinderGeometry(0.17, 0.17, 0.07, 12), brass, [0, 0.83, 0]);
  addMesh(lantern, new THREE.BoxGeometry(0.22, 0.27, 0.22), lanternGlass, [0, 1.02, 0]);
  addMesh(lantern, new THREE.ConeGeometry(0.18, 0.12, 12), brass, [0, 1.22, 0]);
  const light = new THREE.PointLight('#f0b968', 1.2, 5, 1.8);
  light.position.set(0, 1, 0);
  lantern.add(light);
}

createLantern('left_lantern', [-2.598076211353316, 0, 1.5000000000000004]);
createLantern('right_lantern', [2.598076211353316, 0, 1.5000000000000004]);

const entranceHedge = makeHost('entrance_hedge', [-1.55, 0, 1.6]);
addMesh(entranceHedge, new THREE.BoxGeometry(0.7, 0.8, 3), leaves, [0, 0.4, 0]);
for (let index = 0; index < 7; index += 1) {
  const x = (index % 2 === 0 ? -1 : 1) * 0.22;
  const z = -1.2 + index * 0.4;
  addMesh(entranceHedge, new THREE.SphereGeometry(0.32, 12, 8), darkLeaves, [x, 0.58, z]);
}

const backHedge = makeHost('back_hedge', [0, 0, 11]);
addMesh(backHedge, new THREE.BoxGeometry(8, 0.8, 0.7), leaves, [0, 0.4, 0]);
for (let index = 0; index < 14; index += 1) {
  const x = -3.4 + index * 0.52;
  addMesh(backHedge, new THREE.SphereGeometry(0.43, 12, 8), darkLeaves, [x, 0.58, 0]);
}

const birdShrub = makeHost('outer_shrub', [3.742410434719668, 0, 17.606656813208502]);
addMesh(birdShrub, new THREE.CylinderGeometry(0.12, 0.2, 1.2, 9), paleStone, [0, 0.6, 0]);
for (const [x, y, z, radius] of [
  [-0.45, 1.1, 0, 0.72],
  [0.35, 1.35, 0.18, 0.8],
  [0, 1.75, -0.18, 0.72],
  [0.48, 0.95, -0.32, 0.58],
] as const) {
  addMesh(birdShrub, new THREE.SphereGeometry(radius, 14, 10), leaves, [x, y, z]);
}

addWall([-5, 0.28, 6], [0.5, 0.56, 12]);
addWall([5, 0.28, 6], [0.5, 0.56, 12]);
addWall([0, 0.28, 12], [10.5, 0.56, 0.5]);

const resize = (): void => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
};

window.addEventListener('resize', resize);
resize();

let satieAudio: SatieScene | null = null;
let mixer: MountedMixer | undefined;
let credit: SatieBadge | undefined;

volumeControl.addEventListener('input', () => {
  const volume = volumeControl.valueAsNumber;
  volumeValue.value = `${volume}%`;
  volumeValue.textContent = `${volume}%`;
  satieAudio?.engine.setMasterVolume(volume / 100);
  ambience.setMasterVolume(volume / 100);
});

async function loadSatieAudio(): Promise<SatieScene> {
  const { SatieScene } = await import('satie-runtime/three');
  const response = await fetch(`${import.meta.env.BASE_URL}satie/scene.contract.json`);
  if (!response.ok) {
    throw new Error(`Could not load Satie scene contract (HTTP ${response.status}).`);
  }
  const samplesResponse = await fetch(`${import.meta.env.BASE_URL}satie/samples.json`, { method: 'HEAD' });
  if (
    !samplesResponse.ok ||
    !samplesResponse.headers.get('content-type')?.includes('json')
  ) {
    throw new Error('Satie samples manifest is missing at /satie/samples.json.');
  }
  const contract = (await response.json()) as RuntimeContract;
  const audio = await SatieScene.load(`${import.meta.env.BASE_URL}satie/scene.satie`, `${import.meta.env.BASE_URL}satie/samples.json`, {
    contract,
    seed: 2026,
  });
  worldRoot.updateMatrixWorld(true);
  for (const { id } of contract.scene.objects ?? []) {
    const host = worldRoot.getObjectByName(id);
    if (!host) {
      throw new Error(`The Satie scene host "${id}" is missing from the visual world.`);
    }
    audio.bind(id, host, { anchor: 'origin' });
  }
  audio.bindListener(camera);
  return audio;
}

const audioReady = loadSatieAudio()
  .then((audio) => {
    satieAudio = audio;
    syncAuthoredMix();
    audio.engine.setMasterVolume(volumeControl.valueAsNumber / 100);
    volumeControl.disabled = false;
    credit = badge({
      dev: import.meta.env.DEV,
      ready: Promise.resolve(audio),
      onOpen: () => mixer?.open(),
    });
    credit.intro();

    if (import.meta.env.DEV) {
      void import('satie-runtime/three')
        .then(({ mountMixer }) => {
          mixer = mountMixer(audio, {
            scene,
            camera,
            renderer,
            script: `${import.meta.env.BASE_URL}satie/scene.satie`,
            samples: `${import.meta.env.BASE_URL}satie/samples.json`,
            collapsed: true,
            capture: false,
            context: () => audio.authoringContext(),
            onOpenChange: (open) => credit?.setPanelOpen(open),
          });
        })
        .catch((error: unknown) => {
          console.error('Satie mixer could not be loaded:', error);
          status.textContent = 'Audio is ready, but the development mixer could not be loaded.';
          status.hidden = false;
        });
    }

    return audio;
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Satie audio could not be loaded:', error);
    status.textContent = `Audio unavailable: ${message} The visual world is still ready.`;
    status.hidden = false;
    return null;
  })
  .finally(() => {
    startButton.disabled = false;
    if (vrButton instanceof HTMLButtonElement) {
      vrButton.disabled = false;
    }
  });

function enterWorld(): void {
  if (satieAudio) {
    void satieAudio.start().then(
      () => {
        welcome.hidden = true;
        syncAuthoredMix();
        credit?.hide();
      },
      (error: unknown) => {
        console.error('Satie audio failed to start:', error);
        status.textContent = 'Audio could not start. Check browser audio permissions and try again.';
        status.hidden = false;
      },
    );
    return;
  }

  welcome.hidden = true;
  credit?.hide();
}

startButton.addEventListener('click', enterWorld);

const vrButton = VRButton.createButton(renderer);
vrButton.classList.add('vr-button');
if (vrButton instanceof HTMLButtonElement) {
  vrButton.disabled = true;
}
vrButton.addEventListener('click', enterWorld);
document.body.append(vrButton);

const eden=buildParadise(scene,worldRoot);
const ambience=new ParadiseAmbience();ambience.active=true;
function syncAuthoredMix(){if(!satieAudio)return;const channels=new Map(ambience.channels().map(item=>[item.id,item]));satieAudio.engine.scriptStatements.forEach((voice,index)=>{const source=String((voice as {sourceId?:string}).sourceId||'');const id=source.includes('fountain_flow')?'fountain':source.includes('hedge_breeze')?'entrance-leaves':source.includes('evening_birds')?'birds':null;const item=id?channels.get(id):null;if(item)satieAudio!.engine.setStatementVolume(index,item.muted?0:item.level);});}
ambience.subscribe(syncAuthoredMix);
const outdoorTraces=new OutdoorTraces(worldRoot,ambience);
const outdoorObjects=new OutdoorObjects(worldRoot,ambience,()=>renderer.xr.isPresenting?edenControls.head():camera);
mountOutdoorMixer(document.getElementById('courtyard-mixer')!,ambience,outdoorObjects,outdoorTraces);
document.getElementById('open-outdoor-mixer')!.onclick=()=>{const panel=document.getElementById('courtyard-mixer')!;panel.hidden=!panel.hidden;movementInput.clear();};
let traveling=false;
const returnDoor=createDoor(worldRoot,{x:0,z:-2,title:'Return to bedroom - trigger / click',onOpen:()=>{
  if(traveling)return;traveling=true;
  setTimeout(()=>{void (async()=>{const session=renderer.xr.getSession();if(session)await session.end();window.location.assign('https://zhenga1.github.io/sound-room-webxr/?from=eden');})().catch(error=>{traveling=false;console.error(error);});},650);
}});
const edenControls=new EdenControls(scene,renderer,camera,rig,eden,returnDoor,ambience,outdoorObjects,outdoorTraces);
outdoorTraces.bindDesktop(canvas,camera,()=>!renderer.xr.isPresenting&&welcome.hidden);
const pressedKeys=new Set<string>();
const movementInput=new MovementInput(pressedKeys);
const canWalk=()=>welcome.hidden&&!renderer.xr.isPresenting&&!edenControls.paused&&document.visibilityState!=='hidden'&&document.hasFocus()&&!isEditing(document.activeElement);
window.addEventListener('keydown',event=>movementInput.down(event,canWalk()),true);
window.addEventListener('keyup',event=>movementInput.up(event),true);
const clearMovement=()=>{movementInput.clear();dragging=false;};
window.addEventListener('blur',clearMovement,true);window.addEventListener('pagehide',clearMovement,true);
document.addEventListener('visibilitychange',clearMovement,true);document.addEventListener('focusin',event=>{if(isEditing(event.target))clearMovement();},true);
function syncSliders(){for(const key of ['energy','nature','dreaminess'] as const){const input=document.getElementById('eden-'+key) as HTMLInputElement;input.value=String(Math.round(eden.target[key]*100));}}
for(const key of ['energy','nature','dreaminess'] as const){document.getElementById('eden-'+key)!.addEventListener('input',event=>{eden.set({[key]:Number((event.target as HTMLInputElement).value)/100});edenControls.rebuild();});}
document.querySelectorAll<HTMLButtonElement>('[data-mood]').forEach(button=>button.onclick=()=>{eden.set(moods[button.dataset.mood as keyof typeof moods]);syncSliders();edenControls.rebuild();});
document.getElementById('personalize')!.onclick=()=>{eden.set(personalize((document.getElementById('feeling') as HTMLInputElement).value,(document.getElementById('place') as HTMLInputElement).value));syncSliders();edenControls.rebuild();};
document.getElementById('pause-here')!.onclick=()=>{edenControls.paused=!edenControls.paused;movementInput.clear();document.getElementById('pause-here')!.textContent=edenControls.paused?'Resume walking':'Pause here';};
document.getElementById('save-favorite')!.onclick=()=>{const name=(document.getElementById('favorite-name') as HTMLInputElement).value.trim()||'My paradise';localStorage.setItem('inner-eden-favorite',JSON.stringify({name,settings:eden.target}));document.getElementById('save-favorite')!.textContent='Favorite saved';};
document.getElementById('load-favorite')!.onclick=()=>{try{const favorite=JSON.parse(localStorage.getItem('inner-eden-favorite')||'null');if(favorite?.settings){eden.set(favorite.settings);syncSliders();edenControls.rebuild();}}catch{}};
document.getElementById('bedroom-link')!.onclick=()=>returnDoor.open();
startButton.addEventListener('click',()=>{void ambience.start();});syncSliders();
renderer.xr.addEventListener('sessionstart',()=>{movementInput.clear();document.body.classList.add('xr-mode');});
renderer.xr.addEventListener('sessionend',()=>{movementInput.clear();document.body.classList.remove('xr-mode');});
canvas.addEventListener('click',event=>{if(renderer.xr.isPresenting||!welcome.hidden)return;const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(event.clientX/window.innerWidth*2-1,1-event.clientY/window.innerHeight*2),camera);if(ray.intersectObject(returnDoor.hit).length)returnDoor.open();});

renderer.xr.addEventListener('sessionstart', () => {
  credit?.hide();
  const session = renderer.xr.getSession();
  session?.addEventListener('visibilitychange', () => {
    const context = satieAudio?.engine.audioContext;
    if (!context) {
      return;
    }
    const transition = session.visibilityState === 'hidden' ? context.suspend() : context.resume();
    void transition.catch((error: unknown) => {
      console.error('Could not update audio for headset visibility:', error);
    });
  });
});

renderer.xr.addEventListener('sessionend', () => {
  void satieAudio?.engine.audioContext.resume().catch((error: unknown) => {
    console.error('Could not resume audio after leaving VR:', error);
  });
});

let lastPointerX = 0;
let lastPointerY = 0;
let dragging = false;

canvas.addEventListener('pointerdown', (event) => {
  if (renderer.xr.isPresenting) {
    return;
  }
  dragging = true;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener('pointermove', (event) => {
  if (!dragging || renderer.xr.isPresenting) {
    return;
  }
  rig.rotation.y -= (event.clientX - lastPointerX) * 0.004;
  camera.rotation.x = THREE.MathUtils.clamp(
    camera.rotation.x - (event.clientY - lastPointerY) * 0.003,
    -Math.PI / 2,
    Math.PI / 2,
  );
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
});

canvas.addEventListener('pointerup', () => {
  dragging = false;
});
canvas.addEventListener('pointercancel', () => {
  dragging = false;
});

const movement = new THREE.Vector3();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
let previousFrameTime = 0;

function updateMovement(deltaSeconds: number): void {
  if (pressedKeys.size === 0 || !canWalk()) {
    return;
  }

  const forwardAmount =
    Number(pressedKeys.has('KeyW') || pressedKeys.has('ArrowUp')) -
    Number(pressedKeys.has('KeyS') || pressedKeys.has('ArrowDown'));
  const rightAmount =
    Number(pressedKeys.has('KeyD') || pressedKeys.has('ArrowRight')) -
    Number(pressedKeys.has('KeyA') || pressedKeys.has('ArrowLeft'));
  if (forwardAmount === 0 && rightAmount === 0) {
    return;
  }

  forward.set(0, 0, -1).applyQuaternion(rig.quaternion);
  forward.y = 0;
  forward.normalize();
  right.set(1, 0, 0).applyQuaternion(rig.quaternion);
  right.y = 0;
  right.normalize();
  movement
    .set(0, 0, 0)
    .addScaledVector(forward, forwardAmount)
    .addScaledVector(right, rightAmount)
    .normalize();

  rig.position.addScaledVector(movement, 2.5 * deltaSeconds);
  const bounds=islandBounds(rig.position.x,rig.position.z);rig.position.x=bounds.x;rig.position.z=bounds.z;rig.position.y=islandHeight(bounds.x,bounds.z);
}

renderer.setAnimationLoop((time) => {
  const deltaSeconds = previousFrameTime === 0
    ? 0
    : Math.min((time - previousFrameTime) / 1000, 0.05);
  previousFrameTime = time;
  movementInput.tick(canWalk());updateMovement(deltaSeconds);
  const listener=edenControls.update(deltaSeconds);outdoorTraces.update(deltaSeconds);eden.update(deltaSeconds,time/1000);ambience.update(listener,eden.settings,time/1000);returnDoor.update(deltaSeconds);
  worldRoot.updateMatrixWorld(true);
  satieAudio?.update(listener);
  renderer.render(scene, camera);
});

window.addEventListener('pagehide', () => {
  mixer?.destroy();
  credit?.destroy();
  satieAudio?.dispose();
  renderer.dispose();
});

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required page element: #${id}`);
  }
  return element as T;
}
