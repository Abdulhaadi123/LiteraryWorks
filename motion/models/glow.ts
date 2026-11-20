import * as THREE from "three";
import { blobTexture, canvasTexture, roundedShape } from "../kit";
import { drawn, fillRR, plane, rr, slab } from "./parts";
import type { ModelEnv } from "./types";

/**
 * The parts of the scenes ("a light studio"): pale glass tiles with a thin coloured edge and a line icon, soft
 * coloured halos and shadows, chrome, thin outlines, and the service icons. Everything is drawn or modelled in code.
 */

/** The brand's colours for lines and accents on the light ground (sky is the mid blue the thin lines are drawn in). */
export const GLOW = {
  sky: 0x3e6d97,
  blue: 0x2f6fb5,
  deep: 0x162b40,
  navy: 0x22425f,
  green: 0x73c94a,
  white: 0xffffff,
} as const;

const cache = new WeakMap<ModelEnv, Map<string, THREE.Texture>>();
/** A soft round light of one colour ("r,g,b"), made once for a scene. */
export function glowTex(env: ModelEnv, rgb: string): THREE.Texture {
  let m = cache.get(env);
  if (!m) {
    m = new Map();
    cache.set(env, m);
  }
  let t = m.get(rgb);
  if (!t) {
    t = blobTexture(rgb, 0.9);
    env.textures.push(t);
    m.set(rgb, t);
  }
  return t;
}

/** A soft coloured halo (or, in navy, a soft shadow), `size` wide, that always faces the viewer. */
export function lightSprite(env: ModelEnv, rgb: string, size: number, opacity: number): THREE.Sprite {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(env, rgb), transparent: true, depthWrite: false, opacity, toneMapped: false }));
  s.scale.setScalar(size);
  return s;
}

/** A thin lit outline of a rounded rectangle, in the panel's own plane. */
export function outline(w: number, h: number, r: number, color: number, opacity = 0.9, z = 0): THREE.LineLoop {
  const pts = roundedShape(w, h, r)
    .getPoints(8)
    .map((p) => new THREE.Vector3(p.x, p.y, z));
  return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity, toneMapped: false, depthWrite: false }));
}

/** A thin lit circle in the XZ plane. */
export function circleLine(radius: number, color: number, opacity = 0.4, segments = 160): THREE.LineLoop {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity, toneMapped: false, depthWrite: false }));
}

/** Polished pale glass: nearly white, a hard clear coat, soft reflections of the studio. (The first argument is kept so a call reads like the others; the glass is always pale.) */
export const paleGlass = (_color?: number, rough = 0.2): THREE.MeshPhysicalMaterial =>
  new THREE.MeshPhysicalMaterial({ color: 0xf6f9fc, metalness: 0, roughness: rough, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1 });

/** Polished metal that takes the studio's reflections. */
export const chrome = (color = 0xdbe6f2, rough = 0.2): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial({ color, metalness: 1, roughness: rough, envMapIntensity: 1.2 });

/** A flat colour that does not take the studio's light (a thin line of colour, a lit rim). */
export const lit = (color: number, opacity = 1): THREE.MeshBasicMaterial => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false });

/** A soft shadow on the floor under something: `w` by `d` wide (it is left out of the mirror). */
export function floorShadow(env: ModelEnv, w: number, d: number, opacity = 0.22, x = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex(env, "34,66,95"), transparent: true, opacity, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2;
  m.scale.set(w, d, 1);
  m.position.set(x, 0.012, z);
  m.renderOrder = -1;
  m.layers.set(1);
  return m;
}

