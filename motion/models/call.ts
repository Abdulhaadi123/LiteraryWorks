import * as THREE from "three";
import { clamp01, smooth } from "../engine";
import { makePhone, SCREEN_PX } from "../devices";
import { drawn, fillRR } from "./parts";
import { GRAPHITE, lathe, mat, put, screenFader, shadow, standFor, tube } from "./real";
import type { Model, ModelBuilder, ModelEnv } from "./types";

/**
 * The first conversation: a free one-hour session. A conference speakerphone on the table, its light ring turning
 * green as the call starts, and a phone on a stand that goes from the calendar invite to the call in progress.
 */

function inviteScreen(env: ModelEnv, w: number, h: number): THREE.Texture {
  return drawn(env, w, h, (g) => {
    const k = w / 512;
    g.fillStyle = "#f4f7fa";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#191716";
    g.font = `600 ${Math.round(26 * k)}px Inter, system-ui, sans-serif`;
    g.textBaseline = "middle";
    g.fillText("9:41", 44 * k, 64 * k);
    g.font = `700 ${Math.round(44 * k)}px Inter, system-ui, sans-serif`;
    g.fillText("Calendar", 40 * k, 170 * k);
    // the week strip, with today marked
    ["M", "T", "W", "T", "F"].forEach((d, i) => {
      const x = 58 * k + i * 92 * k;
      if (i === 1) fillRR(g, x - 30 * k, 214 * k, 60 * k, 86 * k, 16 * k, "#22425f");
      g.fillStyle = i === 1 ? "#ffffff" : "rgba(25,23,22,0.55)";
      g.font = `600 ${Math.round(22 * k)}px Inter, system-ui, sans-serif`;
      g.textAlign = "center";
      g.fillText(d, x, 240 * k);
      g.font = `700 ${Math.round(26 * k)}px Inter, system-ui, sans-serif`;
      g.fillText(String(14 + i), x, 278 * k);
      g.textAlign = "left";
    });
    // the event card
    fillRR(g, 36 * k, 350 * k, w - 72 * k, 330 * k, 26 * k, "#ffffff");
    fillRR(g, 36 * k, 350 * k, 12 * k, 330 * k, 6 * k, "#73c94a");
    g.fillStyle = "rgba(25,23,22,0.5)";
    g.font = `600 ${Math.round(22 * k)}px Inter, system-ui, sans-serif`;
    g.fillText("10:00 – 11:00", 76 * k, 398 * k);
    g.fillStyle = "#191716";
    g.font = `700 ${Math.round(38 * k)}px Inter, system-ui, sans-serif`;
    g.fillText("Free AI audit", 76 * k, 452 * k);
    g.fillStyle = "rgba(25,23,22,0.6)";
    g.font = `500 ${Math.round(24 * k)}px Inter, system-ui, sans-serif`;
    g.fillText("60 minutes · Video call", 76 * k, 500 * k);
    g.fillText("With the LiteraryWorks team", 76 * k, 538 * k);
    fillRR(g, 76 * k, 584 * k, 170 * k, 64 * k, 32 * k, "#73c94a");
    g.fillStyle = "#191716";
    g.font = `700 ${Math.round(26 * k)}px Inter, system-ui, sans-serif`;
    g.fillText("Join", 130 * k, 617 * k);
    // the rest of the day, faint
    [740, 830, 920].forEach((y, i) => {
      fillRR(g, 36 * k, y * k, w - 72 * k, 70 * k, 18 * k, "rgba(34,66,95,0.06)");
      fillRR(g, 64 * k, (y + 28) * k, (180 + i * 40) * k, 14 * k, 7 * k, "rgba(34,66,95,0.18)");
    });
  });
}

function callScreen(env: ModelEnv, w: number, h: number): THREE.Texture {
  return drawn(env, w, h, (g) => {
    const k = w / 512;
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#22425f");
    bg.addColorStop(1, "#132233");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#ffffff";
    g.font = `600 ${Math.round(26 * k)}px Inter, system-ui, sans-serif`;
    g.textBaseline = "middle";
    g.fillText("9:41", 44 * k, 64 * k);
    // the other side of the call: our mark in a ring
    g.beginPath();
    g.arc(w / 2, 330 * k, 112 * k, 0, Math.PI * 2);
    g.strokeStyle = "rgba(115,201,74,0.55)";
    g.lineWidth = 10 * k;
    g.stroke();
    g.beginPath();
    g.arc(w / 2, 330 * k, 92 * k, 0, Math.PI * 2);
    g.fillStyle = "#ffffff";
    g.fill();
    g.fillStyle = "#22425f";
    g.font = `800 ${Math.round(72 * k)}px Inter, system-ui, sans-serif`;
    g.textAlign = "center";
    g.fillText("LW", w / 2, 334 * k);
    g.fillStyle = "#ffffff";
    g.font = `700 ${Math.round(40 * k)}px Inter, system-ui, sans-serif`;
    g.fillText("LiteraryWorks", w / 2, 512 * k);
    g.fillStyle = "rgba(255,255,255,0.7)";
    g.font = `500 ${Math.round(26 * k)}px Inter, system-ui, sans-serif`;
    g.fillText("Free AI audit · In call", w / 2, 560 * k);
    // the controls
    [
      [w / 2 - 150 * k, "rgba(255,255,255,0.16)"],
      [w / 2, "rgba(255,255,255,0.16)"],
      [w / 2 + 150 * k, "#e5484d"],
    ].forEach(([x, c]) => {
      g.beginPath();
      g.arc(x as number, 900 * k, 54 * k, 0, Math.PI * 2);
      g.fillStyle = c as string;
      g.fill();
    });
    g.textAlign = "left";
  });
}

