import * as THREE from "three";
import { clamp01, lerp, quint, TAU } from "../engine";
import { bandGeometry, chrome, stageMetal, circleLine, GLOW, glowTex, lightColumn, lightSprite, lit, tickMarks } from "./glow";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * Cloud and DevOps: a planet drawn in points of light, turning on a projector base. Eleven regions light up on it and
 * arcs of light run between them carrying small pulses (deployments and traffic); a ring of marks round it is the
 * monitoring, and a satellite keeps watch on an orbit. The scroll turns the planet and draws the arcs in.
 */

const R = 2.45;
const G = new THREE.Vector3(0, 3.9, 0);

const hash3 = (x: number, y: number, z: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
};
const sm = (t: number) => t * t * (3 - 2 * t);
function vnoise(x: number, y: number, z: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const u = sm(x - xi);
  const v = sm(y - yi);
  const w = sm(z - zi);
  const c = (i: number, j: number, k: number) => hash3(xi + i, yi + j, zi + k);
  return lerp(lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v), lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v), w);
}
const fbm = (x: number, y: number, z: number) => {
  let a = 0.5;
  let s = 0;
  let f = 1;
  for (let i = 0; i < 4; i++) {
    s += a * vnoise(x * f, y * f, z * f);
    f *= 2.07;
    a *= 0.5;
  }
  return s;
};

/** [latitude, longitude] of the regions. */
const REGIONS: [number, number][] = [
  [39, -77],
  [37, -122],
  [41, -96],
  [51.5, 0],
  [50, 8.7],
  [25, 55],
  [19, 73],
  [1.3, 103.8],
  [35.7, 139.7],
  [-33.9, 151.2],
  [-23.5, -46.6],
];
const LINKS: [number, number][] = [
  [0, 3],
  [0, 10],
  [1, 8],
  [8, 7],
  [7, 6],
  [3, 5],
  [4, 6],
  [1, 2],
  [2, 0],
  [9, 7],
  [5, 7],
  [3, 4],
];
const unit = (lat: number, lon: number) => {
  const p = (lat * Math.PI) / 180;
  const l = (lon * Math.PI) / 180;
  return new THREE.Vector3(Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l));
};

