import * as THREE from "three";
import { clamp01, smooth } from "../engine";
import { makeMonitor, SCREEN_PX } from "../devices";
import { drawn, fillRR, rr } from "./parts";
import { GRAPHITE, mat, put, rbox, screenFader, shadow } from "./real";
import type { Model, ModelBuilder, ModelEnv } from "./types";

/**
 * AI and automation: document intake. A desktop document scanner takes a stack of paperwork from its feeder (an invoice,
 * a purchase order, a contract, an application); as the page scrolls each sheet slides into the scanner, comes out on
 * the front tray with a green check, and the small screen on the scanner shows where it was sent (CRM, Accounts, Drive).
 * Beside it, the system the work lands in: our support-automation and AI-assistant projects on a monitor.
 */

const PW = 1.7; // a page's width
const PL = 2.2; // a page's length
const SLOT = 0.12; // where a page's lower edge rests in the feeder, along the feeder
const TRAY_Y = 0.145; // the top of the output tray
const EXIT_Z = 0.72; // the front slot
const DEST = ["CRM", "Accounts", "Drive"];
const DOCS = [
  { title: "INVOICE", c: "#22425f", to: 1 },
  { title: "PURCHASE ORDER", c: "#2f6fb5", to: 1 },
  { title: "CONTRACT", c: "#5db536", to: 2 },
  { title: "APPLICATION", c: "#e0a02a", to: 0 },
  { title: "INVOICE", c: "#22425f", to: 1 },
];
const TURN = [0.03, -0.04, 0.05, -0.02, 0.04];

function docTexture(env: ModelEnv, title: string, c: string, mini: boolean): THREE.Texture {
  return drawn(env, mini ? 384 : 512, mini ? 497 : 662, (g, w, h) => {
    const k = w / 512;
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, w, h);
    // letterhead: a mark, the title, the sender's lines
    fillRR(g, 34 * k, 34 * k, 52 * k, 52 * k, 12 * k, c);
    fillRR(g, 98 * k, 40 * k, 110 * k, 10 * k, 5 * k, "rgba(34,66,95,0.45)");
    fillRR(g, 98 * k, 60 * k, 80 * k, 8 * k, 4 * k, "rgba(34,66,95,0.22)");
    g.fillStyle = c;
    g.font = `700 ${Math.round(24 * k)}px Inter, system-ui, sans-serif`;
    g.textAlign = "right";
    g.textBaseline = "alphabetic";
    g.fillText(title, w - 34 * k, 62 * k);
    g.textAlign = "left";
    fillRR(g, w - 160 * k, 76 * k, 126 * k, 8 * k, 4 * k, "rgba(34,66,95,0.22)");
    // two address blocks
    [34, 276].forEach((x) => [0, 1, 2].forEach((i) => fillRR(g, x * k, (122 + i * 18) * k, (i ? 150 : 110) * k, 8 * k, 4 * k, `rgba(34,66,95,${i ? 0.16 : 0.32})`)));
    // the table
    fillRR(g, 34 * k, 196 * k, w - 68 * k, 30 * k, 6 * k, "#eef3f8");
    for (let r = 0; r < 7; r++) {
      const y = (244 + r * 34) * k;
      fillRR(g, 46 * k, y, 200 * k, 8 * k, 4 * k, "rgba(34,66,95,0.2)");
      fillRR(g, w - 150 * k, y, 40 * k, 8 * k, 4 * k, "rgba(34,66,95,0.2)");
      fillRR(g, w - 92 * k, y, 46 * k, 8 * k, 4 * k, "rgba(34,66,95,0.28)");
      g.fillStyle = "rgba(34,66,95,0.08)";
      g.fillRect(34 * k, y + 20 * k, w - 68 * k, 1.5 * k);
    }
    // the total
    fillRR(g, w - 214 * k, 498 * k, 180 * k, 56 * k, 10 * k, "#f4f7fa");
    fillRR(g, w - 200 * k, 514 * k, 60 * k, 9 * k, 4 * k, "rgba(34,66,95,0.35)");
    fillRR(g, w - 118 * k, 510 * k, 70 * k, 16 * k, 6 * k, c);
    // a signature line and the footer
    g.strokeStyle = "rgba(34,66,95,0.5)";
    g.lineWidth = 2.5 * k;
    g.beginPath();
    g.moveTo(40 * k, 560 * k);
    g.bezierCurveTo(70 * k, 530 * k, 90 * k, 575 * k, 120 * k, 548 * k);
    g.bezierCurveTo(140 * k, 532 * k, 150 * k, 566 * k, 176 * k, 552 * k);
    g.stroke();
    fillRR(g, 34 * k, 578 * k, 170 * k, 2 * k, 1, "rgba(34,66,95,0.3)");
    fillRR(g, 34 * k, h - 40 * k, w - 68 * k, 7 * k, 3 * k, "rgba(34,66,95,0.1)");
    rr(g, 1, 1, w - 2, h - 2, 3);
    g.strokeStyle = "rgba(34,66,95,0.12)";
    g.lineWidth = 2;
    g.stroke();
  });
}

