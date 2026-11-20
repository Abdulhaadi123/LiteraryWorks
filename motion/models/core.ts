import * as THREE from "three";
import { clamp01, lerp, quint, smooth, TAU, win } from "../engine";
import { makeBeam, type Beam } from "../kit";
import { crispDot, floorShadow, bandGeometry, chrome, stageMetal, circleLine, COLUMN_F, COLUMN_V, GLOW, glowTex, lightSprite, lit, makeTile, NUCLEUS_F, NUCLEUS_V, tickMarks, type Tile } from "./glow";
import { drawn } from "./parts";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * The home page: "one connected system", drawn as a machine. An AI core (a living blue nucleus inside a faceted glass
 * shell and three turning metal rings) stands on a polished stage. Nine service tiles, one for each thing we build,
 * start as a loose swarm around it; a scan sweeps up through them, threads of light join each one to the core, and
 * they lock into a single halo while the core powers up and starts to run. The scroll drives all of it.
 */

const CORE = new THREE.Vector3(0, 3.85, 0);
const N = 9;
/** The halo of tiles: its radius, how far it leans back to face the viewer, and the size of a tile. */
const RT = 3.5;
const TILT = 0.95;
const TILE = 1.1;
const ICONS = ["spark", "wave", "layers", "grid", "browser", "phone", "pen", "cloud", "tower"];

const RINGS = [
  { R: 1.62, w: 0.07, h: 0.17, tilt: [1.2, 0, 0.3], speed: 1.0, ticks: 72, color: 0xe3ecf6, arcs: [[0.3, 0.9]] },
  { R: 2.05, w: 0.06, h: 0.13, tilt: [0.5, 0, -0.75], speed: -0.7, ticks: 90, color: 0xa9c0d6, arcs: [[2.3, 0.7]] },
  { R: 2.5, w: 0.08, h: 0.22, tilt: [-0.28, 0, 0.12], speed: 0.45, ticks: 120, color: 0xe3ecf6, arcs: [[0.9, 1.1], [4.1, 0.5]] },
];

