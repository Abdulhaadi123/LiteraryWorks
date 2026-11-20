import * as THREE from "three";
import { clamp01, createStage, lerp, quint, TAU, win } from "../engine";
import { blobTexture, canvasTexture, COLOR, makeBeam, makeCore, makePanel, rectShadowTexture, type Beam, type Panel } from "../kit";
import type { SceneAnchor, SceneCtx, SceneHandle, SceneLayout } from "../types";
import { uiTexture, type UiKind } from "../ui";
import { systemVariants } from "@/lib/scenes";

/**
 * "One connected system": an AI core and the kinds of software it is wired into. The cards start scattered, as the
 * separate tools in most businesses are; they gather into a ring around the core; beams carry the work between
 * them; then they close up into one product dashboard, with the core docked in its corner as the assistant. Each
 * page picks its own cards (`ctx.data.variant`). Everything is a pure function of the scroll progress.
 */

const FOV = 28;
const CW = 2;
const CH = 1.25;
const GAP = 0.13;
const breathe = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

interface Pose {
  p: THREE.Vector3;
  q: THREE.Quaternion;
  s: number;
}
const eul = new THREE.Euler();
function pose(x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, s = 1): Pose {
  eul.set(rx, ry, rz, "YXZ");
  return { p: new THREE.Vector3(x, y, z), q: new THREE.Quaternion().setFromEuler(eul), s };
}

/** Where the loose cards float at the start; a scene with fewer cards uses the first few, in this order. */
const SCATTER: Pose[] = [
  pose(-3.2, 1.7, 1.5, 0.05, 0.48, -0.05, 1.02),
  pose(2.3, 2.3, -1.3, -0.04, -0.42, 0.05, 0.96),
  pose(3.4, -0.5, 0.8, 0.02, -0.55, -0.04, 1),
  pose(-3.6, -1.7, -1, 0.04, 0.5, 0.05, 0.95),
  pose(-0.1, -3, 1.7, -0.08, 0.16, 0.02, 1),
  pose(1.2, 0.9, -3.4, 0.02, -0.2, -0.03, 1.1),
];
/** Which of those places a scene with n cards uses. */
const SCATTER_FOR: Record<number, number[]> = { 3: [0, 2, 3], 4: [0, 1, 2, 3], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5] };
const RING_Z = [0.3, -0.25, 0.45, -0.15, 0.4, -0.3];

const ORB_SCATTER = new THREE.Vector3(0.1, 0.05, -0.3);
const ORIGIN = new THREE.Vector3();
/** The dashboard: one flat arrangement, turned a little toward the camera like a product shot. */
const dashM = new THREE.Matrix4().compose(
  new THREE.Vector3(0.1, -0.05, 0),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.09, -0.36, 0.015, "YXZ")),
  new THREE.Vector3(1, 1, 1),
);

