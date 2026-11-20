import * as THREE from "three";
import { clamp01, createStage, lerp, quint, TAU, win } from "../engine";
import { blobTexture, COLOR, makeBeam, makeCore, makePanel, rectShadowTexture, type Panel } from "../kit";
import type { SceneAnchor, SceneCtx, SceneHandle, SceneLayout } from "../types";
import { uiTexture, type UiKind } from "../ui";

/**
 * A rotary deck: one glass card for each item (a service, a case study) on a drum. Scrolling turns the drum one
 * place at a time; the card at the front comes forward and lights up while the copy beside it describes it, and a
 * small AI core above the drum sends a beam to it. The cards first fly in from all sides and settle onto the drum.
 */

const FOV = 28;
const CW = 2.7;
const CH = 1.6875;
/** The first part of the scene is the cards flying in; the items then share the rest. */
const INTRO = 0.09;
const breathe = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

/** The picture drawn for each item, by its id; anything else takes the next one from the spare list. */
const KIND: Record<string, UiKind> = {
  "ai-automation": "flows",
  "ai-voice-systems": "voice",
  "saas-platforms": "saas",
  "enterprise-software": "data",
  "ai-web-apps": "browser",
  "ai-mobile-apps": "phone",
  "ui-ux-design": "wireframe",
  "cloud-devops": "servers",
  "construction-technology": "blueprint",
  "ai-medical-scribe": "assistant",
  "ai-voice-system": "voice",
  "ai-sales-coaching": "report",
};
const SPARE: UiKind[] = ["apps", "data", "cloud", "assistant", "flows", "saas"];

