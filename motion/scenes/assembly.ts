import * as THREE from "three";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";
import { C, createStage, lerp, shadowFloor, win } from "../engine";
import type { SceneAnchor, SceneCtx, SceneHandle, SceneLayout } from "../types";

/**
 * "The precision assembly": one system, built as a precision instrument, opened layer by layer and closed again.
 *
 * The idea comes from the watch story in the brief: the finished object separates into clean, parallel layers
 * along one axis, nothing flies away, the climax is the fully opened view, and then every part retraces its own
 * path so the last frame is the first frame. Here each layer is one of the things we build:
 *
 *   crystal   the app people use (web and mobile)         bezel   the design around it (UI/UX)
 *   core      AI and voice, with a ring that listens       gears   workflow automation, meshing
 *   data      records, bridges, databases                  case    integrations (crown and pushers = connectors)
 *   base      cloud and security
 *
 * Everything is a pure function of the scroll progress p: the opening is a function of q = min(p, 1 - p), so the
 * second half is the first half played backwards, exactly. Gears turn a whole number of teeth over the scene,
 * so they also end where they began. Nothing is loaded: every part is built here, in code.
 */

const TAU = Math.PI * 2;
/** Quintic smoothstep: zero speed and zero acceleration at both ends, the "critically damped" feel of the brief. */
const quint = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/* ------------------------------------------------------------------ geometry helpers */

const crease = (g: THREE.BufferGeometry, angle = 0.55) => toCreasedNormals(g, angle);

/** Lays an extrusion (made in the XY plane, depth along +Z) flat: depth goes up +Y, from 0, and the shape's angle a is the world angle in (x, z). */
function flat(g: THREE.BufferGeometry) {
  g.rotateX(Math.PI / 2);
  g.computeBoundingBox();
  g.translate(0, -(g.boundingBox as THREE.Box3).min.y, 0);
  return g;
}

/** An extruded plate with softly rounded edges. The outline is inset by `bevel` so the finished size is the one asked for. */
function plate(shape: THREE.Shape, h: number, bevel: number, seg = 96) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.002, h - 2 * bevel),
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: seg,
  });
  return crease(flat(g));
}

function disc(r: number, h: number, bevel = 0.05) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r - bevel, 0, TAU, false);
  return plate(s, h, bevel, 48);
}

function ring(rOut: number, rIn: number, h: number, bevel = 0.05) {
  const s = new THREE.Shape();
  s.absarc(0, 0, rOut - bevel, 0, TAU, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, rIn + bevel, 0, TAU, true);
  s.holes.push(hole);
  return plate(s, h, bevel, 48);
}

/** A curved bridge: part of a ring between two angles. */
function arcBand(rIn: number, rOut: number, a0: number, a1: number, h: number, bevel = 0.03) {
  const s = new THREE.Shape();
  s.moveTo(Math.cos(a0) * rOut, Math.sin(a0) * rOut);
  s.absarc(0, 0, rOut - bevel, a0, a1, false);
  s.lineTo(Math.cos(a1) * (rIn + bevel), Math.sin(a1) * (rIn + bevel));
  s.absarc(0, 0, rIn + bevel, a1, a0, true);
  s.closePath();
  return plate(s, h, bevel, 48);
}

const MOD = 0.12; // gear module: pitch diameter = teeth x MOD

/** A skeleton gear: teeth, a bore and window cut-outs between spokes. */
function gearGeo(teeth: number, windows: number) {
  const pr = (teeth * MOD) / 2;
  const rOut = pr + MOD;
  const rRoot = pr - 1.25 * MOD;
  const step = TAU / teeth;
  const pts: THREE.Vector2[] = [];
  const at = (r: number, a: number) => new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r);
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    pts.push(at(rRoot, a - step * 0.5), at(rRoot, a - step * 0.27), at(rOut, a - step * 0.13), at(rOut, a + step * 0.13), at(rRoot, a + step * 0.27));
  }
  const s = new THREE.Shape(pts);
  const bore = new THREE.Path();
  bore.absarc(0, 0, Math.max(0.1, pr * 0.14), 0, TAU, true);
  s.holes.push(bore);
  if (windows > 0 && pr > 0.8) {
    const r0 = pr * 0.4;
    const r1 = rRoot - Math.max(0.12, pr * 0.1);
    const gap = 0.2;
    for (let k = 0; k < windows; k++) {
      const a0 = (k * TAU) / windows + gap / 2;
      const a1 = ((k + 1) * TAU) / windows - gap / 2;
      const w = new THREE.Path();
      const n = 10;
      for (let i = 0; i <= n; i++) {
        const a = a0 + ((a1 - a0) * i) / n;
        const p = at(r1, a);
        if (i === 0) w.moveTo(p.x, p.y);
        else w.lineTo(p.x, p.y);
      }
      for (let i = n; i >= 0; i--) {
        const a = a0 + ((a1 - a0) * i) / n;
        const p = at(r0, a);
        w.lineTo(p.x, p.y);
      }
      s.holes.push(w);
    }
  }
  return plate(s, 0.22, 0.02, 24);
}

/** A shield with a keyhole: the security mark on the base. */
function shieldGeo() {
  const s = new THREE.Shape();
  s.moveTo(0, 0.95);
  s.bezierCurveTo(0.35, 0.78, 0.62, 0.72, 0.8, 0.72);
  s.lineTo(0.8, 0.1);
  s.bezierCurveTo(0.8, -0.45, 0.4, -0.78, 0, -0.95);
  s.bezierCurveTo(-0.4, -0.78, -0.8, -0.45, -0.8, 0.1);
  s.lineTo(-0.8, 0.72);
  s.bezierCurveTo(-0.62, 0.72, -0.35, 0.78, 0, 0.95);
  const k = new THREE.Path();
  const cy = 0.18;
  const r = 0.2;
  for (let i = 0; i <= 28; i++) {
    const a = THREE.MathUtils.degToRad(-62) + ((THREE.MathUtils.degToRad(242) - THREE.MathUtils.degToRad(-62)) * i) / 28;
    const x = Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) k.moveTo(x, y);
    else k.lineTo(x, y);
  }
  k.lineTo(-0.1, -0.42);
  k.lineTo(0.1, -0.42);
  k.closePath();
  s.holes.push(k);
  return plate(s, 0.1, 0.02, 24);
}

