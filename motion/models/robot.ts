import * as THREE from "three";
import { lerp, smooth } from "../engine";
import { makeMonitor, SCREEN_PX } from "../devices";
import { drawn, fillRR, marker, rr } from "./parts";
import { cyl, mat, put, rbox, screenFader, shadow } from "./real";
import type { Model, ModelBuilder } from "./types";

/**
 * AI and automation: a collaborative robot arm sorts requests. It lifts each one off the inbox, carries it over and sets
 * it in the done tray with a green check, one after another as the page scrolls, while the assistant that runs it
 * (one of our projects) is on the screen behind. A real arm: a base, a shoulder, an upper arm, an elbow, a forearm and a
 * wrist with a suction cup, posed from where its tip has to be (two-link inverse kinematics).
 */

const L1 = 2.5; // upper arm
const L2 = 2.2; // forearm
const TOOL = 0.85; // wrist to the suction cup
const BASE = new THREE.Vector3(0, 0.16, -0.5);
const SHOULDER = 0.8; // height of the shoulder axis above the floor
const IN: [number, number] = [-2.1, 0.9];
const OUT: [number, number] = [2.1, 0.9];
const HOVER = 2.5;
const TRAY = 0.21; // the top of a tray's floor
const CARDS = 4;

const ACCENTS = ["#5db536", "#2f6fb5", "#22425f", "#e0a02a"];

const capsule = (r: number, len: number) => new THREE.CapsuleGeometry(r, Math.max(0.01, len - 2 * r), 8, 24).translate(0, len / 2, 0);