const dots = new WeakMap<ModelEnv, THREE.Texture>();
/** A small hard-edged round dot (a soft one is lost on a light ground). */
export function crispDot(env: ModelEnv): THREE.Texture {
  let t = dots.get(env);
  if (!t) {
    t = canvasTexture(
      64,
      64,
      (g, w, h) => {
        g.beginPath();
        g.arc(w / 2, h / 2, w * 0.42, 0, Math.PI * 2);
        g.fillStyle = "#fff";
        g.fill();
      },
      1,
    );
    env.textures.push(t);
    dots.set(env, t);
  }
  return t;
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
  // construction technology: a building and a crane
  tower(g) {
    rr(g, -112, -4, 92, 128, 10);
    stroke(g);
    [0, 1, 2].forEach((r) =>
      [0, 1].forEach((c) => {
        rr(g, -96 + c * 40, 14 + r * 36, 22, 20, 5);
        fill(g, "rgba(34,66,95,0.32)");
      }),
    );
    g.beginPath();
    g.moveTo(58, 126);
    g.lineTo(58, -122);
    g.moveTo(-34, -112);
    g.lineTo(132, -112);
    g.moveTo(58, -112);
    g.lineTo(-18, -78);
    stroke(g, LINE, 12);
    g.beginPath();
    g.moveTo(106, -112);
    g.lineTo(106, -58);
    stroke(g, ACC, 10);
    rr(g, 92, -58, 28, 24, 6);
    fill(g, ACC);
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

/** The picture on a tile's face: pale glass with a soft colour in one corner, a hairline frame and the icon. */
export function tileFace(env: ModelEnv, icon: string, size = 512): THREE.CanvasTexture {
  return drawn(env, size, size, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#ffffff");
    bg.addColorStop(1, "#e3ecf6");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    const glow = g.createRadialGradient(w * 0.28, h * 0.22, 0, w * 0.28, h * 0.22, w * 0.85);
    glow.addColorStop(0, "rgba(111,178,255,0.2)");
    glow.addColorStop(1, "rgba(111,178,255,0)");
    g.fillStyle = glow;
    g.fillRect(0, 0, w, h);
    rr(g, 24, 24, w - 48, h - 48, 58);
    g.strokeStyle = "rgba(34,66,95,0.14)";
    g.lineWidth = 3;
    g.stroke();
    g.save();
    g.translate(w / 2, h / 2);
    g.scale((size / 512) * 1.12, (size / 512) * 1.12);
    ICONS[icon]?.(g);
    g.restore();
  });
}

/** The back of a tile: the same glass, a quiet pattern. */
export function tileBack(env: ModelEnv, size = 256): THREE.CanvasTexture {
  return drawn(env, size, size, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#f3f7fb");
    bg.addColorStop(1, "#dbe6f1");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    rr(g, 14, 14, w - 28, h - 28, 30);
    g.strokeStyle = "rgba(34,66,95,0.14)";
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = "rgba(34,66,95,0.1)";
    for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) g.fillRect(52 + x * 36, 52 + y * 36, 6, 6);
  });
}

export interface Tile {
  group: THREE.Group;
  /** Where a tag points: the top edge of the face. */
  top: THREE.Object3D;
  /** The lit edge (its brightness is set from the scene). */
  edge: THREE.LineLoop[];
  /** The light behind it. */
  light: THREE.Sprite;
  size: number;
}

/** A square tile of pale glass, its face toward +z: a slab, the picture, a thin edge on both faces and a soft shadow behind. */
export function makeTile(env: ModelEnv, icon: string, size: number, accent: number, rgb: string): Tile {
  const group = new THREE.Group();
  const depth = 0.1;
  const body = slab(size, size, depth, size * 0.19, paleGlass(undefined, 0.2));
  group.add(body);
  const front = plane(tileFace(env, icon), size - 0.07, size - 0.07, size * 0.16);
  front.position.z = depth / 2 + 0.004;
  group.add(front);
  const back = plane(tileBack(env), size - 0.07, size - 0.07, size * 0.16);
  back.rotation.y = Math.PI;
  back.position.z = -depth / 2 - 0.004;
  group.add(back);
  const e1 = outline(size - 0.02, size - 0.02, size * 0.17, accent, 0.95, depth / 2 + 0.008);
  const e2 = outline(size - 0.02, size - 0.02, size * 0.17, accent, 0.7, -depth / 2 - 0.008);
  group.add(e1, e2);
  void rgb;
  const light = lightSprite(env, "34,66,95", size * 2.1, 0.2);
  light.position.set(size * 0.05, -size * 0.12, -0.2);
  group.add(light);
  const top = new THREE.Object3D();
  top.position.set(0, size / 2, 0.06);
  group.add(top);
  return { group, top, edge: [e1, e2], light, size };
}

