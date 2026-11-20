import * as THREE from "three";
import { drawn, fillRR, rr } from "./parts";
import { rng } from "./env";
import type { ModelEnv } from "./types";

/**
 * Interfaces drawn for the scenes: dashboards, charts, tables, maps, a chat, code, a wireframe, a finished page.
 * Only the shapes of an interface (bars for lines of text, blocks for figures), so nothing on them is a claim and
 * nothing depends on a font. Every kind is drawn the same way: white glass, navy lines, blue, with one green accent.
 */

export type UIKind = "kpi" | "bars" | "line" | "donut" | "table" | "map" | "heat" | "chat" | "code" | "feed" | "wire" | "page" | "api" | "voice" | "tasks";

const BLUE = "#2f6fb5";
const SKY = "#22425f";
const GREEN = "#5db536";
const AMBER = "#f0b64a";

const sk = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h = 10, a = 0.22) => fillRR(g, x, y, w, h, h / 2, `rgba(34,66,95,${a})`);
const card = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 16, fill = "rgba(34,66,95,0.04)") => {
  fillRR(g, x, y, w, h, r, fill);
  rr(g, x + 0.5, y + 0.5, w - 1, h - 1, r);
  g.strokeStyle = "rgba(34,66,95,0.16)";
  g.lineWidth = 1.5;
  g.stroke();
};
const dotAt = (g: CanvasRenderingContext2D, x: number, y: number, r: number, c: string) => {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = c;
  g.fill();
};

/** A smooth curve through some points. */
function curve(g: CanvasRenderingContext2D, pts: [number, number][]) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    g.bezierCurveTo(x0 + (x1 - x0) * 0.5, y0, x0 + (x1 - x0) * 0.5, y1, x1, y1);
  }
}

function area(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: () => number, color: string, fillA = 0.28) {
  const n = 9;
  const pts: [number, number][] = [];
  let v = 0.45;
  for (let i = 0; i < n; i++) {
    v = Math.min(0.92, Math.max(0.14, v + (r() - 0.42) * 0.38));
    pts.push([x + (i / (n - 1)) * w, y + h - v * h]);
  }
  curve(g, pts);
  g.lineTo(x + w, y + h);
  g.lineTo(x, y + h);
  g.closePath();
  const gr = g.createLinearGradient(0, y, 0, y + h);
  gr.addColorStop(0, color.replace("1)", `${fillA})`));
  gr.addColorStop(1, color.replace("1)", "0)"));
  g.fillStyle = gr;
  g.fill();
  curve(g, pts);
  g.strokeStyle = color;
  g.lineWidth = 4;
  g.lineCap = "round";
  g.stroke();
  pts.forEach(([px, py], i) => i % 2 === 0 && dotAt(g, px, py, 5, color));
}

