import * as THREE from "three";
import {box, clamp01, easeOut, grow, lerp, outline, run, shadowFloor, smooth, std, win, type Stage} from "../stage";

export function createScene(stage: Stage) {
  const { world } = stage;
  const assembly = new THREE.Group();
  world.add(assembly);
  world.add(shadowFloor());
  const navy = 0x18324d, gold = 0xc69a58, warm = 0xf4ddb1, blue = 0x4b7794;
  const base = outline(box(7.4, 0.28, 5.4, navy)); base.position.y = 0.14; assembly.add(base);
  const plinth = box(4.4, 0.13, 3.2, 0x284158); plinth.position.y = 0.34; assembly.add(plinth);
  const coreGroup = new THREE.Group(); assembly.add(coreGroup);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.83, 1), std(gold, {metalness: 0.76, roughness: 0.18}));
  core.position.y = 2.75; core.castShadow = true; coreGroup.add(core);
  const wire = new THREE.LineSegments(new THREE.EdgesGeometry(core.geometry), new THREE.LineBasicMaterial({color: warm, transparent: true, opacity: 0.68}));
  core.add(wire);
  const ringMaterial = new THREE.MeshStandardMaterial({color: 0xa3bdd1, roughness: 0.24, metalness: 0.82, side: THREE.DoubleSide});
  const rings: THREE.Mesh[] = [];
  for (let index = 0; index < 3; index++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.26 + index * 0.27, 0.017, 8, 80), ringMaterial);
    ring.position.y = 2.75;
    ring.rotation.set(index === 0 ? 0.65 : index === 1 ? -0.55 : 1.22, 0.2 * index, index * 0.7);
    coreGroup.add(ring); rings.push(ring);
  }
  const columns: THREE.Group[] = [];
  const positions = [new THREE.Vector3(-2.5, 0.45, -1.5), new THREE.Vector3(2.5, 0.45, -1.5), new THREE.Vector3(-2.5, 0.45, 1.5), new THREE.Vector3(2.5, 0.45, 1.5)];
  positions.forEach((position, index) => {
    const group = new THREE.Group(); group.position.copy(position); assembly.add(group);
    const height = index % 2 ? 1.35 : 1.65;
    const tower = outline(box(1.14, height, 1.04, index % 2 ? 0x31516d : 0x223a53), blue);
    tower.position.y = height / 2; group.add(tower);
    for (let layer = 0; layer < 3; layer++) {
      const strip = box(0.65, 0.025, 0.07, layer % 2 ? 0x85a8bd : gold);
      strip.position.set(0, height * (0.23 + layer * 0.2), 0.55); group.add(strip);
    }
    columns.push(group);
  });
  const paths: THREE.Group[] = [];
  positions.forEach((position, index) => {
    const start = new THREE.Vector3(position.x, 0.48, position.z);
    const end = new THREE.Vector3(0, 1.2 + index * 0.13, 0);
    const path = run(start, end, std(index % 2 ? blue : gold, {metalness: 0.8, roughness: 0.25}), 0.048);
    assembly.add(path); paths.push(path);
  });
  const floating: THREE.Mesh[] = [];
  for (let index = 0; index < 18; index++) {
    const angle = index * 2.39996;
    const rad = 2.0 + (index % 3) * 0.21;
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.058 + (index % 3) * 0.018, 0), new THREE.MeshStandardMaterial({color: index % 3 ? warm : 0x82bad0, emissive: index % 3 ? 0x654c28 : 0x17445d, emissiveIntensity: 0.5}));
    shard.userData.angle = angle;
    shard.userData.radius = rad;
    assembly.add(shard); floating.push(shard);
  }
  const anchorCore = new THREE.Vector3();
  const anchorData = new THREE.Vector3();
  const anchorWorkflows = new THREE.Vector3();
  const labelAnchors = [
    {key: "core", position: anchorCore},
    {key: "data", position: anchorData},
    {key: "workflows", position: anchorWorkflows},
  ];
  let labelVisibility = {core: false, data: false, workflows: false};

  function setProgress(progress: number) {
    const p = clamp01(progress);
    const a = smooth(win(p, 0.01, 0.26));
    const b = smooth(win(p, 0.27, 0.59));
    const c = smooth(win(p, 0.58, 0.88));
    base.position.y = lerp(-1.1, 0.14, easeOut(a));
    plinth.position.y = lerp(-1.0, 0.34, easeOut(a));
    coreGroup.position.y = lerp(-1.5, 0, a);
    core.scale.setScalar(lerp(0.15, 1, a));
    core.rotation.y = p * Math.PI * 1.8;
    core.rotation.x = p * 0.28;
    rings.forEach((ring, index) => {ring.scale.setScalar(lerp(0.1, 1, b));ring.rotation.z += 0;ring.rotation.y = p * (index % 2 ? -1.5 : 1.5) + index * 0.2;});
    columns.forEach((column, index) => {
      const appear = smooth(win(p, 0.15 + index * 0.04, 0.4 + index * 0.04));
      column.position.y = lerp(-2.5, 0.45 + c * (0.18 + (index % 2) * 0.22), appear);
      column.position.x = positions[index].x + c * (index % 2 ? 0.42 : -0.42);
      column.position.z = positions[index].z + c * (index < 2 ? -0.3 : 0.3);
      column.rotation.y = c * (index % 2 ? -0.18 : 0.18);
    });
    paths.forEach((path, index) => grow(path, smooth(win(p, 0.3 + index * 0.04, 0.7 + index * 0.02))));
    floating.forEach((shard, index) => {const angle = Number(shard.userData.angle) + p * 1.2; const rad = Number(shard.userData.radius); shard.position.set(Math.cos(angle) * rad, 1.5 + Math.sin(index * 4) * 0.25 + c * 1.1, Math.sin(angle) * rad); shard.scale.setScalar(lerp(0.01, 1, b)); });
    assembly.rotation.y = -0.19 + p * 0.27;
    assembly.updateWorldMatrix(true, true);
    core.getWorldPosition(anchorCore); anchorCore.y += 1.05;
    columns[0].getWorldPosition(anchorData); anchorData.y += 2.2;
    columns[3].getWorldPosition(anchorWorkflows); anchorWorkflows.y += 1.9;
    labelVisibility = {core: p > 0.19, data: p > 0.45, workflows: p > 0.64};
  }
  setProgress(0);
  return {setProgress, render: () => stage.render(), labelAnchors, isLabelVisible: (key: string) => !!labelVisibility[key as keyof typeof labelVisibility], dispose: () => {world.remove(assembly);}};
}
