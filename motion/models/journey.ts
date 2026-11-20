import * as THREE from "three";
import { clamp01, lerp, quint, smooth, TAU, win } from "../engine";
import { chrome, circleLine, crispDot, floorShadow, GLOW, glowTex, outline, stageMetal, tileFace } from "./glow";
import { drawn, fillRR, rr } from "./parts";
import type { Model, ModelBuilder } from "./types";

/**
 * About: written in chapters. An open book stands on a lectern, tilted toward the reader. As the page scrolls its leaves
 * turn (they bend as they go, and each has a back), and each spread lets a small model rise off the page: a plan with its
 * walls going up, a stack of blocks falling into place, a rocket lifting off, a card with a green check and a key. Four
 * index tabs stand out of the book's edge, the open chapter's tab turns green, and the page's tags point at them.
 */

const W = 3.3; // a page's width
const H = 4.4; // a page's height (along the book's depth)
const COLS = 28; // segments across a leaf, so it can bend
const TILT = 0.42; // how far the lectern leans the book toward the reader
const COVER = 0.14;
const BLOCK = 0.22;
const Y0 = COVER + BLOCK; // the top of the pages that stay put
const STEP = 0.018; // the gap between leaves
const LEAF0 = Y0 + 0.02;
const CHAPTERS = ["Plan", "Build", "Release", "Handover"];
const NAVY = "#22425f";
const GREEN = "#5db536";

/** When each chapter's spread is open, and when the leaf after it turns (it needs the object gone before it sweeps). */
const TURNS: [number, number][] = [
  [0.16, 0.28],
  [0.44, 0.56],
  [0.72, 0.84],
];

type Env = Parameters<ModelBuilder>[0];
type Pen = (g: CanvasRenderingContext2D, w: number, h: number) => void;

/** A page: paper with a soft shade where it runs into the spine and a hairline round it (a picture page is blueprint paper). */
function pageTexture(env: Env, spine: "left" | "right", draw: Pen, ruled = false) {
  return drawn(env, 660, 880, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, ruled ? "#e9f1fa" : "#ffffff");
    bg.addColorStop(1, ruled ? "#d6e4f3" : "#f1f5f9");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    if (ruled) {
      // the squares of the drawing paper
      g.strokeStyle = "rgba(47,111,181,0.13)";
      g.lineWidth = 2;
      for (let x = 0; x <= w; x += 44) {
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x, h);
        g.stroke();
      }
      for (let y = 0; y <= h; y += 44) {
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(w, y);
        g.stroke();
      }
    }
    draw(g, w, h);
    const x0 = spine === "left" ? 0 : w;
    const x1 = spine === "left" ? w * 0.2 : w * 0.8;
    const sh = g.createLinearGradient(x0, 0, x1, 0);
    sh.addColorStop(0, "rgba(34,66,95,0.22)");
    sh.addColorStop(1, "rgba(34,66,95,0)");
    g.fillStyle = sh;
    g.fillRect(0, 0, w, h);
    rr(g, 2, 2, w - 4, h - 4, 10);
    g.strokeStyle = "rgba(34,66,95,0.12)";
    g.lineWidth = 3;
    g.stroke();
  });
}

/** The page of words: a numeral, the chapter's name, a green rule and a few lines of grey. */
function textPage(env: Env, c: number) {
  return pageTexture(env, "right", (g, w) => {
    g.fillStyle = "rgba(34,66,95,0.1)";
    g.font = "700 210px Inter, system-ui, sans-serif";
    g.textBaseline = "alphabetic";
    g.fillText(String(c + 1).padStart(2, "0"), 56, 270);
    g.fillStyle = NAVY;
    g.font = "700 104px Inter, system-ui, sans-serif";
    g.fillText(CHAPTERS[c], 56, 410);
    fillRR(g, 56, 440, 130, 9, 4.5, GREEN);
    [0.92, 0.84, 0.9, 0.62, 0.88, 0.8, 0.44].forEach((k, i) => fillRR(g, 56, 500 + i * 46, (w - 150) * k, 14, 7, "rgba(34,66,95,0.2)"));
    [0, 1, 2].forEach((i) => {
      g.beginPath();
      g.arc(68, 836 - 150 + i * 50, 8, 0, TAU);
      g.fillStyle = GREEN;
      g.fill();
      fillRR(g, 94, 686 + i * 50 - 7, 270 - i * 46, 14, 7, "rgba(34,66,95,0.3)");
    });
  });
}

