import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }
export function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
export function win(p: number, a: number, b: number) { return clamp01((p - a) / (b - a)); }
export function smooth(t: number) { return t * t * (3 - 2 * t); }
export function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }

export type Stage = ReturnType<typeof createStage>;

export function createStage(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const world = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
  camera.position.set(9, 7, 15);
  camera.lookAt(0, 1, 0);

  const environmentGenerator = new THREE.PMREMGenerator(renderer);
  const environment = environmentGenerator.fromScene(new RoomEnvironment(), 0.04);
  world.environment = environment.texture;
  const ambient = new THREE.HemisphereLight(0xe8edf9, 0x253548, 2.6);
  world.add(ambient);
  const key = new THREE.DirectionalLight(0xffe2ad, 4.4);
  key.position.set(5, 12, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 40;
  key.shadow.bias = -0.0005;
  world.add(key);
  let width = 1, height = 1;
  function resize(w: number, h: number) {
    width = Math.max(1, Math.floor(w)); height = Math.max(1, Math.floor(h));
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  function shift(fraction: number) {
    camera.setViewOffset(width, height, Math.round(fraction * width), 0, width, height);
  }
  function project(position: THREE.Vector3) {
    const projected = position.clone().project(camera);
    return { x: (projected.x * 0.5 + 0.5) * width, y: (-projected.y * 0.5 + 0.5) * height, behind: projected.z > 1 || projected.z < -1 };
  }
  async function precompile() {
    await renderer.compileAsync(world, camera);
  }
  function render() { renderer.render(world, camera); }
  function dispose() {
    world.traverse(object => {
      if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments || object instanceof THREE.Line) {
        object.geometry.dispose();
        const material = object.material;
        (Array.isArray(material) ? material : [material]).forEach(m => m.dispose());
      }
    });
    world.environment = null;
    environment.dispose();
    environmentGenerator.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }
  return { world, camera, renderer, resize, shift, project, precompile, render, dispose };
}

export function std(color: THREE.ColorRepresentation, options: {roughness?: number; metalness?: number; transparent?: boolean; opacity?: number} = {}) {
  return new THREE.MeshStandardMaterial({color, roughness: options.roughness ?? 0.42, metalness: options.metalness ?? 0.35, transparent: options.transparent ?? false, opacity: options.opacity ?? 1});
}
export function box(width: number, height: number, depth: number, color: THREE.ColorRepresentation) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), std(color));
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
export function outline(mesh: THREE.Mesh, color = 0xd4af74) {
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({color, transparent: true, opacity: 0.48}));
  mesh.add(edges);
  return mesh;
}
export function shadowFloor() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({opacity: 0.2}));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  return floor;
}
export function run(a: THREE.Vector3, b: THREE.Vector3, material: THREE.Material, width = 0.06) {
  const displacement = b.clone().sub(a);
  const pivot = new THREE.Group();
  pivot.position.copy(a);
  pivot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), displacement.clone().normalize());
  const body = new THREE.Mesh(new THREE.CylinderGeometry(width, width, displacement.length(), 8), material);
  body.rotation.x = Math.PI / 2;
  body.position.z = displacement.length() * 0.5;
  pivot.add(body);
  return pivot;
}
export function grow(group: THREE.Group, amount: number) { group.scale.z = Math.max(0.001, amount); }
