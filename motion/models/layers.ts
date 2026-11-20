import * as THREE from "three";
import { lerp, quint, TAU, win } from "../engine";
import { C, dot, drawn, fillRR, glass, marker, plateTexture, skel } from "./parts";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * SaaS platforms: the layers of a product. Four slabs start loose, settle into one stack and then pull apart into a
 * clear exploded view: the interface (one of our own products on its face), the API, the data and the cloud under
 * it, joined by lines that carry small lights up and down.
 */

const W = 4.3;
const D = 2.8;
const T = 0.16;
const GAP = 1.15;
const PX = 1024;
const PY = Math.round((PX * D) / W);

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();
  const spin = new THREE.Group();
  group.add(spin);

  /* ---- the four faces ---- */
  const ui = await env.shot("vendibly", PX, PY);
  const api = plateTexture(env, PX, PY, (g, w, h) => {
    const nodes: [number, number][] = [[150, 160], [340, 330], [560, 180], [740, 370], [890, 190], [470, 520], [200, 500]];
    const edges = [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 6], [6, 1], [2, 5], [3, 5]];
    g.strokeStyle = C.sky;
    g.lineWidth = 6;
    edges.forEach(([i, j]) => {
      g.beginPath();
      g.moveTo(...nodes[i]);
      g.lineTo(...nodes[j]);
      g.stroke();
    });
    nodes.forEach(([x, y], i) => {
      dot(g, x, y, 36, C.white);
      g.strokeStyle = C.navy;
      g.lineWidth = 7;
      g.beginPath();
      g.arc(x, y, 36, 0, TAU);
      g.stroke();
      dot(g, x, y, 11, i === 2 || i === 5 ? C.green : C.navy);
      skel(g, x + 48, y - 16, 70, 10, C.rule);
      skel(g, x + 48, y + 2, 46, 8, C.pale);
    });
    skel(g, 60, h - 56, 220, 12, C.navy);
  });
  const data = plateTexture(env, PX, PY, (g, w, h) => {
    [190, 512, 834].forEach((x, i) => {
      const gr = g.createLinearGradient(x - 90, 0, x + 90, 0);
      gr.addColorStop(0, "#2f5a82");
      gr.addColorStop(1, "#1d3a56");
      g.fillStyle = gr;
      g.fillRect(x - 90, 170, 180, 190);
      [170, 265, 360].forEach((y) => {
        g.beginPath();
        g.ellipse(x, y, 90, 34, 0, 0, TAU);
        g.fillStyle = y === 170 ? "#5d8fb9" : "rgba(255,255,255,0.12)";
        g.fill();
      });
      g.beginPath();
      g.ellipse(x, 360, 90, 34, 0, 0, Math.PI);
      g.fillStyle = "#1d3a56";
      g.fill();
      dot(g, x + 50, 290, 8, i === 1 ? C.amber : C.green);
    });
    for (let r = 0; r < 4; r++) {
      const y = 440 + r * 52;
      skel(g, 80, y, 150, 12, r ? C.rule : C.navy);
      skel(g, 270, y, 220 - r * 20, 12, C.pale);
      skel(g, 560, y, 160, 12, C.pale);
      dot(g, 900, y + 6, 8, r % 2 ? C.green : C.sky);
    }
  });
  const cloud = drawn(env, PX, PY, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#2d557a");
    bg.addColorStop(1, "#162b40");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,255,255,0.14)";
    for (let x = 28; x < w; x += 40) for (let y = 28; y < h; y += 40) g.fillRect(x, y, 3, 3);
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const x = 80 + c * 290;
        const y = 150 + r * 210;
        fillRR(g, x, y, 250, 150, 22, "rgba(255,255,255,0.1)");
        dot(g, x + 36, y + 40, 9, C.green);
        dot(g, x + 66, y + 40, 9, r + c === 2 ? C.amber : C.green);
        skel(g, x + 28, y + 80, 190, 10, "rgba(255,255,255,0.3)");
        skel(g, x + 28, y + 104, 120, 10, "rgba(255,255,255,0.2)");
      }
    }
    g.strokeStyle = C.green;
    g.lineWidth = 7;
    g.lineCap = "round";
    g.beginPath();
    g.arc(300, 92, 34, Math.PI * 0.55, Math.PI * 1.5);
    g.arc(352, 66, 40, Math.PI * 1.1, Math.PI * 1.95);
    g.arc(420, 94, 32, Math.PI * 1.5, Math.PI * 0.45);
    g.closePath();
    g.stroke();
  });
  const faces = [ui, api, data, cloud];

  const rnd = env.rnd;
  const layers = faces.map((tex) => {
    const holder = new THREE.Group();
    const panel = glass(env, tex, W, D, { depth: T, radius: 0.2, shadow: false });
    panel.group.rotation.x = -Math.PI / 2;
    holder.add(panel.group);
    spin.add(holder);
    return {
      holder,
      loose: new THREE.Vector3((rnd() - 0.5) * 7, 0.4 + rnd() * 4.2, (rnd() - 0.5) * 4),
      yaw: (rnd() - 0.5) * 2.2,
      tilt: (rnd() - 0.5) * 0.5,
    };
  });

  /* ---- the lines between the layers, and the lights that run along them ---- */
  const lineGeo = new THREE.CylinderGeometry(0.02, 0.02, 1, 8);
  const corners: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const lines = corners.map(([sx, sz]) => {
    const m = new THREE.Mesh(lineGeo, new THREE.MeshBasicMaterial({ color: 0x73c94a, transparent: true, opacity: 0.7, toneMapped: false }));
    m.position.set(sx * (W / 2 - 0.3), 0, sz * (D / 2 - 0.3));
    spin.add(m);
    return m;
  });
  const lightGeo = new THREE.SphereGeometry(0.07, 14, 10);
  const lights = corners.map(([sx, sz]) => {
    const m = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
    m.position.set(sx * (W / 2 - 0.3), 0, sz * (D / 2 - 0.3));
    spin.add(m);
    return m;
  });

  const frame: Frame = { cx: 0, cy: 2.1, hw: 3.4, hh: 2.7 };
  const model: Model = {
    group,
    tags: layers.map((l) => marker(l.holder, W / 2 - 0.4, 0.14, D / 2 - 0.15)),
    camera: { az: [-0.2, 0.2], elev: [0.44, 0.36] },
    ground: true,
    floorY: 0,
    set(a, l, p) {
      const eA = quint(win(a, 0.05, 0.6)); // loose -> one stack
      const eE = quint(win(a, 0.5, 1)); // the stack pulls apart
      const gap = lerp(0.5, GAP, eE);
      spin.rotation.y = lerp(-0.45, 0.3, p);
      const top = 2.1 + 1.5 * gap;
      layers.forEach((ly, k) => {
        const y = 2.1 + (1.5 - k) * gap + (k === 0 ? 0.22 * l : 0);
        ly.holder.position.set(lerp(ly.loose.x, 0, eA), lerp(ly.loose.y, y, eA), lerp(ly.loose.z, 0, eA));
        ly.holder.rotation.set(lerp(ly.tilt, 0, eA), lerp(ly.yaw, 0, eA), 0);
      });
      const bottom = 2.1 - 1.5 * gap;
      lines.forEach((m) => {
        m.scale.set(1, Math.max(0.001, (top - bottom) * eE), 1);
        m.position.y = (top + bottom) / 2;
      });
      lights.forEach((m, i) => {
        const t = (((p * 3 + i / 4) % 1) + 1) % 1;
        m.position.y = lerp(bottom, top, i % 2 ? t : 1 - t);
        m.scale.setScalar(Math.max(0.001, eE * (0.4 + 0.6 * l)));
      });
      frame.hh = lerp(2.6, 3.25, eE);
      frame.hw = lerp(5.4, 3.1, eA);
    },
    frame: () => frame,
    dispose() {
      lineGeo.dispose();
      lightGeo.dispose();
    },
  };
  model.set(0, 0, 0);
  return model;
};

export default build;