const build: ModelBuilder = async (env, mini) => {
  const group = new THREE.Group();
  const s = mini ? 0.62 : 1;
  const pw = Math.round(SCREEN_PX.phone[0] * s);
  const ph = Math.round(SCREEN_PX.phone[1] * s);
  const screens = [inviteScreen(env, pw, ph), callScreen(env, pw, ph)];

  /* ---- the speakerphone: an aluminium base, a fabric top, a light ring and the touch keys ---- */
  const puck = new THREE.Group();
  puck.position.set(-1.2, 0, 0);
  group.add(puck);
  put(puck, lathe([[0, 0], [1.3, 0], [1.36, 0.05], [1.37, 0.2], [1.3, 0.27], [0, 0.27]], 96), mat.alu(0xd6dbe0, 0.3), 0, 0, 0);
  const fabric = drawn(env, 512, 512, (g, w, h) => {
    g.fillStyle = "#e9edf1";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(34,66,95,0.16)";
    for (let y = 6; y < h; y += 11) for (let x = (y / 11) % 2 ? 6 : 11.5; x < w; x += 11) {
      g.beginPath();
      g.arc(x, y, 2.4, 0, Math.PI * 2);
      g.fill();
    }
  });
  put(puck, new THREE.CylinderGeometry(1.24, 1.26, 0.06, 96), [mat.plastic(0xdde2e7, 0.6), new THREE.MeshStandardMaterial({ map: fabric, roughness: 0.95 }), mat.plastic(0xdde2e7, 0.6)], 0, 0.3, 0);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, toneMapped: false });
  const ring = put(puck, new THREE.TorusGeometry(1.29, 0.028, 12, 128), ringMat, 0, 0.3, 0);
  ring.rotation.x = Math.PI / 2;
  // the keys in the middle: a glossy disc with mute, minus, plus
  put(puck, new THREE.CylinderGeometry(0.42, 0.42, 0.04, 64), mat.paint(GRAPHITE, 0.25), 0, 0.345, 0);
  const keys = drawn(env, 256, 256, (g, w, h) => {
    g.fillStyle = "#2c3139";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(255,255,255,0.8)";
    g.lineWidth = 8;
    g.lineCap = "round";
    // minus and plus
    g.beginPath();
    g.moveTo(56, 128);
    g.lineTo(88, 128);
    g.moveTo(168, 128);
    g.lineTo(200, 128);
    g.moveTo(184, 112);
    g.lineTo(184, 144);
    g.stroke();
    // a microphone
    g.beginPath();
    g.roundRect(116, 56, 24, 44, 12);
    g.stroke();
    g.beginPath();
    g.arc(128, 92, 24, 0.15 * Math.PI, 0.85 * Math.PI);
    g.stroke();
  });
  const top = put(puck, new THREE.CircleGeometry(0.4, 64), new THREE.MeshBasicMaterial({ map: keys, toneMapped: false }), 0, 0.367, 0);
  top.rotation.x = -Math.PI / 2;
  const callMat = new THREE.MeshBasicMaterial({ color: 0x73c94a, transparent: true, opacity: 0, toneMapped: false });
  const callDot = put(puck, new THREE.CircleGeometry(0.06, 32), callMat, 0, 0.369, 0.25);
  callDot.rotation.x = -Math.PI / 2;
  // its cable, running off the back
  put(group, tube([[-1.2, 0.1, -1.36], [-1.25, 0.03, -1.8], [-1.7, 0.03, -2.2], [-2.3, 0.03, -2.35]], 0.045, 48, 10), mat.rubber(0x3a4048), 0, 0, 0);
  group.add(shadow(env, 3.6, 3.6, 0.3, -1.2, 0));

  /* ---- the phone with the invite, then the call ---- */
  const phone = makePhone(screens[0]);
  env.textures.push(...phone.textures);
  const P = standFor(phone, 0.22);
  P.scale.setScalar(1.25);
  P.position.set(1.75, 0, 0.45);
  P.rotation.y = -0.38;
  P.add(shadow(env, 2.2, 1.8, 0.3, 0, 0));
  group.add(P);
  const fp = screenFader(phone.screen!, screens, [0.45]);

  const white = new THREE.Color(0xffffff);
  const green = new THREE.Color(0x73c94a);
  const model: Model = {
    group,
    tags: [],
    camera: { az: [-0.2, 0.14], elev: [0.62, 0.52] },
    floorY: 0,
    set(_a, _l, p) {
      // the call starts a little before the middle of the beat
      const on = smooth(clamp01((p - 0.38) / 0.14));
      ringMat.color.copy(white).lerp(green, on);
      ringMat.opacity = 0.35 + 0.6 * on * (0.75 + 0.25 * Math.sin(p * Math.PI * 10));
      callMat.opacity = on;
      puck.rotation.y = -0.25 + p * 0.5;
      fp(p);
    },
    frame: () => ({ cx: 0.2, cy: 1.0, hw: 3.4, hh: 1.8 }),
  };
  model.set(1, 1, 0);
  return model;
};

export default build;
