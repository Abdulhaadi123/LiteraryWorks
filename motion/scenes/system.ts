import * as THREE from "three";
import { createStage, lerp, quint, TAU, win } from "../engine";
import { blobTexture } from "../kit";
import { createEnv, hash, modelLoaders, rng } from "../models/env";
import type { SceneAnchor, SceneCtx, SceneHandle, SceneLayout } from "../types";

/**
 * A page's 3D scene: one model (`models/`), the kind of animation that suits the page (a pipeline of work, a ring of
 * sound, a stack of layers, a globe, a building going up ...), with our own projects on its screens. The page's scroll
 * builds it (loose pieces come together), then runs it (it starts to work), while the camera moves slowly round it.
 * This file is only the stage: the camera, the tags, the glow and the dust. Everything is a pure function of the scroll.
 */

const FOV = 28;
/** The room the model leaves round its box, in the model's own units. */
const MARGIN = 0.55;

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

  const variant = ctx.data?.variant ?? "hero";
  const env = createEnv(renderer, variant);
  const loader = modelLoaders[variant] ?? modelLoaders.hero;
  const model = await (await loader()).default(env, false);
  scene.add(model.group);
  const textures = env.textures;
  const hint = model.camera ?? { az: [-0.34, 0.2], elev: [0.17, 0.1] };

  const haloTex = blobTexture("120,170,200", 0.5);
  const shadowTex = blobTexture("20,40,60", 0.5);
  const dustTex = blobTexture("90,134,170", 0.9);
  textures.push(haloTex, shadowTex, dustTex);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, opacity: 0.5 }));
  scene.add(halo);

  /* ---- a soft ground under a model that stands on nothing ---- */
  const blobGeo = new THREE.PlaneGeometry(1, 1);
  const ground = new THREE.Mesh(blobGeo, new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.4 }));
  ground.rotation.x = -Math.PI / 2;
  ground.renderOrder = -1;
  ground.visible = !!model.ground;
  scene.add(ground);

  /* ---- a fine dust in the air ---- */
  const dustN = 110;
  const dustPos = new Float32Array(dustN * 3);
  const dr = rng(hash(variant) ^ 0x51ed);
  const f0 = model.frame();
  for (let i = 0; i < dustN; i++) {
    const a = dr() * TAU;
    const b = Math.acos(2 * dr() - 1);
    const r = 6 + dr() * 5;
    dustPos[i * 3] = f0.cx + Math.sin(b) * Math.cos(a) * r * 1.2;
    dustPos[i * 3 + 1] = f0.cy + Math.cos(b) * r * 0.7;
    dustPos[i * 3 + 2] = Math.sin(b) * Math.sin(a) * r - 3;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ map: dustTex, size: 0.16, transparent: true, depthWrite: false, opacity: 0.7, sizeAttenuation: true }));
  scene.add(dust);

  /* ---- progress ---- */
  const A = new THREE.Vector3();
  const view = new THREE.Vector3();
  const target = new THREE.Vector3();
  let lay: SceneLayout | null = null;
  let px = 0;
  let py = 0;
  const t2 = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

  const handle: SceneHandle = {
    resize: (w, h) => gl.resize(w, h),
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
      st.render();
      return true;
    },
    stats() {
      const i = renderer.info;
      return { drawCalls: i.render.calls, triangles: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures, shaderPrograms: i.programs?.length ?? 0, pixelRatio: gl.ratio };
    },
    setProgress(p) {
      const a = quint(win(p, 0.04, 0.5)); // loose -> built
      const l = win(p, 0.45, 0.85); // still -> running
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

      if (model.ground) {
        ground.position.set(f.cx, model.floorY ?? f.cy - f.hh, 0);
        const size = Math.max(f.hw * 2.5, 4);
        ground.scale.set(size, size * 0.55, 1);
      }
      // the glow sits well behind the model, on the line from the eye through its middle, so it never cuts through it
      view.subVectors(target, camera.position).normalize();
      halo.position.copy(target).addScaledVector(view, 6);
      halo.scale.setScalar((f.hw * 2 + 1) * (1 + 6 / dist));
      (halo.material as THREE.SpriteMaterial).opacity = lerp(0.4, 0.62, l);
      dust.rotation.y = p * 0.5;
      dust.rotation.x = p * 0.1;
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
      textures.forEach((t) => t.dispose());
      blobGeo.dispose();
      dustGeo.dispose();
      st.dispose();
    },
  };

  handle.setProgress(0);
  return handle;
}
