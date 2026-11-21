import * as THREE from "three";
import { canvasTexture, fitUV, roundedShape } from "./kit";
import type { DeviceType } from "./types";

export type { DeviceType };

/**
 * The devices our work runs on, modelled in code (no model files): a phone, a laptop whose lid opens, a tablet and a
 * desktop display. Each shows a picture of one of our own projects on its screen. Sizes follow
 * the real things (a phone is 70 x 147 mm, a laptop 312 mm wide) in units of about 100 mm.
 */

/** The picture plane of a screen, so the scene can swap and cross-fade what is on it. */
export interface ScreenHandle {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  w: number;
  h: number;
  /** The object the plane lives in (the lid of a laptop, the body of a phone). */
  parent: THREE.Object3D;
}

export interface Device {
  type: DeviceType;
  group: THREE.Group;
  /** Where the pictures go (a rack has no screen). */
  screen?: ScreenHandle;
  /** A point at the top-left of the screen (a tag points at it); it follows the lid of a laptop. */
  tagObj: THREE.Object3D;
  /** The middle of the screen. */
  centerObj: THREE.Object3D;
  /** The middle of the top edge, just above it (a beam ends there); it follows the lid of a laptop. */
  topObj: THREE.Object3D;
  /** Where the middle of the device is, above or below the group's own origin (so a mixed set can be lined up). */
  cy: number;
  /** How wide and how tall the device is when it stands. */
  extent: { w: number; h: number };
  /** The textures the device made for itself (the screen's picture belongs to whoever passed it in). */
  textures: THREE.Texture[];
  /** Screen brightness: 0 is dark, 1 is lit. */
  power(v: number): void;
  /** A laptop's lid: 0 closed, 1 open. */
  open(v: number): void;
  /** Small life that follows the scroll (lights on a rack). */
  tick(p: number): void;
}

/** The size, in pixels, of the picture each kind of device's screen wants (the same shape as the screen). */
export const SCREEN_PX: Record<DeviceType, [number, number]> = {
  phone: [512, 1108],
  tablet: [1024, 640],
  laptop: [1024, 640],
  monitor: [1280, 720],
};

const AL = 0xb9c0c8; // silver aluminium
const GRAPHITE = 0x3a4048;
const STEP = 0.002; // the gap between the layers of a screen (glass, picture, camera, sheen)

function metal(color: number, rough = 0.3): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: rough, envMapIntensity: 1.25, clearcoat: 0.12, clearcoatRoughness: 0.3 });
}

/** The layers of a screen sit a hair apart: the depth buffer is told which one wins, so none flickers from far away. */
function layer<T extends THREE.Material>(m: T, n: number): T {
  m.polygonOffset = true;
  m.polygonOffsetFactor = -n;
  m.polygonOffsetUnits = -n;
  return m;
}

/** A thin rounded slab with softly bevelled edges, centred on the origin (depth along z). */
function slabGeo(w: number, h: number, d: number, r: number): THREE.ExtrudeGeometry {
  const b = Math.min(0.014, d / 4);
  const shape = roundedShape(w - 2 * b, h - 2 * b, Math.max(0.001, r - b));
  const g = new THREE.ExtrudeGeometry(shape, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 10 });
  g.translate(0, 0, -(d - 2 * b) / 2);
  return g;
}

/** A flat rounded rectangle facing +z, with texture coordinates 0..1 over it. */
function plate(w: number, h: number, r: number, mat: THREE.Material, z: number): THREE.Mesh {
  const g = new THREE.ShapeGeometry(roundedShape(w, h, r), 10);
  fitUV(g, w, h);
  const m = new THREE.Mesh(g, mat);
  m.position.z = z;
  return m;
}

function screenMaterial(tex: THREE.Texture | null): THREE.MeshBasicMaterial {
  return layer(new THREE.MeshBasicMaterial({ map: tex, color: 0xffffff, toneMapped: false }), 2);
}

const dark = (hex: number, n: number) => layer(new THREE.MeshBasicMaterial({ color: hex }), n);

