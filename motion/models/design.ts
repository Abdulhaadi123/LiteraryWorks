import * as THREE from "three";
import { lerp, quint, win } from "../engine";
import { C, dot, drawn, fillRR, glass, glossy, marker, plateTexture, plane, skel } from "./parts";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * UI and UX design: a wireframe becomes the product. A grey sketch of a screen is painted into one of our own finished
 * designs by a green line that sweeps across it as the page scrolls, with a cursor riding the line; round it float the
 * parts of a design system: a palette of the brand's colours, a type tile and a pen path.
 */

const PW = 4.5;
const PH = 2.8;
const CY = 2.15;

const FRAG = `
uniform sampler2D uWire;
uniform sampler2D uUI;
uniform float uT;
varying vec2 vUv;
void main() {
  vec4 w = texture2D(uWire, vUv);
  vec4 u = texture2D(uUI, vUv);
  float s = vUv.x * 0.88 + (1.0 - vUv.y) * 0.12;
  float m = smoothstep(uT - 0.012, uT + 0.012, s);
  vec3 col = mix(u.rgb, w.rgb, m);
  float edge = (1.0 - smoothstep(0.0, 0.026, abs(s - uT))) * step(0.001, uT) * (1.0 - step(0.999, uT));
  col = mix(col, vec3(0.171, 0.58, 0.07), edge * 0.9);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();
  const ui = await env.shot("storyia", 1024, 640);

  /* ---- the sketch: grey outlines of a screen ---- */
  const wire = drawn(env, 1024, 640, (g, w, h) => {
    g.fillStyle = "#f7f9fb";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#9aa9b6";
    g.lineWidth = 4;
    g.setLineDash([14, 10]);
    const box = (x: number, y: number, bw: number, bh: number) => {
      g.beginPath();
      g.roundRect(x, y, bw, bh, 10);
      g.stroke();
    };
    box(40, 36, 944, 70);
    box(40, 134, 580, 300);
    g.beginPath();
    g.moveTo(40, 134);
    g.lineTo(620, 434);
    g.moveTo(620, 134);
    g.lineTo(40, 434);
    g.stroke();
    box(656, 134, 328, 140);
    box(656, 294, 328, 140);
    [0, 1, 2].forEach((i) => box(40 + i * 322, 464, 300, 140));
    g.setLineDash([]);
    g.strokeStyle = "#b9c5cf";
    g.lineWidth = 6;
    g.lineCap = "round";
    [[70, 70, 220], [700, 168, 220], [700, 196, 150], [700, 330, 240], [700, 358, 160]].forEach(([x, y, l]) => {
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + l / 2, y - 7, x + l, y);
      g.stroke();
    });
  });

  /* ---- the screen: wireframe -> finished design, by a sweep ---- */
  const screen = glass(env, ui, PW, PH, { radius: 0.18, depth: 0.08 });
  const mat = new THREE.ShaderMaterial({ uniforms: { uWire: { value: wire }, uUI: { value: ui }, uT: { value: 0 } }, vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }", fragmentShader: FRAG });
  (screen.body.material as THREE.Material[])[0] = mat;
  group.add(screen.group);

  /* ---- the cursor that rides the sweep ---- */
  const arrow = new THREE.Shape();
  [[0, 0], [0, -1], [0.26, -0.77], [0.5, -1.18], [0.68, -1.08], [0.44, -0.7], [0.76, -0.7]].forEach(([x, y], i) => (i ? arrow.lineTo(x, y) : arrow.moveTo(x, y)));
  arrow.closePath();
  const cursor = new THREE.Group();
  const cursorMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(arrow, { depth: 0.03, bevelEnabled: false }), glossy(0x191716, 0.3, 0.6));
  cursorMesh.scale.setScalar(0.42);
  cursor.add(cursorMesh);
  const chipTex = drawn(env, 280, 76, (g, w, h) => {
    fillRR(g, 0, 0, w, h, 38, C.green);
    skel(g, 34, 28, 150, 18, "rgba(25,23,22,0.75)");
  });
  const chip = plane(chipTex, 0.78, 0.21, 0.1);
  chip.position.set(0.5, -0.55, 0.02);
  cursor.add(chip);
  group.add(cursor);

  /* ---- the palette, the type tile and the pen path ---- */
  const swatchGeo = new THREE.SphereGeometry(1, 40, 28);
  const swatches = [
    { c: 0x73c94a, r: 0.34 },
    { c: 0x22425f, r: 0.42 },
    { c: 0x9dbbd3, r: 0.3 },
    { c: 0x191716, r: 0.26 },
    { c: 0xdfe7ee, r: 0.36 },
  ].map((s, i) => {
    const m = new THREE.Mesh(swatchGeo, new THREE.MeshPhysicalMaterial({ color: s.c, roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1 }));
    group.add(m);
    return { m, ...s, x: -2.4 + i * 1.2, i };
  });
  const type = glass(env, plateTexture(env, 360, 360, (g, w, h) => {
    g.fillStyle = C.navy;
    g.font = "800 190px Inter, system-ui, sans-serif";
    g.textAlign = "center";
    g.fillText("Aa", w / 2, h / 2 + 64);
    skel(g, 90, 292, 180, 12, C.rule);
    dot(g, 300, 60, 14, C.green);
  }), 1.15, 1.15, { radius: 0.16, depth: 0.05 });
  group.add(type.group);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-4.1, 1.2, 0.5), new THREE.Vector3(-3.4, 3.3, 0.7), new THREE.Vector3(-2.7, 1.4, 0.9), new THREE.Vector3(-2.2, 3.0, 0.7)]);
  const pen = new THREE.Group();
  const tubeGeo = new THREE.TubeGeometry(curve, 60, 0.026, 8);
  pen.add(new THREE.Mesh(tubeGeo, glossy(0x22425f, 0.3, 0.8)));
  const anchorGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
  [curve.getPoint(0), curve.getPoint(1)].forEach((pt) => {
    const m = new THREE.Mesh(anchorGeo, glossy(0xffffff, 0.3, 0.8));
    m.position.copy(pt);
    pen.add(m);
  });
  const handleGeo = new THREE.SphereGeometry(0.06, 12, 8);
  [new THREE.Vector3(-3.6, 1.8, 0.8), new THREE.Vector3(-2.5, 2.7, 0.8)].forEach((pt) => {
    const m = new THREE.Mesh(handleGeo, new THREE.MeshBasicMaterial({ color: 0x73c94a, toneMapped: false }));
    m.position.copy(pt);
    pen.add(m);
  });
  group.add(pen);

  const rnd = env.rnd;
  const loose = swatches.map(() => new THREE.Vector3((rnd() - 0.5) * 9, 0.6 + rnd() * 4, (rnd() - 0.3) * 3));
  const frame: Frame = { cx: 0, cy: 2.0, hw: 5.2, hh: 2.9 };
  const model: Model = {
    group,
    tags: [marker(screen.group, -PW / 2 + 0.25, PH / 2 - 0.25, 0.1), marker(group, 1.9, 0.9, 1.5), marker(screen.group, PW / 2 - 0.3, -PH / 2 + 0.3, 0.1)],
    camera: { az: [-0.3, 0.26], elev: [0.16, 0.1] },
    ground: true,
    floorY: 0,
    set(a, l, p) {
      const eS = quint(win(a, 0, 0.6));
      screen.group.position.set(0.2, lerp(3.2, CY, eS), lerp(-1.5, 0, eS));
      screen.group.rotation.set(lerp(0.25, 0, eS), lerp(0.7, -0.12, eS), 0);
      // the sweep from sketch to design
      const t = quint(win(p, 0.22, 0.82));
      mat.uniforms.uT.value = lerp(-0.04, 1.04, t);
      const ex = (mat.uniforms.uT.value - 0.12 * 0.35) / 0.88;
      cursor.position.set(0.2 + (ex - 0.5) * PW * Math.cos(0.12), CY + (0.5 - 0.62) * PH + Math.sin(p * 18) * 0.04, 0.42);
      cursor.visible = t > 0.01 && t < 0.99;
      swatches.forEach((s) => {
        const e = quint(win(a, 0.1 + s.i * 0.08, 0.7 + s.i * 0.05));
        s.m.position.set(lerp(loose[s.i].x, s.x, e), lerp(loose[s.i].y, 0.62 + 0.08 * Math.sin(p * 6 + s.i * 1.4), e), lerp(loose[s.i].z, 1.7, e));
        s.m.scale.setScalar(s.r);
      });
      const eT = quint(win(a, 0.3, 0.9));
      type.group.position.set(lerp(6, 3.4, eT), lerp(4.5, 1.5, eT), lerp(0, 1.0, eT));
      type.group.rotation.set(0, lerp(-1, -0.35, eT), lerp(0.4, 0, eT));
      pen.scale.setScalar(Math.max(0.001, quint(win(a, 0.2, 0.8))));
      pen.rotation.y = lerp(0.6, 0, eT);
      void l;
      frame.hw = lerp(5.8, 4.6, eS);
    },
    frame: () => frame,
    dispose() {
      swatchGeo.dispose();
      tubeGeo.dispose();
      anchorGeo.dispose();
      handleGeo.dispose();
      mat.dispose();
    },
  };
  model.set(0, 0, 0);
  return model;
};

export default build;