/** The page of a picture: one drawing for each chapter (the model rises out of it). */
function picturePage(env: Env, c: number) {
  return pageTexture(env, "left", (g, w, h) => {
    const x0 = 96;
    const y0 = 110;
    const pw = w - 160;
    const ph = h * 0.56;
    fillRR(g, 60, 64, w - 100, ph + 90, 26, "rgba(47,111,181,0.06)");
    g.lineCap = "round";
    g.lineJoin = "round";
    g.strokeStyle = NAVY;
    g.lineWidth = 7;
    if (c === 0) {
      // a plan: rooms, a door and a dotted way through
      rr(g, x0, y0, pw, ph, 10);
      g.stroke();
      g.beginPath();
      g.moveTo(x0 + pw * 0.46, y0);
      g.lineTo(x0 + pw * 0.46, y0 + ph * 0.55);
      g.moveTo(x0 + pw * 0.46, y0 + ph * 0.62);
      g.lineTo(x0 + pw, y0 + ph * 0.62);
      g.stroke();
      g.setLineDash([14, 14]);
      g.strokeStyle = GREEN;
      g.beginPath();
      g.moveTo(x0 + 40, y0 + ph - 40);
      g.lineTo(x0 + pw * 0.24, y0 + ph * 0.72);
      g.lineTo(x0 + pw * 0.24, y0 + ph * 0.3);
      g.lineTo(x0 + pw * 0.72, y0 + ph * 0.44);
      g.stroke();
      g.setLineDash([]);
    } else if (c === 1) {
      // a build: blocks in a pyramid, the last one green
      const s = pw / 3.3;
      [
        [0, 2],
        [1, 2],
        [2, 2],
        [0.5, 1],
        [1.5, 1],
        [1, 0],
      ].forEach(([i, j], k) => {
        const x = x0 + 10 + i * (s + 10) + s * 0.1;
        const y = y0 + ph - (3 - j) * (s + 10) + 10;
        fillRR(g, x, y, s, s, 16, k === 5 ? GREEN : "#ffffff");
        rr(g, x, y, s, s, 16);
        g.strokeStyle = k === 5 ? "#3f8f1f" : NAVY;
        g.lineWidth = 6;
        g.stroke();
      });
    } else if (c === 2) {
      // a release: an arrow lifting off a line, a trail of dots
      const cx = x0 + pw * 0.5;
      g.beginPath();
      g.moveTo(cx, y0 + 30);
      g.lineTo(cx, y0 + ph * 0.66);
      g.moveTo(cx - 76, y0 + 120);
      g.lineTo(cx, y0 + 30);
      g.lineTo(cx + 76, y0 + 120);
      g.stroke();
      for (let i = 0; i < 6; i++) {
        g.beginPath();
        g.arc(cx, y0 + ph * 0.74 + i * 22, 9 - i, 0, TAU);
        g.fillStyle = GREEN;
        g.fill();
      }
      fillRR(g, x0 + 30, y0 + ph - 10, pw - 60, 14, 7, "rgba(34,66,95,0.3)");
    } else {
      // a handover: a checklist, all but the last ticked
      for (let i = 0; i < 4; i++) {
        const y = y0 + 24 + i * 100;
        rr(g, x0 + 10, y, 58, 58, 13);
        g.strokeStyle = NAVY;
        g.lineWidth = 6;
        g.stroke();
        if (i < 3) {
          g.beginPath();
          g.moveTo(x0 + 22, y + 31);
          g.lineTo(x0 + 35, y + 44);
          g.lineTo(x0 + 58, y + 14);
          g.strokeStyle = GREEN;
          g.lineWidth = 9;
          g.stroke();
        }
        fillRR(g, x0 + 100, y + 22, pw * 0.62 - i * 24, 15, 7.5, "rgba(34,66,95,0.28)");
      }
    }
    fillRR(g, 60, h * 0.56 + 190, 210, 15, 7.5, "rgba(34,66,95,0.34)");
    fillRR(g, 60, h * 0.56 + 224, w - 140, 12, 6, "rgba(34,66,95,0.16)");
    fillRR(g, 60, h * 0.56 + 250, (w - 140) * 0.7, 12, 6, "rgba(34,66,95,0.16)");
  }, true);
}