/** The soft sheen of light across a pane of glass: a faint diagonal band, so a dark screen still reads as glass. */
function glareTexture(): THREE.CanvasTexture {
  return canvasTexture(
    256,
    256,
    (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h);
      gr.addColorStop(0, "rgba(255,255,255,0.0)");
      gr.addColorStop(0.16, "rgba(255,255,255,0.0)");
      gr.addColorStop(0.3, "rgba(255,255,255,0.1)");
      gr.addColorStop(0.44, "rgba(255,255,255,0.0)");
      gr.addColorStop(0.58, "rgba(255,255,255,0.0)");
      gr.addColorStop(0.66, "rgba(255,255,255,0.05)");
      gr.addColorStop(0.76, "rgba(255,255,255,0.0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
    },
    1,
  );
}

function glare(tex: THREE.Texture, w: number, h: number, r: number, z: number): THREE.Mesh {
  const m = plate(w, h, r, layer(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }), 4), z);
  m.renderOrder = 2;
  return m;
}

const marker = (parent: THREE.Object3D, x: number, y: number, z: number): THREE.Object3D => {
  const o = new THREE.Object3D();
  o.position.set(x, y, z);
  parent.add(o);
  return o;
};

/** A flat device with a glass front: the phone and the tablet. */
function makeSlate(opts: { w: number; h: number; d: number; r: number; bezel: number; tex: THREE.Texture | null; frame: number; phone: boolean; type: DeviceType }): Device {
  const { w, h, d, r, bezel, tex, frame, phone, type } = opts;
  const g = new THREE.Group();
  const own: THREE.Texture[] = [];
  g.add(new THREE.Mesh(slabGeo(w, h, d, r), metal(frame, 0.26)));
  const front = d / 2;
  g.add(plate(w - 0.028, h - 0.028, r - 0.014, dark(0x04060a, 1), front + STEP));
  const mat = screenMaterial(tex);
  const picture = plate(w - 2 * bezel, h - 2 * bezel, Math.max(0.02, r - bezel), mat, front + STEP * 2);
  g.add(picture);
  if (phone) {
    const island = plate(0.2, 0.056, 0.028, dark(0x020305, 3), front + STEP * 3);
    island.position.y = h / 2 - 0.1;
    g.add(island);
  } else {
    const cam = plate(0.04, 0.04, 0.02, dark(0x0b0e12, 3), front + STEP * 3);
    cam.position.y = h / 2 - bezel / 2;
    g.add(cam);
  }
  const sheen = glareTexture();
  own.push(sheen);
  g.add(glare(sheen, w - 2 * bezel, h - 2 * bezel, Math.max(0.02, r - bezel), front + STEP * 4));
  // the back: matte glass, and a camera bump on a phone
  const back = plate(w - 0.02, h - 0.02, r - 0.01, new THREE.MeshStandardMaterial({ color: 0x1f252d, roughness: 0.5, metalness: 0.15 }), -front - 0.0008);
  back.rotation.y = Math.PI;
  g.add(back);
  if (phone) {
    const bump = new THREE.Mesh(slabGeo(0.34, 0.34, 0.03, 0.08), metal(frame, 0.3));
    bump.position.set(-w / 2 + 0.22, h / 2 - 0.22, -front - 0.014);
    g.add(bump);
    [
      [-0.07, 0.07],
      [0.07, 0.07],
      [0, -0.07],
    ].forEach(([x, y]) => {
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.012, 20), new THREE.MeshStandardMaterial({ color: 0x0a0d12, roughness: 0.15, metalness: 0.6 }));
      lens.rotation.x = Math.PI / 2;
      lens.position.set(bump.position.x + x, bump.position.y + y, -front - 0.03);
      g.add(lens);
    });
    // the side buttons
    [
      [-w / 2 - 0.003, 0.34, 0.2],
      [-w / 2 - 0.003, 0.1, 0.13],
      [w / 2 + 0.003, 0.22, 0.26],
    ].forEach(([x, y, hh]) => {
      const bt = new THREE.Mesh(new THREE.BoxGeometry(0.012, hh, 0.03), metal(frame, 0.35));
      bt.position.set(x, y, 0);
      g.add(bt);
    });
  }
  return {
    type,
    group: g,
    screen: { mesh: picture, mat, w: w - 2 * bezel, h: h - 2 * bezel, parent: g },
    tagObj: marker(g, -w / 2 + bezel + 0.02, h / 2 - bezel - 0.02, front + 0.01),
    centerObj: marker(g, 0, 0, front + 0.01),
    topObj: marker(g, 0, h / 2 + 0.06, 0),
    cy: 0,
    extent: { w, h },
    textures: own,
    power(v) {
      mat.color.setScalar(v);
    },
    open() {},
    tick() {},
  };
}

