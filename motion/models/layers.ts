import * as THREE from "three";
import { clamp01, lerp, quint, TAU } from "../engine";
import { darkGlass, GLOW, lightColumn, lit, makeScreen, type Screen } from "./glow";
import { drawn, rr } from "./parts";
import { uiTexture } from "./ui";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * SaaS platforms: the layers of a product, pulled apart. Four plates of dark glass, the interface on top, then the API,
 * the data and the cloud, each with the things that live on it standing on its surface (blocks of interface, gateways,
 * databases, servers). Lines of light join them and small packets run up and down between the layers. On a page the
 * stack starts closed and opens as it is scrolled; the servers blink once it runs.
 */

const PW = 5.6;
const PD = 3.6;
const T = 0.16;
const NAMES = ["cloud", "data", "api", "interface"];

/** The surface of a plate that has things standing on it: a fine grid, brackets in its corners, a few bars of text. */
function gridTexture(env: Parameters<ModelBuilder>[0], accent: string, seed: number): THREE.CanvasTexture {
  return drawn(env, 896, 576, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#143453");
    bg.addColorStop(1, "#0a1f35");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    const lit = g.createRadialGradient(w * 0.25, 0, 0, w * 0.25, 0, w);
    lit.addColorStop(0, "rgba(130,195,255,0.22)");
    lit.addColorStop(1, "rgba(130,195,255,0)");
    g.fillStyle = lit;
    g.fillRect(0, 0, w, h);
    for (let x = 0; x <= w; x += 56) {
      g.fillStyle = x % 224 === 0 ? "rgba(170,210,255,0.2)" : "rgba(170,210,255,0.09)";
      g.fillRect(x, 0, 1.5, h);
    }
    for (let y = 0; y <= h; y += 56) {
      g.fillStyle = y % 224 === 0 ? "rgba(170,210,255,0.2)" : "rgba(170,210,255,0.09)";
      g.fillRect(0, y, w, 1.5);
    }
    g.strokeStyle = accent;
    g.lineWidth = 6;
    g.lineCap = "round";
    [
      [30, 30, 1, 1],
      [w - 30, 30, -1, 1],
      [30, h - 30, 1, -1],
      [w - 30, h - 30, -1, -1],
    ].forEach(([x, y, sx, sy]) => {
      g.beginPath();
      g.moveTo(x, y + sy * 46);
      g.lineTo(x, y);
      g.lineTo(x + sx * 46, y);
      g.stroke();
    });
    g.fillStyle = "rgba(190,224,255,0.3)";
    for (let i = 0; i < 3; i++) rr(g, 70, 64 + i * 22, 150 - i * 36 + (seed % 3) * 8, 9, 4.5), g.fill();
    rr(g, 1.5, 1.5, w - 3, h - 3, 28);
    g.strokeStyle = "rgba(170,210,255,0.28)";
    g.lineWidth = 3;
    g.stroke();
  });
}

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();
  const stack = new THREE.Group();
  group.add(stack);

  const edgeMat = (color: number, opacity = 0.8) => new THREE.LineBasicMaterial({ color, transparent: true, opacity, toneMapped: false });
  /** A block of dark glass with a lit edge. */
  const block = (w: number, h: number, d: number, color = GLOW.sky): THREE.Group => {
    const g = new THREE.Group();
    const geo = new THREE.BoxGeometry(w, h, d);
    g.add(new THREE.Mesh(geo, darkGlass(GLOW.navy, 0.25)));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat(color)));
    return g;
  };

  /* ---- the four plates ---- */
  const plates = NAMES.map((name, k) => {
    const g = new THREE.Group();
    const tex = name === "interface" ? uiTexture(env, "page", 896, 576, 4, "#84e255") : gridTexture(env, name === "cloud" ? "#84e255" : "#8fd2ff", k);
    const s = makeScreen(env, tex, PW, PD, { accent: name === "interface" ? GLOW.green : GLOW.sky, depth: T, radius: 0.22, glow: 0.16, back: null });
    s.group.rotation.x = -Math.PI / 2;
    g.add(s.group);
    const top = new THREE.Group();
    top.position.y = T / 2 + (name === "interface" ? 0.005 : 0.01);
    g.add(top);
    stack.add(g);
    return { g, s, top, name };
  });

  // interface: a card, a button, a toggle standing off the page
  {
    const t = plates[3].top;
    const card = block(1.7, 0.12, 1.0, GLOW.sky);
    card.position.set(-1.4, 0.06, -0.55);
    const btn = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.7, 6, 14), new THREE.MeshBasicMaterial({ color: 0x84e255, toneMapped: false }));
    btn.rotation.z = Math.PI / 2;
    btn.position.set(0.7, 0.14, 0.95);
    const toggle = block(0.95, 0.1, 0.42, GLOW.sky);
    toggle.position.set(1.65, 0.05, -0.8);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), new THREE.MeshBasicMaterial({ color: 0x84e255, toneMapped: false }));
    knob.position.set(1.95, 0.16, -0.8);
    t.add(card, btn, toggle, knob);
  }
  // API: gateways, six-sided, joined by lines
  const gates: THREE.Mesh[] = [];
  {
    const t = plates[2].top;
    const P: [number, number][] = [
      [-1.9, -0.9],
      [-0.6, -1.0],
      [0.8, -0.6],
      [2.0, -1.0],
      [-1.3, 0.75],
      [0.15, 0.85],
      [1.55, 0.75],
    ];
    const pts: number[] = [];
    P.forEach(([x, z], i) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, i === 2 ? 0.34 : 0.18, 6), i === 2 ? new THREE.MeshBasicMaterial({ color: 0x84e255, toneMapped: false, transparent: true, opacity: 0.9 }) : darkGlass(GLOW.navy, 0.25));
      m.position.set(x, i === 2 ? 0.17 : 0.09, z);
      t.add(m);
      gates.push(m);
      const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 6 }, (_, j) => new THREE.Vector3(Math.cos((j / 6) * TAU) * 0.3, 0, Math.sin((j / 6) * TAU) * 0.3))), edgeMat(GLOW.sky));
      ring.position.set(x, i === 2 ? 0.34 : 0.18, z);
      t.add(ring);
    });
    [
      [0, 1],
      [1, 2],
      [2, 3],
      [0, 4],
      [4, 5],
      [5, 6],
      [1, 5],
      [2, 6],
      [2, 5],
    ].forEach(([i, j]) => pts.push(P[i][0], 0.03, P[i][1], P[j][0], 0.03, P[j][1]));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    t.add(new THREE.LineSegments(geo, edgeMat(GLOW.sky, 0.6)));
  }
  // data: three databases, stacks of discs with a lit ring between them
  const rings: THREE.Mesh[] = [];
  {
    const t = plates[1].top;
    [-1.7, 0, 1.7].forEach((x, i) => {
      for (let d = 0; d < 3; d++) {
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.14, 40), darkGlass(GLOW.navy, 0.22));
        disc.position.set(x, 0.07 + d * 0.22, 0);
        t.add(disc);
        const r = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.012, 6, 60), lit(i === 1 && d === 2 ? GLOW.green : GLOW.sky, 0.9));
        r.rotation.x = Math.PI / 2;
        r.position.set(x, 0.145 + d * 0.22, 0);
        t.add(r);
        rings.push(r);
      }
    });
  }
  // cloud: servers in two rows, each with a strip of lights
  const leds: THREE.Mesh[] = [];
  {
    const t = plates[0].top;
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 4; c++) {
        const srv = block(1.0, 0.34, 0.62, GLOW.sky);
        srv.position.set(-1.9 + c * 1.27, 0.17, -0.8 + r * 1.5);
        t.add(srv);
        for (let l = 0; l < 3; l++) {
          const led = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.02), new THREE.MeshBasicMaterial({ color: 0x84e255, toneMapped: false }));
          led.position.set(-1.9 + c * 1.27 - 0.3 + l * 0.12, 0.2, -0.8 + r * 1.5 + 0.32);
          t.add(led);
          leds.push(led);
        }
      }
  }

  /* ---- what joins them: four posts, a column of light, packets that run between the layers ---- */
  const posts = [
    [-2.6, -1.6],
    [2.6, -1.6],
    [-2.6, 1.6],
    [2.6, 1.6],
  ].map(([x, z]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1, 0.03), lit(GLOW.sky, 0.55));
    m.position.x = x;
    m.position.z = z;
    stack.add(m);
    return m;
  });
  const col = lightColumn(0x7cc4ff, 0.5, 0.5, 1);
  stack.add(col.mesh);
  const PK = 12;
  const packets = Array.from({ length: PK }, (_, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), new THREE.MeshBasicMaterial({ color: i % 3 === 0 ? 0xb6f59a : 0xdff1ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    stack.add(m);
    return { m, x: i % 4 === 3 ? 0 : [-2.6, 2.6, -2.6, 2.6][i % 4], z: i % 4 === 3 ? 0 : [-1.6, -1.6, 1.6, 1.6][i % 4], v: 0.5 + (i % 5) * 0.18, up: i % 2 === 0 };
  });

  // tags at the front-left corner of each plate
  const corner = plates.map((p) => {
    const o = new THREE.Object3D();
    o.position.set(-PW / 2 + 0.3, 0.2, PD / 2 - 0.2);
    p.g.add(o);
    return o;
  });

  const frame: Frame = { cx: 0, cy: 3.2, hw: 3.9, hh: 3.5 };
  const model: Model = {
    group,
    // the interface, the API, the data, the cloud
    tags: [corner[3], corner[2], corner[1], corner[0]],
    camera: { az: [0.5, 0.25], elev: [0.62, 0.52] },
    floorY: 0,
    fit: false,
    set(a, l, p) {
      const e = quint(a);
      const gap = lerp(0.3, 1.85, e);
      const base = 0.85;
      stack.rotation.y = -0.45 + p * 0.8;
      plates.forEach((pl, k) => {
        pl.g.position.y = base + k * gap;
        const up = quint(clamp01((a * 1.5 - 0.08 * k - 0.1) / 0.6));
        pl.top.scale.y = Math.max(0.001, up);
        pl.s.edge.forEach((ln, i) => ((ln.material as THREE.LineBasicMaterial).opacity = (i ? 0.5 : 0.7) + 0.3 * l));
        (pl.s.light.material as THREE.SpriteMaterial).opacity = 0.12 + 0.14 * l;
      });
      const yB = base;
      const yT = base + 3 * gap;
      posts.forEach((m) => {
        m.scale.y = Math.max(0.01, yT - yB);
        m.position.y = (yT + yB) / 2;
      });
      col.mesh.scale.y = Math.max(0.01, yT - yB);
      col.mesh.position.y = (yT + yB) / 2;
      col.mat.uniforms.uOpacity.value = 0.12 + 0.16 * l;
      packets.forEach((q, i) => {
        const u = (p * q.v * 2.4 + i / PK) % 1;
        const t = q.up ? u : 1 - u;
        q.m.position.set(q.x, lerp(yB, yT, t), q.z);
        q.m.rotation.set(u * 6, u * 4, 0);
        q.m.visible = a > 0.4 && l > 0.02;
        q.m.scale.setScalar(0.7 + 0.5 * Math.sin(u * Math.PI));
      });
      leds.forEach((m, i) => {
        const on = Math.sin(p * 55 + i * 2.3) > -0.2 + (1 - l) * 0.6;
        (m.material as THREE.MeshBasicMaterial).color.setHex(on ? (i % 5 === 0 ? 0xffc65a : 0x84e255) : 0x1d3f5c);
      });
      gates.forEach((m, i) => {
        if (i === 2) (m.material as THREE.MeshBasicMaterial).opacity = 0.65 + 0.3 * Math.sin(p * 30);
      });
      rings.forEach((r, i) => ((r.material as THREE.MeshBasicMaterial).opacity = 0.5 + 0.4 * (0.5 + 0.5 * Math.sin(p * 22 + i))));
      // the box round it follows how far it is opened
      frame.cy = (0.45 + (yT + 0.6)) / 2;
      frame.hh = (yT + 0.6 - 0.45) / 2 + 0.2;
      group.updateMatrixWorld(true);
    },
    frame: () => frame,
  };
  model.set(1, 1, 0.5);
  return model;
};

export default build;
