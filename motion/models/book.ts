import * as THREE from "three";
import { cases, principles } from "../../lib/content";
import { services } from "../../lib/services";
import { clamp01, lerp, smooth, win } from "../engine";
import { ICONS } from "./glow";
import { drawn, fillRR, rr } from "./parts";
import { mat, put, rbox, shadow } from "./real";
import type { Model, ModelBuilder, ModelEnv } from "./types";

/**
 * Our work, bound in a book: a real hardcover lying open on the table whose leaves turn (and bend as they go) as the
 * page scrolls. Its pages carry our projects: each case study has a spread, its story and results on the left and its
 * picture on the right. The same book, with other pages, is the handbook a client gets at handover, and the story of
 * how we work.
 *
 * `kind`: "cases" (all of them, one spread each), a case's slug (it opens at that case), "handbook" or "about".
 */

const W = 3.3;
const H = 4.4;
const COLS = 24;
const COVER = 0.12;
const BLOCK = 0.2;
const Y0 = COVER + BLOCK;
const STEP = 0.012;
/** A page's picture, in pixels: [width, height] (smaller where the book is one of several objects on the stage). */
const PAGE_PX: Record<"full" | "mini", [number, number]> = { full: [512, 683], mini: [384, 512] };
const NAVY = "#22425f";
const GREEN = "#5db536";
const INK = "#191716";

type Pen = (g: CanvasRenderingContext2D, w: number, h: number) => void;
interface Spread {
  left: Pen;
  right: Pen;
}

const page = (env: ModelEnv, size: [number, number], spine: "left" | "right", draw: Pen) =>
  drawn(env, size[0], size[1], (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#ffffff");
    bg.addColorStop(1, "#f2f5f8");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    draw(g, w, h);
    const x0 = spine === "left" ? 0 : w;
    const sh = g.createLinearGradient(x0, 0, spine === "left" ? w * 0.18 : w * 0.82, 0);
    sh.addColorStop(0, "rgba(34,66,95,0.2)");
    sh.addColorStop(1, "rgba(34,66,95,0)");
    g.fillStyle = sh;
    g.fillRect(0, 0, w, h);
  });

/** Words wrapped to a width; returns where the next line would go. */
function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines = 4): number {
  const words = text.split(" ");
  let line = "";
  let n = 0;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (g.measureText(test).width > maxW && line) {
      g.fillText(line, x, y);
      y += lineH;
      line = word;
      if (++n >= maxLines - 1) break;
    } else line = test;
  }
  if (line) {
    g.fillText(line, x, y);
    y += lineH;
  }
  return y;
}

const kicker = (g: CanvasRenderingContext2D, text: string, y = 74) => {
  fillRR(g, 40, y - 12, 26, 4, 2, GREEN);
  g.fillStyle = NAVY;
  g.font = "700 15px Inter, system-ui, sans-serif";
  g.textBaseline = "alphabetic";
  g.fillText(text.toUpperCase(), 76, y - 6);
};

function picture(img: HTMLImageElement | null, caption: string, note: string): Pen {
  return (g, w, h) => {
    const x = 40;
    const y = 70;
    const bw = w - 80;
    const bh = h * 0.56;
    g.save();
    rr(g, x, y, bw, bh, 14);
    g.clip();
    if (img) {
      const k = Math.max(bw / img.naturalWidth, bh / img.naturalHeight);
      g.imageSmoothingQuality = "high";
      g.drawImage(img, x + (bw - img.naturalWidth * k) / 2, y + (bh - img.naturalHeight * k) / 2, img.naturalWidth * k, img.naturalHeight * k);
    } else {
      g.fillStyle = NAVY;
      g.fillRect(x, y, bw, bh);
    }
    g.restore();
    g.fillStyle = INK;
    g.font = "700 24px Inter, system-ui, sans-serif";
    g.fillText(caption, 40, y + bh + 54);
    g.fillStyle = "rgba(34,66,95,0.7)";
    g.font = "500 17px Inter, system-ui, sans-serif";
    wrap(g, note, 40, y + bh + 86, w - 80, 24, 3);
  };
}

function caseText(c: (typeof cases)[number]): Pen {
  return (g, w) => {
    kicker(g, c.tags[0]);
    g.fillStyle = INK;
    g.font = "700 30px Inter, system-ui, sans-serif";
    let y = wrap(g, c.title, 40, 128, w - 80, 36, 4);
    g.fillStyle = "rgba(34,66,95,0.7)";
    g.font = "500 17px Inter, system-ui, sans-serif";
    y = wrap(g, c.client, 40, y + 8, w - 80, 24, 2);
    fillRR(g, 40, y + 14, w - 80, 2, 1, "rgba(34,66,95,0.15)");
    c.results.slice(0, 3).forEach((m, i) => {
      const yy = y + 76 + i * 92;
      g.fillStyle = i === 0 ? GREEN : NAVY;
      g.font = "700 44px Inter, system-ui, sans-serif";
      g.fillText(m.value, 40, yy);
      g.fillStyle = "rgba(25,23,22,0.75)";
      g.font = "500 17px Inter, system-ui, sans-serif";
      wrap(g, m.label, 40, yy + 28, w - 80, 22, 2);
    });
  };
}