const build: ModelBuilder = async (env, mini) => {
  const group = new THREE.Group();
  const k = mini ? 0.62 : 1;
  const shots = await Promise.all(["assistant", "support"].map((n) => env.shot(n, Math.round(SCREEN_PX.monitor[0] * k), Math.round(SCREEN_PX.monitor[1] * k))));

  /* ---- the cell: a plate on the floor, two trays, the screen behind ---- */
  put(group, rbox(6.6, 0.16, 4.2, 0.06), mat.white(0.4), 0, 0.08, 0.1);
  const tray = (x: number, z: number) => {
    const g = new THREE.Group();
    g.position.set(x, 0.16, z);
    put(g, rbox(1.8, 0.05, 1.3, 0.02), mat.alu(0xd5dae0, 0.4), 0, 0.025, 0);
    put(g, rbox(1.8, 0.22, 0.06, 0.02), mat.alu(0xd5dae0, 0.4), 0, 0.11, 0.62);
    put(g, rbox(1.8, 0.22, 0.06, 0.02), mat.alu(0xd5dae0, 0.4), 0, 0.11, -0.62);
    put(g, rbox(0.06, 0.22, 1.3, 0.02), mat.alu(0xd5dae0, 0.4), 0.87, 0.11, 0);
    put(g, rbox(0.06, 0.22, 1.3, 0.02), mat.alu(0xd5dae0, 0.4), -0.87, 0.11, 0);
    group.add(g);
    return g;
  };
  tray(IN[0], IN[1]);
  tray(OUT[0], OUT[1]);
  group.add(shadow(env, 9, 5.6, 0.26, 0, 0.1));

  const screen = makeMonitor(shots[0]);
  env.textures.push(...screen.textures);
  const mon = new THREE.Group();
  mon.add(screen.group);
  mon.scale.setScalar(0.6);
  mon.position.set(0, 0.16, -2.0);
  group.add(mon);
  const fs = screenFader(screen.screen!, shots, [0.5]);

  /* ---- the cards: a request each, with a green check once it is done ---- */
  const cardTex = ACCENTS.map((c) =>
    drawn(env, 256, 184, (g, w, h) => {
      g.fillStyle = "#ffffff";
      g.fillRect(0, 0, w, h);
      fillRR(g, 0, 0, w, 34, 0, c);
      fillRR(g, 18, 12, 54, 10, 5, "rgba(255,255,255,0.85)");
      [0.8, 0.66, 0.74, 0.5].forEach((q, i) => fillRR(g, 18, 56 + i * 24, (w - 36) * q, 10, 5, "rgba(34,66,95,0.22)"));
      rr(g, 1, 1, w - 2, h - 2, 4);
      g.strokeStyle = "rgba(34,66,95,0.18)";
      g.lineWidth = 2;
      g.stroke();
    }),
  );
  const checkTex = drawn(env, 128, 128, (g, w, h) => {
    g.beginPath();
    g.arc(w / 2, h / 2, 54, 0, Math.PI * 2);
    g.fillStyle = "#5db536";
    g.fill();
    g.strokeStyle = "#fff";
    g.lineWidth = 12;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.beginPath();
    g.moveTo(w * 0.3, h * 0.52);
    g.lineTo(w * 0.45, h * 0.66);
    g.lineTo(w * 0.72, h * 0.36);
    g.stroke();
  });
  const cards = Array.from({ length: CARDS }, (_, c) => {
    const g = new THREE.Group();
    const top = new THREE.MeshStandardMaterial({ map: cardTex[c], roughness: 0.85, metalness: 0 });
    const side = new THREE.MeshStandardMaterial({ color: 0xf4f6f8, roughness: 0.9 });
    const body = new THREE.Mesh(rbox(1.15, 0.03, 0.82, 0.008, 2), [side, side, top, side, side, side]);
    g.add(body);
    const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), new THREE.MeshBasicMaterial({ map: checkTex, transparent: true, toneMapped: false }));
    badge.rotation.x = -Math.PI / 2;
    badge.position.set(0.36, 0.017, 0.2);
    g.add(badge);
    group.add(g);
    return { g, badge };
  });

  /* ---- the arm ---- */
  const robot = new THREE.Group();
  robot.position.copy(BASE);
  group.add(robot);
  const white = mat.white(0.3);
  const navy = mat.paint(0x22425f, 0.35);
  const silver = mat.alu(0xc9ced4, 0.3);
  put(robot, cyl(0.62, 0.7, 0.2, 56), silver, 0, 0.1, 0);
  put(robot, cyl(0.5, 0.58, 0.34, 56), white, 0, 0.37, 0);
  const yaw = new THREE.Group();
  yaw.position.y = 0.54;
  robot.add(yaw);
  put(yaw, cyl(0.46, 0.46, 0.12, 48), navy, 0, 0.06, 0);
  const sh = SHOULDER - BASE.y - 0.54; // the shoulder axis above the yaw plate
  const joint = (parent: THREE.Object3D, r: number, len: number, y = 0) => {
    const j = put(parent, cyl(r, r, len, 48).rotateZ(Math.PI / 2), white, 0, y, 0);
    put(parent, cyl(r + 0.01, r + 0.01, 0.1, 48).rotateZ(Math.PI / 2), navy, 0, y, 0);
    return j;
  };
  const pitch = new THREE.Group();
  pitch.position.y = sh;
  yaw.add(pitch);
  put(yaw, rbox(0.95, sh + 0.35, 0.7, 0.12), white, 0, (sh + 0.35) / 2 - 0.02, 0);
  joint(pitch, 0.4, 0.9);
  put(pitch, capsule(0.27, L1), white, 0, 0, 0.0);
  const elbow = new THREE.Group();
  elbow.position.y = L1;
  pitch.add(elbow);
  joint(elbow, 0.33, 0.78);
  put(elbow, capsule(0.22, L2), white, 0, 0, 0);
  const wrist = new THREE.Group();
  wrist.position.y = L2;
  elbow.add(wrist);
  joint(wrist, 0.2, 0.5);
  // the tool points along the wrist's +Y, which ends up pointing straight down
  put(wrist, cyl(0.2, 0.2, 0.14, 40), silver, 0, 0.14, 0);
  put(wrist, cyl(0.15, 0.15, 0.36, 40), navy, 0, 0.39, 0);
  put(wrist, new THREE.ConeGeometry(0.26, 0.3, 40, 1, true).rotateX(Math.PI).translate(0, 0.68, 0), new THREE.MeshStandardMaterial({ color: 0x14171b, roughness: 0.8, side: THREE.DoubleSide }));
  put(elbow, new THREE.SphereGeometry(0.03), mat.plastic(0x5db536), 0.46, 0, 0);
  const tagIn = marker(group, IN[0], 0.9, IN[1]);
  const tagArm = marker(elbow, 0.5, 0, 0);
  const tagOut = marker(group, OUT[0], 0.9, OUT[1]);

  /* ---- where the tip is, for a progress ---- */
  const inTop = (c: number) => TRAY + 0.03 + (CARDS - 1 - c) * 0.04;
  const outTop = (c: number) => TRAY + 0.03 + c * 0.04;
  const key = (c: number): { t: number; x: number; y: number; z: number; arc?: number }[] => [
    { t: 0, x: IN[0], y: HOVER, z: IN[1] },
    { t: 0.18, x: IN[0], y: inTop(c), z: IN[1] },
    { t: 0.3, x: IN[0], y: HOVER, z: IN[1] },
    { t: 0.62, x: OUT[0], y: HOVER, z: OUT[1], arc: 0.35 },
    { t: 0.78, x: OUT[0], y: outTop(c), z: OUT[1] },
    { t: 0.9, x: OUT[0], y: HOVER, z: OUT[1] },
    { t: 1, x: IN[0], y: HOVER, z: IN[1], arc: 0.35 },
  ];
  const tip = new THREE.Vector3();
  const pose = (c: number, u: number) => {
    const K = key(c);
    let i = 0;
    while (i < K.length - 2 && u > K[i + 1].t) i++;
    const a = K[i];
    const b = K[i + 1];
    const s = smooth(Math.min(1, Math.max(0, (u - a.t) / (b.t - a.t))));
    tip.set(lerp(a.x, b.x, s), lerp(a.y, b.y, s) + (b.arc ?? 0) * Math.sin(Math.PI * s), lerp(a.z, b.z, s));
    return { held: u >= 0.18 && u < 0.78, placed: u >= 0.78 };
  };

  const ik = () => {
    const dx = tip.x - BASE.x;
    const dz = tip.z - BASE.z;
    yaw.rotation.y = Math.atan2(dx, dz);
    const r = Math.hypot(dx, dz);
    const dy = tip.y + TOOL - SHOULDER;
    const d = Math.min(L1 + L2 - 0.02, Math.max(Math.abs(L1 - L2) + 0.02, Math.hypot(r, dy)));
    const psi = Math.atan2(r, dy);
    const A = Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d));
    const E = Math.acos((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2));
    const alpha = psi - A;
    const beta = Math.PI - E;
    pitch.rotation.x = alpha;
    elbow.rotation.x = beta;
    wrist.rotation.x = Math.PI - (alpha + beta);
  };

  const model: Model = {
    group,
    tags: [tagIn, tagArm, tagOut],
    camera: { az: [-0.32, 0.18], elev: [0.36, 0.3] },
    floorY: 0,
    set(_a, _l, p) {
      const t = Math.min(0.9999, p) * (CARDS - 1);
      const c = Math.min(CARDS - 2, Math.floor(t));
      const u = p >= 1 ? 1 : t - c;
      const st = pose(c, u);
      ik();
      cards.forEach((cd, j) => {
        let x = IN[0];
        let y = inTop(j) - 0.015;
        let z = IN[1];
        let done = false;
        if (j < c || (j === c && st.placed)) {
          x = OUT[0];
          y = outTop(j) - 0.015;
          z = OUT[1];
          done = true;
        } else if (j === c && st.held) {
          x = tip.x;
          y = tip.y - 0.015;
          z = tip.z;
        }
        cd.g.position.set(x, y, z);
        cd.g.rotation.y = done ? (j - 1) * 0.05 : 0;
        cd.badge.visible = done;
      });
      fs(p);
    },
    frame: () => ({ cx: 0, cy: 1.8, hw: 4.2, hh: 2.4 }),
  };
  model.set(1, 1, 0);
  return model;
};

export default build;
