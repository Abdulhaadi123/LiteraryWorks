import * as THREE from "three";
import { clamp01, lerp, quint, smooth, TAU } from "../engine";
import { chrome, stageMetal, GLOW, glowTex, lightColumn, lightSprite, lit, makeScreen, plasmaMaterial, type Screen } from "./glow";
import { uiTexture, type UIKind } from "./ui";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * Enterprise software: an operations room. A curved wall of fifteen live dashboards (maps, charts, tables, a task
 * list) stands on a lit base, and a small AI core floats in front of it on its own stage. A wave of light runs across
 * the wall and the panels wake as it passes; on a page the wall starts open and wide and closes into the curve.
 */

const RW = 6.4;
const CW = new THREE.Vector3(0, 0, 6.2);
const COLS = 5;
const ROWS = 3;
const PW = 2.5;
const PH = 1.5;
const ROW_Y = [2.4, 4.05, 5.7];
const STEP = 0.39;
const HALF = 0.95;

const KINDS: UIKind[][] = [
  ["donut", "voice", "table", "map", "line"],
  ["tasks", "table", "kpi", "feed", "bars"],
  ["map", "bars", "line", "donut", "heat"],
];

/** A curved strip standing on the floor round the wall's axis, from -half to +half about the -z direction. */
function arcGeometry(radius: number, y0: number, y1: number, half: number): THREE.CylinderGeometry {
  const g = new THREE.CylinderGeometry(radius, radius, y1 - y0, 72, 1, true, Math.PI - half, half * 2);
  g.translate(0, (y0 + y1) / 2, 0);
  return g;
}
function arcLine(radius: number, y: number, half: number, color: number, opacity: number): THREE.Line {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 80; i++) {
    const t = -half + (i / 80) * half * 2;
    pts.push(new THREE.Vector3(Math.sin(t) * radius, y, -Math.cos(t) * radius));
  }
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
}

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();

  /* ---- the wall: a dark backing, a lit base, thin uprights between the columns ---- */
  const wallG = new THREE.Group();
  wallG.position.copy(CW);
  group.add(wallG);
  const backing = new THREE.Mesh(arcGeometry(RW + 0.25, 0.3, 6.8, HALF), new THREE.MeshBasicMaterial({ color: 0x08192b, side: THREE.DoubleSide }));
  const base = new THREE.Mesh(
    arcGeometry(RW + 0.3, 0, 1.5, HALF),
    new THREE.MeshPhysicalMaterial({ color: 0x08182b, metalness: 0.4, roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.15, envMapIntensity: 0.25, side: THREE.DoubleSide }),
  );
  const edgeTop = arcLine(RW + 0.2, 6.78, HALF, GLOW.sky, 0.7);
  const edgeMid = arcLine(RW + 0.2, 1.5, HALF, GLOW.green, 0.9);
  const edgeLow = arcLine(RW + 0.2, 0.32, HALF, GLOW.sky, 0.45);
  wallG.add(backing, base, edgeTop, edgeMid, edgeLow);
  for (let c = 0; c <= COLS; c++) {
    const t = (c - COLS / 2) * STEP;
    const up = new THREE.Mesh(new THREE.BoxGeometry(0.025, 5.2, 0.05), lit(GLOW.sky, 0.28));
    up.position.set(Math.sin(t) * (RW + 0.18), 4.15, -Math.cos(t) * (RW + 0.18));
    up.rotation.y = -t;
    wallG.add(up);
  }

  /* ---- the fifteen panels: the wall starts opened out (wider and out in front of its base) and closes into the curve ---- */
  const panels: { s: Screen; c: number; r: number }[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const tex = uiTexture(env, KINDS[r][c], 576, 346, 11 + r * 7 + c * 3, "#84e255");
      const s = makeScreen(env, tex, PW, PH, { accent: r === 1 && c === 2 ? GLOW.green : GLOW.sky, rgb: "100,170,255", depth: 0.08, radius: 0.1, glow: 0.12 });
      s.group.rotation.order = "YXZ";
      group.add(s.group);
      panels.push({ s, c, r });
    }
  const feat = panels[1 * COLS + 2];

  /* ---- in front: the AI core on its own small stage, and two cards of figures beside it ---- */
  const stageZ = CW.z - 3.9;
  const plinthMat = stageMetal();
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.6, 0.22, 72), plinthMat);
  plinth.position.set(0, 0.11, stageZ);
  const plinthRim = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.016, 8, 100), lit(GLOW.green, 0.9));
  plinthRim.rotation.x = Math.PI / 2;
  plinthRim.position.set(0, 0.225, stageZ);
  group.add(plinth, plinthRim);

  const core = new THREE.Group();
  core.position.set(0, 2.0, stageZ);
  const pl = plasmaMaterial();
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.52, 48, 36), pl.mat);
  core.add(orb);
  core.add(lightSprite(env, "90,200,150", 3.6, 0.42));
  const rings = [0.9, 1.15].map((R, i) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(R, 0.022, 10, 120), chrome(0xe3ecf6, 0.24));
    m.rotation.set(i ? 1.2 : 0.4, 0, i ? -0.5 : 0.3);
    core.add(m);
    return m;
  });
  group.add(core);
  const colH = 2.0 - 0.3 - 0.55;
  const col = lightColumn(0x7cc4ff, 0.3, 0.75, colH);
  col.mesh.position.set(0, 0.3 + colH / 2, stageZ);
  group.add(col.mesh);

  const cards: Screen[] = [-1, 1].map((side, i) => {
    const s = makeScreen(env, uiTexture(env, i ? "line" : "kpi", 448, 288, 70 + i, "#84e255"), 1.5, 0.96, { accent: GLOW.sky, depth: 0.07, radius: 0.08, glow: 0.16 });
    s.group.rotation.order = "YXZ";
    s.group.position.set(side * 2.5, 1.7 + i * 0.25, stageZ + 0.2);
    s.group.rotation.set(-0.05, -side * 0.5, 0);
    group.add(s.group);
    return s;
  });

  // the wave of light across the wall
  const sweep = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 5.6), new THREE.MeshBasicMaterial({ map: glowTex(env, "140,210,255"), transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  group.add(sweep);

  const frame: Frame = { cx: 0, cy: 3.5, hw: 5.5, hh: 3.7 };
  const model: Model = {
    group,
    tags: [panels[1 * COLS + 1].s.top, feat.s.top, panels[2 * COLS + 1].s.top],
    camera: { az: [0.1, -0.1], elev: [0.17, 0.1] },
    floorY: 0,
    set(a, l, p) {
      const wave = (p * 1.35) % 1.4;
      const x = lerp(-1.1, 1.3, wave / 1.4);
      panels.forEach((pn) => {
        const e = quint(clamp01((a * 1.5 - (pn.c * 0.04 + pn.r * 0.07)) / 0.64));
        const open = 1 - e;
        const t = (pn.c - (COLS - 1) / 2) * STEP * (1 + 0.32 * open);
        const R = RW * (1 - 0.2 * open);
        pn.s.group.position.set(CW.x + Math.sin(t) * R, ROW_Y[pn.r] + (pn.r - 1) * 0.5 * open, CW.z - Math.cos(t) * R);
        pn.s.group.rotation.y = -t;
        pn.s.group.scale.setScalar(1 - 0.12 * open);
        // each wakes as the wave passes
        const nx = (pn.c - (COLS - 1) / 2) / 2.4;
        const wk = Math.exp(-Math.pow((nx - x) * 2.4, 2));
        const k = clamp01(0.62 + 0.18 * l + 0.4 * wk * l + (feat === pn ? 0.08 : 0));
        (pn.s.front.material as THREE.MeshBasicMaterial).color.setScalar(k * (0.45 + 0.55 * e));
        (pn.s.light.material as THREE.SpriteMaterial).opacity = (0.06 + 0.16 * wk * l + 0.04 * l) * e;
        pn.s.edge.forEach((ln, i) => ((ln.material as THREE.LineBasicMaterial).opacity = (i ? 0.45 : 0.6) + 0.4 * wk * l));
      });
      sweep.position.set(x * 4.4, 4.2, CW.z - RW * 0.98 + 0.3);
      sweep.rotation.y = -x * 0.55;
      sweep.visible = l > 0.02;
      (sweep.material as THREE.MeshBasicMaterial).opacity = 0.32 * l * Math.sin(Math.PI * clamp01((x + 1.1) / 2.4));
      cards.forEach((s, i) => {
        const e = quint(clamp01((a * 1.4 - 0.3 - i * 0.1) / 0.6));
        s.group.scale.setScalar(Math.max(0.001, e));
        s.group.position.y = 1.7 + i * 0.25 + 0.05 * Math.sin(p * TAU * 2 + i * 2);
      });
      pl.u.uT.value = p * 6;
      pl.u.uGlow.value = 0.35 + 0.65 * l;
      core.position.y = 2.0 + 0.07 * Math.sin(p * TAU * 3);
      rings[0].rotation.y = p * TAU * 0.9;
      rings[1].rotation.y = -p * TAU * 0.7;
      orb.rotation.y = p * 2;
      col.mat.uniforms.uOpacity.value = 0.18 + 0.22 * l;
      (plinthRim.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.5 * smooth(l);
      (edgeMid.material as THREE.LineBasicMaterial).opacity = 0.5 + 0.5 * l;
      group.updateMatrixWorld(true);
    },
    frame: () => frame,
  };
  model.set(1, 1, 0.5);
  return model;
};

export default build;
