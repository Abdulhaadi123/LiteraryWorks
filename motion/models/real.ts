import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { clamp01, smooth } from "../engine";
import type { Device, ScreenHandle } from "../devices";
import { floorShadow } from "./glow";
import { drawn } from "./parts";
import type { ModelEnv } from "./types";

/**
 * The few things every real-looking model is made from: honest materials (brushed aluminium, white gloss, black
 * rubber, paper), rounded boxes, turned parts, tubes, a stand for a phone or a tablet, and a soft shadow on the floor.
 * Everything is modelled in code; nothing is loaded.
 */

export const mat = {
  alu: (color = 0xc9ced4, rough = 0.34) => new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: rough, envMapIntensity: 1.2, clearcoat: 0.1, clearcoatRoughness: 0.3 }),
  white: (rough = 0.34) => new THREE.MeshPhysicalMaterial({ color: 0xf4f6f8, metalness: 0, roughness: rough, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 0.9 }),
  paint: (color: number, rough = 0.3) => new THREE.MeshPhysicalMaterial({ color, metalness: 0.15, roughness: rough, clearcoat: 1, clearcoatRoughness: 0.15, envMapIntensity: 1 }),
  plastic: (color: number, rough = 0.45) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.05, envMapIntensity: 0.8 }),
  rubber: (color = 0x1b1e22) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0 }),
  paper: (map: THREE.Texture | null = null, color = 0xffffff) => new THREE.MeshStandardMaterial({ color, map, roughness: 0.9, metalness: 0, envMapIntensity: 0.5 }),
  glass: (opacity = 0.16) => new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.04, transparent: true, opacity, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6, depthWrite: false }),
  wood: (color = 0xc89a66) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0, envMapIntensity: 0.6 }),
};

export const GRAPHITE = 0x2c3139;

/** A box with softly rounded edges. */
export const rbox = (w: number, h: number, d: number, r = 0.04, seg = 3) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
/** A cylinder, standing on its middle. */
export const cyl = (rTop: number, rBottom: number, h: number, seg = 48) => new THREE.CylinderGeometry(rTop, rBottom, h, seg);
/** A turned part: `profile` is a list of [radius, height] points, from the bottom up. */
export const lathe = (profile: [number, number][], seg = 56) => new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), seg);
/** A bent tube through the points. */
export const tube = (points: [number, number, number][], radius: number, seg = 64, radial = 14) =>
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z))), seg, radius, radial, false);

/** Adds a mesh to `parent` at a place and returns it. */
export function put(parent: THREE.Object3D, geo: THREE.BufferGeometry, material: THREE.Material | THREE.Material[], x = 0, y = 0, z = 0): THREE.Mesh {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

/** A soft shadow on the floor, `w` by `d` (it stays out of the mirror). */
export const shadow = floorShadow;

/**
 * Lets the pictures on a screen follow one another as the scroll moves: at each of the points in `at` (by default evenly
 * spread) the next picture takes over, with a soft change between. Returns the function that poses it for a progress.
 */
export function screenFader(sc: ScreenHandle, textures: THREE.Texture[], at?: number[]): (p: number) => void {
  const n = textures.length;
  const points = at ?? Array.from({ length: Math.max(0, n - 1) }, (_, j) => (j + 1) / n);
  let overlay: THREE.Mesh | undefined;
  if (n > 1) {
    const m = new THREE.MeshBasicMaterial({ map: textures[1], transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
    m.polygonOffset = true;
    m.polygonOffsetFactor = -3;
    m.polygonOffsetUnits = -3;
    overlay = new THREE.Mesh(sc.mesh.geometry, m);
    overlay.position.copy(sc.mesh.position);
    overlay.visible = false;
    sc.parent.add(overlay);
  }
  const SOFT = 0.03;
  sc.mat.map = textures[0] ?? sc.mat.map;
  return (p) => {
    if (n < 2 || !overlay) return;
    let k = 0;
    let f = 0;
    for (let j = 0; j < points.length; j++) {
      const t = smooth(clamp01((p - (points[j] - SOFT)) / (2 * SOFT)));
      if (t >= 1) k = j + 1;
      else {
        if (t > 0) {
          k = j;
          f = t;
        }
        break;
      }
    }
    sc.mat.map = textures[k];
    const m = overlay.material as THREE.MeshBasicMaterial;
    m.map = textures[Math.min(k + 1, n - 1)];
    m.opacity = f;
    overlay.visible = f > 0.003;
  };
}

/** A slim aluminium keyboard (3.6 wide) with white keys, lying flat; its top is 0.09 above its origin. */
export function keyboard(env: ModelEnv): THREE.Group {
  const g = new THREE.Group();
  put(g, rbox(3.6, 0.09, 1.25, 0.05), mat.alu(0xc9ced4, 0.35), 0, 0.045, 0);
  const tex = drawn(env, 1024, 360, (c, w, h) => {
    c.fillStyle = "#c4c9cf";
    c.fillRect(0, 0, w, h);
    const rows = [14, 14, 14, 13, 11];
    let y = 22;
    rows.forEach((n, r) => {
      const kh = r === 0 ? 46 : 58;
      const kw = (w - 44 - (n - 1) * 8) / n;
      for (let i = 0; i < n; i++) {
        c.fillStyle = "#f6f7f9";
        c.beginPath();
        c.roundRect(22 + i * (kw + 8), y, kw, kh, 8);
        c.fill();
        c.strokeStyle = "rgba(34,66,95,0.18)";
        c.lineWidth = 2;
        c.stroke();
      }
      y += kh + 9;
    });
  });
  const top = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 1.15), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.2 }));
  top.rotation.x = -Math.PI / 2;
  top.position.y = 0.092;
  g.add(top);
  return g;
}

const slabShape = (w: number, h: number, r: number) => {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  return s;
};

/** A stand that holds a phone or a tablet leaning back: a low dock under its bottom edge and a wedge behind it. */
export function standFor(dev: Device, tilt: number): THREE.Group {
  const holder = new THREE.Group();
  const w = dev.extent.w;
  const h = dev.extent.h;
  const m = new THREE.MeshStandardMaterial({ color: GRAPHITE, metalness: 0.5, roughness: 0.4 });
  const dockH = 0.13;
  const d = 0.085;
  dev.group.rotation.x = -tilt;
  // the bottom edge of the device rests on the dock
  dev.group.position.set(0, dockH + (h / 2) * Math.cos(tilt) + (d / 2) * Math.sin(tilt), 0);
  holder.add(dev.group);
  const dockGeo = new THREE.ExtrudeGeometry(slabShape(w * 0.92, 0.62, 0.08), { depth: dockH, bevelEnabled: false, curveSegments: 6 });
  dockGeo.rotateX(-Math.PI / 2);
  put(holder, dockGeo, m, 0, 0, -0.14);
  // the wedge behind: its sloping face is the back of the device, so it is only seen from the side
  const rise = h * 0.55 * Math.cos(tilt);
  const run = h * 0.55 * Math.sin(tilt) + 0.25;
  const wedge = new THREE.Shape();
  wedge.moveTo(0, 0);
  wedge.lineTo(-run, 0);
  wedge.lineTo(0, rise);
  wedge.closePath();
  const depth = w * 0.5;
  const wedgeGeo = new THREE.ExtrudeGeometry(wedge, { depth, bevelEnabled: false });
  wedgeGeo.rotateY(-Math.PI / 2);
  wedgeGeo.translate(depth / 2, dockH, -(d / 2) - 0.02);
  put(holder, wedgeGeo, m);
  return holder;
}
