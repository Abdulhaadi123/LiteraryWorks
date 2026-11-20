import * as THREE from "three";
import { canvasTexture } from "./kit";

/**
 * The interfaces drawn on the faces of the panels. They are illustrations, not screenshots: bold shapes, skeleton
 * lines in place of words (so nothing on them is a claim, and nothing depends on a font), drawn once on a canvas
 * at 2x and used as a texture. Each is laid out on a 400 x 250 board.
 */

export type UiKind = "apps" | "assistant" | "voice" | "flows" | "data" | "cloud" | "saas" | "phone" | "wireframe" | "blueprint" | "browser" | "servers" | "report";

const C = {
  ink: "#0e1b2d",
  line: "#e3eaf4",
  rule: "#c9d4e5",
  soft: "#eef3fb",
  blue: "#2563c4",
  bright: "#3b82f6",
  sky: "#93c5fd",
  pale: "#dbe8ff",
  green: "#22c55e",
  greenSoft: "#dcfce7",
  amber: "#f59e0b",
  amberSoft: "#fef3c7",
  white: "#ffffff",
};

type G = CanvasRenderingContext2D;

function rr(g: G, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  if (typeof g.roundRect === "function") g.roundRect(x, y, w, h, r);
  else {
    r = Math.min(r, w / 2, h / 2);
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
}
const fill = (g: G, c: string | CanvasGradient) => {
  g.fillStyle = c;
  g.fill();
};
function skel(g: G, x: number, y: number, w: number, h = 6, c = C.rule) {
  rr(g, x, y, w, h, h / 2);
  fill(g, c);
}
function dot(g: G, x: number, y: number, r: number, c: string | CanvasGradient) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  fill(g, c);
}
function grad(g: G, x0: number, y0: number, x1: number, y1: number, a: string, b: string) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, a);
  gr.addColorStop(1, b);
  return gr;
}
/** A white tile with a hairline border and a whisper of shadow. */
function tile(g: G, x: number, y: number, w: number, h: number, r: number, border = C.line) {
  g.save();
  g.shadowColor = "rgba(30,64,120,0.10)";
  g.shadowBlur = 8;
  g.shadowOffsetY = 2;
  rr(g, x, y, w, h, r);
  fill(g, C.white);
  g.restore();
  rr(g, x + 0.5, y + 0.5, w - 1, h - 1, r);
  g.strokeStyle = border;
  g.lineWidth = 1;
  g.stroke();
}
function sparkle(g: G, x: number, y: number, s: number, c: string) {
  g.beginPath();
  g.moveTo(x, y - s);
  g.quadraticCurveTo(x, y, x + s, y);
  g.quadraticCurveTo(x, y, x, y + s);
  g.quadraticCurveTo(x, y, x - s, y);
  g.quadraticCurveTo(x, y, x, y - s);
  fill(g, c);
}

/* ---- the six boards ---- */

function apps(g: G) {
  // window chrome
  [0, 1, 2].forEach((i) => dot(g, 24 + i * 12, 18, 3.5, i === 0 ? C.bright : "#d3dcea"));
  rr(g, 130, 9, 140, 18, 9);
  fill(g, C.soft);
  // sidebar
  rr(g, 14, 40, 50, 196, 14);
  fill(g, "#f1f5fc");
  for (let i = 0; i < 5; i++) {
    rr(g, 28, 56 + i * 36, 22, 22, 7);
    fill(g, i === 0 ? C.blue : C.pale);
  }
  // banner
  rr(g, 76, 40, 310, 82, 16);
  fill(g, grad(g, 76, 40, 386, 122, "#1d4fd8", "#60a5fa"));
  skel(g, 94, 58, 120, 10, "rgba(255,255,255,0.95)");
  skel(g, 94, 76, 168, 6, "rgba(255,255,255,0.55)");
  skel(g, 94, 87, 140, 6, "rgba(255,255,255,0.4)");
  rr(g, 94, 100, 64, 16, 8);
  fill(g, C.white);
  [24, 40, 30, 52, 38].forEach((hh, i) => {
    rr(g, 296 + i * 15, 112 - hh, 9, hh, 4.5);
    fill(g, "rgba(255,255,255,0.5)");
  });
  // three tiles
  const cols = [C.blue, C.sky, C.green];
  for (let i = 0; i < 3; i++) {
    const x = 76 + i * 107;
    tile(g, x, 134, 96, 102, 14);
    dot(g, x + 22, 158, 10, cols[i]);
    skel(g, x + 12, 180, 60, 8, "#cfd9e8");
    skel(g, x + 12, 194, 44, 6);
    rr(g, x + 12, 214, 72, 6, 3);
    fill(g, C.pale);
    rr(g, x + 12, 214, 26 + i * 14, 6, 3);
    fill(g, cols[i]);
  }
}

