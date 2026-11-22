import * as THREE from "three";
import { clamp01, lerp, smooth } from "../engine";
import { makeTablet } from "../devices";
import { drawn, fillRR, rr } from "./parts";
import { cyl, mat, put, rbox, shadow, standFor } from "./real";
import type { Model, ModelBuilder, ModelEnv } from "./types";

/**
 * Construction technology is software for builders: estimating, project controls and the field, an ERP and CRM of their
 * own. Here it is a pipeline board on a stand, jobs moving from lead to estimate to contract to project as the page
 * scrolls, and a tablet with a project's schedule in front.
 */
const COLS = ["Lead", "Estimate", "Contract", "Project"];
const BW = 7.2;
const BH = 3.9;
const BY = 2.9; // the middle of the board
const CW = 1.42;
const CH = 0.62;

/** Each job: its colour and the points (in the scroll) where it moves on to the next column. */
const JOBS: { c: string; from: number; moves: number[] }[] = [
  { c: "#2f6fb5", from: 2, moves: [0.3] },
  { c: "#73c94a", from: 1, moves: [0.2, 0.62] },
  { c: "#22425f", from: 1, moves: [0.45] },
  { c: "#e0a02a", from: 0, moves: [0.12, 0.5, 0.82] },
  { c: "#9dbbd3", from: 0, moves: [0.38, 0.72] },
  { c: "#2f6fb5", from: 0, moves: [0.66] },
  { c: "#73c94a", from: 3, moves: [] },
];

export function scheduleTexture(env: ModelEnv, mini = false): THREE.Texture {
  return drawn(env, mini ? 640 : 1024, mini ? 400 : 640, (g, w, h) => {
    // laid out in full-size units at any size, so no row falls off the smaller screen
    g.scale(w / 1024, h / 640);
    w = 1024;
    h = 640;
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, w, h);
    fillRR(g, 0, 0, w, 70, 0, "#22425f");
    fillRR(g, 28, 26, 170, 16, 8, "rgba(255,255,255,0.8)");
    const rows = [
      [0.04, 0.3, "#5db536"],
      [0.18, 0.4, "#2f6fb5"],
      [0.3, 0.45, "#2f6fb5"],
      [0.46, 0.3, "#9dbbd3"],
      [0.58, 0.34, "#9dbbd3"],
      [0.72, 0.24, "#e0a02a"],
    ] as const;
    rows.forEach(([x0, len, c], i) => {
      const y = 112 + i * 76;
      fillRR(g, 28, y + 8, 130, 12, 6, "rgba(34,66,95,0.28)");
      g.fillStyle = "rgba(34,66,95,0.06)";
      g.fillRect(190, y, w - 220, 40);
      fillRR(g, 190 + (w - 240) * x0, y + 4, (w - 240) * len, 32, 10, c);
    });
    g.strokeStyle = "rgba(34,66,95,0.35)";
    g.lineWidth = 3;
    g.setLineDash([8, 8]);
    g.beginPath();
    g.moveTo(190 + (w - 240) * 0.52, 90);
    g.lineTo(190 + (w - 240) * 0.52, h - 20);
    g.stroke();
    g.setLineDash([]);
  });
}

