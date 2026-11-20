import * as THREE from "three";
import { clamp01, lerp, quint, smooth, TAU, win } from "../engine";
import { floorShadow, GLOW, glowTex, lightSprite, outline, paleGlass, stageMetal, tileFace } from "./glow";
import { drawn, fillRR, plane, rr } from "./parts";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * The AI audit: a business's tools laid out as a map on a glass table. A scanner gantry sweeps across it; each tool it
 * passes lights up green (it works) or amber (work is lost there), broken links show up as dashed amber lines, and the
 * three places that matter most rise from the table as ranked columns: the plan.
 */

const PW = 8.2;
const PD = 4.6;
const TOP = 0.4;

interface Spec {
  icon: string;
  x: number;
  z: number;
  /** A place where work is lost. */
  flag?: boolean;
}
const NODES: Spec[] = [
  { icon: "mail", x: -3.35, z: -1.3 },
  { icon: "chat", x: -2.2, z: 0.15, flag: true },
  { icon: "doc", x: -1.35, z: -1.35 },
  { icon: "receipt", x: -0.45, z: 0.95, flag: true },
  { icon: "cal", x: 0.25, z: -0.35 },
  { icon: "grid", x: -3.1, z: 1.45 },
  { icon: "browser", x: 0.95, z: 1.35, flag: true },
  { icon: "cloud", x: 1.15, z: -1.45 },
  { icon: "phone", x: -1.55, z: 1.5 },
];
const LINKS: [number, number, boolean][] = [
  [0, 2, false],
  [2, 4, false],
  [4, 7, false],
  [1, 2, false],
  [1, 5, true],
  [3, 4, false],
  [3, 8, true],
  [5, 8, false],
  [6, 4, false],
  [6, 7, true],
];
/** The flagged places, in the order the plan ranks them, and how tall their column is. */
const RANK = [
  { node: 1, h: 2.6, z: -1.2 },
  { node: 3, h: 1.8, z: 0 },
  { node: 6, h: 1.1, z: 1.2 },
];
const PAD_X = 2.65;

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();
  group.add(floorShadow(env, 11.5, 8, 0.18));

  /* ---- the table: a base, a slab of glass, a map on it ---- */
  const base = new THREE.Mesh(new THREE.BoxGeometry(PW + 0.5, 0.22, PD + 0.4), stageMetal());
  base.position.y = 0.11;
  const rim = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(PW + 0.5, 0.22, PD + 0.4)), new THREE.LineBasicMaterial({ color: GLOW.green, transparent: true, opacity: 0.9, toneMapped: false }));
  rim.position.y = 0.11;
  const slabMesh = new THREE.Mesh(new THREE.BoxGeometry(PW, 0.16, PD), paleGlass(undefined, 0.15));
  slabMesh.position.y = TOP - 0.1;
  const mapTex = drawn(env, 1640, 920, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#ffffff");
    bg.addColorStop(1, "#e7eff7");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    for (let x = 0; x <= w; x += 41) {
      g.fillStyle = x % 164 === 0 ? "rgba(34,66,95,0.12)" : "rgba(34,66,95,0.05)";
      g.fillRect(x, 0, 1.5, h);
    }
    for (let y = 0; y <= h; y += 41) {
      g.fillStyle = y % 164 === 0 ? "rgba(34,66,95,0.12)" : "rgba(34,66,95,0.05)";
      g.fillRect(0, y, w, 1.5);
    }
    // four areas of a business, as pale zones with a quiet title
    const zones: [number, number, number, number, string][] = [
      [40, 40, 520, 380, "rgba(47,111,181,0.17)"],
      [600, 40, 440, 380, "rgba(115,201,74,0.2)"],
      [40, 460, 520, 420, "rgba(240,182,74,0.2)"],
      [600, 460, 440, 420, "rgba(34,66,95,0.12)"],
    ];
    zones.forEach(([x, y, zw, zh, c]) => {
      fillRR(g, x, y, zw, zh, 28, c);
      rr(g, x, y, zw, zh, 28);
      g.strokeStyle = "rgba(34,66,95,0.18)";
      g.lineWidth = 2;
      g.stroke();
      fillRR(g, x + 28, y + 26, 150, 14, 7, "rgba(34,66,95,0.3)");
      fillRR(g, x + 28, y + 50, 96, 10, 5, "rgba(34,66,95,0.16)");
    });
    // the pad where the plan stands, with three marked places
    g.setLineDash([16, 12]);
    g.strokeStyle = "rgba(93,181,54,0.7)";
    g.lineWidth = 4;
    rr(g, 1110, 40, 490, 840, 34);
    g.stroke();
    g.setLineDash([]);
    fillRR(g, 1110, 40, 490, 840, 34, "rgba(115,201,74,0.07)");
    [215, 460, 705].forEach((y, i) => {
      g.beginPath();
      g.arc(1355, y, 74, 0, TAU);
      g.strokeStyle = `rgba(93,181,54,${0.55 - i * 0.12})`;
      g.lineWidth = 4;
      g.stroke();
    });
    rr(g, 2, 2, w - 4, h - 4, 24);
    g.strokeStyle = "rgba(34,66,95,0.2)";
    g.lineWidth = 4;
    g.stroke();
  });
  const mapPlane = plane(mapTex, PW - 0.1, PD - 0.1, 0.05);
  mapPlane.rotation.x = -Math.PI / 2;
  mapPlane.position.y = TOP - 0.018;
  group.add(base, rim, slabMesh, mapPlane);
  const toX = (px: number) => px; // (the map's x is the model's x)
  void toX;

  /* ---- the tools: a block with its icon on top, a ring round its foot, a flag if work is lost there ---- */
  const flagTex = drawn(env, 128, 128, (g, w, h) => {
    g.beginPath();
    g.arc(w / 2, h / 2, 54, 0, TAU);
    g.fillStyle = "#f0b64a";
    g.fill();
    g.strokeStyle = "#ffffff";
    g.lineWidth = 6;
    g.stroke();
    g.fillStyle = "#ffffff";
    g.fillRect(w / 2 - 6, 32, 12, 40);
    g.beginPath();
    g.arc(w / 2, 90, 8, 0, TAU);
    g.fill();
  });
  const shadowTex = glowTex(env, "34,66,95");
  const nodes = NODES.map((n) => {
    const g = new THREE.Group();
    // a small foot, and a card of glass with the tool's sign standing on it (its frame turns green or amber once it is scanned)
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.22, 0.66), paleGlass(undefined, 0.2));
    foot.position.y = 0.11;
    const footEdges = new THREE.LineSegments(new THREE.EdgesGeometry(foot.geometry), new THREE.LineBasicMaterial({ color: GLOW.sky, transparent: true, opacity: 0.8, toneMapped: false }));
    footEdges.position.y = 0.11;
    const card = new THREE.Group();
    card.add(new THREE.Mesh(new THREE.BoxGeometry(1.08, 1.08, 0.08), paleGlass(undefined, 0.15)));
    const face = plane(tileFace(env, n.icon, 256), 0.96, 0.96, 0.12);
    face.position.z = 0.046;
    const frame = outline(1.08, 1.08, 0.14, GLOW.sky, 1, 0.048);
    card.add(face, frame);
    card.position.y = 0.22 + 0.54 + 0.02;
    const shade = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.5), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.24, depthWrite: false, toneMapped: false }));
    shade.rotation.x = -Math.PI / 2;
    shade.position.y = 0.01;
    shade.renderOrder = -1;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.03, 8, 64), new THREE.MeshBasicMaterial({ color: 0x9fb2c6, transparent: true, opacity: 0.95, toneMapped: false }));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.02;
    const flag = new THREE.Sprite(new THREE.SpriteMaterial({ map: flagTex, transparent: true, depthWrite: false, toneMapped: false }));
    flag.scale.setScalar(0.46);
    flag.position.y = 1.75;
    flag.visible = false;
    g.add(shade, foot, footEdges, card, ring, flag);
    g.position.set(n.x, TOP, n.z);
    group.add(g);
    return { g, ring, flag, frame, spec: n };
  });

  // the links between them: whole lines in navy, broken ones dashed in amber
  const links = LINKS.map(([i, j, broken]) => {
    const a = NODES[i];
    const b = NODES[j];
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a.x, TOP + 0.01, a.z), new THREE.Vector3(b.x, TOP + 0.01, b.z)]);
    const mat = broken ? new THREE.LineDashedMaterial({ color: 0xe0a02a, dashSize: 0.14, gapSize: 0.1, transparent: true, opacity: 0.0, toneMapped: false }) : new THREE.LineBasicMaterial({ color: GLOW.sky, transparent: true, opacity: 0.55, toneMapped: false });
    const l = new THREE.Line(geo, mat);
    if (broken) l.computeLineDistances();
    group.add(l);
    return { l, broken, x: (a.x + b.x) / 2 };
  });

  /* ---- the scanner: a gantry over the table, a curtain of light under it ---- */
  const gantry = new THREE.Group();
  const legMat = stageMetal();
  [-1, 1].forEach((s) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 2.6, 0.16), legMat);
    leg.position.set(0, TOP + 1.3, s * (PD / 2 + 0.1));
    gantry.add(leg);
  });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, PD + 0.5), legMat);
  bar.position.set(0, TOP + 2.6, 0);
  gantry.add(bar);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, PD + 0.3), new THREE.MeshBasicMaterial({ color: 0x73c94a, toneMapped: false }));
  strip.position.set(0, TOP + 2.46, 0);
  gantry.add(strip);
  const curtain = new THREE.Mesh(
    new THREE.PlaneGeometry(PD, 2.5),
    new THREE.ShaderMaterial({
      uniforms: { uOpacity: { value: 0.5 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: `uniform float uOpacity; varying vec2 vUv; void main(){ float a = pow(1.0 - vUv.y, 1.6) * uOpacity; gl_FragColor = vec4(0.45, 0.80, 0.30, a); }`,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  curtain.rotation.y = Math.PI / 2;
  curtain.position.set(0, TOP + 1.2, 0);
  gantry.add(curtain);
  const line = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.02, PD), new THREE.MeshBasicMaterial({ color: 0x5db536, toneMapped: false }));
  line.position.set(0, TOP + 0.02, 0);
  gantry.add(line);
  group.add(gantry);
  const gantryTag = new THREE.Object3D();
  gantryTag.position.set(0, TOP + 2.85, 0);
  gantry.add(gantryTag);

  /* ---- the plan: three columns, tallest first, each with its number ---- */
  const numTex = (n: number) =>
    drawn(env, 192, 192, (g, w, h) => {
      g.fillStyle = "#ffffff";
      g.fillRect(0, 0, w, h);
      g.fillStyle = n === 1 ? "#5db536" : "#22425f";
      g.font = "700 130px Inter, system-ui, sans-serif";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(String(n), w / 2, h / 2 + 6);
    });
  const cols = RANK.map((r, i) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1, 1.1), new THREE.MeshPhysicalMaterial({ color: i === 0 ? 0x73c94a : i === 1 ? 0x4f8fd9 : 0x8fa4ba, metalness: 0, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15, envMapIntensity: 1 }));
    body.position.y = 0.5;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.1, 1, 1.1)), new THREE.LineBasicMaterial({ color: i === 0 ? GLOW.green : GLOW.sky, transparent: true, opacity: 0.95, toneMapped: false }));
    edges.position.y = 0.5;
    const fill = new THREE.Mesh(new THREE.BoxGeometry(0.94, 1, 0.94), new THREE.MeshBasicMaterial({ color: i === 0 ? 0x73c94a : i === 1 ? 0x4f8fd9 : 0x7d93ab, transparent: true, opacity: 0.8, toneMapped: false }));
    fill.position.y = 0.5;
    const num = plane(numTex(i + 1), 0.82, 0.82, 0.12);
    num.rotation.x = -Math.PI / 2;
    g.add(body, edges, num);
    g.position.set(PAD_X, TOP, r.z);
    group.add(g);
    const top = new THREE.Object3D();
    g.add(top);
    return { g, body, edges, fill, num, top, spec: r };
  });
  // a thread from each flagged place to its column
  const threads = RANK.map((r, i) => {
    const a = NODES[r.node];
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(a.x, TOP + 0.5, a.z), new THREE.Vector3((a.x + PAD_X) / 2, TOP + 2.4 + i * 0.2, (a.z + r.z) / 2), new THREE.Vector3(PAD_X, TOP + r.h, r.z));
    const geo = new THREE.TubeGeometry(curve, 48, 0.014, 5, false);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: i === 0 ? 0x5db536 : 0x4f8fd9, transparent: true, opacity: 0.75, toneMapped: false }));
    group.add(m);
    return { m, total: (geo.index?.count ?? 0) };
  });
  const glow = lightSprite(env, "115,201,74", 4.2, 0.12);
  glow.position.set(PAD_X, TOP + 1.2, 0);
  group.add(glow);
  void glowTex;

  const frame: Frame = { cx: 0, cy: 2, hw: 5, hh: 2.6 };
  const model: Model = {
    group,
    tags: [nodes[5].g, gantryTag, cols[0].top],
    camera: { az: [-0.34, -0.04], elev: [0.62, 0.5] },
    floorY: 0,
    set(a, l, p) {
      const scanX = lerp(-4.3, PAD_X - 1.3, smooth(win(p, 0.1, 0.52)));
      gantry.position.x = scanX;
      curtain.visible = gantryTag.visible = true;
      (curtain.material as THREE.ShaderMaterial).uniforms.uOpacity.value = 0.55 * (0.4 + 0.6 * win(p, 0.04, 0.14)) * (1 - 0.7 * win(p, 0.52, 0.62));

      nodes.forEach((n, i) => {
        const drop = quint(clamp01(a * 2.2 - i * 0.1));
        n.g.position.y = TOP + (1 - drop) * 0.9;
        n.g.position.x = n.spec.x;
        const seen = smooth(clamp01((scanX - n.spec.x) / 0.5 + 0.5));
        const mat = n.ring.material as THREE.MeshBasicMaterial;
        const status = new THREE.Color(n.spec.flag ? 0xe0a02a : 0x5db536);
        mat.color.setHex(0x9fb2c6).lerp(status, seen);
        (n.frame.material as THREE.LineBasicMaterial).color.setHex(0x3e6d97).lerp(status, seen);
        n.ring.scale.setScalar(1 + 0.1 * Math.sin(p * 40 + i) * seen);
        n.flag.visible = !!n.spec.flag && seen > 0.6;
        n.flag.position.y = 1.75 + 0.06 * Math.sin(p * 30 + i * 2);
      });
      links.forEach((k) => {
        if (k.broken) {
          const seen = smooth(clamp01((scanX - k.x) / 0.5 + 0.5));
          (k.l.material as THREE.LineDashedMaterial).opacity = 0.95 * seen;
          (k.l.material as THREE.LineDashedMaterial).dashSize = 0.14;
        }
      });

      // the plan rises, tallest first
      cols.forEach((c, i) => {
        const e = quint(win(p, 0.54 + i * 0.07, 0.78 + i * 0.05));
        const h = Math.max(0.001, c.spec.h * e);
        c.body.scale.y = h;
        c.body.position.y = h / 2;
        c.edges.scale.y = h;
        c.edges.position.y = h / 2;
        c.fill.scale.y = h;
        c.fill.position.y = h / 2;
        c.num.position.y = h + 0.012;
        c.num.visible = e > 0.05;
        c.top.position.y = h + 0.1;
        c.g.visible = e > 0.002;
      });
      threads.forEach((t, i) => {
        const e = quint(win(p, 0.5 + i * 0.07, 0.72 + i * 0.05));
        t.m.geometry.setDrawRange(0, Math.floor((t.total * e) / 3) * 3);
        t.m.visible = e > 0.01;
      });
      (glow.material as THREE.SpriteMaterial).opacity = 0.04 + 0.12 * quint(win(p, 0.56, 0.9)) * (0.6 + 0.4 * l);
      group.updateMatrixWorld(true);
    },
    frame: () => frame,
  };
  model.set(1, 1, 0.5);
  return model;
};

export default build;
