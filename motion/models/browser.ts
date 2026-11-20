import * as THREE from "three";
import { lerp, quint, TAU, win } from "../engine";
import { COLOR, makeBeam, type Beam } from "../kit";
import { C, dot, fillRR, glass, glossy, marker, plane, plateTexture, skel, slab, smoothstep, unlit } from "./parts";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * AI web apps: the anatomy of a web app. A browser window with one of our own products in it, and the pieces a web
 * app is made of (an AI assistant, live data, settings, code, an account) flying in from all sides to dock round
 * it, each joined to it by a line.
 */

const WW = 5.2;
const WH = 3.3;
const CY = 2.95;

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();
  const shot = await env.shot("tutor", 1024, 576);

  /* ---- the window ---- */
  const win3 = new THREE.Group();
  win3.position.y = CY;
  group.add(win3);
  const body = slab(WW, WH, 0.14, 0.2, glossy(0xffffff, 0.35, 0.7));
  win3.add(body);
  const barTex = plateTexture(env, 1024, 84, (g, w) => {
    [0, 1, 2].forEach((i) => dot(g, 40 + i * 34, 42, 11, i === 2 ? C.green : C.rule));
    fillRR(g, 190, 20, 560, 44, 22, C.soft);
    dot(g, 220, 42, 8, C.green);
    skel(g, 244, 36, 220, 10, C.rule);
    skel(g, w - 190, 36, 120, 10, C.pale);
  });
  const bar = plane(barTex, WW - 0.2, 0.43, 0.04);
  bar.position.set(0, WH / 2 - 0.33, 0.075);
  win3.add(bar);
  const content = plane(shot, WW - 0.2, 2.7, 0.05);
  content.position.set(0, -0.2, 0.075);
  win3.add(content);

  /* ---- the pieces ---- */
  const chat = glass(env, plateTexture(env, 640, 420, (g) => {
    dot(g, 56, 56, 26, C.sky);
    skel(g, 100, 40, 190, 14, C.navy);
    skel(g, 100, 66, 120, 9);
    fillRR(g, 36, 120, 360, 92, 28, C.soft);
    skel(g, 64, 146, 290, 10);
    skel(g, 64, 170, 190, 10);
    fillRR(g, 200, 232, 404, 92, 28, C.navy);
    skel(g, 228, 258, 330, 10, "rgba(255,255,255,0.85)");
    skel(g, 228, 282, 200, 10, "rgba(255,255,255,0.55)");
    fillRR(g, 36, 346, 120, 44, 22, C.greenSoft);
  }), 1.7, 1.12, { radius: 0.14, depth: 0.05 });
  const dots = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), unlit(0x3e6d97));
    chat.group.add(m);
    return m;
  });
  const chart = glass(env, plateTexture(env, 640, 430, (g, w, h) => {
    skel(g, 40, 36, 200, 14, C.navy);
    skel(g, 40, 62, 120, 9);
    g.fillStyle = C.rule;
    g.fillRect(40, h - 56, w - 80, 3);
  }), 1.7, 1.14, { radius: 0.14, depth: 0.05 });
  const barGeo = new THREE.BoxGeometry(0.17, 1, 0.17);
  barGeo.translate(0, 0.5, 0);
  const chartBars = [0, 1, 2, 3, 4].map((i) => {
    const m = new THREE.Mesh(barGeo, glossy(i === 3 ? 0x73c94a : 0x22425f, 0.3, 0.8));
    m.position.set(-0.55 + i * 0.28, -0.4, 0.12);
    chart.group.add(m);
    return m;
  });
  const settings = glass(env, plateTexture(env, 560, 320, (g) => {
    [0, 1].forEach((i) => {
      const y = 60 + i * 110;
      skel(g, 44, y + 10, 240, 12, i ? C.rule : C.navy);
      fillRR(g, 400, y, 110, 54, 27, i ? C.green : C.rule);
      dot(g, i ? 484 : 426, y + 27, 21, C.white);
    });
  }), 1.45, 0.83, { radius: 0.12, depth: 0.05 });
  const code = glass(env, plateTexture(env, 640, 400, (g, w, h) => {
    g.fillStyle = C.deep;
    g.fillRect(0, 0, w, h);
    const lines: [number, number, string][] = [[60, 200, C.green], [100, 300, C.sky], [100, 220, "rgba(255,255,255,0.4)"], [140, 260, C.green], [100, 340, "rgba(255,255,255,0.3)"], [60, 180, C.sky], [100, 280, "rgba(255,255,255,0.4)"]];
    lines.forEach(([x, wd, c], i) => skel(g, x, 52 + i * 46, wd, 14, c));
  }, [C.deep, C.deep]), 1.7, 1.06, { radius: 0.14, depth: 0.05 });
  const user = glass(env, plateTexture(env, 560, 340, (g) => {
    dot(g, 90, 170, 52, C.sky);
    dot(g, 130, 210, 14, C.green);
    skel(g, 180, 130, 260, 16, C.navy);
    skel(g, 180, 168, 190, 11);
    skel(g, 180, 198, 220, 11);
  }), 1.5, 0.9, { radius: 0.13, depth: 0.05 });

  const rnd = env.rnd;
  const items = [
    { g: chat.group, to: new THREE.Vector3(-2.15, 0.62, 1.2), yaw: 0.3 },
    { g: chart.group, to: new THREE.Vector3(2.2, 0.62, 1.25), yaw: -0.3 },
    { g: settings.group, to: new THREE.Vector3(2.15, 5.55, 0.85), yaw: -0.25 },
    { g: code.group, to: new THREE.Vector3(-2.05, 5.5, 0.85), yaw: 0.25 },
    { g: user.group, to: new THREE.Vector3(0.05, 0.3, 1.8), yaw: -0.08 },
  ].map((it) => ({
    ...it,
    from: new THREE.Vector3((rnd() - 0.5) * 10, 0.6 + rnd() * 5.4, (rnd() - 0.3) * 4),
    fromYaw: (rnd() - 0.5) * 2.4,
    fromTilt: (rnd() - 0.5) * 0.7,
  }));
  items.forEach((it) => group.add(it.g));

  /* ---- a line from each piece to the window ---- */
  const links: Beam[] = items.map(() => makeBeam(COLOR.green, 0.012));
  links.forEach((b) => group.add(b.mesh));
  const A = new THREE.Vector3();
  const B = new THREE.Vector3();

  const frame: Frame = { cx: 0, cy: 3.05, hw: 5, hh: 3.2 };
  const model: Model = {
    group,
    tags: [marker(win3, -WW / 2 + 0.3, WH / 2 - 0.55, 0.1), marker(chat.group, -0.8, 0.5, 0.06), marker(chart.group, -0.8, 0.5, 0.06)],
    camera: { az: [-0.34, 0.26], elev: [0.16, 0.1] },
    ground: true,
    floorY: 0,
    set(a, l, p) {
      const eW = quint(win(a, 0, 0.5));
      win3.scale.setScalar(lerp(0.82, 1, eW));
      win3.rotation.y = lerp(0.4, -0.1, eW);
      items.forEach((it, i) => {
        const e = quint(win(a, 0.15 + i * 0.07, 0.75 + i * 0.05));
        it.g.position.lerpVectors(it.from, it.to, e);
        it.g.rotation.set(lerp(it.fromTilt, 0, e), lerp(it.fromYaw, it.yaw, e), 0);
        // the line runs from the piece to the nearest point on the window's edge
        B.set(THREE.MathUtils.clamp(it.to.x, -WW / 2 + 0.1, WW / 2 - 0.1), THREE.MathUtils.clamp(it.to.y, CY - WH / 2 + 0.1, CY + WH / 2 - 0.1), 0.1);
        A.copy(it.g.position);
        links[i].aim(A, B, smoothstep(0.7, 1, e));
        (links[i].mesh.material as THREE.MeshBasicMaterial).opacity = 0.7;
      });
      // it starts to work: the assistant types, the data grows
      dots.forEach((d, i) => {
        d.position.set(-0.55 + i * 0.16, -0.5 + 0.08 * Math.max(0, Math.sin(p * TAU * 5 - i * 0.9)) * l, 0.07);
      });
      chartBars.forEach((m, i) => {
        m.scale.y = 0.1 + (0.2 + 0.45 * (0.5 + 0.5 * Math.sin(p * TAU * 2.4 + i * 1.3))) * (0.25 + 0.75 * l) * 1.4;
      });
      frame.hw = lerp(5.6, 3.7, quint(win(a, 0.1, 0.9)));
    },
    frame: () => frame,
    dispose() {
      barGeo.dispose();
    },
  };
  model.set(0, 0, 0);
  return model;
};

export default build;