const build: ModelBuilder = async (env, mini) => {
  const group = new THREE.Group();

  /* ---- the board on its stand ---- */
  const alu = mat.alu(0xc4cad1, 0.32);
  put(group, rbox(BW + 0.2, BH + 0.2, 0.12, 0.06), alu, 0, BY, 0);
  const boardTex = drawn(env, mini ? 960 : 1440, mini ? 520 : 780, (g, w, h) => {
    // laid out in full-size units at any size, so nothing is cut off on the lite version
    g.scale(w / 1440, h / 780);
    w = 1440;
    h = 780;
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, w, h);
    const cw = w / COLS.length;
    COLS.forEach((t, i) => {
      fillRR(g, i * cw + 18, 18, cw - 36, 64, 14, i === 3 ? "#eaf6e4" : "#eef3f8");
      g.fillStyle = "#22425f";
      g.font = "700 30px Inter, system-ui, sans-serif";
      g.textBaseline = "middle";
      g.fillText(t, i * cw + 40, 51);
      if (i) {
        g.fillStyle = "rgba(34,66,95,0.12)";
        g.fillRect(i * cw - 1, 100, 2, h - 120);
      }
    });
  });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.25, metalness: 0, envMapIntensity: 0.7 }));
  board.position.set(0, BY, 0.062);
  group.add(board);
  [-1, 1].forEach((s) => {
    put(group, rbox(0.11, BY - BH / 2 + 0.25, 0.11, 0.03), alu, s * (BW / 2 - 0.3), (BY - BH / 2 + 0.25) / 2, -0.02);
    put(group, rbox(0.14, 0.1, 1.7, 0.03), alu, s * (BW / 2 - 0.3), 0.12, 0);
    [-0.78, 0.78].forEach((z) => put(group, cyl(0.07, 0.07, 0.07, 20).rotateZ(Math.PI / 2), mat.rubber(), s * (BW / 2 - 0.3), 0.05, z));
  });
  group.add(shadow(env, 9, 3.4, 0.24, 0, 0.2));

  /* ---- the jobs ---- */
  const cards = JOBS.map((j) => {
    const tex = drawn(env, 284, 124, (g, w, h) => {
      g.fillStyle = "#ffffff";
      g.fillRect(0, 0, w, h);
      fillRR(g, 0, 0, 10, h, 0, j.c);
      fillRR(g, 26, 22, 150, 14, 7, "rgba(34,66,95,0.55)");
      fillRR(g, 26, 50, 210, 10, 5, "rgba(34,66,95,0.2)");
      fillRR(g, 26, 72, 170, 10, 5, "rgba(34,66,95,0.2)");
      g.beginPath();
      g.arc(w - 34, h - 30, 14, 0, Math.PI * 2);
      g.fillStyle = j.c;
      g.fill();
      rr(g, 1, 1, w - 2, h - 2, 10);
      g.strokeStyle = "rgba(34,66,95,0.16)";
      g.lineWidth = 2;
      g.stroke();
    });
    const g = new THREE.Group();
    put(g, rbox(CW, CH, 0.05, 0.05, 2), mat.white(0.3), 0, 0, 0);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(CW - 0.04, CH - 0.04), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    f.position.z = 0.027;
    g.add(f);
    group.add(g);
    return g;
  });

  /* ---- a tablet with the project's schedule ---- */
  const tablet = makeTablet(scheduleTexture(env, mini));
  env.textures.push(...tablet.textures);
  const T = standFor(tablet, 0.2);
  T.scale.setScalar(1.05);
  T.position.set(4.3, 0, 1.7);
  T.rotation.y = -0.45;
  T.add(shadow(env, 4.2, 2.6, 0.3, 0, 0));
  group.add(T);

  const colX = (c: number) => -BW / 2 + (c + 0.5) * (BW / COLS.length);
  // (kept between frames, so scrolling allocates nothing)
  const slots = [0, 0, 0, 0];
  const model: Model = {
    group,
    tags: [],
    camera: { az: [-0.26, 0.22], elev: [0.16, 0.1] },
    floorY: 0,
    set(_a, _l, p) {
      slots.fill(0);
      for (let i = 0; i < JOBS.length; i++) {
        const j = JOBS[i];
        // where the job is: a column, and a fraction of the way to the next while it moves
        let c = j.from;
        let t = 0;
        for (const m of j.moves) {
          const s = smooth(clamp01((p - (m - 0.04)) / 0.08));
          if (s >= 1) c += 1;
          else if (s > 0) t = s;
        }
        // stacked in its column, top down
        const col = Math.min(3, c);
        const slot = slots[col]++;
        const x = lerp(colX(col), colX(Math.min(3, col + 1)), t);
        const y = BY + BH / 2 - 0.82 - slot * (CH + 0.14);
        cards[i].position.set(x, y, 0.09 + Math.sin(Math.PI * t) * 0.45);
        cards[i].rotation.z = Math.sin(Math.PI * t) * -0.08;
      }
    },
    frame: () => ({ cx: 0.6, cy: 2.6, hw: 4.6, hh: 2.4 }),
  };
  model.set(1, 1, 0);
  return model;
};

export default build;