export interface Screen {
  group: THREE.Group;
  /** Where a tag points: the middle of the top edge. */
  top: THREE.Object3D;
  /** The lit edge on both faces. */
  edge: THREE.LineLoop[];
  /** The light behind it. */
  light: THREE.Sprite;
  /** The picture on its face. */
  front: THREE.Mesh;
  w: number;
  h: number;
}

/**
 * A rectangle of pale glass with a picture on its face (and a quiet back), a thin edge on both faces and a soft
 * shadow behind it: a screen, a card, a wall panel. Its face is toward +z.
 */
export function makeScreen(env: ModelEnv, tex: THREE.Texture, w: number, h: number, o: { accent?: number; rgb?: string; depth?: number; radius?: number; glow?: number; back?: THREE.Texture | null } = {}): Screen {
  const group = new THREE.Group();
  const depth = o.depth ?? 0.09;
  const radius = o.radius ?? Math.min(w, h) * 0.07;
  const accent = o.accent ?? GLOW.sky;
  group.add(slab(w, h, depth, radius, paleGlass(undefined, 0.2)));
  const front = plane(tex, w - 0.07, h - 0.07, radius * 0.85);
  front.position.z = depth / 2 + 0.004;
  group.add(front);
  const backTex = o.back === undefined ? tileBack(env) : o.back;
  if (backTex) {
    const back = plane(backTex, w - 0.07, h - 0.07, radius * 0.85);
    back.rotation.y = Math.PI;
    back.position.z = -depth / 2 - 0.004;
    group.add(back);
  }
  const e1 = outline(w - 0.02, h - 0.02, radius, accent, 0.9, depth / 2 + 0.008);
  const e2 = outline(w - 0.02, h - 0.02, radius, accent, 0.6, -depth / 2 - 0.008);
  group.add(e1, e2);
  const light = lightSprite(env, "34,66,95", 1, (o.glow ?? 0.26) * 0.8);
  light.scale.set(w * 1.55, h * 1.55, 1);
  light.position.set(w * 0.03, -h * 0.09, -0.25);
  group.add(light);
  const top = new THREE.Object3D();
  top.position.set(0, h / 2, 0.06);
  group.add(top);
  return { group, top, edge: [e1, e2], light, front, w, h };
}

/* ---- shared shaders and metal parts (the AI core, the glass orbs, the light columns, the turning rings) ---- */