const servicesPage: Pen = (g, w) => {
  kicker(g, "What we build");
  g.fillStyle = INK;
  g.font = "700 30px Inter, system-ui, sans-serif";
  g.fillText("Nine services,", 40, 128);
  g.fillText("one system.", 40, 164);
  const icons = ["spark", "wave", "layers", "grid", "browser", "phone", "pen", "cloud", "board"];
  services.forEach((s, i) => {
    const cx = 40 + (i % 3) * ((w - 80) / 3);
    const cy = 210 + Math.floor(i / 3) * 140;
    fillRR(g, cx, cy, (w - 80) / 3 - 12, 120, 14, "#eef3f8");
    g.save();
    g.translate(cx + 38, cy + 40);
    g.scale(0.11, 0.11);
    ICONS[icons[i]]?.(g);
    g.restore();
    g.fillStyle = NAVY;
    g.font = "600 13px Inter, system-ui, sans-serif";
    wrap(g, s.name, cx + 12, cy + 86, (w - 80) / 3 - 30, 16, 2);
  });
};

const introPage: Pen = (g, w) => {
  kicker(g, "Selected work");
  g.fillStyle = INK;
  g.font = "700 34px Inter, system-ui, sans-serif";
  g.fillText("Systems that run", 40, 134);
  g.fillStyle = NAVY;
  g.fillText("in production.", 40, 176);
  fillRR(g, 40, 196, 150, 5, 2.5, GREEN);
  g.font = "500 17px Inter, system-ui, sans-serif";
  cases.forEach((c, i) => {
    g.fillStyle = GREEN;
    g.fillText(String(i + 1).padStart(2, "0"), 40, 262 + i * 58);
    g.fillStyle = "rgba(25,23,22,0.8)";
    wrap(g, c.title, 80, 262 + i * 58, w - 120, 22, 2);
  });
};

function handbookSpreads(): Spread[] {
  const lines = (g: CanvasRenderingContext2D, y: number, n: number, w: number) => {
    for (let i = 0; i < n; i++) fillRR(g, 40, y + i * 30, (w - 80) * (0.55 + ((i * 37) % 40) / 100), 9, 4.5, "rgba(34,66,95,0.16)");
  };
  return [
    {
      left: (g, w) => {
        kicker(g, "Handover");
        g.fillStyle = INK;
        g.font = "700 34px Inter, system-ui, sans-serif";
        g.fillText("System handbook", 40, 134);
        fillRR(g, 40, 156, 150, 5, 2.5, GREEN);
        g.font = "600 19px Inter, system-ui, sans-serif";
        ["Overview", "Architecture", "Deployment", "Monitoring", "Access and roles", "Runbook"].forEach((t, i) => {
          g.fillStyle = GREEN;
          g.fillText(String(i + 1).padStart(2, "0"), 40, 226 + i * 56);
          g.fillStyle = INK;
          g.fillText(t, 84, 226 + i * 56);
          fillRR(g, 84, 238 + i * 56, w - 140, 2, 1, "rgba(34,66,95,0.12)");
        });
      },
      right: (g, w) => {
        kicker(g, "Architecture");
        const box = (x: number, y: number, bw: number, label: string, c: string) => {
          fillRR(g, x, y, bw, 64, 12, c);
          g.fillStyle = "#ffffff";
          g.font = "600 17px Inter, system-ui, sans-serif";
          g.fillText(label, x + 16, y + 40);
        };
        g.strokeStyle = "rgba(34,66,95,0.45)";
        g.lineWidth = 3;
        [
          [w / 2, 184, w / 2, 236],
          [w / 2, 300, 130, 360],
          [w / 2, 300, w - 130, 360],
          [130, 424, w / 2, 484],
          [w - 130, 424, w / 2, 484],
        ].forEach(([a, b, c, d]) => {
          g.beginPath();
          g.moveTo(a, b);
          g.lineTo(c, d);
          g.stroke();
        });
        box(w / 2 - 90, 120, 180, "Web and mobile", NAVY);
        box(w / 2 - 70, 236, 140, "API", "#2f6fb5");
        box(40, 360, 180, "Database", "#3e6d97");
        box(w - 220, 360, 180, "AI service", GREEN);
        box(w / 2 - 80, 484, 160, "Cloud", "#9dbbd3");
        lines(g, 590, 2, w);
      },
    },
    {
      left: (g, w) => {
        kicker(g, "Runbook");
        g.fillStyle = INK;
        g.font = "700 30px Inter, system-ui, sans-serif";
        g.fillText("When something", 40, 130);
        g.fillText("needs a person", 40, 166);
        [0, 1, 2, 3].forEach((i) => {
          const y = 230 + i * 100;
          g.beginPath();
          g.arc(58, y, 18, 0, Math.PI * 2);
          g.fillStyle = i < 3 ? GREEN : NAVY;
          g.fill();
          lines(g, y - 6, 2, w);
        });
      },
      right: (g, w, h) => {
        kicker(g, "Monitoring");
        rr(g, 40, 110, w - 80, 260, 14);
        g.strokeStyle = "rgba(34,66,95,0.2)";
        g.lineWidth = 2;
        g.stroke();
        g.strokeStyle = "#2f6fb5";
        g.lineWidth = 4;
        g.beginPath();
        for (let i = 0; i <= 20; i++) {
          const x = 60 + (i / 20) * (w - 120);
          const y = 300 - 60 * Math.sin(i * 0.7) * 0.5 - i * 6;
          if (i) g.lineTo(x, y);
          else g.moveTo(x, y);
        }
        g.stroke();
        [0, 1, 2].forEach((i) => fillRR(g, 40 + i * ((w - 80) / 3), 400, (w - 80) / 3 - 14, 110, 14, i === 0 ? "#eaf6e4" : "#eef3f8"));
        lines(g, h - 120, 2, w);
      },
    },
  ];
}

