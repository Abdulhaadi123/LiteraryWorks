import * as THREE from "three";
import { clamp01, lerp, smooth } from "../engine";
import { drawn, fillRR } from "./parts";
import { mat, put, rbox, shadow } from "./real";
import type { Model, ModelBuilder } from "./types";

/**
 * Tell us about the work: an envelope addressed to LiteraryWorks lies on the table with its flap open. As the page
 * scrolls a letter slides into it, the flap closes and a green seal goes on.
 */

const EW = 3.4; // the envelope
const ED = 2.2;
const OPEN = -ED / 2; // its opening, the far edge
const LW = 3.0; // the letter, folded
const LD = 2.0;

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();
  const env1 = new THREE.Group();
  env1.rotation.y = -0.14;
  group.add(env1);

  const paper = mat.paper(null, 0xfbfbf9);
  const front = drawn(env, 1024, 662, (g, w, h) => {
    g.fillStyle = "#fbfbf9";
    g.fillRect(0, 0, w, h);
    // the stamp, and who it is for
    fillRR(g, w - 170, 40, 120, 140, 10, "#73c94a");
    fillRR(g, w - 156, 54, 92, 112, 6, "rgba(255,255,255,0.35)");
    g.fillStyle = "#22425f";
    g.font = "600 34px Inter, system-ui, sans-serif";
    g.fillText("To", 380, 360);
    g.font = "700 52px Inter, system-ui, sans-serif";
    g.fillText("LiteraryWorks", 380, 420);
    fillRR(g, 380, 450, 300, 12, 6, "rgba(34,66,95,0.25)");
    fillRR(g, 380, 478, 220, 12, 6, "rgba(34,66,95,0.18)");
  });
  // the back panel, the letter's slot, and the front with the address
  put(env1, rbox(EW, 0.02, ED, 0.02), paper, 0, 0.01, 0);
  const top = put(env1, rbox(EW, 0.016, ED, 0.02), [paper, paper, mat.paper(front, 0xffffff), paper, paper, paper], 0, 0.052, 0);
  void top;

  /* ---- the flap, hinged at the opening ---- */
  const flapShape = new THREE.Shape();
  flapShape.moveTo(-EW / 2, 0);
  flapShape.lineTo(EW / 2, 0);
  flapShape.lineTo(0.18, -1.25);
  flapShape.quadraticCurveTo(0, -1.34, -0.18, -1.25);
  flapShape.closePath();
  const flapGeo = new THREE.ShapeGeometry(flapShape, 6).rotateX(-Math.PI / 2);
  const flap = new THREE.Group();
  flap.position.set(0, 0.062, OPEN);
  env1.add(flap);
  put(flap, flapGeo, new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.85, side: THREE.DoubleSide }), 0, 0, 0);
  const seal = put(flap, new THREE.CylinderGeometry(0.2, 0.2, 0.02, 40), mat.paint(0x5db536, 0.35), 0, 0.012, 1.08);

  /* ---- the letter ---- */
  const letter = drawn(env, 1024, 683, (g, w, h) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#22425f";
    g.font = "700 46px Inter, system-ui, sans-serif";
    g.fillText("About our work", 70, 110);
    fillRR(g, 70, 136, 120, 8, 4, "#73c94a");
    [0.86, 0.92, 0.7, 0.88, 0.8, 0.6].forEach((q, i) => fillRR(g, 70, 200 + i * 52, (w - 140) * q, 12, 6, "rgba(34,66,95,0.2)"));
    g.strokeStyle = "rgba(34,66,95,0.12)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, h / 2);
    g.lineTo(w, h / 2);
    g.stroke();
  });
  const sheet = put(env1, rbox(LW, 0.012, LD, 0.01, 1), [paper, paper, mat.paper(letter, 0xffffff), paper, paper, paper], 0, 0, 0);
  group.add(shadow(env, EW + 1.4, ED + 2.6, 0.26, 0, -0.6));

  const model: Model = {
    group,
    tags: [],
    camera: { az: [-0.16, 0.1], elev: [0.95, 0.86] },
    floorY: 0,
    set(_a, _l, p) {
      // the letter comes down onto the table behind the envelope, then slides in under the front
      const t = smooth(clamp01((p - 0.04) / 0.56));
      const z = lerp(OPEN - LD / 2 - 0.5, 0, t);
      const y = lerp(0.55, 0.032, smooth(clamp01(t * 1.6)));
      sheet.position.set(0, y, z);
      sheet.rotation.x = lerp(0.18, 0, smooth(clamp01(t * 1.6)));
      // then the flap closes over it and the seal goes on
      const f = smooth(clamp01((p - 0.62) / 0.28));
      // (open, it lies back on the table, so the letter is seen as it goes in)
      flap.rotation.x = lerp(-2.95, 0, f);
      seal.visible = f > 0.98;
    },
    frame: () => ({ cx: 0, cy: 0.3, hw: 2.2, hh: 1.9 }),
  };
  model.set(1, 1, 0);
  return model;
};

export default build;
