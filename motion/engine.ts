import * as THREE from "three";
import type { GL } from "./gl";

/* ---- easing and windows ---- */

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** How far `p` is through the window [a, b], clamped to 0..1. */
export const win = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
/** Quintic smoothstep: zero speed and zero acceleration at both ends. */
export const quint = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
export const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Compiles the shaders `obj` needs (off the main thread where the browser can, KHR_parallel_shader_compile) and waits
 * until they are ready. Unlike `renderer.compileAsync` it cannot crash when the scene is freed meanwhile: three's own
 * check runs on a timer and throws on a material that was disposed while it waited (it has no program any more), so
 * leaving a page during a build raised an uncaught error. This one skips freed materials, stops as soon as `alive()`
 * says the scene is gone, and gives up after about four seconds (the first frame then compiles what is left).
 */
export async function compileReady(gl: GL, obj: THREE.Object3D, camera: THREE.Camera, scene: THREE.Scene | null = null, alive: () => boolean = () => true): Promise<void> {
  let materials: Set<THREE.Material>;
  try {
    materials = gl.renderer.compile(obj, camera, scene);
  } catch {
    return;
  }
  const props = gl.renderer.properties;
  for (let i = 0; i < 400 && materials.size > 0 && alive(); i++) {
    materials.forEach((m) => {
      const program = (props.get(m) as { currentProgram?: { isReady(): boolean } }).currentProgram;
      if (!program || program.isReady()) materials.delete(m);
    });
    if (materials.size > 0) await new Promise((r) => setTimeout(r, 10));
  }
}

/* ---- a stage: one scene's world (scene graph, camera, light) drawn with the shared renderer ---- */

export interface Stage {
  gl: GL;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  key: THREE.DirectionalLight;
  /** Moves the model on screen without moving the camera: `fx` is a fraction of the width (negative = to the right), `fy` of the height (negative = down). */
  shift(fx: number, fy?: number): void;
  /** Compiles every shader before the first frame (off the main thread where the browser can). */
  warm(): Promise<void>;
  render(): void;
  /** Canvas position (CSS px) of a world point. */
  project(v: THREE.Vector3): { x: number; y: number; behind: boolean };
  /** Frees this scene's geometry and materials (the renderer and the lighting belong to everyone). */
  dispose(): void;
}

export function createStage(gl: GL, opts: { fov?: number; exposure?: number } = {}): Stage {
  const scene = new THREE.Scene();
  scene.environment = gl.env;
  scene.environmentIntensity = 0.9;
  const camera = new THREE.PerspectiveCamera(opts.fov ?? 28, 1, 0.1, 400);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xcfdcf0, 0.7));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(-8, 14, 12);
  scene.add(key);

  let offX = 0;
  let offY = 0;
  let aspect = 1;
  const sync = () => {
    const a = gl.size.w / gl.size.h;
    const moved = offX !== 0 || offY !== 0;
    if (Math.abs(a - aspect) < 1e-5 && camera.view?.enabled === moved) return;
    aspect = a;
    camera.aspect = a;
    if (moved) camera.setViewOffset(gl.size.w, gl.size.h, gl.size.w * offX, gl.size.h * offY, gl.size.w, gl.size.h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
  };

  const v = new THREE.Vector3();
  let alive = true;
  return {
    gl,
    scene,
    camera,
    key,
    shift(fx, fy = 0) {
      if (fx === offX && fy === offY) return;
      offX = fx;
      offY = fy;
      aspect = -1; // forces the projection to be rebuilt
      sync();
    },
    warm: () => compileReady(gl, scene, camera, null, () => alive),
    render() {
      if (gl.lost) return;
      sync();
      gl.renderer.toneMappingExposure = opts.exposure ?? 1;
      gl.renderer.render(scene, camera);
    },
    project(point) {
      v.copy(point).project(camera);
      return { x: (v.x * 0.5 + 0.5) * gl.size.w, y: (-v.y * 0.5 + 0.5) * gl.size.h, behind: v.z > 1 };
    },
    dispose() {
      alive = false;
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        mesh.geometry?.dispose();
        const m = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m?.dispose();
      });
      scene.clear();
    },
  };
}
