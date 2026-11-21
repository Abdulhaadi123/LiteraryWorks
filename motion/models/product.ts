import * as THREE from "three";
import { clamp01, lerp, smooth } from "../engine";
import { makePhone, SCREEN_PX } from "../devices";
import { drawn, fillRR } from "./parts";
import { mat, put, rbox, shadow } from "./real";
import type { Model, ModelBuilder } from "./types";

/**
 * Build it as one product. A premium white box on the table with our mark on the lid; as the page scrolls the lid
 * lifts away and the phone inside, with one of our apps on it, rises a little from its tray and lights up.
 */

const W = 2.7; // the box, left to right
const D = 3.4; // front to back
const H = 0.7; // the base's height
const LH = 0.36; // the lid's height
const PS = 1.45; // the phone's scale

const build: ModelBuilder = async (env, mini) => {
  const group = new THREE.Group();
  const k = mini ? 0.62 : 1;
  const app = await env.shot("phone-faith1", Math.round(SCREEN_PX.phone[0] * k), Math.round(SCREEN_PX.phone[1] * k));

  /* ---- the base: a tray with walls, a paper insert and the phone lying in it ---- */
  const white = mat.white(0.5);
  const inside = mat.plastic(0xf3f5f7, 0.8);
  put(group, rbox(W, 0.06, D, 0.03), white, 0, 0.03, 0);
  [-1, 1].forEach((s) => {
    put(group, rbox(0.06, H, D, 0.02), white, (s * (W - 0.06)) / 2, H / 2, 0);
    put(group, rbox(W, H, 0.06, 0.02), white, 0, H / 2, (s * (D - 0.06)) / 2);
  });
  put(group, rbox(W - 0.12, 0.04, D - 0.12, 0.01), inside, 0, H - 0.16, 0);
  // the recess the phone sits in
  put(group, rbox(0.74 * PS + 0.1, 0.02, 1.52 * PS + 0.1, 0.06), mat.plastic(0xe4e8ec, 0.85), -0.35, H - 0.13, 0.05);
  const phone = makePhone(app);
  env.textures.push(...phone.textures);
  const P = new THREE.Group();
  P.add(phone.group);
  phone.group.rotation.x = -Math.PI / 2;
  P.scale.setScalar(PS);
  P.position.set(-0.35, H - 0.1, 0.05);
  group.add(P);
  // a small welcome card beside it
  const card = drawn(env, 256, 400, (g, w, h) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, w, h);
    fillRR(g, 28, 32, 48, 48, 10, "#73c94a");
    g.fillStyle = "#22425f";
    g.font = "700 30px Inter, system-ui, sans-serif";
    g.textBaseline = "alphabetic";
    g.fillText("Your system,", 28, 136);
    g.fillText("built as one.", 28, 172);
    [0.8, 0.65, 0.75, 0.5].forEach((q, i) => fillRR(g, 28, 220 + i * 30, (w - 56) * q, 10, 5, "rgba(34,66,95,0.18)"));
  });
  const c = put(group, new THREE.PlaneGeometry(0.62, 0.97), mat.paper(card), 0.78, H - 0.135, 0.1);
  c.rotation.x = -Math.PI / 2;
  c.rotation.z = -0.06;
  group.add(shadow(env, W + 1.6, D + 1.4, 0.28, 0, 0));

  /* ---- the lid, with our mark on top ---- */
  const top = drawn(env, 512, 640, (g, w, h) => {
    g.fillStyle = "#f6f8fa";
    g.fillRect(0, 0, w, h);
    // the mark: a navy L holding a green W
    g.fillStyle = "#22425f";
    g.fillRect(196, 236, 22, 120);
    g.fillRect(196, 334, 120, 22);
    g.strokeStyle = "#73c94a";
    g.lineWidth = 18;
    g.lineJoin = "round";
    g.beginPath();
    g.moveTo(232, 262);
    g.lineTo(254, 318);
    g.lineTo(272, 282);
    g.lineTo(290, 318);
    g.lineTo(312, 262);
    g.stroke();
    g.fillStyle = "#22425f";
    g.font = "700 40px Inter, system-ui, sans-serif";
    g.textAlign = "center";
    g.fillText("LiteraryWorks", w / 2, 430);
  });
  const lid = new THREE.Group();
  put(lid, rbox(W + 0.08, LH, D + 0.08, 0.04), white, 0, 0, 0);
  const face = put(lid, new THREE.PlaneGeometry(W - 0.1, D - 0.1), new THREE.MeshStandardMaterial({ map: top, roughness: 0.5 }), 0, LH / 2 + 0.002, 0);
  face.rotation.x = -Math.PI / 2;
  group.add(lid);

  const model: Model = {
    group,
    tags: [],
    camera: { az: [-0.3, 0.18], elev: [0.5, 0.42] },
    floorY: 0,
    set(_a, _l, p) {
      // the lid lifts, swings back and comes to lean against the back of the box
      const t = smooth(clamp01((p - 0.06) / 0.5));
      const lift = Math.sin(Math.PI * t) * 0.5;
      lid.position.set(0, lerp(H + LH / 2 - 0.12, H + 0.95, t) + lift, lerp(0, -(D / 2 + 0.45), t));
      lid.rotation.x = lerp(0, -1.22, t);
      // then the phone rises a little and wakes
      const r = smooth(clamp01((p - 0.45) / 0.4));
      P.position.y = H - 0.1 + r * 0.22;
      P.rotation.x = -r * 0.12;
      phone.power(0.25 + 0.75 * r);
    },
    frame: () => ({ cx: 0, cy: 0.8, hw: 2.4, hh: 1.6 }),
  };
  model.set(1, 1, 0);
  return model;
};

export default build;
