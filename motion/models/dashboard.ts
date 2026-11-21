import * as THREE from "three";
import { clamp01, smooth } from "../engine";
import type { ScreenHandle } from "../devices";
import { SCREEN_PX } from "../devices";
import { drawn, fillRR, plane } from "./parts";
import { cyl, mat, put, rbox, screenFader, shadow } from "./real";
import type { Model, ModelBuilder, ModelEnv } from "./types";

/**
 * SaaS platforms: a product's dashboard (our SaaS projects) with the parts every SaaS product has standing out of it as
 * cards: usage in bars, plans with the chosen one in green, accounts with a switch, a donut of the mix. The bars grow,
 * the plan changes and the switch flips as the page scrolls.
 */
const card = (env: ModelEnv, w: number, h: number, title: number, px = 160) => {
  const g = new THREE.Group();
  put(g, rbox(w, h, 0.12, 0.1, 3), mat.white(0.22), 0, 0, 0);
  const face = drawn(env, Math.round(w * px), Math.round(h * px), (c, cw) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, cw, 400);
    fillRR(c, 22, 20, title, 12, 6, "rgba(34,66,95,0.45)");
    fillRR(c, 22, 42, title * 0.6, 9, 4.5, "rgba(34,66,95,0.18)");
  });
  const f = plane(face, w - 0.06, h - 0.06, 0.08);
  f.position.z = 0.062;
  g.add(f);
  return g;
};

const build: ModelBuilder = async (env, mini) => {
  const group = new THREE.Group();
  const k = mini ? 0.62 : 1;
  const shots = await Promise.all(["vendibly"].map((n) => env.shot(n, Math.round(SCREEN_PX.monitor[0] * k), Math.round(SCREEN_PX.monitor[1] * k))));

  /* ---- the product itself ---- */
  const main = new THREE.Group();
  main.position.set(0, 2.4, -0.8);
  // a display's dark bezel round the product, so it reads as a screen on a pale ground
  put(main, rbox(6.36, 3.72, 0.16, 0.16, 3), new THREE.MeshPhysicalMaterial({ color: 0x23282f, metalness: 0.4, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2 }), 0, 0, 0);
  const face = plane(shots[0], 6.0, 3.375, 0.08);
  face.position.z = 0.084;
  const fm = face.material as THREE.MeshBasicMaterial;
  fm.polygonOffset = true;
  fm.polygonOffsetFactor = -2;
  fm.polygonOffsetUnits = -2;
  main.add(face);
  const fade = screenFader({ mesh: face, mat: fm, w: 6, h: 3.375, parent: main } as ScreenHandle, shots, [0.4, 0.75]);
  group.add(main);
  group.add(shadow(env, 7.6, 3.2, 0.2, 0, -0.6));

  /* ---- usage, in bars ---- */
  const px = mini ? 110 : 160;
  const bars = card(env, 2.3, 1.6, 120, px);
  bars.position.set(-2.7, 1.25, 1.0);
  bars.rotation.y = 0.22;
  const barColors = [0x9dbbd3, 0x2f6fb5, 0x22425f, 0x73c94a, 0x2f6fb5];
  const heights = [0.45, 0.7, 0.55, 0.95, 0.8];
  const barMeshes = barColors.map((c, i) => {
    const b = put(bars, rbox(0.26, 1, 0.16, 0.04, 2).translate(0, 0.5, 0), mat.paint(c, 0.35), -0.8 + i * 0.4, -0.62, 0.14);
    return b;
  });
  group.add(bars);

  /* ---- plans: three, the chosen one in green ---- */
  const plans = card(env, 2.5, 1.3, 90, px);
  plans.position.set(2.6, 1.05, 1.4);
  plans.rotation.y = -0.3;
  const pills = [0, 1, 2].map((i) => put(plans, rbox(0.64, 0.36, 0.1, 0.17, 3), mat.paint(0xe8eef4, 0.4), -0.76 + i * 0.76, -0.22, 0.12));
  group.add(plans);

  /* ---- accounts, with a switch ---- */
  const users = card(env, 2.0, 1.0, 80, px);
  users.position.set(-2.4, 3.6, 0.5);
  users.rotation.y = 0.16;
  [0x22425f, 0x2f6fb5, 0x73c94a, 0x9dbbd3].forEach((c, i) => put(users, cyl(0.17, 0.17, 0.06, 32).rotateX(Math.PI / 2), mat.paint(c, 0.4), -0.6 + i * 0.26, -0.15, 0.1 + i * 0.002));
  const sw = new THREE.Group();
  sw.position.set(0.55, -0.15, 0.1);
  put(sw, new THREE.CapsuleGeometry(0.15, 0.32, 8, 20).rotateZ(Math.PI / 2), mat.paint(0x73c94a, 0.4), 0, 0, 0);
  const knob = put(sw, new THREE.SphereGeometry(0.13, 24, 16), mat.white(0.2), 0.16, 0, 0.06);
  const swMat = (sw.children[0] as THREE.Mesh).material as THREE.MeshPhysicalMaterial;
  users.add(sw);
  group.add(users);

  /* ---- a donut of the mix ---- */
  const mix = card(env, 1.8, 1.8, 70, px);
  mix.position.set(2.9, 3.3, 0.4);
  mix.rotation.y = -0.22;
  const arcs = [
    [0, 2.5, 0x22425f],
    [2.55, 1.9, 0x73c94a],
    [4.5, 1.7, 0x9dbbd3],
  ] as const;
  const segs = arcs.map(([start, len, c]) => {
    const s = put(mix, new THREE.TorusGeometry(0.5, 0.13, 16, 48, len), mat.paint(c, 0.4), 0, -0.12, 0.14);
    s.rotation.z = start;
    return s;
  });
  group.add(mix);

  const ON = new THREE.Color(0x73c94a);
  const cards = [bars, plans, users, mix];
  const base = cards.map((c) => c.position.y);
  const model: Model = {
    group,
    tags: [],
    camera: { az: [-0.28, 0.2], elev: [0.16, 0.1] },
    floorY: 0,
    set(_a, _l, p) {
      fade(p);
      barMeshes.forEach((b, i) => {
        b.scale.y = Math.max(0.02, heights[i] * (0.35 + 0.65 * smooth(clamp01(p * 1.6 - i * 0.08))));
      });
      const chosen = Math.min(2, Math.floor(clamp01(p) * 3));
      pills.forEach((pl, i) => ((pl.material as THREE.MeshPhysicalMaterial).color.setHex(i === chosen ? 0x73c94a : 0xe8eef4)));
      const on = smooth(clamp01((p - 0.42) * 6));
      knob.position.x = -0.16 + 0.32 * on;
      swMat.color.setHex(0x9dbbd3).lerp(ON, on);
      segs.forEach((s, i) => s.scale.setScalar(Math.max(0.001, smooth(clamp01(p * 2.2 - i * 0.25)))));
      cards.forEach((c, i) => (c.position.y = base[i] + Math.sin(p * Math.PI * 2 + i * 1.7) * 0.06));
    },
    frame: () => ({ cx: 0, cy: 2.4, hw: 4.2, hh: 2.4 }),
  };
  model.set(1, 1, 0);
  return model;
};

export default build;