function assistant(g: G) {
  dot(g, 30, 28, 12, grad(g, 18, 16, 42, 40, "#1d4fd8", "#60a5fa"));
  sparkle(g, 30, 28, 6, C.white);
  skel(g, 50, 21, 84, 8, "#c4d0e2");
  dot(g, 146, 25, 4, C.green);
  skel(g, 154, 22, 34, 6, "#d3dcea");
  // the person's message
  rr(g, 150, 52, 234, 44, 16);
  fill(g, C.soft);
  skel(g, 166, 65, 186, 8, C.rule);
  skel(g, 166, 80, 118, 8, C.rule);
  // the answer
  rr(g, 16, 106, 290, 70, 16);
  fill(g, grad(g, 16, 106, 306, 176, "#1d4fd8", "#3b82f6"));
  skel(g, 32, 121, 236, 8, "rgba(255,255,255,0.95)");
  skel(g, 32, 136, 206, 8, "rgba(255,255,255,0.7)");
  skel(g, 32, 151, 152, 8, "rgba(255,255,255,0.5)");
  // suggested replies
  [74, 62, 86].reduce((x, w) => {
    rr(g, x, 186, w, 18, 9);
    fill(g, C.white);
    rr(g, x + 0.5, 186.5, w - 1, 17, 8.5);
    g.strokeStyle = C.pale;
    g.lineWidth = 1.2;
    g.stroke();
    skel(g, x + 10, 192, w - 20, 6, "#bcd0f2");
    return x + w + 8;
  }, 16);
  // the message box
  tile(g, 16, 212, 368, 26, 13);
  skel(g, 32, 222, 120, 6, "#dbe3ef");
  dot(g, 364, 225, 10, C.blue);
  g.beginPath();
  g.moveTo(360, 220);
  g.lineTo(371, 225);
  g.lineTo(360, 230);
  g.closePath();
  fill(g, C.white);
}

function voice(g: G) {
  rr(g, 16, 14, 84, 22, 11);
  fill(g, C.pale);
  dot(g, 30, 25, 4.5, C.green);
  skel(g, 40, 22, 48, 6, "#9db7e8");
  skel(g, 340, 22, 44, 6, "#d3dcea");
  // the sound
  const n = 40;
  const cy = 106;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const bell = Math.exp(-Math.pow((t - 0.5) / 0.3, 2));
    const e = (0.45 + 0.55 * Math.abs(Math.sin(i * 0.62))) * (0.5 + 0.5 * Math.abs(Math.sin(i * 0.21 + 0.8)));
    const hh = 8 + 84 * bell * e;
    const x = 22 + i * 9.2;
    rr(g, x, cy - hh / 2, 5, hh, 2.5);
    fill(g, grad(g, 0, cy - hh / 2, 0, cy + hh / 2, "#7db4ff", "#1d4fd8"));
  }
  // controls
  dot(g, 142, 208, 15, C.soft);
  skel(g, 134, 205.5, 16, 5, "#b6c3d8");
  dot(g, 258, 208, 15, C.soft);
  rr(g, 251, 200, 14, 16, 4);
  g.strokeStyle = "#b6c3d8";
  g.lineWidth = 2;
  g.stroke();
  dot(g, 200, 208, 24, grad(g, 176, 184, 224, 232, "#1d4fd8", "#60a5fa"));
  rr(g, 195, 195, 10, 18, 5);
  fill(g, C.white);
  g.beginPath();
  g.arc(200, 208, 9, 0.15 * Math.PI, 0.85 * Math.PI);
  g.strokeStyle = C.white;
  g.lineWidth = 2.2;
  g.lineCap = "round";
  g.stroke();
  g.beginPath();
  g.moveTo(200, 217);
  g.lineTo(200, 222);
  g.stroke();
}