const ATM_V = /* glsl */ `
varying vec3 vN; varying vec3 vV;
void main() {
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;
const ATM_F = /* glsl */ `
uniform float uOpacity; varying vec3 vN; varying vec3 vV;
void main() {
  float f = pow(1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), 2.6);
  gl_FragColor = vec4(mix(vec3(0.25, 0.55, 1.0), vec3(0.45, 0.95, 0.8), f * 0.6), f * uOpacity);
}`;

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();
  const rnd = env.rnd;

  /* ---- the projector base and its beam ---- */
  const baseMat = stageMetal();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.95, 0.24, 80), baseMat);
  base.position.y = 0.12;
  const base2 = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.45, 0.16, 80), baseMat);
  base2.position.y = 0.32;
  const rimA = new THREE.Mesh(new THREE.TorusGeometry(1.77, 0.018, 8, 120), lit(GLOW.green, 0.9));
  rimA.rotation.x = Math.PI / 2;
  rimA.position.y = 0.245;
  const rimB = new THREE.Mesh(new THREE.TorusGeometry(1.27, 0.014, 8, 120), lit(GLOW.sky, 0.8));
  rimB.rotation.x = Math.PI / 2;
  rimB.position.y = 0.405;
  const beamH = G.y - R - 0.45;
  const beam = lightColumn(0x7cc4ff, 0.55, 1.15, beamH);
  beam.mesh.position.y = 0.42 + beamH / 2;
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex(env, "110,190,255"), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.42;
  pool.scale.set(3.4, 3.4, 1);
  group.add(base, base2, rimA, rimB, beam.mesh, pool);

  /* ---- the planet ---- */
  const globe = new THREE.Group();
  globe.position.copy(G);
  group.add(globe);
  const tilt = new THREE.Group();
  tilt.rotation.set(0.3, 0, 0.41);
  globe.add(tilt);
  const spin = new THREE.Group();
  tilt.add(spin);
  spin.add(new THREE.Mesh(new THREE.SphereGeometry(R * 0.985, 96, 64), new THREE.MeshBasicMaterial({ color: 0x07182c, toneMapped: false })));

  // points of light: the land bright, the sea faint
  const N = 9000;
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const GOLD = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (2 * (i + 0.5)) / N;
    const r = Math.sqrt(1 - y * y);
    const th = i * GOLD;
    const x = Math.cos(th) * r;
    const z = Math.sin(th) * r;
    const land = fbm(x * 1.8 + 4.1, y * 1.8 + 2.3, z * 1.8 + 9.7) > 0.5;
    const k = land ? 0.7 + rnd() * 0.3 : 0.07 + rnd() * 0.09;
    pos[i * 3] = x * R * 1.004;
    pos[i * 3 + 1] = y * R * 1.004;
    pos[i * 3 + 2] = z * R * 1.004;
    col[i * 3] = (land ? 0.55 : 0.2) * k;
    col[i * 3 + 1] = (land ? 0.86 : 0.42) * k;
    col[i * 3 + 2] = (land ? 1 : 0.8) * k;
  }
  const dotsGeo = new THREE.BufferGeometry();
  dotsGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  dotsGeo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const dots = new THREE.Points(dotsGeo, new THREE.PointsMaterial({ size: 0.27, map: glowTex(env, "255,255,255"), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, toneMapped: false }));
  dots.frustumCulled = false;
  spin.add(dots);

  // the air round it
  const atm = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.1, 64, 48),
    new THREE.ShaderMaterial({ uniforms: { uOpacity: { value: 0.9 } }, vertexShader: ATM_V, fragmentShader: ATM_F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  globe.add(atm);
  const aura = lightSprite(env, "80,150,255", 12, 0.34);
  globe.add(aura);

  // the regions: a light and a ring that goes out from it
  const nodes = REGIONS.map(([lat, lon], i) => {
    const u = unit(lat, lon);
    const g = new THREE.Group();
    g.position.copy(u).multiplyScalar(R * 1.006);
    const dot = lightSprite(env, i % 3 === 0 ? "140,235,110" : "150,215,255", 0.62, 0.95);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.125, 40), lit(i % 3 === 0 ? GLOW.green : GLOW.sky, 0.8));
    ring.lookAt(u.clone().multiplyScalar(4));
    g.add(dot, core);
    g.add(ring);
    spin.add(g);
    return { g, ring };
  });

  // the arcs between them, and a pulse on each
  const SEG = 72;
  const arcs = LINKS.map(([i, j], k) => {
    const a = unit(...REGIONS[i]);
    const b = unit(...REGIONS[j]);
    const lift = 0.18 + (a.angleTo(b) / Math.PI) * 0.7;
    const pts: THREE.Vector3[] = [];
    for (let s = 0; s < SEG; s++) {
      const t = s / (SEG - 1);
      pts.push(a.clone().lerp(b, t).normalize().multiplyScalar(R * 1.006 + lift * Math.sin(Math.PI * t) * R * 0.5));
    }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), SEG, 0.017, 5, false);
    const green = k % 3 === 0;
    const line = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: green ? 0x84e255 : 0x9fd0ff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    spin.add(line);
    const pulse = new THREE.Group();
    pulse.add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })));
    pulse.add(lightSprite(env, green ? "140,235,110" : "150,215,255", 0.55, 0.9));
    spin.add(pulse);
    return { pts, geo, pulse, line };
  });
  // a point on the middle of one arc, for a tag
  const arcTag = new THREE.Object3D();
  arcTag.position.copy(arcs[2].pts[Math.floor(SEG / 2)]);
  spin.add(arcTag);

  /* ---- monitoring: a ring of marks round the planet, and a satellite on a wider orbit ---- */
  const hudPivot = new THREE.Group();
  hudPivot.rotation.set(0.3, 0, 0.2);
  const hud = new THREE.Group();
  hud.add(new THREE.Mesh(bandGeometry(3.45, 0.05, 0.12), chrome(0xe3ecf6, 0.24)));
  hud.add(tickMarks(3.45, 0.05, 0.12, 144));
  const hudArc = new THREE.Mesh(new THREE.TorusGeometry(3.45, 0.026, 8, 48, 1.1), lit(GLOW.green, 0.95));
  const hudArcHolder = new THREE.Group();
  hudArcHolder.rotation.x = Math.PI / 2;
  hudArcHolder.add(hudArc);
  hud.add(hudArcHolder);
  hudPivot.add(hud);
  globe.add(hudPivot);

  const orbitPivot = new THREE.Group();
  orbitPivot.rotation.set(-0.5, 0, 0.35);
  orbitPivot.add(circleLine(3.95, GLOW.sky, 0.3));
  const sat = new THREE.Group();
  sat.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.3), chrome(0xdbe6f2, 0.25)));
  [-1, 1].forEach((s) => {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.012, 0.2), new THREE.MeshBasicMaterial({ color: 0x4f9bff, toneMapped: false }));
    wing.position.x = s * 0.3;
    sat.add(wing);
  });
  sat.add(lightSprite(env, "150,215,255", 0.9, 0.7));
  orbitPivot.add(sat);
  globe.add(orbitPivot);

  const frame: Frame = { cx: 0, cy: 3.3, hw: 4.1, hh: 3.5 };
  const model: Model = {
    group,
    tags: [nodes[0].g, sat, arcTag],
    camera: { az: [-0.28, 0.2], elev: [0.18, 0.1] },
    floorY: 0,
    set(a, l, p) {
      spin.rotation.y = 0.4 + p * 1.6;
      atm.rotation.y = p;
      // the arcs are drawn in one after another
      arcs.forEach((arc, k) => {
        const g = clamp01((a * 1.7 - k * 0.07) / 0.6);
        arc.geo.setDrawRange(0, Math.max(60, Math.floor(quint(g) * SEG) * 30));
        arc.line.visible = g > 0.01;
        const on = g > 0.98 && l > 0.02;
        arc.pulse.visible = on;
        if (on) {
          const u = (p * (2.2 + (k % 3) * 0.5) + k * 0.19) % 1;
          const f = u * (SEG - 1);
          const i0 = Math.floor(f);
          arc.pulse.position.lerpVectors(arc.pts[i0], arc.pts[Math.min(SEG - 1, i0 + 1)], f - i0);
          arc.pulse.scale.setScalar(0.7 + 0.5 * Math.sin(u * Math.PI));
        }
      });
      nodes.forEach((n, i) => {
        const g = clamp01((a * 1.6 - i * 0.05) / 0.5);
        n.g.scale.setScalar(Math.max(0.001, quint(g)));
        const s = (p * 2.4 + i * 0.31) % 1;
        n.ring.scale.setScalar(0.5 + 2.4 * s);
        (n.ring.material as THREE.MeshBasicMaterial).opacity = (1 - s) * 0.8 * g;
      });
      hud.rotation.y = p * 1.3;
      hudArc.rotation.z = p * TAU * 0.5;
      const ang = p * TAU * 0.9 + 0.8;
      sat.position.set(Math.cos(ang) * 3.95, 0, Math.sin(ang) * 3.95);
      sat.rotation.y = -ang;
      (rimA.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.5 * l;
      (rimB.material as THREE.MeshBasicMaterial).opacity = 0.45 + 0.45 * l;
      beam.mat.uniforms.uOpacity.value = 0.2 + 0.25 * l;
      (pool.material as THREE.MeshBasicMaterial).opacity = 0.3 + 0.25 * l;
      group.updateMatrixWorld(true);
    },
    frame: () => frame,
  };
  model.set(1, 1, 0.5);
  return model;
};

export default build;
