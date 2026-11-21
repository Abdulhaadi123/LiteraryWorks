import * as THREE from "three";
import { canvasTexture, fitUV, roundedShape } from "../kit";
import type { ModelEnv } from "./types";

/** Small helpers the models draw and build with: rounded rectangles on a canvas, drawn textures, a flat picture, a marker. */

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

/** A drawn picture (the inside of an app, a diagram ...) as a texture, freed with the scene. */
export function drawn(env: ModelEnv, w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
  const t = canvasTexture(w, h, draw, env.aniso);
  env.textures.push(t);
  return t;
}


/** A flat rounded picture facing +z that shows its colours exactly as drawn (like a screen: it is not lit). */
export function plane(tex: THREE.Texture, w: number, h: number, r = 0.05): THREE.Mesh {
  const geo = new THREE.ShapeGeometry(roundedShape(w, h, r), 8);
  fitUV(geo, w, h);
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
}


/** A small Object3D to hang a tag on. */
export function marker(parent: THREE.Object3D, x: number, y: number, z: number): THREE.Object3D {
  const o = new THREE.Object3D();
  o.position.set(x, y, z);
  parent.add(o);
  return o;
}