function flows(g: G) {
  // dotted board
  for (let y = 12; y < 250; y += 16) for (let x = 12; x < 400; x += 16) dot(g, x, y, 1.1, "#dfe7f3");
  const link = (x0: number, y0: number, x1: number, y1: number) => {
    g.beginPath();
    g.moveTo(x0, y0);
    g.bezierCurveTo(x0 + (x1 - x0) * 0.55, y0, x0 + (x1 - x0) * 0.45, y1, x1, y1);
    g.strokeStyle = C.bright;
    g.lineWidth = 2.6;
    g.lineCap = "round";
    g.stroke();
    dot(g, (x0 + x1) / 2, (y0 + y1) / 2, 3.6, C.white);
    g.beginPath();
    g.arc((x0 + x1) / 2, (y0 + y1) / 2, 3.6, 0, Math.PI * 2);
    g.strokeStyle = C.bright;
    g.lineWidth = 1.6;
    g.stroke();
  };
  link(104, 122, 134, 122);
  link(160, 96, 214, 62);
  link(160, 148, 214, 182);
  link(334, 62, 366, 106);
  link(334, 182, 366, 138);
  const node = (x: number, y: number, w: number, h: number, c: string) => {
    tile(g, x, y, w, h, 12);
    rr(g, x + 1, y + 10, 4, h - 20, 2);
    fill(g, c);
    dot(g, x + 24, y + h / 2, 10, c);
    skel(g, x + 42, y + h / 2 - 9, w - 56, 7, "#cfd9e8");
    skel(g, x + 42, y + h / 2 + 3, w - 72, 6);
  };
  node(14, 100, 90, 44, C.blue);
  node(214, 40, 120, 44, C.bright);
  node(214, 160, 120, 44, "#0ea5e9");
  // the decision
  g.save();
  g.translate(160, 122);
  g.rotate(Math.PI / 4);
  g.shadowColor = "rgba(30,64,120,0.12)";
  g.shadowBlur = 8;
  rr(g, -22, -22, 44, 44, 9);
  fill(g, C.pale);
  g.restore();
  skel(g, 150, 119, 20, 6, "#8fb0ea");
  // the outcome
  dot(g, 366, 122, 17, C.green);
  g.beginPath();
  g.moveTo(358, 122);
  g.lineTo(364, 128);
  g.lineTo(375, 115);
  g.strokeStyle = C.white;
  g.lineWidth = 3.2;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.stroke();
}

function data(g: G) {
  const chips = [C.blue, "#0e1b2d", C.green, C.bright];
  chips.forEach((c, i) => {
    const x = 16 + i * 54;
    tile(g, x, 14, 44, 44, 13);
    if (i === 0) dot(g, x + 22, 36, 10, c);
    if (i === 1) {
      rr(g, x + 12, 26, 20, 20, 5);
      fill(g, c);
    }
    if (i === 2) {
      dot(g, x + 22, 36, 11, c);
      dot(g, x + 22, 36, 5, C.white);
    }
    if (i === 3) {
      g.beginPath();
      g.moveTo(x + 22, 25);
      g.lineTo(x + 33, 45);
      g.lineTo(x + 11, 45);
      g.closePath();
      fill(g, c);
    }
  });
  rr(g, 244, 24, 140, 24, 12);
  fill(g, C.greenSoft);
  dot(g, 260, 36, 4.5, C.green);
  skel(g, 272, 33, 70, 6, "#86d6a2");
  // the table
  tile(g, 16, 72, 368, 166, 14);
  g.save();
  rr(g, 16, 72, 368, 26, 14);
  g.clip();
  g.fillStyle = "#f1f5fc";
  g.fillRect(16, 72, 368, 26);
  g.restore();
  skel(g, 34, 82, 50, 6, "#aebcd1");
  skel(g, 150, 82, 60, 6, "#aebcd1");
  skel(g, 300, 82, 40, 6, "#aebcd1");
  const tones = [
    [C.greenSoft, C.green],
    [C.pale, C.bright],
    [C.amberSoft, C.amber],
    [C.greenSoft, C.green],
  ];
  const avatars = ["#60a5fa", "#a5b4fc", "#7dd3fc", "#93c5fd"];
  tones.forEach(([bg, fg], i) => {
    const y = 98 + i * 34;
    if (i) {
      g.fillStyle = "#edf2f9";
      g.fillRect(28, y, 344, 1);
    }
    dot(g, 40, y + 17, 9, avatars[i]);
    skel(g, 58, y + 9, 72 - i * 6, 7, "#cfd9e8");
    skel(g, 58, y + 21, 46, 5);
    skel(g, 150, y + 13, 70 + (i % 2) * 20, 7, "#d6dfec");
    rr(g, 296, y + 9, 62, 17, 8.5);
    fill(g, bg);
    dot(g, 308, y + 17.5, 3.6, fg);
    skel(g, 316, y + 15, 30, 5, fg + "66");
  });
}

