import * as THREE from "three";
import { clamp01, createStage, lerp, quint, smooth, win } from "../engine";
import { blobTexture } from "../kit";
import { createEnv, modelLoaders } from "../models/env";
import { fitFrame } from "../models/fit";
import { glass } from "../models/parts";
import { dressStage, type Dressing } from "../stage";
import type { Frame, Model } from "../models/types";
import type { SceneAnchor, SceneCtx, SceneHandle, SceneLayout } from "../types";

/**
 * A deck: one scene at a time, large and clear, and the camera moves on to the next as the page scrolls. The nine
 * services stand in a line, each its own kind of animation (a pipeline, a ring of sound, a stack of layers, a tower of
 * screens, a browser, an app pulled apart, a design, a globe, a building going up): the same models the service pages
 * use, framed the same way. The case studies climb a spiral: their covers, one above the other. Nothing flies in or
 * is scattered: the first scene is there from the start, and each one builds and runs while it is the one in front.
 */

const FOV = 28;
/** The first part of the scroll is the intro copy, over the first scene (it matches INTRO in components/ServicesDeck.tsx). */
const INTRO = 0.09;
/**
 * How far apart the scenes stand, one below the other: far enough that the next one is never in view until the camera
 * is on its way to it. They move up and down the column the picture stands in, never across the copy beside it.
 */
const SPACE = 13;
/** The camera takes 2 x PAN of the page's scroll to move from one scene to the next. */
const PAN = 0.022;

interface Item {
  holder: THREE.Group;
  model?: Model;
  frame: Frame;
  hint: { az: [number, number]; elev: [number, number] };
  glow?: THREE.Mesh;
  face?: THREE.MeshBasicMaterial;
}

