import * as THREE from "three";
import { clamp01, smooth } from "../engine";
import { drawn, fillRR } from "./parts";
import { cyl, GRAPHITE, mat, put, rbox, shadow } from "./real";
import type { Model, ModelBuilder } from "./types";

/**
 * Know what to automate before you pay to build it: a printing calculator on the table. As the page scrolls its keys
 * are pressed one after another and the paper tape rolls out of it, line by line, ending with a green total.
 */

const TW = 1.2; // the tape's width
const TL = 3.0; // the tape's full length
const KEYS: [number, number][] = [];
for (let r = 0; r < 5; r++) for (let c = 0; c < 4; c++) KEYS.push([c, r]);
const ORDER = [4, 9, 14, 7, 12, 17, 19, 3];

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();
  const body = new THREE.Group();
  body.rotation.y = -0.12;
  group.add(body);

  /* ---- the body: graphite, a white keypad deck sloping towards you, a display ---- */
  put(body, rbox(2.6, 0.42, 3.0, 0.16, 4), mat.plastic(GRAPHITE, 0.45), 0, 0.21, 0);
  const deck = new THREE.Group();
  deck.position.set(0, 0.43, 0.2);
  deck.rotation.x = 0.08;
  body.add(deck);
  put(deck, rbox(2.36, 0.04, 2.3, 0.05), mat.white(0.5), 0, 0, 0);
  const display = drawn(env, 512, 128, (g, w, h) => {
    g.fillStyle = "#1b2a24";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#9fe07a";
    g.font = "600 64px Inter, system-ui, sans-serif";
    g.textAlign = "right";
    g.textBaseline = "middle";
    g.fillText("0.", w - 30, h / 2 + 4);
  });
  const disp = put(body, new THREE.PlaneGeometry(1.9, 0.46), new THREE.MeshBasicMaterial({ map: display, toneMapped: false }), 0, 0.43, -1.15);
  disp.rotation.x = -Math.PI / 2 + 0.25;
  const keyW = mat.white(0.35);
  const keyG = mat.plastic(0xdfe4e9, 0.5);
  const keyOk = mat.paint(0x73c94a, 0.4);
  const keys = KEYS.map(([c, r], i) => {
    const k = put(deck, rbox(0.42, 0.12, 0.34, 0.06), c === 3 ? (r === 4 ? keyOk : keyG) : keyW, -0.75 + c * 0.5, 0.07, -0.85 + r * 0.43);
    return { k, i };
  });

  /* ---- the paper roll behind, and the tape that comes out of it ---- */
  put(body, cyl(0.06, 0.06, 1.5, 16).rotateZ(Math.PI / 2), mat.alu(0xc9ced4, 0.3), 0, 0.72, -1.7);
  put(body, cyl(0.34, 0.34, TW, 48).rotateZ(Math.PI / 2), mat.paper(null, 0xfbfbf8), 0, 0.72, -1.7);
  const tapeTex = drawn(env, 256, 640, (g, w, h) => {
    g.fillStyle = "#fbfbf8";
    g.fillRect(0, 0, w, h);
    // printed lines, a rule and the green total at the end (the end that comes out first is at the bottom)
    for (let i = 0; i < 9; i++) {
      const y = 60 + i * 56;
      fillRR(g, 24, y, 26, 10, 5, "rgba(34,66,95,0.35)");
      fillRR(g, w - 24 - (70 + ((i * 37) % 60)), y, 70 + ((i * 37) % 60), 10, 5, "rgba(34,66,95,0.45)");
    }
    g.fillStyle = "rgba(34,66,95,0.5)";
    g.fillRect(24, h - 112, w - 48, 3);
    fillRR(g, w - 150, h - 84, 126, 26, 8, "#5db536");
  });
  const tape = put(body, new THREE.PlaneGeometry(TW, TL), mat.paper(tapeTex), 0, 0, 0);
  group.add(shadow(env, 4.4, 5.0, 0.28, 0, 0));

  const model: Model = {
    group,
    tags: [],
    camera: { az: [-0.2, 0.12], elev: [0.85, 0.75] },
    floorY: 0,
    set(_a, _l, p) {
      // the keys, pressed in turn
      const at = p * ORDER.length;
      keys.forEach(({ k, i }) => {
        const j = ORDER.indexOf(i);
        const press = j < 0 ? 0 : Math.max(0, 1 - Math.abs(at - j - 0.5) * 2.5);
        k.position.y = 0.07 - 0.05 * press;
      });
      // the tape: it rises from the roll and leans back, longer as the sum goes on (the newest line nearest the roll)
      const len = 0.35 + smooth(clamp01(p / 0.9)) * (TL - 0.35);
      tape.scale.y = len / TL;
      tapeTex.repeat.set(1, len / TL);
      tapeTex.offset.set(0, 0);
      tape.rotation.x = -0.32;
      tape.position.set(0, 0.95 + (len / 2) * Math.cos(0.32), -1.7 - 0.25 - (len / 2) * Math.sin(0.32));
    },
    frame: () => ({ cx: 0, cy: 1.2, hw: 2.0, hh: 1.7 }),
  };
  model.set(1, 1, 0);
  return model;
};

export default build;