/* ------------------------------------------------------------------ drawn textures (the screen, a card, engraving) */

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/** The app on the crystal: a small operations dashboard, drawn with the site's own typeface. No figures: it shows the idea, not results. */
function drawDashboard(c: CanvasRenderingContext2D, font: string) {
  c.clearRect(0, 0, 1024, 1024);
  // a pale frosted ground across the whole circle, so what is under the glass reads as depth, not clutter
  const g = c.createRadialGradient(512, 512, 40, 512, 512, 520);
  g.addColorStop(0, "rgba(248,251,255,0.96)");
  g.addColorStop(1, "rgba(226,236,248,0.9)");
  c.fillStyle = g;
  c.fillRect(0, 0, 1024, 1024);
  // window
  c.save();
  c.shadowColor = "rgba(14,27,45,0.22)";
  c.shadowBlur = 44;
  c.shadowOffsetY = 16;
  roundRect(c, 150, 150, 724, 724, 44);
  c.fillStyle = "#ffffff";
  c.fill();
  c.restore();
  roundRect(c, 150, 150, 724, 724, 44);
  c.strokeStyle = "rgba(14,27,45,0.08)";
  c.lineWidth = 2;
  c.stroke();
  // title bar
  [["#22425f", 196], ["#9fc2ea", 226], ["#dbe8f5", 256]].forEach(([col, x]) => {
    c.fillStyle = col as string;
    c.beginPath();
    c.arc(x as number, 196, 9, 0, TAU);
    c.fill();
  });
  roundRect(c, 600, 174, 230, 44, 22);
  c.fillStyle = "#eef3f9";
  c.fill();
  c.fillStyle = "#9aa9bd";
  c.beginPath();
  c.arc(630, 196, 9, 0, TAU);
  c.fill();
  c.fillRect(648, 192, 96, 8);
  c.fillStyle = "#e3e9f1";
  c.fillRect(150, 240, 724, 2);
  // sidebar
  for (let i = 0; i < 6; i++) {
    roundRect(c, 182, 284 + i * 66, 44, 44, 12);
    c.fillStyle = i === 0 ? "#2563c4" : "#e4ebf4";
    c.fill();
  }
  // heading
  c.fillStyle = "#0e1b2d";
  c.font = `700 40px ${font}`;
  c.textBaseline = "alphabetic";
  c.fillText("Operations", 270, 304);
  c.fillStyle = "#6b7b91";
  c.font = `500 24px ${font}`;
  c.fillText("Workflows running across your tools", 270, 340);
  // three tiles
  const tiles: [string, number, string][] = [["Inbox", 0.72, "#2563c4"], ["Approvals", 0.5, "#22425f"], ["Reports", 0.86, "#9fc2ea"]];
  tiles.forEach(([label, v, col], i) => {
    const x = 270 + i * 192;
    roundRect(c, x, 372, 172, 116, 20);
    c.fillStyle = "#f4f7fb";
    c.fill();
    c.fillStyle = "#46566d";
    c.font = `600 22px ${font}`;
    c.fillText(label, x + 20, 414);
    roundRect(c, x + 20, 448, 132, 12, 6);
    c.fillStyle = "#dfe7f1";
    c.fill();
    roundRect(c, x + 20, 448, 132 * v, 12, 6);
    c.fillStyle = col;
    c.fill();
  });
  // chart
  roundRect(c, 270, 512, 568, 214, 22);
  c.fillStyle = "#f4f7fb";
  c.fill();
  c.strokeStyle = "#dbe4ef";
  c.setLineDash([4, 8]);
  c.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    c.moveTo(296, 552 + i * 44);
    c.lineTo(814, 552 + i * 44);
    c.stroke();
  }
  c.setLineDash([]);
  const ys = [0.7, 0.55, 0.62, 0.4, 0.48, 0.28, 0.36, 0.18];
  const pt = (i: number) => [300 + (i * 506) / (ys.length - 1), 560 + ys[i] * 150] as const;
  const area = c.createLinearGradient(0, 560, 0, 720);
  area.addColorStop(0, "rgba(37,99,196,0.3)");
  area.addColorStop(1, "rgba(37,99,196,0)");
  c.beginPath();
  c.moveTo(pt(0)[0], 712);
  ys.forEach((_, i) => c.lineTo(pt(i)[0], pt(i)[1]));
  c.lineTo(pt(ys.length - 1)[0], 712);
  c.closePath();
  c.fillStyle = area;
  c.fill();
  c.beginPath();
  ys.forEach((_, i) => (i ? c.lineTo(pt(i)[0], pt(i)[1]) : c.moveTo(pt(i)[0], pt(i)[1])));
  c.strokeStyle = "#2563c4";
  c.lineWidth = 6;
  c.lineJoin = "round";
  c.stroke();
  ys.forEach((_, i) => {
    c.beginPath();
    c.arc(pt(i)[0], pt(i)[1], i === ys.length - 1 ? 11 : 6, 0, TAU);
    c.fillStyle = i === ys.length - 1 ? "#2563c4" : "#ffffff";
    c.fill();
    c.strokeStyle = "#2563c4";
    c.lineWidth = 4;
    c.stroke();
  });
  // a row of the list
  c.fillStyle = "#dbe8f5";
  c.beginPath();
  c.arc(298, 784, 24, 0, TAU);
  c.fill();
  c.fillStyle = "#c9d4e2";
  c.fillRect(342, 768, 250, 13);
  c.fillRect(342, 792, 170, 11);
  roundRect(c, 700, 764, 138, 42, 21);
  c.fillStyle = "#e8f6ec";
  c.fill();
  c.fillStyle = "#4caf63";
  c.beginPath();
  c.arc(726, 785, 8, 0, TAU);
  c.fill();
  c.fillStyle = "#2f7d3a";
  c.font = `600 22px ${font}`;
  c.fillText("Live", 746, 793);
}

