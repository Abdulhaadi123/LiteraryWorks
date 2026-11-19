import * as THREE from "three";
import {box, clamp01, easeOut, lerp, outline, run, shadowFloor, smooth, std, win, type Stage} from "../stage";

/**
 * Procedural enterprise architecture model. Everything is geometry, materials and light;
 * no imported .glb assets, screenshots, or baked labels. Deterministic scroll poses.
 */
export function createScene(stage: Stage) {
  const {world, camera} = stage;
  world.add(shadowFloor());
  const root = new THREE.Group();
  world.add(root);
  const colors = [0x264e68, 0x467986, 0xb48d55, 0x3e6885, 0x5c8990, 0x94764c];
  const slabColor = 0xe3e9e6, baseColor = 0x1a3449, pale = 0xf5f4ea;
  const base = outline(box(6.8, 0.34, 5.5, baseColor), 0x9cb9b9);
  base.position.y = .16; root.add(base);
  const trim = box(6.15, .07, 4.87, 0x9ab6b8);trim.position.y=.37;root.add(trim);
  // Inset architectural grid on the plinth.
  const gridMaterial = new THREE.LineBasicMaterial({color:0x83a4aa,transparent:true,opacity:.34});
  for(let i=0;i<7;i++) {
    const x=-2.9+i*.97;
    const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,.43,-2.35),new THREE.Vector3(x,.43,2.35)]);
    root.add(new THREE.Line(g,gridMaterial));
  }
  for(let i=0;i<6;i++) {
    const z=-2.2+i*.88;
    const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-3.05,.43,z),new THREE.Vector3(3.05,.43,z)]);
    root.add(new THREE.Line(g,gridMaterial));
  }
  const groups: THREE.Group[]=[];
  const markers: THREE.Object3D[]=[];
  const connectors: THREE.Group[]=[];
  const glowMaterials: THREE.MeshStandardMaterial[]=[];
  const deviceMaterial = std(baseColor,{metalness:.3,roughness:.32});
  const acrylic = new THREE.MeshPhysicalMaterial({color:slabColor,transparent:true,opacity:.42,roughness:.23,metalness:.1,depthWrite:false,side:THREE.DoubleSide});
  const rodMat=std(0xa8b9b9,{metalness:.65,roughness:.26});
  const moduleAccent=(color:number)=> std(color,{metalness:.48,roughness:.3});
  const layerNames=["cloud","data","integrations","applications","agents","governance"] as const;
  const levelHeight=.88;
  for(let index=0;index<6;index++) {
    const group=new THREE.Group();root.add(group);groups.push(group);
    const accent=colors[index];
    const floor=new THREE.Mesh(new THREE.BoxGeometry(5.7,.13,4.3),acrylic);
    floor.position.set(0,.06,0);floor.receiveShadow=true;group.add(floor);
    const frame=outline(box(5.85,.11,4.43,0xe8e9dd),accent);frame.position.y=-.05;group.add(frame);
    // Layer-colored front rail makes the exploded stacks readable without text in WebGL.
    const stripe=box(5.5,.045,.06,accent);stripe.position.set(0,.15,2.2);group.add(stripe);
    for(const sx of [-2.7,2.7])for(const sz of [-1.95,1.95]) {
      const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.048,.048,.52,8),rodMat);
      pillar.position.set(sx,.35,sz);group.add(pillar);
      const foot=box(.25,.06,.25,accent);foot.position.set(sx,.59,sz);group.add(foot);
    }
    // A different mix of equipment on every architectural floor.
    const equipments=[
      {x:-1.63,z:-.76,w:1.55,d:1.06,h:.42},{x:.52,z:-.84,w:.96,d:1.0,h:.62},
      {x:-1.48,z:.9,w:1.06,d:.72,h:.39},{x:1.5,z:.78,w:1.36,d:.77,h:.48},
    ];
    equipments.forEach((d,j)=>{
      const material=j===index%4?moduleAccent(accent):deviceMaterial;
      const device=new THREE.Mesh(new THREE.BoxGeometry(d.w,d.h,d.d),material);
      device.position.set(d.x,d.h/2+.13,d.z);device.castShadow=true;group.add(device);
      const lid=box(d.w*.84,.035,d.d*.8,0xc4d8d7);lid.position.set(d.x,d.h+.16,d.z);group.add(lid);
      for(let k=0;k<3;k++) {
        const little=box(.14,.025,.055,k===1?accent:0x9ab8b9);
        little.position.set(d.x-d.w*.3+k*.25,d.h*.65+.12,d.z+d.d/2+.03);group.add(little);
      }
    });
    // Server/compute fins, antennas, small ports and a microcircuit network.
    for(let j=0;j<7;j++) {
      const fin=box(.15,.2+(j%3)*.08,.44,j%3===0?accent:0x6c8f9e);
      fin.position.set(-.15+j*.23,.26+(j%3)*.04,.78);group.add(fin);
    }
    const pathMat=moduleAccent(accent);
    const routes=[
      [new THREE.Vector3(-1.5,.19,-.15),new THREE.Vector3(.7,.19,-.15)],
      [new THREE.Vector3(.7,.19,-.15),new THREE.Vector3(1.55,.19,.43)],
      [new THREE.Vector3(-.98,.19,.35),new THREE.Vector3(-.98,.19,1.28)],
    ];
    for(const [a,b] of routes){const track=run(a,b,pathMat,.026);group.add(track);}
    const orb=new THREE.Mesh(new THREE.SphereGeometry(.11,12,10),moduleAccent(accent));orb.position.set(2.18,.43,-.43);group.add(orb);
    const marker=new THREE.Object3D();marker.position.set(2.45,.22,0);group.add(marker);markers.push(marker);
    if(index!==0){
      const c=run(new THREE.Vector3(-2.48,-.55,-1.73),new THREE.Vector3(-2.48,.11,-1.73),pathMat,.039);group.add(c);connectors.push(c);
    }
    const indicator=new THREE.MeshStandardMaterial({color:accent,emissive:accent,emissiveIntensity:.11,roughness:.3});
    glowMaterials.push(indicator);
    const light=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.04,12),indicator);
    light.position.set(-2.2,.2,-1.75);group.add(light);
  }
  const anchors=layerNames.map((key,i)=>({key,position:new THREE.Vector3(), i}));
  let visible=0;
  const originalCameraPosition=new THREE.Vector3(10,8.8,15.4);
  function setProgress(progress:number){
    const p=clamp01(progress);
    const reveal=smooth(win(p,.035,.74));
    const exploded=smooth(win(p,.72,.92));
    groups.forEach((g,i)=>{
      const start=.045+i*.092;
      const t=smooth(win(p,start,start+.2));
      g.visible=t>.008;
      g.scale.set(lerp(.68,1,t),Math.max(.001,t),lerp(.68,1,t));
      // The stack assembles vertically; later it subtly fans out to reveal its systems.
      g.position.set((i%2===0?-1:1)*exploded*.24,lerp(.46,.73+i*levelHeight,easeOut(t))+exploded*(i-2.5)*.14,((i%2===0)?-.12:.12)*exploded);
      g.rotation.y=(i%2?1:-1)*exploded*.055;
      g.updateWorldMatrix(true,false);
      g.getWorldPosition(anchors[i].position);
      markers[i].getWorldPosition(anchors[i].position);
      glowMaterials[i].emissiveIntensity=.08+.1*smooth(win(p,start+.09,start+.3));
    });
    // Model rotates and settles with scroll, never accumulates state between frames.
    root.rotation.y=lerp(-.18,.12,smooth(win(p,.09,.96)));
    root.updateWorldMatrix(true,true);
    groups.forEach((g,i)=> markers[i].getWorldPosition(anchors[i].position));
    visible=p;
    camera.position.copy(originalCameraPosition);
    camera.position.x+=Math.sin(p*Math.PI)*.52;
    camera.lookAt(0,2.65,0);
    camera.updateProjectionMatrix();
    // Ensure the first floor feels present even before the user starts scrolling.
    base.position.y=.16;trim.position.y=.37;
  }
  setProgress(0);
  return {
    setProgress,
    render:()=>stage.render(),
    labelAnchors:anchors.map(a=>({key:a.key,position:a.position})),
    isLabelVisible:(key:string)=>{
      const index=layerNames.indexOf(key as typeof layerNames[number]);
      return index>=0 && visible>.08+index*.092;
    },
    dispose:()=>{ /* stage.dispose owns geometry and material teardown */ }
  };
}
