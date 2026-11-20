import * as THREE from "three";
import { lerp, quint, TAU, win } from "../engine";
import { glass, glossy, marker, unlit } from "./parts";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * Enterprise software: a tower of screens. Three rings of our own projects turn on a green spine, each ring against
 * the one below, rising out of the sky onto a base as the page scrolls, with a light running up the spine.
 */

const SHOTS = ["alltrials", "kalibur", "drscribe", "assistant", "support", "cordial"];
const RINGS = 3;
const R = 1.95;
const PW = 1.5;
const PH = 0.94;
const SP = 1.18;
const Y0 = 1.0;

const build: ModelBuilder = async (env, mini) => {
  const group = new THREE.Group();
  const per = SHOTS.length;
  const texs = await Promise.all(SHOTS.map((s) => env.shot(s, 1024, 640)));

  /* ---- the base and the spine ---- */
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.75, 2.85, 0.16, 72), glossy(0xf4f7fa, 0.4, 0.6));
  base.position.y = 0.08;
  group.add(base);
  const baseRing = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.022, 8, 140), unlit(0x73c94a));
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.18;
  group.add(baseRing);
  const spineGeo = new THREE.CylinderGeometry(0.2, 0.2, 4.6, 24);
  spineGeo.translate(0, 2.3, 0);
  const spine = new THREE.Mesh(spineGeo, unlit(0x73c94a, 0.45));
  group.add(spine);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 4.6, 12).translate(0, 2.3, 0), unlit(0xffffff));
  group.add(core);
  const capGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.1, 40);
  const cap = new THREE.Mesh(capGeo, glossy(0x22425f, 0.3, 1));
  group.add(cap);

  /* ---- the rings of screens ---- */
  const rings = Array.from({ length: mini ? 2 : RINGS }, (_, k) => {
    const rg = new THREE.Group();
    group.add(rg);
    const panels = Array.from({ length: per }, (_, j) => {
      const panel = glass(env, texs[(j + k * 2) % per], PW, PH, { radius: 0.11, depth: 0.05, shadow: false });
      rg.add(panel.group);
      return panel;
    });
    return { rg, panels };
  });

  /* ---- lights that run up the spine ---- */
  const lightGeo = new THREE.SphereGeometry(0.09, 14, 10);
  const lights = [0, 1, 2, 3, 4].map(() => {
    const m = new THREE.Mesh(lightGeo, unlit(0xffffff));
    group.add(m);
    return m;
  });

  const frame: Frame = { cx: 0, cy: 2.3, hw: 3.9, hh: 3.3 };
  const model: Model = {
    group,
    tags: rings.map((_, k) => marker(group, R + 0.5, Y0 + k * SP + 0.3, 1.0)),
    camera: { az: [-0.3, 0.3], elev: [0.22, 0.16] },
    ground: true,
    floorY: 0,
    set(a, l, p) {
      const eS = quint(win(a, 0, 0.6));
      spine.scale.y = core.scale.y = Math.max(0.001, eS);
      const topY = Y0 + (rings.length - 1) * SP + 0.75;
      cap.position.y = lerp(0.2, topY + 0.05, eS);
      rings.forEach((ring, k) => {
        const e = quint(win(a, k * 0.12, 0.6 + k * 0.12));
        const rf = lerp(1.45, 1, e);
        ring.rg.position.y = Y0 + k * SP + (1 - e) * 2.2;
        ring.rg.rotation.y = (k % 2 ? -1 : 1) * (p * TAU * 0.6 + (1 - e) * 2.4) + k * 0.52;
        ring.panels.forEach((pn, j) => {
          const th = (j / per) * TAU;
          pn.group.position.set(Math.sin(th) * R * rf, 0, Math.cos(th) * R * rf);
          pn.group.rotation.y = th;
          pn.group.scale.setScalar(lerp(0.62, 1, e));
          (pn.body.material as THREE.MeshBasicMaterial[])[0].color.setScalar(lerp(0.8, 1, e));
        });
      });
      lights.forEach((m, i) => {
        const t = (((p * 2.5 + i / 5) % 1) + 1) % 1;
        m.position.y = lerp(0.2, topY, t);
        m.scale.setScalar(Math.max(0.001, l * Math.sin(t * Math.PI)));
      });
      frame.hw = lerp(4.0, 3.2, quint(win(a, 0, 0.7)));
      frame.hh = lerp(3.6, 3.0, eS);
      frame.cy = lerp(2.7, 2.3, eS);
    },
    frame: () => frame,
    dispose() {
      lightGeo.dispose();
      capGeo.dispose();
      spineGeo.dispose();
    },
  };
  model.set(0, 0, 0);
  return model;
};

export default build;
