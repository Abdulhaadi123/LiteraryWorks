import * as THREE from "three";
import { lerp, quint, TAU, win } from "../engine";
import { COLOR, makeBeam, type Beam } from "../kit";
import { C, dot, drawn, glass, glossy, marker, unlit } from "./parts";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * Construction technology: a building going up. A blueprint on the ground, a tower crane over it, and the floors of
 * a building coming down onto each other one after another as the page scrolls, each drawn in a fine line first;
 * a screen with one of our own project views stands beside it.
 */

const FLOORS = 8;
const FH = 0.52;
const FW = 2.3;
const FD = 1.7;
const PW = 8.4;
const PD = 5.6;

const build: ModelBuilder = async (env, mini) => {
  const group = new THREE.Group();
  const view = await env.shot("kalibur", 1024, 640);

  /* ---- the blueprint ---- */
  const plan = drawn(env, 1260, 840, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#2d557a");
    bg.addColorStop(1, "#1b3752");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    for (let x = 0; x <= w; x += 30) {
      g.fillStyle = x % 150 === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)";
      g.fillRect(x, 0, 1.5, h);
    }
    for (let y = 0; y <= h; y += 30) {
      g.fillStyle = y % 150 === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.07)";
      g.fillRect(0, y, w, 1.5);
    }
    g.strokeStyle = "rgba(255,255,255,0.55)";
    g.lineWidth = 3;
    g.strokeRect(430, 250, 400, 340);
    g.strokeRect(430, 250, 190, 150);
    g.strokeRect(620, 400, 210, 190);
    g.beginPath();
    g.arc(430, 540, 60, -Math.PI / 2, 0);
    g.moveTo(830, 330);
    g.lineTo(870, 330);
    g.moveTo(430, 660);
    g.lineTo(830, 660);
    g.moveTo(430, 650);
    g.lineTo(430, 670);
    g.moveTo(830, 650);
    g.lineTo(830, 670);
    g.stroke();
    g.beginPath();
    g.arc(1120, 160, 46, 0, TAU);
    g.moveTo(1120, 120);
    g.lineTo(1120, 200);
    g.stroke();
    [0, 1, 2].forEach((i) => {
      g.fillStyle = "rgba(255,255,255,0.35)";
      g.fillRect(90, 110 + i * 26, 220 - i * 50, 8);
    });
    dot(g, 140, 740, 10, C.green);
  });
  const plate = glass(env, plan, PW, PD, { depth: 0.16, radius: 0.3, shadow: false });
  plate.group.rotation.x = -Math.PI / 2;
  plate.group.position.y = 0.08;
  group.add(plate.group);

  /* ---- the building: floors with windows, each in a fine line as well ---- */
  const windows = (lit: number) =>
    drawn(env, 512, 128, (g, w, h) => {
      g.fillStyle = "#f4f7fa";
      g.fillRect(0, 0, w, h);
      for (let i = 0; i < 8; i++) {
        const on = (i * 5 + lit) % 7 < 2;
        g.fillStyle = on ? (i % 2 ? C.green : C.amber) : "#3a6486";
        g.fillRect(14 + i * 62, 30, 42, 68);
      }
    });
  const winA = windows(0);
  const winB = windows(3);
  const white = glossy(0xf4f7fa, 0.4, 0.5);
  const boxGeo = new THREE.BoxGeometry(FW, FH, FD);
  const edgeGeo = new THREE.EdgesGeometry(boxGeo);
  const sideA = new THREE.MeshStandardMaterial({ map: winA, roughness: 0.5, metalness: 0.1 });
  const sideB = new THREE.MeshStandardMaterial({ map: winB, roughness: 0.5, metalness: 0.1 });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x22425f });
  const tower = new THREE.Group();
  tower.position.set(0.25, 0.16, -0.1);
  group.add(tower);
  const floors = Array.from({ length: mini ? 6 : FLOORS }, (_, k) => {
    const side = k % 2 ? sideB : sideA;
    const mesh = new THREE.Mesh(boxGeo, [side, side, white, white, side, side]);
    mesh.add(new THREE.LineSegments(edgeGeo, edgeMat));
    mesh.scale.set(1 - k * 0.018, 1, 1);
    tower.add(mesh);
    return mesh;
  });
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), unlit(0x73c94a));
  tower.add(beacon);

  /* ---- the tower crane ---- */
  const crane = new THREE.Group();
  crane.position.set(-3.1, 0.16, -0.9);
  group.add(crane);
  const navy = glossy(0x22425f, 0.35, 0.8);
  const footing = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.24, 0.7), navy);
  footing.position.y = 0.12;
  crane.add(footing);
  const mast = new THREE.Mesh(new THREE.BoxGeometry(0.16, 4.8, 0.16), navy);
  mast.position.y = 2.64;
  crane.add(mast);
  const head = new THREE.Group();
  head.position.y = 5.05;
  crane.add(head);
  const jib = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.12, 0.16), glossy(0x73c94a, 0.4, 0.5));
  jib.position.x = 1.7;
  head.add(jib);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.34, 0.34), navy);
  counter.position.x = -1.0;
  head.add(counter);
  const trolley = new THREE.Group();
  head.add(trolley);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 6), unlit(0x191716));
  cable.geometry.translate(0, -0.5, 0);
  trolley.add(cable);
  const hook = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.16), navy);
  trolley.add(hook);
  const peak = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.3, 4), navy);
  peak.position.y = 5.35;
  crane.add(peak);

  /* ---- a screen beside it ---- */
  const screen = glass(env, view, 2.3, 1.44, { radius: 0.13, depth: 0.06 });
  group.add(screen.group);
  const wire: Beam = makeBeam(COLOR.green, 0.014);
  group.add(wire.mesh);
  const A = new THREE.Vector3();
  const B = new THREE.Vector3();

  const frame: Frame = { cx: 0, cy: 2.6, hw: 4.9, hh: 3.1 };
  const model: Model = {
    group,
    tags: [marker(group, -PW / 2 + 0.8, 0.3, PD / 2 - 0.5), marker(tower, FW / 2, floors.length * FH - 0.2, FD / 2), marker(screen.group, -0.9, 0.62, 0.07)],
    camera: { az: [-0.55, 0.4], elev: [0.3, 0.22] },
    ground: true,
    floorY: 0,
    set(a, l, p) {
      const eP = quint(win(a, 0, 0.5));
      plate.group.scale.set(lerp(0.7, 1, eP), lerp(0.7, 1, eP), 1);
      plate.group.rotation.z = lerp(0.5, 0, eP);
      floors.forEach((f, k) => {
        const e = quint(win(a, 0.06 + k * 0.085, 0.4 + k * 0.085));
        f.position.set(0, FH / 2 + k * FH + (1 - e) * 5.5, 0);
        f.rotation.y = (1 - e) * (k % 2 ? 0.9 : -0.9);
      });
      beacon.position.set(0, floors.length * FH + 0.2, 0);
      beacon.scale.setScalar(Math.max(0.001, quint(win(a, 0.7, 1)) * (0.7 + 0.5 * Math.sin(p * TAU * 6)) * (0.4 + 0.6 * l)));
      // the crane turns over the site, and its hook goes up and down
      head.rotation.y = lerp(0.9, -0.3, eP) + 0.22 * Math.sin(p * TAU * 1.4);
      trolley.position.x = 2.2 + 0.9 * Math.sin(p * TAU * 2.1);
      const drop = 1.2 + 1.1 * (0.5 + 0.5 * Math.sin(p * TAU * 3.3));
      cable.scale.y = drop;
      hook.position.y = -drop - 0.1;
      const eS = quint(win(a, 0.3, 0.9));
      screen.group.position.set(lerp(6.5, 3.3, eS), lerp(4, 1.55, eS), lerp(-1, 1.6, eS));
      screen.group.rotation.set(0, lerp(-1, -0.42, eS), 0);
      group.updateMatrixWorld(true);
      A.copy(screen.group.position);
      wire.aim(A, B.set(1.4, floors.length * FH * 0.5 + 0.3, 0.4), eS > 0.99 ? 1 : 0);
      frame.hw = lerp(6.2, 4.9, quint(win(a, 0.1, 0.9)));
    },
    frame: () => frame,
    dispose() {
      boxGeo.dispose();
      edgeGeo.dispose();
    },
  };
  model.set(0, 0, 0);
  return model;
};

export default build;
