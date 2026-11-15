import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SoundEngine} from './dist/audio.js';
import {catalog,bedroom,buildObject} from './dist/objects.js';
import {closestPointOnTrace,pointAlongTrace,traceLength,traceVisualStyle} from './dist/traces.js';
import * as THREE from 'three';
import {existsSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
class Node {constructor(){this.gain={value:0,setTargetAtTime(v){this.value=v;}};this.positionX={};this.positionY={};this.positionZ={};}connect(){return this;}disconnect(){this.disconnected=true;}start(...args){this.started=args;}stop(){this.stopped=true;}}
const ctx={currentTime:2,createBufferSource:()=>new Node(),createGain:()=>new Node(),createPanner:()=>new Node()};
test('every catalog sound has a bundled clip and starter furniture is valid',()=>{for(const item of catalog)if(item.sound)assert.ok(existsSync(`dist/audio/${item.sound}.mp3`),item.sound);for(const item of bedroom)assert.ok(catalog.some(c=>c.type===item.type));});
test('bundled recordings match the SATIE samples manifest',()=>{
 const samples=JSON.parse(readFileSync('dist/satie/samples.json','utf8'));
 const clips={books:'Audio/generation/paper_book_pages_turned_indivi',fan:'Audio/electric-heater-fan-running',clock:'Audio/generation/small_mechanical_alarm_clock_t',bird:'Audio/generation/one_small_songbird_giving_shor',tv:'Audio/generation/television_loudspeaker_reprodu',record:'Audio/generation/vinyl_record_rotating_in_an_un',rain:'Audio/steady-rain-on-pane-window'};
 for(const [name,key] of Object.entries(clips))assert.equal(createHash('sha256').update(readFileSync(`dist/audio/${name}.mp3`)).digest('hex'),samples[key].sha256,name);
});
test('the CC0 piano recording matches its fetched asset hash',()=>{
 assert.equal(createHash('sha256').update(readFileSync('dist/audio/piano.mp3')).digest('hex'),'be33ff5965d6b3d241a1336b3b4474fb62a1f5fe86ceae865b804e5458953d9c');
});
test('the slow viola and bass mix matches its source recordings',()=>{
 const hashes={
  'strings-viola':'74971e998c161ad0769b200776b7f112a1cefcb6f9e36557d64a8004f1879461',
  'strings-bass':'ab213a31fb0a75236b0e0b8ba465cfaf2fcdb2dfc37103bb3ec3975e44a2a3e7',
  strings:'1c9b61e741a36d051dbd6ee6f105cd938d14949b79ff92923b85e17e4694567e'
 };
 for(const [name,hash] of Object.entries(hashes))assert.equal(createHash('sha256').update(readFileSync(`dist/audio/${name}.mp3`)).digest('hex'),hash,name);
});
test('every bedroom model builds with finite geometry and stays within placement bounds',()=>{
 const mat=color=>new THREE.MeshStandardMaterial({color});const material=mat('#888888');
 const shape=(parent,geometry,x,y,z,m)=>{const mesh=new THREE.Mesh(geometry,m);mesh.position.set(x,y,z);parent.add(mesh);return mesh;};
 const kit={mat,wood:material,dark:material,ivory:material,metal:material,box:(p,w,h,d,x,y,z,m)=>shape(p,new THREE.BoxGeometry(w,h,d),x,y,z,m),cylinder:(p,a,b,h,x,y,z,m)=>shape(p,new THREE.CylinderGeometry(a,b,h,40),x,y,z,m)};
 for(const item of catalog.filter(c=>!['rain','piano','drums'].includes(c.type))){const group=new THREE.Group(),source={...item};assert.ok(buildObject(source,group,kit));group.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(group);assert.ok(Number.isFinite(bounds.min.x)&&bounds.max.y>0,item.type);assert.ok(Math.max(Math.abs(bounds.min.x),Math.abs(bounds.max.x),Math.abs(bounds.min.z),Math.abs(bounds.max.z))<=(item.type==='bird'?1.35:item.radius),item.type);if(item.type==='bird')assert.equal(source.birds.length,3);}
});
test('dynamic sources share decoded buffers, support mute and disconnect on removal',async()=>{
 const engine=new SoundEngine();engine.ctx=ctx;engine.dry=new Node();engine.rooms={studio:{convolution:new Node()}};engine.epoch=0;engine.cache.set('bird',Promise.resolve({duration:12}));
 const a={sound:'bird',x:1,z:2,volume:.3},b={sound:'bird',x:-2,z:0,volume:.2,muted:true};
 await Promise.all([engine.add(a),engine.add(b)]);assert.equal(a.audio.player.buffer,b.audio.player.buffer);assert.equal(b.audio.gain.gain.value,0);assert.equal(a.audio.panner.positionX.value,1);assert.equal(a.audio.player.started[1],2.03);
 a.muted=true;engine.mute(a);assert.equal(a.audio.gain.gain.value,0);const audio=a.audio;engine.remove(a);assert.equal(a.audio,null);assert.ok(audio.player.stopped&&audio.panner.disconnected);
});
test('silent furniture creates no audio and removed pending sources never start',async()=>{
 const engine=new SoundEngine();engine.ctx=ctx;await engine.add({type:'bed'});let finish;engine.cache.set('bird',new Promise(r=>finish=r));const s={sound:'bird'};const pending=engine.add(s);s.removed=true;finish({duration:12});await pending;assert.equal(s.audio,undefined);assert.equal(s.loading,false);
});
test('a sound trace emits from the nearest point on its segments',()=>{
 const points=[[0,0],[4,0],[4,3]];
 assert.equal(traceLength(points),7);
 assert.deepEqual(closestPointOnTrace(points,2,2),{x:2,z:0,distance:2});
 assert.deepEqual(closestPointOnTrace(points,6,1),{x:4,z:1,distance:2});
 assert.deepEqual(closestPointOnTrace(points,-1,-1),{x:0,z:0,distance:Math.SQRT2});
 assert.equal(closestPointOnTrace([],0,0),null);
});
test('trace visuals change with the selected sound',()=>{
 const effects=new Set(catalog.filter(item=>item.sound).map(item=>traceVisualStyle(item.sound).effect));
 assert.ok(effects.size>=7);
 assert.equal(traceVisualStyle('rain').effect,'drop');
 assert.equal(traceVisualStyle('strings').effect,'wave');
 assert.deepEqual(pointAlongTrace([[0,0],[4,0],[4,4]],.75),{x:4,z:2,angle:Math.PI/2});
});
