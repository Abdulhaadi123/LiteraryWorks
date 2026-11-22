import * as THREE from "three";
import { clamp01, lerp, smooth } from "../engine";
import { drawn, fillRR, plane } from "./parts";
import { mat, put, rbox, shadow } from "./real";
import type { Model, ModelBuilder } from "./types";

/**
 * Cloud and DevOps: four rack servers in brushed aluminium that close up into one stack as the page scrolls, their
 * status lights blinking, beside the pipeline every change goes through (build, test, deploy, monitor), each step
 * turning green in turn.
 */
const STEPS = ["Build", "Test", "Deploy", "Monitor"];

const build: ModelBuilder = async (env, mini) => {
  const group = new THREE.Group();

  /* ---- the servers ---- */
  const bezel = drawn(env, 1024, 100, (g, w, h) => {
    g.fillStyle = "#d9dee4";
    g.fillRect(0, 0, w, h);
    // a honeycomb vent
    g.fillStyle = "rgba(25,23,22,0.55)";
    for (let y = 16; y < h - 10; y += 14) for (let x = 330 + ((y / 14) % 2) * 7; x < 940; x += 14) g.fillRect(x, y, 8, 8);
    // drive bays
    for (let i = 0; i < 4; i++) fillRR(g, 40 + i * 66, 22, 56, 56, 6, "#bcc3cb");
    fillRR(g, 960, 30, 40, 40, 8, "#22425f");
  });
  const units = [0, 1, 2, 3].map(() => {
    const g = new THREE.Group();
    put(g, rbox(4.6, 0.44, 2.6, 0.04), mat.alu(0xc9ced4, 0.3), 0, 0, 0);
    const front = plane(bezel, 4.5, 0.4, 0.03);
    front.position.z = 1.302;
    g.add(front);
    const leds = [0, 1, 2].map((j) => {
      const m = new THREE.MeshBasicMaterial({ color: j === 2 ? 0x2f6fb5 : 0x73c94a, toneMapped: false });
      return put(g, new THREE.SphereGeometry(0.035, 12, 8), m, 2.05 - j * 0.12, 0.08, 1.31);
    });
    group.add(g);
    return { g, leds };
  });
  group.add(shadow(env, 6.4, 3.8, 0.28, -0.8, 0));

  /* ---- the pipeline ---- */
  const face = drawn(env, mini ? 400 : 640, mini ? 475 : 760, (g, w, h) => {
    // laid out in full-size units at any size, so nothing is cut off on the lite version
    g.scale(w / 640, h / 760);
    w = 640;
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, w, 760);
    fillRR(g, 40, 40, 200, 18, 9, "rgba(34,66,95,0.55)");
    fillRR(g, 40, 70, 140, 12, 6, "rgba(34,66,95,0.2)");
    g.strokeStyle = "rgba(34,66,95,0.2)";
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(84, 170);
    g.lineTo(84, 650);
    g.stroke();
    STEPS.forEach((t, i) => {
      const y = 170 + i * 160;
      g.beginPath();
      g.arc(84, y, 30, 0, Math.PI * 2);
      g.fillStyle = "#e8eef4";
      g.fill();
      g.fillStyle = "#191716";
      g.font = "700 40px Inter, system-ui, sans-serif";
      g.textBaseline = "middle";
      g.fillText(t, 140, y - 8);
      fillRR(g, 140, y + 26, 300, 12, 6, "rgba(34,66,95,0.18)");
    });
  });
  const tick = drawn(env, 128, 128, (g, w, h) => {
    g.beginPath();
    g.arc(w / 2, h / 2, 60, 0, Math.PI * 2);
    g.fillStyle = "#5db536";
    g.fill();
    g.strokeStyle = "#fff";
    g.lineWidth = 12;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(w * 0.3, h * 0.52);
    g.lineTo(w * 0.45, h * 0.66);
    g.lineTo(w * 0.72, h * 0.36);
    g.stroke();
  });
  const panel = new THREE.Group();
  put(panel, rbox(2.5, 2.97, 0.12, 0.12), mat.white(0.22), 0, 0, 0);
  const pf = plane(face, 2.4, 2.85, 0.1);
  pf.position.z = 0.062;
  panel.add(pf);
  const checks = STEPS.map((_, i) => {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.24), new THREE.MeshBasicMaterial({ map: tick, transparent: true, toneMapped: false }));
    c.position.set(-2.4 / 2 + (84 / 640) * 2.4, 2.85 / 2 - ((170 + i * 160) / 760) * 2.85, 0.07);
    panel.add(c);
    return c;
  });
  panel.position.set(3.4, 2.1, 0.8);
  panel.rotation.y = -0.32;
  group.add(panel);
  group.add(shadow(env, 3, 1.6, 0.18, 3.4, 1.0));

  const model: Model = {
    group,
    tags: [],
    camera: { az: [-0.3, 0.2], elev: [0.24, 0.18] },
    floorY: 0,
    set(_a, _l, p) {
      // the stack closes up
      const close = smooth(clamp01(p / 0.7));
      const gap = lerp(0.62, 0.06, close);
      units.forEach((u, i) => {
        u.g.position.set(-0.8 + (i - 1.5) * 0.04 * (1 - close), 0.3 + i * (0.44 + gap), -0.2);
        u.g.rotation.y = lerp((i - 1.5) * 0.1, 0, close);
        u.leds.forEach((l, j) => (l.visible = Math.sin(p * 60 + i * 2.1 + j * 1.3) > -0.3));
      });
      checks.forEach((c, i) => {
        const on = smooth(clamp01((p - 0.1 - i * 0.2) * 8));
        c.scale.setScalar(Math.max(0.001, on));
        c.visible = on > 0.01;
      });
      panel.position.y = 2.1 + Math.sin(p * Math.PI * 2) * 0.05;
    },
    frame: () => ({ cx: 0.6, cy: 1.8, hw: 4.4, hh: 2.2 }),
  };
  model.set(1, 1, 0);
  return model;
};

export default build;
