import * as THREE from "three";
import { clamp01, lerp, smooth } from "../engine";
import { makePhone, SCREEN_PX } from "../devices";
import { drawn } from "./parts";
import { mat, put, rbox, shadow } from "./real";
import type { Model, ModelBuilder } from "./types";

/**
 * Build it as one product. A premium white box on the table with our mark on the lid; as the page scrolls the lid
 * lifts away and the two phones inside, with our Beanstalk and DreamyBot apps, rise a little from the tray and light up.
 */

const W = 2.7; // the box, left to right
const D = 3.4; // front to back
const H = 0.7; // the base's height
const LH = 0.36; // the lid's height
const PS = 1.45; // the phone's scale

const build: ModelBuilder = async (env, mini) => {
  const group = new THREE.Group();
  const k = mini ? 0.62 : 1;
  const apps = await Promise.all(["phone-beanstalk", "phone-dreamybot"].map((n) => env.shot(n, Math.round(SCREEN_PX.phone[0] * k), Math.round(SCREEN_PX.phone[1] * k))));

  /* ---- the base: a tray with walls, a paper insert and two phones lying in it ---- */
  const white = mat.white(0.5);
  const inside = mat.plastic(0xf3f5f7, 0.8);
  put(group, rbox(W, 0.06, D, 0.03), white, 0, 0.03, 0);
  [-1, 1].forEach((s) => {
    put(group, rbox(0.06, H, D, 0.02), white, (s * (W - 0.06)) / 2, H / 2, 0);
    put(group, rbox(W, H, 0.06, 0.02), white, 0, H / 2, (s * (D - 0.06)) / 2);
  });
  put(group, rbox(W - 0.12, 0.04, D - 0.12, 0.01), inside, 0, H - 0.16, 0);
  // two of our apps, each in its own recess
  const XS = [-0.62, 0.62];
  const phones = apps.map((app, i) => {
    put(group, rbox(0.74 * PS + 0.1, 0.02, 1.52 * PS + 0.1, 0.06), mat.plastic(0xe4e8ec, 0.85), XS[i], H - 0.13, 0.05);
    const phone = makePhone(app);
    env.textures.push(...phone.textures);
    const P = new THREE.Group();
    P.add(phone.group);
    phone.group.rotation.x = -Math.PI / 2;
    P.scale.setScalar(PS);
    P.position.set(XS[i], H - 0.1, 0.05);
    group.add(P);
    return { phone, P };
  });
  group.add(shadow(env, W + 1.6, D + 1.4, 0.28, 0, 0));

  /* ---- the lid, with our mark on top ---- */
  // (drawn at twice the size, so the lid's print stays sharp when the box fills the stage)
  const top = drawn(env, 1024, 1280, (g, w2, h2) => {
    g.scale(2, 2);
    const w = w2 / 2;
    const h = h2 / 2;
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
    camera: { az: [-0.12, 0.08], elev: [1.2, 1.12] },
    floorY: 0,
    set(_a, _l, p) {
      // the lid lifts, swings back and comes to lean against the back of the box
      const t = smooth(clamp01((p - 0.06) / 0.5));
      const lift = Math.sin(Math.PI * t) * 0.5;
      lid.position.set(0, lerp(H + LH / 2 - 0.12, H + 0.95, t) + lift, lerp(0, -(D / 2 + 0.45), t));
      lid.rotation.x = lerp(0, -1.22, t);
      // then the phone rises a little and wakes
      const r = smooth(clamp01((p - 0.45) / 0.4));
      phones.forEach(({ phone, P }, i) => {
        const q = smooth(clamp01((p - 0.45 - i * 0.12) / 0.35));
        // it comes up and leans toward the viewer, so its screen faces the eye; it tips about its lower edge (that edge stays
        // where it is, the top comes up), so no part of it sinks into the tray
        const lean = q * 0.3;
        P.position.y = H - 0.1 + q * 0.12 + 1.1 * Math.sin(lean);
        P.rotation.x = lean;
        phone.power(0.25 + 0.75 * q);
      });
    },
    frame: () => ({ cx: 0, cy: 0.5, hw: 1.55, hh: 1.5 }),
  };
  model.set(1, 1, 0);
  return model;
};

export default build;