export default async function build(ctx: SceneCtx): Promise<SceneHandle> {
  const gl = ctx.gl;
  const renderer = gl.renderer;
  const st = createStage(gl, { fov: FOV, exposure: 1 });
  const { scene, camera } = st;
  const textures: THREE.Texture[] = [];
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  scene.environmentIntensity = 0.85;

  const ids = ctx.data?.items?.map((i) => i.id) ?? ["a", "b", "c", "d", "e", "f"];
  const N = Math.max(3, ids.length);
  const R = Math.max(3.1, (CW / 2 + 0.22) / Math.tan(Math.PI / N));
  const slot = TAU / N;

  /* ---- the cards, on a drum ---- */
  const drum = new THREE.Group();
  scene.add(drum);
  const cardShadow = rectShadowTexture();
  textures.push(cardShadow);
  const panels: Panel[] = [];
  const faces: THREE.MeshBasicMaterial[] = [];
  const texCache = new Map<UiKind, THREE.Texture>();
  let spare = 0;
  for (let i = 0; i < N; i++) {
    const kind = KIND[ids[i]] ?? SPARE[spare++ % SPARE.length];
    let tex = texCache.get(kind);
    if (!tex) {
      tex = uiTexture(kind, aniso);
      texCache.set(kind, tex);
      textures.push(tex);
    }
    const panel = makePanel(CW, CH, tex, cardShadow);
    drum.add(panel.group);
    panels.push(panel);
    faces.push((panel.body.material as THREE.Material[])[0] as THREE.MeshBasicMaterial);
    if (i % 3 === 2) await breathe();
  }

  /* ---- the core above the drum, and the glow behind it ---- */
  const core = makeCore();
  scene.add(core.group);
  await breathe();
  const haloTex = blobTexture("90,160,255", 0.55);
  const shadowTex = blobTexture("22,52,110", 0.5);
  const dustTex = blobTexture("59,130,246", 0.9);
  textures.push(haloTex, shadowTex, dustTex);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, opacity: 0.6 }));
  scene.add(halo);

  /* ---- a beam from the core to the card in front, and a pulse along it ---- */
  const beam = makeBeam(COLOR.bright, 0.016);
  scene.add(beam.mesh);
  const pulseGeo = new THREE.SphereGeometry(0.075, 16, 12);
  const pulse = new THREE.Mesh(pulseGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
  scene.add(pulse);

  /* ---- a ring of light on the floor, a soft shadow, a fine dust in the air ---- */
  const FLOOR = -1.65;
  const ringGeo = new THREE.TorusGeometry(R + 0.55, 0.014, 8, 220);
  const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x5b9bf5, transparent: true, opacity: 0.7 }));
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
  const dustN = 130;
  const dustPos = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) {
    const a = Math.random() * TAU;
    const r = R + 0.8 + Math.random() * 4;
    dustPos[i * 3] = Math.cos(a) * r;
    dustPos[i * 3 + 1] = (Math.random() - 0.35) * 6;
    dustPos[i * 3 + 2] = Math.sin(a) * r - 1;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ map: dustTex, size: 0.16, transparent: true, depthWrite: false, opacity: 0.7, sizeAttenuation: true }));
  scene.add(dust);
  await breathe();

  /* ---- progress ---- */
  const start = (i: number) => INTRO + (i / N) * (1 - INTRO);
  let lay: SceneLayout | null = null;
  let px = 0;
  let py = 0;
  const target = new THREE.Vector3();
  const t2 = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const A = new THREE.Vector3();
  const B = new THREE.Vector3();
  const view = new THREE.Vector3();
  const orbPos = new THREE.Vector3(0, 2.75, 0);

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
    const halfW = R + 1.7;
    const halfH = 2.55;
    const dist = Math.max(halfH / (0.96 * t2 * (roomH / h)), halfW / (0.96 * t2 * (room / h)));
    const elev = 0.17 - py * 0.05;
    const az = px * 0.07;
    target.set(0, lerp(0.7, 0.85, e), 0);
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
      const e = quint(win(p, 0, INTRO * 0.95)); // the cards settle onto the drum
      // which place is at the front: it moves on at each boundary between two items
      let f = 0;
      for (let k = 1; k < N; k++) f += quint(win(p, start(k) - 0.03, start(k) + 0.03));
      const angle = f * slot;
      drum.rotation.y = -angle - (1 - e) * 1.1;

      panels.forEach((panel, i) => {
        const th = i * slot;
        // how far this card is from the front, in places (0 = at the front)
        const dth = Math.abs(((((th - angle) % TAU) + 3 * Math.PI) % TAU) - Math.PI);
        const near = clamp01(1 - dth / slot);
        const out = 1 - e;
        const r = R * (1 + out * 0.9) + near * 0.95 * e;
        const y = ((i % 3) - 1) * 1.5 * out + Math.sin(i * 2.1 + p * 9) * 0.05;
        const g = panel.group;
        g.position.set(Math.sin(th) * r, y, Math.cos(th) * r);
        g.rotation.set(out * 0.25 * ((i % 2) - 0.5) * 2, th + out * 0.6 * ((i % 3) - 1), 0);
        g.scale.setScalar(lerp(0.6, 1, e) * (1 + 0.28 * near ** 1.4));
        faces[i].color.setScalar(lerp(0.78, 1, near ** 0.6 * e + (1 - e) * 0.6));
      });

      // the core, and its beam to the card in front
      orbPos.set(0, 2.75 + Math.sin(p * TAU * 2) * 0.08, 0);
      core.group.position.copy(orbPos);
      core.group.scale.setScalar(lerp(0.2, 0.5, e));
      core.group.rotation.y = p * 3;
      core.rings.forEach((r, i) => {
        r.rotation.y = p * TAU * (i ? -1.4 : 1.1);
      });
      core.sats.forEach((s, i) => {
        const ang = p * TAU * (i ? 5.5 : 4) + i * 2.1;
        const rr = s.userData.r as number;
        s.position.set(Math.cos(ang) * rr, 0, Math.sin(ang) * rr);
      });
      core.glow.value = e * (0.5 + 0.5 * Math.sin(p * TAU * 6) ** 2);
      scene.updateMatrixWorld();
      A.copy(orbPos).add(view.set(0, -0.5, 0.15));
      B.set(0, 1.15, R + 0.6);
      beam.aim(A, B, e > 0.99 ? 1 : 0);
      (beam.mesh.material as THREE.MeshBasicMaterial).opacity = 0.7;
      const t = (p * 14) % 1;
      pulse.visible = e > 0.99;
      pulse.position.lerpVectors(A, B, t);
      pulse.scale.setScalar(0.5 + 0.9 * Math.sin(t * Math.PI));
      (pulse.material as THREE.MeshBasicMaterial).opacity = 0.4 + 0.6 * Math.sin(t * Math.PI);

      ring.rotation.z = p * TAU * 0.5;
      ring.scale.setScalar(lerp(1.3, 1, e));
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.7 * e;
      dust.rotation.y = p * 0.6;

      const dist = setCamera(e);
      // the glow sits well behind the drum, on the line from the eye through the core
      view.subVectors(orbPos, camera.position).normalize();
      halo.position.copy(orbPos).addScaledVector(view, R + 2);
      halo.scale.setScalar(lerp(3, 8, e) * (1 + (R + 2) / dist));
      (halo.material as THREE.SpriteMaterial).opacity = 0.6 * e;
    },
    anchors(): SceneAnchor[] {
      return [];
    },
    dispose() {
      textures.forEach((t) => t.dispose());
      blobGeo.dispose();
      pulseGeo.dispose();
      ringGeo.dispose();
      dustGeo.dispose();
      st.dispose();
    },
  };

  handle.setProgress(0);
  return handle;
}
