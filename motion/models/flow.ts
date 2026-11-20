import * as THREE from "three";
import { clamp01, lerp, quint, TAU, win } from "../engine";
import { makeCore } from "../kit";
import { C, dot, drawn, glass, glossy, marker, slab, smoothstep, unlit } from "./parts";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * AI and automation: a pipeline. Requests (our own projects, as cards) arrive in a tangle, pass through the AI agent
 * (a ring with the core in it) and come out the other side tidy and checked, one after another, as the page scrolls.
 */

const SHOTS = ["support", "vyarl", "drscribe", "alltrials", "kalibur", "cordial"];
const CW = 1.9;
const CH = 1.19;
const X0 = -3.2;
const X1 = 3.2;
const BELT = 0.42; // the top of the belt
const LOOPS = 1.35; // how far each card travels while the page scrolls

const eul = new THREE.Euler();

const build: ModelBuilder = async (env, mini) => {
  const group = new THREE.Group();
  // the whole line runs on a diagonal, so it fills the stage and its depth shows
  const pipe = new THREE.Group();
  pipe.rotation.y = -0.5;
  group.add(pipe);
  const shots = mini ? SHOTS.slice(0, 4) : SHOTS;
  const n = shots.length;
  const texs = await Promise.all(shots.map((s) => env.shot(s, 1024, 640)));

  /* ---- the belt ---- */
  const belt = new THREE.Group();
  pipe.add(belt);
  const len = X1 - X0 + 1;
  const bed = slab(len, 2.0, 0.2, 0.14, glossy(0xf4f7fa, 0.4, 0.5));
  bed.rotation.x = -Math.PI / 2;
  bed.position.y = BELT - 0.1;
  belt.add(bed);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(len - 0.4, 0.02, 0.07), unlit(0x73c94a));
  stripe.position.y = BELT + 0.004;
  belt.add(stripe);
  [-0.9, 0.9].forEach((z) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.1, 0.08), glossy(0x22425f, 0.35));
    rail.position.set(0, BELT + 0.03, z);
    belt.add(rail);
  });

  /* ---- the AI agent: a ring the cards pass through, with the core in it ---- */
  const gate = new THREE.Group();
  gate.position.y = 2.15;
  pipe.add(gate);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.13, 24, 96), glossy(0x22425f, 0.25, 1));
  ring.rotation.y = Math.PI / 2;
  gate.add(ring);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.026, 8, 120), unlit(0x73c94a));
  inner.rotation.y = Math.PI / 2;
  gate.add(inner);
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), unlit(0xffffff));
  gate.add(bead);
  const core = makeCore();
  core.group.scale.setScalar(0.38);
  core.group.position.y = 0.25;
  gate.add(core.group);

  /* ---- the cards ---- */
  const badgeTex = drawn(env, 128, 128, (g) => {
    dot(g, 64, 64, 60, C.green);
    g.strokeStyle = "#191716";
    g.lineWidth = 13;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.beginPath();
    g.moveTo(38, 66);
    g.lineTo(57, 85);
    g.lineTo(92, 46);
    g.stroke();
  });
  const badgeGeo = new THREE.PlaneGeometry(0.36, 0.36);
  const rnd = env.rnd;
  const cards = texs.map((tex) => {
    const panel = glass(env, tex, CW, CH, { radius: 0.12, depth: 0.05 });
    const badge = new THREE.Mesh(badgeGeo, new THREE.MeshBasicMaterial({ map: badgeTex, transparent: true, toneMapped: false }));
    badge.position.set(CW / 2 - 0.04, CH / 2 - 0.04, 0.07);
    panel.group.add(badge);
    pipe.add(panel.group);
    // loose: somewhere round the belt, at an angle
    const loose = new THREE.Vector3((rnd() - 0.5) * 8.6, 0.9 + rnd() * 3, (rnd() - 0.5) * 3.8);
    const tilt = new THREE.Vector3((rnd() - 0.5) * 0.9, (rnd() - 0.5) * 1.6, (rnd() - 0.5) * 1.1);
    return { panel, badge, loose, tilt, q: new THREE.Quaternion(), q0: new THREE.Quaternion().setFromEuler(eul.set(tilt.x, tilt.y, tilt.z, "YXZ")) };
  });

  const frame: Frame = { cx: 0, cy: 2.0, hw: 5.2, hh: 2.7 };
  const P = new THREE.Vector3();
  const model: Model = {
    group,
    tags: [marker(pipe, X0 + 0.9, 2.2, 0.3), marker(gate, 0, 2.0, 0), marker(pipe, X1 - 0.9, 2.2, 0.3)],
    camera: { az: [-0.1, 0.34], elev: [0.46, 0.38] },
    ground: true,
    floorY: 0,
    set(a, l, p) {
      const eBelt = quint(win(a, 0.1, 0.8));
      belt.scale.set(lerp(0.05, 1, eBelt), 1, lerp(0.4, 1, eBelt));
      belt.visible = eBelt > 0.01;
      const eGate = quint(win(a, 0.2, 0.85));
      gate.scale.setScalar(Math.max(0.001, eGate));
      const th = p * TAU * 2;
      bead.position.set(0, Math.cos(th) * 1.32, Math.sin(th) * 1.32);
      core.group.rotation.y = p * 3;
      core.rings.forEach((r, i) => {
        r.rotation.y = p * TAU * (i ? -1.2 : 0.9);
      });
      core.glow.value = 0.25 + 0.75 * l;

      const ps = win(p, 0.32, 1);
      cards.forEach((c, i) => {
        const s = (((ps * LOOPS + i / n) % 1) + 1) % 1;
        const mess = 1 - smoothstep(0.36, 0.5, s);
        // along the belt: in a tangle before the agent, tidy after it
        P.set(lerp(X0, X1, s), BELT + 0.82 + mess * 0.34 * Math.sin(i * 2.3 + s * 9), mess * 0.5 * Math.sin(i * 1.7 + s * 7));
        eul.set(mess * c.tilt.x, mess * c.tilt.y - (1 - mess) * 0.2, mess * c.tilt.z, "YXZ");
        c.q.setFromEuler(eul);
        const e = quint(win(a, 0.05 + i * 0.03, 0.7 + i * 0.03));
        const ends = smoothstep(0, 0.07, s) * (1 - smoothstep(0.93, 1, s));
        const squeeze = 1 - 0.16 * (1 - smoothstep(0, 0.12, Math.abs(s - 0.5)));
        const g = c.panel.group;
        g.position.lerpVectors(c.loose, P, e);
        g.quaternion.copy(c.q0).slerp(c.q, e);
        g.scale.setScalar(Math.max(0.001, lerp(0.95, ends * squeeze, e)));
        c.badge.scale.setScalar(Math.max(0.001, smoothstep(0.52, 0.62, s) * e));
        // the cards that are about to enter are a little dim until they are in the light of the agent
        (c.panel.body.material as THREE.MeshBasicMaterial[])[0].color.setScalar(lerp(1, 0.9 + 0.1 * clamp01(s * 2), e));
      });
      frame.hw = lerp(5.0, 3.9, eBelt);
      frame.hh = lerp(2.8, 2.5, eBelt);
      frame.cy = lerp(2.1, 2.0, eBelt);
    },
    frame: () => frame,
    dispose() {
      badgeGeo.dispose();
    },
  };
  model.set(0, 0, 0);
  return model;
};

export default build;