export function makePhone(tex: THREE.Texture | null): Device {
  return makeSlate({ w: 0.74, h: 1.52, d: 0.085, r: 0.12, bezel: 0.036, tex, frame: 0x9aa3ad, phone: true, type: "phone" });
}

export function makeTablet(tex: THREE.Texture | null): Device {
  return makeSlate({ w: 2.5, h: 1.6, d: 0.07, r: 0.11, bezel: 0.075, tex, frame: AL, phone: false, type: "tablet" });
}

/** The key deck of a laptop, drawn once: keys, a space bar, a trackpad. */
function deckTexture(): THREE.CanvasTexture {
  return canvasTexture(
    1024,
    704,
    (g, w, h) => {
      const bg = g.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#bfc5cc");
      bg.addColorStop(1, "#a9b0b8");
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);
      g.fillStyle = "#101318";
      g.beginPath();
      g.roundRect(46, 56, w - 92, 396, 14);
      g.fill();
      const rows = [14, 14, 14, 13, 12];
      let y = 72;
      rows.forEach((n, r) => {
        const kw = (w - 92 - 28 - (n - 1) * 8) / n;
        const kh = r === 0 ? 40 : 62;
        for (let i = 0; i < n; i++) {
          g.fillStyle = "#222730";
          g.beginPath();
          g.roundRect(60 + i * (kw + 8), y, kw, kh, 7);
          g.fill();
          g.fillStyle = "rgba(255,255,255,0.05)";
          g.fillRect(64 + i * (kw + 8), y + 2, kw - 8, 3);
        }
        y += kh + 9;
      });
      g.fillStyle = "#222730";
      g.beginPath();
      g.roundRect(300, y - 4, 424, 56, 9);
      g.fill();
      g.fillStyle = "rgba(255,255,255,0.1)";
      g.beginPath();
      g.roundRect(330, 490, 364, 190, 18);
      g.fill();
      g.strokeStyle = "rgba(25,23,22,0.28)";
      g.lineWidth = 2;
      g.stroke();
    },
    8,
  );
}

