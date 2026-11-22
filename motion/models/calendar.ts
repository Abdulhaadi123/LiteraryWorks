import * as THREE from "three";
import { clamp01 } from "../engine";
import { drawn, fillRR } from "./parts";
import { cyl, mat, put, rbox, shadow } from "./real";
import type { Model, ModelBuilder } from "./types";

/**
 * Clarity in 14 days: a desk calendar standing on the table, open at a two-week page. As the page scrolls the days are
 * ticked off one by one in green, and the last day is ringed: the audit delivered.
 */

const PW = 4.2; // the page
const PH = 3.0;
const TILT = 0.32;
const COLS = 7;
const GX = 0.2; // the grid's left edge, top edge and cell size, as fractions of the page
const GY = 0.36;
const CW = (1 - 2 * GX + 0.2) / COLS;
const CH = 0.26;

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();
  const cal = new THREE.Group();
  cal.rotation.y = -0.16;
  group.add(cal);
  const x0 = 0.1;
  const cell = (i: number) => ({ u: x0 + (i % COLS) * CW + CW / 2, v: GY + Math.floor(i / COLS) * CH + CH / 2 });

  const page = drawn(env, 1280, 914, (g, w, h) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, w, h);
    fillRR(g, 0, 0, w, 190, 0, "#22425f");
    g.fillStyle = "#ffffff";
    g.font = "700 72px Inter, system-ui, sans-serif";
    g.textBaseline = "middle";
    g.fillText("14-day audit", 70, 100);
    fillRR(g, 70, 148, 150, 10, 5, "#73c94a");
    g.fillStyle = "rgba(34,66,95,0.55)";
    g.font = "600 34px Inter, system-ui, sans-serif";
    g.textAlign = "center";
    ["M", "T", "W", "T", "F", "S", "S"].forEach((d, i) => g.fillText(d, (x0 + i * CW + CW / 2) * w, (GY - 0.06) * h));
    for (let i = 0; i < 14; i++) {
      const { u, v } = cell(i);
      const cx = u * w;
      const cy = v * h;
      fillRR(g, cx - (CW * w) / 2 + 8, cy - (CH * h) / 2 + 8, CW * w - 16, CH * h - 16, 16, i % 7 >= 5 ? "#f4f6f8" : "#eef3f8");
      g.fillStyle = "#22425f";
      g.font = "700 40px Inter, system-ui, sans-serif";
      g.textAlign = "left";
      g.fillText(String(i + 1), cx - (CW * w) / 2 + 26, cy - (CH * h) / 2 + 46);
    }
    g.textAlign = "left";
  });
  const tick = drawn(env, 128, 128, (g, w, h) => {
    g.strokeStyle = "#5db536";
    g.lineWidth = 16;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.beginPath();
    g.moveTo(w * 0.2, h * 0.55);
    g.lineTo(w * 0.42, h * 0.76);
    g.lineTo(w * 0.82, h * 0.26);
    g.stroke();
  });
  const ringTex = drawn(env, 256, 256, (g, w, h) => {
    g.strokeStyle = "#5db536";
    g.lineWidth = 14;
    g.beginPath();
    g.ellipse(w / 2, h / 2, w * 0.42, h * 0.36, -0.1, 0, Math.PI * 2);
    g.stroke();
  });

  /* ---- the easel: a front board with the page, a back board, the wire binding at the top ---- */
  const front = new THREE.Group();
  front.position.set(0, 0, 0.6);
  front.rotation.x = -TILT;
  cal.add(front);
  put(front, rbox(PW + 0.2, PH + 0.3, 0.06, 0.04), mat.paint(0x22425f, 0.5), 0, PH / 2 + 0.15, -0.04);
  const sheet = put(front, new THREE.PlaneGeometry(PW, PH), mat.paper(page), 0, PH / 2 + 0.1, 0.002);
  void sheet;
  const back = put(cal, rbox(PW + 0.2, PH + 0.3, 0.06, 0.04), mat.paint(0x22425f, 0.5), 0, 0, 0);
  back.geometry.translate(0, (PH + 0.3) / 2, 0);
  // (its top meets the front board's: an A-frame)
  back.position.set(0, 0, -1.48);
  back.rotation.x = TILT;
  const wire = mat.alu(0xcfd4da, 0.25);
  for (let i = 0; i < 15; i++) {
    const loop = put(front, new THREE.TorusGeometry(0.07, 0.014, 8, 20), wire, -PW / 2 + 0.3 + i * ((PW - 0.6) / 14), PH + 0.28, 0);
    loop.rotation.y = Math.PI / 2;
  }
  const tickMat = new THREE.MeshBasicMaterial({ map: tick, transparent: true, depthWrite: false, toneMapped: false });
  const ticks = Array.from({ length: 14 }, (_, i) => {
    const { u, v } = cell(i);
    const m = put(front, new THREE.PlaneGeometry(0.34, 0.34), tickMat, (u - 0.5) * PW + 0.12, PH + 0.1 - v * PH - 0.02, 0.006);
    m.visible = false;
    return m;
  });
  const last = cell(13);
  const ring = put(front, new THREE.PlaneGeometry(CW * PW * 1.05, CH * PH * 1.1), new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, depthWrite: false, toneMapped: false }), (last.u - 0.5) * PW, PH + 0.1 - last.v * PH, 0.008);
  ring.visible = false;

  /* ---- a pen in front ---- */
  const pen = new THREE.Group();
  put(pen, cyl(0.06, 0.06, 1.6, 24).rotateZ(Math.PI / 2), mat.paint(0x22425f, 0.3), 0, 0, 0);
  put(pen, new THREE.ConeGeometry(0.06, 0.18, 24).rotateZ(-Math.PI / 2), mat.alu(0xcfd4da, 0.25), 0.89, 0, 0);
  pen.position.set(1.0, 0.06, 1.9);
  pen.rotation.y = 0.4;
  group.add(pen);
  group.add(shadow(env, PW + 1.8, 4.2, 0.26, 0, 0.2));

  const model: Model = {
    group,
    tags: [],
    camera: { az: [-0.28, 0.18], elev: [0.2, 0.14] },
    floorY: 0,
    set(_a, _l, p) {
      const n = Math.floor(clamp01((p - 0.04) / 0.8) * 14.999);
      ticks.forEach((t, i) => (t.visible = i < n));
      ring.visible = n >= 14;
    },
    frame: () => ({ cx: 0, cy: 1.7, hw: 2.6, hh: 1.8 }),
  };
  model.set(1, 1, 0);
  return model;
};

export default build;