function aboutSpreads(imgs: (HTMLImageElement | null)[]): Spread[] {
  return principles.map((pr, i) => ({
    left: (g, w) => {
      kicker(g, `Principle ${String(i + 1).padStart(2, "0")}`);
      g.fillStyle = INK;
      g.font = "700 34px Inter, system-ui, sans-serif";
      const y = wrap(g, pr.title, 40, 134, w - 80, 40, 3);
      fillRR(g, 40, y - 14, 150, 5, 2.5, GREEN);
      g.fillStyle = "rgba(25,23,22,0.78)";
      g.font = "500 19px Inter, system-ui, sans-serif";
      wrap(g, pr.text, 40, y + 34, w - 80, 28, 8);
    },
    right: picture(imgs[i % imgs.length], cases[i % cases.length].client, cases[i % cases.length].title),
  }));
}

/** The spreads of a book, and where each leaf turns. */
async function contents(env: ModelEnv, kind: string): Promise<{ spreads: Spread[]; turns: (p: number) => number[] }> {
  const imgs = await Promise.all(cases.map((c) => env.image(`/cases/${c.slug}`)));
  const caseSpreads: Spread[] = cases.map((c, i) => ({ left: caseText(c), right: picture(imgs[i], c.client, c.tags.join(" / ")) }));
  if (kind === "handbook") {
    const spreads = handbookSpreads();
    return { spreads, turns: (p) => [smooth(win(p, 0.52, 0.7))] };
  }
  if (kind === "about") {
    const spreads = aboutSpreads(imgs);
    return { spreads, turns: (p) => spreads.slice(1).map((_, k) => smooth(win(p, 0.52 + k * 0.12, 0.62 + k * 0.12))) };
  }
  // the portfolio: an opening spread (the list of cases, and what we build), then one spread for each case
  const spreads: Spread[] = [{ left: introPage, right: servicesPage }, ...caseSpreads];
  if (kind === "cases") {
    // the work page: INTRO 0.09, then one case each (components/ServicesDeck.tsx): leaf k turns as case k comes in
    const at = (i: number) => 0.09 + (i / cases.length) * 0.91;
    return { spreads, turns: (p) => cases.map((_, k) => smooth(win(p, at(k) - 0.035, at(k) + 0.035))) };
  }
  // one case: the book lies open at the spread before it and turns to it as it arrives
  const idx = Math.max(0, cases.findIndex((c) => c.slug === kind));
  return { spreads, turns: (p) => cases.map((_, k) => (k < idx ? 1 : k === idx ? smooth(win(p, 0.22, 0.46)) : 0)) };
}

