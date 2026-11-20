import * as THREE from "three";
import { clamp01, lerp, quint, TAU, win } from "../engine";
import { C, dot, fillRR, glass, marker, plateTexture, skel, smoothstep, unlit } from "./parts";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * AI voice systems: a call being answered. The caller's screen sits inside a ring of sound bars that start as a
 * dotted circle and wake up into a live waveform, ripples spread out from it, and the live transcript and the
 * follow-up come in beside it.
 */

const N = 72;
const RB = 2.25;
const CY = 2.15;

const build: ModelBuilder = async (env, mini) => {
  const group = new THREE.Group();
  const phoneTex = await env.shot("phone-faith3", 512, 1108);

  /* ---- the caller's screen ---- */
  const phone = glass(env, phoneTex, 1.3, 2.81, { radius: 0.2, depth: 0.07 });
  group.add(phone.group);

  /* ---- the ring of sound bars: a thin box for each, its base on the circle, pointing outward ---- */
  const geo = new THREE.BoxGeometry(0.07, 1, 0.07);
  geo.translate(0, 0.5, 0);
  const bars = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ toneMapped: false }), N);
  const navy = new THREE.Color(0x22425f);
  const green = new THREE.Color(0x73c94a);
  const tmpC = new THREE.Color();
  for (let k = 0; k < N; k++) {
    const u = Math.acos(Math.abs(Math.cos((k / N) * TAU)));
    bars.setColorAt(k, tmpC.copy(navy).lerp(green, 0.25 + 0.75 * Math.sin(u)));
  }
  bars.frustumCulled = false;
  const ringGroup = new THREE.Group();
  ringGroup.position.set(0, CY, -0.35);
  ringGroup.add(bars);
  group.add(ringGroup);
  const dummy = new THREE.Object3D();

  /* ---- ripples ---- */
  const rippleGeo = new THREE.TorusGeometry(1, 0.012, 6, 120);
  const ripples = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(rippleGeo, unlit(0x73c94a, 0));
    m.position.set(0, CY, -0.4);
    group.add(m);
    return m;
  });

  /* ---- the transcript and the follow-up ---- */
  const chat = glass(env, plateTexture(env, 640, 400, (g) => {
    const rows: [boolean, number][] = [[false, 330], [true, 260], [false, 380], [true, 210]];
    rows.forEach(([mine, w], i) => {
      const y = 36 + i * 80;
      if (mine) {
        fillRR(g, 640 - 46 - w, y, w, 60, 26, C.navy);
        skel(g, 640 - 46 - w + 24, y + 18, w - 48, 8, "rgba(255,255,255,0.8)");
        skel(g, 640 - 46 - w + 24, y + 36, (w - 48) * 0.6, 8, "rgba(255,255,255,0.5)");
      } else {
        dot(g, 40, y + 30, 18, C.sky);
        fillRR(g, 72, y, w, 60, 26, C.soft);
        skel(g, 96, y + 18, w - 48, 8);
        skel(g, 96, y + 36, (w - 48) * 0.55, 8);
      }
    });
    [0, 1, 2].forEach((i) => dot(g, 94 + i * 24, 372, 6, i === 1 ? C.green : C.sky));
  }), 2.3, 1.44, { radius: 0.14, depth: 0.05 });
  const summary = glass(env, plateTexture(env, 560, 460, (g) => {
    skel(g, 40, 38, 220, 14, C.navy);
    skel(g, 40, 66, 140, 8);
    [0, 1, 2, 3].forEach((i) => {
      const y = 118 + i * 62;
      dot(g, 62, y + 14, 17, C.green);
      g.strokeStyle = "#191716";
      g.lineWidth = 4;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(54, y + 14);
      g.lineTo(60, y + 20);
      g.lineTo(71, y + 8);
      g.stroke();
      skel(g, 96, y + 4, 300 - i * 30, 10, C.navy);
      skel(g, 96, y + 22, 200 - i * 20, 7);
    });
    fillRR(g, 40, 384, 210, 46, 23, C.green);
    skel(g, 72, 402, 110, 10, "rgba(25,23,22,0.7)");
  }), 1.9, 1.56, { radius: 0.14, depth: 0.05 });
  group.add(chat.group, summary.group);

  const frame: Frame = { cx: 0, cy: CY, hw: 4.8, hh: 3.5 };
  const model: Model = {
    group,
    tags: [marker(phone.group, -0.55, 1.3, 0.06), marker(ringGroup, RB * 0.72, RB * 0.72, 0), marker(summary.group, -0.85, 0.7, 0.05)],
    camera: { az: [-0.22, 0.24], elev: [0.08, 0.14] },
    ground: true,
    floorY: 0,
    set(a, l, p) {
      const eA = quint(win(a, 0.05, 0.9));
      phone.group.position.set(lerp(0.5, 0, eA), lerp(3.2, CY, eA), lerp(1.2, 0.3, eA));
      phone.group.rotation.set(lerp(0.25, 0, eA), lerp(-0.6, -0.12, eA), lerp(-0.2, 0, eA));
      // the side cards slide in from the sides
      const eC = quint(win(a, 0.25, 1));
      chat.group.position.set(lerp(-6.2, -3.55, eC), lerp(4.6, 3.0, eC), lerp(-1.6, 0.2, eC));
      chat.group.rotation.set(0, lerp(1.1, 0.36, eC), 0);
      summary.group.position.set(lerp(6.2, 3.5, eC), lerp(0.4, 1.35, eC), lerp(1.2, 0.7, eC));
      summary.group.rotation.set(0, lerp(-1.1, -0.36, eC), 0);

      // the bars: a dotted ring while it is quiet, a live waveform when it is running
      for (let k = 0; k < N; k++) {
        const th = (k / N) * TAU;
        const u = Math.acos(Math.abs(Math.cos(th)));
        const w = 0.5 + 0.5 * Math.sin(u * 6 + p * TAU * 7);
        const v = 0.5 + 0.5 * Math.sin(u * 2.3 - p * TAU * 3.1 + 1.3);
        const live = (0.22 + 1.15 * w * v) * (0.3 + 0.7 * l) * (Math.sin(th) < 0 ? 0.7 : 1);
        const f = smoothstep(0, 1, clamp01((a * 1.6 - (k / N) * 0.6) / 0.6));
        const h = lerp(0.06, 0.1 + live, f);
        dummy.position.set(Math.cos(th) * RB, Math.sin(th) * RB, 0);
        dummy.rotation.set(0, 0, th - Math.PI / 2);
        dummy.scale.set(1, h, 1);
        dummy.updateMatrix();
        bars.setMatrixAt(k, dummy.matrix);
      }
      bars.instanceMatrix.needsUpdate = true;
      ringGroup.rotation.z = p * 0.35;

      ripples.forEach((m, i) => {
        const ph = (p * 4 + i / 3) % 1;
        m.scale.setScalar(RB + 0.9 + ph * 2.2);
        (m.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - ph) ** 1.6 * smoothstep(0.1, 0.5, l);
      });
      frame.hw = lerp(7.0, 4.7, eC);
    },
    frame: () => frame,
    dispose() {
      geo.dispose();
      rippleGeo.dispose();
    },
  };
  model.set(0, 0, 0);
  void mini;
  return model;
};

export default build;
