import * as THREE from "three";
import { clamp01, lerp, quint, TAU } from "../engine";
import { floorShadow, circleLine, GLOW, glowTex, lightSprite, lit, makeScreen, stageMetal, type Screen } from "./glow";
import { drawn, fillRR, rr } from "./parts";
import { uiTexture } from "./ui";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * UI and UX design: a design canvas. An artboard stands in a selection frame with its handles; a line of light sweeps
 * across it and turns the grey wireframe on one side into the finished screen on the other, while a cursor follows
 * the line. A palette, a type specimen, a set of component states and a bezier curve with its handles float round it,
 * and guides run out across the stage. The scroll runs the sweep to and fro.
 */

const AW = 5.0;
const AH = 3.2;
const AY = 3.35;

const PAINT_V = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const PAINT_F = /* glsl */ `
uniform sampler2D map; uniform float uSweep; varying vec2 vUv;
void main() {
  if (vUv.x > uSweep) discard;
  gl_FragColor = vec4(texture2D(map, vUv).rgb, 1.0);
  #include <colorspace_fragment>
}`;

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();
  group.add(floorShadow(env, 10.5, 6.5, 0.16));

  /* ---- the artboard: the wireframe, and the finished screen painted over it as the line passes ---- */
  const board = new THREE.Group();
  board.position.set(0, AY, 0);
  group.add(board);
  const wire = makeScreen(env, uiTexture(env, "wire", 960, 614, 2, "#5db536"), AW, AH, { accent: GLOW.sky, depth: 0.1, radius: 0.14, glow: 0.2, back: null });
  board.add(wire.group);
  const finTex = uiTexture(env, "page", 960, 614, 3, "#5db536");
  const paintU = { map: { value: finTex }, uSweep: { value: 0.6 } };
  const paint = new THREE.Mesh(new THREE.PlaneGeometry(AW - 0.07, AH - 0.07), new THREE.ShaderMaterial({ uniforms: paintU, vertexShader: PAINT_V, fragmentShader: PAINT_F }));
  paint.position.z = 0.058;
  board.add(paint);
  const sweepLine = new THREE.Mesh(new THREE.PlaneGeometry(0.05, AH + 0.5), new THREE.MeshBasicMaterial({ color: 0x3e6d97, transparent: true, opacity: 0.95, depthWrite: false, toneMapped: false }));
  sweepLine.position.z = 0.075;
  board.add(sweepLine);
  const sweepGlow = lightSprite(env, "47,111,181", 1.4, 0.3);
  sweepGlow.scale.set(1.3, AH + 1.3, 1);
  sweepGlow.position.z = 0.07;
  board.add(sweepGlow);

  // the selection frame and its handles
  const sel = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-AW / 2 - 0.16, -AH / 2 - 0.16, 0.08), new THREE.Vector3(AW / 2 + 0.16, -AH / 2 - 0.16, 0.08), new THREE.Vector3(AW / 2 + 0.16, AH / 2 + 0.16, 0.08), new THREE.Vector3(-AW / 2 - 0.16, AH / 2 + 0.16, 0.08)]),
    new THREE.LineBasicMaterial({ color: 0x4f9bff, toneMapped: false }),
  );
  board.add(sel);
  const handleGeo = new THREE.BoxGeometry(0.15, 0.15, 0.03);
  const handles: THREE.Mesh[] = [];
  [-1, 0, 1].forEach((i) =>
    [-1, 0, 1].forEach((j) => {
      if (!i && !j) return;
      const h = new THREE.Mesh(handleGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
      h.position.set(i * (AW / 2 + 0.16), j * (AH / 2 + 0.16), 0.09);
      const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-0.075, -0.075, 0.016), new THREE.Vector3(0.075, -0.075, 0.016), new THREE.Vector3(0.075, 0.075, 0.016), new THREE.Vector3(-0.075, 0.075, 0.016)]), new THREE.LineBasicMaterial({ color: 0x4f9bff, toneMapped: false }));
      h.add(ring);
      board.add(h);
      handles.push(h);
    }),
  );

  // the cursor, with a name tag
  const cur = new THREE.Group();
  const arrow = new THREE.Shape();
  [
    [0, 0],
    [0, -1.0],
    [0.27, -0.76],
    [0.48, -1.18],
    [0.66, -1.08],
    [0.45, -0.68],
    [0.8, -0.68],
  ].forEach(([x, y], i) => (i ? arrow.lineTo(x * 0.5, y * 0.5) : arrow.moveTo(x * 0.5, y * 0.5)));
  arrow.closePath();
  const arrowMesh = new THREE.Mesh(new THREE.ShapeGeometry(arrow), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, toneMapped: false }));
  const arrowLine = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(arrow.getPoints().map((p) => new THREE.Vector3(p.x, p.y, 0.002))), new THREE.LineBasicMaterial({ color: 0x0a1f35, toneMapped: false }));
  cur.add(arrowMesh, arrowLine);
  const tagTex = drawn(env, 256, 80, (g, w, h) => {
    fillRR(g, 0, 0, w, h, 40, "#4f9bff");
    fillRR(g, 36, 30, 120, 18, 9, "rgba(255,255,255,0.9)");
  });
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.28), new THREE.MeshBasicMaterial({ map: tagTex, transparent: true, toneMapped: false }));
  tag.position.set(0.62, -0.5, 0);
  cur.add(tag);
  cur.position.z = 0.12;
  board.add(cur);

  /* ---- guides across the stage ---- */
  const guideMat = (c: number, o: number) => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, toneMapped: false });
  const seg = (a: number[], b: number[], c: number, o: number) => {
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]), guideMat(c, o));
    group.add(l);
    return l;
  };
  const guides = [
    seg([-6.2, AY + AH / 2 + 0.5, 0.05], [6.2, AY + AH / 2 + 0.5, 0.05], 0xff6bd6, 0.55),
    seg([-6.2, AY - AH / 2 - 0.5, 0.05], [6.2, AY - AH / 2 - 0.5, 0.05], 0xff6bd6, 0.55),
    seg([-AW / 2 - 0.5, 0.2, 0.05], [-AW / 2 - 0.5, 7.2, 0.05], GLOW.sky, 0.45),
    seg([AW / 2 + 0.5, 0.2, 0.05], [AW / 2 + 0.5, 7.2, 0.05], GLOW.sky, 0.45),
  ];
  // a measure: an arrow with end ticks, between the artboard and the guide
  const measure = new THREE.Group();
  (
    [
      [[-AW / 2 - 0.5, AY + AH / 2, 0.06], [-AW / 2 - 0.5, AY + AH / 2 + 0.5, 0.06]],
      [[-AW / 2 - 0.62, AY + AH / 2, 0.06], [-AW / 2 - 0.38, AY + AH / 2, 0.06]],
      [[-AW / 2 - 0.62, AY + AH / 2 + 0.5, 0.06], [-AW / 2 - 0.38, AY + AH / 2 + 0.5, 0.06]],
    ] as number[][][]
  ).forEach(([a, b]) => measure.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]), guideMat(0xff6bd6, 0.9))));
  group.add(measure);

  /* ---- what floats round it ---- */
  // the palette: five glossy spheres of the brand's colours
  const palette = [0x22425f, 0x73c94a, 0x9dbbd3, 0x3e6d97, 0xf4f6f7].map((c, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.34, 40, 28), new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.22, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.1 }));
    m.position.set(-3.7 + i * 0.74, 0.7, 1.9 - Math.abs(i - 2) * 0.28);
    group.add(m);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.008, 6, 48), lit(GLOW.sky, 0.5));
    ring.rotation.x = Math.PI / 2;
    ring.position.set(m.position.x, 0.14, m.position.z);
    group.add(ring);
    return m;
  });
  // the type specimen and the component states
  const typeTex = drawn(env, 384, 384, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#ffffff");
    bg.addColorStop(1, "#e3ecf6");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#fff";
    g.font = "700 180px Inter, system-ui, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("Aa", w / 2, h * 0.46);
    fillRR(g, 60, 288, 150, 14, 7, "rgba(34,66,95,0.5)");
    fillRR(g, 60, 314, 100, 11, 5.5, "rgba(34,66,95,0.28)");
    g.beginPath();
    g.arc(w - 66, 306, 18, 0, TAU);
    g.fillStyle = "#5db536";
    g.fill();
    rr(g, 1.5, 1.5, w - 3, h - 3, 30);
    g.strokeStyle = "rgba(34,66,95,0.3)";
    g.lineWidth = 3;
    g.stroke();
  });
  const typeCard = makeScreen(env, typeTex, 1.5, 1.5, { accent: GLOW.sky, depth: 0.08, radius: 0.16, glow: 0.2 });
  const compTex = drawn(env, 576, 352, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#ffffff");
    bg.addColorStop(1, "#e9f0f7");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    ["#5db536", "rgba(115,201,74,0.55)", "rgba(34,66,95,0.14)"].forEach((c, i) => {
      fillRR(g, 36 + i * 170, 50, 150, 56, 28, c);
      fillRR(g, 66 + i * 170, 72, 90, 12, 6, i === 2 ? "rgba(34,66,95,0.6)" : "rgba(8,30,12,0.7)");
    });
    fillRR(g, 36, 150, 220, 60, 30, "rgba(34,66,95,0.1)");
    g.beginPath();
    g.arc(214, 180, 22, 0, TAU);
    g.fillStyle = "#5db536";
    g.fill();
    fillRR(g, 300, 156, 240, 48, 14, "rgba(34,66,95,0.1)");
    fillRR(g, 320, 174, 120, 12, 6, "rgba(34,66,95,0.4)");
    fillRR(g, 36, 250, 504, 46, 14, "rgba(34,66,95,0.08)");
    fillRR(g, 56, 268, 200, 11, 5.5, "rgba(34,66,95,0.34)");
    rr(g, 1.5, 1.5, w - 3, h - 3, 32);
    g.strokeStyle = "rgba(34,66,95,0.3)";
    g.lineWidth = 3;
    g.stroke();
  });
  const compCard = makeScreen(env, compTex, 2.4, 1.46, { accent: GLOW.green, depth: 0.08, radius: 0.12, glow: 0.2 });
  const floaters: { s: Screen; home: THREE.Vector3; yaw: number }[] = [
    { s: typeCard, home: new THREE.Vector3(3.5, 5.5, 0.9), yaw: -0.35 },
    { s: compCard, home: new THREE.Vector3(3.3, 1.35, 1.2), yaw: -0.3 },
  ];
  floaters.forEach((f) => {
    f.s.group.rotation.order = "YXZ";
    group.add(f.s.group);
  });

  // a bezier curve with its handles
  const P0 = new THREE.Vector3(-4.2, 4.7, 0.7);
  const C1 = new THREE.Vector3(-3.5, 6.1, 0.7);
  const C2 = new THREE.Vector3(-2.8, 4.1, 0.7);
  const P1 = new THREE.Vector3(-2.2, 5.5, 0.7);
  const bez = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CubicBezierCurve3(P0, C1, C2, P1), 60, 0.03, 6, false), lit(GLOW.green, 0.95));
  group.add(bez);
  const handlesGroup = new THREE.Group();
  [
    [P0, C1],
    [P1, C2],
  ].forEach(([a, b]) => handlesGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), guideMat(GLOW.sky, 0.8))));
  [P0, P1].forEach((p) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
    m.position.copy(p);
    handlesGroup.add(m);
  });
  [C1, C2].forEach((p) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 10), new THREE.MeshBasicMaterial({ color: 0x73c94a, toneMapped: false }));
    m.position.copy(p);
    handlesGroup.add(m);
  });
  group.add(handlesGroup);

  // the floor
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex(env, "34,66,95"), transparent: true, opacity: 0.12, depthWrite: false, toneMapped: false }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 0.03, 0.4);
  pool.scale.set(10, 5, 1);
  group.add(pool);
  const floorRing = circleLine(3.6, GLOW.sky, 0.3);
  floorRing.position.y = 0.04;
  group.add(floorRing);
  const standMat = stageMetal();
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.2, AY - AH / 2, 0.2), standMat);
  stand.position.set(0, (AY - AH / 2) / 2, -0.3);
  const standBase = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.14, 48), standMat);
  standBase.position.y = 0.07;
  const standRim = new THREE.Mesh(new THREE.TorusGeometry(1.12, 0.014, 8, 80), lit(GLOW.green, 0.9));
  standRim.rotation.x = Math.PI / 2;
  standRim.position.y = 0.145;
  group.add(stand, standBase, standRim);

  const frame: Frame = { cx: 0, cy: 3.3, hw: 4.55, hh: 3.4 };
  const model: Model = {
    group,
    tags: [wire.top, palette[1], typeCard.top],
    camera: { az: [-0.28, 0.28], elev: [0.15, 0.1] },
    floorY: 0,
    set(a, l, p) {
      const e = quint(a);
      // the sweep: it paints as the page is scrolled, and goes to and fro while it runs
      const sweep = e * (0.62 + 0.38 * Math.cos(p * TAU * 1.5 + 0.4)) * (0.55 + 0.45 * l) + e * 0.05;
      paintU.uSweep.value = Math.min(1, sweep);
      const sx = (sweep - 0.5) * (AW - 0.07);
      sweepLine.position.x = sx;
      sweepGlow.position.x = sx;
      sweepLine.visible = sweepGlow.visible = a > 0.02 && sweep < 0.995;
      cur.position.set(sx + 0.05, 0.1 + 0.5 * Math.sin(p * TAU * 2.6), 0.12);
      board.rotation.y = -0.16 + p * 0.28;
      handles.forEach((h, i) => h.scale.setScalar(0.6 + 0.4 * e + 0.08 * Math.sin(p * 18 + i)));
      palette.forEach((m, i) => {
        const t = quint(clamp01((a * 1.5 - i * 0.07) / 0.6));
        m.scale.setScalar(Math.max(0.001, t));
        m.position.y = 0.7 + 0.1 * Math.sin(p * TAU * 2 + i * 1.3) + (1 - t) * 0.6;
      });
      floaters.forEach((f, i) => {
        const t = quint(clamp01((a * 1.5 - 0.25 - i * 0.1) / 0.6));
        f.s.group.position.copy(f.home);
        f.s.group.position.x += (1 - t) * 1.4;
        f.s.group.position.y += 0.07 * Math.sin(p * TAU * 2 + i * 2);
        f.s.group.rotation.y = f.yaw;
        f.s.group.scale.setScalar(Math.max(0.001, lerp(0.6, 1, t)));
        (f.s.light.material as THREE.SpriteMaterial).opacity = (0.1 + 0.14 * l) * t;
      });
      bez.scale.setScalar(Math.max(0.001, e));
      handlesGroup.scale.setScalar(Math.max(0.001, e));
      handlesGroup.position.y = 0.06 * Math.sin(p * TAU * 2);
      bez.position.y = handlesGroup.position.y;
      guides.forEach((g) => ((g.material as THREE.LineBasicMaterial).opacity = (0.3 + 0.3 * l) * e));
      measure.visible = a > 0.3;
      (standRim.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.5 * l;
      (pool.material as THREE.MeshBasicMaterial).opacity = 0.1 + 0.06 * l;
      group.updateMatrixWorld(true);
    },
    frame: () => frame,
  };
  model.set(1, 1, 0.5);
  return model;
};

export default build;
