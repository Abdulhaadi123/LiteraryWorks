import * as THREE from "three";
import { lerp, quint, TAU, win } from "../engine";
import { COLOR, makeBeam, type Beam } from "../kit";
import { makeRack } from "../devices";
import { glass, marker, smoothstep, unlit } from "./parts";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * Cloud and DevOps: a globe of regions. A globe turns as the page scrolls; the regions our systems run in light up,
 * and lines arc between them, each carrying small lights. A rack and a monitoring screen stand beside it.
 */

const R = 1.9;
const CY = 2.3;
// New York, San Francisco, London, Berlin, Dubai, Mumbai, Singapore, Tokyo, Sydney, Sao Paulo
const REGIONS: [number, number][] = [[40.7, -74], [37.8, -122.4], [51.5, -0.1], [52.5, 13.4], [25.2, 55.3], [19.1, 72.9], [1.35, 103.8], [35.7, 139.7], [-33.9, 151.2], [-23.5, -46.6]];
const LINKS: [number, number][] = [[0, 2], [2, 5], [5, 7], [7, 8], [1, 0], [2, 4], [4, 6], [9, 0], [3, 6], [6, 8], [1, 7]];

const toVec = (lat: number, lon: number, r: number) => {
  const la = THREE.MathUtils.degToRad(lat);
  const lo = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo));
};

const build: ModelBuilder = async (env, mini) => {
  const group = new THREE.Group();
  const monitorTex = await env.shot("cordial", 1024, 640);

  /* ---- the globe: a pale ball with a grid of latitude and longitude, turning ---- */
  const globe = new THREE.Group();
  globe.position.y = CY;
  group.add(globe);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(R * 0.995, 72, 52), new THREE.MeshPhysicalMaterial({ color: 0xe9f1f8, roughness: 0.28, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 0.9 }));
  globe.add(ball);
  const pts: number[] = [];
  const seg = (a: THREE.Vector3, b: THREE.Vector3) => pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
  for (let lat = -60; lat <= 60; lat += 20) {
    for (let k = 0; k < 96; k++) seg(toVec(lat, (k / 96) * 360, R), toVec(lat, ((k + 1) / 96) * 360, R));
  }
  for (let lon = 0; lon < 360; lon += 20) {
    for (let k = 0; k < 64; k++) seg(toVec(-85 + (k / 64) * 170, lon, R), toVec(-85 + ((k + 1) / 64) * 170, lon, R));
  }
  const gridGeo = new THREE.BufferGeometry();
  gridGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  globe.add(new THREE.LineSegments(gridGeo, new THREE.LineBasicMaterial({ color: 0x3e6d97, transparent: true, opacity: 0.42 })));

  /* ---- the regions and the arcs between them ---- */
  const nodeGeo = new THREE.SphereGeometry(0.075, 16, 12);
  const haloGeo = new THREE.SphereGeometry(0.17, 16, 12);
  const nodes = REGIONS.map(([la, lo]) => {
    const g = new THREE.Group();
    g.position.copy(toVec(la, lo, R + 0.02));
    g.add(new THREE.Mesh(nodeGeo, unlit(0x73c94a)));
    g.add(new THREE.Mesh(haloGeo, new THREE.MeshBasicMaterial({ color: 0x73c94a, transparent: true, opacity: 0.25, depthWrite: false, toneMapped: false })));
    globe.add(g);
    return g;
  });
  const links = (mini ? LINKS.slice(0, 7) : LINKS).map(([i, j]) => {
    const a = toVec(...REGIONS[i], R + 0.02);
    const b = toVec(...REGIONS[j], R + 0.02);
    const ctrl = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R + a.distanceTo(b) * 0.5);
    const curve = new THREE.QuadraticBezierCurve3(a, ctrl, b);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.014, 6), new THREE.MeshBasicMaterial({ color: 0x73c94a, transparent: true, opacity: 0, toneMapped: false }));
    globe.add(tube);
    const light = new THREE.Mesh(nodeGeo, unlit(0xffffff));
    globe.add(light);
    return { curve, tube, light };
  });

  /* ---- a rack and a monitoring screen ---- */
  const rack = makeRack();
  rack.group.scale.setScalar(0.62);
  group.add(rack.group);
  const screen = glass(env, monitorTex, 2.6, 1.62, { radius: 0.14, depth: 0.06 });
  group.add(screen.group);
  const wireA: Beam = makeBeam(COLOR.green, 0.014);
  const wireB: Beam = makeBeam(COLOR.green, 0.014);
  group.add(wireA.mesh, wireB.mesh);

  const A = new THREE.Vector3();
  const B = new THREE.Vector3();
  const frame: Frame = { cx: 0, cy: CY, hw: 4.8, hh: 2.9 };
  const model: Model = {
    group,
    tags: [marker(group, 1.55, CY + 1.55, 0.7), marker(screen.group, -1.0, 0.65, 0.07), rack.tagObj],
    camera: { az: [-0.3, 0.3], elev: [0.16, 0.1] },
    ground: true,
    floorY: 0,
    set(a, l, p) {
      const eG = quint(win(a, 0, 0.55));
      globe.scale.setScalar(Math.max(0.001, lerp(0.6, 1, eG)));
      globe.rotation.y = p * TAU * 0.5 + 0.6;
      globe.rotation.z = 0.2;
      nodes.forEach((n, i) => n.scale.setScalar(Math.max(0.001, quint(win(a, 0.2 + i * 0.03, 0.55 + i * 0.03)) * (1 + 0.18 * Math.sin(p * TAU * 6 + i)) * (0.75 + 0.25 * l))));
      links.forEach((ln, i) => {
        const e = quint(win(a, 0.35 + i * 0.04, 0.8 + i * 0.02));
        (ln.tube.material as THREE.MeshBasicMaterial).opacity = 0.7 * e;
        const t = (((p * 2.2 + i * 0.29) % 1) + 1) % 1;
        ln.light.position.copy(ln.curve.getPoint(t));
        ln.light.scale.setScalar(Math.max(0.001, e * l * Math.sin(t * Math.PI) * 1.4));
      });
      const eR = quint(win(a, 0.2, 0.8));
      rack.group.position.set(lerp(-5.2, -3.45, eR), lerp(1.9, 0.82, eR), lerp(-1.5, 1.2, eR));
      rack.group.rotation.y = lerp(0.9, 0.35, eR);
      rack.tick(p);
      rack.power(1);
      const eM = quint(win(a, 0.3, 0.9));
      screen.group.position.set(lerp(5.2, 3.3, eM), lerp(4.2, 1.55, eM), lerp(-1, 1.0, eM));
      screen.group.rotation.set(0, lerp(-1, -0.4, eM), 0);
      // two lines tie the rack and the screen to the globe
      group.updateMatrixWorld(true);
      A.copy(rack.group.position).add(B.set(0, 1.3 * 0.62, 0));
      wireA.aim(A, B.set(-1.5, CY - 0.4, 0.4), smoothstep(0.7, 1, eR));
      A.copy(screen.group.position);
      wireB.aim(A, B.set(1.5, CY - 0.4, 0.4), smoothstep(0.7, 1, eM));
      frame.hw = lerp(5.8, 4.9, quint(win(a, 0.1, 0.9)));
    },
    frame: () => frame,
    dispose() {
      nodeGeo.dispose();
      haloGeo.dispose();
      gridGeo.dispose();
    },
  };
  model.set(0, 0, 0);
  return model;
};

export default build;
