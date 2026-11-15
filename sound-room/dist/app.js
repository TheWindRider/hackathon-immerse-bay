import * as THREE from './vendor/three.module.js';
import { SoundEngine } from './audio.js';
import { catalog, bedroom, buildObject } from './objects.js';
const $=s=>document.querySelector(s), engine=new SoundEngine();
const sources=[];let nextId=1;
const scene=new THREE.Scene(); scene.background=new THREE.Color('#172329'); scene.fog=new THREE.FogExp2('#172329',.045);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.08,65); camera.rotation.order='YXZ';
const renderer=new THREE.WebGLRenderer({antialias:true}); renderer.setSize(innerWidth,innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.25;
$('#world').append(renderer.domElement);
scene.add(new THREE.HemisphereLight('#c4dbe1','#28302c',2));
const key=new THREE.DirectionalLight('#ffe2bd',3); key.position.set(-3,7,4); key.castShadow=true; key.shadow.mapSize.set(2048,2048); key.shadow.camera.left=-8; key.shadow.camera.right=8; key.shadow.camera.top=8; key.shadow.camera.bottom=-8; scene.add(key);
const mat=(color,roughness=.7,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const wood=mat('#4c4137'),dark=mat('#182225'),metal=mat('#9aa7a4',.25,.7),ivory=mat('#e7e1c9'),bronze=mat('#c8a66c',.3,.55);
function box(parent,w,h,d,x,y,z,m){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function cylinder(parent,r1,r2,h,x,y,z,m){const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,40),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
const architecture=new THREE.Group(); scene.add(architecture);
box(scene,12,.15,12,0,-.1,0,mat('#394444'));
for(let i=-6;i<=6;i+=.6) box(scene,.012,.005,12,i,.002,0,mat('#6a7267'));
box(architecture,12,4,.18,0,2,-6,mat('#354247'));
box(architecture,.18,4,12,-6,2,0,mat('#303a3e'));
box(architecture,.18,4,12,6,2,0,mat('#354247'));
for(let x=-5;x<=5;x+=2){box(architecture,.5,2.5,.16,x,2,-5.85,dark);for(let j=0;j<5;j++)box(architecture,.035,2.4,.09,x-.18+j*.09,2,-5.72,wood);}
for(let x of [-5.7,5.7]) {box(architecture,.045,.035,10,x,.12,0,mat('#b6ca96'));}
const cathedral=new THREE.Group(); cathedral.visible=false;scene.add(cathedral);
for(let side of [-1,1])for(let z=-5;z<=5;z+=2.5){cylinder(cathedral,.26,.35,9,side*5.6,4.5,z,mat('#637274'));box(cathedral,.8,.2,.8,side*5.6,.1,z,mat('#71807e'));}
// High vault ribs preserve the same walkable footprint.
for(let z=-5;z<=5;z+=2.5){const curve=new THREE.EllipseCurve(0,6,5.6,3.8,0,Math.PI,false,0);const points=curve.getPoints(50).map(p=>new THREE.Vector3(p.x,p.y,z)); const rib=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),50,.08,8,false),mat('#84908a'));cathedral.add(rib);}
const ceilingLight=new THREE.PointLight('#b8d5eb',18,20);ceilingLight.position.set(0,6,-3);scene.add(ceilingLight);
const pickables=[];
function mount(s){
  const group=s.group=new THREE.Group(); group.position.set(s.x,0,s.z);group.rotation.y=s.rotation||0; scene.add(group);
  const accent=mat(s.color);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(s.radius,.012,8,80),new THREE.MeshBasicMaterial({color:s.color}));ring.rotation.x=Math.PI/2;ring.position.y=.09;group.add(ring);s.ring=ring;
  if(buildObject(s,group,{box,cylinder,mat,wood,dark,ivory,metal})){} else if(s.type==='piano'){
    box(group,1.7,.52,.75,0,1.05,0,dark);box(group,1.76,.08,.85,0,1.35,0,wood);
    for(let i=0;i<21;i++)box(group,.068,.05,.32,-.74+i*.074,.96,.48,ivory);
    for(let i=0;i<20;i++)if(![2,6].includes(i%7))box(group,.043,.05,.2,-.70+i*.074,1,.4,dark);
    for(let x of [-.68,.68])for(let z of [-.22,.22])box(group,.07,.8,.07,x,.43,z,dark);
    box(group,.65,.1,.32,0,.52,.95,wood);for(let x of [-.25,.25])box(group,.06,.5,.25,x,.25,.95,dark);
  } else if(s.type==='drums') {
    const bass=cylinder(group,.42,.42,.5,0,.47,.25,accent);bass.rotation.x=Math.PI/2;
    const face=cylinder(group,.39,.39,.02,0,.47,.51,ivory);face.rotation.x=Math.PI/2;
    for(let x of [-.46,.43]){cylinder(group,.25,.25,.3,x,.9,-.05,accent);cylinder(group,.25,.25,.02,x,1.06,-.05,ivory);}
    for(let x of [-.8,.8]){cylinder(group,.025,.025,1.2,x,.6,-.35,metal);cylinder(group,.38,.38,.025,x,1.2,-.35,bronze);}
    cylinder(group,.26,.26,.08,0,.5,-.65,dark);cylinder(group,.04,.04,.45,0,.25,-.65,metal);
    // Minimal musician: head, torso and stick arms.
    const head=new THREE.Mesh(new THREE.SphereGeometry(.15,20,20),mat('#c4ab91'));head.position.set(0,1.55,-.65);group.add(head);
    box(group,.34,.45,.22,0,1.18,-.65,mat('#667f80'));
    for(let x of [-.2,.2]){const stick=box(group,.025,.025,.55,x,1.2,-.24,wood);stick.rotation.x=-.2;}
  } else {
    box(group,1.4,2.2,.08,0,1.2,0,dark);box(group,1.2,1.95,.05,0,1.2,.06,new THREE.MeshStandardMaterial({color:'#659aa9',transparent:true,opacity:.38,metalness:.5,roughness:.1}));
    box(group,.04,2.1,.09,0,1.2,.1,metal);box(group,1.35,.04,.09,0,1.2,.1,metal);
    const drops=[];for(let i=0;i<75;i++)drops.push((Math.random()-.5)*1.15,Math.random()*1.9+.23,.13);
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(drops,3));s.drops=new THREE.Points(geometry,new THREE.PointsMaterial({color:s.color,size:.024}));group.add(s.drops);
  }
  const glow=new THREE.PointLight(s.color,2,4);glow.position.y=1.8;group.add(glow);
  group.traverse(o=>{if(o.isMesh){o.userData.source=s;pickables.push(o);}});
  const label=document.createElement('div');label.className='source-label';label.style.setProperty('--c',s.color);label.textContent=s.name.toUpperCase()+' ↔';$('#source-labels').append(label);s.label=label;
  const row=document.createElement('div');row.className='track';row.style.setProperty('--c',s.color);
  row.innerHTML=`<div class="track-top"><span class="swatch"></span><div class="track-title">${s.name}<small>${s.desc}</small></div>${s.sound?`<button class="mute" aria-pressed="${!!s.muted}" aria-label="${s.muted?'Unmute':'Mute'} ${s.name}">${s.muted?'Unmute':'Mute'}</button>`:'<span class="quiet-badge">Quiet</span>'}<button class="remove-object" aria-label="Remove ${s.name}">×</button></div><div class="track-bottom"><div class="arrows">${[['←',-.5,0],['↑',0,-.5],['↓',0,.5],['→',.5,0]].map(([label,x,z])=>`<button aria-label="Move ${s.name} ${label}" data-x="${x}" data-z="${z}">${label}</button>`).join('')}</div><div class="meter">${[6,12,8,15,10,5,11,7].map(h=>`<i style="--h:${h}px"></i>`).join('')}</div></div>`;
  if(s.sound)row.querySelector('.mute').onclick=e=>{s.muted=!s.muted;engine.mute(s);e.target.textContent=s.muted?'Unmute':'Mute';e.target.setAttribute('aria-pressed',s.muted);e.target.setAttribute('aria-label',`${s.muted?'Unmute':'Mute'} ${s.name}`);row.querySelector('.meter').style.opacity=s.muted?.15:1;saveLayout();};
  row.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>move(s,s.x+Number(b.dataset.x),s.z+Number(b.dataset.z)));
  const tools=document.createElement('div');tools.className='object-tools';
  tools.innerHTML=`<button class="rotate" aria-label="Rotate ${s.name}">↻ Rotate</button>${s.sound?`<label>Volume <input aria-label="${s.name} volume" type="range" min="0" max="100" value="${Math.round(s.volume*100)}"></label>`:''}`;
  tools.querySelector('.rotate').onclick=()=>{s.rotation=(s.rotation||0)+Math.PI/4;s.group.rotation.y=s.rotation;saveLayout();};
  const volume=tools.querySelector('input');if(volume)volume.oninput=()=>{s.volume=Number(volume.value)/100;engine.mute(s);saveLayout();};
  row.append(tools);row.querySelector('.remove-object').onclick=()=>removeObject(s);
  $('#tracks').append(row);s.row=row;
  const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('r',7);dot.setAttribute('fill',s.color);dot.dataset.id=s.id;dot.innerHTML=`<title>${s.name}: drag to move</title>`;$('#map-dots').append(dot);s.dot=dot;
}
function move(s,x,z){s.x=THREE.MathUtils.clamp(x,-6+s.radius,6-s.radius);s.z=THREE.MathUtils.clamp(z,-6+s.radius,6-s.radius);s.group.position.set(s.x,0,s.z);engine.move(s);saveLayout();}
let comparisonTimer,toastTimer;
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
function setPreset(name){engine.setPreset(name);for(const n of ['studio','cathedral']){$('#'+n).classList.toggle('active',n===name);$('#'+n).setAttribute('aria-pressed',n===name);}cathedral.visible=name==='cathedral';architecture.scale.y=name==='cathedral'?2.5:1;$('#acoustic-note').textContent=name==='cathedral'?'Long reflections · 5.5 s tail':'Short reflections · 0.35 s tail';scene.fog.density=name==='cathedral'?.028:.045;}
for(const name of ['studio','cathedral'])$('#'+name).onclick=()=>{clearTimeout(comparisonTimer);$('#compare').disabled=false;$('#compare').textContent='↔ Hear the before / after';setPreset(name);toast(name==='studio'?'Small studio · intimate & dry':'Large cathedral · same performance, different space');};
async function start(){try{await engine.start(sources);$('#welcome').classList.add('hidden');syncPlayback();}catch(e){toast('Audio could not start. Please retry.');console.error(e);}}
function syncPlayback(){$('#sound').textContent=engine.playing?'Ⅱ Pause listening':'▶ Start listening';$('#status').textContent=engine.playing?'LIVE / SATIE AUDIO':'PAUSED';}
$('#enter').onclick=start;
$('#sound').onclick=async()=>{try{await engine.toggle(sources);syncPlayback();}catch(e){toast('Unable to start audio. Please retry.');console.error(e);}};
$('#compare').onclick=async()=>{if(!engine.playing){await start();if(!engine.playing)return;}setPreset('studio');toast('Before: small studio. Listen to the dry notes…');$('#compare').disabled=true;$('#compare').textContent='Listening to the studio…';comparisonTimer=setTimeout(()=>{setPreset('cathedral');toast('After: large cathedral. Same loops, longer reflections.');$('#compare').disabled=false;$('#compare').textContent='↔ Hear the before / after';},4500);};
function resetCamera(){camera.position.set(0,1.7,5);camera.rotation.set(-.08,0,0);}
resetCamera();
$('#reset').onclick=()=>{clearTimeout(comparisonTimer);$('#compare').disabled=false;$('#compare').textContent='↔ Hear the before / after';for(const s of [...sources])removeObject(s,false);for(const item of bedroom)addObject(item.type,item,false);setPreset('studio');resetCamera();saveLayout();toast('Bedroom restored. Add objects to make it yours.');};
$('#help').onclick=()=>$('#help-dialog').showModal();$('#close-help').onclick=()=>$('#help-dialog').close();
const keys=new Set();addEventListener('keydown',e=>{if($('#welcome').classList.contains('hidden')&&!$('#help-dialog').open&&!$('#library').open&&!['BUTTON','INPUT'].includes(document.activeElement.tagName)){if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}}});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();drag=null;looking=false;});
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),floor=new THREE.Plane(new THREE.Vector3(0,1,0),0),hit=new THREE.Vector3();let drag=null,looking=false,lastX=0,lastY=0;
function ray(e){pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);}
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
renderer.domElement.addEventListener('pointerdown',e=>{if(!$('#welcome').classList.contains('hidden'))return;if(e.button===2){looking=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);return;}if(document.pointerLockElement)return;ray(e);const hits=raycaster.intersectObjects(pickables);if(hits.length){drag=hits[0].object.userData.source;renderer.domElement.setPointerCapture(e.pointerId);toast(`Moving ${drag.name}. Drag across the floor.`);}else renderer.domElement.requestPointerLock?.()?.catch?.(()=>toast('Hold right mouse and drag to look around.'));});
addEventListener('pointermove',e=>{if(document.pointerLockElement===renderer.domElement){camera.rotation.y-=e.movementX*.002;camera.rotation.x=THREE.MathUtils.clamp(camera.rotation.x-e.movementY*.002,-1.1,1.1);}else if(looking){camera.rotation.y-=(e.clientX-lastX)*.004;camera.rotation.x=THREE.MathUtils.clamp(camera.rotation.x-(e.clientY-lastY)*.004,-1.1,1.1);lastX=e.clientX;lastY=e.clientY;}else if(drag){ray(e);if(raycaster.ray.intersectPlane(floor,hit))move(drag,hit.x,hit.z);}});
addEventListener('pointerup',()=>{drag=null;looking=false;});document.addEventListener('pointerlockchange',()=>{document.body.classList.toggle('locked',document.pointerLockElement===renderer.domElement);keys.clear();});
let mapDrag=null;const map=$('#map');function moveMap(e){const rect=map.getBoundingClientRect();move(mapDrag,((e.clientX-rect.left)/rect.width*200-100)/15,((e.clientY-rect.top)/rect.height*200-100)/15);}
map.addEventListener('pointerdown',e=>{const s=sources.find(s=>s.id===e.target.dataset.id);if(s){mapDrag=s;map.setPointerCapture(e.pointerId);moveMap(e);}});map.addEventListener('pointermove',e=>{if(mapDrag)moveMap(e);});map.addEventListener('pointerup',()=>mapDrag=null);map.addEventListener('pointercancel',()=>mapDrag=null);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
const clock=new THREE.Clock(),v=new THREE.Vector3(),proj=new THREE.Vector3();let elapsed=0;
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05);elapsed+=dt;
  if(!$('#help-dialog').open&&!$('#library').open){const f=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown')),r=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));v.set(r,0,-f);if(v.lengthSq()){v.normalize().applyAxisAngle(new THREE.Vector3(0,1,0),camera.rotation.y).multiplyScalar(dt*2.5);camera.position.add(v);camera.position.x=THREE.MathUtils.clamp(camera.position.x,-5.35,5.35);camera.position.z=THREE.MathUtils.clamp(camera.position.z,-5.35,5.35);}}
  camera.updateMatrixWorld();engine.listener(camera);
  for(const s of sources){s.dot.setAttribute('cx',100+s.x*15);s.dot.setAttribute('cy',100+s.z*15);proj.set(s.x,s.height,s.z).project(camera);s.label.style.left=(proj.x*.5+.5)*innerWidth+'px';s.label.style.top=(-proj.y*.5+.5)*innerHeight+'px';s.label.style.display=proj.z<1&&Math.abs(proj.x)<1?'block':'none';s.ring.material.opacity=s.muted?.2:1;s.ring.material.transparent=true;
    if(s.drops&&engine.playing){const a=s.drops.geometry.attributes.position;for(let i=0;i<a.count;i++){a.array[i*3+1]-=dt*1.3;if(a.array[i*3+1]<.23)a.array[i*3+1]=2.13;}a.needsUpdate=true;}
    if(s.spinner&&engine.playing&&!s.muted)s.spinner.rotation.z-=dt*12;
    const bars=s.row.querySelectorAll('.meter i');bars.forEach((b,i)=>b.style.transform=`scaleY(${engine.playing&&s.sound&&!s.muted?.4+.6*Math.abs(Math.sin(elapsed*4+i*1.2)): .15})`);
  }
  $('#listener').setAttribute('transform',`translate(${100+camera.position.x*15},${100+camera.position.z*15}) rotate(${-camera.rotation.y*180/Math.PI})`);
  renderer.render(scene,camera);
}

