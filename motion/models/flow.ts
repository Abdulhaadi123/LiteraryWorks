import * as THREE from "three";
import { clamp01, lerp, quint, smooth, TAU } from "../engine";
import { bandGeometry, chrome, GLOW, glowTex, lightSprite, lit, makeTile, plasmaMaterial, stageMetal, tickMarks, type Tile } from "./glow";
import { drawn } from "./parts";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * AI and automation: work goes in loose and comes out done. A stream of requests (mail, documents, chats, dates,
 * receipts) tumbles in from the distance, funnels into an AI gate, a ring with a lens of living light in it, and
 * comes out the other side in a straight line, each one checked, on a lit lane running toward you. The scroll
 * keeps the stream moving.
 */

const IN_ICONS = ["mail", "doc", "chat", "cal", "receipt", "mail", "doc", "chat", "receipt", "cal", "chat", "doc"];
const N_IN = IN_ICONS.length;
const N_OUT = 5;
const GATE_Y = 2.6;
const GATE_R = 2.15;

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();
  const rnd = env.rnd;

  /* ---- the lane: dark glass with lit edges and chevrons that run toward you ---- */
  const lane = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 13), stageMetal());
  lane.position.set(0, 0.06, -0.5);
  group.add(lane);
  [-0.8, 0.8].forEach((x) => {
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 13), lit(GLOW.sky, 0.85));
    e.position.set(x * 1.06, 0.13, -0.5);
    group.add(e);
  });
  const chev = drawn(env, 128, 256, (g, w, h) => {
    g.strokeStyle = "rgba(160,215,255,0.9)";
    g.lineWidth = 7;
    g.lineCap = "round";
    g.lineJoin = "round";
    for (let i = 0; i < 2; i++) {
      const y = 70 + i * 128;
      g.beginPath();
      g.moveTo(w * 0.22, y + 26);
      g.lineTo(w * 0.5, y - 12);
      g.lineTo(w * 0.78, y + 26);
      g.stroke();
    }
  });
  chev.wrapS = chev.wrapT = THREE.RepeatWrapping;
  chev.repeat.set(1, 6);
  const chevMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 13), new THREE.MeshBasicMaterial({ map: chev, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  chevMesh.rotation.x = -Math.PI / 2;
  chevMesh.position.set(0, 0.13, -0.5);
  group.add(chevMesh);
  const laneGlow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex(env, "110,190,255"), transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  laneGlow.rotation.x = -Math.PI / 2;
  laneGlow.position.set(0, 0.14, 0.2);
  laneGlow.scale.set(4.5, 4.5, 1);
  group.add(laneGlow);

  /* ---- the gate: a ring on its stand, a lens of living light in it, a second ring turning ---- */
  const gate = new THREE.Group();
  gate.position.set(0, GATE_Y, 0);
  group.add(gate);
  const ring = new THREE.Group();
  ring.add(new THREE.Mesh(bandGeometry(GATE_R, 0.1, 0.34), chrome(0xe3ecf6, 0.22)));
  ring.add(tickMarks(GATE_R, 0.1, 0.34, 96));
  ring.rotation.x = Math.PI / 2;
  gate.add(ring);
  const inner = new THREE.Group();
  inner.rotation.x = Math.PI / 2;
  const innerBand = new THREE.Mesh(new THREE.TorusGeometry(GATE_R - 0.32, 0.03, 10, 140), chrome(0xa9c0d6, 0.3));
  inner.add(innerBand);
  const arcs = [0, 1, 2].map((k) => {
    const a = new THREE.Mesh(new THREE.TorusGeometry(GATE_R - 0.32, 0.05, 8, 40, 0.9), lit(GLOW.green, 0.95));
    a.rotation.z = k * 2.1;
    inner.add(a);
    return a;
  });
  gate.add(inner);
  const pl = plasmaMaterial();
  const lens = new THREE.Mesh(new THREE.SphereGeometry(GATE_R - 0.4, 64, 48), pl.mat);
  lens.scale.set(1, 1, 0.07);
  gate.add(lens);
  const flare = lightSprite(env, "90,200,150", 7, 0.4);
  gate.add(flare);
  const flare2 = lightSprite(env, "90,160,255", 11, 0.2);
  gate.add(flare2);
  // the stand: two legs down to the lane
  [-1, 1].forEach((s) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, GATE_Y - 0.1, 0.5), stageMetal());
    leg.position.set(s * (GATE_R + 0.05), (GATE_Y - 0.1) / 2 - GATE_Y, 0);
    gate.add(leg);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.02, GATE_Y - 0.2, 0.02), lit(GLOW.sky, 0.7));
    stripe.position.set(s * (GATE_R + 0.05), (GATE_Y - 0.1) / 2 - GATE_Y, 0.26);
    gate.add(stripe);
  });
  const gatePool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex(env, "110,190,255"), transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  gatePool.rotation.x = -Math.PI / 2;
  gatePool.position.set(0, 0.15, 0);
  gatePool.scale.set(5, 5, 1);
  group.add(gatePool);

  /* ---- the work: loose on the way in, tidy and checked on the way out ---- */
  const ins: { t: Tile; phi: number; rho: number; spin: THREE.Vector3; off: number }[] = IN_ICONS.map((ic, j) => {
    const t = makeTile(env, ic, 1.2, GLOW.sky, "110,180,255");
    group.add(t.group);
    return { t, phi: j * 2.399 + 0.5, rho: 1.2 + 3.4 * ((j * 0.618) % 1), spin: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(7), off: j / N_IN };
  });
  // the paths the requests ride in on: a funnel of fine lines
  ins.forEach((q) => {
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 40; k++) {
      const u = k / 40;
      const e = u * u * (3 - 2 * u);
      const rho = q.rho * Math.pow(1 - u, 1.35);
      pts.push(new THREE.Vector3(Math.cos(q.phi + u * 1.6) * rho, Math.max(0.55, GATE_Y + Math.sin(q.phi + u * 1.6) * rho * 0.8), lerp(-7.2, -0.6, e)));
    }
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.014, 4, false), new THREE.MeshBasicMaterial({ color: 0x8fd2ff, transparent: true, opacity: 0.34, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })));
  });
  const outs: { t: Tile; off: number }[] = Array.from({ length: N_OUT }, (_, j) => {
    const t = makeTile(env, "check", 1.0, GLOW.green, "120,215,110");
    group.add(t.group);
    return { t, off: j / N_OUT };
  });

  // sparks along the lane
  const SN = 100;
  const sPos = new Float32Array(SN * 3);
  const sp = Array.from({ length: SN }, () => ({ x: (rnd() - 0.5) * 1.2, z: rnd() * 13 - 7, y: 0.2 + rnd() * 0.9, v: 0.3 + rnd() * 0.8 }));
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
  const sparks = new THREE.Points(sGeo, new THREE.PointsMaterial({ size: 0.1, map: glowTex(env, "170,230,255"), color: 0xbfe0ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, opacity: 0.8, toneMapped: false }));
  sparks.frustumCulled = false;
  group.add(sparks);

  // where the tags point: in the stream, at the gate, at the end of the lane
  const tagIn = new THREE.Object3D();
  tagIn.position.set(-1.9, 3.8, -4.4);
  const tagGate = new THREE.Object3D();
  tagGate.position.set(0, GATE_R + 0.5, 0);
  const tagOut = new THREE.Object3D();
  tagOut.position.set(0, 1.55, 4.2);
  group.add(tagIn, tagGate, tagOut);

  const frame: Frame = { cx: -0.2, cy: 2.8, hw: 4.5, hh: 3.5 };
  const tmpQ = new THREE.Quaternion();
  const tmpE = new THREE.Euler();
  const model: Model = {
    group,
    tags: [tagIn, tagGate, tagOut],
    camera: { az: [-0.55, -0.28], elev: [0.2, 0.14] },
    floorY: 0,
    set(a, l, p) {
      let flash = 0;
      ins.forEach((q) => {
        const u = (p * 1.15 + q.off) % 1;
        const e = u * u * (3 - 2 * u);
        const tide = Math.pow(1 - u, 1.35);
        const rho = q.rho * tide * (0.5 + 0.5 * a);
        const z = lerp(-7.2, -0.6, e);
        const x = Math.cos(q.phi + u * 1.6) * rho;
        const y = Math.max(0.55, GATE_Y + Math.sin(q.phi + u * 1.6) * rho * 0.8);
        q.t.group.position.set(x, y, z);
        tmpE.set(q.spin.x * tide, q.spin.y * tide + 0.2, q.spin.z * tide);
        tmpQ.setFromEuler(tmpE);
        q.t.group.quaternion.copy(tmpQ);
        const s = lerp(1, 0.55, Math.pow(u, 3)) * (1 - smooth(clamp01((u - 0.94) / 0.06)));
        q.t.group.scale.setScalar(Math.max(0.001, s));
        flash = Math.max(flash, Math.exp(-Math.pow((z + 0.6) / 0.9, 2)));
        (q.t.light.material as THREE.SpriteMaterial).opacity = 0.3 + 0.2 * (1 - tide);
        q.t.edge.forEach((ln) => ((ln.material as THREE.LineBasicMaterial).opacity = 0.7));
      });
      outs.forEach((q) => {
        const u = (p * 0.95 + q.off) % 1;
        const z = lerp(0.8, 6.0, u);
        const drop = smooth(clamp01(u / 0.22));
        q.t.group.position.set(0, lerp(GATE_Y, 0.85, drop), z);
        q.t.group.quaternion.identity();
        const s = lerp(0.5, 1, smooth(clamp01(u / 0.2))) * (1 - smooth(clamp01((u - 0.93) / 0.07)));
        q.t.group.scale.setScalar(Math.max(0.001, s));
        flash = Math.max(flash, Math.exp(-Math.pow((z - 0.8) / 0.7, 2)) * 0.8);
        (q.t.light.material as THREE.SpriteMaterial).opacity = 0.2 + 0.2 * l;
      });
      const power = 0.35 + 0.65 * (0.4 * a + 0.6 * l);
      pl.u.uT.value = p * 7;
      pl.u.uGlow.value = clamp01(power * 0.45 + 0.45 * flash);
      ring.rotation.y = p * 1.2;
      inner.rotation.z = -p * TAU * 0.9;
      arcs.forEach((arc, k) => (arc.rotation.z = k * 2.1 + p * TAU * 1.3));
      (flare.material as THREE.SpriteMaterial).opacity = 0.2 + 0.3 * power + 0.3 * flash;
      (flare2.material as THREE.SpriteMaterial).opacity = 0.1 + 0.16 * power;
      (gatePool.material as THREE.MeshBasicMaterial).opacity = 0.2 + 0.25 * power + 0.2 * flash;
      chev.offset.y = -p * 7;
      (chevMesh.material as THREE.MeshBasicMaterial).opacity = 0.18 + 0.28 * l;
      for (let i = 0; i < SN; i++) {
        const q = sp[i];
        const z = ((q.z + 7 + p * q.v * 13) % 13) - 7;
        sPos[i * 3] = q.x;
        sPos[i * 3 + 1] = q.y + 0.05 * Math.sin(p * 20 + i);
        sPos[i * 3 + 2] = z;
      }
      sGeo.attributes.position.needsUpdate = true;
      group.updateMatrixWorld(true);
    },
    frame: () => frame,
  };
  model.set(1, 1, 0.5);
  void quint;
  return model;
};

export default build;
