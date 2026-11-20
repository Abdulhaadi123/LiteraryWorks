import * as THREE from "three";
import { clamp01, lerp, quint, TAU } from "../engine";
import { makePhone, SCREEN_PX } from "../devices";
import { circleLine, GLOW, glowTex, lightSprite, lit, makeScreen, outline, stageMetal } from "./glow";
import { drawn, fillRR, plane, rr } from "./parts";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * AI mobile apps: an app pulled apart. A phone with a chat app on its screen stands in the middle; the layers of the
 * screen lift off it one by one (the messages, a notification, the reply with its typing dots and a heart) while
 * two more of our apps stand behind it, joined by a path of light that carries pulses from one screen to the next.
 */

const S = 2.9;
const [PX, PY] = SCREEN_PX.phone;
const ZS = 0.0465 * S + 0.012;
const SW = 0.668 * S;
const SH = 1.448 * S;
const LINE = "rgba(190,224,255,";

const sk = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h = 12, a = 0.3) => fillRR(g, x, y, w, h, h / 2, `${LINE}${a})`);
const dotAt = (g: CanvasRenderingContext2D, x: number, y: number, r: number, c: string) => {
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fillStyle = c;
  g.fill();
};

/** One layer of the chat app's screen: 0 is the app itself (opaque), 1 to 3 are drawn on clear glass. */
function screenLayer(env: Parameters<ModelBuilder>[0], k: number): THREE.CanvasTexture {
  return drawn(env, PX, PY, (g, w, h) => {
    if (k === 0) {
      const bg = g.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, "#143453");
      bg.addColorStop(1, "#0a1f35");
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);
      // status bar, header with an avatar, the field at the bottom
      sk(g, 40, 38, 70, 12, 0.5);
      sk(g, w - 150, 38, 110, 12, 0.4);
      fillRR(g, 0, 78, w, 118, 0, "rgba(150,200,255,0.08)");
      dotAt(g, 78, 138, 30, "rgba(111,178,255,0.6)");
      sk(g, 124, 118, 150, 16, 0.5);
      sk(g, 124, 146, 90, 11, 0.26);
      dotAt(g, w - 60, 138, 9, "#84e255");
      fillRR(g, 28, h - 150, w - 56, 84, 42, "rgba(190,224,255,0.1)");
      sk(g, 62, h - 118, 190, 14, 0.3);
      dotAt(g, w - 78, h - 108, 28, "#84e255");
      // faint outlines where the messages go
      for (let i = 0; i < 5; i++) {
        rr(g, i % 2 ? w - 330 : 28, 240 + i * 120, 300, 84, 38);
        g.strokeStyle = "rgba(170,210,255,0.14)";
        g.lineWidth = 2;
        g.stroke();
      }
    } else if (k === 1) {
      for (let i = 0; i < 5; i++) {
        const me = i % 2 === 1;
        const x = me ? w - 330 : 28;
        fillRR(g, x, 240 + i * 120, 300, 84, 38, me ? "rgba(132,226,85,0.34)" : "rgba(111,178,255,0.34)");
        sk(g, x + 26, 262 + i * 120, 200 - i * 14, 13, 0.7);
        sk(g, x + 26, 288 + i * 120, 130, 11, 0.4);
      }
    } else if (k === 2) {
      // a notification banner coming in at the top, and an avatar with a ring
      fillRR(g, 24, 56, w - 48, 120, 34, "rgba(14,40,66,0.96)");
      rr(g, 24, 56, w - 48, 120, 34);
      g.strokeStyle = "rgba(170,210,255,0.6)";
      g.lineWidth = 3;
      g.stroke();
      dotAt(g, 88, 116, 28, "#84e255");
      sk(g, 138, 92, 190, 16, 0.8);
      sk(g, 138, 124, 280, 12, 0.4);
      dotAt(g, 88, 880, 54, "rgba(111,178,255,0.5)");
      g.beginPath();
      g.arc(88, 880, 66, 0, TAU);
      g.strokeStyle = "#84e255";
      g.lineWidth = 6;
      g.stroke();
    } else {
      // the reply: typing dots, a heart, the send button lit
      fillRR(g, 28, 690, 200, 80, 40, "rgba(111,178,255,0.4)");
      [0, 1, 2].forEach((i) => dotAt(g, 78 + i * 38, 730, 11, i === 1 ? "#fff" : "rgba(255,255,255,0.7)"));
      g.beginPath();
      const hx = w - 120;
      const hy = 760;
      g.moveTo(hx, hy + 34);
      g.bezierCurveTo(hx - 70, hy - 16, hx - 36, hy - 66, hx, hy - 26);
      g.bezierCurveTo(hx + 36, hy - 66, hx + 70, hy - 16, hx, hy + 34);
      g.fillStyle = "#ff6b8b";
      g.fill();
      dotAt(g, w - 78, h - 108, 40, "rgba(132,226,85,0.35)");
      dotAt(g, w - 78, h - 108, 28, "#84e255");
    }
  });
}

