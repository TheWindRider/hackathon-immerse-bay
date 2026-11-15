import * as THREE from 'three';
import {islandBounds,islandHeight,moods} from './paradise-world.js';
type Button=THREE.Mesh<THREE.PlaneGeometry,THREE.MeshBasicMaterial>;
export class EdenControls{
  menu=new THREE.Group();buttons:Button[]=[];sources:Array<{object:THREE.Group;source:XRInputSource|null;held:boolean;previous:boolean[]}>=[];
  dock:Button;paused=false;snap=true;teleporting:THREE.Group|null=null;
  ray=new THREE.Raycaster();worldHead=new THREE.PerspectiveCamera();savedPosition=new THREE.Vector3();savedRotation=new THREE.Quaternion();
  constructor(public scene:THREE.Scene,public renderer:THREE.WebGLRenderer,public camera:THREE.PerspectiveCamera,public rig:THREE.Group,public eden:ReturnType<typeof import('./paradise-world.js').buildParadise>,public door:ReturnType<typeof import('./paradise-world.js').createDoor>){
    scene.add(this.menu);this.menu.visible=false;this.rebuild();
    this.dock=this.button('MENU / EDEN',0,0,.34,.09,()=>this.toggle(),false);scene.add(this.dock);this.dock.visible=false;this.dock.material.depthTest=false;this.dock.renderOrder=100;
    for(let i=0;i<2;i++){const object=renderer.xr.getController(i);rig.add(object);const beam=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-8)]),new THREE.LineBasicMaterial({color:'#e5fbba'}));object.add(beam);const data={object,source:null as XRInputSource|null,held:false,previous:[] as boolean[]};this.sources.push(data);
      object.addEventListener('connected',event=>{data.source=event.data;});object.addEventListener('disconnected',()=>{data.source=null;data.held=false;});
      object.addEventListener('selectstart',()=>{this.setRay(object);const hits=this.ray.intersectObjects(this.menu.visible?[...this.buttons,this.dock,door.hit]:[this.dock,door.hit]);const hit=hits[0];if(hit){hit.object.userData.action?.();hit.object.userData.portal?.();}else if(data.source?.handedness==='left')this.teleporting=object;});
      object.addEventListener('selectend',()=>{if(this.teleporting===object&&!this.paused){const point=this.floorPoint(object);if(point){const head=this.head();rig.position.x+=point.x-head.position.x;rig.position.z+=point.z-head.position.z;}}this.teleporting=null;});
    }
    renderer.xr.addEventListener('sessionstart',()=>{this.savedPosition.copy(camera.position);this.savedRotation.copy(camera.quaternion);camera.position.set(0,0,0);camera.quaternion.identity();this.dock.visible=true;this.show();});
    renderer.xr.addEventListener('sessionend',()=>{camera.position.copy(this.savedPosition);camera.quaternion.copy(this.savedRotation);this.menu.visible=false;this.dock.visible=false;this.teleporting=null;});
  }
  head(){this.rig.updateMatrixWorld(true);this.renderer.xr.updateCamera(this.camera);const xr=this.renderer.xr.getCamera();xr.matrixWorld.decompose(this.worldHead.position,this.worldHead.quaternion,this.worldHead.scale);this.worldHead.updateMatrixWorld();return this.worldHead;}
  setRay(object:THREE.Object3D){object.updateWorldMatrix(true,false);this.ray.set(new THREE.Vector3().setFromMatrixPosition(object.matrixWorld),new THREE.Vector3(0,0,-1).transformDirection(object.matrixWorld));}
  floorPoint(object:THREE.Object3D){this.setRay(object);const point=new THREE.Vector3();return this.ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),point)&&this.ray.ray.origin.distanceTo(point)<30?point:null;}
  button(text:string,x:number,y:number,w:number,h:number,action:()=>void,attach=true){const canvas=document.createElement('canvas');canvas.width=Math.round(w*800);canvas.height=Math.round(h*800);const context=canvas.getContext('2d')!;context.fillStyle='#254c43';context.fillRect(0,0,canvas.width,canvas.height);context.fillStyle='#fbf7df';context.font=`${Math.min(34,canvas.height*.38)}px system-ui`;context.textAlign='center';context.textBaseline='middle';context.fillText(text,canvas.width/2,canvas.height/2);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const button=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));button.position.set(x,y,.02);button.userData.action=action;if(attach){this.menu.add(button);this.buttons.push(button);}return button;}
  rebuild(){for(const object of this.buttons){object.geometry.dispose();object.material.map?.dispose();object.material.dispose();this.menu.remove(object);}this.buttons=[];
    this.button('INNER EDEN - shape your paradise',0,.8,2.1,.13,()=>{});
    Object.entries(moods).forEach(([name,values],i)=>this.button(name,(i-1)*.72,.57,.68,.15,()=>{this.eden.set(values);this.rebuild();}));
    (['energy','nature','dreaminess'] as const).forEach((key,i)=>{const y=.3-i*.25;this.button(`${key}: ${Math.round(this.eden.target[key]*100)}%`,0,y,1.2,.16,()=>{});this.button('−',-.87,y,.35,.16,()=>{this.eden.set({[key]:this.eden.target[key]-.1});this.rebuild();});this.button('+',.87,y,.35,.16,()=>{this.eden.set({[key]:this.eden.target[key]+.1});this.rebuild();});});
    this.button(this.paused?'Resume walking':'Pause here',-.55,-.48,1.05,.15,()=>{this.paused=!this.paused;this.rebuild();});this.button('Save favorite',.55,-.48,1.05,.15,()=>{localStorage.setItem('inner-eden-favorite',JSON.stringify({name:'My paradise',settings:this.eden.target}));});
    this.button('Return to bedroom',-.55,-.72,1.05,.15,()=>this.door.open());this.button('Close',.55,-.72,1.05,.15,()=>{this.menu.visible=false;});
  }
  show(){const head=this.head(),forward=new THREE.Vector3(0,0,-1).applyQuaternion(head.quaternion);forward.y=0;forward.normalize();this.menu.position.copy(head.position).addScaledVector(forward,1.6);this.menu.quaternion.setFromRotationMatrix(new THREE.Matrix4().lookAt(head.position,this.menu.position,new THREE.Vector3(0,1,0)));this.menu.visible=true;this.rebuild();}
  toggle(){if(this.menu.visible)this.menu.visible=false;else this.show();}
  update(dt:number){if(!this.renderer.xr.isPresenting)return this.camera;const head=this.head();const forward=new THREE.Vector3(0,0,-1).applyQuaternion(head.quaternion);forward.y=0;forward.normalize();
    for(const data of this.sources){const source=data.source;if(!source?.gamepad)continue;const axes=source.gamepad.axes,x=axes.length>=4?axes[2]:axes[0]||0,y=axes.length>=4?axes[3]:axes[1]||0;
      if(source.handedness==='left'&&!this.paused){const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0));this.rig.position.addScaledVector(forward,Math.abs(y)>.18?-y*dt*2:0).addScaledVector(right,Math.abs(x)>.18?x*dt*2:0);}
      if(source.handedness==='right'){if(Math.abs(x)<.3)this.snap=true;if(Math.abs(x)>.7&&this.snap){const p=this.head().position.clone(),q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-Math.sign(x)*Math.PI/6);this.rig.position.sub(p).applyQuaternion(q).add(p);this.rig.quaternion.premultiply(q);this.snap=false;}}
      for(const i of [3,4]){const pressed=!!source.gamepad.buttons[i]?.pressed;if(pressed&&!data.previous[i])this.toggle();data.previous[i]=pressed;}
    }
    const current=this.head(),bound=islandBounds(current.position.x,current.position.z);this.rig.position.x+=bound.x-current.position.x;this.rig.position.z+=bound.z-current.position.z;this.rig.position.y=islandHeight(bound.x,bound.z);
    const updated=this.head();this.dock.position.set(0,-.24,-.75).applyQuaternion(updated.quaternion).add(updated.position);this.dock.quaternion.copy(updated.quaternion);this.menu.updateMatrixWorld(true);return updated;
  }
}