function paint(g: CanvasRenderingContext2D, w: number, h: number, kind: UIKind, seed: number, accent: string) {
  const r = rng(seed);
  const bg = g.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#ffffff");
  bg.addColorStop(1, "#e9f0f7");
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  const lit = g.createRadialGradient(w * 0.2, 0, 0, w * 0.2, 0, w * 0.9);
  lit.addColorStop(0, "rgba(47,111,181,0.1)");
  lit.addColorStop(1, "rgba(47,111,181,0)");
  g.fillStyle = lit;
  g.fillRect(0, 0, w, h);
  const m = Math.round(w * 0.045);
  // the top bar: three dots and a title
  [0, 1, 2].forEach((i) => dotAt(g, m + 8 + i * 22, m + 10, 6, i === 0 ? accent : "rgba(34,66,95,0.4)"));
  sk(g, m + 96, m + 4, w * 0.2, 12, 0.3);
  sk(g, w - m - w * 0.16, m + 4, w * 0.16, 12, 0.16);
  const x0 = m;
  const y0 = m + 40;
  const bw = w - 2 * m;
  const bh = h - y0 - m;

  switch (kind) {
    case "kpi": {
      const cw = (bw - 2 * 18) / 3;
      for (let i = 0; i < 3; i++) {
        const cx = x0 + i * (cw + 18);
        card(g, cx, y0, cw, bh * 0.3, 16);
        sk(g, cx + 16, y0 + 16, cw * 0.4, 9, 0.25);
        fillRR(g, cx + 16, y0 + 38, cw * 0.55, bh * 0.07, 8, i === 1 ? accent : SKY);
        area(g, cx + 14, y0 + bh * 0.17, cw - 28, bh * 0.1, r, i === 1 ? "rgba(115,201,74,1)" : "rgba(47,111,181,1)", 0.2);
      }
      card(g, x0, y0 + bh * 0.34, bw, bh * 0.66, 18);
      sk(g, x0 + 20, y0 + bh * 0.34 + 18, bw * 0.2, 10, 0.28);
      area(g, x0 + 20, y0 + bh * 0.34 + 44, bw - 40, bh * 0.66 - 70, r, "rgba(47,111,181,1)", 0.3);
      break;
    }
    case "bars": {
      card(g, x0, y0, bw, bh, 18);
      sk(g, x0 + 20, y0 + 18, bw * 0.24, 10, 0.28);
      const n = 10;
      const gw = bw - 56;
      for (let i = 0; i < 4; i++) {
        g.fillStyle = "rgba(34,66,95,0.1)";
        g.fillRect(x0 + 28, y0 + 56 + (i * (bh - 110)) / 3, gw, 1.5);
      }
      let v = 0.5;
      for (let i = 0; i < n; i++) {
        v = Math.min(0.95, Math.max(0.2, v + (r() - 0.45) * 0.35));
        const bwid = gw / n - 10;
        const hh = (bh - 120) * v;
        fillRR(g, x0 + 28 + i * (gw / n) + 5, y0 + bh - 52 - hh, bwid, hh, 7, i === n - 3 ? accent : "rgba(47,111,181,0.85)");
      }
      break;
    }
    case "line": {
      card(g, x0, y0, bw, bh, 18);
      sk(g, x0 + 20, y0 + 18, bw * 0.2, 10, 0.28);
      for (let i = 0; i < 4; i++) {
        g.fillStyle = "rgba(34,66,95,0.1)";
        g.fillRect(x0 + 24, y0 + 56 + (i * (bh - 100)) / 3, bw - 48, 1.5);
      }
      area(g, x0 + 24, y0 + 52, bw - 48, bh - 90, r, "rgba(47,111,181,1)", 0.32);
      area(g, x0 + 24, y0 + 52, bw - 48, bh - 90, r, "rgba(115,201,74,1)", 0.12);
      break;
    }
    case "donut": {
      card(g, x0, y0, bw, bh, 18);
      const cx = x0 + bw * 0.3;
      const cy = y0 + bh * 0.52;
      const rad = Math.min(bw * 0.2, bh * 0.36);
      const parts = [0.42, 0.26, 0.19, 0.13];
      const cols = [BLUE, accent, SKY, "rgba(34,66,95,0.4)"];
      let a = -Math.PI / 2;
      parts.forEach((p, i) => {
        g.beginPath();
        g.arc(cx, cy, rad, a, a + p * Math.PI * 2 - 0.04);
        g.strokeStyle = cols[i];
        g.lineWidth = rad * 0.32;
        g.lineCap = "round";
        g.stroke();
        a += p * Math.PI * 2;
      });
      for (let i = 0; i < 4; i++) {
        dotAt(g, x0 + bw * 0.6, y0 + bh * 0.25 + i * bh * 0.16, 8, cols[i]);
        sk(g, x0 + bw * 0.6 + 24, y0 + bh * 0.25 + i * bh * 0.16 - 5, bw * 0.22, 11, 0.28);
      }
      break;
    }
    case "table": {
      card(g, x0, y0, bw, bh, 18);
      for (let c = 0; c < 4; c++) sk(g, x0 + 20 + c * (bw * 0.23), y0 + 20, bw * 0.12, 9, 0.34);
      const rows = 6;
      for (let i = 0; i < rows; i++) {
        const y = y0 + 54 + i * ((bh - 70) / rows);
        g.fillStyle = "rgba(34,66,95,0.08)";
        g.fillRect(x0 + 16, y - 8, bw - 32, 1.5);
        dotAt(g, x0 + 30, y + 14, 9, "rgba(34,66,95,0.3)");
        sk(g, x0 + 52, y + 8, bw * 0.16, 10, 0.26);
        sk(g, x0 + 20 + bw * 0.23 + 20, y + 8, bw * 0.12, 10, 0.2);
        sk(g, x0 + 20 + bw * 0.46 + 20, y + 8, bw * 0.1, 10, 0.2);
        fillRR(g, x0 + bw - 20 - bw * 0.14, y + 3, bw * 0.14, 22, 11, r() > 0.3 ? "rgba(115,201,74,0.28)" : r() > 0.5 ? "rgba(47,111,181,0.28)" : "rgba(240,182,74,0.3)");
      }
      break;
    }
    case "map": {
      card(g, x0, y0, bw, bh, 18);
      const cols = 40;
      const rows = 18;
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
          const u = i / cols;
          const v = j / rows;
          const land = Math.sin(u * 9 + 1) * Math.cos(v * 7 + 0.5) + Math.sin(u * 4.2 + v * 5) * 0.7 > 0.1;
          if (land) dotAt(g, x0 + 24 + u * (bw - 48), y0 + 24 + v * (bh - 48), 3.4, `rgba(34,66,95,${0.25 + r() * 0.35})`);
        }
      const pins: [number, number][] = [];
      for (let i = 0; i < 6; i++) pins.push([x0 + 40 + r() * (bw - 80), y0 + 40 + r() * (bh - 80)]);
      pins.forEach(([px, py], i) => {
        if (i) {
          const [qx, qy] = pins[i - 1];
          g.beginPath();
          g.moveTo(qx, qy);
          g.quadraticCurveTo((qx + px) / 2, Math.min(qy, py) - 40, px, py);
          g.strokeStyle = "rgba(115,201,74,0.7)";
          g.lineWidth = 2.5;
          g.stroke();
        }
        dotAt(g, px, py, 14, "rgba(115,201,74,0.25)");
        dotAt(g, px, py, 6, accent);
      });
      break;
    }
    case "heat": {
      card(g, x0, y0, bw, bh, 18);
      sk(g, x0 + 20, y0 + 18, bw * 0.2, 10, 0.28);
      const cols = 14;
      const rows = 7;
      const cw = (bw - 48) / cols;
      const ch = (bh - 90) / rows;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) fillRR(g, x0 + 24 + i * cw + 2, y0 + 56 + j * ch + 2, cw - 4, ch - 4, 5, r() > 0.82 ? `rgba(115,201,74,${0.35 + r() * 0.5})` : `rgba(47,111,181,${0.1 + r() * 0.55})`);
      break;
    }
    case "chat": {
      card(g, x0, y0, bw, bh, 18);
      const lines = [
        [0, 0.5],
        [1, 0.62],
        [0, 0.4],
        [1, 0.55],
        [0, 0.7],
      ];
      lines.forEach(([me, wf], i) => {
        const y = y0 + 20 + i * (bh * 0.17);
        const ww = bw * wf;
        const x = me ? x0 + bw - 20 - ww : x0 + 20;
        fillRR(g, x, y, ww, bh * 0.13, 16, me ? "rgba(115,201,74,0.28)" : "rgba(47,111,181,0.26)");
        sk(g, x + 16, y + bh * 0.04, ww * 0.6, 9, 0.5);
        if (i % 2 === 0) sk(g, x + 16, y + bh * 0.075, ww * 0.38, 9, 0.3);
      });
      fillRR(g, x0 + 16, y0 + bh - 52, bw - 32, 36, 18, "rgba(34,66,95,0.1)");
      dotAt(g, x0 + bw - 40, y0 + bh - 34, 11, accent);
      break;
    }
    case "code": {
      card(g, x0, y0, bw, bh, 18);
      const n = 11;
      for (let i = 0; i < n; i++) {
        const y = y0 + 22 + i * ((bh - 40) / n);
        sk(g, x0 + 18, y, 18, 9, 0.18);
        let x = x0 + 56 + (i % 4 === 1 || i % 4 === 2 ? 36 : 0);
        for (let t = 0; t < 4; t++) {
          const tw = 30 + r() * 90;
          if (x + tw > x0 + bw - 20) break;
          fillRR(g, x, y, tw, 9, 4.5, t === 0 ? "rgba(115,201,74,0.6)" : t === 2 ? "rgba(47,111,181,0.6)" : "rgba(34,66,95,0.34)");
          x += tw + 12;
        }
      }
      break;
    }
    case "feed": {
      card(g, x0, y0, bw, bh, 18);
      for (let i = 0; i < 5; i++) {
        const y = y0 + 22 + i * ((bh - 36) / 5);
        dotAt(g, x0 + 38, y + 22, 18, i === 1 ? accent : "rgba(47,111,181,0.45)");
        sk(g, x0 + 72, y + 6, bw * 0.34, 11, 0.4);
        sk(g, x0 + 72, y + 28, bw * 0.5, 9, 0.2);
        fillRR(g, x0 + bw - 30 - bw * 0.1, y + 10, bw * 0.1, 22, 11, "rgba(115,201,74,0.22)");
      }
      break;
    }
    case "tasks": {
      card(g, x0, y0, bw, bh, 18);
      sk(g, x0 + 20, y0 + 18, bw * 0.24, 10, 0.3);
      for (let i = 0; i < 6; i++) {
        const y = y0 + 52 + i * ((bh - 70) / 6);
        const done = i < 4;
        rr(g, x0 + 20, y, 26, 26, 7);
        g.fillStyle = done ? "rgba(115,201,74,0.9)" : "rgba(34,66,95,0.14)";
        g.fill();
        if (done) {
          g.beginPath();
          g.moveTo(x0 + 26, y + 14);
          g.lineTo(x0 + 32, y + 20);
          g.lineTo(x0 + 41, y + 8);
          g.strokeStyle = "#ffffff";
          g.lineWidth = 3.5;
          g.lineCap = "round";
          g.lineJoin = "round";
          g.stroke();
        }
        sk(g, x0 + 62, y + 8, bw * (0.3 + r() * 0.3), 10, done ? 0.4 : 0.22);
        fillRR(g, x0 + bw - 22 - bw * 0.12, y + 2, bw * 0.12, 22, 11, done ? "rgba(115,201,74,0.25)" : "rgba(47,111,181,0.2)");
      }
      break;
    }
    case "voice": {
      card(g, x0, y0, bw, bh, 18);
      const n = 44;
      for (let i = 0; i < n; i++) {
        const hh = (0.12 + 0.88 * Math.abs(Math.sin(i * 0.5) * Math.cos(i * 0.19 + 1))) * (bh * 0.55);
        fillRR(g, x0 + 24 + i * ((bw - 48) / n), y0 + bh * 0.5 - hh / 2, (bw - 48) / n - 5, hh, 4, i % 9 === 4 ? accent : "rgba(47,111,181,0.8)");
      }
      sk(g, x0 + 24, y0 + bh - 40, bw * 0.4, 10, 0.3);
      break;
    }
    case "wire": {
      // a grey wireframe: boxes with dashed outlines
      g.fillStyle = "#f1f5f9";
      g.fillRect(0, 0, w, h);
      g.setLineDash([10, 8]);
      g.strokeStyle = "rgba(34,66,95,0.55)";
      g.lineWidth = 2.5;
      const box = (x: number, y: number, ww: number, hh: number) => {
        rr(g, x, y, ww, hh, 8);
        g.stroke();
      };
      box(x0, y0 - 6, bw, 54);
      box(x0, y0 + 64, bw * 0.55, bh * 0.4);
      box(x0 + bw * 0.6, y0 + 64, bw * 0.4, bh * 0.4);
      for (let i = 0; i < 3; i++) box(x0 + i * (bw / 3 + 2), y0 + 64 + bh * 0.45, bw / 3 - 14, bh * 0.35);
      g.setLineDash([]);
      g.beginPath();
      g.moveTo(x0 + bw * 0.04, y0 + 64 + bh * 0.4);
      g.lineTo(x0 + bw * 0.55 - 8, y0 + 64);
      g.moveTo(x0 + bw * 0.04, y0 + 64);
      g.lineTo(x0 + bw * 0.55 - 8, y0 + 64 + bh * 0.4);
      g.strokeStyle = "rgba(34,66,95,0.22)";
      g.stroke();
      break;
    }
    case "page": {
      // a finished page: a hero with a gradient, headline bars and buttons, three cards below
      const hero = g.createLinearGradient(x0, y0, x0 + bw, y0 + bh * 0.5);
      hero.addColorStop(0, "#2b6fc0");
      hero.addColorStop(1, "#1a8f6a");
      fillRR(g, x0, y0 - 6, bw, bh * 0.46, 22, hero);
      fillRR(g, x0 + 28, y0 + 22, bw * 0.46, 22, 11, "rgba(255,255,255,0.92)");
      fillRR(g, x0 + 28, y0 + 56, bw * 0.34, 22, 11, "rgba(255,255,255,0.92)");
      sk(g, x0 + 28, y0 + 98, bw * 0.4, 10, 0.55);
      fillRR(g, x0 + 28, y0 + bh * 0.46 - 50, 130, 40, 20, accent);
      for (let i = 0; i < 3; i++) {
        const cw = (bw - 36) / 3;
        card(g, x0 + i * (cw + 18), y0 + bh * 0.5 + 6, cw, bh * 0.46, 18);
        dotAt(g, x0 + i * (cw + 18) + 34, y0 + bh * 0.5 + 44, 14, i === 1 ? accent : "rgba(47,111,181,0.8)");
        sk(g, x0 + i * (cw + 18) + 18, y0 + bh * 0.5 + 76, cw * 0.6, 11, 0.45);
        sk(g, x0 + i * (cw + 18) + 18, y0 + bh * 0.5 + 100, cw * 0.4, 9, 0.22);
      }
      break;
    }
    case "api": {
      const pts: [number, number][] = [];
      for (let i = 0; i < 9; i++) pts.push([x0 + 50 + (i % 3) * (bw - 100) * 0.5 + (r() - 0.5) * 40, y0 + 40 + Math.floor(i / 3) * (bh - 80) * 0.5 + (r() - 0.5) * 24]);
      g.strokeStyle = "rgba(47,111,181,0.5)";
      g.lineWidth = 2.5;
      pts.forEach((p, i) => {
        [i + 1, i + 3].forEach((j) => {
          if (j < pts.length && !(j === i + 1 && (i + 1) % 3 === 0)) {
            g.beginPath();
            g.moveTo(p[0], p[1]);
            g.lineTo(pts[j][0], pts[j][1]);
            g.stroke();
          }
        });
      });
      pts.forEach(([px, py], i) => {
        fillRR(g, px - 46, py - 17, 92, 34, 17, i === 4 ? "rgba(115,201,74,0.3)" : "rgba(47,111,181,0.2)");
        rr(g, px - 46, py - 17, 92, 34, 17);
        g.strokeStyle = i === 4 ? accent : "rgba(34,66,95,0.5)";
        g.lineWidth = 2;
        g.stroke();
        sk(g, px - 28, py - 4, 56, 8, 0.5);
      });
      break;
    }
  }
  // a faint sheen across the glass
  const sheen = g.createLinearGradient(0, 0, w, h);
  sheen.addColorStop(0, "rgba(255,255,255,0.12)");
  sheen.addColorStop(0.42, "rgba(255,255,255,0)");
  g.fillStyle = sheen;
  g.fillRect(0, 0, w, h);
  // a hairline frame
  rr(g, 1.5, 1.5, w - 3, h - 3, Math.min(w, h) * 0.05);
  g.strokeStyle = "rgba(34,66,95,0.28)";
  g.lineWidth = 3;
  g.stroke();
}

/** A drawn interface as a texture. `seed` varies the figures; `accent` is the one green (or amber) note. */
export function uiTexture(env: ModelEnv, kind: UIKind, w: number, h: number, seed = 1, accent = GREEN): THREE.CanvasTexture {
  return drawn(env, w, h, (g, cw, ch) => paint(g, cw, ch, kind, seed, accent));
}

export { AMBER, BLUE, GREEN, SKY };
