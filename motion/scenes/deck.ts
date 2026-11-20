import * as THREE from "three";
import { clamp01, createStage, lerp, quint, smooth, TAU, win } from "../engine";
import { blobTexture } from "../kit";
import { createEnv, modelLoaders } from "../models/env";
import { glass } from "../models/parts";
import type { Model } from "../models/types";
import type { SceneAnchor, SceneCtx, SceneHandle, SceneLayout } from "../types";

/**
 * A rotary deck: one scene for each item. The services turn on a drum, and each is its own kind of animation (a
 * pipeline, a ring of sound, a stack of layers, a tower of screens, a browser, an app pulled apart, a design, a
 * globe, a building going up), the same models the service pages use, small. The case studies climb a spiral: their
 * covers, one above the other. Scrolling moves on one place at a time; the one at the front comes forward and starts
 * to run while the copy beside it describes it. Everything first flies in and settles.
 */

const FOV = 28;
/** The first part of the scene is the items flying in; they then share the rest. */
const INTRO = 0.09;
/** How wide a service's scene is on the drum. */
const ITEM_W = 3.5;
const ITEM_H = 3.2;

export default async function build(ctx: SceneCtx): Promise<SceneHandle> {
  const gl = ctx.gl;
  const renderer = gl.renderer;
  const st = createStage(gl, { fov: FOV, exposure: 1 });
  const { scene, camera } = st;
  camera.near = 3;
  camera.far = 160;
  camera.updateProjectionMatrix();
  scene.environmentIntensity = 0.85;

  const cases = ctx.data?.variant === "cases";
  const ids = ctx.data?.items?.map((i) => i.id) ?? ["a", "b", "c", "d", "e", "f"];
  const N = Math.max(3, ids.length);
  const env = createEnv(renderer, ctx.data?.variant ?? "services");
  const textures = env.textures;

  /* ---- the items ---- */
  const drum = new THREE.Group();
  scene.add(drum);
  interface Item {
    holder: THREE.Group;
    model?: Model;
    face?: THREE.MeshBasicMaterial;
  }
  const items: Item[] = [];
  for (let i = 0; i < N; i++) {
    const holder = new THREE.Group();
    holder.rotation.order = "YXZ";
    const item: Item = { holder };
    if (cases) {
      const tex = await env.shot(`/cases/${ids[i]}`, 1024, 576);
      const panel = glass(env, tex, 3.6, 2.025, { radius: 0.16, depth: 0.06 });
      holder.add(panel.group);
      item.face = (panel.body.material as THREE.MeshBasicMaterial[])[0];
    } else {
      const load = modelLoaders[ids[i]] ?? modelLoaders.hero;
      const model = await (await load()).default(env, true);
      // sized to fit the drum and centred on its own middle
      model.set(1, 1, 0.7);
      const f = model.frame();
      const s = Math.min(ITEM_W / (2 * f.hw), ITEM_H / (2 * f.hh));
      model.group.scale.setScalar(s);
      model.group.position.set(-f.cx * s, -f.cy * s, 0);
      holder.add(model.group);
      item.model = model;
    }
    drum.add(holder);
    items.push(item);
  }
  const slot = TAU / N;
  const R = cases ? 4.6 : Math.max(3.6, (ITEM_W * 0.5 + 0.1) / Math.tan(Math.PI / N));

  /* ---- the glow behind the drum, a ring of light on the floor, a soft shadow, a fine dust in the air ---- */
  const haloTex = blobTexture("120,170,200", 0.5);
  const shadowTex = blobTexture("20,40,60", 0.5);
  const dustTex = blobTexture("90,134,170", 0.9);
  textures.push(haloTex, shadowTex, dustTex);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, opacity: 0.6 }));
  scene.add(halo);
  const FLOOR = -1.9;
  const ringGeo = new THREE.TorusGeometry(R + 0.6, 0.014, 8, 220);
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x73c94a, transparent: true, opacity: 0.8 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = FLOOR;
  scene.add(ring);
  const blobGeo = new THREE.PlaneGeometry(1, 1);
  const blob = new THREE.Mesh(blobGeo, new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.5 }));
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = FLOOR - 0.01;
  blob.scale.setScalar((R + 1.2) * 2.2);
  blob.renderOrder = -1;
  scene.add(blob);
  const dustN = 120;
  const dustPos = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) {
    const a = ((i * 2.399963) % TAU) + 0.3;
    const r = R + 0.8 + ((i * 0.6180339) % 1) * 4;
    dustPos[i * 3] = Math.cos(a) * r;
    dustPos[i * 3 + 1] = (((i * 0.7548776) % 1) - 0.35) * 6;
    dustPos[i * 3 + 2] = Math.sin(a) * r - 1;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ map: dustTex, size: 0.16, transparent: true, depthWrite: false, opacity: 0.7, sizeAttenuation: true }));
  scene.add(dust);

  /* ---- progress ---- */
  const start = (i: number) => INTRO + (i / N) * (1 - INTRO);
  let lay: SceneLayout | null = null;
  let px = 0;
  let py = 0;
  const target = new THREE.Vector3();
  const t2 = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const view = new THREE.Vector3();
  const mid = new THREE.Vector3(0, 0.6, 0);

  function setCamera(e: number) {
    const w = gl.size.w;
    const h = gl.size.h;
    const from = lay ? lay.left : w * 0.4;
    const to = lay ? lay.right : w * 0.94;
    const lo = lay ? lay.top : 0;
    const hi = lay ? lay.bottom : h;
    const room = Math.max(w * 0.25, to - from);
    const roomH = Math.max(h * 0.4, hi - lo);
    st.shift(-((from + to) / 2 / w - 0.5), -((lo + hi) / 2 / h - 0.5));
    // only the front half of the drum is on show: its width is a little less than the drum's
    const halfW = cases ? 4.8 : R * 0.78 + 1.2;
    const halfH = cases ? 3.0 : 2.5;
    const dist = Math.max(halfH / (0.96 * t2 * (roomH / h)), halfW / (0.96 * t2 * (room / h)));
    const elev = cases ? lerp(0.12, 0.08, e) - py * 0.05 : lerp(0.3, 0.24, e) - py * 0.05;
    const az = px * 0.07;
    target.set(0, cases ? lerp(0, 0, e) : lerp(-0.1, -0.2, e), cases ? 0 : 0.6);
    camera.position.set(target.x + dist * Math.cos(elev) * Math.sin(az), target.y + dist * Math.sin(elev), target.z + dist * Math.cos(elev) * Math.cos(az));
    camera.lookAt(target);
    camera.updateMatrixWorld();
    return dist;
  }

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
      const e = quint(win(p, 0, INTRO * 0.95)); // the items settle into place
      // which place is at the front, as a number of places: it moves on at each boundary between two items
      let f = 0;
      for (let k = 1; k < N; k++) f += quint(win(p, start(k) - 0.03, start(k) + 0.03));
      const angle = f * slot;
      drum.rotation.y = cases ? 0 : -angle - (1 - e) * 1.1;

      items.forEach((it, i) => {
        const out = 1 - e;
        const g = it.holder;
        let near: number;
        let round: number;
        if (cases) {
          // a spiral: each cover a step round and a step up from the one before
          const d = i - f;
          near = clamp01(1 - Math.abs(d));
          round = 1 - smooth(win(Math.abs(d), 1.5, 2.6)) * e;
          const th = d * 0.78;
          const r = R + near * 0.8 + out * 3;
          g.position.set(Math.sin(th) * r, d * 1.0 + ((i % 3) - 1) * 1.4 * out, Math.cos(th) * r - R);
          g.rotation.set(0, th + out * 0.5 * ((i % 3) - 1), 0);
        } else {
          const th = i * slot;
          // how far this item is from the front, in places (0 = at the front)
          const dth = Math.abs(((((th - angle) % TAU) + 3 * Math.PI) % TAU) - Math.PI);
          near = clamp01(1 - dth / slot);
          // the half of the drum that turns its back on the viewer shrinks away round the side
          round = 1 - smooth(win(dth, 0.8, 1.8)) * e;
          const r = R * (1 + out * 0.9) + near * 0.95 * e;
          g.position.set(Math.sin(th) * r, ((i % 3) - 1) * 1.5 * out + Math.sin(i * 2.1 + p * 9) * 0.04, Math.cos(th) * r);
          g.rotation.set(out * 0.25 * ((i % 2) - 0.5) * 2, th + out * 0.6 * ((i % 3) - 1), 0);
        }
        // the one at the front is the biggest, the ones beside it step back
        g.scale.setScalar(lerp(0.6, 1, e) * (0.84 + 0.46 * near ** 1.3) * Math.max(round, 0.001));
        g.visible = round > 0.002;
        if (it.face) it.face.color.setScalar(lerp(0.74, 1, near ** 0.6 * e + (1 - e) * 0.6));
        if (it.model && g.visible) {
          // each scene builds as it comes in, and runs, from where the page's scroll has got to, once it is at the front
          const q = clamp01((f - (i - 1)) / 2);
          it.model.set(lerp(0.55, 1, e), near ** 0.8, lerp(0.34, 0.9, q));
        }
      });

      ring.rotation.z = p * TAU * 0.5;
      ring.scale.setScalar(lerp(1.3, 1, e));
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.7 * e;
      dust.rotation.y = p * 0.6;
      scene.updateMatrixWorld();

      const dist = setCamera(e);
      // the glow sits well behind the drum, on the line from the eye through its middle
      view.subVectors(mid, camera.position).normalize();
      halo.position.copy(mid).addScaledVector(view, R + 2);
      halo.scale.setScalar(lerp(3, 9, e) * (1 + (R + 2) / dist));
      (halo.material as THREE.SpriteMaterial).opacity = 0.6 * e;
    },
    anchors(): SceneAnchor[] {
      return [];
    },
    dispose() {
      items.forEach((it) => it.model?.dispose?.());
      textures.forEach((t) => t.dispose());
      blobGeo.dispose();
      ringGeo.dispose();
      dustGeo.dispose();
      st.dispose();
    },
  };

  handle.setProgress(0);
  return handle;
}