function cloud(g: G) {
  // the shield
  g.save();
  g.translate(74, 112);
  g.beginPath();
  g.moveTo(0, -78);
  g.bezierCurveTo(22, -62, 46, -58, 58, -56);
  g.bezierCurveTo(58, 8, 44, 52, 0, 78);
  g.bezierCurveTo(-44, 52, -58, 8, -58, -56);
  g.bezierCurveTo(-46, -58, -22, -62, 0, -78);
  g.closePath();
  g.shadowColor = "rgba(29,79,216,0.35)";
  g.shadowBlur = 16;
  g.shadowOffsetY = 6;
  fill(g, grad(g, -58, -78, 58, 78, "#60a5fa", "#1d4fd8"));
  g.restore();
  g.beginPath();
  g.moveTo(52, 112);
  g.lineTo(68, 128);
  g.lineTo(98, 90);
  g.strokeStyle = C.white;
  g.lineWidth = 8;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.stroke();
  skel(g, 26, 206, 96, 7, "#cfd9e8");
  skel(g, 40, 220, 68, 6);
  // three checks
  for (let i = 0; i < 3; i++) {
    const y = 18 + i * 40;
    tile(g, 152, y, 232, 32, 11);
    dot(g, 170, y + 16, 5.5, C.green);
    skel(g, 184, y + 12.5, 96 - i * 8, 7, "#cfd9e8");
    rr(g, 330, y + 8, 40, 16, 8);
    fill(g, C.greenSoft);
    skel(g, 341, y + 13.5, 18, 5, "#86d6a2");
  }
  // the line that stays flat
  tile(g, 152, 142, 232, 96, 12);
  const pts = [0.62, 0.5, 0.58, 0.44, 0.52, 0.4, 0.5, 0.38, 0.46, 0.36, 0.44];
  g.beginPath();
  pts.forEach((v, i) => {
    const x = 166 + (i / (pts.length - 1)) * 204;
    const y = 160 + v * 64;
    if (i) g.lineTo(x, y);
    else g.moveTo(x, y);
  });
  g.strokeStyle = C.bright;
  g.lineWidth = 3;
  g.lineJoin = "round";
  g.stroke();
  g.lineTo(370, 224);
  g.lineTo(166, 224);
  g.closePath();
  fill(g, grad(g, 0, 160, 0, 224, "rgba(59,130,246,0.28)", "rgba(59,130,246,0)"));
}