export default async function build(ctx: SceneCtx): Promise<SceneHandle> {
  const gl = ctx.gl;
  const renderer = gl.renderer;
  const st = createStage(gl, { fov: FOV, exposure: 1 });
  const { scene, camera } = st;
  const textures: THREE.Texture[] = [];
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  scene.environmentIntensity = 0.85;

  const kinds: UiKind[] = systemVariants[ctx.data?.variant ?? "hero"] ?? systemVariants.hero;
  const n = kinds.length;

  /* ---- where each card goes: loose, in a ring, then in the dashboard grid ---- */
  const scatter = kinds.map((_, i) => SCATTER[(SCATTER_FOR[n] ?? SCATTER_FOR[6])[i]]);
  // the first card at the top of the ring, then clockwise
  const ringRx = n === 3 ? 2.7 : 3.1;
  const ring = kinds.map((_, i) => {
    const a = Math.PI / 2 - (i * TAU) / n;
    const x = Math.cos(a) * ringRx;
    return pose(x, Math.sin(a) * 2.62, RING_Z[i % 6], 0, -x * 0.06, 0, 1.1);
  });
  const cols = n <= 3 ? n : n === 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const dashW = cols * CW + (cols - 1) * GAP;
  const dashH = rows * CH + (rows - 1) * GAP;
  const tmpM = new THREE.Matrix4();
  const tmpP = new THREE.Vector3();
  const tmpQ = new THREE.Quaternion();
  const tmpS = new THREE.Vector3();
  const dash = kinds.map((_, i) => {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, n - row * cols);
    const c = (i % cols) + (cols - inRow) / 2;
    const x = (c - (cols - 1) / 2) * (CW + GAP);
    const y = ((rows - 1) / 2 - row) * (CH + GAP);
    tmpM.compose(new THREE.Vector3(x, y, 0), new THREE.Quaternion(), new THREE.Vector3(1, 1, 1)).premultiply(dashM);
    tmpM.decompose(tmpP, tmpQ, tmpS);
    return { p: tmpP.clone(), q: tmpQ.clone(), s: 1 } as Pose;
  });
  const dashOrb = new THREE.Vector3(dashW / 2 - 0.12, -dashH / 2 - 0.13, 1).applyMatrix4(dashM);

  /* ---- the cards ---- */
  const panels: Panel[] = [];
  const cardShadow = rectShadowTexture();
  textures.push(cardShadow);
  const texCache = new Map<UiKind, THREE.Texture>();
  for (const k of kinds) {
    let tex = texCache.get(k);
    if (!tex) {
      tex = uiTexture(k, aniso);
      texCache.set(k, tex);
      textures.push(tex);
    }
    const panel = makePanel(CW, CH, tex, cardShadow);
    scene.add(panel.group);
    panels.push(panel);
    await breathe();
  }

  /* ---- the core ---- */
  const core = makeCore();
  scene.add(core.group);
  await breathe();

  const haloTex = blobTexture("90,160,255", 0.55);
  const shadowTex = blobTexture("22,52,110", 0.5);
  textures.push(haloTex, shadowTex);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, opacity: 0.7 }));
  scene.add(halo);

  /* ---- "running" lights on each card, and waves from the core once it is live ---- */
  const ledGeo = new THREE.SphereGeometry(0.05, 16, 12);
  const ledGlowGeo = new THREE.SphereGeometry(0.1, 16, 12);
  const leds = panels.map((panel) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(ledGeo, new THREE.MeshBasicMaterial({ color: COLOR.green, toneMapped: false })));
    g.add(new THREE.Mesh(ledGlowGeo, new THREE.MeshBasicMaterial({ color: COLOR.green, transparent: true, opacity: 0.22, depthWrite: false, toneMapped: false })));
    g.position.set(panel.hw - 0.17, panel.hh - 0.17, 0.14);
    g.scale.setScalar(0.001);
    panel.group.add(g);
    return g;
  });
  const waveTex = canvasTexture(
    128,
    128,
    (g, w) => {
      g.strokeStyle = "rgba(59,130,246,0.95)";
      g.lineWidth = 3.5;
      g.beginPath();
      g.arc(w / 2, w / 2, w / 2 - 8, 0, TAU);
      g.stroke();
    },
    1,
  );
  textures.push(waveTex);
  const waves = [0, 1].map(() => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: waveTex, transparent: true, depthWrite: false, opacity: 0 }));
    scene.add(s);
    return s;
  });

  /* ---- beams and pulses ---- */
  const beams: Beam[] = panels.map(() => makeBeam(COLOR.bright, 0.016));
  beams.forEach((b) => scene.add(b.mesh));
  const pulseGeo = new THREE.SphereGeometry(0.075, 16, 12);
  const pulses = panels.map(() => new THREE.Mesh(pulseGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })));
  pulses.forEach((m) => scene.add(m));

  /* ---- a fine dust in the air ---- */
  const dustN = 150;
  const dustPos = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) {
    const a = Math.random() * TAU;
    const b = Math.acos(2 * Math.random() - 1);
    const r = 5 + Math.random() * 4;
    dustPos[i * 3] = Math.sin(b) * Math.cos(a) * r * 1.2;
    dustPos[i * 3 + 1] = Math.cos(b) * r * 0.85;
    dustPos[i * 3 + 2] = Math.sin(b) * Math.sin(a) * r - 2;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dustTex = blobTexture("59,130,246", 0.9);
  textures.push(dustTex);
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ map: dustTex, size: 0.16, transparent: true, depthWrite: false, opacity: 0.75, sizeAttenuation: true }));
  scene.add(dust);

  /* ---- soft shadows on an invisible floor ---- */
  const FLOOR = -4.1;
  const blobGeo = new THREE.PlaneGeometry(1, 1);
  const blobs = [...kinds, null].map(() => {
    const m = new THREE.Mesh(blobGeo, new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.renderOrder = -1;
    scene.add(m);
    return m;
  });
  await breathe();

  /* ---- progress ---- */
  const A = new THREE.Vector3();
  const B = new THREE.Vector3();
  let lay: SceneLayout | null = null;
  let px = 0;
  let py = 0;
  const target = new THREE.Vector3();
  const t2 = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const ringHalfW = ringRx + 1.4;
  const dashHalfW = dashW / 2 + 0.3;
  const dashHalfH = dashH / 2 + 1.15;

  function setCamera(p: number, eRing: number, eDash: number) {
    const w = gl.size.w;
    const h = gl.size.h;
    const from = lay ? lay.left : w * 0.4;
    const to = lay ? lay.right : w * 0.94;
    const lo = lay ? lay.top : 0;
    const hi = lay ? lay.bottom : h;
    const room = Math.max(w * 0.25, to - from);
    const roomH = Math.max(h * 0.4, hi - lo);
    st.shift(-((from + to) / 2 / w - 0.5), -((lo + hi) / 2 / h - 0.5));
    // how much of the world has to fit: loose scatter, the ring, then the flat dashboard
    const halfW = lerp(lerp(4.8, ringHalfW, eRing), dashHalfW, eDash);
    const halfH = lerp(lerp(3.9, 3.6, eRing), dashHalfH, eDash);
    const dist = Math.max(halfH / (0.96 * t2 * (roomH / h)), halfW / (0.96 * t2 * (room / h)));
    const az = lerp(-0.2, 0.12, p) + px * 0.07;
    const elev = lerp(0.1, 0.08, eDash) - py * 0.05;
    target.set(0, lerp(0, -0.1, eDash), 0);
    camera.position.set(
      target.x + dist * Math.cos(elev) * Math.sin(az),
      target.y + dist * Math.sin(elev),
      target.z + dist * Math.cos(elev) * Math.cos(az),
    );
    camera.lookAt(target);
    camera.updateMatrixWorld();
    return dist;
  }

  const orbPos = new THREE.Vector3();
  const view = new THREE.Vector3();
  const dir = new THREE.Vector3();
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
      const eRing = quint(win(p, 0.07, 0.27)); // scatter -> ring
      const eLink = win(p, 0.3, 0.46); // beams grow
      const eDash = quint(win(p, 0.5, 0.68)); // ring -> dashboard
      const eLive = win(p, 0.68, 0.9);

      panels.forEach((panel, i) => {
        const a = scatter[i];
        const b = ring[i];
        const c = dash[i];
        // the cards drift a little on their own path while they are scattered
        const wob = (1 - eRing) * 0.22;
        tmpP.set(
          lerp(a.p.x, b.p.x, eRing) + Math.sin(p * TAU * 1.5 + i) * wob,
          lerp(a.p.y, b.p.y, eRing) + Math.cos(p * TAU * 1.5 + i * 1.7) * wob,
          lerp(a.p.z, b.p.z, eRing),
        );
        tmpQ.copy(a.q).slerp(b.q, eRing);
        let s = lerp(a.s, b.s, eRing);
        // ring -> dashboard
        const e2 = quint(win(p, 0.5 + i * 0.018, 0.66 + i * 0.018));
        tmpP.lerp(c.p, e2);
        tmpQ.slerp(c.q, e2);
        s = lerp(s, c.s, e2);
        panel.group.position.copy(tmpP);
        panel.group.quaternion.copy(tmpQ);
        panel.group.scale.setScalar(s);
      });

      // the core: in the middle of the ring, then small in the corner of the dashboard
      const coreS = lerp(lerp(1, 1.08, eRing), 0.42, eDash);
      orbPos.copy(ORB_SCATTER).lerp(ORIGIN, eRing).lerp(dashOrb, eDash);
      core.group.position.copy(orbPos);
      core.group.scale.setScalar(coreS);
      core.group.rotation.y = p * 2.4;
      core.rings.forEach((r, i) => {
        r.rotation.y = p * TAU * (i ? -0.9 : 0.7);
      });
      core.sats.forEach((s, i) => {
        const ang = p * TAU * (i ? 3.1 : 2.4) + i * 2.1;
        const r = s.userData.r as number;
        s.position.set(Math.cos(ang) * r, 0, Math.sin(ang) * r);
      });
      core.glow.value = Math.max(win(p, 0.28, 0.4) * (1 - eDash * 0.5), eLive * 0.8);
      (core.mesh.material as THREE.MeshBasicMaterial).opacity = 0.2 + 0.1 * core.glow.value;
      core.rings.forEach((r) => {
        r.visible = 1 - eDash > 0.02;
      });
      const haloSize = lerp(7, 3.4, eDash) * coreS ** 0.3;
      (halo.material as THREE.SpriteMaterial).opacity = lerp(0.55, 0.9, core.glow.value) * lerp(1, 0.6, eDash);

      // beams from the core to each card
      scene.updateMatrixWorld();
      panels.forEach((panel, i) => {
        const g = clamp01((eLink * 1.5 - i * 0.1) / 0.6);
        const fade = 1 - win(p, 0.5, 0.6);
        dir.copy(panel.group.position).sub(orbPos);
        const len = dir.length();
        dir.divideScalar(len || 1);
        A.copy(orbPos).addScaledVector(dir, coreS * 1.02);
        B.copy(panel.group.position).addScaledVector(dir, -0.7);
        beams[i].aim(A, B, quint(g));
        (beams[i].mesh.material as THREE.MeshBasicMaterial).opacity = 0.85 * fade;
        // a pulse runs out along the beam, again and again
        const pm = pulses[i];
        const on = g > 0.98 && fade > 0.02;
        pm.visible = on;
        if (on) {
          const t = (p * (3.2 + (i % 3) * 0.5) + i * 0.17) % 1;
          pm.position.lerpVectors(A, B, t);
          const k = Math.sin(t * Math.PI);
          pm.scale.setScalar(0.5 + 0.9 * k);
          (pm.material as THREE.MeshBasicMaterial).opacity = fade * (0.4 + 0.6 * k);
        }
      });

      dust.rotation.y = p * 0.5;
      dust.rotation.x = p * 0.12;

      // shadows on the floor
      panels.forEach((panel, i) => {
        const m = blobs[i];
        const hgt = Math.max(0.1, panel.group.position.y - FLOOR);
        m.position.set(panel.group.position.x, FLOOR, panel.group.position.z);
        const sc = (2.6 + hgt * 0.22) * panel.group.scale.x;
        m.scale.set(sc, sc * 0.62, 1);
        (m.material as THREE.MeshBasicMaterial).opacity = 0.34 * clamp01(1.25 - hgt / 9);
      });
      const ob = blobs[n];
      const oh = Math.max(0.1, orbPos.y - FLOOR);
      ob.position.set(orbPos.x, FLOOR, orbPos.z);
      const os = (2.4 + oh * 0.2) * coreS;
      ob.scale.set(os, os * 0.62, 1);
      (ob.material as THREE.MeshBasicMaterial).opacity = 0.4 * clamp01(1.25 - oh / 9);

      const dist = setCamera(p, eRing, eDash);
      // the glow sits well behind the model, on the line from the eye through the core, so it never cuts through a card
      view.subVectors(orbPos, camera.position).normalize();
      halo.position.copy(orbPos).addScaledVector(view, 3.6);
      halo.scale.setScalar(haloSize * (1 + 3.6 / dist));

      // everything is running: a green light comes on at the corner of each card, one after the other
      leds.forEach((led, i) => {
        const k = quint(win(p, 0.7 + i * 0.035, 0.78 + i * 0.035));
        led.scale.setScalar(Math.max(0.001, k * (1 + 0.12 * Math.sin(p * TAU * 6 + i))));
      });
      // and the core sends out a wave now and then
      waves.forEach((wv, i) => {
        const ph = (p * 5 + i * 0.5) % 1;
        const live = win(p, 0.66, 0.74);
        wv.visible = live > 0;
        wv.position.copy(orbPos).addScaledVector(view, -0.9);
        wv.scale.setScalar(coreS * (2.5 + ph * 2.6));
        (wv.material as THREE.SpriteMaterial).opacity = live * (1 - ph) ** 1.6 * 0.6;
      });
    },
    anchors(): SceneAnchor[] {
      camera.updateMatrixWorld();
      return ctx.keys.map((key) => {
        const i = kinds.indexOf(key as UiKind);
        if (i < 0) return { x: 0, y: 0, behind: true };
        const panel = panels[i];
        panel.group.updateMatrixWorld();
        A.set(-panel.hw + 0.1, panel.hh - 0.02, 0.04);
        panel.group.localToWorld(A);
        return st.project(A);
      });
    },
    dispose() {
      textures.forEach((t) => t.dispose());
      blobGeo.dispose();
      pulseGeo.dispose();
      dustGeo.dispose();
      ledGeo.dispose();
      ledGlowGeo.dispose();
      st.dispose();
    },
  };

  handle.setProgress(0);
  return handle;
}
