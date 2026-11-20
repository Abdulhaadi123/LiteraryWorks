import * as THREE from "three";
import { lerp, quint, win } from "../engine";
import { C, dot, fillRR, glass, marker, plane, plateTexture, skel, smoothstep, unlit } from "./parts";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * The AI audit: a scan. Pages of a business's real work (our own projects attached to each) stand in an arc; a
 * curtain of green light sweeps across them, marks what it finds on each, and then a ranked plan appears in front.
 */

const SHOTS = ["alltrials", "vyarl", "drscribe", "support", "kalibur"];
const SW = 1.75;
const SH = 2.35;
const R = 3.9;

const build: ModelBuilder = async (env, mini) => {
  const group = new THREE.Group();
  const shots = mini ? SHOTS.slice(0, 4) : SHOTS;
  const n = shots.length;
  const texs = await Promise.all(shots.map((s) => env.shot(s, 640, 400)));

  /* ---- the pages ---- */
  const doc = plateTexture(env, 540, 720, (g, w) => {
    dot(g, 60, 56, 22, C.navy);
    skel(g, 100, 40, 190, 14, C.navy);
    skel(g, 100, 66, 120, 9);
    for (let i = 0; i < 4; i++) {
      skel(g, 44, 360 + i * 44, w - 88 - (i % 2) * 90, 11, i === 0 ? C.navy : C.rule);
    }
    for (let i = 0; i < 3; i++) {
      fillRR(g, 44, 558 + i * 46, w - 88, 34, 10, i % 2 ? C.white : C.soft);
      skel(g, 60, 570 + i * 46, 120, 10);
      dot(g, w - 70, 575 + i * 46, 8, i === 1 ? C.amber : C.green);
    }
  });
  const rnd = env.rnd;
  const sheets = texs.map((tex, k) => {
    const panel = glass(env, doc, SW, SH, { radius: 0.12, depth: 0.05 });
    const thumb = plane(tex, 1.42, 0.89, 0.04);
    thumb.position.set(0, 0.54, 0.065);
    panel.group.add(thumb);
    const flag = new THREE.Mesh(new THREE.CircleGeometry(0.13, 20), unlit(k % 2 ? 0x73c94a : 0xe8a317));
    flag.position.set(SW / 2 - 0.25, -0.15, 0.07);
    panel.group.add(flag);
    group.add(panel.group);
    const th = (k - (n - 1) / 2) * 0.46;
    return {
      panel,
      flag,
      x: R * Math.sin(th),
      to: new THREE.Vector3(R * Math.sin(th), 1.95 + (k % 2) * 0.12, 2.0 - R * Math.cos(th)),
      yaw: -th,
      from: new THREE.Vector3((rnd() - 0.5) * 11, 0.6 + rnd() * 4, (rnd() - 0.3) * 3.5),
      fromYaw: (rnd() - 0.5) * 2.4,
      fromTilt: (rnd() - 0.5) * 0.6,
    };
  });

  /* ---- the curtain of light ---- */
  const scan = new THREE.Group();
  scan.position.set(-4, 1.95, -0.3);
  group.add(scan);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 4.5), new THREE.MeshBasicMaterial({ color: 0x73c94a, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
  sheet.rotation.y = Math.PI / 2;
  scan.add(sheet);
  const lineMat = unlit(0xb9f09b);
  [2.25, -2.25].forEach((y) => {
    const ln = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.045, 3.8), lineMat);
    ln.position.y = y;
    scan.add(ln);
  });
  [1.9, -1.9].forEach((z) => {
    const ln = new THREE.Mesh(new THREE.BoxGeometry(0.04, 4.5, 0.04), lineMat);
    ln.position.z = z;
    scan.add(ln);
  });

  /* ---- the ranked plan ---- */
  const plan = [0, 1, 2].map((i) => {
    const card = glass(env, plateTexture(env, 620, 250, (g) => {
      dot(g, 74, 125, 42, i === 0 ? C.green : C.navy);
      g.fillStyle = i === 0 ? "#191716" : "#ffffff";
      g.font = "800 50px Inter, system-ui, sans-serif";
      g.textAlign = "center";
      g.fillText(String(i + 1), 74, 144);
      skel(g, 150, 76, 330 - i * 40, 16, C.navy);
      skel(g, 150, 108, 250 - i * 30, 11);
      fillRR(g, 150, 150, 400, 26, 13, C.soft);
      fillRR(g, 150, 150, 400 * (0.92 - i * 0.26), 26, 13, i === 0 ? C.green : C.bright);
    }), 1.7, 0.69, { radius: 0.12, depth: 0.05 });
    group.add(card.group);
    return card;
  });

  const frame: Frame = { cx: 0, cy: 2.0, hw: 5.2, hh: 3.0 };
  const model: Model = {
    group,
    tags: [marker(sheets[0].panel.group, -0.7, 1.05, 0.07), marker(scan, 0, 2.3, 0), marker(plan[0].group, -0.7, 0.3, 0.07)],
    camera: { az: [-0.3, 0.26], elev: [0.2, 0.14] },
    ground: true,
    floorY: 0,
    set(a, l, p) {
      // the scan, then the plan: the light crosses between 0.2 and 0.6 of the page
      const sx = lerp(-4.2, 4.2, quint(win(p, 0.2, 0.6)));
      scan.position.x = sx;
      scan.visible = p > 0.18 && p < 0.66;
      (sheet.material as THREE.MeshBasicMaterial).opacity = 0.16 * smoothstep(0.18, 0.24, p) * (1 - smoothstep(0.6, 0.66, p));
      sheets.forEach((s, k) => {
        const e = quint(win(a, 0.05 + k * 0.06, 0.7 + k * 0.05));
        const g = s.panel.group;
        g.position.lerpVectors(s.from, s.to, e);
        g.rotation.set(lerp(s.fromTilt, 0, e), lerp(s.fromYaw, s.yaw, e), 0);
        // a page is read as the light passes it: it brightens and gets its mark
        const done = smoothstep(s.x - 0.25, s.x + 0.5, sx) * smoothstep(0.2, 0.24, p);
        (s.panel.body.material as THREE.MeshBasicMaterial[])[0].color.setScalar(lerp(0.84, 1, done));
        s.flag.scale.setScalar(Math.max(0.001, done));
      });
      plan.forEach((c, i) => {
        const e = quint(win(p, 0.46 + i * 0.06, 0.66 + i * 0.06));
        c.group.position.set((i - 1) * 1.85 + 0.0, lerp(-1.2, 0.5, e), lerp(3.2, 2.6, e));
        c.group.rotation.set(0, (i - 1) * -0.12, 0);
        c.group.scale.setScalar(Math.max(0.001, e));
      });
      frame.hw = lerp(5.8, 4.6, quint(win(a, 0.1, 0.9)));
    },
    frame: () => frame,
  };
  model.set(0, 0, 0);
  return model;
};

export default build;
