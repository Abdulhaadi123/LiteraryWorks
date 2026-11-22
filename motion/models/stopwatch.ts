import * as THREE from "three";
import { clamp01, smooth } from "../engine";
import { drawn } from "./parts";
import { cyl, lathe, mat, put, shadow } from "./real";
import type { Model, ModelBuilder } from "./types";

/**
 * One hour: a stopwatch lying on the table. As the page scrolls its hand makes one full turn of the sixty-minute dial
 * and a green ring fills behind it; the crown is pressed as it starts.
 */

const R = 1.5; // the dial's radius
const SEG = 120;

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();
  const watch = new THREE.Group();
  watch.rotation.y = 0.2;
  group.add(watch);
  const chrome = mat.alu(0xd8dde2, 0.18);

  /* ---- the case, the dial and the glass ---- */
  // (an open ring at the top, so the dial shows through the glass)
  put(watch, lathe([[0, 0], [R + 0.18, 0], [R + 0.26, 0.08], [R + 0.26, 0.26], [R + 0.16, 0.38], [R - 0.02, 0.36], [R - 0.02, 0.28]], 96), chrome, 0, 0, 0);
  const dial = drawn(env, 1024, 1024, (g, w, h) => {
    const c = w / 2;
    g.fillStyle = "#fbfcfd";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#22425f";
    g.lineCap = "round";
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
      const big = i % 5 === 0;
      g.lineWidth = big ? 9 : 4;
      const r0 = big ? 400 : 430;
      g.beginPath();
      g.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0);
      g.lineTo(c + Math.cos(a) * 470, c + Math.sin(a) * 470);
      g.stroke();
    }
    g.fillStyle = "#22425f";
    g.font = "600 58px Inter, system-ui, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    for (let i = 1; i <= 12; i++) {
      const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
      g.fillText(String(i * 5), c + Math.cos(a) * 335, c + Math.sin(a) * 335);
    }
    g.fillStyle = "rgba(34,66,95,0.55)";
    g.font = "600 40px Inter, system-ui, sans-serif";
    g.fillText("MINUTES", c, c + 170);
  });
  const face = put(watch, new THREE.CircleGeometry(R, 96), new THREE.MeshStandardMaterial({ map: dial, roughness: 0.4 }), 0, 0.3, 0);
  face.rotation.x = -Math.PI / 2;
  // the green ring that fills with the hour
  const ringGeo = new THREE.RingGeometry(R * 0.6, R * 0.66, SEG, 1, Math.PI / 2, -Math.PI * 2);
  const ring = put(watch, ringGeo, new THREE.MeshBasicMaterial({ color: 0x73c94a, toneMapped: false, side: THREE.DoubleSide }), 0, 0.305, 0);
  ring.rotation.x = -Math.PI / 2;
  const glass = put(watch, cyl(R + 0.05, R + 0.05, 0.06, 96), mat.glass(0.1), 0, 0.36, 0);
  void glass;

  /* ---- the hands ---- */
  const hand = new THREE.Group();
  hand.position.y = 0.32;
  watch.add(hand);
  put(hand, new THREE.BoxGeometry(0.045, 0.02, R * 0.95), mat.paint(0x5db536, 0.3), 0, 0, -R * 0.4);
  put(hand, cyl(0.09, 0.09, 0.04, 32), mat.paint(0x22425f, 0.3), 0, 0.01, 0);

  /* ---- the crown and the button at the top, the ring for a chain ---- */
  const crown = new THREE.Group();
  crown.position.set(0, 0.18, -(R + 0.26));
  watch.add(crown);
  put(crown, cyl(0.14, 0.14, 0.3, 32).rotateX(Math.PI / 2), chrome, 0, 0, -0.15);
  const button = put(crown, cyl(0.2, 0.2, 0.16, 32).rotateX(Math.PI / 2), chrome, 0, 0, -0.38);
  put(watch, new THREE.TorusGeometry(0.3, 0.06, 16, 48), chrome, 0, 0.18, -(R + 0.26) - 0.8).rotation.x = Math.PI / 2;
  group.add(shadow(env, 4.4, 5.2, 0.3, 0, -0.3));

  const model: Model = {
    group,
    tags: [],
    camera: { az: [-0.25, 0.15], elev: [0.62, 0.52] },
    floorY: 0,
    set(_a, _l, p) {
      const t = smooth(clamp01((p - 0.05) / 0.85));
      hand.rotation.y = -t * Math.PI * 2;
      ringGeo.setDrawRange(0, Math.round(t * SEG) * 6);
      // the start button goes in at the beginning
      const push = Math.max(0, 1 - Math.abs(p - 0.05) * 12);
      button.position.z = -0.38 + push * 0.08;
    },
    frame: () => ({ cx: 0, cy: 0.3, hw: 2.0, hh: 2.0 }),
  };
  model.set(1, 1, 0);
  return model;
};

export default build;
