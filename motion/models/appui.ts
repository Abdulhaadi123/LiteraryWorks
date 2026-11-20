import * as THREE from "three";
import { lerp, quint, TAU, win } from "../engine";
import { makePhone, SCREEN_PX } from "../devices";
import { COLOR, makeBeam, type Beam } from "../kit";
import { C, dot, fillRR, glass, marker, plateTexture, skel, smoothstep } from "./parts";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * AI mobile apps: an app pulled apart. A phone with one of our own apps on its screen; the layers of that screen (the
 * header, the list, the navigation) and the things that pop out of an app (a notification, a chat reply, a like) lift
 * off it, one in front of the other, joined to the screen by lines.
 */

const CY = 1.95;
const S = 1.95; // the phone's scale

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();
  const [tw, th] = SCREEN_PX.phone;
  const tex = await env.shot("phone-civilchat", tw, th);
  const phone = makePhone(tex);
  env.textures.push(...phone.textures);
  phone.group.scale.setScalar(S);
  group.add(phone.group);

  /* ---- the layers ---- */
  const header = glass(env, plateTexture(env, 560, 140, (g) => {
    dot(g, 62, 70, 26, C.sky);
    skel(g, 110, 52, 220, 14, C.navy);
    skel(g, 110, 78, 130, 9);
    dot(g, 500, 70, 16, C.green);
  }), 1.1, 0.28, { radius: 0.1, depth: 0.04 });
  const list = glass(env, plateTexture(env, 540, 520, (g) => {
    [0, 1, 2].forEach((i) => {
      const y = 34 + i * 160;
      fillRR(g, 30, y, 480, 138, 26, C.soft);
      fillRR(g, 50, y + 20, 98, 98, 18, i === 1 ? C.green : C.sky);
      skel(g, 172, y + 34, 250, 14, C.navy);
      skel(g, 172, y + 62, 200, 10);
      skel(g, 172, y + 84, 150, 10);
    });
  }), 1.1, 1.06, { radius: 0.12, depth: 0.04 });
  const nav = glass(env, plateTexture(env, 560, 160, (g) => {
    [0, 1, 2, 3].forEach((i) => {
      const x = 80 + i * 134;
      if (i === 1) fillRR(g, x - 44, 38, 88, 84, 42, C.greenSoft);
      dot(g, x, 80, 17, i === 1 ? C.green : C.rule);
    });
  }), 1.1, 0.31, { radius: 0.1, depth: 0.04 });
  const note = glass(env, plateTexture(env, 720, 220, (g) => {
    dot(g, 80, 110, 40, C.navy);
    skel(g, 150, 70, 330, 16, C.navy);
    skel(g, 150, 104, 460, 11);
    skel(g, 150, 130, 360, 11);
    dot(g, 660, 62, 12, C.green);
  }), 1.75, 0.54, { radius: 0.12, depth: 0.04 });
  const bubble = glass(env, plateTexture(env, 560, 230, (g) => {
    fillRR(g, 30, 24, 500, 150, 48, C.navy);
    g.beginPath();
    g.moveTo(70, 170);
    g.lineTo(60, 214);
    g.lineTo(118, 172);
    g.fillStyle = C.navy;
    g.fill();
    [0, 1, 2].forEach((i) => dot(g, 190 + i * 90, 99, 20, i === 1 ? C.green : "rgba(255,255,255,0.8)"));
  }), 1.4, 0.58, { radius: 0.1, depth: 0.04 });
  const like = glass(env, plateTexture(env, 200, 200, (g) => {
    dot(g, 100, 100, 62, C.greenSoft);
    g.fillStyle = C.green;
    g.beginPath();
    g.moveTo(100, 140);
    g.bezierCurveTo(44, 100, 60, 56, 100, 84);
    g.bezierCurveTo(140, 56, 156, 100, 100, 140);
    g.fill();
  }), 0.5, 0.5, { radius: 0.25, depth: 0.04 });

  const rnd = env.rnd;
  const items = [
    { p: header, to: new THREE.Vector3(-0.2, CY + 1.2, 0.8), yaw: 0 },
    { p: list, to: new THREE.Vector3(0.25, CY + 0.05, 1.4), yaw: 0 },
    { p: nav, to: new THREE.Vector3(-0.15, CY - 1.25, 0.95), yaw: 0 },
    { p: note, to: new THREE.Vector3(1.9, CY + 1.75, 1.7), yaw: -0.2 },
    { p: bubble, to: new THREE.Vector3(-1.95, CY - 0.55, 1.8), yaw: 0.25 },
    { p: like, to: new THREE.Vector3(1.55, CY - 1.15, 2.0), yaw: -0.15 },
  ].map((it) => ({
    ...it,
    from: new THREE.Vector3((rnd() - 0.5) * 8, 0.5 + rnd() * 4, (rnd() - 0.4) * 3.5),
    fromYaw: (rnd() - 0.5) * 2.2,
    fromTilt: (rnd() - 0.5) * 0.7,
  }));
  items.forEach((it) => group.add(it.p.group));

  /* ---- lines from each layer to the screen under it ---- */
  const links: Beam[] = items.map(() => makeBeam(COLOR.green, 0.01));
  links.forEach((b) => group.add(b.mesh));
  const A = new THREE.Vector3();
  const B = new THREE.Vector3();

  const frame: Frame = { cx: 0, cy: CY, hw: 4.6, hh: 2.95 };
  const model: Model = {
    group,
    tags: [phone.tagObj, marker(list.group, -0.45, 0.5, 0.06), marker(note.group, -0.8, 0.22, 0.06)],
    camera: { az: [-0.5, 0.4], elev: [0.12, 0.1] },
    ground: true,
    floorY: 0,
    set(a, l, p) {
      const eP = quint(win(a, 0, 0.5));
      phone.group.position.set(0, lerp(2.9, CY, eP), lerp(1, 0, eP));
      phone.group.rotation.set(lerp(0.3, 0, eP), lerp(-0.7, -0.14, eP), lerp(-0.25, 0, eP));
      phone.power(lerp(0.8, 1, eP));
      items.forEach((it, i) => {
        const e = quint(win(a, 0.12 + i * 0.07, 0.75 + i * 0.05));
        const g = it.p.group;
        g.position.lerpVectors(it.from, it.to, e);
        g.rotation.set(lerp(it.fromTilt, 0, e), lerp(it.fromYaw, it.yaw, e), 0);
        // the floating things pop when the app is running
        g.scale.setScalar(i >= 3 ? lerp(1, 1 + 0.06 * Math.sin(p * TAU * 5 + i), l) : 1);
        A.copy(g.position);
        B.set(it.to.x * (i >= 3 ? 0.35 : 1), it.to.y, 0.1);
        links[i].aim(A, B, smoothstep(0.7, 1, e) * (i >= 3 ? 0.55 : 1));
        (links[i].mesh.material as THREE.MeshBasicMaterial).opacity = 0.6;
      });
      frame.hw = lerp(4.6, 3.3, quint(win(a, 0.1, 0.9)));
    },
    frame: () => frame,
  };
  model.set(0, 0, 0);
  return model;
};

export default build;