const white = () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1 });
const navy = () => new THREE.MeshStandardMaterial({ color: 0x22425f, metalness: 0.3, roughness: 0.35 });
const green = () => new THREE.MeshStandardMaterial({ color: 0x73c94a, metalness: 0.1, roughness: 0.3 });
const blue = () => new THREE.MeshStandardMaterial({ color: 0x3e6d97, metalness: 0.2, roughness: 0.35 });
const tinted = (color: number) => new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1 });
const line = (color: number, opacity = 0.8) => new THREE.LineBasicMaterial({ color, transparent: true, opacity, toneMapped: false });
/** A box whose origin is the middle of its base, so it can grow up from where it stands. */
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
/** A part of a model: a solid with a thin outline, in a group of its own (to scale or move as one). */
function part(parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, edge: number = GLOW.sky, opacity = 0.8): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.add(new THREE.Mesh(geo, mat), new THREE.LineSegments(new THREE.EdgesGeometry(geo), line(edge, opacity)));
  parent.add(g);
  return g;
}
/** How far `e` is through [a, b], eased. */
const ph = (e: number, a: number, b: number) => quint(win(e, a, b));

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();
  group.add(floorShadow(env, 11.5, 8.4, 0.2, 0, 0.3));

  /* ---- the lectern: a plinth, four legs and a tilted board that holds the book toward the reader ---- */
  const PL = 0.14;
  const BY = 1.95; // the height of the middle of the board's top
  const BW = 8.4; // the board's width
  const BD = 5.5; // and depth
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.2, PL, 5.5), stageMetal());
  plinth.position.y = PL / 2;
  const plinthEdges = new THREE.LineSegments(new THREE.EdgesGeometry(plinth.geometry), line(GLOW.green, 0.9));
  plinthEdges.position.y = PL / 2;
  group.add(plinth, plinthEdges);

  /* ---- the book (its own space: y is up from the board, z runs down the pages, x across the spread) ---- */
  const book = new THREE.Group();
  book.position.set(0, BY, 0);
  book.rotation.x = TILT;
  group.add(book);
  const metal = chrome(0xcfdbe8, 0.3);
  const board = new THREE.Mesh(new THREE.BoxGeometry(BW, 0.2, BD), metal);
  board.position.y = -0.1;
  const boardEdges = new THREE.LineSegments(new THREE.EdgesGeometry(board.geometry), line(GLOW.green, 0.9));
  boardEdges.position.copy(board.position);
  const lip = new THREE.Mesh(new THREE.BoxGeometry(BW, 0.3, 0.2), metal);
  lip.position.set(0, 0.05, BD / 2 - 0.1);
  book.add(board, boardEdges, lip);
  // the legs run from the plinth up to the underside of the board (the back ones are longer, that is what leans it)
  const legMat = chrome(0xdbe6f2, 0.2);
  [-1, 1].forEach((f) => {
    const wy = BY - 0.2 * Math.cos(TILT) - f * 2.3 * Math.sin(TILT);
    const wz = -0.2 * Math.sin(TILT) + f * 2.3 * Math.cos(TILT);
    [-1, 1].forEach((s) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, wy - PL, 20).translate(0, (wy - PL) / 2, 0), legMat);
      leg.position.set(s * 3.6, PL, wz);
      group.add(leg);
    });
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 7.2, 16).rotateZ(Math.PI / 2), legMat);
    bar.position.set(0, PL + 0.45 * (wy - PL), wz);
    group.add(bar);
  });
  // a soft shadow where the book sits on the board, and one under each model on its page
  const shadowTex = glowTex(env, "34,66,95");
  const contact = (w: number, d: number, opacity: number) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity, depthWrite: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.004;
    m.renderOrder = -1;
    return m;
  };
  book.add(contact(2 * W + 1.3, H + 1.1, 0.32));

  const coverMat = new THREE.MeshPhysicalMaterial({ color: 0x22425f, metalness: 0.1, roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 0.8 });
  [-1, 1].forEach((s) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, COVER, H + 0.3), coverMat);
    c.position.set((s * (W + 0.3)) / 2, COVER / 2, 0);
    book.add(c);
    const inlay = outline(W + 0.16, H + 0.16, 0.06, GLOW.green, 0.8);
    inlay.rotation.x = -Math.PI / 2;
    inlay.position.set((s * (W + 0.3)) / 2, COVER + 0.003, 0);
    book.add(inlay);
  });
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, H + 0.3, 24), coverMat);
  spine.rotation.x = Math.PI / 2;
  spine.position.y = COVER / 2;
  book.add(spine);

  // the pages that stay put: a block each side, with the fine lines of the page edges on its sides
  const sideTex = drawn(env, 8, 64, (g, w, h) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(34,66,95,0.2)";
    for (let y = 2; y < h; y += 4) g.fillRect(0, y, w, 1);
  });
  const sideMat = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.9, metalness: 0 });
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0 });
  [-1, 1].forEach((s) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(W - 0.02, BLOCK, H), [sideMat, sideMat, paperMat, paperMat, sideMat, sideMat]);
    b.position.set(s * (W / 2 + 0.01), COVER + BLOCK / 2, 0);
    book.add(b);
  });
  // the first left page, until a leaf lands on it
  const titleLeft = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.04, H - 0.04), new THREE.MeshStandardMaterial({ map: textPage(env, 0), roughness: 0.85, metalness: 0, envMapIntensity: 0.55 }));
  titleLeft.rotation.x = -Math.PI / 2;
  titleLeft.position.set(-W / 2, Y0 + 0.004, 0);
  book.add(titleLeft);

  /* ---- the leaves: each is a strip that bends as it turns, with a picture on its front and words on its back ---- */
  const flip = (t: THREE.Texture) => {
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.x = -1;
    t.offset.x = 1;
    return t;
  };
  const leafMat = (map: THREE.Texture, side: THREE.Side) => new THREE.MeshStandardMaterial({ map, roughness: 0.85, metalness: 0, envMapIntensity: 0.55, side });
  const leaves = [0, 1, 2, 3].map((k) => {
    const geo = new THREE.PlaneGeometry(W, H, COLS, 1);
    const front = new THREE.Mesh(geo, leafMat(picturePage(env, k), THREE.FrontSide));
    const back = new THREE.Mesh(geo, leafMat(flip(k < 3 ? textPage(env, k + 1) : pageTexture(env, "right", () => {})), THREE.BackSide));
    front.frustumCulled = back.frustumCulled = false;
    book.add(front, back);
    return geo;
  });

  /** Lays leaf `k` out: `t` is how far it has turned (0 lies on the right, 1 on the left); its free edge lags behind as it goes. */
  const lay = (k: number, t: number) => {
    const yR = LEAF0 + (4 - k) * STEP;
    const yL = LEAF0 + (k + 1) * STEP;
    const y0 = lerp(yR, yL, smooth(t));
    const lag = 0.95 * Math.sin(Math.PI * t);
    const pos = leaves[k].attributes.position as THREE.BufferAttribute;
    const du = W / COLS;
    let px = 0;
    let py = y0;
    for (let i = 0; i <= COLS; i++) {
      if (i) {
        const phi = Math.PI * t - lag * Math.pow(i / COLS, 1.4);
        px += Math.cos(phi) * du;
        py += Math.sin(phi) * du;
      }
      pos.setXYZ(i, px, py, -H / 2);
      pos.setXYZ(COLS + 1 + i, px, py, H / 2);
    }
    pos.needsUpdate = true;
    leaves[k].computeVertexNormals();
  };

  /* ---- index tabs on the right edge: one for each chapter, the open one turns green ---- */
  const tabs = CHAPTERS.map((_, c) => {
    const g = new THREE.Group();
    const x0 = W + 0.26;
    g.position.set(x0, COVER + 0.06 + c * 0.034, -1.65 + c * 1.1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x22425f, metalness: 0.2, roughness: 0.4 });
    g.add(new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.06, 0.88), mat));
    const num = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.5),
      new THREE.MeshBasicMaterial({
        map: drawn(env, 128, 128, (cg, w, h) => {
          cg.fillStyle = "#ffffff";
          cg.font = "700 88px Inter, system-ui, sans-serif";
          cg.textAlign = "center";
          cg.textBaseline = "middle";
          cg.fillText(String(c + 1), w / 2, h / 2 + 4);
        }),
        transparent: true,
        toneMapped: false,
      }),
    );
    num.rotation.x = -Math.PI / 2;
    num.position.set(-0.04, 0.032, 0);
    g.add(num);
    const anchor = new THREE.Object3D();
    anchor.position.set(0.4, 0.04, 0);
    g.add(anchor);
    book.add(g);
    return { g, mat, anchor, x0 };
  });
  const tabOn = new THREE.Color(0x73c94a);
  const tabOff = new THREE.Color(0x22425f);

  /* ---- what rises from the pages ---- */
  const objs = CHAPTERS.map(() => {
    const g = new THREE.Group();
    g.position.set(W / 2 - 0.08, LEAF0 + 4 * STEP + 0.012, -0.4);
    g.scale.setScalar(1.08);
    book.add(g);
    return g;
  });

  // a soft shadow under each model, on its page
  const shadows = [contact(4.0, 3.2, 0.32), contact(3.8, 2.0, 0.32), contact(3.2, 3.2, 0.32), contact(3.8, 3.2, 0.32)];
  shadows.forEach((s, c) => objs[c].add(s));

  // 1. plan: a floor, walls that go up one by one, a little furniture, a pin and a way in
  const plan = objs[0];
  const planFloor = part(plan, box(2.9, 0.08, 2.2), blue(), 0, 0, 0, GLOW.navy, 0.9);
  const wallDefs: [number, number, number, number][] = [
    [0, -1.06, 2.9, 0.09],
    [-1.4, 0, 0.09, 2.1],
    [1.4, 0, 0.09, 2.1],
    [-0.88, 1.06, 1.1, 0.09],
    [0.88, 1.06, 1.1, 0.09],
    [0.3, -0.625, 0.09, 0.85],
    [0.85, 0.05, 1.1, 0.09],
  ];
  const walls = wallDefs.map(([x, z, w, d]) => part(plan, box(w, 0.8, d), white(), x, 0.08, z));
  const furniture = [
    part(plan, box(0.7, 0.22, 0.4), navy(), -0.75, 0.08, -0.55),
    part(plan, box(0.95, 0.26, 0.38), white(), -0.75, 0.08, 0.55),
    part(plan, box(0.55, 0.16, 0.85), white(), 0.88, 0.08, -0.55),
    part(plan, box(0.45, 0.2, 0.45), green(), 0.9, 0.08, 0.6, GLOW.green),
  ];
  const dims = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(
      [
        [-1.45, 1.42],
        [1.45, 1.42],
        [-1.45, 1.3],
        [-1.45, 1.54],
        [1.45, 1.3],
        [1.45, 1.54],
      ].map(([x, z]) => new THREE.Vector3(x, 0.02, z)),
    ),
    line(GLOW.navy, 0.7),
  );
  plan.add(dims);
  const pin = new THREE.Group();
  const pinCone = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.5, 24), green());
  pinCone.rotation.x = Math.PI;
  pinCone.position.y = 0.25;
  const pinHead = new THREE.Mesh(new THREE.SphereGeometry(0.19, 24, 18), green());
  pinHead.position.y = 0.62;
  pin.add(pinCone, pinHead);
  pin.position.set(-0.75, 1.1, 0.55);
  plan.add(pin);
  const pinRing = circleLine(0.34, GLOW.green, 0.95);
  pinRing.position.set(-0.75, 0.1, 0.55);
  plan.add(pinRing);

  // 2. build: blocks, each with the sign of one of our services, drop into a pyramid
  const blockDefs: [number, number, string][] = [
    [-1.0, 0, "layers"],
    [0, 0, "grid"],
    [1.0, 0, "cloud"],
    [-0.5, 1, "browser"],
    [0.5, 1, "phone"],
    [0, 2, "spark"],
  ];
  const blocks = blockDefs.map(([x, row, icon], i) => {
    const g = part(objs[1], box(0.92, 0.92, 0.92), i === 5 ? tinted(0xcdeeb8) : tinted(row ? 0xeef4fb : 0xd3e3f5), x, 0.02 + row * 0.97, 0, i === 5 ? GLOW.green : GLOW.sky, i === 5 ? 1 : 0.8);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.76), new THREE.MeshBasicMaterial({ map: tileFace(env, icon, 256), toneMapped: false }));
    face.position.set(0, 0.46, 0.466);
    g.add(face);
    return { g, y: 0.02 + row * 0.97 };
  });

  // 3. release: a pad, a tower with an arm, a rocket that lifts off and the smoke it leaves
  const rel = objs[2];
  const pad = part(rel, new THREE.CylinderGeometry(1.1, 1.2, 0.1, 44).translate(0, 0.05, 0), white(), 0, 0, 0);
  const padRing = circleLine(0.86, GLOW.green, 0.95);
  padRing.position.y = 0.11;
  rel.add(padRing);
  const tower = part(rel, box(0.16, 2.2, 0.16), white(), -1.0, 0.1, -0.2);
  const arm = new THREE.Group();
  arm.position.set(-1.0, 1.35, -0.2);
  arm.add(new THREE.Mesh(box(0.72, 0.07, 0.07).translate(0.36, 0, 0), navy()));
  rel.add(arm);
  const rocket = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 32).translate(0, 0.8, 0), white());
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.27, 0.2, 24).translate(0, 0.1, 0), navy());
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.55, 32).translate(0, 1.675, 0), navy());
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.305, 0.04, 10, 40).rotateX(Math.PI / 2).translate(0, 1.05, 0), green());
  const win2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 14), green());
  win2.position.set(0, 0.85, 0.28);
  const winRing = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 10, 28), navy());
  winRing.position.set(0, 0.85, 0.29);
  rocket.add(body, bell, nose, band, win2, winRing);
  [0, 1, 2].forEach((i) => {
    const a = (i / 3) * TAU;
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.3).translate(0, 0.3, 0), navy());
    fin.position.set(Math.sin(a) * 0.36, 0.1, Math.cos(a) * 0.36);
    fin.rotation.y = a;
    rocket.add(fin);
  });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 20).rotateX(Math.PI).translate(0, -0.45, 0), new THREE.MeshBasicMaterial({ color: 0x73c94a, transparent: true, opacity: 0.9, toneMapped: false }));
  const flameCore = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.55, 16).rotateX(Math.PI).translate(0, -0.28, 0), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
  rocket.add(flame, flameCore);
  rocket.position.y = 0.11;
  rel.add(rocket);
  const smokeMat = () => new THREE.MeshBasicMaterial({ color: 0xdfe9f4, transparent: true, opacity: 0.6, depthWrite: false, toneMapped: false });
  const trail = Array.from({ length: 12 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), smokeMat());
    rel.add(m);
    return { m, i };
  });
  const cloud = Array.from({ length: 8 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), smokeMat());
    rel.add(m);
    return { m, a: (i / 8) * TAU + 0.3 };
  });

  // 4. handover: two documents and a card with a green check on a disc, and the key to it
  const han = objs[3];
  const disc = part(han, new THREE.CylinderGeometry(1.3, 1.3, 0.07, 48).translate(0, 0.035, 0), tinted(0xd3e3f5), 0, 0, 0.15);
  const discRing = circleLine(1.1, GLOW.green, 0.95);
  discRing.position.set(0, 0.08, 0.15);
  han.add(discRing);
  const docs = [-1, 1].map((s, i) => {
    const g = part(han, new THREE.BoxGeometry(1.2, 1.6, 0.04), white(), s * 0.9, 1.0, -0.2);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshBasicMaterial({ map: tileFace(env, i ? "receipt" : "doc", 256), toneMapped: false }));
    face.position.set(0, 0.15, 0.022);
    g.add(face);
    return { g, s };
  });
  const card = part(han, new THREE.BoxGeometry(1.6, 2.0, 0.1), white(), 0, 1.15, 0.4, GLOW.green, 1);
  const cardFace = new THREE.Mesh(new THREE.PlaneGeometry(1.34, 1.34), new THREE.MeshBasicMaterial({ map: tileFace(env, "check", 384), toneMapped: false }));
  cardFace.position.set(0, 0.2, 0.056);
  card.add(cardFace);
  const key = new THREE.Group();
  key.add(new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.07, 16, 40), green()));
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 0.1), green());
  shaft.position.x = 0.76;
  key.add(shaft);
  [0.95, 1.18].forEach((x) => {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.24, 0.1), green());
    tooth.position.set(x, -0.15, 0);
    key.add(tooth);
  });
  key.position.set(0.95, 0.7, 1.25);
  key.rotation.z = 0.5;
  han.add(key);
  const NC = 34;
  const cpos = new Float32Array(NC * 3);
  const ccol = new Float32Array(NC * 3);
  const cseed = Array.from({ length: NC }, () => [env.rnd(), env.rnd(), env.rnd(), env.rnd()]);
  const palette = [new THREE.Color(0x73c94a), new THREE.Color(0x2f6fb5), new THREE.Color(0x22425f)];
  cseed.forEach((s, i) => palette[Math.floor(s[3] * 3)].toArray(ccol, i * 3));
  const confettiGeo = new THREE.BufferGeometry();
  confettiGeo.setAttribute("position", new THREE.BufferAttribute(cpos, 3));
  confettiGeo.setAttribute("color", new THREE.BufferAttribute(ccol, 3));
  const confetti = new THREE.Points(confettiGeo, new THREE.PointsMaterial({ map: crispDot(env), size: 0.16, vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true }));
  confetti.frustumCulled = false;
  han.add(confetti);

  const model: Model = {
    group,
    // the page's tags point at the index tabs
    tags: tabs.map((t) => t.anchor),
    camera: { az: [-0.3, 0.2], elev: [0.46, 0.38] },
    floorY: 0,
    fitStates: [
      [1, 1, 0.08],
      [1, 1, 0.36],
      [1, 1, 0.64],
      [1, 1, 0.7],
      [1, 1, 0.94],
    ],
    set(_a, _l, p) {
      // the leaves turn one after another between the chapters
      const turned = TURNS.map(([s, e]) => smooth(win(p, s, e)));
      [0, 1, 2, 3].forEach((k) => lay(k, k < 3 ? turned[k] : 0));

      // the chapter that is open: its tab is green, its model has risen
      const open = [1 - smooth(win(p, 0.19, 0.25)), smooth(win(p, 0.19, 0.25)) * (1 - smooth(win(p, 0.47, 0.53))), smooth(win(p, 0.47, 0.53)) * (1 - smooth(win(p, 0.75, 0.81))), smooth(win(p, 0.75, 0.81))];
      tabs.forEach((t, c) => {
        t.mat.color.copy(tabOff).lerp(tabOn, open[c]);
        t.g.position.x = t.x0 + 0.16 * open[c];
      });
      const w = [
        (0.4 + 0.6 * quint(win(p, 0, 0.07))) * (1 - smooth(win(p, 0.12, 0.17))),
        quint(win(p, 0.29, 0.36)) * (1 - smooth(win(p, 0.4, 0.45))),
        quint(win(p, 0.57, 0.64)) * (1 - smooth(win(p, 0.68, 0.73))),
        quint(win(p, 0.85, 0.92)),
      ];
      objs.forEach((g, c) => {
        g.visible = w[c] > 0.002;
        g.rotation.y = Math.sin(p * 8 + c * 1.7) * 0.14;
        (shadows[c].material as THREE.MeshBasicMaterial).opacity = 0.32 * clamp01(w[c] * 1.4);
      });

      // plan
      {
        const e = w[0];
        const bob = Math.sin(p * 30);
        planFloor.scale.set(0.6 + 0.4 * ph(e, 0, 0.35), 1, 0.6 + 0.4 * ph(e, 0, 0.35));
        walls.forEach((g, i) => {
          const k = ph(e, 0.2 + i * 0.06, 0.55 + i * 0.06);
          g.scale.y = Math.max(0.001, k);
          g.visible = k > 0.003;
        });
        furniture.forEach((g, i) => {
          const k = ph(e, 0.6 + i * 0.08, 0.85 + i * 0.05);
          g.scale.setScalar(Math.max(0.001, k));
          g.visible = k > 0.003;
        });
        const pk = ph(e, 0.75, 1);
        pin.scale.setScalar(Math.max(0.001, pk));
        pin.position.y = 1.1 + 0.08 * bob;
        pinRing.scale.setScalar(1 + 0.15 * Math.sin(p * 40));
        pinRing.visible = pk > 0.01;
        dims.visible = e > 0.5;
      }
      // build
      {
        const e = w[1];
        blocks.forEach((b, i) => {
          const k = ph(e, i * 0.1, 0.42 + i * 0.1);
          b.g.visible = k > 0.003;
          b.g.position.y = b.y + (1 - k) * 2.2;
          b.g.rotation.y = (1 - k) * (i % 2 ? 0.9 : -0.9);
        });
      }
      // release
      {
        const e = w[2];
        const k = quint(e);
        pad.scale.setScalar(Math.max(0.001, k));
        padRing.scale.setScalar(Math.max(0.001, k));
        tower.scale.setScalar(Math.max(0.001, k));
        const launch = quint(win(p, 0.6, 0.7));
        arm.rotation.y = smooth(win(p, 0.6, 0.64)) * 1.4;
        arm.scale.setScalar(Math.max(0.001, k));
        rocket.scale.setScalar(Math.max(0.001, k));
        rocket.position.y = 0.11 + launch * 1.1 + 0.015 * Math.sin(p * 90) * (launch > 0 ? 1 : 0);
        const burn = smooth(win(p, 0.6, 0.63));
        flame.scale.set(1, 0.3 + 0.9 * burn * (0.9 + 0.1 * Math.sin(p * 160)), 1);
        flame.visible = burn > 0.01;
        flameCore.scale.copy(flame.scale);
        flameCore.visible = flame.visible;
        trail.forEach((t) => {
          const f = t.i / (trail.length - 1);
          const top = rocket.position.y - 0.1;
          t.m.position.set(Math.sin(t.i * 2.3 + p * 20) * 0.1 * (1 + f), 0.12 + f * Math.max(0.01, top - 0.12), Math.cos(t.i * 1.9) * 0.1 * (1 + f));
          t.m.scale.setScalar(Math.max(0.001, (0.5 + (1 - f) * 0.9) * burn * k));
          (t.m.material as THREE.MeshBasicMaterial).opacity = 0.65 * burn * (1 - f * 0.6);
          t.m.visible = burn > 0.01;
        });
        cloud.forEach((c) => {
          const spread = 0.5 + 1.1 * burn;
          c.m.position.set(Math.cos(c.a) * spread, 0.25 + 0.15 * burn, Math.sin(c.a) * spread);
          c.m.scale.setScalar(Math.max(0.001, burn * (1.1 - 0.4 * launch) * k));
          (c.m.material as THREE.MeshBasicMaterial).opacity = 0.55 * burn * (1 - 0.5 * launch);
          c.m.visible = burn > 0.01;
        });
      }
      // handover
      {
        const e = w[3];
        const k = ph(e, 0, 0.55);
        disc.scale.setScalar(Math.max(0.001, k));
        discRing.scale.setScalar(Math.max(0.001, k));
        card.scale.setScalar(Math.max(0.001, ph(e, 0.1, 0.65)));
        card.position.y = 1.15 + 0.05 * Math.sin(p * 26);
        docs.forEach((d) => {
          const f = ph(e, 0.25, 0.8);
          d.g.scale.setScalar(Math.max(0.001, f));
          d.g.rotation.z = -d.s * 0.2 * f;
          d.g.position.x = d.s * (0.2 + 0.7 * f);
        });
        key.scale.setScalar(Math.max(0.001, ph(e, 0.5, 1)));
        key.rotation.y = p * 14;
        key.position.y = 0.7 + 0.08 * Math.sin(p * 34);
        const cp = confettiGeo.attributes.position as THREE.BufferAttribute;
        const t = win(p, 0.85, 1);
        cseed.forEach((s, i) => {
          const rise = (s[2] + t * (0.6 + 0.6 * s[1])) % 1;
          cp.setXYZ(i, (s[0] - 0.5) * 3.2, 0.5 + rise * 2.8, (s[1] - 0.5) * 1.8 + 0.3);
        });
        cp.needsUpdate = true;
        confetti.visible = e > 0.5;
        (confetti.material as THREE.PointsMaterial).opacity = clamp01((e - 0.5) * 2);
      }
      group.updateMatrixWorld(true);
    },
    frame: () => ({ cx: 0, cy: 2.4, hw: 5, hh: 3 }),
  };
  model.set(1, 1, 0.5);
  return model;
};

export default build;