function saas(g: G) {
  // plan switch
  rr(g, 138, 12, 124, 22, 11);
  fill(g, C.soft);
  rr(g, 141, 15, 58, 16, 8);
  fill(g, C.white);
  skel(g, 152, 21, 34, 5, "#9db7e8");
  skel(g, 214, 21, 36, 5, "#c4d0e2");
  // three plans
  const plans = [
    { x: 16, hi: false },
    { x: 140, hi: true },
    { x: 264, hi: false },
  ];
  plans.forEach(({ x, hi }) => {
    if (hi) {
      g.save();
      g.shadowColor = "rgba(29,78,216,0.35)";
      g.shadowBlur = 14;
      g.shadowOffsetY = 6;
      rr(g, x, 46, 120, 130, 16);
      fill(g, grad(g, x, 46, x + 120, 176, "#3b82f6", "#1d4ed8"));
      g.restore();
    } else tile(g, x, 52, 120, 124, 16);
    const fg = hi ? "rgba(255,255,255,0.95)" : "#cfd9e8";
    const fg2 = hi ? "rgba(255,255,255,0.55)" : C.rule;
    skel(g, x + 14, 66, 44, 7, fg);
    skel(g, x + 14, 84, 70, 12, fg);
    [112, 126, 140].forEach((yy, k) => {
      dot(g, x + 20, yy + 3, 4, hi ? "rgba(255,255,255,0.9)" : C.green);
      skel(g, x + 30, yy, 62 - k * 8, 6, fg2);
    });
    rr(g, x + 14, 152, 92, 16, 8);
    fill(g, hi ? C.white : C.pale);
  });
  // revenue
  tile(g, 16, 190, 368, 48, 14);
  const pts = [0.8, 0.7, 0.74, 0.55, 0.6, 0.42, 0.46, 0.3, 0.34, 0.2];
  g.beginPath();
  pts.forEach((v, i) => {
    const x = 32 + (i / (pts.length - 1)) * 336;
    const y = 198 + v * 32;
    if (i) g.lineTo(x, y);
    else g.moveTo(x, y);
  });
  g.strokeStyle = C.bright;
  g.lineWidth = 3;
  g.lineJoin = "round";
  g.stroke();
}

function phone(g: G) {
  const notif = (x: number, y: number, w: number, c: string) => {
    tile(g, x, y, w, 40, 13);
    dot(g, x + 20, y + 20, 10, c);
    skel(g, x + 38, y + 11, w - 56, 7, "#cfd9e8");
    skel(g, x + 38, y + 24, w - 76, 5);
  };
  notif(14, 34, 118, C.green);
  notif(14, 152, 118, C.bright);
  // the phone
  g.save();
  g.shadowColor = "rgba(30,64,140,0.28)";
  g.shadowBlur = 16;
  g.shadowOffsetY = 6;
  rr(g, 150, 8, 100, 234, 20);
  fill(g, "#0e1b2d");
  g.restore();
  rr(g, 155, 13, 90, 224, 16);
  fill(g, C.white);
  rr(g, 183, 17, 34, 7, 3.5);
  fill(g, "#0e1b2d");
  rr(g, 161, 32, 78, 46, 10);
  fill(g, grad(g, 161, 32, 239, 78, "#1d4fd8", "#60a5fa"));
  skel(g, 169, 42, 46, 7, "rgba(255,255,255,0.95)");
  skel(g, 169, 56, 34, 5, "rgba(255,255,255,0.6)");
  for (let i = 0; i < 4; i++) {
    const y = 88 + i * 34;
    dot(g, 172, y + 12, 8, [C.sky, C.pale, C.sky, C.pale][i]);
    skel(g, 186, y + 5, 46, 7, "#cfd9e8");
    skel(g, 186, y + 17, 32, 5);
  }
  rr(g, 175, 226, 50, 4, 2);
  fill(g, "#cfd9e8");
  // a small chart on the right
  tile(g, 268, 34, 118, 76, 13);
  [26, 40, 30, 52, 44].forEach((hh, i) => {
    rr(g, 282 + i * 19, 98 - hh, 11, hh, 4);
    fill(g, i === 3 ? C.blue : C.pale);
  });
  tile(g, 268, 124, 118, 68, 13);
  skel(g, 282, 138, 60, 8, "#cfd9e8");
  skel(g, 282, 154, 86, 6);
  rr(g, 282, 170, 90, 8, 4);
  fill(g, C.pale);
  rr(g, 282, 170, 58, 8, 4);
  fill(g, C.bright);
}