function saveLayout(){try{localStorage.setItem('sound-room-bedroom-v1',JSON.stringify(sources.map(s=>({type:s.type,x:s.x,z:s.z,rotation:s.rotation||0,volume:s.volume,muted:!!s.muted}))));}catch{}}
function updateCount(){$('#object-count').textContent=String(sources.length).padStart(2,'0');}
function addObject(type,options={},persist=true){
  if(sources.length>=24){toast('Room full: remove an object before adding another.');return;}
  const item=catalog.find(c=>c.type===type);if(!item)return;
  const forward=new THREE.Vector3(0,0,-2.5).applyAxisAngle(new THREE.Vector3(0,1,0),camera.rotation.y);
  const s={...item,id:`${type}-${nextId++}`,x:camera.position.x+forward.x,z:camera.position.z+forward.z,volume:item.volume||0,...options,type};
  s.x=THREE.MathUtils.clamp(s.x,-6+s.radius,6-s.radius);s.z=THREE.MathUtils.clamp(s.z,-6+s.radius,6-s.radius);
  sources.push(s);mount(s);updateCount();
  if(engine.ctx)engine.add(s).catch(error=>{toast(`${s.name} sound could not load. Remove and re-add to retry.`);console.error(error);});
  if(persist){saveLayout();toast(`${s.name} added. Drag to place it.`);}
  return s;
}
function removeObject(s,persist=true){
  s.removed=true;engine.remove(s);if(drag===s)drag=null;if(mapDrag===s)mapDrag=null;
  for(let i=pickables.length-1;i>=0;i--)if(pickables[i].userData.source===s)pickables.splice(i,1);
  scene.remove(s.group);s.group.traverse(o=>{o.geometry?.dispose();});s.row.remove();s.dot.remove();s.label.remove();sources.splice(sources.indexOf(s),1);updateCount();if(persist)saveLayout();
}
$('#add-object').onclick=()=>{keys.clear();if(document.pointerLockElement)document.exitPointerLock();$('#library').showModal();};
$('#close-library').onclick=()=>$('#library').close();
let category='All';
function renderLibrary(){const query=$('#object-search').value.toLowerCase();const list=catalog.filter(item=>(category==='All'||item.category===category)&&`${item.name} ${item.desc}`.toLowerCase().includes(query));$('#object-library').replaceChildren();
  for(const item of list){const button=document.createElement('button');button.className='catalog-item';button.style.setProperty('--c',item.color);button.innerHTML=`<span class="catalog-icon">${{bed:'▰',books:'▤',shelf:'▥',lamp:'♧',rug:'▱',plant:'♧',fan:'✣',clock:'◷',bird:'♪',tv:'▣',record:'◉',rain:'☂',piano:'♬',drums:'◌'}[item.type]}</span><span><b>${item.name}</b><small>${item.desc}</small></span><span class="catalog-plus">+</span>`;button.setAttribute('aria-label',`Add ${item.name}`);button.onclick=()=>addObject(item.type);$('#object-library').append(button);}
  if(!list.length)$('#object-library').textContent='No objects match. Try a different search.';
}
$('#object-search').oninput=renderLibrary;
document.querySelectorAll('[data-category]').forEach(button=>button.onclick=()=>{category=button.dataset.category;document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',b===button));renderLibrary();});
let layout=bedroom;try{const stored=JSON.parse(localStorage.getItem('sound-room-bedroom-v1'));if(Array.isArray(stored)&&stored.length<=24)layout=stored.filter(i=>i&&catalog.some(c=>c.type===i.type)&&Number.isFinite(i.x)&&Number.isFinite(i.z)).map(i=>({type:i.type,x:i.x,z:i.z,rotation:Number.isFinite(i.rotation)?i.rotation:0,volume:Number.isFinite(i.volume)?THREE.MathUtils.clamp(i.volume,0,1):catalog.find(c=>c.type===i.type).volume||0,muted:!!i.muted}));}catch{}
for(const item of layout)addObject(item.type,item,false);renderLibrary();

frame();
// Read-only diagnostics for local smoke checks.
window.soundRoom={getState:()=>({preset:engine.preset,playing:engine.playing,listener:camera.position.toArray(),sources:sources.map(({id,x,z,muted})=>({id,x,z,muted:!!muted}))})};
