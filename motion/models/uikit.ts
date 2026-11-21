import * as THREE from "three";
import { clamp01, smooth } from "../engine";
import type { ScreenHandle } from "../devices";
import { makePhone, SCREEN_PX } from "../devices";
import { drawn, fillRR, plane, rr } from "./parts";
import { cyl, mat, put, rbox, screenFader, shadow, standFor } from "./real";
import type { Model, ModelBuilder } from "./types";

/**
 * UI and UX design: from wireframe to finished screen. A wireframe of an app floats beside the phone that shows the
 * finished design (our own apps), and the parts of a design system hang around them: a switch, a slider, a button,
 * the colours and the type. As the page scrolls the wireframe fills in, the switch flips and the slider moves.
 */
const build: ModelBuilder = async (env, mini) => {
  const group = new THREE.Group();
  const k = mini ? 0.62 : 1;
  const [pw, ph] = SCREEN_PX.phone;
  const finals = await Promise.all(["phone-beanstalk", "phone-civilfeed"].map((n) => env.shot(n, Math.round(pw * k), Math.round(ph * k))));

  /* ---- the phone with the finished design ---- */
  const phone = makePhone(finals[0]);
  env.textures.push(...phone.textures);
  const P = standFor(phone, 0.16);
  P.scale.setScalar(1.7);
  P.position.set(1.0, 0, 0.6);
  P.rotation.y = -0.22;
  P.add(shadow(env, 2.4, 2.0, 0.3, 0, 0));
  group.add(P);
  const fp = screenFader(phone.screen!, finals, [0.6]);

  /* ---- the wireframe, which fills in ---- */
  const wire = drawn(env, 512, 1040, (g, w, h) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(34,66,95,0.5)";
    g.lineWidth = 4;
    rr(g, 30, 70, w - 60, 300, 20);
    g.stroke();
    g.beginPath();
    g.moveTo(30, 70);
    g.lineTo(w - 30, 370);
    g.moveTo(w - 30, 70);
    g.lineTo(30, 370);
    g.stroke();
    [420, 470, 520].forEach((y, i) => fillRR(g, 30, y, (w - 60) * (0.9 - i * 0.2), 22, 11, "rgba(34,66,95,0.18)"));
    [0, 1].forEach((i) => {
      rr(g, 30 + i * ((w - 60) / 2 + 10), 590, (w - 80) / 2, 200, 16);
      g.stroke();
    });
    rr(g, 30, 840, w - 60, 80, 40);
    g.stroke();
  });
  const card = new THREE.Group();
  const cw = 0.74 * 1.7;
  const chh = 1.52 * 1.7;
  put(card, rbox(cw + 0.08, chh + 0.08, 0.07, 0.2, 3), mat.white(0.25), 0, 0, 0);
  const face = plane(wire, cw - 0.06, chh - 0.06, 0.16);
  face.position.z = 0.037;
  const fmat = face.material as THREE.MeshBasicMaterial;
  fmat.polygonOffset = true;
  fmat.polygonOffsetFactor = -2;
  fmat.polygonOffsetUnits = -2;
  card.add(face);
  const fw = screenFader({ mesh: face, mat: fmat, w: cw, h: chh, parent: card } as ScreenHandle, [wire, finals[0]], [0.45]);
  card.position.set(-1.7, 1.9, -0.4);
  card.rotation.y = 0.32;
  group.add(card);
  group.add(shadow(env, 2.2, 1.6, 0.18, -1.7, -0.2));

  /* ---- the parts of a design system ---- */
  const green = mat.paint(0x73c94a, 0.35);
  const toggle = new THREE.Group();
  const track = put(toggle, new THREE.CapsuleGeometry(0.2, 0.42, 8, 24).rotateZ(Math.PI / 2), mat.paint(0x9dbbd3, 0.35), 0, 0, 0);
  const knob = put(toggle, new THREE.SphereGeometry(0.17, 32, 20), mat.white(0.2), -0.21, 0, 0.08);
  toggle.position.set(-3.5, 3.1, 0.4);
  const slider = new THREE.Group();
  put(slider, rbox(1.7, 0.08, 0.08, 0.04), mat.paint(0xd6e0ea, 0.4), 0, 0, 0);
  const fill = put(slider, rbox(1, 0.09, 0.09, 0.04).translate(0.5, 0, 0), green, -0.85, 0, 0.005);
  const sk = put(slider, new THREE.SphereGeometry(0.15, 28, 18), mat.white(0.2), 0, 0, 0.04);
  slider.position.set(-3.3, 0.9, 1.0);
  const button = new THREE.Group();
  put(button, rbox(1.5, 0.44, 0.14, 0.21, 4), green, 0, 0, 0);
  put(button, rbox(0.6, 0.06, 0.02, 0.03), mat.white(0.3), 0, 0, 0.075);
  button.position.set(3.1, 2.7, 0.2);
  const chips = [0x22425f, 0x2f6fb5, 0x73c94a].map((c, i) => put(group, cyl(0.26, 0.26, 0.07, 40).rotateX(Math.PI / 2), mat.paint(c, 0.35), 2.7 + i * 0.62, 1.2, 0.6));
  const type = drawn(env, 256, 256, (g, w, h) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#22425f";
    g.font = "700 120px Inter, system-ui, sans-serif";
    g.textBaseline = "middle";
    g.fillText("Aa", 30, 120);
    fillRR(g, 30, 196, 140, 12, 6, "rgba(34,66,95,0.35)");
  });
  const typeCard = new THREE.Group();
  put(typeCard, rbox(1.0, 1.0, 0.08, 0.1), mat.white(0.25), 0, 0, 0);
  const tf = plane(type, 0.92, 0.92, 0.08);
  tf.position.z = 0.042;
  typeCard.add(tf);
  typeCard.position.set(3.4, 4.0, -0.4);
  typeCard.rotation.y = -0.25;
  group.add(toggle, slider, button, typeCard);
  const floaters = [toggle, slider, button, typeCard];
  const base = floaters.map((f) => f.position.y);
  const trackMat = track.material as THREE.MeshPhysicalMaterial;

  const model: Model = {
    group,
    tags: [],
    camera: { az: [-0.26, 0.2], elev: [0.16, 0.1] },
    floorY: 0,
    set(_a, _l, p) {
      fw(p);
      fp(p);
      const on = smooth(clamp01((p - 0.3) * 6));
      knob.position.x = -0.21 + 0.42 * on;
      trackMat.color.setHex(0x9dbbd3).lerp(new THREE.Color(0x73c94a), on);
      const v = smooth(clamp01(p));
      fill.scale.x = Math.max(0.01, 0.15 + 1.55 * v);
      sk.position.x = -0.85 + (0.15 + 1.55 * v);
      floaters.forEach((f, i) => (f.position.y = base[i] + Math.sin(p * Math.PI * 2 + i * 1.4) * 0.07));
      chips.forEach((c, i) => (c.position.y = 1.2 + Math.sin(p * Math.PI * 2 + i) * 0.05));
      group.updateMatrixWorld(true);
    },
    frame: () => ({ cx: 0, cy: 2.2, hw: 4.4, hh: 2.4 }),
  };
  model.set(1, 1, 0);
  return model;
};

export default build;
