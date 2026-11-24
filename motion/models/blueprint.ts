import * as THREE from "three";
import { clamp01, lerp, smooth } from "../engine";
import { drawn } from "./parts";
import { cyl, mat, put, rbox, shadow } from "./real";
import type { Model, ModelBuilder } from "./types";

/**
 * Clarity before code: the written plan. A sheet of blueprint paper lies on the table and unrolls as the page scrolls,
 * showing the plan of a client's system (the website and forms, an AI assistant, the CRM, the workflows, accounting
 * and reports, joined up) with its title block and an approval stamp at the end. A steel ruler and a pencil lie on it.
 */

const SW = 7.2; // the sheet, left to right
const SD = 4.5; // front to back
const Y = 0.012;

const BOXES: { x: number; y: number; w: number; t: string; sub: string }[] = [
  { x: 0.08, y: 0.16, w: 0.2, t: "Website & forms", sub: "Leads in" },
  { x: 0.08, y: 0.5, w: 0.2, t: "Email & documents", sub: "Requests in" },
  { x: 0.4, y: 0.16, w: 0.2, t: "AI assistant", sub: "Reads and answers" },
  { x: 0.4, y: 0.5, w: 0.2, t: "Workflows", sub: "Routes the work" },
  { x: 0.72, y: 0.16, w: 0.2, t: "CRM", sub: "One record" },
  { x: 0.72, y: 0.5, w: 0.2, t: "Accounting", sub: "Invoices synced" },
  { x: 0.4, y: 0.78, w: 0.2, t: "Reports", sub: "Weekly numbers" },
];

