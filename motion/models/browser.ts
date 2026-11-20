import * as THREE from "three";
import { clamp01, lerp, quint, TAU } from "../engine";
import { floorShadow, circleLine, GLOW, glowTex, lightSprite, lit, makeScreen, outline, stageMetal, type Screen } from "./glow";
import { drawn, fillRR, plane, rr } from "./parts";
import { uiTexture } from "./ui";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * AI web apps: the anatomy of a web app. A browser window stands in the middle, built of four layers (the page, its
 * layout, its components and the interaction on top of it) that pull apart in depth. The parts that make it an AI
 * product dock round it: the assistant, live data, the code, the account. Lines of light carry pulses between them.
 */

const WW = 5.8;
const WH = 3.6;
const TW = 1160;
const TH = 720;
const LINE = "rgba(34,66,95,";

const sk = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h = 10, a = 0.26) => fillRR(g, x, y, w, h, h / 2, `${LINE}${a})`);

/** One layer of the window's picture; 0 is the page itself (opaque), the others are drawn on clear glass. */
function layerTexture(env: Parameters<ModelBuilder>[0], k: number): THREE.CanvasTexture {
  return drawn(env, TW, TH, (g, w, h) => {
    if (k === 0) {
      const bg = g.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#ffffff");
      bg.addColorStop(1, "#e9f0f7");
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);
      // the browser's bar
      g.fillStyle = "#e2eaf3";
      g.fillRect(0, 0, w, 74);
      [0, 1, 2].forEach((i) => {
        g.beginPath();
        g.arc(36 + i * 28, 37, 8, 0, TAU);
        g.fillStyle = i === 0 ? "#5db536" : `${LINE}0.4)`;
        g.fill();
      });
      fillRR(g, 170, 16, 200, 44, 14, "rgba(34,66,95,0.18)");
      sk(g, 200, 33, 110, 10, 0.4);
      fillRR(g, 400, 18, w - 560, 38, 19, "rgba(34,66,95,0.1)");
      sk(g, 440, 33, 220, 10, 0.3);
      g.beginPath();
      g.arc(w - 60, 37, 17, 0, TAU);
      g.fillStyle = "rgba(47,111,181,0.5)";
      g.fill();
      for (let x = 0; x < w; x += 58) {
        g.fillStyle = "rgba(34,66,95,0.05)";
        g.fillRect(x, 74, 1, h);
      }
    } else if (k === 1) {
      // the layout: a sidebar, a header, the grid of cards
      fillRR(g, 24, 98, 232, h - 122, 20, "rgba(47,111,181,0.1)");
      for (let i = 0; i < 6; i++) {
        g.beginPath();
        g.arc(56, 150 + i * 62, 11, 0, TAU);
        g.fillStyle = i === 1 ? "#5db536" : `${LINE}0.45)`;
        g.fill();
        sk(g, 82, 144 + i * 62, 110, 12, i === 1 ? 0.5 : 0.28);
      }
      sk(g, 290, 112, 260, 18, 0.45);
      sk(g, 290, 144, 160, 10, 0.2);
      [
        [290, 190, 252, 150],
        [566, 190, 252, 150],
        [842, 190, 296, 150],
        [290, 366, 528, 312],
        [842, 366, 296, 312],
      ].forEach(([x, y, ww, hh]) => {
        fillRR(g, x, y, ww, hh, 18, "rgba(34,66,95,0.07)");
        rr(g, x + 0.5, y + 0.5, ww - 1, hh - 1, 18);
        g.strokeStyle = "rgba(34,66,95,0.3)";
        g.lineWidth = 2;
        g.stroke();
      });
    } else if (k === 2) {
      // the components: figures, a chart, a list
      [
        [290, 190, 252],
        [566, 190, 252],
        [842, 190, 296],
      ].forEach(([x, y, ww], i) => {
        sk(g, x + 22, y + 24, ww * 0.4, 10, 0.34);
        fillRR(g, x + 22, y + 56, ww * 0.5, 34, 10, i === 1 ? "#5db536" : "#22425f");
        g.beginPath();
        g.moveTo(x + 22, y + 128);
        [0.1, 0.4, 0.22, 0.55, 0.35, 0.7].forEach((v, j) => g.lineTo(x + 22 + (j / 5) * (ww - 44), y + 132 - v * 36));
        g.strokeStyle = i === 1 ? "#5db536" : "#2f6fb5";
        g.lineWidth = 4;
        g.lineCap = "round";
        g.lineJoin = "round";
        g.stroke();
      });
      let v = 0.5;
      for (let i = 0; i < 12; i++) {
        v = Math.min(0.95, Math.max(0.2, v + Math.sin(i * 1.7) * 0.22));
        fillRR(g, 316 + i * 42, 650 - v * 250, 26, v * 250, 8, i === 8 ? "#5db536" : "rgba(47,111,181,0.85)");
      }
      for (let i = 0; i < 5; i++) {
        g.beginPath();
        g.arc(872, 410 + i * 56, 14, 0, TAU);
        g.fillStyle = i === 2 ? "#5db536" : "rgba(47,111,181,0.55)";
        g.fill();
        sk(g, 900, 400 + i * 56, 170 - i * 10, 11, 0.4);
        sk(g, 900, 420 + i * 56, 100, 8, 0.2);
      }
    } else {
      // the interaction: a selected card with handles, a tooltip, the cursor
      g.setLineDash([14, 9]);
      g.strokeStyle = "#4f9bff";
      g.lineWidth = 3.5;
      rr(g, 560, 184, 264, 162, 18);
      g.stroke();
      g.setLineDash([]);
      [
        [560, 184],
        [824, 184],
        [560, 346],
        [824, 346],
        [692, 184],
        [692, 346],
      ].forEach(([x, y]) => {
        fillRR(g, x - 9, y - 9, 18, 18, 4, "#fff");
        rr(g, x - 9, y - 9, 18, 18, 4);
        g.strokeStyle = "#4f9bff";
        g.lineWidth = 3;
        g.stroke();
      });
      fillRR(g, 700, 372, 198, 64, 16, "rgba(255,255,255,0.97)");
      rr(g, 700, 372, 198, 64, 16);
      g.strokeStyle = "rgba(34,66,95,0.5)";
      g.lineWidth = 2;
      g.stroke();
      sk(g, 722, 392, 130, 11, 0.55);
      sk(g, 722, 414, 80, 9, 0.3);
      g.beginPath();
      g.moveTo(640, 300);
      g.lineTo(640, 372);
      g.lineTo(662, 350);
      g.lineTo(690, 394);
      g.lineTo(708, 384);
      g.lineTo(682, 342);
      g.lineTo(712, 340);
      g.closePath();
      g.fillStyle = "#fff";
      g.fill();
      g.strokeStyle = "#e9f0f7";
      g.lineWidth = 4;
      g.lineJoin = "round";
      g.stroke();
      fillRR(g, 716, 322, 96, 30, 15, "#5db536");
    }
  });
}

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();
  group.add(floorShadow(env, 10, 6.5, 0.16));
  const WY = 3.4;

  /* ---- the window: four layers in a stack ---- */
  const win = new THREE.Group();
  win.position.set(0, WY, 0);
  group.add(win);
  const layers = [0, 1, 2, 3].map((k) => {
    const m = plane(layerTexture(env, k), WW, WH, 0.18);
    const mat = m.material as THREE.MeshBasicMaterial;
    if (k > 0) {
      mat.transparent = true;
      mat.depthWrite = false;
    }
    win.add(m);
    const e = outline(WW, WH, 0.18, k === 3 ? GLOW.green : GLOW.sky, 0.6, 0);
    m.add(e);
    return { m, e };
  });
  // the glass behind the page and a light under it
  const backing = new THREE.Mesh(new THREE.PlaneGeometry(WW + 0.3, WH + 0.3), new THREE.MeshBasicMaterial({ color: 0x08182a, transparent: true, opacity: 0.0 }));
  backing.position.z = -0.1;
  win.add(backing);
  win.add(lightSprite(env, "34,66,95", 9, 0.1));

  /* ---- the parts that dock round it ---- */
  const mk = (kind: "chat" | "line" | "code" | "feed", w: number, h: number, seed: number): Screen =>
    makeScreen(env, uiTexture(env, kind, Math.round(448), Math.round((448 * h) / w), seed, "#5db536"), w, h, { accent: kind === "chat" ? GLOW.green : GLOW.sky, depth: 0.08, radius: 0.1, glow: 0.18 });
  const parts = [
    { s: mk("chat", 2.2, 2.9, 3), home: new THREE.Vector3(3.45, 3.1, 0.9), from: new THREE.Vector3(4.7, 3.5, 0.9), yaw: -0.35 },
    { s: mk("line", 2.2, 1.35, 4), home: new THREE.Vector3(-3.3, 5.5, 0.7), from: new THREE.Vector3(-4.2, 6.2, 0.7), yaw: 0.3 },
    { s: mk("code", 2.4, 1.6, 5), home: new THREE.Vector3(-3.3, 1.65, 1.0), from: new THREE.Vector3(-4.3, 1.1, 1.0), yaw: 0.35 },
    { s: mk("feed", 1.6, 1.3, 6), home: new THREE.Vector3(3.5, 0.95, 1.1), from: new THREE.Vector3(4.6, 0.55, 1.1), yaw: -0.3 },
  ];
  parts.forEach((q) => {
    q.s.group.rotation.order = "YXZ";
    group.add(q.s.group);
  });

  // lines of light from each part to the window, and a pulse along each
  const links = parts.map(() => {
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: GLOW.sky, transparent: true, opacity: 0.6, depthWrite: false, toneMapped: false }));
    group.add(l);
    const pulse = new THREE.Group();
    pulse.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 14, 10), new THREE.MeshBasicMaterial({ color: 0x22425f, toneMapped: false })));
    pulse.add(lightSprite(env, "115,201,74", 0.7, 0.5));
    group.add(pulse);
    return { l, pulse };
  });

  // a base of light under the window
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex(env, "34,66,95"), transparent: true, opacity: 0.12, depthWrite: false, toneMapped: false }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 0.03, 0.4);
  pool.scale.set(9, 6, 1);
  group.add(pool);
  const floorRing = circleLine(3.6, GLOW.sky, 0.3);
  floorRing.position.y = 0.04;
  group.add(floorRing);
  const legMat = stageMetal();
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.22, WY - WH / 2 - 0.05, 0.22), legMat);
  stand.position.set(0, (WY - WH / 2 - 0.05) / 2, -0.3);
  const standBase = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.14, 48), legMat);
  standBase.position.y = 0.07;
  const standRim = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.014, 8, 80), lit(GLOW.green, 0.9));
  standRim.rotation.x = Math.PI / 2;
  standRim.position.y = 0.145;
  group.add(stand, standBase, standRim);

  const frame: Frame = { cx: 0, cy: 3.25, hw: 4.5, hh: 3.1 };
  const A = new THREE.Vector3();
  const B = new THREE.Vector3();
  const model: Model = {
    group,
    tags: [layers[0].m, parts[0].s.top, parts[1].s.top],
    camera: { az: [-0.3, 0.3], elev: [0.16, 0.12] },
    floorY: 0,
    set(a, l, p) {
      const e = quint(a);
      // the layers pull apart in depth
      layers.forEach((ly, k) => {
        ly.m.position.z = k * lerp(0.02, 0.5, e);
        (ly.e.material as THREE.LineBasicMaterial).opacity = (k ? 0.7 : 0.5) * (0.25 + 0.75 * e) + 0.2 * l * (k === 3 ? 1 : 0);
        (ly.m.material as THREE.MeshBasicMaterial).opacity = k ? lerp(0.5, 1, e) : 1;
      });
      win.rotation.y = -0.22 + p * 0.5;
      win.rotation.x = -0.04;
      // the cursor layer drifts a little as it works
      layers[3].m.position.x = Math.sin(p * TAU * 2) * 0.1 * l;
      layers[3].m.position.y = Math.cos(p * TAU * 2) * 0.06 * l;
      parts.forEach((q, i) => {
        const t = quint(clamp01((a * 1.5 - i * 0.1) / 0.65));
        q.s.group.position.lerpVectors(q.from, q.home, t);
        q.s.group.position.y += 0.07 * Math.sin(p * TAU * 2 + i * 1.7);
        q.s.group.rotation.y = q.yaw;
        q.s.group.scale.setScalar(Math.max(0.001, lerp(0.6, 1, t)));
        (q.s.front.material as THREE.MeshBasicMaterial).color.setScalar(0.5 + 0.5 * t);
        (q.s.light.material as THREE.SpriteMaterial).opacity = (0.1 + 0.14 * l) * t;
        // the line to the window and a pulse along it
        win.getWorldPosition(B);
        A.copy(q.s.group.position);
        const geo = links[i].l.geometry;
        const pos = geo.attributes.position as THREE.BufferAttribute;
        pos.setXYZ(0, A.x, A.y, A.z);
        B.set(Math.sign(A.x) * WW * 0.5 * Math.cos(win.rotation.y), A.y * 0.55 + WY * 0.45, 0.05);
        pos.setXYZ(1, B.x, B.y, B.z);
        pos.needsUpdate = true;
        links[i].l.visible = t > 0.02;
        (links[i].l.material as THREE.LineBasicMaterial).opacity = 0.5 * t;
        const u = (p * (1.6 + i * 0.3) + i * 0.27) % 1;
        links[i].pulse.position.lerpVectors(A, B, u);
        links[i].pulse.visible = t > 0.98 && l > 0.02;
        links[i].pulse.scale.setScalar(0.6 + 0.8 * Math.sin(u * Math.PI));
      });
      (standRim.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.5 * l;
      (pool.material as THREE.MeshBasicMaterial).opacity = 0.1 + 0.06 * l;
      group.updateMatrixWorld(true);
    },
    frame: () => frame,
  };
  model.set(1, 1, 0.5);
  return model;
};

export default build;
