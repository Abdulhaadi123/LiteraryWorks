import * as THREE from "three";
import { blobTexture } from "../kit";
import { fillRR, rr } from "./parts";
import type { ModelEnv } from "./types";

/** The soft shadow every object casts on the floor, and the nine service icons (drawn as lines, for the book's pages). */

const cache = new WeakMap<ModelEnv, THREE.Texture>();
/** The soft navy blob a shadow is drawn with, made once for a scene. */
function shadowTex(env: ModelEnv): THREE.Texture {
  let t = cache.get(env);
  if (!t) {
    t = blobTexture("34,66,95", 0.9);
    env.textures.push(t);
    cache.set(env, t);
  }
  return t;
}

/** A soft shadow on the floor under something: `w` by `d` wide (it is left out of the mirror). */
export function floorShadow(env: ModelEnv, w: number, d: number, opacity = 0.22, x = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTex(env), transparent: true, opacity, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2;
  m.scale.set(w, d, 1);
  m.position.set(x, 0.012, z);
  m.renderOrder = -1;
  m.layers.set(1);
  return m;
}

/* ---- the nine service icons: drawn as lines, centred, about 260 px across ---- */

type Pen = CanvasRenderingContext2D;
const LINE = "#22425f";
const ACC = "#5db536";
const stroke = (g: Pen, c = LINE, w = 15) => {
  g.strokeStyle = c;
  g.lineWidth = w;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.stroke();
};
const fill = (g: Pen, c: string) => {
  g.fillStyle = c;
  g.fill();
};
const star = (g: Pen, x: number, y: number, s: number) => {
  g.beginPath();
  g.moveTo(x, y - s);
  g.quadraticCurveTo(x + s * 0.12, y - s * 0.12, x + s, y);
  g.quadraticCurveTo(x + s * 0.12, y + s * 0.12, x, y + s);
  g.quadraticCurveTo(x - s * 0.12, y + s * 0.12, x - s, y);
  g.quadraticCurveTo(x - s * 0.12, y - s * 0.12, x, y - s);
  g.closePath();
};

