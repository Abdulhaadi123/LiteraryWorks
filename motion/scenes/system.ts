import * as THREE from "three";
import { createStage, lerp, quint, win } from "../engine";
import { createEnv, loadModel } from "../models/env";
import { fitFrame } from "../models/fit";
import { dressStage, type Dressing } from "../stage";
import type { SceneAnchor, SceneCtx, SceneHandle, SceneLayout } from "../types";

/**
 * A page's 3D scene: one model (`models/`), a real object that suits the page (a document scanner, a headset, a book, a building
 * model ...), with our own projects on it. The scroll moves it on (the objects work, the pictures change, the pages
 * turn) while the camera drifts a little round it. This file is only the stage: the camera and the tags. Everything is a
 * pure function of the scroll.
 */

const FOV = 28;
/** The room the model leaves round its box, in the model's own units. */
const MARGIN = 0.4;

export default async function build(ctx: SceneCtx): Promise<SceneHandle> {
  const gl = ctx.gl;
  const renderer = gl.renderer;
  const st = createStage(gl, { fov: FOV, exposure: 1 });
  const { scene, camera } = st;
  // the models stand well back from the camera: a nearer clipping plane keeps the layers of a screen from flickering
  camera.near = 3;
  camera.far = 160;
  camera.updateProjectionMatrix();
  scene.environmentIntensity = 0.85;

  const variant = ctx.data?.variant ?? "devices";
  const env = createEnv(renderer, variant);
  const model = await (await loadModel(variant))(env, false);
  fitFrame(model);
  scene.add(model.group);
  const textures = env.textures;
  const hint = model.camera ?? { az: [-0.34, 0.2], elev: [0.3, 0.24] };

  // every scene stands in the same plain studio: a glossy floor and three soft lights
  const dress: Dressing | null = dressStage(gl, scene, camera, textures);

  /* ---- progress ---- */
  const A = new THREE.Vector3();
  const target = new THREE.Vector3();
  let lay: SceneLayout | null = null;
  let px = 0;
  let py = 0;
  const t2 = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

  const handle: SceneHandle = {
    resize: (w, h) => {
      gl.resize(w, h);
      dress?.resize(gl.size.w, gl.size.h);
    },
    layout: (l) => {
      lay = l;
    },
    setPointer(x, y) {
      px = x;
      py = y;
    },
    warm: () => st.warm(),
    render: () => st.render(),
    lowerQuality() {
      const before = gl.ratio;
      gl.setRatio(before - 0.25);
      if (gl.ratio >= before - 0.001) return false;
      dress?.resize(gl.size.w, gl.size.h);
      st.render();
      return true;
    },
    stats() {
      const i = renderer.info;
      return { drawCalls: i.render.calls, triangles: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures, shaderPrograms: i.programs?.length ?? 0, pixelRatio: gl.ratio };
    },
    setProgress(p) {
      const a = quint(win(p, 0.04, 0.5)); // (kept for models that grow in)
      const l = win(p, 0.45, 0.85);
      model.set(a, l, p);
      scene.updateMatrixWorld();
      const f = model.frame();

      // the camera frames the model where it is now, and moves slowly round it as the page scrolls
      const w = gl.size.w;
      const h = gl.size.h;
      const from = lay ? lay.left : w * 0.4;
      const to = lay ? lay.right : w * 0.94;
      const lo = lay ? lay.top : 0;
      const hi = lay ? lay.bottom : h;
      const room = Math.max(w * 0.25, to - from);
      const roomH = Math.max(h * 0.4, hi - lo);
      st.shift(-((from + to) / 2 / w - 0.5), -((lo + hi) / 2 / h - 0.5));
      const halfW = f.hw + MARGIN;
      const halfH = f.hh + MARGIN;
      const dist = Math.max(halfH / (0.96 * t2 * (roomH / h)), halfW / (0.96 * t2 * (room / h)));
      const az = lerp(hint.az[0], hint.az[1], p) + px * 0.07;
      const elev = lerp(hint.elev[0], hint.elev[1], p) - py * 0.05;
      target.set(f.cx, f.cy, 0);
      camera.position.set(target.x + dist * Math.cos(elev) * Math.sin(az), target.y + dist * Math.sin(elev), target.z + dist * Math.cos(elev) * Math.cos(az));
      camera.lookAt(target);
      camera.updateMatrixWorld();

      const floorY = model.floorY ?? f.cy - f.hh;
      dress?.update({ floorY, cx: f.cx, hw: f.hw });
    },
    anchors(): SceneAnchor[] {
      camera.updateMatrixWorld();
      return ctx.keys.map((key) => {
        const obj = model.tags[Number(key)];
        if (!obj) return { x: 0, y: 0, behind: true };
        obj.updateWorldMatrix(true, false);
        obj.getWorldPosition(A);
        return st.project(A);
      });
    },
    dispose() {
      model.dispose?.();
      dress?.dispose();
      textures.forEach((t) => t.dispose());
      st.dispose();
    },
  };

  handle.setProgress(0);
  return handle;
}
