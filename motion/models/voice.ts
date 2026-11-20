import * as THREE from "three";
import { clamp01, lerp, quint, TAU } from "../engine";
import { crispDot, floorShadow, chrome, stageMetal, circleLine, GLOW, glowTex, lightSprite, lit, makeScreen, plasmaMaterial, type Screen } from "./glow";
import { drawn } from "./parts";
import { uiTexture } from "./ui";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * AI voice systems: a call being answered. A ring of ninety-six bars (a spectrum, standing upright) round a living
 * orb listens and speaks; ripples go out across the stage with the sound; the live call, the transcript and the
 * follow-up it makes stand beside it. The scroll drives the voice: it goes from a faint murmur to a full signal.
 */

const R0 = 2.0;
const CY = 3.9;
const BARS = 96;

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();
  group.add(floorShadow(env, 8, 6, 0.18));

  /* ---- the stage ---- */
  const plinthMat = stageMetal();
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.9, 0.22, 96), plinthMat);
  plinth.position.y = 0.11;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.73, 0.018, 8, 140), lit(GLOW.green, 0.9));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.225;
  group.add(plinth, rim);
  const ripples = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 6, 120), lit(GLOW.sky, 0.6));
    m.rotation.x = Math.PI / 2;
    m.position.y = 0.24;
    group.add(m);
    return m;
  });
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex(env, "34,66,95"), transparent: true, opacity: 0.12, depthWrite: false, toneMapped: false }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.25;
  pool.scale.set(5.4, 5.4, 1);
  group.add(pool);

  /* ---- the ring of bars round the orb ---- */
  const ring = new THREE.Group();
  ring.position.set(0, CY, 0);
  group.add(ring);
  const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.075, 1, 0.075), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), BARS);
  bars.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(BARS * 3), 3);
  const halos = new THREE.InstancedMesh(new THREE.BoxGeometry(0.26, 1, 0.04), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false, toneMapped: false }), BARS);
  halos.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(BARS * 3), 3);
  bars.frustumCulled = halos.frustumCulled = false;
  ring.add(halos, bars);
  // a hairline inside the bars, and a dial of fine marks outside
  const inner = circleLine(R0 - 0.12, GLOW.sky, 0.5);
  inner.rotation.x = Math.PI / 2;
  ring.add(inner);
  const dial = drawn(env, 1024, 1024, (g, w) => {
    const c = w / 2;
    g.translate(c, c);
    g.strokeStyle = "rgba(34,66,95,0.55)";
    g.lineWidth = 2.5;
    g.beginPath();
    g.arc(0, 0, c * 0.985, 0, TAU);
    g.stroke();
    for (let i = 0; i < 180; i++) {
      const a = (i / 180) * TAU;
      const long = i % 10 === 0;
      g.lineWidth = long ? 2.5 : 1.5;
      g.beginPath();
      g.moveTo(Math.cos(a) * c * 0.985, Math.sin(a) * c * 0.985);
      g.lineTo(Math.cos(a) * c * (long ? 0.93 : 0.955), Math.sin(a) * c * (long ? 0.93 : 0.955));
      g.stroke();
    }
    g.lineCap = "round";
    g.lineWidth = 7;
    g.strokeStyle = "rgba(115,201,74,0.9)";
    [
      [0.3, 0.9],
      [3.4, 3.9],
    ].forEach(([a0, a1]) => {
      g.beginPath();
      g.arc(0, 0, c * 0.985, a0, a1);
      g.stroke();
    });
  });
  const dialMesh = new THREE.Mesh(new THREE.CircleGeometry(R0 + 1.75, 128), new THREE.MeshBasicMaterial({ map: dial, transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false }));
  dialMesh.position.z = -0.15;
  ring.add(dialMesh);

  // the orb
  const pl = plasmaMaterial();
  const orb = new THREE.Mesh(new THREE.SphereGeometry(1.05, 64, 48), pl.mat);
  ring.add(orb);
  ring.add(lightSprite(env, "90,200,150", 5, 0.16));
  ring.add(lightSprite(env, "90,160,255", 8, 0.06));
  const equator = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.02, 10, 140), chrome(0xe3ecf6, 0.24));
  equator.rotation.x = 1.25;
  ring.add(equator);

  // fine lights drifting round the ring
  const MN = 160;
  const mPos = new Float32Array(MN * 3);
  const mp = Array.from({ length: MN }, () => ({ a: env.rnd() * TAU, r: R0 + 0.4 + env.rnd() * 2.2, z: (env.rnd() - 0.5) * 1.6, v: 0.3 + env.rnd() * 0.7 }));
  const mGeo = new THREE.BufferGeometry();
  mGeo.setAttribute("position", new THREE.BufferAttribute(mPos, 3));
  const motes = new THREE.Points(mGeo, new THREE.PointsMaterial({ size: 0.12, map: crispDot(env), color: 0x3e6d97, transparent: true, depthWrite: false, sizeAttenuation: true, opacity: 0.45, toneMapped: false }));
  motes.frustumCulled = false;
  ring.add(motes);

  /* ---- the live call, the transcript and the follow-up ---- */
  const mk = (kind: "voice" | "chat" | "tasks", w: number, h: number, x: number, y: number, z: number, yaw: number, seed: number): Screen => {
    const s = makeScreen(env, uiTexture(env, kind, 512, Math.round((512 * h) / w), seed, "#5db536"), w, h, { accent: kind === "tasks" ? GLOW.green : GLOW.sky, depth: 0.08, radius: 0.1, glow: 0.2 });
    s.group.rotation.order = "YXZ";
    s.group.position.set(x, y, z);
    s.group.rotation.y = yaw;
    group.add(s.group);
    return s;
  };
  const call = mk("voice", 2.2, 1.3, -4.1, 2.6, 1.3, 0.4, 5);
  const chat = mk("chat", 2.3, 1.5, 4.2, 3.0, 1.0, -0.4, 6);
  const tasks = mk("tasks", 1.9, 1.2, 2.9, 0.95, 2.5, -0.3, 7);
  const cards = [call, chat, tasks];
  const homes = cards.map((c) => c.group.position.clone());

  const frame: Frame = { cx: 0, cy: 3.65, hw: 5.4, hh: 3.8 };
  const blue = new THREE.Color(0x2f6fb5);
  const green = new THREE.Color(0x73c94a);
  const d = new THREE.Object3D();
  const col = new THREE.Color();
  const model: Model = {
    group,
    tags: [call.top, ring, tasks.top],
    camera: { az: [-0.2, 0.2], elev: [0.15, 0.1] },
    floorY: 0,
    set(a, l, p) {
      // the voice: a murmur at first, a full signal while it runs
      const amp = 0.18 + 1.05 * (0.35 * a + 0.65 * l);
      for (let i = 0; i < BARS; i++) {
        const th = (i / BARS) * TAU;
        const e = Math.abs(Math.sin(th * 5 + p * 19) * Math.cos(th * 2.3 - p * 11)) * 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(th * 11 + p * 31));
        const h = 0.1 + amp * e;
        d.position.set(Math.cos(th) * (R0 + h / 2), Math.sin(th) * (R0 + h / 2), 0);
        d.rotation.set(0, 0, th - Math.PI / 2);
        d.scale.set(1, h, 1);
        d.updateMatrix();
        bars.setMatrixAt(i, d.matrix);
        d.scale.set(1, h * 1.02, 1);
        d.updateMatrix();
        halos.setMatrixAt(i, d.matrix);
        col.copy(blue).lerp(green, clamp01((h - 0.4) / 1.1)).multiplyScalar(0.7 + 0.5 * clamp01(h / 1.2));
        bars.setColorAt(i, col);
        halos.setColorAt(i, col);
      }
      bars.instanceMatrix.needsUpdate = halos.instanceMatrix.needsUpdate = true;
      if (bars.instanceColor) bars.instanceColor.needsUpdate = true;
      if (halos.instanceColor) halos.instanceColor.needsUpdate = true;
      ring.rotation.y = -0.18 + p * 0.3;
      dialMesh.rotation.z = p * 0.8;
      pl.u.uT.value = p * 7;
      pl.u.uGlow.value = 0.35 + 0.65 * (0.3 * a + 0.7 * l);
      orb.scale.setScalar(1 + 0.03 * Math.sin(p * TAU * 9) * l);
      equator.rotation.z = p * TAU * 0.8;
      for (let i = 0; i < MN; i++) {
        const q = mp[i];
        const ang = q.a + p * TAU * q.v;
        mPos[i * 3] = Math.cos(ang) * q.r;
        mPos[i * 3 + 1] = Math.sin(ang) * q.r;
        mPos[i * 3 + 2] = q.z;
      }
      mGeo.attributes.position.needsUpdate = true;
      // ripples across the stage, going out with the sound
      ripples.forEach((m, k) => {
        const s = (p * 2.2 + k / 3) % 1;
        m.scale.setScalar(0.4 + 2.5 * s);
        (m.material as THREE.MeshBasicMaterial).opacity = (1 - s) * 0.7 * (0.3 + 0.7 * l);
      });
      (rim.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.5 * l;
      (pool.material as THREE.MeshBasicMaterial).opacity = 0.1 + 0.06 * l;
      // the cards come in from the sides
      cards.forEach((c, i) => {
        const e = quint(clamp01((a * 1.5 - i * 0.1) / 0.65));
        const home = homes[i];
        c.group.position.set(home.x * lerp(1.12, 1, e), home.y + (1 - e) * 0.5 + 0.06 * Math.sin(p * TAU * 2 + i * 2), home.z + (1 - e) * 1.2);
        c.group.scale.setScalar(Math.max(0.001, lerp(0.7, 1, e)));
        (c.front.material as THREE.MeshBasicMaterial).color.setScalar(0.5 + 0.5 * e);
        (c.light.material as THREE.SpriteMaterial).opacity = (0.1 + 0.16 * l) * e;
      });
      group.updateMatrixWorld(true);
    },
    frame: () => frame,
  };
  model.set(1, 1, 0.5);
  return model;
};

export default build;