function wireframe(g: G) {
  // before: a grey sketch
  const gx = "#d5dde9";
  rr(g, 14, 14, 180, 222, 14);
  fill(g, "#f6f8fb");
  g.setLineDash([5, 4]);
  g.strokeStyle = "#b9c5d6";
  g.lineWidth = 1.4;
  g.stroke();
  g.setLineDash([]);
  skel(g, 28, 28, 70, 8, gx);
  [0, 1, 2].forEach((i) => skel(g, 108 + i * 28, 30, 20, 5, gx));
  rr(g, 28, 52, 152, 66, 8);
  g.strokeStyle = "#b9c5d6";
  g.stroke();
  g.beginPath();
  g.moveTo(28, 52);
  g.lineTo(180, 118);
  g.moveTo(180, 52);
  g.lineTo(28, 118);
  g.strokeStyle = "#cdd7e5";
  g.stroke();
  [0, 1].forEach((i) => {
    rr(g, 28 + i * 80, 134, 72, 44, 6);
    g.strokeStyle = "#b9c5d6";
    g.stroke();
  });
  skel(g, 28, 192, 120, 6, gx);
  skel(g, 28, 206, 90, 6, gx);
  // after: the finished screen
  tile(g, 206, 14, 180, 222, 14);
  skel(g, 220, 28, 58, 8, "#cfd9e8");
  [0, 1, 2].forEach((i) => skel(g, 296 + i * 28, 30, 20, 5, "#9db7e8"));
  rr(g, 220, 52, 152, 66, 12);
  fill(g, grad(g, 220, 52, 372, 118, "#1d4fd8", "#60a5fa"));
  skel(g, 234, 66, 70, 9, "rgba(255,255,255,0.95)");
  skel(g, 234, 82, 100, 6, "rgba(255,255,255,0.6)");
  rr(g, 234, 96, 46, 14, 7);
  fill(g, C.white);
  [0, 1].forEach((i) => {
    tile(g, 220 + i * 80, 134, 72, 44, 10);
    dot(g, 236 + i * 80, 150, 7, i ? C.green : C.blue);
    skel(g, 220 + 28 + i * 80, 144, 36, 6, "#cfd9e8");
    skel(g, 220 + 14 + i * 80, 164, 46, 5);
  });
  skel(g, 220, 192, 120, 7, "#cfd9e8");
  skel(g, 220, 206, 90, 6);
  // the slider between them
  g.fillStyle = C.blue;
  g.fillRect(199, 14, 2, 222);
  dot(g, 200, 125, 11, C.blue);
  dot(g, 200, 125, 4.5, C.white);
}

function blueprint(g: G) {
  g.fillStyle = grad(g, 0, 0, 400, 250, "#0e3a9a", "#1d4fd8");
  g.fillRect(0, 0, 400, 250);
  g.strokeStyle = "rgba(255,255,255,0.1)";
  g.lineWidth = 1;
  for (let x = 0; x <= 400; x += 20) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, 250);
    g.stroke();
  }
  for (let y = 0; y <= 250; y += 20) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(400, y);
    g.stroke();
  }
  g.strokeStyle = "rgba(255,255,255,0.92)";
  g.lineWidth = 2;
  g.lineJoin = "round";
  // the building
  g.strokeRect(70, 70, 150, 150);
  g.strokeRect(220, 112, 84, 108);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) g.strokeRect(84 + c * 34, 84 + r * 34, 22, 22);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) g.strokeRect(234 + c * 34, 128 + r * 44, 22, 28);
  // a crane
  g.beginPath();
  g.moveTo(340, 220);
  g.lineTo(340, 36);
  g.lineTo(240, 36);
  g.moveTo(340, 36);
  g.lineTo(376, 36);
  g.moveTo(262, 36);
  g.lineTo(262, 64);
  g.stroke();
  g.strokeRect(254, 64, 16, 12);
  for (let k = 0; k < 8; k++) {
    g.beginPath();
    g.moveTo(334, 50 + k * 22);
    g.lineTo(346, 72 + k * 22);
    g.stroke();
  }
  // the measurements
  g.setLineDash([4, 4]);
  g.strokeStyle = "rgba(255,255,255,0.65)";
  g.lineWidth = 1.4;
  g.beginPath();
  g.moveTo(70, 238);
  g.lineTo(220, 238);
  g.moveTo(50, 70);
  g.lineTo(50, 220);
  g.stroke();
  g.setLineDash([]);
  skel(g, 108, 232, 74, 6, "rgba(255,255,255,0.7)");
  skel(g, 18, 14, 90, 8, "rgba(255,255,255,0.85)");
  skel(g, 18, 30, 60, 6, "rgba(255,255,255,0.5)");
}

