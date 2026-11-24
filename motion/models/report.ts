import * as THREE from "three";
import { clamp01, lerp, smooth } from "../engine";
import { drawn, fillRR, rr } from "./parts";
import { cyl, mat, put, rbox, shadow } from "./real";
import type { Model, ModelBuilder } from "./types";

/**
 * The audit: a printed report in a navy folder on the table, its checklist (the four things an audit gives you)
 * ticked one by one as the page scrolls while a magnifying glass moves down the list, and a pen beside it.
 */
const PW = 2.94;
const PH = 4.16;
const ITEMS = ["Workflow review", "Inefficiency map", "AI opportunities", "Direction"];
const ROW0 = 330; // the first row on the page (px of 1024)
const ROWH = 140;

const build: ModelBuilder = async (env, mini) => {
  const group = new THREE.Group();
  const book = new THREE.Group();
  book.rotation.y = 0.16;
  group.add(book);

  const page = drawn(env, mini ? 482 : 724, mini ? 682 : 1024, (g, w, h) => {
    // laid out in full-size units at any size, so the boxes stay where the ticks are placed
    g.scale(w / 724, h / 1024);
    w = 724;
    h = 1024;
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, w, h);
    fillRR(g, 0, 0, w, 190, 0, "#22425f");
    g.fillStyle = "#ffffff";
    g.font = "700 64px Inter, system-ui, sans-serif";
    g.textBaseline = "alphabetic";
    g.fillText("AI audit", 56, 110);
    fillRR(g, 56, 136, 120, 8, 4, "#73c94a");
    g.fillStyle = "rgba(255,255,255,0.7)";
    g.font = "500 26px Inter, system-ui, sans-serif";
    g.fillText("Findings and next steps", 200, 146);
    g.fillStyle = "#22425f";
    g.font = "600 30px Inter, system-ui, sans-serif";
    g.fillText("What you get", 56, 270);
    ITEMS.forEach((t, i) => {
      const y = ROW0 + i * ROWH;
      rr(g, 56, y, 48, 48, 10);
      g.strokeStyle = "#22425f";
      g.lineWidth = 4;
      g.stroke();
      g.fillStyle = "#191716";
      g.font = "600 34px Inter, system-ui, sans-serif";
      g.fillText(t, 130, y + 36);
      fillRR(g, 130, y + 62, 460, 12, 6, "rgba(34,66,95,0.18)");
      fillRR(g, 130, y + 88, 340, 12, 6, "rgba(34,66,95,0.12)");
    });
    // a small chart at the foot of the page
    [0.4, 0.62, 0.5, 0.85, 0.7].forEach((q, i) => fillRR(g, 70 + i * 60, 960 - 120 * q, 38, 120 * q, 6, i === 3 ? "#73c94a" : "#9dbbd3"));
    rr(g, 2, 2, w - 4, h - 4, 4);
    g.strokeStyle = "rgba(34,66,95,0.15)";
    g.lineWidth = 3;
    g.stroke();
  });
  const blank = drawn(env, 362, 512, (g, w, h) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, w, h);
    [0.8, 0.9, 0.7, 0.85, 0.6, 0.9, 0.75].forEach((q, i) => fillRR(g, 28, 60 + i * 52, (w - 56) * q, 8, 4, "rgba(34,66,95,0.14)"));
  });

  // the folder and the sheets under the top one
  put(book, rbox(PW + 0.36, 0.04, PH + 0.3, 0.02), mat.paint(0x22425f, 0.7), 0.06, 0.02, 0.04);
  const sheetMat = (map: THREE.Texture) => [mat.paper(null), mat.paper(null), mat.paper(map), mat.paper(null), mat.paper(null), mat.paper(null)];
  [-0.08, 0.05].forEach((r, i) => {
    const s = put(book, rbox(PW, 0.012, PH, 0.004, 1), sheetMat(blank), 0.12 - i * 0.1, 0.05 + i * 0.013, 0.02);
    s.rotation.y = r;
  });
  const top = put(book, rbox(PW, 0.012, PH, 0.004, 1), sheetMat(page), 0, 0.08, 0);
  void top;

  // the ticks, one per item
  const tickTex = drawn(env, 128, 128, (g, w, h) => {
    g.strokeStyle = "#5db536";
    g.lineWidth = 16;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.beginPath();
    g.moveTo(w * 0.2, h * 0.52);
    g.lineTo(w * 0.42, h * 0.74);
    g.lineTo(w * 0.86, h * 0.22);
    g.stroke();
  });
  const rowZ = (i: number) => -PH / 2 + ((ROW0 + i * ROWH + 24) / 1024) * PH;
  const rowX = -PW / 2 + (80 / 724) * PW;
  const ticks = ITEMS.map((_, i) => {
    const t = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshBasicMaterial({ map: tickTex, transparent: true, toneMapped: false, depthWrite: false }));
    t.rotation.x = -Math.PI / 2;
    t.position.set(rowX, 0.088, rowZ(i));
    book.add(t);
    return t;
  });

  /* ---- the magnifying glass ---- */
  const glass = new THREE.Group();
  put(glass, new THREE.TorusGeometry(0.62, 0.065, 20, 72), mat.alu(0xd6dbe0, 0.22), 0, 0, 0);
  put(glass, cyl(0.6, 0.6, 0.03, 64).rotateX(Math.PI / 2), mat.glass(0.14), 0, 0, 0);
  put(glass, cyl(0.07, 0.07, 0.24, 24).rotateZ(Math.PI / 2), mat.alu(0xd6dbe0, 0.25), 0.78, 0, 0);
  put(glass, new THREE.CapsuleGeometry(0.1, 1.1, 8, 20).rotateZ(Math.PI / 2), mat.rubber(0x1c1f24), 1.5, 0, 0);
  glass.rotation.x = -Math.PI / 2 + 0.18;
  book.add(glass);

  /* ---- a pen ---- */
  const pen = new THREE.Group();
  put(pen, cyl(0.07, 0.07, 2.6, 28).rotateZ(Math.PI / 2), mat.paint(0x22425f, 0.3), 0, 0, 0);
  put(pen, new THREE.ConeGeometry(0.07, 0.3, 28).rotateZ(Math.PI / 2), mat.alu(0xd6dbe0, 0.2), -1.45, 0, 0);
  put(pen, rbox(1.0, 0.03, 0.06, 0.01), mat.alu(0xd6dbe0, 0.2), 0.8, 0.08, 0);
  pen.position.set(2.5, 0.08, 0.4);
  pen.rotation.y = 1.2;
  group.add(pen);
  group.add(shadow(env, 5.6, 6.2, 0.26, 0.4, 0));

  const model: Model = {
    group,
    tags: [],
    camera: { az: [-0.14, 0.1], elev: [1.05, 0.98] },
    floorY: 0,
    set(_a, _l, p) {
      // the glass moves down the list; each item is ticked as it passes
      const f = clamp01((p - 0.04) / 0.82) * (ITEMS.length - 0.2);
      const i = Math.min(ITEMS.length - 1, Math.floor(f));
      const z = lerp(rowZ(i), rowZ(Math.min(ITEMS.length - 1, i + 1)), smooth(f - i));
      glass.position.set(0.3, 0.55, z);
      ticks.forEach((t, j) => {
        const on = smooth(clamp01((f - j - 0.35) * 3));
        t.scale.setScalar(Math.max(0.001, on));
        t.visible = on > 0.01;
      });
    },
    frame: () => ({ cx: 0, cy: 0.5, hw: 3.4, hh: 2.4 }),
  };
  model.set(1, 1, 0);
  return model;
};

export default build;
