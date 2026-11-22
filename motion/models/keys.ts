import * as THREE from "three";
import { clamp01, lerp, smooth } from "../engine";
import { drawn, fillRR } from "./parts";
import { cyl, mat, put, rbox, shadow } from "./real";
import type { Model, ModelBuilder } from "./types";

/**
 * Small releases, documented handover: the system becomes yours. Three ring binders of documentation stand on the
 * table (the runbook, the architecture, the handover notes); as the page scrolls a ring of keys with a green tag slides
 * across and comes to rest in front of them.
 */

const BINDERS = [
  { t: "Runbook", c: 0x22425f },
  { t: "Architecture", c: 0xf1f3f5 },
  { t: "Handover", c: 0x2f6fb5 },
];

function keyShape(): THREE.Shape {
  // the blade of a key, with its teeth along the lower edge
  const s = new THREE.Shape();
  s.moveTo(0, 0.07);
  s.lineTo(1.0, 0.07);
  s.lineTo(1.08, 0.0);
  s.lineTo(1.0, -0.07);
  const teeth = [0.92, 0.82, 0.72, 0.62, 0.52, 0.42];
  teeth.forEach((x, i) => {
    s.lineTo(x, -0.07 - (i % 2 ? 0.07 : 0.11));
    s.lineTo(x - 0.05, -0.07);
  });
  s.lineTo(0, -0.07);
  s.closePath();
  return s;
}

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();

  /* ---- the binders, standing side by side ---- */
  BINDERS.forEach((b, i) => {
    const g = new THREE.Group();
    g.position.set(-1.1 + i * 0.95, 0, -0.6);
    g.rotation.y = 0.04 - i * 0.03;
    group.add(g);
    const cover = b.c === 0xf1f3f5 ? mat.white(0.45) : mat.paint(b.c, 0.45);
    put(g, rbox(0.85, 3.0, 2.3, 0.05), cover, 0, 1.5, 0);
    const label = drawn(env, 128, 512, (c, w, h) => {
      c.fillStyle = "#ffffff";
      c.fillRect(0, 0, w, h);
      fillRR(c, 0, 0, w, 14, 0, "#73c94a");
      c.save();
      c.translate(w / 2 + 14, h - 40);
      c.rotate(-Math.PI / 2);
      c.fillStyle = "#22425f";
      c.font = "700 46px Inter, system-ui, sans-serif";
      c.textBaseline = "middle";
      c.fillText(b.t, 0, 0);
      c.restore();
    });
    // the spine faces the camera, with its label and a finger hole
    put(g, new THREE.PlaneGeometry(0.5, 1.9), new THREE.MeshStandardMaterial({ map: label, roughness: 0.6 }), 0, 1.75, 1.152);
    put(g, cyl(0.1, 0.1, 0.02, 32).rotateX(Math.PI / 2), mat.plastic(0x1b1e22, 0.6), 0, 0.5, 1.152);
  });

  /* ---- the keys on their ring, with a tag ---- */
  const keys = new THREE.Group();
  group.add(keys);
  const brass = mat.alu(0xd6c08a, 0.28);
  const steel = mat.alu(0xcfd4da, 0.22);
  put(keys, new THREE.TorusGeometry(0.34, 0.03, 12, 48), steel, 0, 0.03, 0).rotation.x = Math.PI / 2;
  const blade = new THREE.ExtrudeGeometry(keyShape(), { depth: 0.04, bevelEnabled: false });
  [
    { m: brass, a: 0.5 },
    { m: steel, a: -0.35 },
  ].forEach(({ m, a }) => {
    const k = new THREE.Group();
    k.rotation.y = a;
    keys.add(k);
    // the bow: a flat ring, then the blade
    put(k, new THREE.TorusGeometry(0.2, 0.06, 12, 40), m, 0.55, 0.03, 0).rotation.x = Math.PI / 2;
    const bl = put(k, blade, m, 0.72, 0.01, 0);
    bl.rotation.x = -Math.PI / 2;
  });
  const tagTex = drawn(env, 256, 160, (g, w, h) => {
    fillRR(g, 0, 0, w, h, 26, "#73c94a");
    g.fillStyle = "#191716";
    g.font = "700 54px Inter, system-ui, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("Yours", w / 2 + 14, h / 2 + 4);
    g.beginPath();
    g.arc(34, h / 2, 14, 0, Math.PI * 2);
    g.fillStyle = "#ffffff";
    g.fill();
  });
  const tag = put(keys, rbox(0.7, 0.03, 0.44, 0.06), [mat.paint(0x73c94a, 0.5), mat.paint(0x73c94a, 0.5), new THREE.MeshStandardMaterial({ map: tagTex, roughness: 0.5 }), mat.paint(0x73c94a, 0.5), mat.paint(0x73c94a, 0.5), mat.paint(0x73c94a, 0.5)], -0.62, 0.02, 0.2);
  tag.rotation.y = 0.3;
  group.add(shadow(env, 4.4, 3.6, 0.26, 0, -0.3));
  const keyShadow = shadow(env, 2.4, 1.2, 0.22, 0, 0);
  group.add(keyShadow);

  const model: Model = {
    group,
    tags: [],
    camera: { az: [-0.3, 0.18], elev: [0.34, 0.28] },
    floorY: 0,
    set(_a, _l, p) {
      // the keys slide in from the right, turning as they go, and settle in front of the binders
      const t = smooth(clamp01((p - 0.06) / 0.6));
      const x = lerp(3.6, 0.1, t);
      const z = lerp(2.2, 1.55, t);
      keys.position.set(x, 0.0, z);
      keys.rotation.y = lerp(1.6, 0.25, t);
      keyShadow.position.set(x, 0.012, z);
    },
    frame: () => ({ cx: 0.2, cy: 1.3, hw: 2.4, hh: 1.6 }),
  };
  model.set(1, 1, 0);
  return model;
};

export default build;