function browser(g: G) {
  [0, 1, 2].forEach((i) => dot(g, 22 + i * 12, 16, 3.5, i === 0 ? C.bright : "#d3dcea"));
  rr(g, 90, 8, 220, 18, 9);
  fill(g, C.soft);
  skel(g, 104, 15, 80, 5, "#c4d0e2");
  // the page
  tile(g, 14, 36, 244, 200, 14);
  [0, 1, 2].forEach((i) => {
    tile(g, 26 + i * 76, 48, 68, 44, 10);
    skel(g, 36 + i * 76, 58, 28, 6, "#cfd9e8");
    skel(g, 36 + i * 76, 72, 40, 9, [C.blue, C.bright, C.green][i]);
  });
  const pts = [0.8, 0.62, 0.68, 0.46, 0.52, 0.34, 0.4, 0.2];
  g.beginPath();
  pts.forEach((v, i) => {
    const x = 30 + (i / (pts.length - 1)) * 212;
    const y = 112 + v * 100;
    if (i) g.lineTo(x, y);
    else g.moveTo(x, y);
  });
  g.strokeStyle = C.bright;
  g.lineWidth = 3;
  g.lineJoin = "round";
  g.stroke();
  g.lineTo(242, 214);
  g.lineTo(30, 214);
  g.closePath();
  fill(g, grad(g, 0, 112, 0, 214, "rgba(59,130,246,0.25)", "rgba(59,130,246,0)"));
  // the assistant panel
  rr(g, 268, 36, 118, 200, 14);
  fill(g, grad(g, 268, 36, 386, 236, "#1d4fd8", "#3b82f6"));
  sparkle(g, 288, 56, 7, C.white);
  skel(g, 302, 52, 50, 7, "rgba(255,255,255,0.9)");
  rr(g, 280, 76, 94, 38, 10);
  fill(g, "rgba(255,255,255,0.95)");
  skel(g, 290, 86, 70, 6, "#bcd0f2");
  skel(g, 290, 98, 48, 6, "#bcd0f2");
  rr(g, 280, 122, 94, 52, 10);
  fill(g, "rgba(255,255,255,0.22)");
  skel(g, 290, 132, 74, 6, "rgba(255,255,255,0.85)");
  skel(g, 290, 144, 60, 6, "rgba(255,255,255,0.6)");
  skel(g, 290, 156, 40, 6, "rgba(255,255,255,0.45)");
  rr(g, 280, 204, 94, 22, 11);
  fill(g, "rgba(255,255,255,0.95)");
  dot(g, 362, 215, 7, C.blue);
}

function servers(g: G) {
  // the pipeline
  const names = [C.green, C.green, C.green, C.bright];
  names.forEach((c, i) => {
    const x = 36 + i * 108;
    if (i) {
      g.beginPath();
      g.moveTo(x - 82, 46);
      g.lineTo(x - 22, 46);
      g.strokeStyle = i === 3 ? C.bright : "#9bd8b3";
      g.lineWidth = 3;
      g.lineCap = "round";
      g.stroke();
    }
    tile(g, x - 22, 22, 44, 48, 14);
    dot(g, x, 46, 12, c);
    g.beginPath();
    if (i < 3) {
      g.moveTo(x - 5, 46);
      g.lineTo(x - 1, 50);
      g.lineTo(x + 6, 41);
      g.strokeStyle = C.white;
      g.lineWidth = 2.6;
      g.lineJoin = "round";
      g.stroke();
    } else {
      g.arc(x, 46, 5, 0, Math.PI * 1.5);
      g.strokeStyle = C.white;
      g.lineWidth = 2.4;
      g.stroke();
    }
    skel(g, x - 16, 78, 32, 5, "#cfd9e8");
  });
  // the racks
  for (let i = 0; i < 3; i++) {
    const y = 102 + i * 44;
    tile(g, 16, y, 230, 36, 12);
    [0, 1, 2].forEach((k) => dot(g, 34 + k * 14, y + 18, 4.2, k === 2 && i === 1 ? C.amber : C.green));
    skel(g, 82, y + 10, 100, 6, "#cfd9e8");
    skel(g, 82, y + 22, 64, 5);
    rr(g, 196, y + 11, 38, 14, 7);
    fill(g, C.greenSoft);
  }
  // the line that stays flat
  tile(g, 260, 102, 124, 128, 14);
  const pts = [0.5, 0.42, 0.48, 0.4, 0.46, 0.38, 0.44, 0.4];
  g.beginPath();
  pts.forEach((v, i) => {
    const x = 272 + (i / (pts.length - 1)) * 100;
    const y = 118 + v * 70;
    if (i) g.lineTo(x, y);
    else g.moveTo(x, y);
  });
  g.strokeStyle = C.bright;
  g.lineWidth = 3;
  g.lineJoin = "round";
  g.stroke();
  g.lineTo(372, 196);
  g.lineTo(272, 196);
  g.closePath();
  fill(g, grad(g, 0, 118, 0, 196, "rgba(59,130,246,0.28)", "rgba(59,130,246,0)"));
  skel(g, 272, 206, 70, 6, "#cfd9e8");
}