export const ICONS: Record<string, (g: Pen) => void> = {
  // AI and automation: a spark
  spark(g) {
    star(g, -8, 6, 118);
    stroke(g);
    star(g, 88, -92, 34);
    fill(g, ACC);
  },
  // voice: a waveform
  wave(g) {
    [46, 104, 168, 232, 168, 104, 46].forEach((h, i) => fillRR(g, -131 + i * 40, -h / 2, 22, h, 11, i === 3 ? ACC : LINE));
  },
  // SaaS: layers
  layers(g) {
    for (let k = 2; k >= 0; k--) {
      const y = (k - 1) * 64;
      g.beginPath();
      g.moveTo(0, y - 52);
      g.lineTo(118, y);
      g.lineTo(0, y + 52);
      g.lineTo(-118, y);
      g.closePath();
      fill(g, "#f4f8fc");
      stroke(g, k === 0 ? ACC : LINE, 14);
    }
  },
  // enterprise: a dashboard of tiles
  grid(g) {
    [
      [-62, -62],
      [62, -62],
      [-62, 62],
      [62, 62],
    ].forEach(([x, y], i) => {
      rr(g, x - 50, y - 50, 100, 100, 24);
      if (i === 0) fill(g, "rgba(34,66,95,0.1)");
      stroke(g, i === 3 ? ACC : LINE, 14);
    });
  },
  // web apps: a browser window
  browser(g) {
    rr(g, -130, -98, 260, 196, 30);
    stroke(g);
    g.beginPath();
    g.moveTo(-130, -46);
    g.lineTo(130, -46);
    stroke(g, LINE, 11);
    [-100, -72, -44].forEach((x, i) => {
      g.beginPath();
      g.arc(x, -72, 8, 0, Math.PI * 2);
      fill(g, i === 0 ? ACC : LINE);
    });
    rr(g, -98, -14, 96, 62, 14);
    stroke(g, LINE, 10);
    g.beginPath();
    g.moveTo(26, -6);
    g.lineTo(100, -6);
    g.moveTo(26, 22);
    g.lineTo(100, 22);
    g.moveTo(26, 50);
    g.lineTo(72, 50);
    stroke(g, LINE, 10);
  },
  // mobile apps: a phone
  phone(g) {
    rr(g, -72, -128, 144, 256, 34);
    stroke(g);
    g.beginPath();
    g.moveTo(-22, -100);
    g.lineTo(22, -100);
    stroke(g, LINE, 11);
    g.beginPath();
    g.arc(0, 98, 11, 0, Math.PI * 2);
    stroke(g, LINE, 9);
    rr(g, -44, -64, 88, 46, 12);
    stroke(g, LINE, 9);
    g.beginPath();
    g.moveTo(-44, 10);
    g.lineTo(44, 10);
    g.moveTo(-44, 38);
    g.lineTo(18, 38);
    stroke(g, LINE, 9);
    g.beginPath();
    g.arc(70, -126, 17, 0, Math.PI * 2);
    fill(g, ACC);
  },
  // UI and UX design: a curve with its handles
  pen(g) {
    g.beginPath();
    g.moveTo(-112, 74);
    g.bezierCurveTo(-60, -124, 60, 124, 112, -74);
    stroke(g, LINE, 15);
    g.beginPath();
    g.moveTo(-112, 74);
    g.lineTo(-60, -124);
    g.moveTo(112, -74);
    g.lineTo(60, 124);
    stroke(g, LINE, 6);
    [
      [-60, -124],
      [60, 124],
    ].forEach(([x, y]) => {
      g.beginPath();
      g.arc(x, y, 14, 0, Math.PI * 2);
      fill(g, ACC);
    });
    [
      [-112, 74],
      [112, -74],
    ].forEach(([x, y]) => {
      rr(g, x - 15, y - 15, 30, 30, 6);
      fill(g, "#f4f8fc");
      stroke(g, LINE, 9);
    });
  },
  // cloud and DevOps: a cloud with an arrow rising
  cloud(g) {
    g.beginPath();
    g.moveTo(-88, 64);
    g.bezierCurveTo(-140, 64, -140, -6, -88, -12);
    g.bezierCurveTo(-82, -76, -8, -92, 22, -54);
    g.bezierCurveTo(52, -86, 118, -58, 106, 2);
    g.bezierCurveTo(148, 8, 144, 64, 102, 64);
    g.closePath();
    stroke(g);
    g.beginPath();
    g.moveTo(8, 40);
    g.lineTo(8, -14);
    g.moveTo(-14, 6);
    g.lineTo(8, -18);
    g.lineTo(30, 6);
    stroke(g, ACC, 14);
  },
  // construction technology: software for builders, a pipeline board with jobs moving across its columns
  board(g) {
    rr(g, -130, -104, 260, 208, 26);
    stroke(g);
    g.beginPath();
    g.moveTo(-130, -70);
    g.lineTo(130, -70);
    g.moveTo(-43, -70);
    g.lineTo(-43, 104);
    g.moveTo(43, -70);
    g.lineTo(43, 104);
    stroke(g, LINE, 8);
    [
      [-108, -54],
      [-108, -8],
      [-108, 38],
      [-22, -54],
      [-22, -8],
      [64, -54],
    ].forEach(([x, y], i) => {
      rr(g, x, y, 44, 34, 8);
      if (i === 4) fill(g, ACC);
      else stroke(g, LINE, 8);
    });
  },
  // the things that arrive: a mail, a document, a chat, a date, a receipt
  mail(g) {
    rr(g, -118, -80, 236, 160, 26);
    stroke(g);
    g.beginPath();
    g.moveTo(-112, -62);
    g.lineTo(0, 22);
    g.lineTo(112, -62);
    stroke(g, LINE, 12);
  },
  doc(g) {
    rr(g, -84, -118, 168, 236, 22);
    stroke(g);
    [-52, -12, 28].forEach((y, i) => {
      g.beginPath();
      g.moveTo(-48, y);
      g.lineTo(i === 2 ? 10 : 48, y);
      stroke(g, LINE, 11);
    });
    g.beginPath();
    g.arc(30, 76, 14, 0, Math.PI * 2);
    fill(g, ACC);
  },
  chat(g) {
    rr(g, -120, -88, 240, 156, 44);
    stroke(g);
    g.beginPath();
    g.moveTo(-60, 66);
    g.lineTo(-84, 118);
    g.lineTo(-18, 68);
    stroke(g, LINE, 12);
    [-46, 0, 46].forEach((x) => {
      g.beginPath();
      g.arc(x, -10, 11, 0, Math.PI * 2);
      fill(g, LINE);
    });
  },
  cal(g) {
    rr(g, -104, -92, 208, 196, 24);
    stroke(g);
    g.beginPath();
    g.moveTo(-104, -40);
    g.lineTo(104, -40);
    stroke(g, LINE, 11);
    [-52, 52].forEach((x) => {
      g.beginPath();
      g.moveTo(x, -116);
      g.lineTo(x, -66);
      stroke(g, LINE, 12);
    });
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 3; c++) {
        g.beginPath();
        g.arc(-52 + c * 52, 4 + r * 46, 10, 0, Math.PI * 2);
        fill(g, r === 1 && c === 2 ? ACC : LINE);
      }
  },
  receipt(g) {
    g.beginPath();
    g.moveTo(-80, -116);
    g.lineTo(80, -116);
    g.lineTo(80, 116);
    for (let i = 0; i < 5; i++) g.lineTo(80 - (i + 0.5) * 32, i % 2 ? 116 : 96), g.lineTo(80 - (i + 1) * 32, 116);
    g.lineTo(-80, -116);
    g.closePath();
    stroke(g);
    [-60, -20, 20].forEach((y, i) => {
      g.beginPath();
      g.moveTo(-44, y);
      g.lineTo(i === 2 ? 4 : 44, y);
      stroke(g, LINE, 11);
    });
  },
  // what comes out: done, and checked
  check(g) {
    g.beginPath();
    g.arc(0, 0, 112, 0, Math.PI * 2);
    stroke(g, ACC, 15);
    g.beginPath();
    g.moveTo(-52, 6);
    g.lineTo(-12, 46);
    g.lineTo(58, -40);
    stroke(g, ACC, 19);
  },
};
