import * as THREE from "three";
import { lerp, quint, TAU, win } from "../engine";
import { C, dot, drawn, glass, glossy, marker, smoothstep, unlit } from "./parts";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * About: a journey in four stops. A road winds across the ground and draws itself as the page scrolls; a light travels
 * along it and, at each stop (plan, build, release, handover), a post rises with one of our own projects on it.
 */

const SHOTS = ["vendibly", "dreamybot", "tutor", "cordial"];
const STOPS = [0.1, 0.36, 0.63, 0.9];
const WIDTH = 0.8;

/** A flat ribbon along a curve (a road, a line on it), drawn from its start by `setDrawRange`. */
function ribbon(curve: THREE.Curve<THREE.Vector3>, width: number, y: number, offset: number, mat: THREE.Material, samples = 180) {
  const pts = curve.getSpacedPoints(samples);
  const pos: number[] = [];
  const idx: number[] = [];
  pts.forEach((pt, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(samples, i + 1)];
    const nx = -(b.z - a.z);
    const nz = b.x - a.x;
    const len = Math.hypot(nx, nz) || 1;
    const ux = nx / len;
    const uz = nz / len;
    pos.push(pt.x + ux * (offset + width / 2), y, pt.z + uz * (offset + width / 2), pt.x + ux * (offset - width / 2), y, pt.z + uz * (offset - width / 2));
    if (i < samples) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat);
  return { mesh, total: idx.length };
}

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();
  const texs = await Promise.all(SHOTS.map((s) => env.shot(s, 1024, 640)));

  /* ---- the road ---- */
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-4.4, 0, 1.6), new THREE.Vector3(-2.6, 0, -1.4), new THREE.Vector3(-0.6, 0, 1.5), new THREE.Vector3(1.5, 0, -1.4), new THREE.Vector3(3.1, 0, 1.4), new THREE.Vector3(4.5, 0, -0.3)]);
  const road = ribbon(curve, WIDTH, 0.02, 0, new THREE.MeshStandardMaterial({ color: 0xe9eef4, roughness: 0.55, metalness: 0.05, side: THREE.DoubleSide }));
  const edgeL = ribbon(curve, 0.05, 0.03, WIDTH / 2 - 0.04, unlit(0x22425f), 180);
  const edgeR = ribbon(curve, 0.05, 0.03, -WIDTH / 2 + 0.04, unlit(0x22425f), 180);
  const roads = [road, edgeL, edgeR];
  roads.forEach((r) => {
    r.mesh.material.side = THREE.DoubleSide;
    group.add(r.mesh);
  });
  const DASH = 44;
  const dashGeo = new THREE.BoxGeometry(0.3, 0.012, 0.06);
  const dashes = new THREE.InstancedMesh(dashGeo, unlit(0x73c94a), DASH);
  const dummy = new THREE.Object3D();
  const tan = new THREE.Vector3();
  for (let i = 0; i < DASH; i++) {
    const t = (i + 0.5) / DASH;
    curve.getPointAt(t, dummy.position);
    curve.getTangentAt(t, tan);
    dummy.position.y = 0.035;
    dummy.rotation.set(0, -Math.atan2(tan.z, tan.x), 0);
    dummy.updateMatrix();
    dashes.setMatrixAt(i, dummy.matrix);
  }
  group.add(dashes);

  /* ---- the four stops ---- */
  const numTex = (i: number) =>
    drawn(env, 128, 128, (g) => {
      dot(g, 64, 64, 60, C.green);
      g.fillStyle = "#191716";
      g.font = "800 74px Inter, system-ui, sans-serif";
      g.textAlign = "center";
      g.fillText(String(i + 1), 64, 90);
    });
  const badgeGeo = new THREE.PlaneGeometry(0.36, 0.36);
  const ringGeo = new THREE.TorusGeometry(0.42, 0.03, 8, 48);
  const poleGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.35, 10);
  poleGeo.translate(0, 0.675, 0);
  const stops = STOPS.map((t, k) => {
    const g = new THREE.Group();
    const at = curve.getPointAt(t);
    g.position.set(at.x, 0.03, at.z + 0.55);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x73c94a, toneMapped: false }));
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    const pole = new THREE.Mesh(poleGeo, glossy(0x22425f, 0.3, 0.8));
    g.add(pole);
    const card = glass(env, texs[k], 1.75, 1.09, { radius: 0.12, depth: 0.05 });
    card.group.position.y = 2.15;
    g.add(card.group);
    const badge = new THREE.Mesh(badgeGeo, new THREE.MeshBasicMaterial({ map: numTex(k), transparent: true, toneMapped: false }));
    badge.position.set(-0.78, 0.46, 0.07);
    card.group.add(badge);
    group.add(g);
    return { g, ring, pole, card, t };
  });

  /* ---- the light that travels the road ---- */
  const light = new THREE.Group();
  group.add(light);
  light.add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), unlit(0x73c94a)));
  light.add(new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 16), new THREE.MeshBasicMaterial({ color: 0x73c94a, transparent: true, opacity: 0.22, depthWrite: false, toneMapped: false })));
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 6).translate(0, 0.6, 0), unlit(0x73c94a, 0.7));
  light.add(beam);

  const P = new THREE.Vector3();
  const frame: Frame = { cx: 0, cy: 1.6, hw: 5.5, hh: 2.9 };
  const model: Model = {
    group,
    tags: stops.map((s) => marker(s.card.group, -0.8, 0.5, 0.07)),
    camera: { az: [-0.2, 0.22], elev: [0.5, 0.42] },
    ground: true,
    floorY: 0,
    set(a, l, p) {
      // (even before it is built, a third of the road and the foot of each post are there, so the first picture is never empty)
      const eD = lerp(0.36, 1, quint(win(a, 0.04, 0.75)));
      roads.forEach((r) => r.mesh.geometry.setDrawRange(0, Math.floor((r.total * eD) / 6) * 6));
      dashes.count = Math.floor(DASH * eD);
      const tm = lerp(0.02, 0.98, quint(win(p, 0.16, 0.9)));
      curve.getPointAt(tm, P);
      light.position.set(P.x, 0.3 + 0.06 * Math.sin(p * TAU * 6), P.z);
      light.visible = eD > 0.05;
      stops.forEach((s, k) => {
        const e = lerp(0.4, 1, quint(win(a, 0.25 + k * 0.1, 0.75 + k * 0.1)));
        s.pole.scale.y = Math.max(0.001, e);
        s.card.group.position.y = lerp(3.0, 2.35, e);
        s.card.group.rotation.y = (k - 1.5) * -0.1 - 0.12;
        s.card.group.scale.setScalar(Math.max(0.001, e));
        // the stop lights up as the light reaches it
        const lit = smoothstep(s.t - 0.04, s.t + 0.01, tm);
        s.ring.scale.setScalar(lerp(0.8, 1.2, lit) * Math.max(0.001, e));
        (s.card.body.material as THREE.MeshBasicMaterial[])[0].color.setScalar(lerp(0.78, 1, lit));
        (s.ring.material as THREE.MeshBasicMaterial).color.setHex(lit > 0.5 ? 0x73c94a : 0x9dbbd3);
      });
      void l;
      frame.hw = 5.2;
    },
    frame: () => frame,
    dispose() {
      dashGeo.dispose();
      badgeGeo.dispose();
      ringGeo.dispose();
      poleGeo.dispose();
      roads.forEach((r) => r.mesh.geometry.dispose());
    },
  };
  model.set(0, 0, 0);
  return model;
};

export default build;