function report(g: G) {
  // the checklist
  tile(g, 14, 14, 196, 222, 16);
  skel(g, 30, 30, 90, 8, "#c4d0e2");
  [C.green, C.green, C.blue, "#cfd9e8", "#cfd9e8"].forEach((c, i) => {
    const y = 56 + i * 34;
    dot(g, 38, y + 9, 9, c);
    if (i < 3) {
      g.beginPath();
      g.moveTo(33.5, y + 9);
      g.lineTo(37, y + 12.5);
      g.lineTo(43, y + 5.5);
      g.strokeStyle = C.white;
      g.lineWidth = 2.2;
      g.lineCap = "round";
      g.lineJoin = "round";
      g.stroke();
    }
    skel(g, 56, y + 2, 120 - i * 10, 7, "#cfd9e8");
    skel(g, 56, y + 14, 84 - i * 8, 5);
  });
  // the split
  tile(g, 222, 14, 164, 108, 16);
  const cx = 276;
  const cy = 70;
  (
    [
      [0, 0.46, C.blue],
      [0.46, 0.78, C.sky],
      [0.78, 1, C.pale],
    ] as [number, number, string][]
  ).forEach(([a, b, c]) => {
    g.beginPath();
    g.arc(cx, cy, 32, a * Math.PI * 2 - Math.PI / 2, b * Math.PI * 2 - Math.PI / 2);
    g.strokeStyle = c;
    g.lineWidth = 14;
    g.lineCap = "butt";
    g.stroke();
  });
  skel(g, 322, 44, 50, 7, "#cfd9e8");
  skel(g, 322, 60, 38, 5);
  skel(g, 322, 82, 50, 7, "#cfd9e8");
  skel(g, 322, 98, 30, 5);
  // the ranking
  tile(g, 222, 134, 164, 102, 16);
  [0.92, 0.74, 0.52, 0.34].forEach((v, i) => {
    const y = 148 + i * 22;
    rr(g, 236, y, 136, 12, 6);
    fill(g, C.soft);
    rr(g, 236, y, 136 * v, 12, 6);
    fill(g, grad(g, 236, 0, 372, 0, "#3b82f6", "#1d4ed8"));
  });
}

const draw: Record<UiKind, (g: G) => void> = { apps, assistant, voice, flows, data, cloud, saas, phone, wireframe, blueprint, browser, servers, report };

export function uiTexture(kind: UiKind, maxAniso: number): THREE.CanvasTexture {
  return canvasTexture(
    800,
    500,
    (g, w, h) => {
      g.save();
      g.scale(w / 400, h / 250);
      g.fillStyle = grad(g, 0, 0, 0, 250, "#ffffff", "#f1f6fd");
      g.fillRect(0, 0, 400, 250);
      draw[kind](g);
      // a fine edge, so the white panel holds its outline against a white page
      rr(g, 1.2, 1.2, 397.6, 247.6, 31);
      g.strokeStyle = "#c7d6ec";
      g.lineWidth = 2.4;
      g.stroke();
      g.restore();
    },
    maxAniso,
  );
}
