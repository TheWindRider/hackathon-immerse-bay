import {SatieScene} from 'satie-runtime/three';
import {badge} from 'satie-runtime/badge';
import {SoundEngine} from './audio.js';

const authored=new Set(['books','fan','clock','bird','tv','record','rain']);
const recordedMusic=new Set(['piano','strings']);
const BIRD_GAIN_MULTIPLIER=10;

// SATIE owns the seven authored sound types. Recorded music plays through
// the room's Web Audio player because this SATIE Free plan has no music voices.
export class SatieSoundEngine {
  constructor(){
    this.legacy=new SoundEngine();this.ctx=null;this.playing=false;this.preset='studio';
    this.hosts=new Map();this.scene=null;this.mixer=null;this.credit=null;this.ready=null;this.mixerOpen=false;
  }
  attach({scene,camera,renderer}){
    this.world=scene;this.camera=camera;this.renderer=renderer;
    this.ready=(async()=>{
      const response=await fetch('/satie/scene.contract.json');
      if(!response.ok)throw new Error('SATIE scene contract could not load');
      const contract=await response.json();
      this.scene=await SatieScene.load('/satie/scene.satie','/satie/samples.json',{contract,seed:7});
      this.scene.bindListener(camera);
      this.scene.state(this.preset);
      if(import.meta.env.DEV){
        const {mountMixer}=await import('satie-runtime/three');
        this.mixer=mountMixer(this.scene,{scene,camera,renderer,script:'/satie/scene.satie',samples:'/satie/samples.json',collapsed:true,
          context:()=>this.scene.authoringContext(),
          look:{get:()=>({yaw:camera.rotation.y,pitch:camera.rotation.x}),set:(yaw,pitch)=>{camera.rotation.y=yaw;camera.rotation.x=pitch;}},
          teleport:(x,z,yaw)=>{camera.position.x=x;camera.position.z=z;camera.rotation.y=yaw;},
          onOpenChange:open=>{this.mixerOpen=open;this.credit?.setPanelOpen(open);this.onMixerOpenChange?.(open);}});
      }
    })();
    this.credit=badge({dev:import.meta.env.DEV,ready:this.ready,onOpen:()=>this.openMixer()});
    this.credit.intro();
    return this.ready;
  }
  openMixer(){this.mixer?.open();}
  closeMixer(){this.mixer?.close();}
  prepare(sources){for(const s of sources)if(authored.has(s.sound))this.add(s);}
  async start(sources,traces=[]){
    if(!this.scene)throw new Error('SATIE audio is still loading');
    if(!this.ctx){
      for(const s of sources)if(authored.has(s.sound))this.add(s);
      this.ctx=true;
    }
    // Both play requests begin in the click handler's user gesture.
    const satiePlay=this.scene.start();
    const recordedPlay=this.legacy.start([...sources.filter(s=>recordedMusic.has(s.sound)),...traces.map(t=>t.player)]);
    await Promise.all([satiePlay,recordedPlay]);
    this.playing=true;this.credit?.hide();
  }
  async add(s){
    if(recordedMusic.has(s.sound))return this.legacy.add(s);
    if(!authored.has(s.sound)||!this.scene)return;
    const current=this.hosts.get(s.sound);
    if(current&&current!==s)throw new Error(`Only one ${s.name} can be mixed independently in SATIE`);
    this.hosts.set(s.sound,s);
    this.scene.bind(s.sound,s.type==='bird'?s.birds[0].group:s.group);
    if(s.type==='bird')for(let i=1;i<s.birds.length;i++)if(s.birds[i].active)this.scene.bind(`bird_${i+1}`,s.birds[i].group);
    this.mute(s);
  }
  remove(s){
    if(recordedMusic.has(s.sound))return this.legacy.remove(s);
    if(this.hosts.get(s.sound)===s){
      this.scene?.unbind(s.sound);
      if(s.type==='bird')for(const id of ['bird_2','bird_3'])this.scene?.unbind(id);
      this.hosts.delete(s.sound);
    }
  }
  async toggle(sources,traces=[]){
    if(!this.ctx)return this.start(sources,traces);
    if(this.playing){this.scene.stop();await this.legacy.ctx?.suspend();this.legacy.playing=false;this.playing=false;this.credit?.intro();}
    else await this.start(sources,traces);
  }
  move(s){if(recordedMusic.has(s.sound))this.legacy.move(s);}
  addTrace(trace){return this.legacy.add(trace);}
  removeTrace(trace){this.legacy.remove(trace);}
  moveTrace(trace,x,z){this.legacy.moveTo(trace,x,z);}
  muteTrace(trace){this.legacy.mute(trace);}
  setBirdActive(s,index,active){
    if(index===0||this.hosts.get('bird')!==s)return;
    const id=`bird_${index+1}`;
    if(active)this.scene?.bind(id,s.birds[index].group);
    else this.scene?.unbind(id);
  }
  mute(s){
    if(recordedMusic.has(s.sound))return this.legacy.mute(s);
    if(!this.scene||!authored.has(s.sound))return;
    const volume=s.muted?0:s.volume*(s.sound==='bird'?BIRD_GAIN_MULTIPLIER:1);
    this.scene.engine.scriptStatements.forEach((voice,index)=>{
      if(voice.sourceId===s.sound||voice.sourceId===`${s.sound}_cathedral`||s.type==='bird'&&/^bird_[23](?:_cathedral)?$/.test(voice.sourceId))this.scene.engine.setStatementVolume(index,volume);
    });
  }
  setPreset(name){this.preset=name;this.scene?.state(name);this.legacy.setPreset(name);}
  listener(camera){this.scene?.update(camera);this.legacy.listener(camera);}
}
