import * as THREE from "three";
import { clamp01, lerp, smooth } from "../engine";
import { makeTablet, SCREEN_PX } from "../devices";
import { rng } from "./env";
import { drawn, fillRR } from "./parts";
import { mat, put, rbox, screenFader, shadow, standFor } from "./real";
import type { Model, ModelBuilder } from "./types";

/**
 * Enterprise software: the operations an ERP runs. A steel shelf of stock, a handheld scanner reading each box's label
 * (the label turns green once it is in the system) and a rugged tablet showing our operations platforms.
 */
const build: ModelBuilder = async (env, mini) => {
  const group = new THREE.Group();
  const k = mini ? 0.62 : 1;
  const shots = await Promise.all(["kalibur", "/cases/fleet-logistics-platform"].map((n) => env.shot(n, Math.round(SCREEN_PX.tablet[0] * k), Math.round(SCREEN_PX.tablet[1] * k))));
  const rnd = rng(11);

  /* ---- the shelf ---- */
  const steel = mat.alu(0xa3acb6, 0.42);
  [-2.3, 2.3].forEach((x) => [-0.65, 0.65].forEach((z) => put(group, rbox(0.09, 3.3, 0.09, 0.02), steel, x, 1.65, z)));
  const levels = [0.3, 1.4, 2.5];
  levels.forEach((y) => put(group, rbox(4.75, 0.06, 1.42, 0.02), steel, 0, y, 0));
  group.add(shadow(env, 6.6, 3.4, 0.28, 0, 0.1));

  /* ---- boxes, each with a label ---- */
  const kraft = mat.plastic(0xc9a271, 0.85);
  const tape = mat.plastic(0xdcc196, 0.6);
  const labelTex = drawn(env, 256, 160, (g, w, h) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, w, h);
    fillRR(g, 14, 14, 120, 12, 6, "rgba(25,23,22,0.6)");
    fillRR(g, 14, 34, 80, 9, 4.5, "rgba(25,23,22,0.3)");
    g.fillStyle = "#191716";
    for (let x = 14; x < w - 14; x += 6 + ((x * 7) % 5)) g.fillRect(x, 70, (x % 3) + 2, 70);
  });
  const greenTex = drawn(env, 128, 128, (g, w, h) => {
    g.beginPath();
    g.arc(w / 2, h / 2, 54, 0, Math.PI * 2);
    g.fillStyle = "#5db536";
    g.fill();
    g.strokeStyle = "#fff";
    g.lineWidth = 12;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(w * 0.3, h * 0.52);
    g.lineTo(w * 0.45, h * 0.66);
    g.lineTo(w * 0.72, h * 0.36);
    g.stroke();
  });
  const labels: { badge: THREE.Mesh; at: THREE.Vector3 }[] = [];
  levels.forEach((y, row) => {
    let x = -2.15;
    while (x < 2.0) {
      const bw = 0.8 + rnd() * 0.55;
      const bh = 0.55 + rnd() * 0.35;
      const bd = 0.9 + rnd() * 0.25;
      if (x + bw > 2.2) break;
      const b = new THREE.Group();
      b.position.set(x + bw / 2, y + 0.03 + bh / 2, 0.05);
      put(b, rbox(bw, bh, bd, 0.02, 2), kraft, 0, 0, 0);
      put(b, new THREE.BoxGeometry(0.16, 0.004, bd + 0.004), tape, 0, bh / 2 + 0.002, 0);
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.26), new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.8 }));
      lab.position.set(0, -bh * 0.12, bd / 2 + 0.003);
      b.add(lab);
      const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshBasicMaterial({ map: greenTex, transparent: true, toneMapped: false }));
      badge.position.set(0.24, -bh * 0.12 + 0.1, bd / 2 + 0.006);
      b.add(badge);
      group.add(b);
      if (row < 2) labels.push({ badge, at: new THREE.Vector3(b.position.x, b.position.y - bh * 0.12, b.position.z + bd / 2) });
      else badge.visible = false;
      x += bw + 0.12;
    }
  });

  /* ---- the scanner ---- */
  const scanner = new THREE.Group();
  const body = mat.plastic(0x2c3139, 0.5);
  put(scanner, rbox(0.46, 0.26, 0.32, 0.06), body, 0, 0, 0);
  const grip = put(scanner, rbox(0.17, 0.6, 0.22, 0.06), body, 0, -0.34, 0.1);
  grip.rotation.x = -0.35;
  put(scanner, rbox(0.06, 0.14, 0.05, 0.02), mat.plastic(0x73c94a, 0.5), 0, -0.16, -0.13);
  put(scanner, new THREE.PlaneGeometry(0.3, 0.12), new THREE.MeshBasicMaterial({ color: 0xff5040, toneMapped: false }), 0, 0.0, -0.162).rotation.y = Math.PI;
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xff4a3a, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  group.add(scanner, beam);

  /* ---- the rugged tablet ---- */
  const tablet = makeTablet(shots[0]);
  env.textures.push(...tablet.textures);
  const bumper = put(tablet.group, rbox(2.66, 1.76, 0.12, 0.14), mat.rubber(0x2a2f36), 0, 0, -0.03);
  void bumper;
  const T = standFor(tablet, 0.22);
  T.position.set(3.7, 0, 1.4);
  T.rotation.y = -0.42;
  T.add(shadow(env, 4.2, 2.6, 0.3, 0, 0));
  group.add(T);
  const ft = screenFader(tablet.screen!, shots, [0.5]);

  const head = new THREE.Vector3();
  const target = new THREE.Vector3();
  const mid = new THREE.Vector3();
  const model: Model = {
    group,
    tags: [],
    camera: { az: [-0.3, 0.2], elev: [0.22, 0.16] },
    floorY: 0,
    set(_a, _l, p) {
      const f = clamp01(p) * (labels.length - 0.01);
      const i = Math.floor(f);
      const s = smooth(clamp01((f - i) * 1.6));
      const a = labels[i].at;
      const b = labels[Math.min(labels.length - 1, i + 1)].at;
      target.set(lerp(a.x, b.x, s), lerp(a.y, b.y, s), a.z);
      head.set(target.x + 0.25, target.y + 0.45, target.z + 1.35);
      scanner.position.copy(head);
      scanner.rotation.set(-0.3, 0.18, 0);
      // the beam: a thin fan from the scanner's window to the label
      mid.copy(head).add(target).multiplyScalar(0.5);
      beam.position.copy(mid);
      beam.lookAt(head);
      beam.rotateY(Math.PI / 2);
      beam.scale.set(head.distanceTo(target), 0.05, 1);
      labels.forEach((l, j) => {
        const on = j < i || (j === i && s > 0.5) ? 1 : 0;
        l.badge.visible = on > 0;
      });
      ft(p);
    },
    frame: () => ({ cx: 0.6, cy: 1.7, hw: 4.6, hh: 2.2 }),
  };
  model.set(1, 1, 0);
  return model;
};

export default build;