const build: ModelBuilder = async (env, mini) => {
  const group = new THREE.Group();
  const W = mini ? 1024 : 1536;
  const H = Math.round((W * SD) / SW);

  const plan = drawn(env, W, H, (g, w, h) => {
    const k = w / 1536;
    g.fillStyle = "#1f4f86";
    g.fillRect(0, 0, w, h);
    // the grid
    g.strokeStyle = "rgba(255,255,255,0.07)";
    g.lineWidth = 1.5 * k;
    for (let x = 0; x < w; x += 48 * k) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, h);
      g.stroke();
    }
    for (let y = 0; y < h; y += 48 * k) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(w, y);
      g.stroke();
    }
    // the frame
    g.strokeStyle = "rgba(255,255,255,0.85)";
    g.lineWidth = 4 * k;
    g.strokeRect(28 * k, 28 * k, w - 56 * k, h - 56 * k);
    g.lineWidth = 1.5 * k;
    g.strokeRect(40 * k, 40 * k, w - 80 * k, h - 80 * k);
    const bx = (b: (typeof BOXES)[number]) => ({ x: 60 * k + b.x * (w - 120 * k), y: 60 * k + b.y * (h - 200 * k), w: b.w * (w - 120 * k), h: 118 * k });
    // the links between the parts, drawn first so the boxes sit on top
    const link = (a: number, b: number, dashed = false) => {
      const A = bx(BOXES[a]);
      const B = bx(BOXES[b]);
      const ax = A.x + A.w / 2;
      const ay = A.y + A.h / 2;
      const bxm = B.x + B.w / 2;
      const by = B.y + B.h / 2;
      g.setLineDash(dashed ? [10 * k, 8 * k] : []);
      g.strokeStyle = "rgba(255,255,255,0.8)";
      g.lineWidth = 3 * k;
      g.beginPath();
      if (Math.abs(ay - by) < 2) {
        g.moveTo(A.x + A.w, ay);
        g.lineTo(B.x, by);
      } else {
        const mx = (ax + bxm) / 2;
        g.moveTo(ax, A.y + (by > ay ? A.h : 0));
        g.lineTo(ax, (ay + by) / 2);
        g.lineTo(mx === ax ? bxm : bxm, (ay + by) / 2);
        g.lineTo(bxm, B.y + (by > ay ? 0 : B.h));
      }
      g.stroke();
      g.setLineDash([]);
      // an arrowhead at the end
      const ex = Math.abs(ay - by) < 2 ? B.x : bxm;
      const ey = Math.abs(ay - by) < 2 ? by : B.y + (by > ay ? 0 : B.h);
      const dir = Math.abs(ay - by) < 2 ? 0 : by > ay ? Math.PI / 2 : -Math.PI / 2;
      g.fillStyle = "rgba(255,255,255,0.9)";
      g.beginPath();
      g.moveTo(ex, ey);
      g.lineTo(ex - 16 * k * Math.cos(dir) + 8 * k * Math.sin(dir), ey - 16 * k * Math.sin(dir) - 8 * k * Math.cos(dir));
      g.lineTo(ex - 16 * k * Math.cos(dir) - 8 * k * Math.sin(dir), ey - 16 * k * Math.sin(dir) + 8 * k * Math.cos(dir));
      g.closePath();
      g.fill();
    };
    link(0, 2);
    link(1, 3);
    link(2, 4);
    link(3, 5);
    link(2, 3, true);
    link(3, 6);
    BOXES.forEach((b, i) => {
      const r = bx(b);
      g.fillStyle = "#1f4f86";
      g.fillRect(r.x, r.y, r.w, r.h);
      g.strokeStyle = i === 2 || i === 3 ? "#9fe07a" : "rgba(255,255,255,0.95)";
      g.lineWidth = 3.5 * k;
      g.strokeRect(r.x, r.y, r.w, r.h);
      g.fillStyle = "#ffffff";
      g.font = `600 ${Math.round(30 * k)}px Inter, system-ui, sans-serif`;
      g.textBaseline = "middle";
      g.fillText(b.t, r.x + 22 * k, r.y + 44 * k);
      g.fillStyle = "rgba(255,255,255,0.65)";
      g.font = `500 ${Math.round(22 * k)}px Inter, system-ui, sans-serif`;
      g.fillText(b.sub, r.x + 22 * k, r.y + 84 * k);
    });
    // notes and a dimension line, as on a drawing
    g.fillStyle = "rgba(255,255,255,0.7)";
    g.font = `500 ${Math.round(22 * k)}px Inter, system-ui, sans-serif`;
    g.fillText("Phase 1", 60 * k + 0.08 * (w - 120 * k), 48 * k + 0.08 * (h - 200 * k));
    g.fillText("Phase 2", 60 * k + 0.72 * (w - 120 * k), 48 * k + 0.08 * (h - 200 * k));
    // the title block, bottom right
    const tx = w - 470 * k;
    const ty = h - 190 * k;
    g.strokeStyle = "rgba(255,255,255,0.9)";
    g.lineWidth = 3 * k;
    g.strokeRect(tx, ty, 430 * k, 150 * k);
    g.beginPath();
    g.moveTo(tx, ty + 60 * k);
    g.lineTo(tx + 430 * k, ty + 60 * k);
    g.moveTo(tx + 250 * k, ty + 60 * k);
    g.lineTo(tx + 250 * k, ty + 150 * k);
    g.stroke();
    g.fillStyle = "#ffffff";
    g.font = `700 ${Math.round(30 * k)}px Inter, system-ui, sans-serif`;
    g.fillText("SYSTEM PLAN", tx + 22 * k, ty + 32 * k);
    g.font = `500 ${Math.round(22 * k)}px Inter, system-ui, sans-serif`;
    g.fillStyle = "rgba(255,255,255,0.75)";
    g.fillText("Scope, parts, order", tx + 22 * k, ty + 88 * k);
    g.fillText("Literary Worx", tx + 22 * k, ty + 124 * k);
    g.fillText("Rev. A", tx + 272 * k, ty + 88 * k);
    // the approval stamp
    g.save();
    g.translate(tx + 120 * k, ty - 80 * k);
    g.rotate(-0.12);
    g.strokeStyle = "#9fe07a";
    g.lineWidth = 5 * k;
    g.strokeRect(-110 * k, -34 * k, 220 * k, 68 * k);
    g.fillStyle = "#9fe07a";
    g.font = `800 ${Math.round(34 * k)}px Inter, system-ui, sans-serif`;
    g.textAlign = "center";
    g.fillText("APPROVED", 0, 2 * k);
    g.restore();
  });
  const back = drawn(env, 256, 256, (g, w, h) => {
    g.fillStyle = "#c9d9ea";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(31,79,134,0.3)";
    g.fillRect(0, 0, w, 10);
  });
  const end = drawn(env, 256, 256, (g, w, h) => {
    g.fillStyle = "#dfe8f2";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(31,79,134,0.35)";
    g.lineWidth = 3;
    for (let r = 20; r < 128; r += 14) {
      g.beginPath();
      g.arc(w / 2, h / 2, r, 0, Math.PI * 2);
      g.stroke();
    }
  });

  /* ---- the sheet, the part already unrolled ---- */
  const sheet = put(group, new THREE.PlaneGeometry(SW, SD), mat.paper(plan), 0, Y, 0);
  sheet.rotation.x = -Math.PI / 2;
  /* ---- the roll, which moves to the right as the sheet opens ---- */
  const roll = put(group, cyl(1, 1, SD + 0.06, 64).rotateX(Math.PI / 2), [mat.paper(back), mat.paper(end), mat.paper(end)], 0, 0, 0);
  /* ---- a steel ruler and a pencil ---- */
  const ruler = new THREE.Group();
  put(ruler, rbox(2.2, 0.025, 0.32, 0.01, 2), mat.alu(0xd3d8de, 0.28), 0, 0, 0);
  const marks = drawn(env, 1024, 96, (g, w, h) => {
    g.fillStyle = "#cfd5db";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#3a4048";
    for (let i = 0; i <= 64; i++) g.fillRect(8 + i * 15.75, 0, 2, i % 8 === 0 ? 40 : i % 4 === 0 ? 28 : 16);
  });
  const rm = put(ruler, new THREE.PlaneGeometry(2.16, 0.3), new THREE.MeshStandardMaterial({ map: marks, metalness: 0.6, roughness: 0.35 }), 0, 0.0135, 0);
  rm.rotation.x = -Math.PI / 2;
  ruler.position.set(-2.35, Y + 0.013, 1.55);
  ruler.rotation.y = 0.06;
  group.add(ruler);
  const pencil = new THREE.Group();
  put(pencil, cyl(0.055, 0.055, 1.5, 6).rotateZ(Math.PI / 2), mat.paint(0x22425f, 0.4), 0, 0, 0);
  put(pencil, new THREE.ConeGeometry(0.055, 0.2, 24).rotateZ(-Math.PI / 2), mat.wood(0xd9b48a), 0.85, 0, 0);
  put(pencil, new THREE.ConeGeometry(0.018, 0.06, 12).rotateZ(-Math.PI / 2), mat.rubber(0x2a2f36), 0.96, 0, 0);
  put(pencil, cyl(0.058, 0.058, 0.12, 24).rotateZ(Math.PI / 2), mat.alu(0xc9ced4, 0.3), -0.78, 0, 0);
  pencil.position.set(1.7, Y + 0.056, 1.05);
  pencil.rotation.y = -0.5;
  group.add(pencil);
  group.add(shadow(env, SW + 0.8, SD + 0.8, 0.18, 0, 0));

  const U0 = 0.34;
  const model: Model = {
    group,
    tags: [],
    camera: { az: [-0.18, 0.1], elev: [0.9, 0.82] },
    floorY: 0,
    set(_a, _l, p) {
      const t = smooth(clamp01(p / 0.85));
      const u = lerp(U0, 1, t) * SW; // how much of the sheet lies open
      sheet.scale.x = u / SW;
      sheet.position.x = -SW / 2 + u / 2;
      plan.repeat.set(u / SW, 1);
      plan.offset.set(0, 0);
      const r = lerp(0.36, 0.1, t);
      roll.scale.set(r, r, 1);
      roll.position.set(-SW / 2 + u + r * 0.92, Y + r, 0);
      roll.rotation.z = -(u - U0 * SW) / Math.max(0.1, r) * 0.25;
      // the pencil lies where the sheet is already open
      pencil.visible = -SW / 2 + u > 2.6;
    },
    frame: () => ({ cx: 0, cy: 0.2, hw: SW / 2 + 0.4, hh: 1.6 }),
  };
  model.set(1, 1, 0);
  return model;
};

export default build;