export const NUCLEUS_V = /* glsl */ `
varying vec3 vN; varying vec3 vP; varying vec3 vV;
void main() {
  vP = position;
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;
export const NUCLEUS_F = /* glsl */ `
uniform float uT; uniform float uGlow;
varying vec3 vN; varying vec3 vP; varying vec3 vV;
float h3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fbm(vec3 p) { float a = 0.5; float s = 0.0; for (int i = 0; i < 4; i++) { s += a * n3(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
void main() {
  vec3 p = normalize(vP) * 1.7;
  vec3 q = vec3(fbm(p + vec3(uT * 0.30, 0.0, 0.0)), fbm(p + vec3(5.2, 1.3, 2.8) - vec3(0.0, uT * 0.22, 0.0)), fbm(p + vec3(1.7, 9.2, 3.1) + vec3(0.0, 0.0, uT * 0.18)));
  float n = fbm(p + 1.9 * q);
  float r = 1.0 - abs(2.0 * fbm(p * 1.6 + q * 1.4 + uT * 0.12) - 1.0);
  float vein = pow(clamp(r, 0.0, 1.0), 6.0);
  vec3 deep = vec3(0.03, 0.12, 0.28);
  vec3 mid = vec3(0.10, 0.40, 0.84);
  vec3 hi = vec3(0.50, 0.88, 1.0);
  vec3 gr = vec3(0.52, 0.90, 0.33);
  vec3 col = mix(deep, mid, smoothstep(0.28, 0.78, n));
  col += vein * mix(hi, gr, smoothstep(0.35, 0.75, n)) * (0.55 + 1.0 * uGlow);
  float fr = pow(1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), 2.2);
  col += fr * vec3(0.5, 0.88, 1.0) * (0.45 + 0.9 * uGlow);
  col *= 0.8 + 0.5 * uGlow;
  gl_FragColor = vec4(col, 1.0);
}`;

export const COLUMN_V = /* glsl */ `
varying vec3 vN; varying vec3 vV; varying vec2 vUv;
void main() {
  vUv = uv;
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;
export const COLUMN_F = /* glsl */ `
uniform float uOpacity; uniform vec3 uColor; varying vec3 vN; varying vec3 vV; varying vec2 vUv;
void main() {
  float f = pow(abs(dot(normalize(vN), normalize(vV))), 1.4);
  float a = f * pow(1.0 - vUv.y, 1.2) * uOpacity;
  gl_FragColor = vec4(uColor, a);
}`;

/** A thin metal band (a rounded rectangle turned about the Y axis). */
export function bandGeometry(R: number, w: number, h: number): THREE.LatheGeometry {
  const c = Math.min(w, h) * 0.3;
  const a = R - w / 2;
  const b = R + w / 2;
  const y0 = -h / 2;
  const y1 = h / 2;
  const pts = [
    [a + c, y0],
    [b - c, y0],
    [b, y0 + c],
    [b, y1 - c],
    [b - c, y1],
    [a + c, y1],
    [a, y1 - c],
    [a, y0 + c],
    [a + c, y0],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, 160);
}

/** Fine marks round the outer face of a band, every fifth one longer and lit green. */
export function tickMarks(R: number, w: number, h: number, count: number): THREE.InstancedMesh {
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, h * 0.5, 0.03), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), count);
  const d = new THREE.Object3D();
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * (Math.PI * 2);
    const long = i % 5 === 0;
    d.position.set(Math.cos(a) * (R + w / 2 + 0.004), 0, Math.sin(a) * (R + w / 2 + 0.004));
    d.rotation.set(0, -a, 0);
    d.scale.set(1, long ? 1.55 : 0.8, 1);
    d.updateMatrix();
    m.setMatrixAt(i, d.matrix);
    m.setColorAt(i, c.set(long ? GLOW.green : GLOW.sky));
  }
  return m;
}


/** The living blue nucleus: a flowing plasma with lit veins. Set `uT` (the flow) and `uGlow` (0..1) from the scene. */
export function plasmaMaterial(): { mat: THREE.ShaderMaterial; u: { uT: { value: number }; uGlow: { value: number } } } {
  const u = { uT: { value: 0 }, uGlow: { value: 0.4 } };
  return { mat: new THREE.ShaderMaterial({ uniforms: u, vertexShader: NUCLEUS_V, fragmentShader: NUCLEUS_F }), u };
}

/** A column of light (a cone seen as a soft glow that is strongest at its foot). `uOpacity` and `uColor` are set from the scene. */
export function lightColumn(color: number, rTop: number, rBottom: number, height: number): { mesh: THREE.Mesh; mat: THREE.ShaderMaterial } {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 0.3 }, uColor: { value: new THREE.Color(color) } },
    vertexShader: COLUMN_V,
    fragmentShader: COLUMN_F,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, height, 48, 1, true), mat);
  return { mesh, mat };
}

/** The white gloss of a stage or a base: glazed, soft reflections. */
export const stageMetal = (): THREE.MeshStandardMaterial => new THREE.MeshPhysicalMaterial({ color: 0xf4f7fa, metalness: 0, roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.18, envMapIntensity: 0.95 });