/** A card that floats above the screen: an assistant has drafted a reply. */
function drawCard(c: CanvasRenderingContext2D, font: string) {
  c.clearRect(0, 0, 640, 300);
  c.save();
  c.shadowColor = "rgba(14,27,45,0.3)";
  c.shadowBlur = 36;
  c.shadowOffsetY = 14;
  roundRect(c, 24, 24, 592, 240, 38);
  c.fillStyle = "#ffffff";
  c.fill();
  c.restore();
  const g = c.createLinearGradient(60, 70, 150, 160);
  g.addColorStop(0, "#5aa0ee");
  g.addColorStop(1, "#2563c4");
  c.fillStyle = g;
  c.beginPath();
  c.arc(110, 120, 40, 0, TAU);
  c.fill();
  // a small spark in the avatar
  c.fillStyle = "#ffffff";
  c.beginPath();
  c.moveTo(110, 94);
  c.lineTo(117, 113);
  c.lineTo(136, 120);
  c.lineTo(117, 127);
  c.lineTo(110, 146);
  c.lineTo(103, 127);
  c.lineTo(84, 120);
  c.lineTo(103, 113);
  c.closePath();
  c.fill();
  c.fillStyle = "#0e1b2d";
  c.font = `700 36px ${font}`;
  c.fillText("Reply drafted", 176, 112);
  c.fillStyle = "#6b7b91";
  c.font = `500 26px ${font}`;
  c.fillText("Ready for a person to review", 176, 152);
  roundRect(c, 60, 188, 200, 44, 22);
  c.fillStyle = "#eef3f9";
  c.fill();
  c.fillStyle = "#2563c4";
  c.font = `600 22px ${font}`;
  c.fillText("Approve", 100, 218);
  c.fillStyle = "#4caf63";
  c.beginPath();
  c.arc(84, 210, 7, 0, TAU);
  c.fill();
}

/** Fine concentric engraving, like a machined plate. */
function drawEngraving(c: CanvasRenderingContext2D) {
  c.clearRect(0, 0, 1024, 1024);
  c.strokeStyle = "rgba(34,66,95,0.1)";
  c.lineWidth = 1.2;
  for (let r = 14; r < 512; r += 11) {
    c.beginPath();
    c.arc(512, 512, r, 0, TAU);
    c.stroke();
  }
}

function glowTexture() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 256;
  const c = cv.getContext("2d") as CanvasRenderingContext2D;
  const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.25, "rgba(150,200,255,0.55)");
  g.addColorStop(1, "rgba(120,180,255,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, 256, 256);
  return cv;
}

/* ------------------------------------------------------------------ the scene */

/** Gives the browser a moment between the big steps of the build, so scrolling and typing never wait for the whole model. */
const breathe = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const FOV = 22;
const R_CASE = 5.3; // outer radius of the case

interface Layer {
  g: THREE.Group;
  rest: number;
  open: number;
  /** The part of the opening (in q, 0..0.5) in which this layer travels. */
  a: number;
  b: number;
  /** Thickness, for framing. */
  h: number;
}

