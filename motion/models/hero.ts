import * as THREE from "three";
import { clamp01, lerp, quint, TAU, win } from "../engine";
import { makeLaptop, makePhone, makeTablet, SCREEN_PX, type Device } from "../devices";
import { blobTexture, COLOR, makeBeam, makeCore, type Beam } from "../kit";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * The home page: "one connected system". A laptop, two phones and a tablet, each with one of our own projects on its
 * screen, start loose, as the separate tools in most businesses are; they drift into an arrangement and wake up; beams
 * from an AI core wire them together; then they close up into one set. It reads its own windows from the scroll.
 */

type Pose = [x: number, y: number, z: number, yaw: number, pitch?: number, roll?: number];
interface Spec {
  type: "laptop" | "phone" | "tablet";
  shot: string;
  scale: number;
  final: Pose;
}

const DEVICES: Spec[] = [
  { type: "laptop", shot: "cordial", scale: 1.2, final: [0.3, 0, 0, -0.22] },
  { type: "phone", shot: "phone-faith2", scale: 1.3, final: [-2.3, 1.0, 1.3, 0.4] },
  { type: "phone", shot: "phone-civilchat", scale: 1.3, final: [2.9, 1.0, 1.3, -0.4] },
  { type: "tablet", shot: "grace", scale: 0.95, final: [-3.3, 3.2, -1.7, 0.5] },
];
const ORB = { at: new THREE.Vector3(0.3, 4.5, -0.5), scale: 0.5 };

