import * as THREE from "three";

/**
 * The small set of parts every scene is built from: rounded glass-and-white panels with a drawn interface on their
 * face, a glossy blue core, thin beams with pulses, soft shadows. Everything is modelled in code, no files.
 */

export const COLOR = {
  ink: 0x191716,
  navy: 0x22425f,
  deep: 0x182f46,
  blue: 0x22425f,
  bright: 0x3e6d97,
  sky: 0x9dbbd3,
  pale: 0xd9e5ef,
  white: 0xffffff,
  green: 0x73c94a,
} as const;

/** A rounded rectangle centred on the origin. */
export function roundedShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h);
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r);
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

/** Texture coordinates that run 0..1 over the face of a shape that is `w` by `h` and centred on the origin. */
export function fitUV(geo: THREE.BufferGeometry, w: number, h: number) {
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);
  uv.needsUpdate = true;
}

export interface Panel {
  group: THREE.Group;
  body: THREE.Mesh;
  /** Half the panel's width and height (what a label points at). */
  hw: number;
  hh: number;
}

/**
 * A panel of glass with its interface on the face: a thin rounded slab with softly bevelled edges, the picture on
 * the front. The face shows its colours exactly as drawn (like a screen: it is not lit), the bevel catches the
 * studio light, and a soft shadow sits just behind: together that reads as an object and not a sticker.
 */
export function makePanel(w: number, h: number, tex: THREE.Texture, shadow: THREE.Texture | null, opts: { radius?: number; depth?: number } = {}): Panel {
  const bevel = 0.035;
  const depth = opts.depth ?? 0.06;
  const shape = roundedShape(w - bevel * 2, h - bevel * 2, (opts.radius ?? 0.16) - bevel);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 10,
    steps: 1,
  });
  geo.translate(0, 0, -depth / 2);
  fitUV(geo, w - bevel * 2, h - bevel * 2);
  // group 0 = the two faces, group 1 = the edge: the back face gets its own plain material (index 2), so a picture is never seen mirrored
  const caps = geo.groups.find((g) => g.materialIndex === 0);
  const sides = geo.groups.find((g) => g.materialIndex === 1);
  if (caps && sides) {
    const half = caps.count / 2;
    geo.clearGroups();
    geo.addGroup(caps.start, half, 2);
    geo.addGroup(caps.start + half, half, 0);
    geo.addGroup(sides.start, sides.count, 1);
  }
  const back = new THREE.MeshBasicMaterial({ color: 0xe6ecf1, toneMapped: false });
  const face = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  const edge = new THREE.MeshPhysicalMaterial({
    color: 0xd5dee6,
    roughness: 0.28,
    metalness: 0.25,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    envMapIntensity: 0.9,
  });
  const body = new THREE.Mesh(geo, [face, edge, back]);
  const group = new THREE.Group();
  group.add(body);
  if (shadow) {
    const sh = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 1.34, h * 1.5),
      new THREE.MeshBasicMaterial({ map: shadow, transparent: true, depthWrite: false, opacity: 0.55, toneMapped: false }),
    );
    sh.position.set(w * 0.015, -h * 0.07, -0.3);
    sh.renderOrder = -1;
    group.add(sh);
  }
  return { group, body, hw: w / 2, hh: h / 2 };
}

/** The soft shadow that sits behind a panel: a blurred rounded rectangle, deep blue and mostly clear. */
export function rectShadowTexture(): THREE.CanvasTexture {
  return canvasTexture(
    256,
    192,
    (g, w, h) => {
      // the shape is drawn off to the side; only its blurred shadow lands on the canvas
      g.translate(-w, 0);
      g.shadowColor = "rgba(18,36,54,0.95)";
      g.shadowBlur = 30;
      g.shadowOffsetX = w;
      g.fillStyle = "#000";
      g.beginPath();
      g.roundRect(w * 0.2, h * 0.22, w * 0.6, h * 0.56, 22);
      g.fill();
    },
    1,
  );
}

/* ---- pictures ---- */

/** Loads a picture of ours (a screenshot in public/) and resolves when it can be drawn; rejects after `ms` so a slow network never holds a scene back. */
export function loadImage(url: string, ms = 10000): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    const timer = window.setTimeout(() => reject(new Error("timeout " + url)), ms);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("failed " + url));
    };
    img.src = url;
  });
}

/* ---- textures ---- */

