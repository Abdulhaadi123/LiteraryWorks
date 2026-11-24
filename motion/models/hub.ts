import * as THREE from "three";
import { clamp01, lerp, smooth } from "../engine";
import { drawn, fillRR } from "./parts";
import { cyl, GRAPHITE, mat, put, rbox, shadow, tube } from "./real";
import type { Model, ModelBuilder } from "./types";

/**
 * Connect: the pieces wired into one system. An aluminium hub on the table with five ports; as the page scrolls the
 * cables from the tools a business already uses plug in one after another, and each port's light turns green.
 */

const PORTS = [-1.2, -0.6, 0, 0.6, 1.2];
const FRONT = 0.65; // the hub's front face
const PY = 0.21; // the ports' height
const TRAVEL = 0.4; // how far a plug moves to go in
const CABLE = [0xf1f3f5, 0x2c3139, 0xf1f3f5, 0x2c3139, 0xf1f3f5];

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();

  /* ---- the hub ---- */
  put(group, rbox(3.2, 0.42, 1.3, 0.12, 4), mat.alu(0xc4cad1, 0.3), 0, 0.21, 0);
  put(group, rbox(3.0, 0.02, 1.1, 0.01), mat.paint(GRAPHITE, 0.35), 0, 0.425, 0);
  // (twice the pixels, and a larger label, so the words read from where the camera stands)
  const label = drawn(env, 1024, 320, (g, w2, h2) => {
    g.scale(2, 2);
    const w = w2 / 2;
    const h = h2 / 2;
    g.fillStyle = "#2c3139";
    g.fillRect(0, 0, w, h);
    fillRR(g, 30, 44, 72, 72, 14, "#73c94a");
    g.fillStyle = "#ffffff";
    g.font = "700 60px Inter, system-ui, sans-serif";
    g.textBaseline = "middle";
    g.fillText("One system", 126, 82);
  });
  const lab = put(group, new THREE.PlaneGeometry(1.7, 0.53), new THREE.MeshBasicMaterial({ map: label, toneMapped: false }), 0, 0.437, 0);
  lab.rotation.x = -Math.PI / 2;
  put(group, rbox(3.0, 0.04, 1.1, 0.02), mat.rubber(), 0, 0.02, 0);
  group.add(shadow(env, 5.6, 4.6, 0.26, 0, 1.2));

  const dark = new THREE.MeshBasicMaterial({ color: 0x15181c });
  const leds = PORTS.map((x) => {
    put(group, rbox(0.34, 0.15, 0.02, 0.03), dark, x, PY, FRONT + 0.001);
    const m = new THREE.MeshBasicMaterial({ color: 0x9aa3ad, toneMapped: false });
    put(group, new THREE.CircleGeometry(0.03, 20), m, x, 0.36, FRONT + 0.012);
    return m;
  });

  /* ---- the cables: each ends in a plug with a sleeve that slides along it as the plug goes in ---- */
  const plugs = PORTS.map((x, i) => {
    const jacket = mat.plastic(CABLE[i], 0.5);
    // the cable from the sleeve's back (when the plug is in) out over the table
    const spread = x * 0.7 + (i - 2) * 0.15;
    put(group, tube([[x, PY, FRONT + 0.7], [x, PY, FRONT + 1.15], [x + spread * 0.5, 0.06, FRONT + 1.7], [x + spread, 0.05, FRONT + 2.3]], 0.05, 48, 10), jacket, 0, 0, 0);
    const g = new THREE.Group();
    put(g, rbox(0.3, 0.13, 0.04, 0.01), mat.alu(0xd9dde2, 0.25), 0, 0, 0.02); // the metal tip
    put(g, rbox(0.4, 0.2, 0.3, 0.06), jacket, 0, 0, 0.19); // the body
    put(g, cyl(0.075, 0.075, 0.4, 24).rotateX(Math.PI / 2), jacket, 0, 0, 0.5); // the sleeve
    group.add(g);
    return { g, x };
  });

  const off = new THREE.Color(0x9aa3ad);
  const on = new THREE.Color(0x73c94a);
  const model: Model = {
    group,
    tags: [],
    camera: { az: [-0.22, 0.14], elev: [0.62, 0.52] },
    floorY: 0,
    set(_a, _l, p) {
      plugs.forEach((pl, i) => {
        // one after another: each plug has its own part of the scroll
        const u = smooth(clamp01((p - 0.06 - i * 0.16) / 0.18));
        pl.g.position.set(pl.x, PY, FRONT + lerp(TRAVEL, 0, u));
        leds[i].color.copy(off).lerp(on, clamp01((u - 0.85) / 0.15));
      });
    },
    frame: () => ({ cx: 0, cy: 0.4, hw: 3.4, hh: 1.4 }),
  };
  model.set(1, 1, 0);
  return model;
};

export default build;