const SHELL_V = /* glsl */ `
attribute float aFace; varying vec3 vView; varying float vFace;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz; vFace = aFace;
  gl_Position = projectionMatrix * mv;
}`;
const SHELL_F = /* glsl */ `
uniform float uPower; varying vec3 vView; varying float vFace;
void main() {
  vec3 n = normalize(cross(dFdx(vView), dFdy(vView)));
  float f = pow(1.0 - abs(dot(n, normalize(-vView))), 1.5);
  vec3 col = mix(vec3(0.40, 0.68, 1.0), vec3(0.14, 0.36, 0.78), f);
  float a = (0.03 + 0.3 * f + 0.05 * vFace) * (0.65 + 0.6 * uPower);
  gl_FragColor = vec4(col, a);
}`;

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();
  const rnd = env.rnd;
  group.add(floorShadow(env, 10.5, 7.5, 0.2));

  /* ---- the stage: two discs of polished dark metal with lit rims, and a ring inlaid in the top ---- */
  const plinthMat = stageMetal();
  const base1 = new THREE.Mesh(new THREE.CylinderGeometry(3.55, 3.75, 0.22, 112), plinthMat);
  base1.position.y = 0.11;
  const base2 = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 3.1, 0.14, 112), plinthMat);
  base2.position.y = 0.29;
  const rim1 = new THREE.Mesh(new THREE.TorusGeometry(3.58, 0.02, 8, 180), lit(GLOW.green, 0.9));
  rim1.rotation.x = Math.PI / 2;
  rim1.position.y = 0.215;
  const rim2 = new THREE.Mesh(new THREE.TorusGeometry(2.92, 0.014, 8, 180), lit(GLOW.sky, 0.8));
  rim2.rotation.x = Math.PI / 2;
  rim2.position.y = 0.358;
  const inlayTex = drawn(env, 1024, 1024, (g, w) => {
    const c = w / 2;
    g.translate(c, c);
    g.strokeStyle = "rgba(34,66,95,0.55)";
    g.lineWidth = 3;
    [0.96, 0.62].forEach((k) => {
      g.beginPath();
      g.arc(0, 0, c * k, 0, TAU);
      g.stroke();
    });
    g.lineWidth = 2;
    for (let i = 0; i < 144; i++) {
      const a = (i / 144) * TAU;
      const r1 = c * (i % 6 === 0 ? 0.84 : 0.89);
      g.beginPath();
      g.moveTo(Math.cos(a) * c * 0.93, Math.sin(a) * c * 0.93);
      g.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      g.stroke();
    }
    g.lineCap = "round";
    g.lineWidth = 8;
    g.strokeStyle = "rgba(93,181,54,0.95)";
    [
      [0.2, 0.7],
      [3.3, 3.9],
    ].forEach(([a0, a1]) => {
      g.beginPath();
      g.arc(0, 0, c * 0.96, a0, a1);
      g.stroke();
    });
  });
  const inlay = new THREE.Mesh(new THREE.CircleGeometry(2.9, 112), new THREE.MeshBasicMaterial({ map: inlayTex, transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false }));
  inlay.rotation.x = -Math.PI / 2;
  inlay.position.y = 0.365;
  group.add(base1, base2, rim1, rim2, inlay);

  // a pool of light on the stage, under the column
  const pool = lightSprite(env, "34,66,95", 5.5, 0.2);
  const poolPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex(env, "34,66,95"), transparent: true, opacity: 0.12, depthWrite: false, toneMapped: false }));
  poolPlane.rotation.x = -Math.PI / 2;
  poolPlane.position.y = 0.375;
  poolPlane.scale.set(5.8, 5.8, 1);
  pool.visible = false;
  group.add(poolPlane);

  // the column of light from the stage up to the core
  const colH = CORE.y - 0.4 - 0.85;
  const colMat = new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 0.3 }, uColor: { value: new THREE.Color(0x7cb4f0) } },
    vertexShader: COLUMN_V,
    fragmentShader: COLUMN_F,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.95, colH, 48, 1, true), colMat);
  column.position.y = 0.4 + colH / 2;
  group.add(column);

  /* ---- the core ---- */
  const coreG = new THREE.Group();
  coreG.position.copy(CORE);
  group.add(coreG);

  const nucU = { uT: { value: 0 }, uGlow: { value: 0.3 } };
  const nucleus = new THREE.Mesh(new THREE.SphereGeometry(0.85, 64, 48), new THREE.ShaderMaterial({ uniforms: nucU, vertexShader: NUCLEUS_V, fragmentShader: NUCLEUS_F }));
  coreG.add(nucleus);
  const nucGlow = lightSprite(env, "90,200,150", 5.2, 0.2);
  coreG.add(nucGlow);
  const nucGlow2 = lightSprite(env, "90,160,255", 8, 0.1);
  coreG.add(nucGlow2);
  const coreLight = new THREE.PointLight(0x86d6ff, 36, 14, 2);
  coreG.add(coreLight);

  // the glass shell, facets that catch the light at their edges
  const shellGeo = new THREE.IcosahedronGeometry(1.32, 1);
  const faces = new Float32Array(shellGeo.attributes.position.count);
  for (let t = 0; t < faces.length; t += 3) {
    const v = rnd();
    faces[t] = faces[t + 1] = faces[t + 2] = v;
  }
  shellGeo.setAttribute("aFace", new THREE.BufferAttribute(faces, 1));
  const shellU = { uPower: { value: 0.3 } };
  const shell = new THREE.Group();
  const shellMesh = new THREE.Mesh(shellGeo, new THREE.ShaderMaterial({ uniforms: shellU, vertexShader: SHELL_V, fragmentShader: SHELL_F, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  const shellEdges = new THREE.LineSegments(new THREE.EdgesGeometry(shellGeo), new THREE.LineBasicMaterial({ color: 0x2f6fb5, transparent: true, opacity: 0.5, toneMapped: false, depthWrite: false }));
  shell.add(shellMesh, shellEdges);
  coreG.add(shell);

  // three turning rings of metal with fine marks, a lit arc and a bead each
  const metal = RINGS.map((r) => chrome(r.color, 0.24));
  const spinners: THREE.Group[] = [];
  const arcs: THREE.Mesh[][] = [];
  const beads: THREE.Group[] = [];
  RINGS.forEach((r, i) => {
    const pivot = new THREE.Group();
    pivot.rotation.set(r.tilt[0], r.tilt[1], r.tilt[2]);
    const spin = new THREE.Group();
    spin.add(new THREE.Mesh(bandGeometry(r.R, r.w, r.h), metal[i]));
    spin.add(tickMarks(r.R, r.w, r.h, r.ticks));
    const mine: THREE.Mesh[] = [];
    r.arcs.forEach(([from, len]) => {
      const holder = new THREE.Group();
      holder.rotation.x = Math.PI / 2;
      const arc = new THREE.Mesh(new THREE.TorusGeometry(r.R, 0.028, 8, 48, len), lit(GLOW.green, 0.95));
      arc.rotation.z = from;
      holder.add(arc);
      spin.add(holder);
      mine.push(arc);
    });
    arcs.push(mine);
    const bead = new THREE.Group();
    bead.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 14), new THREE.MeshBasicMaterial({ color: 0x22425f, toneMapped: false })));
    const bl = lightSprite(env, "115,201,74", 0.7, 0.45);
    bead.add(bl);
    bead.userData.r = r.R;
    pivot.add(bead);
    beads.push(bead);
    pivot.add(spin);
    coreG.add(pivot);
    spinners.push(spin);
  });

  /* ---- the nine service tiles ---- */
  const tiles: Tile[] = ICONS.map((icon, i) => {
    const green = i % 3 === 0;
    const t = makeTile(env, icon, TILE, green ? GLOW.green : GLOW.sky, green ? "120,215,110" : "110,180,255");
    group.add(t.group);
    return t;
  });
  const haloLine = circleLine(RT, GLOW.sky, 0.22);
  const haloPivot = new THREE.Group();
  haloPivot.position.copy(CORE);
  haloPivot.rotation.x = TILT;
  haloPivot.add(haloLine);
  // a dial of fine marks behind the tiles, turning with them
  const dialTex = drawn(env, 1024, 1024, (g, w) => {
    const c = w / 2;
    g.translate(c, c);
    const gr = g.createRadialGradient(0, 0, c * 0.5, 0, 0, c * 0.985);
    gr.addColorStop(0, "rgba(47,111,181,0)");
    gr.addColorStop(1, "rgba(47,111,181,0.1)");
    g.fillStyle = gr;
    g.beginPath();
    g.arc(0, 0, c * 0.985, 0, TAU);
    g.fill();
    g.strokeStyle = "rgba(34,66,95,0.55)";
    g.lineWidth = 2.5;
    g.beginPath();
    g.arc(0, 0, c * 0.985, 0, TAU);
    g.stroke();
    g.strokeStyle = "rgba(34,66,95,0.22)";
    g.beginPath();
    g.arc(0, 0, c * 0.8, 0, TAU);
    g.stroke();
    g.strokeStyle = "rgba(34,66,95,0.5)";
    for (let i = 0; i < 180; i++) {
      const a = (i / 180) * TAU;
      const long = i % 10 === 0;
      g.lineWidth = long ? 2.5 : 1.5;
      g.beginPath();
      g.moveTo(Math.cos(a) * c * 0.985, Math.sin(a) * c * 0.985);
      g.lineTo(Math.cos(a) * c * (long ? 0.925 : 0.955), Math.sin(a) * c * (long ? 0.925 : 0.955));
      g.stroke();
    }
    g.lineCap = "round";
    g.lineWidth = 7;
    g.strokeStyle = "rgba(93,181,54,0.95)";
    [
      [0.5, 1.0],
      [2.4, 2.9],
      [4.2, 4.6],
    ].forEach(([a0, a1]) => {
      g.beginPath();
      g.arc(0, 0, c * 0.985, a0, a1);
      g.stroke();
    });
  });
  const dial = new THREE.Mesh(new THREE.CircleGeometry(RT + 0.85, 128), new THREE.MeshBasicMaterial({ map: dialTex, transparent: true, opacity: 0.6, depthWrite: false, toneMapped: false }));
  dial.rotation.x = -Math.PI / 2;
  dial.position.y = -0.12;
  haloPivot.add(dial);
  const runners = [0, 1, 2].map((k) => {
    const b = new THREE.Group();
    b.add(new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), new THREE.MeshBasicMaterial({ color: 0x22425f, toneMapped: false })));
    b.add(lightSprite(env, k ? "47,111,181" : "115,201,74", 0.9, 0.4));
    haloPivot.add(b);
    return b;
  });
  group.add(haloPivot);

  const ringQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(TILT, 0, 0));
  const finQ = ringQ.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)));
  const phi0 = (i: number) => (i / N) * TAU - Math.PI / 2;
  // the loose swarm: round the core, at different depths, mostly facing the viewer
  const scat = tiles.map((_, i) => {
    const a = Math.PI / 2 - (i / N) * TAU + (rnd() - 0.5) * 0.5;
    const k = 0.92 + rnd() * 0.22;
    const pos = new THREE.Vector3(Math.cos(a) * 3.55 * k, Math.sin(a) * 3.1 * k, (rnd() - 0.5) * 3.4);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.9, (rnd() - 0.5) * 1.5, (rnd() - 0.5) * 1.0));
    return { pos, q, ph: rnd() * TAU };
  });

  // a thread of light from the core to every tile, and a pulse along it
  const accents = tiles.map((_, i) => (i % 3 === 0 ? 0x73c94a : 0x4f8fd9));
  const threads: Beam[] = tiles.map((_, i) => makeBeam(accents[i], 0.012));
  threads.forEach((b) => group.add(b.mesh));
  const pulseGeo = new THREE.SphereGeometry(0.07, 16, 12);
  const pulses = tiles.map((_, i) => {
    const m = new THREE.Mesh(pulseGeo, new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0x73c94a : 0x2f6fb5, transparent: true, depthWrite: false, toneMapped: false }));
    group.add(m);
    return m;
  });

  // the scan: a ring of light and a veil that sweep up through the swarm
  const scanRing = new THREE.Mesh(new THREE.TorusGeometry(4.3, 0.022, 8, 180), lit(GLOW.sky, 0.9));
  scanRing.rotation.x = Math.PI / 2;
  const scanVeil = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex(env, "47,111,181"), transparent: true, opacity: 0.1, depthWrite: false, toneMapped: false }));
  scanVeil.rotation.x = -Math.PI / 2;
  scanVeil.scale.set(10, 10, 1);
  group.add(scanRing, scanVeil);

  // fine lights rising up the column and in to the core
  const PN = 520;
  const pPos = new Float32Array(PN * 3);
  const pCol = new Float32Array(PN * 3);
  const pr = Array.from({ length: PN }, () => ({ th: rnd() * TAU, r: 0.25 + rnd() * 1.5, v: 0.5 + rnd() * 1.1, u: rnd(), g: rnd() < 0.2 }));
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
  const motes = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.075, map: crispDot(env), vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true, toneMapped: false }));
  motes.frustumCulled = false;
  group.add(motes);

  /* ---- the tags: four tiles and the core ---- */
  const tagAt = [0, 1, 4, 7];
  // the core's tag points at the top of its shell, so it does not cover the nucleus
  const coreTag = new THREE.Object3D();
  coreTag.position.set(0, 1.4, 0);
  coreG.add(coreTag);
  const frame: Frame = { cx: 0, cy: 3.2, hw: 4.3, hh: 4.2 };

  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const aa = new THREE.Vector3();
  const bb = new THREE.Vector3();
  const qq = new THREE.Quaternion();
  const green = new THREE.Color(0x73c94a);
  const blue = new THREE.Color(0x2f6fb5);
  const c = new THREE.Color();

  const model: Model = {
    group,
    tags: [...tagAt.map((i) => tiles[i].top), coreTag],
    camera: { az: [-0.32, 0.18], elev: [0.2, 0.12] },
    floorY: 0,
    set(_a, _l, p) {
      const power = smooth(win(p, 0.15, 0.75));
      const run = win(p, 0.66, 0.92);
      const scanT = win(p, 0.1, 0.36);
      const scanY = lerp(0.3, 7.3, scanT);
      const scanA = Math.sin(scanT * Math.PI);

      /* the core */
      nucU.uT.value = p * 6;
      nucU.uGlow.value = 0.38 + 0.62 * power;
      nucleus.rotation.y = p * 2.2;
      shellU.uPower.value = power;
      shell.rotation.set(0.25 + p * 0.5, p * 1.3, 0);
      (shellEdges.material as THREE.LineBasicMaterial).opacity = 0.28 + 0.34 * power;
      const breathe = 1 + 0.025 * Math.sin(p * TAU * 6) * run;
      nucleus.scale.setScalar(breathe);
      (nucGlow.material as THREE.SpriteMaterial).opacity = 0.1 + 0.16 * power;
      (nucGlow2.material as THREE.SpriteMaterial).opacity = 0.05 + 0.07 * power;
      coreLight.intensity = 14 + 26 * power;
      RINGS.forEach((r, i) => {
        spinners[i].rotation.y = p * TAU * 0.42 * r.speed + i * 1.7;
        arcs[i].forEach((a, k) => {
          a.rotation.z = RINGS[i].arcs[k][0] + p * TAU * (0.6 + 0.3 * k) * (i % 2 ? -1 : 1);
        });
        const bead = beads[i];
        const ang = p * TAU * (1.4 + i * 0.5) * (i % 2 ? -1 : 1) + i * 2.1;
        bead.position.set(Math.cos(ang) * r.R, 0, Math.sin(ang) * r.R);
      });

      /* the stage */
      (rim1.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.5 * power;
      (rim2.material as THREE.MeshBasicMaterial).opacity = 0.45 + 0.45 * power;
      (inlay.material as THREE.MeshBasicMaterial).opacity = 0.45 + 0.4 * power;
      inlay.rotation.z = p * 0.9;
      (poolPlane.material as THREE.MeshBasicMaterial).opacity = 0.1 + 0.08 * power;
      colMat.uniforms.uOpacity.value = 0.1 + 0.1 * power + 0.04 * run;

      /* the scan */
      scanRing.position.set(0, scanY, 0);
      scanVeil.position.set(0, scanY, 0);
      scanRing.visible = scanVeil.visible = scanA > 0.01;
      (scanRing.material as THREE.MeshBasicMaterial).opacity = 0.85 * scanA;
      (scanVeil.material as THREE.MeshBasicMaterial).opacity = 0.1 * scanA;

      /* the tiles: from the swarm into the halo, one after the other, the halo turning slowly */
      const spin = p * 0.75;
      tiles.forEach((t, i) => {
        const e = quint(win(p, 0.1 + i * 0.02, 0.5 + i * 0.012));
        const s = scat[i];
        const ph = phi0(i) + spin;
        tmp.set(Math.cos(ph) * RT, 0, Math.sin(ph) * RT).applyQuaternion(ringQ).add(CORE);
        const drift = (1 - e) * 0.16;
        aa.copy(s.pos).add(CORE);
        aa.x += Math.sin(p * TAU * 1.3 + s.ph) * drift;
        aa.y += Math.cos(p * TAU * 1.1 + s.ph * 1.7) * drift;
        // a little outward bow on the way, so they swing in and do not cut across the core
        t.group.position.lerpVectors(aa, tmp, e);
        tmp2.copy(tmp).sub(CORE).normalize();
        t.group.position.addScaledVector(tmp2, Math.sin(e * Math.PI) * 0.7);
        qq.copy(s.q).slerp(finQ, e);
        t.group.quaternion.copy(qq);
        // the edge flares as the scan passes through the tile
        const near = Math.exp(-Math.pow((t.group.position.y - scanY) / 0.65, 2)) * scanA;
        t.edge.forEach((l, k) => ((l.material as THREE.LineBasicMaterial).opacity = (k ? 0.65 : 0.9) + 0.1 * near));
        (t.light.material as THREE.SpriteMaterial).opacity = 0.1 + 0.08 * e + 0.14 * near;
        t.light.scale.setScalar(TILE * (2 + 0.3 * near));
      });
      haloPivot.rotation.x = TILT;
      (haloLine.material as THREE.LineBasicMaterial).opacity = 0.34 * quint(win(p, 0.3, 0.6));
      haloLine.rotation.y = spin;
      dial.rotation.z = -spin * 0.6;
      (dial.material as THREE.MeshBasicMaterial).opacity = 0.65 * quint(win(p, 0.25, 0.55)) + 0.18;
      runners.forEach((b, k) => {
        const ang = p * TAU * (1.1 + 0.35 * k) + k * 2.1;
        b.position.set(Math.cos(ang) * RT, 0, Math.sin(ang) * RT);
        b.visible = p > 0.3;
      });

      /* a thread to every tile, and a pulse along it once the system runs */
      group.updateMatrixWorld(true);
      tiles.forEach((t, i) => {
        const g = clamp01((win(p, 0.3, 0.58) * 1.5 - i * 0.075) / 0.55);
        t.group.getWorldPosition(bb);
        dir.copy(bb).sub(CORE);
        const len = dir.length();
        dir.divideScalar(len || 1);
        aa.copy(CORE).addScaledVector(dir, 0.9);
        bb.addScaledVector(dir, -TILE * 0.62);
        threads[i].aim(aa, bb, quint(g));
        (threads[i].mesh.material as THREE.MeshBasicMaterial).opacity = 0.55 + 0.4 * run;
        const pm = pulses[i];
        const on = g > 0.98 && run > 0.02;
        pm.visible = on;
        if (on) {
          const k = (p * (3.2 + (i % 3) * 0.6) + i * 0.17) % 1;
          pm.position.lerpVectors(aa, bb, k);
          const s = Math.sin(k * Math.PI);
          pm.scale.setScalar(0.6 + 0.9 * s);
          (pm.material as THREE.MeshBasicMaterial).opacity = (0.35 + 0.65 * s) * run;
        }
      });

      /* the lights that rise and spiral in */
      for (let i = 0; i < PN; i++) {
        const q = pr[i];
        const u = (q.u + p * q.v * 1.6) % 1;
        const y = lerp(0.42, CORE.y - 0.5, u);
        const r = q.r * (1 - 0.82 * u) + 0.1;
        const th = q.th + u * TAU * 1.3 + p * 1.5;
        pPos[i * 3] = Math.cos(th) * r;
        pPos[i * 3 + 1] = y;
        pPos[i * 3 + 2] = Math.sin(th) * r;
        const f = Math.pow(Math.sin(u * Math.PI), 0.8) * (0.4 + 0.6 * power);
        c.copy(q.g ? green : blue).multiplyScalar(f);
        pCol[i * 3] = c.r;
        pCol[i * 3 + 1] = c.g;
        pCol[i * 3 + 2] = c.b;
      }
      pGeo.attributes.position.needsUpdate = true;
      pGeo.attributes.color.needsUpdate = true;
    },
    frame: () => frame,
    dispose() {
      pulseGeo.dispose();
    },
  };
  model.set(0, 0, 0);
  return model;
};

export default build;