export default async function build(ctx: SceneCtx): Promise<SceneHandle> {
  const gl = ctx.gl;
  const renderer = gl.renderer;
  const st = createStage(gl, { fov: FOV, exposure: 1 });
  const { scene, camera } = st;
  camera.near = 3;
  camera.far = 200;
  camera.updateProjectionMatrix();
  scene.environmentIntensity = 0.85;

  const cases = ctx.data?.variant === "cases";
  const studio = !cases;
  const ids = ctx.data?.items?.map((i) => i.id) ?? ["a", "b", "c", "d", "e", "f"];
  const N = Math.max(3, ids.length);
  const env = createEnv(renderer, ctx.data?.variant ?? "services");
  const textures = env.textures;
  // the services stand in the light studio: a glossy floor under whichever scene is in front, soft shadows, coloured rim lights
  const dress: Dressing | null = studio ? dressStage(gl, scene, camera, textures) : null;

  const haloTex = blobTexture("120,170,200", 0.5);
  const dustTex = blobTexture("90,134,170", 0.9);
  textures.push(haloTex, dustTex);
  const glowTex = blobTexture("130,185,225", 0.55);
  textures.push(glowTex);
  const blobGeo = new THREE.PlaneGeometry(1, 1);

  /* ---- the scenes (or the covers) ---- */
  const root = new THREE.Group();
  scene.add(root);
  const items: Item[] = [];
  for (let i = 0; i < N; i++) {
    const holder = new THREE.Group();
    holder.rotation.order = "YXZ";
    root.add(holder);
    if (cases) {
      const tex = await env.shot(`/cases/${ids[i]}`, 1024, 576);
      const panel = glass(env, tex, 4.4, 2.475, { radius: 0.18, depth: 0.06 });
      holder.add(panel.group);
      items.push({ holder, frame: { cx: 0, cy: 0, hw: 4.6, hh: 3.3 }, hint: { az: [0, 0], elev: [0.1, 0.1] }, face: (panel.body.material as THREE.MeshBasicMaterial[])[0] });
    } else {
      const load = modelLoaders[ids[i]] ?? modelLoaders.hero;
      const model = await (await load()).default(env, false);
      fitFrame(model);
      model.set(1, 1, 0.62);
      const frame = { ...model.frame() };
      holder.position.y = -i * SPACE;
      holder.add(model.group);
      let glow: THREE.Mesh | undefined;
      if (model.ground && !studio) {
        // a soft pool of light under the scene, so it stands on something
        glow = new THREE.Mesh(blobGeo, new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0.55 }));
        glow.rotation.x = -Math.PI / 2;
        glow.renderOrder = -1;
        glow.position.set(frame.cx, (model.floorY ?? frame.cy - frame.hh) - 0.02, 0);
        glow.scale.set(frame.hw * 2.5, frame.hw * 1.4, 1);
        holder.add(glow);
      }
      items.push({ holder, model, frame, hint: model.camera ?? { az: [-0.34, 0.2], elev: [0.17, 0.1] }, glow });
    }
  }

  /* ---- the glow behind, and a fine dust in the air that follows the camera a little slower than the scenes ---- */
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, opacity: 0.6 }));
  if (studio) halo.layers.set(1);
  scene.add(halo);
  const dustN = 140;
  const dustPos = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) {
    dustPos[i * 3] = (((i * 0.6180339) % 1) - 0.5) * 26;
    dustPos[i * 3 + 1] = (((i * 0.7548776) % 1) - 0.5) * 34;
    dustPos[i * 3 + 2] = -6 - ((i * 0.3247179) % 1) * 12;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({ map: dustTex, size: 0.18, transparent: true, depthWrite: false, opacity: studio ? 0.5 : 0.7, sizeAttenuation: true }),
  );
  if (studio) dust.layers.set(1);
  scene.add(dust);

  /* ---- progress ---- */
  const start = (i: number) => INTRO + (i / N) * (1 - INTRO);
  let lay: SceneLayout | null = null;
  let px = 0;
  let py = 0;
  const target = new THREE.Vector3();
  const view = new THREE.Vector3();
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
      // which item is in front, as a number of places: it moves on at each boundary between two items
      let f = 0;
      for (let k = 1; k < N; k++) f += quint(win(p, start(k) - PAN, start(k) + PAN));

      const w = gl.size.w;
      const h = gl.size.h;
      const from = lay ? lay.left : w * 0.4;
      const to = lay ? lay.right : w * 0.94;
      const lo = lay ? lay.top : 0;
      const hi = lay ? lay.bottom : h;
      const room = Math.max(w * 0.25, to - from);
      const roomH = Math.max(h * 0.4, hi - lo);
      st.shift(-((from + to) / 2 / w - 0.5), -((lo + hi) / 2 / h - 0.5));

      let cx = 0;
      let cy = 0;
      let hw: number;
      let hh: number;
      let az = 0;
      let elev: number;
      let swing = 0;

      if (cases) {
        // a spiral: each cover a step round and a step up from the one before
        items.forEach((it, i) => {
          const d = i - f;
          const near = clamp01(1 - Math.abs(d));
          // (the next covers step back and away; two places off, a cover is gone, so none is ever seen edge-on)
          const round = 1 - smooth(win(Math.abs(d), 1.0, 1.9));
          const th = d * 0.6;
          const r = 4.6 + near * 0.8;
          const g = it.holder;
          g.position.set(Math.sin(th) * r, d * 1.35, Math.cos(th) * r - 4.6);
          g.rotation.set(0, th, 0);
          g.scale.setScalar((0.84 + 0.46 * near ** 1.3) * Math.max(round, 0.001));
          g.visible = round > 0.002;
          if (it.face) it.face.color.setScalar(lerp(0.74, 1, near ** 0.6));
        });
        hw = 4.6;
        hh = 3.3;
        elev = 0.1;
      } else {
        items.forEach((it, i) => {
          // (only the scene in front, and during the move the one leaving and the one arriving)
          const d = Math.abs(i - f);
          it.holder.visible = d < 0.995;
          if (!it.holder.visible || !it.model) return;
          // each scene runs, from where the page's scroll has got to, while it is in front
          it.model.set(1, clamp01(1 - d) ** 0.7, lerp(0.34, 0.9, clamp01((f - (i - 1)) / 2)));
        });
        // the camera frames the scene in front and glides to the next
        const i0 = Math.min(N - 2, Math.floor(f));
        const t = f - i0;
        const A = items[i0];
        const B = items[i0 + 1];
        const qA = clamp01((f - (i0 - 1)) / 2);
        const qB = clamp01((f - i0) / 2);
        cx = lerp(A.frame.cx, B.frame.cx, t);
        cy = lerp(A.frame.cy - i0 * SPACE, B.frame.cy - (i0 + 1) * SPACE, t);
        hw = lerp(A.frame.hw, B.frame.hw, t);
        hh = lerp(A.frame.hh, B.frame.hh, t);
        az = lerp(lerp(A.hint.az[0], A.hint.az[1], qA), lerp(B.hint.az[0], B.hint.az[1], qB), t);
        elev = lerp(lerp(A.hint.elev[0], A.hint.elev[1], qA), lerp(B.hint.elev[0], B.hint.elev[1], qB), t);
        swing = Math.sin(Math.PI * t);
      }

      const halfW = hw + 0.4;
      const halfH = hh + 0.4;
      // (it draws back a little on the way, so the scene leaving and the one arriving are both in view)
      const dist = Math.max(halfH / (0.96 * t2 * (roomH / h)), halfW / (0.96 * t2 * (room / h))) * (1 + 0.24 * swing);
      az += px * 0.07;
      elev -= py * 0.05;
      target.set(cx, cy, 0);
      camera.position.set(target.x + dist * Math.cos(elev) * Math.sin(az), target.y + dist * Math.sin(elev), target.z + dist * Math.cos(elev) * Math.cos(az));
      camera.lookAt(target);
      camera.updateMatrixWorld();

      // the glow sits well behind the scene, on the line from the eye through its middle
      view.subVectors(target, camera.position).normalize();
      halo.position.copy(target).addScaledVector(view, 8);
      halo.scale.setScalar((hw * 2 + 2) * (1 + 8 / dist));
      (halo.material as THREE.SpriteMaterial).opacity = studio ? 0.3 : 0.6;
      if (dress && !cases) {
        // the floor under the scene in front: it glides with the camera and fades while two scenes share the picture
        const i0 = Math.min(N - 2, Math.floor(f));
        const t = f - i0;
        const flo = (k: number) => (items[k].model?.floorY ?? items[k].frame.cy - items[k].frame.hh) - k * SPACE;
        const floorY = lerp(flo(i0), flo(i0 + 1), t);
        const near = Math.round(f);
        dress.update({ floorY, cx, hw, p: lerp(0.34, 0.9, clamp01((f - (near - 1)) / 2)), l: clamp01(1 - Math.abs(near - f)), k: 1 - 0.9 * Math.sin(Math.PI * t) ** 0.6 });
      }
      dust.position.y = target.y * 0.7;
      dust.rotation.y = p * 0.4;
      scene.updateMatrixWorld();
    },
    anchors(): SceneAnchor[] {
      return [];
    },
    dispose() {
      items.forEach((it) => it.model?.dispose?.());
      dress?.dispose();
      textures.forEach((t) => t.dispose());
      blobGeo.dispose();
      dustGeo.dispose();
      st.dispose();
    },
  };

  handle.setProgress(0);
  return handle;
}