interface Place {
  p: THREE.Vector3;
  q: THREE.Quaternion;
}
const eul = new THREE.Euler();
const place = (x: number, y: number, z: number, yaw: number, pitch = 0, roll = 0): Place => {
  eul.set(pitch, yaw, roll, "YXZ");
  return { p: new THREE.Vector3(x, y, z), q: new THREE.Quaternion().setFromEuler(eul) };
};

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();
  const n = DEVICES.length;
  const devs: Device[] = [];
  for (const spec of DEVICES) {
    const [tw, th] = SCREEN_PX[spec.type];
    const tex = await env.shot(spec.shot, tw, th);
    const dev = spec.type === "laptop" ? makeLaptop(tex) : spec.type === "phone" ? makePhone(tex) : makeTablet(tex);
    env.textures.push(...dev.textures);
    dev.group.scale.setScalar(spec.scale);
    group.add(dev.group);
    devs.push(dev);
  }

  /* ---- where each one goes: loose, spread out, then close together ---- */
  const fin = DEVICES.map((d) => place(...d.final));
  const C = new THREE.Vector3();
  fin.forEach((f) => C.add(f.p));
  C.divideScalar(n);
  const rnd = env.rnd;
  const scat = fin.map((f, i) => {
    const away = f.p.x - C.x;
    const dir = Math.abs(away) < 0.6 ? (i % 2 ? 1 : -1) : Math.sign(away);
    return place(f.p.x + dir * (0.9 + rnd() * 1.1), f.p.y + 0.4 + rnd() * 1.5, f.p.z + (rnd() - 0.5) * 2.2, DEVICES[i].final[3] + (rnd() - 0.5) * 1.7, (rnd() - 0.5) * 0.4, (rnd() - 0.5) * 0.55);
  });
  const spread = fin.map((f) => ({ p: new THREE.Vector3(C.x + (f.p.x - C.x) * 1.38, f.p.y + 0.35, f.p.z * 1.25 + 0.4), q: f.q }));
  const orbScat = new THREE.Vector3(ORB.at.x - 2.4, ORB.at.y - 0.5, ORB.at.z - 0.8);
  const orbSpread = new THREE.Vector3(ORB.at.x * 1.2 - 0.3, ORB.at.y + 0.35, ORB.at.z);

  /* ---- the core, the beams to each device, a pulse along each, and a light where it arrives ---- */
  const core = makeCore();
  group.add(core.group);
  const beams: Beam[] = devs.map(() => makeBeam(COLOR.bright, 0.017));
  beams.forEach((b) => group.add(b.mesh));
  const pulseGeo = new THREE.SphereGeometry(0.055, 16, 12);
  const pulses = devs.map(() => new THREE.Mesh(pulseGeo, new THREE.MeshBasicMaterial({ color: 0xa6e883, transparent: true })));
  pulses.forEach((m) => group.add(m));
  const nodeGeo = new THREE.SphereGeometry(0.055, 16, 12);
  const nodeGlowGeo = new THREE.SphereGeometry(0.12, 16, 12);
  const nodes = devs.map(() => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(nodeGeo, new THREE.MeshBasicMaterial({ color: COLOR.green, toneMapped: false })));
    g.add(new THREE.Mesh(nodeGlowGeo, new THREE.MeshBasicMaterial({ color: COLOR.green, transparent: true, opacity: 0.25, depthWrite: false, toneMapped: false })));
    g.scale.setScalar(0.001);
    group.add(g);
    return g;
  });

  /* ---- a soft shadow on an invisible floor under each device, fainter the higher it floats ---- */
  const FLOOR = -0.02;
  const shadowTex = blobTexture("20,40,60", 0.5);
  env.textures.push(shadowTex);
  const blobGeo = new THREE.PlaneGeometry(1, 1);
  const blobs = devs.map(() => {
    const m = new THREE.Mesh(blobGeo, new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.renderOrder = -1;
    group.add(m);
    return m;
  });

  const A = new THREE.Vector3();
  const B = new THREE.Vector3();
  const D = new THREE.Vector3();
  const orbPos = new THREE.Vector3();
  const tmpQ = new THREE.Quaternion();
  const frame: Frame = { cx: 0, cy: 0, hw: 1, hh: 1 };

  const model: Model = {
    group,
    // the orb is the last tag
    tags: [...devs.map((d) => d.tagObj), core.group],
    camera: { az: [-0.34, 0.2], elev: [0.17, 0.1] },
    set(_a, _l, p) {
      const eSpread = quint(win(p, 0.05, 0.27)); // loose -> spread out
      const eLink = win(p, 0.3, 0.46); // beams grow
      const eClose = quint(win(p, 0.49, 0.68)); // spread out -> closed up
      const eLive = win(p, 0.68, 0.9);

      devs.forEach((d, i) => {
        const a = scat[i];
        const s = spread[i];
        const f = fin[i];
        // each device drifts a little on its own path while it is loose
        const wob = (1 - eSpread) * 0.24;
        A.set(lerp(a.p.x, s.p.x, eSpread) + Math.sin(p * TAU * 1.5 + i * 1.3) * wob, lerp(a.p.y, s.p.y, eSpread) + Math.cos(p * TAU * 1.5 + i * 1.9) * wob, lerp(a.p.z, s.p.z, eSpread));
        tmpQ.copy(a.q).slerp(f.q, eSpread);
        // spread out -> closed up, one after the other
        const e2 = quint(win(p, 0.49 + i * 0.018, 0.66 + i * 0.018));
        A.lerp(f.p, e2);
        // a phone or a tablet floats; it rises and settles a little as the page scrolls
        if (d.type !== "laptop") A.y += Math.sin(p * TAU * 2 + i * 1.7) * 0.05 * eSpread;
        d.group.position.copy(A);
        d.group.quaternion.copy(tmpQ);
        // the screens wake up: dim while loose, lit as each one is connected
        d.power(0.74 + 0.12 * eSpread + 0.14 * quint(win(p, 0.3 + i * 0.04, 0.42 + i * 0.04)));
        d.open(lerp(0.86, 1, eSpread));
      });

      // the core: loose, then above the set, then wired to every device
      const coreS = ORB.scale * lerp(0.85, 1, eSpread);
      orbPos.copy(orbScat).lerp(orbSpread, eSpread).lerp(ORB.at, eClose);
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
      core.glow.value = Math.max(win(p, 0.28, 0.4), eLive * 0.8);
      (core.mesh.material as THREE.MeshBasicMaterial).opacity = 0.2 + 0.1 * core.glow.value;

      group.updateMatrixWorld(true);
      devs.forEach((d, i) => {
        const g = clamp01((eLink * 1.5 - i * 0.12) / 0.6);
        d.topObj.getWorldPosition(B);
        D.copy(B).sub(orbPos);
        const len = D.length();
        D.divideScalar(len || 1);
        A.copy(orbPos).addScaledVector(D, coreS * 1.02);
        beams[i].aim(A, B, quint(g));
        (beams[i].mesh.material as THREE.MeshBasicMaterial).opacity = 0.85;
        // a pulse runs out along the beam, again and again
        const pm = pulses[i];
        const on = g > 0.98;
        pm.visible = on;
        if (on) {
          const t = (p * (3.2 + (i % 3) * 0.5) + i * 0.17) % 1;
          pm.position.lerpVectors(A, B, t);
          const k = Math.sin(t * Math.PI);
          pm.scale.setScalar(0.5 + 0.9 * k);
          (pm.material as THREE.MeshBasicMaterial).opacity = 0.4 + 0.6 * k;
        }
        // and a light comes on where it arrives
        nodes[i].position.copy(B);
        nodes[i].scale.setScalar(Math.max(0.001, quint(win(g, 0.9, 1)) * (1 + 0.12 * Math.sin(p * TAU * 6 + i))));
      });

      devs.forEach((d, i) => {
        const s = DEVICES[i].scale;
        const hgt = Math.max(0, d.group.position.y + (d.cy - d.extent.h / 2) * s - FLOOR);
        const m = blobs[i];
        m.position.set(d.group.position.x, FLOOR, d.group.position.z);
        const size = Math.max(d.extent.w, d.extent.h * 0.4) * s * 1.35 + hgt * 0.3;
        m.scale.set(size, size * 0.55, 1);
        (m.material as THREE.MeshBasicMaterial).opacity = 0.4 * clamp01(1.2 - hgt / 7);
      });

      // the box round the devices and the core where they are now
      let x0 = Infinity;
      let x1 = -Infinity;
      let y0 = 0;
      let y1 = -Infinity;
      devs.forEach((d, i) => {
        const s = DEVICES[i].scale;
        const pos = d.group.position;
        const hw = (d.extent.w * s) / 2;
        const hh = (d.extent.h * s) / 2;
        const cy = pos.y + d.cy * s;
        x0 = Math.min(x0, pos.x - hw);
        x1 = Math.max(x1, pos.x + hw);
        y0 = Math.min(y0, cy - hh);
        y1 = Math.max(y1, cy + hh);
      });
      const r = 1.8 * coreS;
      x0 = Math.min(x0, orbPos.x - r);
      x1 = Math.max(x1, orbPos.x + r);
      y1 = Math.max(y1, orbPos.y + r);
      frame.cx = (x0 + x1) / 2;
      frame.cy = (y0 + y1) / 2;
      frame.hw = (x1 - x0) / 2;
      frame.hh = (y1 - y0) / 2;
    },
    frame: () => frame,
    dispose() {
      blobGeo.dispose();
      pulseGeo.dispose();
      nodeGeo.dispose();
      nodeGlowGeo.dispose();
    },
  };
  model.set(0, 0, 0);
  return model;
};

export default build;