export function makeLaptop(tex: THREE.Texture | null): Device {
  const W = 3.2;
  const D = 2.15;
  const T = 0.12;
  const LH = 2.12; // the lid
  const g = new THREE.Group();
  const own: THREE.Texture[] = [];
  const alu = metal(AL, 0.32);
  // the base lies flat: its top is at y = T, its back edge at z = -D/2
  const baseGeo = slabGeo(W, D, T, 0.1);
  baseGeo.rotateX(-Math.PI / 2);
  const base = new THREE.Mesh(baseGeo, alu);
  base.position.y = T / 2;
  g.add(base);
  const deckTex = deckTexture();
  own.push(deckTex);
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.06, D - 0.06), new THREE.MeshStandardMaterial({ map: deckTex, roughness: 0.55, metalness: 0.3 }));
  deck.rotation.x = -Math.PI / 2;
  deck.position.set(0, T + 0.0015, 0);
  g.add(deck);
  const hingeY = T;
  const hingeZ = -D / 2 + 0.03;
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, W * 0.62, 16), metal(GRAPHITE, 0.4));
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, hingeY, hingeZ);
  g.add(hinge);

  // the lid turns about the hinge: standing straight up is 0 here, folded flat over the keys is PI/2
  const lid = new THREE.Group();
  lid.position.set(0, hingeY, hingeZ);
  g.add(lid);
  const shell = new THREE.Mesh(slabGeo(W, LH, 0.07, 0.09), alu);
  shell.position.y = LH / 2 + 0.03;
  lid.add(shell);
  const front = 0.035;
  const glass = plate(W - 0.07, LH - 0.07, 0.07, dark(0x04060a, 1), front + STEP);
  glass.position.y = LH / 2 + 0.03;
  lid.add(glass);
  const sw = 2.96;
  const sh = 1.85;
  const mat = screenMaterial(tex);
  const screen = plate(sw, sh, 0.02, mat, front + STEP * 2);
  screen.position.y = LH / 2;
  lid.add(screen);
  const notch = plate(0.34, 0.06, 0.028, dark(0x020305, 3), front + STEP * 3);
  notch.position.y = screen.position.y + sh / 2 - 0.03;
  lid.add(notch);
  const sheen = glareTexture();
  own.push(sheen);
  const gl = glare(sheen, sw, sh, 0.02, front + STEP * 4);
  gl.position.y = screen.position.y;
  lid.add(gl);
  // the outside of the lid: a small mark of the brand's green
  const logo = plate(0.2, 0.2, 0.1, new THREE.MeshBasicMaterial({ color: 0x73c94a, toneMapped: false }), -front - 0.0012);
  logo.rotation.y = Math.PI;
  logo.position.y = LH / 2 + 0.03;
  lid.add(logo);

  const open = (v: number) => {
    lid.rotation.x = THREE.MathUtils.lerp(Math.PI / 2 - 0.02, -0.3, v);
  };
  open(0);
  return {
    type: "laptop",
    group: g,
    screen: { mesh: screen, mat, w: sw, h: sh, parent: lid },
    tagObj: marker(lid, -sw / 2 + 0.05, screen.position.y + sh / 2 - 0.05, front + 0.01),
    centerObj: marker(lid, 0, screen.position.y, front + 0.01),
    topObj: marker(lid, 0, LH + 0.1, 0),
    cy: 1.08,
    extent: { w: W, h: LH * 0.95 },
    textures: own,
    power(v) {
      mat.color.setScalar(v);
    },
    open,
    tick() {},
  };
}

/** A desktop display on a slim stand: a thin aluminium panel (16:9, or wide when `wide`), a neck and a flat foot. */
export function makeMonitor(tex: THREE.Texture | null, wide = false): Device {
  const sw = wide ? 7.4 : 5.8;
  const sh = wide ? sw / 2.1 : (sw * 9) / 16;
  const bz = 0.17;
  const W = sw + 2 * bz;
  const H = sh + 2 * bz;
  const D = 0.11;
  const LIFT = 1.2; // the bottom edge of the panel above the desk
  const g = new THREE.Group();
  const alu = metal(AL, 0.32);
  const panel = new THREE.Group();
  panel.position.y = LIFT + H / 2;
  g.add(panel);
  panel.add(new THREE.Mesh(slabGeo(W, H, D, 0.09), alu));
  const front = D / 2;
  panel.add(plate(W - 0.03, H - 0.03, 0.07, dark(0x04060a, 1), front + STEP));
  const mat = screenMaterial(tex);
  const screen = plate(sw, sh, 0.02, mat, front + STEP * 2);
  panel.add(screen);
  const sheen = glareTexture();
  panel.add(glare(sheen, sw, sh, 0.02, front + STEP * 4));
  // the neck stands behind the middle of the panel; the foot lies on the desk
  const neck = new THREE.Mesh(slabGeo(0.62, LIFT + H * 0.45, 0.1, 0.05), alu);
  neck.position.set(0, (LIFT + H * 0.45) / 2, -D / 2 - 0.12);
  g.add(neck);
  const footGeo = slabGeo(2.5, 1.5, 0.09, 0.14);
  footGeo.rotateX(-Math.PI / 2);
  const foot = new THREE.Mesh(footGeo, alu);
  foot.position.set(0, 0.045, -0.1);
  g.add(foot);
  return {
    type: "monitor",
    group: g,
    screen: { mesh: screen, mat, w: sw, h: sh, parent: panel },
    tagObj: marker(panel, -sw / 2 + 0.06, sh / 2 - 0.06, front + 0.01),
    centerObj: marker(panel, 0, 0, front + 0.01),
    topObj: marker(panel, 0, H / 2 + 0.08, 0),
    cy: LIFT + H / 2,
    extent: { w: W, h: LIFT + H },
    textures: [sheen],
    power(v) {
      mat.color.setScalar(v);
    },
    open() {},
    tick() {},
  };
}