const build: ModelBuilder = async (env, mini) => {
  const group = new THREE.Group();
  const s = mini ? 0.62 : 1;
  const shots = await Promise.all(["support"].map((n) => env.shot(n, Math.round(SCREEN_PX.monitor[0] * s), Math.round(SCREEN_PX.monitor[1] * s))));

  /* ---- the scanner: a rounded white body, a graphite front, the feeder behind, the tray in front ---- */
  const white = mat.white(0.42);
  const graphite = mat.plastic(GRAPHITE, 0.45);
  const dark = new THREE.MeshBasicMaterial({ color: 0x15181c });
  put(group, rbox(3.0, 0.9, 1.4, 0.22, 4), white, 0, 0.45, 0);
  put(group, rbox(2.62, 0.34, 0.05, 0.04), graphite, 0, 0.5, 0.69);
  // the slots: in at the top, behind; out at the front, low
  const slotIn = put(group, new THREE.PlaneGeometry(2.0, 0.07), dark, 0, 0.902, -0.4);
  slotIn.rotation.x = -Math.PI / 2;
  put(group, new THREE.PlaneGeometry(2.05, 0.05), dark, 0, 0.21, 0.701);
  // the scan light, which glows while a page goes through
  const lightMat = new THREE.MeshBasicMaterial({ color: 0x73c94a, transparent: true, opacity: 0.2, toneMapped: false });
  const light = put(group, new THREE.PlaneGeometry(1.96, 0.025), lightMat, 0, 0.905, -0.36);
  light.rotation.x = -Math.PI / 2;
  // the output tray, with a stop at its end
  const trayMat = mat.plastic(0xdfe4e9, 0.5);
  put(group, rbox(2.1, 0.04, 2.5, 0.03), trayMat, 0, TRAY_Y - 0.02, EXIT_Z + 1.25);
  put(group, rbox(2.1, 0.13, 0.04, 0.02), trayMat, 0, TRAY_Y + 0.045, EXIT_Z + 2.48);
  // the feeder: a plate rising behind the scanner at 60 degrees, with two paper guides
  const chute = new THREE.Group();
  chute.position.set(0, 0.88, -0.42);
  chute.rotation.x = -Math.PI / 6;
  group.add(chute);
  put(chute, rbox(2.2, 1.9, 0.035, 0.03), trayMat, 0, 0.95, -0.03);
  [-1, 1].forEach((side) => put(chute, rbox(0.05, 1.1, 0.15, 0.02), graphite, side * 0.92, 0.72, 0.05));
  // feet
  [-1.2, 1.2].forEach((x) => [-0.5, 0.5].forEach((z) => put(group, new THREE.CylinderGeometry(0.08, 0.08, 0.03, 20), mat.rubber(), x, 0.015, z)));

  /* ---- the touch screen on the scanner: where each page is sent ---- */
  const panel = new THREE.Group();
  panel.position.set(0.92, 0.93, 0.4);
  panel.rotation.x = -1.05;
  group.add(panel);
  put(panel, rbox(1.0, 0.56, 0.05, 0.05), graphite, 0, 0, 0);
  const chipX = [-0.3, 0.0, 0.3];
  const screenTex = drawn(env, 400, 220, (g, w, h) => {
    g.fillStyle = "#132233";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,255,255,0.75)";
    g.font = "600 26px Inter, system-ui, sans-serif";
    g.textBaseline = "middle";
    g.fillText("Send to", 24, 36);
    DEST.forEach((t, i) => {
      const cx = w / 2 + (chipX[i] / 0.9) * w;
      fillRR(g, cx - 56, 92, 112, 92, 14, "rgba(255,255,255,0.1)");
      g.fillStyle = "#ffffff";
      g.font = "600 22px Inter, system-ui, sans-serif";
      g.textAlign = "center";
      g.fillText(t, cx, 160);
      g.textAlign = "left";
      fillRR(g, cx - 14, 106, 28, 28, 8, i === 0 ? "#2f6fb5" : i === 1 ? "#5db536" : "#e0a02a");
    });
  });
  const scr = put(panel, new THREE.PlaneGeometry(0.9, 0.495), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }), 0, 0, 0.027);
  void scr;
  const ringTex = drawn(env, 128, 108, (g, w, h) => {
    rr(g, 5, 5, w - 10, h - 10, 16);
    g.strokeStyle = "#73c94a";
    g.lineWidth = 7;
    g.stroke();
  });
  const pick = put(panel, new THREE.PlaneGeometry(0.27, 0.228), new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, toneMapped: false, depthWrite: false }), 0, -0.06, 0.03);

  /* ---- the pages ---- */
  const checkTex = drawn(env, 128, 128, (g, w, h) => {
    g.beginPath();
    g.arc(w / 2, h / 2, 54, 0, Math.PI * 2);
    g.fillStyle = "#5db536";
    g.fill();
    g.strokeStyle = "#fff";
    g.lineWidth = 12;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.beginPath();
    g.moveTo(w * 0.3, h * 0.52);
    g.lineTo(w * 0.45, h * 0.66);
    g.lineTo(w * 0.72, h * 0.36);
    g.stroke();
  });
  const checkMat = new THREE.MeshBasicMaterial({ map: checkTex, transparent: true, toneMapped: false, depthWrite: false });
  const sheets = DOCS.map((d, k) => {
    const tex = docTexture(env, d.title, d.c, mini);
    // each half of the page's trip has its own copy of the picture, cropped to the part that shows
    const inTex = tex.clone();
    const outTex = tex.clone();
    env.textures.push(inTex, outTex);
    const inMesh = put(chute, new THREE.PlaneGeometry(PW, PL), mat.paper(inTex), 0, 0, 0);
    const outMesh = put(group, new THREE.PlaneGeometry(PW, PL), mat.paper(outTex), 0, 0, 0);
    outMesh.rotation.x = -Math.PI / 2;
    const badge = put(group, new THREE.PlaneGeometry(0.34, 0.34), checkMat, 0.5, 0, 0);
    badge.rotation.x = -Math.PI / 2;
    return { inMesh, outMesh, inTex, outTex, badge, k };
  });
  group.add(shadow(env, 4.4, 5.6, 0.26, 0, 0.9));

  /* ---- the system the work lands in ---- */
  const screen = makeMonitor(shots[0]);
  env.textures.push(...screen.textures);
  const mon = new THREE.Group();
  mon.add(screen.group);
  mon.scale.setScalar(0.56);
  mon.position.set(3.75, 0, -0.9);
  mon.rotation.y = -0.42;
  mon.add(shadow(env, 5.4, 3.4, 0.3, 0, 0));
  group.add(mon);
  // (not at the middle of the beat: the services grid's still is taken there)
  const fs = screenFader(screen.screen!, shots, [0.68]);

  const N = DOCS.length - 1;
  const model: Model = {
    group,
    tags: [],
    camera: { az: [-0.36, 0.16], elev: [0.36, 0.3] },
    floorY: 0,
    set(_a, _l, p) {
      let feeding = false;
      let active = 0;
      for (const sh of sheets) {
        let d = PL;
        let e = PL;
        if (sh.k > 0) {
          // the first page is already through; each of the others has its own share of the scroll
          const u = clamp01((p - (sh.k - 1) / N) * N);
          d = smooth(clamp01((u - 0.08) / 0.52)) * PL;
          e = smooth(clamp01((u - 0.3) / 0.52)) * PL;
          if (d > 0.001 && e < PL - 0.001) feeding = true;
          if (u > 0.08) active = sh.k;
        }
        // in the feeder: the part not yet in the slot, the top of the page
        const vis = PL - d;
        sh.inMesh.visible = vis > 0.004;
        if (sh.inMesh.visible) {
          sh.inMesh.scale.y = vis / PL;
          sh.inMesh.position.set(0, SLOT + vis / 2, 0.03 + (DOCS.length - sh.k) * 0.009);
          sh.inTex.repeat.set(1, vis / PL);
          sh.inTex.offset.set(0, d / PL);
        }
        // on the tray: the part already out, the foot of the page first
        sh.outMesh.visible = e > 0.004;
        const y = TRAY_Y + 0.004 + sh.k * 0.005;
        if (sh.outMesh.visible) {
          sh.outMesh.scale.y = e / PL;
          sh.outMesh.position.set(0, y, EXIT_Z + e / 2);
          sh.outMesh.rotation.z = e >= PL - 0.001 ? TURN[sh.k] : 0;
          sh.outTex.repeat.set(1, e / PL);
          sh.outTex.offset.set(0, 0);
        }
        sh.badge.visible = e >= PL - 0.001;
        sh.badge.position.set(0.5, y + 0.003, EXIT_Z + 0.42);
      }
      lightMat.opacity = feeding ? 0.95 : 0.2;
      pick.position.x = chipX[DOCS[active].to];
      fs(p);
    },
    frame: () => ({ cx: 1.1, cy: 1.2, hw: 4.8, hh: 2.0 }),
  };
  model.set(1, 1, 0);
  return model;
};

export default build;