export default async function createAssembly(ctx: SceneCtx): Promise<SceneHandle> {
  const marks: [string, number][] = [["start", performance.now()]];
  const mark = (label: string) => marks.push([label, performance.now()]);
  const st = createStage(ctx.canvas, { fov: FOV, shadow: 16, exposure: 1.06 });
  mark("stage");
  await breathe();
  const { scene, camera, renderer } = st;
  st.key.position.set(-8, 25, 12);
  st.key.target.position.set(0, 3, 0);
  // a cool rim light from the right, like the brief's champagne strip (blue here, to suit the brand)
  const rim = new THREE.DirectionalLight(0xb9d5ff, 1.25);
  rim.position.set(15, 7, -9);
  scene.add(rim);

  const model = new THREE.Group();
  scene.add(model);
  const textures: THREE.Texture[] = [];
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  /* ---- materials ---- */
  const ceramic = new THREE.MeshPhysicalMaterial({ color: 0xf4f7fb, roughness: 0.36, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.22 });
  const ceramicBlue = new THREE.MeshPhysicalMaterial({ color: 0xe2ecf8, roughness: 0.4, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const navy = new THREE.MeshStandardMaterial({ color: C.navy, roughness: 0.34, metalness: 0.72 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xe8edf3, roughness: 0.24, metalness: 1 });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x66778c, roughness: 0.36, metalness: 1 });
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0 });
  const blueMat = new THREE.MeshStandardMaterial({ color: 0x2f74d6, roughness: 0.3, metalness: 0.2, emissive: 0x1d5fc9, emissiveIntensity: 0.25 });
  const gemMat = new THREE.MeshPhysicalMaterial({
    color: 0x3b8df2,
    metalness: 0.05,
    roughness: 0.08,
    clearcoat: 1,
    flatShading: true,
    emissive: 0x1d5fc9,
    emissiveIntensity: 0.5,
    envMapIntensity: 1.4,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xe6f0ff,
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const led = new THREE.MeshBasicMaterial({ color: C.green });
  const slotMat = new THREE.MeshStandardMaterial({ color: 0x16293d, roughness: 0.6, metalness: 0.3 });

  const mesh = (geo: THREE.BufferGeometry, mat: THREE.Material, cast = true, receive = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = cast;
    m.receiveShadow = receive;
    return m;
  };
  const dummy = new THREE.Object3D();
  const instanced = (geo: THREE.BufferGeometry, mat: THREE.Material, count: number, place: (i: number, o: THREE.Object3D) => void) => {
    const im = new THREE.InstancedMesh(geo, mat, count);
    for (let i = 0; i < count; i++) {
      dummy.position.set(0, 0, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      place(i, dummy);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    }
    im.castShadow = true;
    im.receiveShadow = true;
    im.instanceMatrix.needsUpdate = true;
    return im;
  };
  const screws = (g: THREE.Group, radius: number, y: number, n: number, rot = 0, r = 0.13) => {
    const head = new THREE.CylinderGeometry(r, r, 0.06, 20);
    head.translate(0, 0.03, 0);
    const slot = new THREE.BoxGeometry(r * 1.7, 0.02, r * 0.28);
    slot.translate(0, 0.065, 0);
    const place = (i: number, o: THREE.Object3D) => {
      const a = rot + (i * TAU) / n;
      o.position.set(Math.cos(a) * radius, y, Math.sin(a) * radius);
      o.rotation.y = -a;
    };
    g.add(instanced(head, steel, n, place), instanced(slot, slotMat, n, place));
  };

  /* ---- the layers ---- */
  const layers: Layer[] = [];
  const mkLayer = (rest: number, open: number, a: number, b: number, h: number) => {
    const g = new THREE.Group();
    g.position.y = rest;
    model.add(g);
    const l: Layer = { g, rest, open, a, b, h };
    layers.push(l);
    return l;
  };
  // rest = where it sits in the finished object, open = where it floats when fully opened (bottom of each layer)
  const base = mkLayer(0.0, -3.0, 0.18, 0.37, 0.45);
  const caseL = mkLayer(0.45, 0.45, 0, 0, 1.9); // the anchor: it never moves
  const data = mkLayer(0.55, 2.9, 0.15, 0.34, 0.5);
  const gears = mkLayer(1.05, 4.4, 0.12, 0.31, 0.3);
  const core = mkLayer(1.38, 5.7, 0.09, 0.28, 2.4);
  const bezel = mkLayer(2.35, 9.0, 0.06, 0.25, 0.42);
  const crystal = mkLayer(2.77, 10.5, 0.03, 0.22, 0.2);

  mark("materials");
  await breathe();
  /* 7. Base: cloud and security */
  {
    const g = base.g;
    g.add(mesh(disc(5.0, 0.45, 0.06), navy));
    const groove = mesh(ring(4.7, 4.62, 0.02, 0.005), steel, false);
    groove.position.y = 0.45;
    g.add(groove);
    const shield = mesh(shieldGeo(), steel);
    shield.position.y = 0.45;
    g.add(shield);
    // vents: two arcs of slots
    const slotG = new THREE.BoxGeometry(0.5, 0.03, 0.12);
    const vents = instanced(slotG, slotMat, 28, (i, o) => {
      const arc = i < 14 ? 0 : 1;
      const k = i % 14;
      const a = (arc ? Math.PI : 0) + (-0.8 + (k * 1.6) / 13) + Math.PI / 2;
      const r = 3.35;
      o.position.set(Math.cos(a) * r, 0.465, Math.sin(a) * r);
      o.rotation.y = -a - Math.PI / 2;
    });
    vents.castShadow = false;
    g.add(vents);
    // three small lights, green when the system is healthy
    [0, 1, 2].forEach((i) => {
      const a = -0.35 + i * 0.35;
      const x = Math.cos(a) * 4.2;
      const z = Math.sin(a) * 4.2;
      const collar = mesh(ring(0.16, 0.1, 0.05, 0.01), steel, false);
      collar.position.set(x, 0.45, z);
      const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.04, 16), led);
      dot.position.set(x, 0.47, z);
      g.add(collar, dot);
    });
    screws(g, 4.45, 0.45, 4, Math.PI / 4);
  }

  mark("base");
  await breathe();
  /* 6. Case: integrations (the connectors slide out) */
  const crown = new THREE.Group();
  const pushers: THREE.Group[] = [];
  const CROWN_X = R_CASE - 0.05;
  {
    const g = caseL.g;
    g.add(mesh(ring(R_CASE, 4.55, 1.9, 0.08), ceramic));
    const liner = mesh(ring(4.6, 4.52, 1.7, 0.01), steel, false);
    liner.position.y = 0.1;
    g.add(liner);
    screws(g, 4.93, 1.9, 6, 0.3);
    // an inlaid navy band around the case, and a polished edge at the top
    const band = mesh(ring(R_CASE + 0.025, R_CASE - 0.2, 0.1, 0.02), navy, false);
    band.position.y = 0.8;
    g.add(band);
    // crown: a knurled barrel on the right
    const barrel = mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.62, 18), steel);
    barrel.geometry = crease(barrel.geometry, 0.3);
    barrel.rotation.z = Math.PI / 2;
    const cap = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.1, 28), blueMat);
    cap.rotation.z = Math.PI / 2;
    cap.position.x = 0.34;
    crown.add(barrel, cap);
    crown.position.set(CROWN_X + 0.3, 1.05, 0);
    g.add(crown);
    // two pushers
    [-0.62, 0.62].forEach((a, i) => {
      const p = new THREE.Group();
      p.rotation.y = -a;
      const body = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.5, 22), darkSteel);
      body.rotation.z = Math.PI / 2;
      const tip = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.12, 22), i ? blueMat : steel);
      tip.rotation.z = Math.PI / 2;
      tip.position.x = 0.28;
      p.add(body, tip);
      p.position.set(0, 1.05 + (i ? -0.18 : 0.18), 0);
      p.userData.x0 = R_CASE - 0.05 + 0.25;
      body.position.x = p.userData.x0;
      tip.position.x = p.userData.x0 + 0.28;
      g.add(p);
      pushers.push(p);
    });
  }

  mark("case");
  await breathe();
  /* 5. Data: a machined plate, two bridges, jewels and two databases */
  const dataTop: THREE.Object3D[] = [];
  {
    const g = data.g;
    g.add(mesh(disc(4.5, 0.22, 0.03), ceramicBlue));
    const eng = document.createElement("canvas");
    eng.width = eng.height = 1024;
    drawEngraving(eng.getContext("2d") as CanvasRenderingContext2D);
    const engTex = new THREE.CanvasTexture(eng);
    engTex.colorSpace = THREE.SRGBColorSpace;
    engTex.anisotropy = aniso;
    textures.push(engTex);
    const overlay = new THREE.Mesh(new THREE.CircleGeometry(4.46, 96), new THREE.MeshBasicMaterial({ map: engTex, transparent: true, depthWrite: false }));
    overlay.rotation.x = -Math.PI / 2;
    overlay.position.y = 0.223;
    g.add(overlay);
    // two bridges, each with two screws
    [
      [0.1, 1.25],
      [Math.PI + 0.35, Math.PI + 1.5],
    ].forEach(([a0, a1]) => {
      const b = new THREE.Group();
      b.add(mesh(arcBand(2.5, 3.85, a0, a1, 0.12), navy));
      screws(b, 3.18, 0.12, 2, (a0 + a1) / 2 - 0.4, 0.11);
      b.position.y = 0.22;
      g.add(b);
      dataTop.push(b);
    });
    // two databases: stacks of discs
    [
      [-1.9, -2.3],
      [2.6, 1.7],
    ].forEach(([x, z]) => {
      const s = new THREE.Group();
      for (let k = 0; k < 3; k++) {
        const d1 = mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.13, 28), white);
        d1.position.y = 0.065 + k * 0.19;
        const d2 = mesh(new THREE.CylinderGeometry(0.635, 0.635, 0.035, 28), blueMat);
        d2.position.y = 0.065 + k * 0.19;
        s.add(d1, d2);
      }
      s.position.set(x, 0.22, z);
      g.add(s);
      dataTop.push(s);
    });
  }

  mark("data");
  await breathe();
  /* 4. Gears: workflow automation, five gears that mesh */
  interface Gear {
    node: THREE.Group;
    teeth: number;
    x: number;
    z: number;
    r: number;
    dir: number;
    a0: number;
  }
  const gearList: Gear[] = [];
  {
    const g = gears.g;
    const spec: { teeth: number; parent: number; ang: number; mat: THREE.Material; win: number }[] = [
      // The gears turn 6 teeth over the scene, so each gear's spokes must repeat every 6 teeth or less (30 teeth in 5
      // windows, 20 in 10, 18 in 3): then the last frame is exactly the first, spokes and all.
      { teeth: 30, parent: -1, ang: 0, mat: steel, win: 5 },
      { teeth: 20, parent: 0, ang: THREE.MathUtils.degToRad(38), mat: navy, win: 10 },
      { teeth: 14, parent: 0, ang: THREE.MathUtils.degToRad(-40), mat: blueMat, win: 0 },
      { teeth: 18, parent: 0, ang: THREE.MathUtils.degToRad(175), mat: darkSteel, win: 3 },
      { teeth: 12, parent: 2, ang: THREE.MathUtils.degToRad(-110), mat: navy, win: 0 },
    ];
    spec.forEach((s, i) => {
      const r = (s.teeth * MOD) / 2;
      const step = TAU / s.teeth;
      let x = -0.4;
      let z = 0;
      let dir = 1;
      let a0 = 0;
      if (s.parent >= 0) {
        const p = gearList[s.parent];
        x = p.x + (p.r + r) * Math.cos(s.ang);
        z = p.z + (p.r + r) * Math.sin(s.ang);
        dir = -p.dir;
        // mesh: where the parent has a tooth, this gear has a gap
        const u = (s.ang - p.a0) / (TAU / p.teeth);
        const f1 = u - Math.round(u);
        a0 = s.ang + Math.PI - step * (0.5 - f1);
      }
      const node = new THREE.Group();
      node.position.set(x, 0.0, z);
      const body = mesh(gearGeo(s.teeth, s.win), s.mat);
      body.position.y = 0.04;
      const hub = mesh(new THREE.CylinderGeometry(Math.max(0.17, r * 0.12), Math.max(0.17, r * 0.12), 0.3, 24), steel);
      hub.position.y = 0.15;
      const pin = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.55, 12), darkSteel);
      pin.position.y = -0.18;
      node.add(body, hub, pin);
      g.add(node);
      gearList.push({ node, teeth: s.teeth, x, z, r, dir, a0 });
      void i;
    });
    // jewels on the data plate under each gear are drawn with the data layer's top parts
    gearList.forEach((gr) => {
      const jewel = new THREE.Group();
      const collar = mesh(ring(0.2, 0.1, 0.07, 0.012), steel);
      const gem = mesh(new THREE.SphereGeometry(0.1, 16, 12), blueMat);
      gem.position.y = 0.06;
      jewel.add(collar, gem);
      jewel.position.set(gr.x, 0.22, gr.z);
      data.g.add(jewel);
      dataTop.push(jewel);
    });
  }

  mark("gears");
  await breathe();
  /* 3. Core: AI and voice. A faceted gem inside two turning rings, and a ring of bars that listens. */
  const coreScale = new THREE.Group();
  core.g.add(coreScale);
  const VOICE_N = 64;
  const VOICE_R = 3.05;
  const voiceGeo = new THREE.BoxGeometry(0.085, 1, 0.085);
  voiceGeo.translate(0, 0.5, 0);
  const voice = new THREE.InstancedMesh(
    voiceGeo,
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35, metalness: 0.2, emissive: 0x2a6fd8, emissiveIntensity: 0.35 }),
    VOICE_N,
  );
  voice.castShadow = true;
  const tintA = new THREE.Color(0x9fc2ea);
  const tintB = new THREE.Color(0x2563c4);
  for (let i = 0; i < VOICE_N; i++) voice.setColorAt(i, tintA.clone().lerp(tintB, (Math.sin((i / VOICE_N) * TAU * 3) + 1) / 2));
  voice.position.y = 0.1;
  coreScale.add(voice);
  const gem = mesh(new THREE.IcosahedronGeometry(0.85, 1), gemMat);
  gem.position.y = 1.2;
  const halo = new THREE.Sprite(
    (() => {
      const t = new THREE.CanvasTexture(glowTexture());
      t.colorSpace = THREE.SRGBColorSpace;
      textures.push(t);
      return new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, opacity: 0.7 });
    })(),
  );
  halo.scale.setScalar(4.2);
  halo.position.y = 1.2;
  const stem = mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 12), steel);
  stem.position.y = 0.6;
  const ringA = new THREE.Group();
  const ringB = new THREE.Group();
  ringA.position.y = ringB.position.y = 1.2;
  ringA.add(mesh(new THREE.TorusGeometry(1.55, 0.05, 10, 96), steel));
  ringB.add(mesh(new THREE.TorusGeometry(2.15, 0.045, 10, 112), navy));
  ringA.rotation.x = ringB.rotation.x = Math.PI / 2;
  const nodes = [0, 1, 2, 3, 4].map((i) => {
    const n = mesh(new THREE.SphereGeometry(i % 2 ? 0.1 : 0.13, 16, 12), i % 2 ? white : blueMat);
    (i < 3 ? ringA : ringB).add(n);
    return n;
  });
  coreScale.add(stem, halo, gem, ringA, ringB);

  mark("core");
  await breathe();
  /* 2. Bezel: design */
  {
    const g = bezel.g;
    g.add(mesh(ring(R_CASE, 4.05, 0.42, 0.06), navy));
    const lip = mesh(ring(4.18, 4.04, 0.43, 0.015), steel);
    g.add(lip);
    const minor = new THREE.BoxGeometry(0.045, 0.03, 0.3);
    g.add(
      instanced(minor, white, 60, (i, o) => {
        const a = (i * TAU) / 60;
        o.position.set(Math.cos(a) * 4.78, 0.43, Math.sin(a) * 4.78);
        o.rotation.y = -a + Math.PI / 2;
      }),
    );
    const major = new THREE.BoxGeometry(0.08, 0.034, 0.52);
    g.add(
      instanced(major, blueMat, 12, (i, o) => {
        const a = (i * TAU) / 12;
        o.position.set(Math.cos(a) * 4.7, 0.435, Math.sin(a) * 4.7);
        o.rotation.y = -a + Math.PI / 2;
      }),
    );
  }

  mark("bezel");
  await breathe();
  /* 1. Crystal: the app. Glass, the screen drawn on it, a moving highlight, and a card that floats above. */
  const uiPivot = new THREE.Group();
  const cardPivot = new THREE.Group();
  const sheenTex = (() => {
    const cv = document.createElement("canvas");
    cv.width = 256;
    cv.height = 4;
    const c = cv.getContext("2d") as CanvasRenderingContext2D;
    const g = c.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.4, "rgba(255,255,255,0)");
    g.addColorStop(0.5, "rgba(255,255,255,0.9)");
    g.addColorStop(0.6, "rgba(255,255,255,0)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 4);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    // (clamped, not repeated: a repeated band would show a sliver of itself at the far edge of the glass at the
    // start and at the end of the scene, and the last frame would not be the first)
    t.center.set(0.5, 0.5);
    t.rotation = 0.6;
    textures.push(t);
    return t;
  })();
  let uiTex: THREE.CanvasTexture | null = null;
  let cardTex: THREE.CanvasTexture | null = null;
  {
    const g = crystal.g;
    g.add(mesh(ring(4.42, 4.12, 0.2, 0.04), steel));
    const glass = mesh(disc(4.16, 0.12, 0.02), glassMat, false, false);
    glass.position.y = 0.04;
    glass.renderOrder = 4;
    g.add(glass);
    const ui = new THREE.Mesh(new THREE.CircleGeometry(3.98, 110), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false }));
    ui.rotation.x = -Math.PI / 2;
    ui.position.y = 0.175;
    ui.renderOrder = 5;
    uiPivot.add(ui);
    uiPivot.rotation.y = -0.54;
    g.add(uiPivot);
    const sheen = new THREE.Mesh(
      new THREE.CircleGeometry(4.12, 110),
      new THREE.MeshBasicMaterial({ map: sheenTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5, toneMapped: false }),
    );
    sheen.rotation.x = -Math.PI / 2;
    sheen.position.y = 0.185;
    sheen.renderOrder = 6;
    g.add(sheen);
    const card = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.31), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false }));
    card.rotation.x = -0.95;
    card.renderOrder = 7;
    cardPivot.add(card);
    cardPivot.rotation.y = -0.54;
    cardPivot.position.set(0, 0.5, 0);
    g.add(cardPivot);
    card.position.set(1.7, 0, 2.5);

    // draw the textures once the typeface is ready; until then the glass simply shows what is behind it
    const fam = (getComputedStyle(document.documentElement).getPropertyValue("--font-inter").trim() || "Inter, system-ui, sans-serif");
    const paint = () => {
      const a = document.createElement("canvas");
      a.width = a.height = 1024;
      drawDashboard(a.getContext("2d") as CanvasRenderingContext2D, fam);
      uiTex = new THREE.CanvasTexture(a);
      uiTex.colorSpace = THREE.SRGBColorSpace;
      uiTex.anisotropy = aniso;
      (ui.material as THREE.MeshBasicMaterial).map = uiTex;
      (ui.material as THREE.MeshBasicMaterial).needsUpdate = true;
      const b = document.createElement("canvas");
      b.width = 640;
      b.height = 300;
      drawCard(b.getContext("2d") as CanvasRenderingContext2D, fam);
      cardTex = new THREE.CanvasTexture(b);
      cardTex.colorSpace = THREE.SRGBColorSpace;
      cardTex.anisotropy = aniso;
      (card.material as THREE.MeshBasicMaterial).map = cardTex;
      (card.material as THREE.MeshBasicMaterial).needsUpdate = true;
      textures.push(uiTex, cardTex);
    };
    const ready = document.fonts?.load ? Promise.all([document.fonts.load(`700 40px ${fam}`), document.fonts.load(`500 24px ${fam}`)]).catch(() => undefined) : Promise.resolve();
    void ready.then(paint);
  }

  mark("crystal");
  await breathe();
  /* ---- the axis: a thin rod through every layer, proof that they stay aligned ---- */
  const rod = mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 10), steel, false, false);
  model.add(rod);

  /* ---- the audit: a thin ring of light that passes down through the layers as they open (and back up as they close) ---- */
  const scanMat = new THREE.MeshBasicMaterial({ color: 0x3b8df2, transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide });
  const scan = new THREE.Mesh(new THREE.RingGeometry(5.35, 5.5, 128), scanMat);
  scan.rotation.x = -Math.PI / 2;
  scan.visible = false;
  model.add(scan);
  const scanFill = new THREE.Mesh(
    new THREE.CircleGeometry(5.5, 96),
    new THREE.MeshBasicMaterial({ color: 0x3b8df2, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
  );
  scanFill.rotation.x = -Math.PI / 2;
  scanFill.visible = false;
  model.add(scanFill);

  /* ---- floor: real shadows, and a soft pool of light ---- */
  const floor = shadowFloor(140, 0.12);
  model.add(floor);
  const poolTex = (() => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 256;
    const c = cv.getContext("2d") as CanvasRenderingContext2D;
    const g = c.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(120,160,210,0.38)");
    g.addColorStop(0.55, "rgba(150,185,225,0.14)");
    g.addColorStop(1, "rgba(170,200,235,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    textures.push(t);
    return t;
  })();
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2;
  model.add(pool);
  // `?still` is used only by scripts/make-posters.mjs: the stills are drawn without the pool of light, so their edges are clean
  if (new URLSearchParams(window.location.search).has("still")) pool.visible = false;

  /* ---- progress ---- */
  const target = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  let az = -0.6;
  /** Where the model may stand on screen (the copy is on the left, the labels on the right); set by the page. */
  let lay: SceneLayout | null = null;

  function setCamera(e: number, lo: number, hi: number) {
    const elev = lerp(0.5, 0.36, e);
    az = lerp(-0.62, -0.46, e);
    const t2 = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const w = st.size.w;
    const aspect = w / st.size.h;
    // the room the model has: while closed it may use the space the labels will take later, once open it keeps clear of them
    const from = lay ? lay.left : w * 0.4;
    const to = lay ? lerp(lay.right, lay.rightOpen, e) : w * 0.92;
    const room = Math.max(w * 0.2, to - from);
    st.shift(-((from + to) / 2 / w - 0.5));
    const needH = (hi - lo) * Math.cos(elev) + 2 * R_CASE * Math.sin(elev) + 2.2;
    const needW = 2 * R_CASE + 1.8 * e + 1.2;
    const dist = Math.max(needH / (2 * t2), needW / (2 * t2 * aspect * (room / w)));
    target.set(0, (lo + hi) / 2 + lerp(0.2, 0.3, e), 0);
    camera.position.set(
      target.x + dist * Math.cos(elev) * Math.sin(az),
      target.y + dist * Math.sin(elev),
      target.z + dist * Math.cos(elev) * Math.cos(az),
    );
    camera.lookAt(target);
    camera.updateMatrixWorld();
  }

  const handle: SceneHandle = {
    resize: (w, h) => st.resize(w, h),
    layout: (l) => {
      lay = l;
    },
    warm: () => st.warm(),
    render: () => st.render(),
    lowerQuality() {
      const next = Math.max(1, st.pixelRatio - 0.25);
      if (next >= st.pixelRatio - 0.001) return false;
      st.setPixelRatio(next);
      st.render(); // resizing clears the canvas: draw again at once
      return true;
    },
    stats() {
      const i = renderer.info;
      return {
        drawCalls: i.render.calls,
        triangles: i.render.triangles,
        geometries: i.memory.geometries,
        textures: i.memory.textures,
        shaderPrograms: i.programs?.length ?? 0,
        pixelRatio: st.pixelRatio,
      };
    },
    setProgress(p) {
      // the second half of the scene is the first half played backwards
      const q = Math.min(p, 1 - p);
      const o =(l: Layer) => quint(win(q, l.a, l.b));
      layers.forEach((l) => {
        l.g.position.y = lerp(l.rest, l.open, l.a === l.b ? 0 : o(l));
      });
      const e = quint(win(q, 0.03, 0.37)); // overall openness, for the camera
      const e2 = quint(win(q, 0.3, 0.47)); // the second stage: the parts of each layer open up a little more

      // the case's connectors slide out along their own axes
      const eConn = quint(win(q, 0.1, 0.34));
      crown.position.x = CROWN_X + 0.3 + 0.8 * eConn;
      pushers.forEach((pu) => {
        pu.children[0].position.x = (pu.userData.x0 as number) + 0.55 * eConn;
        pu.children[1].position.x = (pu.userData.x0 as number) + 0.55 * eConn + 0.28;
      });

      // second stage: bridges, databases and jewels lift off the plate; the card floats higher
      dataTop.forEach((d, i) => {
        d.position.y = 0.22 + (0.3 + (i % 3) * 0.05) * e2;
      });
      cardPivot.position.y = 0.5 + 0.9 * e2 + 0.25 * o(crystal);

      // the core grows from a small, sealed mechanism to its full size as it rises
      coreScale.scale.setScalar(lerp(0.55, 1, o(core)));

      // everything that turns is a function of p, and ends where it began
      const steps = 6 * p; // whole teeth over the scene
      gearList.forEach((gr) => {
        const alpha = gr.a0 + gr.dir * (TAU / gr.teeth) * steps;
        gr.node.rotation.y = -alpha;
      });
      ringA.rotation.y = TAU * p;
      ringB.rotation.z = -TAU * p;
      nodes.forEach((n, i) => {
        const a = TAU * (i % 2 ? 2 : 1) * p + (i * TAU) / 5;
        const rr = i < 3 ? 1.55 : 2.15;
        n.position.set(Math.cos(a) * rr, Math.sin(a) * rr, 0);
      });
      for (let i = 0; i < VOICE_N; i++) {
        const a = (i / VOICE_N) * TAU;
        const w = 0.5 + 0.5 * Math.sin(a * 5 - TAU * 2 * p) * Math.sin(a * 3 + TAU * p);
        const h = 0.14 + 0.5 * w * w;
        dummy.position.set(Math.cos(a) * VOICE_R, 0, Math.sin(a) * VOICE_R);
        dummy.rotation.set(0, -a, 0);
        dummy.scale.set(1, h, 1);
        dummy.updateMatrix();
        voice.setMatrixAt(i, dummy.matrix);
      }
      voice.instanceMatrix.needsUpdate = true;

      // the moving highlight across the crystal: one slow pass over the whole scene
      sheenTex.offset.x = lerp(0.6, -0.6, p);

      // the axis rod
      const lo = base.g.position.y;
      const hi = crystal.g.position.y + 0.2;
      rod.scale.y = Math.max(0.001, hi - lo - 0.3);
      rod.position.y = (lo + 0.2 + hi) / 2;
      rod.visible = e > 0.02;

      // the audit ring passes down through the layers
      const sc = win(q, 0.05, 0.42);
      const vis = sc > 0.002 && sc < 0.998;
      scan.visible = scanFill.visible = vis;
      const sy = lerp(hi + 0.5, lo - 0.2, quint(sc));
      scan.position.y = scanFill.position.y = sy;
      scanMat.opacity = 0.55 * Math.min(1, sc * 12, (1 - sc) * 12);
      (scanFill.material as THREE.MeshBasicMaterial).opacity = 0.07 * Math.min(1, sc * 12, (1 - sc) * 12);

      // the floor follows the lowest layer
      floor.position.y = lo - 0.9;
      pool.position.y = lo - 0.88;

      setCamera(e, lo, hi + 1.1 * e2);
      // the screen and the card face the viewer, whichever way the camera has turned
      uiPivot.rotation.y = cardPivot.rotation.y = az;
    },
    anchors(): SceneAnchor[] {
      camera.updateMatrixWorld();
      const out: SceneAnchor[] = [];
      // the point of a circle that is furthest to the right on screen: where a leader line leaves the model
      const rimPoint = (r: number, y: number) => {
        let best = { x: -Infinity, y: 0, behind: false };
        for (let i = 0; i < 40; i++) {
          const a = (i / 40) * TAU;
          const q = st.project(tmp.set(Math.cos(a) * r, y, Math.sin(a) * r));
          if (q.x > best.x) best = q;
        }
        return best;
      };
      for (const k of ctx.keys) {
        switch (k) {
          case "interface":
            out.push(rimPoint(4.42, crystal.g.position.y + 0.1));
            break;
          case "design":
            out.push(rimPoint(R_CASE, bezel.g.position.y + 0.21));
            break;
          case "ai": {
            const s = coreScale.scale.x;
            out.push(rimPoint(VOICE_R * s, core.g.position.y + 0.1 + 0.3 * s));
            break;
          }
          case "workflows": {
            let best = { x: -Infinity, y: 0, behind: false };
            for (const gr of gearList) {
              for (let i = 0; i < 18; i++) {
                const a = (i / 18) * TAU;
                const q = st.project(tmp.set(gr.x + Math.cos(a) * (gr.r + MOD), gears.g.position.y + 0.15, gr.z + Math.sin(a) * (gr.r + MOD)));
                if (q.x > best.x) best = q;
              }
            }
            out.push(best);
            break;
          }
          case "data":
            out.push(rimPoint(4.5, data.g.position.y + 0.11));
            break;
          case "integrations":
            out.push(st.project(tmp.set(crown.position.x + 0.45, caseL.g.position.y + 1.05, 0)));
            break;
          case "cloud":
            out.push(rimPoint(5.0, base.g.position.y + 0.22));
            break;
          default:
            out.push({ x: 0, y: 0, behind: true });
        }
      }
      return out;
    },
    dispose() {
      textures.forEach((t) => t.dispose());
      st.dispose();
    },
  };

  // build the first frame now, so the shaders are the ones the scene keeps using
  handle.setProgress(0);
  mark("first frame setup");
  if (new URLSearchParams(window.location.search).has("stats")) console.info("[lw3d] build steps (ms)", JSON.stringify(marks.map(([l, ts], i) => [l, i ? Math.round(ts - marks[i - 1][1]) : 0])));
  return handle;
}
