import * as THREE from "three";
import { lerp } from "../engine";
import { makePhone, SCREEN_PX } from "../devices";
import { marker } from "./parts";
import { cyl, lathe, mat, put, rbox, screenFader, shadow, standFor, tube } from "./real";
import type { Model, ModelBuilder } from "./types";

/**
 * AI voice systems: a call centre headset on its stand and a phone on a dock showing a live call, two things that
 * belong to a voice agent. The headset is a real one: a padded band, two cups with cushions on yokes, a boom with a
 * microphone. It turns slowly on its stand as the page scrolls, and the call on the phone changes.
 */
const R = 0.95; // half the width of the headband
const YC = 1.55; // the height of the middle of the cups

const build: ModelBuilder = async (env, mini) => {
  const group = new THREE.Group();
  const k = mini ? 0.62 : 1;
  const shots = await Promise.all(["phone-faith2", "phone-faith3"].map((n) => env.shot(n, Math.round(SCREEN_PX.phone[0] * k), Math.round(SCREEN_PX.phone[1] * k))));

  const graphite = mat.plastic(0x2c3139, 0.45);
  const soft = mat.plastic(0x5a6572, 0.85);
  const leather = mat.rubber(0x1f2329);
  const green = new THREE.MeshBasicMaterial({ color: 0x73c94a, toneMapped: false });

  /* ---- the stand ---- */
  const headset = new THREE.Group();
  group.add(headset);
  put(headset, lathe([[0, 0], [1.0, 0], [1.02, 0.04], [1.0, 0.1], [0.85, 0.14], [0, 0.14]]), mat.alu(0xcfd4da, 0.3), 0, 0, 0);
  put(headset, cyl(0.065, 0.075, YC + R - 0.2, 24), mat.alu(0xcfd4da, 0.3), 0, (YC + R - 0.2) / 2 + 0.14, 0);
  put(headset, new THREE.CapsuleGeometry(0.11, 0.5, 8, 20).rotateZ(Math.PI / 2), mat.rubber(0x24282e), 0, YC + R - 0.1, 0);

  /* ---- the band: a thin arch of plastic with a soft pad inside ---- */
  const arc = (a0: number, a1: number, r: number, n = 40): [number, number, number][] =>
    Array.from({ length: n + 1 }, (_, i) => {
      const a = lerp(a0, a1, i / n);
      return [Math.cos(a) * r, YC + 0.1 + Math.sin(a) * r * 1.0, 0];
    });
  put(headset, tube(arc(0, Math.PI, R), 0.075, 96, 16), graphite, 0, 0, 0);
  put(headset, tube(arc(Math.PI * 0.28, Math.PI * 0.72, R - 0.11, 24), 0.11, 48, 16), soft, 0, 0, 0);

  /* ---- the cups ---- */
  const cup = (side: -1 | 1) => {
    const g = new THREE.Group();
    g.position.set(side * (R + 0.02), YC, 0);
    g.rotation.z = side * -Math.PI / 2; // the lathe's axis (Y) now points outward
    g.rotation.x = 0;
    // the outer shell
    put(g, lathe([[0, 0.12], [0.46, 0.12], [0.56, 0.2], [0.58, 0.34], [0.52, 0.46], [0.34, 0.52], [0, 0.52]]), graphite, 0, 0, 0);
    put(g, new THREE.TorusGeometry(0.34, 0.018, 12, 64).rotateX(Math.PI / 2), green, 0, 0.51, 0);
    // the cushion faces the head
    put(g, new THREE.TorusGeometry(0.4, 0.15, 24, 64).rotateX(Math.PI / 2), leather, 0, 0.1, 0);
    put(g, cyl(0.4, 0.4, 0.06, 48), mat.rubber(0x15181c), 0, 0.06, 0);
    put(headset, new THREE.CapsuleGeometry(0.05, 0.42, 8, 16), graphite, side * (R + 0.03), YC + 0.3, 0);
    return g;
  };
  headset.add(cup(-1), cup(1));
  // a toe-in of a few degrees, as on a real headset
  headset.children.forEach((c) => {
    if (c.position.x < -0.5) c.rotation.y += 0.1;
    if (c.position.x > 0.5) c.rotation.y -= 0.1;
  });

  /* ---- the boom and the microphone ---- */
  put(headset, tube([[-R - 0.22, YC - 0.1, 0.05], [-R - 0.16, YC - 0.55, 0.45], [-0.75, YC - 0.95, 1.15], [-0.3, YC - 1.02, 1.5]], 0.035, 48, 12), graphite, 0, 0, 0);
  put(headset, new THREE.CapsuleGeometry(0.1, 0.28, 8, 20).rotateZ(Math.PI / 2).rotateY(0.2), mat.rubber(0x15181c), -0.18, YC - 1.02, 1.55);
  headset.position.set(-1.7, 0, 0);
  group.add(shadow(env, 4.4, 3.2, 0.3, -1.7, 0.1));

  /* ---- the phone, with a live call on it ---- */
  const phone = makePhone(shots[0]);
  env.textures.push(...phone.textures);
  const P = standFor(phone, 0.2);
  P.scale.setScalar(1.35);
  P.position.set(2.0, 0, 0.7);
  P.rotation.y = -0.4;
  P.add(shadow(env, 2.2, 1.8, 0.3, 0, 0));
  group.add(P);
  const fp = screenFader(phone.screen!, shots, [0.5]);

  const tagHeadset = marker(headset, -0.3, YC - 1.02, 1.8);
  const model: Model = {
    group,
    tags: [phone.tagObj, tagHeadset],
    camera: { az: [-0.3, 0.2], elev: [0.26, 0.2] },
    floorY: 0,
    set(_a, _l, p) {
      headset.rotation.y = lerp(0.35, -0.45, p);
      fp(p);
      group.updateMatrixWorld(true);
    },
    frame: () => ({ cx: 0, cy: 1.6, hw: 4, hh: 2.4 }),
  };
  model.set(1, 1, 0);
  return model;
};

export default build;