/** A small round-ended chip with an icon and two lines. */
function chipTexture(env: Parameters<ModelBuilder>[0], kind: "bell" | "heart" | "chat"): THREE.CanvasTexture {
  return drawn(env, 512, 160, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#1d466b");
    bg.addColorStop(1, "#0a2036");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    dotAt(g, 80, 80, 40, kind === "heart" ? "rgba(255,107,139,0.25)" : "rgba(132,226,85,0.25)");
    g.lineCap = "round";
    g.lineJoin = "round";
    if (kind === "bell") {
      g.beginPath();
      g.moveTo(58, 96);
      g.quadraticCurveTo(62, 54, 80, 52);
      g.quadraticCurveTo(98, 54, 102, 96);
      g.closePath();
      g.strokeStyle = "#84e255";
      g.lineWidth = 7;
      g.stroke();
      dotAt(g, 80, 108, 7, "#84e255");
    } else if (kind === "heart") {
      g.beginPath();
      g.moveTo(80, 104);
      g.bezierCurveTo(48, 80, 56, 52, 80, 68);
      g.bezierCurveTo(104, 52, 112, 80, 80, 104);
      g.fillStyle = "#ff6b8b";
      g.fill();
    } else {
      rr(g, 54, 56, 52, 40, 14);
      g.strokeStyle = "#84e255";
      g.lineWidth = 7;
      g.stroke();
    }
    sk(g, 150, 54, 220, 18, 0.7);
    sk(g, 150, 88, 150, 13, 0.35);
    rr(g, 1.5, 1.5, w - 3, h - 3, 40);
    g.strokeStyle = "rgba(170,210,255,0.3)";
    g.lineWidth = 3;
    g.stroke();
  });
}

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();
  const CY = 3.05;

  /* ---- the phone in the middle, and its screen's layers ---- */
  const base = screenLayer(env, 0);
  const center = makePhone(base);
  center.group.scale.setScalar(S);
  center.group.position.set(0, CY, 0);
  center.group.rotation.y = -0.2;
  env.textures.push(...center.textures);
  group.add(center.group);
  center.power(1);

  const fan = new THREE.Group();
  fan.position.set(0, CY, 0);
  fan.rotation.y = -0.2;
  group.add(fan);
  const layers = [1, 2, 3].map((k) => {
    const m = plane(screenLayer(env, k), SW, SH, 0.12);
    const mat = m.material as THREE.MeshBasicMaterial;
    mat.transparent = true;
    mat.depthWrite = false;
    fan.add(m);
    const e = outline(SW, SH, 0.12, k === 1 ? GLOW.sky : k === 2 ? GLOW.green : GLOW.sky, 0.7, 0);
    m.add(e);
    return { m, e };
  });

  /* ---- two more of our apps behind it ---- */
  const sides = [
    { shot: "phone-faith2", x: -3.5, yaw: 0.5 },
    { shot: "phone-civilchat", x: 3.5, yaw: -0.5 },
  ].map((o) => ({ ...o, tex: undefined as THREE.Texture | undefined }));
  const sidePhones: ReturnType<typeof makePhone>[] = [];
  for (const o of sides) {
    const tex = await env.shot(o.shot, PX, PY);
    const ph = makePhone(tex);
    env.textures.push(...ph.textures);
    ph.group.scale.setScalar(2.4);
    ph.group.position.set(o.x, 2.7, -1.5);
    ph.group.rotation.y = o.yaw;
    ph.power(1);
    group.add(ph.group);
    sidePhones.push(ph);
  }

  // the path of light from one app to the next, behind the middle one
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-3.0, 2.9, -1.4), new THREE.Vector3(-1.5, 5.2, -2.1), new THREE.Vector3(0, 5.9, -2.3), new THREE.Vector3(1.5, 5.2, -2.1), new THREE.Vector3(3.0, 2.9, -1.4)]);
  const path = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 0.016, 5, false), lit(GLOW.sky, 0.7));
  group.add(path);
  const runners = [0, 1, 2].map((k) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })));
    g.add(lightSprite(env, k % 2 ? "130,200,255" : "150,235,120", 0.9, 0.9));
    group.add(g);
    return g;
  });

  // chips that pop out: a notification, a like, a reply
  const chips = (["bell", "heart", "chat"] as const).map((kind, i) => {
    const s = makeScreen(env, chipTexture(env, kind), 1.9, 0.6, { accent: kind === "heart" ? 0xff8aa3 : GLOW.green, depth: 0.06, radius: 0.3, glow: 0.2, back: null });
    s.group.rotation.order = "YXZ";
    group.add(s.group);
    return { s, home: [new THREE.Vector3(2.6, 5.3, 1.0), new THREE.Vector3(-2.6, 2.0, 1.2), new THREE.Vector3(2.7, 1.5, 1.2)][i], yaw: [-0.3, 0.3, -0.3][i] };
  });

  // a ripple that goes out from the phone each time it buzzes, and the floor
  const ripples = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 6, 120), lit(GLOW.sky, 0.6));
    m.position.set(0, CY, -0.15);
    group.add(m);
    return m;
  });
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex(env, "110,190,255"), transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 0.03, -0.3);
  pool.scale.set(10, 5, 1);
  group.add(pool);
  const floorRing = circleLine(3.4, GLOW.sky, 0.3);
  floorRing.position.y = 0.04;
  group.add(floorRing);
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.15, 0.14, 48), stageMetal());
  stand.position.y = 0.07;
  const standRim = new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.014, 8, 80), lit(GLOW.green, 0.9));
  standRim.rotation.x = Math.PI / 2;
  standRim.position.y = 0.145;
  group.add(stand, standRim);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, CY - 2.3, 6), lit(GLOW.sky, 0.45));
  beam.position.y = 0.15 + (CY - 2.3) / 2;
  group.add(beam);

  const frame: Frame = { cx: 0, cy: 3.2, hw: 4.5, hh: 3.3 };
  const p3 = new THREE.Vector3();
  const model: Model = {
    group,
    tags: [center.tagObj, layers[1].m, chips[0].s.top],
    camera: { az: [-0.25, 0.3], elev: [0.14, 0.1] },
    floorY: 0,
    set(a, l, p) {
      const e = quint(a);
      const turn = -0.2 + Math.sin(p * TAU * 0.5) * 0.12 + p * 0.3;
      center.group.rotation.y = turn;
      fan.rotation.y = turn;
      layers.forEach((ly, k) => {
        ly.m.position.z = lerp(ZS, ZS + (k + 1) * 0.7, e);
        ly.m.position.x = Math.sin(p * TAU * 2 + k) * 0.05 * l;
        (ly.e.material as THREE.LineBasicMaterial).opacity = 0.2 + 0.6 * e;
      });
      sidePhones.forEach((ph, i) => {
        ph.group.position.y = 2.7 + 0.08 * Math.sin(p * TAU * 2 + i * 3);
        ph.power(0.7 + 0.3 * l);
        ph.group.position.x = (i ? 1 : -1) * lerp(2.9, 3.5, e);
      });
      (path.material as THREE.MeshBasicMaterial).opacity = 0.2 + 0.5 * e;
      runners.forEach((r, k) => {
        const u = (p * (1.2 + k * 0.3) + k / 3) % 1;
        curve.getPoint(u, p3);
        r.position.copy(p3);
        r.visible = a > 0.5 && l > 0.02;
        r.scale.setScalar(0.7 + 0.6 * Math.sin(u * Math.PI));
      });
      chips.forEach((c, i) => {
        const t = quint(clamp01((a * 1.5 - 0.35 - i * 0.12) / 0.55));
        c.s.group.position.copy(c.home);
        c.s.group.position.y += 0.08 * Math.sin(p * TAU * 2.4 + i * 2) - (1 - t) * 0.5;
        c.s.group.rotation.y = c.yaw;
        c.s.group.scale.setScalar(Math.max(0.001, t) * (1 + 0.04 * Math.sin(p * TAU * 5 + i)));
        (c.s.light.material as THREE.SpriteMaterial).opacity = (0.1 + 0.16 * l) * t;
      });
      ripples.forEach((m, k) => {
        const s = (p * 2 + k / 3) % 1;
        m.scale.setScalar(1.3 + 2.0 * s);
        (m.material as THREE.MeshBasicMaterial).opacity = (1 - s) * 0.5 * l;
      });
      (pool.material as THREE.MeshBasicMaterial).opacity = 0.2 + 0.2 * l;
      (standRim.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.5 * l;
      group.updateMatrixWorld(true);
    },
    frame: () => frame,
  };
  model.set(1, 1, 0.5);
  return model;
};

export default build;