export const bookFor =
  (kind: string): ModelBuilder =>
  async (env, mini) => {
    const size = PAGE_PX[mini ? "mini" : "full"];
    const { spreads, turns } = await contents(env, kind);
    const group = new THREE.Group();
    const book = new THREE.Group();
    book.rotation.y = 0.04;
    group.add(book);

    /* ---- covers, spine, page blocks ---- */
    const cloth = new THREE.MeshPhysicalMaterial({ color: 0x22425f, roughness: 0.75, metalness: 0, clearcoat: 0.2, clearcoatRoughness: 0.6, sheen: 0.4, sheenColor: new THREE.Color(0x5f7f9f) });
    [-1, 1].forEach((s) => {
      put(book, rbox(W + 0.28, COVER, H + 0.3, 0.03, 2), cloth, (s * (W + 0.28)) / 2, COVER / 2, 0);
    });
    put(book, new THREE.CylinderGeometry(0.1, 0.1, H + 0.3, 24).rotateX(Math.PI / 2), cloth, 0, COVER / 2, 0);
    const edgeTex = drawn(env, 8, 64, (g, w, h) => {
      g.fillStyle = "#fbfbf8";
      g.fillRect(0, 0, w, h);
      g.fillStyle = "rgba(34,66,95,0.16)";
      for (let y = 2; y < h; y += 4) g.fillRect(0, y, w, 1);
    });
    const edge = new THREE.MeshStandardMaterial({ map: edgeTex, roughness: 0.9 });
    const paper = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
    [-1, 1].forEach((s) => put(book, new THREE.BoxGeometry(W - 0.02, BLOCK, H), [edge, edge, paper, paper, edge, edge], s * (W / 2 + 0.01), COVER + BLOCK / 2, 0));
    // a green ribbon in the gutter
    put(book, rbox(0.12, 0.01, 1.6, 0.004, 1), mat.paint(0x73c94a, 0.5), 0.06, Y0 + 0.05, H / 2 + 0.55);
    group.add(shadow(env, 9.6, 6.4, 0.28, 0, 0));

    /* ---- the pages ---- */
    const n = spreads.length;
    const firstLeft = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.04, H - 0.04), new THREE.MeshStandardMaterial({ map: page(env, size, "right", spreads[0].left), roughness: 0.85, envMapIntensity: 0.5 }));
    firstLeft.rotation.x = -Math.PI / 2;
    firstLeft.position.set(-W / 2, Y0 + 0.003, 0);
    book.add(firstLeft);
    const flip = (t: THREE.Texture) => {
      t.wrapS = THREE.RepeatWrapping;
      t.repeat.x = -1;
      t.offset.x = 1;
      return t;
    };
    const leafMat = (map: THREE.Texture, side: THREE.Side) => new THREE.MeshStandardMaterial({ map, roughness: 0.85, metalness: 0, envMapIntensity: 0.5, side });
    // leaf k: the right page of spread k on its front, the left page of spread k+1 on its back
    const leaves = spreads.map((s, k) => {
      const geo = new THREE.PlaneGeometry(W, H, COLS, 1);
      const front = new THREE.Mesh(geo, leafMat(page(env, size, "left", s.right), THREE.FrontSide));
      const backPen = k + 1 < n ? spreads[k + 1].left : () => {};
      const back = new THREE.Mesh(geo, leafMat(flip(page(env, size, "right", backPen)), THREE.BackSide));
      front.frustumCulled = back.frustumCulled = false;
      book.add(front, back);
      return geo;
    });

    const lay = (k: number, t: number) => {
      const yR = Y0 + 0.01 + (n - k) * STEP;
      const yL = Y0 + 0.01 + (k + 1) * STEP;
      const lag = 0.9 * Math.sin(Math.PI * t);
      const pos = leaves[k].attributes.position as THREE.BufferAttribute;
      const du = W / COLS;
      let px = 0;
      let py = lerp(yR, yL, smooth(t));
      for (let i = 0; i <= COLS; i++) {
        if (i) {
          const phi = Math.PI * t - lag * Math.pow(i / COLS, 1.4);
          px += Math.cos(phi) * du;
          py += Math.sin(phi) * du;
        }
        pos.setXYZ(i, px, py, -H / 2);
        pos.setXYZ(COLS + 1 + i, px, py, H / 2);
      }
      pos.needsUpdate = true;
      leaves[k].computeVertexNormals();
    };

    const last: number[] = spreads.map(() => -1);
    const model: Model = {
      group,
      tags: [],
      camera: { az: [-0.16, 0.16], elev: [0.82, 0.74] },
      floorY: 0,
      set(_a, _l, p) {
        const t = turns(p);
        for (let k = 0; k < n; k++) {
          const v = clamp01(t[k] ?? 0);
          if (v !== last[k]) {
            last[k] = v;
            lay(k, v);
          }
        }
      },
      frame: () => ({ cx: 0, cy: 0.4, hw: 3.8, hh: 2.6 }),
    };
    model.set(1, 1, 0);
    return model;
  };

export default bookFor("cases");
