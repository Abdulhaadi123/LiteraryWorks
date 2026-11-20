import * as THREE from "three";
import type { Model } from "./types";

/**
 * Frames a model by what it really fills. Each model is posed in the states it passes through (opened out, closed up,
 * running), the visible solid parts are measured as the camera will see them (turned by the camera's azimuth), and the
 * box round all of it becomes the model's frame. Lights, glows and other additive layers are left out: they are not
 * the thing, only its light. A model that moves its own frame as it opens (`fit: false`) is left as it is.
 */
const STATES: [number, number, number][] = [
  [1, 1, 0.34],
  [1, 1, 0.62],
  [1, 1, 0.9],
  [0.05, 0, 0.05],
  [0.6, 0.3, 0.4],
];

export function fitFrame(model: Model, pad = 0.12): void {
  if (model.fit === false) return;
  const az = model.camera ? (model.camera.az[0] + model.camera.az[1]) / 2 : -0.07;
  const rot = new THREE.Matrix4().makeRotationY(-az);
  const m4 = new THREE.Matrix4();
  const box = new THREE.Box3();
  const b = new THREE.Box3();
  for (const [a, l, p] of [...STATES, ...(model.fitStates ?? [])]) {
    model.set(a, l, p);
    model.group.updateMatrixWorld(true);
    model.group.traverse((o) => {
      const mesh = o as THREE.Mesh;
      const line = o as THREE.Line;
      if (!mesh.isMesh && !line.isLine) return;
      for (let q: THREE.Object3D | null = o; q; q = q.parent) if (!q.visible) return;
      // the shadows on the floor live on layer 1 (they are left out of the mirror) and are not part of the thing
      if (!o.layers.isEnabled(0)) return;
      const mat = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.Material | undefined;
      if (mat && mat.blending === THREE.AdditiveBlending) return;
      const inst = o as THREE.InstancedMesh;
      if (inst.isInstancedMesh) {
        inst.computeBoundingBox();
        if (!inst.boundingBox) return;
        b.copy(inst.boundingBox);
      } else {
        const geo = mesh.geometry;
        if (!geo.boundingBox) geo.computeBoundingBox();
        if (!geo.boundingBox) return;
        b.copy(geo.boundingBox);
      }
      m4.multiplyMatrices(rot, mesh.matrixWorld);
      b.applyMatrix4(m4);
      if (Number.isFinite(b.min.x) && Number.isFinite(b.max.x)) box.union(b);
    });
  }
  if (box.isEmpty()) return;
  const yMin = Math.min(box.min.y, model.floorY ?? 0) - 0.9;
  const frame = { cx: (box.min.x + box.max.x) / 2 / Math.cos(az), cy: (yMin + box.max.y) / 2, hw: (box.max.x - box.min.x) / 2 + pad, hh: (box.max.y - yMin) / 2 + pad };
  model.frame = () => frame;
}
