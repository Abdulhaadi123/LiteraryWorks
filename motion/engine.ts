import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

/** The site's colours as hex numbers, for the 3D model. */
export const C = {
  blue: 0x3479b2,
  navy: 0x22425f,
  green: 0x73c94a,
} as const;

/* ---- easing and windows ---- */

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** How far `p` is through the window [a, b], clamped to 0..1. */
export const win = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

/* ---- the stage: renderer, camera, light, environment ---- */

/** The sharpest the picture is ever drawn: a retina screen gets 1.75, never four times the pixels of a large one. */
const MAX_PIXEL_RATIO = 1.75;

export interface Stage {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  key: THREE.DirectionalLight;
  size: { w: number; h: number };
  /** Pixels drawn per CSS pixel right now (it can be lowered, see `setPixelRatio`). */
  readonly pixelRatio: number;
  resize(w: number, h: number): void;
  /** Moves the model sideways on screen (fraction of the width; negative = to the right) without moving the camera. */
  shift(fraction: number): void;
  /** Draws with another pixel ratio (never above the screen's own, never below 1). The next `render()` shows it. */
  setPixelRatio(ratio: number): void;
  /** Compiles every shader before the first frame (off the main thread where the browser can). */
  warm(): Promise<void>;
  render(): void;
  /** Canvas position (CSS px) of a world point. */
  project(v: THREE.Vector3): { x: number; y: number; behind: boolean };
  dispose(): void;
}

export function createStage(
  canvas: HTMLCanvasElement,
  opts: { fov?: number; shadow?: number; exposure?: number } = {},
): Stage {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // a neutral curve that keeps whites white and blues blue (ACES would grey them)
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = opts.exposure ?? 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  // a neutral studio: soft light on every surface without loading any image
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  scene.environmentIntensity = 0.85;
  room.dispose();
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(opts.fov ?? 30, 1, 0.1, 400);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xcdd9e8, 0.75));
  const key = new THREE.DirectionalLight(0xffffff, 1.9);
  key.position.set(-9, 20, 11);
  key.castShadow = true;
  const sh = opts.shadow ?? 14;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -sh;
  key.shadow.camera.right = sh;
  key.shadow.camera.top = sh;
  key.shadow.camera.bottom = -sh;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 80;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.03;
  key.shadow.radius = 5;
  scene.add(key, key.target);

  const size = { w: 1, h: 1 };
  let ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  let offset = 0;
  const applyOffset = () => {
    if (offset) camera.setViewOffset(size.w, size.h, size.w * offset, 0, size.w, size.h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  };

  const v = new THREE.Vector3();
  return {
    renderer,
    scene,
    camera,
    key,
    size,
    get pixelRatio() {
      return ratio;
    },
    resize(w, h) {
      size.w = Math.max(1, Math.round(w));
      size.h = Math.max(1, Math.round(h));
      renderer.setPixelRatio(ratio);
      renderer.setSize(size.w, size.h, false);
      camera.aspect = size.w / size.h;
      applyOffset();
    },
    shift(fraction) {
      if (fraction === offset) return;
      offset = fraction;
      applyOffset();
    },
    setPixelRatio(r) {
      ratio = Math.max(1, Math.min(r, Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO)));
      renderer.setPixelRatio(ratio);
      renderer.setSize(size.w, size.h, false);
    },
    async warm() {
      try {
        await renderer.compileAsync(scene, camera);
      } catch {
        // the first render compiles them instead
      }
    },
    render() {
      renderer.render(scene, camera);
    },
    project(point) {
      v.copy(point).project(camera);
      return { x: (v.x * 0.5 + 0.5) * size.w, y: (-v.y * 0.5 + 0.5) * size.h, behind: v.z > 1 };
    },
    dispose() {
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m?.dispose();
      });
      scene.environment?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

/** A floor that shows nothing but the shadows cast on it (no edge for the canvas to cut off). */
export function shadowFloor(size: number, opacity = 0.14) {
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.ShadowMaterial({ opacity }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.01;
  shadow.receiveShadow = true;
  return shadow;
}