export function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, maxAniso = 8): THREE.CanvasTexture {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const g = cv.getContext("2d") as CanvasRenderingContext2D;
  draw(g, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = maxAniso;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  return t;
}

/** A soft round blob: the contact shadow under a floating thing, or the glow behind a light. */
export function blobTexture(rgb: string, peak: number): THREE.CanvasTexture {
  return canvasTexture(
    128,
    128,
    (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gr.addColorStop(0, `rgba(${rgb},${peak})`);
      gr.addColorStop(0.45, `rgba(${rgb},${peak * 0.38})`);
      gr.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
    },
    1,
  );
}

/* ---- the core: a glossy deep-blue sphere with a cool rim of light ---- */

export interface Core {
  group: THREE.Group;
  sphere: THREE.Mesh;
  mesh: THREE.Mesh;
  rings: THREE.Mesh[];
  sats: THREE.Mesh[];
  /** 0..1: how brightly the rim glows. */
  glow: { value: number };
}

export function makeCore(): Core {
  const group = new THREE.Group();
  const glow = { value: 0 };
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.2,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    envMapIntensity: 0.8,
  });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRim = { value: new THREE.Color(0x8fdc6a) };
    shader.uniforms.uLow = { value: new THREE.Color(0x0b1c2c) };
    shader.uniforms.uHigh = { value: new THREE.Color(0x3a6c99) };
    shader.uniforms.uGlow = glow;
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", "uniform vec3 uRim;\nuniform vec3 uLow;\nuniform vec3 uHigh;\nuniform float uGlow;\nvoid main() {")
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        vec3 wn = inverseTransformDirection(normalize(vNormal), viewMatrix);
        diffuseColor.rgb = mix(uLow, uHigh, smoothstep(-0.9, 0.9, wn.y + 0.25 * wn.x));`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        float rimF = pow(1.0 - saturate(dot(normalize(vNormal), normalize(vViewPosition))), 2.6);
        totalEmissiveRadiance += uRim * rimF * (0.3 + 0.8 * uGlow);`,
      );
  };
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), mat);
  group.add(sphere);

  // a fine mesh over the surface: the "network" the core is made of
  const mesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.012, 3),
    new THREE.MeshBasicMaterial({ color: 0xbcd0e0, wireframe: true, transparent: true, opacity: 0.13, depthWrite: false }),
  );
  group.add(mesh);

  // two thin orbits with a bright bead on each
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x73c94a, transparent: true, opacity: 0.75 });
  const rings: THREE.Mesh[] = [];
  const sats: THREE.Mesh[] = [];
  [
    { r: 1.5, tilt: [1.12, 0.0, 0.35] },
    { r: 1.74, tilt: [0.62, 0.0, -0.5] },
  ].forEach(({ r, tilt }) => {
    const pivot = new THREE.Group();
    pivot.rotation.set(tilt[0], tilt[1], tilt[2]);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.007, 8, 180), ringMat);
    ring.rotation.x = Math.PI / 2;
    pivot.add(ring);
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    bead.userData.r = r;
    pivot.add(bead);
    group.add(pivot);
    rings.push(pivot as unknown as THREE.Mesh);
    sats.push(bead);
  });
  return { group, sphere, mesh, rings, sats, glow };
}

/* ---- beams and pulses ---- */

export interface Beam {
  /** A thin cylinder, re-aimed between two points with `aim`. */
  mesh: THREE.Mesh;
  aim(a: THREE.Vector3, b: THREE.Vector3, grow: number): void;
}

const UP = new THREE.Vector3(0, 1, 0);
const tmpD = new THREE.Vector3();
const tmpQ = new THREE.Quaternion();

export function makeBeam(color: number, radius = 0.014): Beam {
  const geo = new THREE.CylinderGeometry(radius, radius, 1, 8, 1, true);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, depthWrite: false }));
  return {
    mesh,
    aim(a, b, grow) {
      tmpD.subVectors(b, a);
      const len = tmpD.length();
      if (len < 1e-4 || grow <= 0.001) {
        mesh.visible = false;
        return;
      }
      mesh.visible = true;
      tmpD.divideScalar(len);
      tmpQ.setFromUnitVectors(UP, tmpD);
      mesh.quaternion.copy(tmpQ);
      const L = len * grow;
      mesh.scale.set(1, L, 1);
      mesh.position.copy(a).addScaledVector(tmpD, L / 2);
    },
  };
}
