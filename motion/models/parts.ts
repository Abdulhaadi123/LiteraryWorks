import * as THREE from "three";
import { canvasTexture, fitUV, makePanel, roundedShape, type Panel } from "../kit";
import type { ModelEnv } from "./types";

/** The small set of parts the models are made from: glass panels, rounded slabs, drawn pictures, a few materials. */

/** The brand's colours as strings, for the drawn pictures. */
export const C = {
  ink: "#191716",
  line: "#e1e8ee",
  rule: "#c8d3dd",
  soft: "#edf2f6",
  navy: "#22425f",
  deep: "#162b40",
  bright: "#3e6d97",
  sky: "#9dbbd3",
  pale: "#d9e5ef",
  green: "#73c94a",
  greenSoft: "#e4f4da",
  amber: "#e8a317",
  white: "#ffffff",
};

export const glossy = (color: number, rough = 0.28, clear = 0.9): THREE.MeshPhysicalMaterial =>
  new THREE.MeshPhysicalMaterial({ color, roughness: rough, metalness: 0, clearcoat: clear, clearcoatRoughness: 0.12, envMapIntensity: 0.9 });

export const unlit = (color: number, opacity = 1): THREE.MeshBasicMaterial =>
  new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1, toneMapped: false });

/** A rounded rectangle path. */
export function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}
export function fillRR(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, color: string | CanvasGradient) {
  rr(g, x, y, w, h, r);
  g.fillStyle = color;
  g.fill();
}
/** A line of text drawn as a bar (so nothing on a drawn picture is a claim, and nothing depends on a font). */
export const skel = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h = 8, c = C.rule) => fillRR(g, x, y, w, h, h / 2, c);
export function dot(g: CanvasRenderingContext2D, x: number, y: number, r: number, c: string) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = c;
  g.fill();
}

/** A drawn picture (the inside of an app, a diagram ...) as a texture, freed with the scene. */
export function drawn(env: ModelEnv, w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
  const t = canvasTexture(w, h, draw, env.aniso);
  env.textures.push(t);
  return t;
}

/** A glass panel with a picture on its face (and a soft shadow behind it, unless told otherwise). */
export function glass(env: ModelEnv, tex: THREE.Texture, w: number, h: number, opts: { depth?: number; radius?: number; shadow?: boolean; back?: number } = {}): Panel {
  return makePanel(w, h, tex, opts.shadow === false ? null : env.shadow, { radius: opts.radius, depth: opts.depth, back: opts.back });
}

/** A rounded slab with a bevelled edge, centred on the origin, its front toward +z. */
export function slab(w: number, h: number, d: number, r: number, mat: THREE.Material | THREE.Material[]): THREE.Mesh {
  const b = Math.min(0.03, d / 3);
  const geo = new THREE.ExtrudeGeometry(roundedShape(w - 2 * b, h - 2 * b, Math.max(0.01, r - b)), { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 10 });
  geo.translate(0, 0, -(d - 2 * b) / 2);
  return new THREE.Mesh(geo, mat);
}

/** A thin pale plate of white and blue with a hairline edge: the card the drawn pictures are laid on. */
export function plateTexture(env: ModelEnv, w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, bg: [string, string] = [C.white, "#f2f5f8"]): THREE.CanvasTexture {
  return drawn(env, w, h, (g, cw, ch) => {
    const gr = g.createLinearGradient(0, 0, 0, ch);
    gr.addColorStop(0, bg[0]);
    gr.addColorStop(1, bg[1]);
    g.fillStyle = gr;
    g.fillRect(0, 0, cw, ch);
    draw(g, cw, ch);
    rr(g, 1.5, 1.5, cw - 3, ch - 3, Math.min(cw, ch) * 0.07);
    g.strokeStyle = "#cbd7e2";
    g.lineWidth = 3;
    g.stroke();
  });
}

/** A flat rounded picture facing +z that shows its colours exactly as drawn (like a screen: it is not lit). */
export function plane(tex: THREE.Texture, w: number, h: number, r = 0.05): THREE.Mesh {
  const geo = new THREE.ShapeGeometry(roundedShape(w, h, r), 8);
  fitUV(geo, w, h);
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** A small Object3D to hang a tag on. */
export function marker(parent: THREE.Object3D, x: number, y: number, z: number): THREE.Object3D {
  const o = new THREE.Object3D();
  o.position.set(x, y, z);
  parent.add(o);
  return o;
}
