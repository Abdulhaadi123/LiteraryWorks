import * as THREE from "three";
import { clamp01, lerp, quint, smooth, TAU, win } from "../engine";
import { darkGlass, GLOW, glowTex, lightSprite, lit, makeScreen, stageMetal } from "./glow";
import { drawn, fillRR, rr } from "./parts";
import { uiTexture } from "./ui";
import type { Frame, Model, ModelBuilder } from "./types";

/**
 * Construction technology: a building going up, floor by floor, on a blueprint. A tower crane lifts each glass floor
 * from the stock pile, swings it over the site and lowers it onto the stack; a ghost of the finished building stands
 * round it, dimension lines measure it, the windows light as it runs and a project view stands beside it. On a page
 * the building is built as it is scrolled; once it is finished the crane keeps lifting the next floor onto the roof.
 */

const FLOORS = 10;
const START = 3;
const cap = () => new THREE.MeshStandardMaterial({ color: 0x0c2038, metalness: 0.3, roughness: 0.5, envMapIntensity: 0.2 });
const FW = 2.6;
const FH = 0.36;
const PITCH = 0.46;
const BX = -0.7;
const BASE = 0.2;
const MAST = new THREE.Vector3(-3.4, 0, -1.3);
const JIB_Y = 7.3;
const PILE = new THREE.Vector3(2.8, BASE + FH / 2 + 0.02, 0.6);
const HOIST = 6.2;

function blueprint(env: Parameters<ModelBuilder>[0]): THREE.CanvasTexture {
  return drawn(env, 1024, 1024, (g, w, h) => {
    const bg = g.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#14375a");
    bg.addColorStop(1, "#0a2038");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i <= w; i += 32) {
      g.fillStyle = i % 128 === 0 ? "rgba(170,210,255,0.26)" : "rgba(170,210,255,0.1)";
      g.fillRect(i, 0, 1.5, h);
      g.fillRect(0, i, w, 1.5);
    }
    // the site boundary, and the footprint of the building
    g.setLineDash([18, 12]);
    g.strokeStyle = "rgba(132,226,85,0.8)";
    g.lineWidth = 4;
    rr(g, 60, 60, w - 120, h - 120, 10);
    g.stroke();
    g.setLineDash([]);
    const fx = ((BX - FW / 2 + 4.2) / 8.4) * w;
    const fw = (FW / 8.4) * w;
    const fy = (4.2 - FW / 2) / 8.4 * h;
    fillRR(g, fx, fy, fw, fw, 6, "rgba(111,178,255,0.18)");
    rr(g, fx, fy, fw, fw, 6);
    g.strokeStyle = "rgba(190,224,255,0.9)";
    g.lineWidth = 3;
    g.stroke();
    g.beginPath();
    g.moveTo(fx, fy);
    g.lineTo(fx + fw, fy + fw);
    g.moveTo(fx + fw, fy);
    g.lineTo(fx, fy + fw);
    g.strokeStyle = "rgba(190,224,255,0.35)";
    g.lineWidth = 2;
    g.stroke();
    // corner marks and a dimension line
    g.strokeStyle = "#84e255";
    g.lineWidth = 7;
    g.lineCap = "round";
    [
      [60, 60, 1, 1],
      [w - 60, 60, -1, 1],
      [60, h - 60, 1, -1],
      [w - 60, h - 60, -1, -1],
    ].forEach(([x, y, sx, sy]) => {
      g.beginPath();
      g.moveTo(x, y + sy * 60);
      g.lineTo(x, y);
      g.lineTo(x + sx * 60, y);
      g.stroke();
    });
    g.strokeStyle = "rgba(190,224,255,0.7)";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(fx, fy + fw + 56);
    g.lineTo(fx + fw, fy + fw + 56);
    g.moveTo(fx, fy + fw + 40);
    g.lineTo(fx, fy + fw + 72);
    g.moveTo(fx + fw, fy + fw + 40);
    g.lineTo(fx + fw, fy + fw + 72);
    g.stroke();
    fillRR(g, fx + fw / 2 - 50, fy + fw + 78, 100, 14, 7, "rgba(190,224,255,0.5)");
  });
}

function facade(env: Parameters<ModelBuilder>[0], seed: number): THREE.CanvasTexture {
  return drawn(env, 256, 64, (g, w, h) => {
    g.fillStyle = "#0e2b47";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 7; i++) {
      const warm = (i * 7 + seed * 3) % 5 === 0;
      g.fillStyle = warm ? "rgba(255,214,140,0.75)" : "rgba(150,210,255,0.6)";
      g.fillRect(10 + i * 35, 16, 24, 30);
    }
    g.fillStyle = "rgba(190,224,255,0.5)";
    g.fillRect(0, 0, w, 3);
    g.fillRect(0, h - 3, w, 3);
  });
}

function lattice(): { mast: THREE.BufferGeometry; jib: THREE.BufferGeometry } {
  const m: number[] = [];
  const seg = (a: number[], b: number[], out: number[]) => out.push(...a, ...b);
  // the mast: four corners, a ring at every level, a diagonal on every face
  const c = 0.26;
  const corners: [number, number][] = [
    [-c, -c],
    [c, -c],
    [c, c],
    [-c, c],
  ];
  const y1 = JIB_Y;
  corners.forEach(([x, z]) => seg([x, 0.1, z], [x, y1, z], m));
  for (let y = 0.1; y < y1 - 0.01; y += 0.55) {
    const yn = Math.min(y1, y + 0.55);
    corners.forEach(([x, z], i) => {
      const [nx, nz] = corners[(i + 1) % 4];
      seg([x, y, z], [nx, y, nz], m);
      seg([x, y, z], [nx, yn, nz], m);
    });
  }
  const j: number[] = [];
  // the jib: three chords with struts, out to 7 and back to -2.6, and the tower that carries it
  const chord = (x0: number, x1: number) => {
    seg([x0, JIB_Y + 0.5, 0], [x1, JIB_Y + 0.5, 0], j);
    seg([x0, JIB_Y, -0.22], [x1, JIB_Y, -0.22], j);
    seg([x0, JIB_Y, 0.22], [x1, JIB_Y, 0.22], j);
    const dir = x1 > x0 ? 1 : -1;
    for (let k = 0; k < Math.abs(x1 - x0) / 0.5; k++) {
      const a = x0 + dir * k * 0.5;
      const b = a + dir * 0.5;
      seg([a, JIB_Y, -0.22], [b, JIB_Y + 0.5, 0], j);
      seg([a, JIB_Y, 0.22], [b, JIB_Y + 0.5, 0], j);
      seg([b, JIB_Y, -0.22], [b, JIB_Y, 0.22], j);
    }
  };
  chord(-0.3, 7.2);
  chord(-0.3, -2.7);
  seg([0, JIB_Y + 0.5, 0], [0, JIB_Y + 1.5, 0], j);
  seg([0, JIB_Y + 1.5, 0], [6.4, JIB_Y + 0.5, 0], j);
  seg([0, JIB_Y + 1.5, 0], [-2.5, JIB_Y + 0.5, 0], j);
  const mg = new THREE.BufferGeometry();
  mg.setAttribute("position", new THREE.Float32BufferAttribute(m, 3));
  const jg = new THREE.BufferGeometry();
  jg.setAttribute("position", new THREE.Float32BufferAttribute(j, 3));
  return { mast: mg, jib: jg };
}

const build: ModelBuilder = async (env) => {
  const group = new THREE.Group();

  /* ---- the site: a blueprint on a slab of dark glass ---- */
  const site = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.2, 8.4), [stageMetal(), stageMetal(), new THREE.MeshBasicMaterial({ map: blueprint(env), toneMapped: false }), stageMetal(), stageMetal(), stageMetal()]);
  site.position.y = 0.1;
  group.add(site);
  const siteEdge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(8.4, 0.2, 8.4)), new THREE.LineBasicMaterial({ color: GLOW.sky, transparent: true, opacity: 0.7, toneMapped: false }));
  siteEdge.position.y = 0.1;
  group.add(siteEdge);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex(env, "110,190,255"), transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(BX, 0.22, 0);
  pool.scale.set(6.5, 6.5, 1);
  group.add(pool);

  /* ---- the building: ten floors of glass, and the ghost of the whole ---- */
  const floors = Array.from({ length: FLOORS }, (_, i) => {
    const fm = new THREE.MeshBasicMaterial({ map: facade(env, i), toneMapped: false });
    const geo = new THREE.BoxGeometry(FW, FH, FW);
    const mesh = new THREE.Mesh(geo, [fm, fm, cap(), cap(), fm, fm]);
    const g = new THREE.Group();
    g.add(mesh);
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: GLOW.sky, transparent: true, opacity: 0.85, toneMapped: false })));
    group.add(g);
    return { g, fm };
  });
  const carried = new THREE.Group();
  {
    const fm = new THREE.MeshBasicMaterial({ map: facade(env, 3), toneMapped: false });
    const geo = new THREE.BoxGeometry(FW, FH, FW);
    carried.add(new THREE.Mesh(geo, [fm, fm, cap(), cap(), fm, fm]));
    carried.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: GLOW.green, toneMapped: false })));
    group.add(carried);
  }
  const stockFm = new THREE.MeshBasicMaterial({ map: facade(env, 5), color: 0x777777, toneMapped: false });
  const stock = new THREE.Mesh(new THREE.BoxGeometry(FW, FH * 0.9, FW), [stockFm, stockFm, cap(), cap(), stockFm, stockFm]);
  stock.position.set(PILE.x, BASE + FH * 0.45, PILE.z);
  group.add(stock, new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(FW, FH * 0.9, FW)), new THREE.LineBasicMaterial({ color: GLOW.sky, transparent: true, opacity: 0.45, toneMapped: false })));
  group.children[group.children.length - 1].position.copy(stock.position);
  const totalH = FLOORS * PITCH;
  const ghost = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(FW + 0.04, totalH, FW + 0.04)), new THREE.LineBasicMaterial({ color: GLOW.sky, transparent: true, opacity: 0.28, toneMapped: false }));
  ghost.position.set(BX, BASE + totalH / 2 - FH / 2, 0);
  group.add(ghost);

  // dimension lines: the height, with ticks and a chip
  const dim = new THREE.Group();
  const dl = (a: number[], b: number[]) => dim.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]), new THREE.LineBasicMaterial({ color: 0x84e255, transparent: true, opacity: 0.9, toneMapped: false })));
  const dx = BX + FW / 2 + 0.7;
  const dz = -FW / 2 - 0.2;
  dl([dx, BASE, dz], [dx, BASE + totalH, dz]);
  dl([dx - 0.18, BASE, dz], [dx + 0.18, BASE, dz]);
  dl([dx - 0.18, BASE + totalH, dz], [dx + 0.18, BASE + totalH, dz]);
  group.add(dim);

  /* ---- the crane ---- */
  const crane = new THREE.Group();
  crane.position.copy(MAST);
  group.add(crane);
  const lat = lattice();
  const latMat = new THREE.LineBasicMaterial({ color: 0xbfe0ff, transparent: true, opacity: 0.85, toneMapped: false });
  const mastLines = new THREE.LineSegments(lat.mast, latMat);
  crane.add(mastLines);
  const slew = new THREE.Group();
  slew.position.y = 0;
  crane.add(slew);
  slew.add(new THREE.LineSegments(lat.jib, latMat));
  const weight = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.6), stageMetal());
  weight.position.set(-2.3, JIB_Y - 0.1, 0);
  slew.add(weight);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.5), darkGlass(GLOW.navy, 0.2));
  cab.position.set(0.55, JIB_Y - 0.2, 0.42);
  slew.add(cab);
  const trolley = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 0.4), new THREE.MeshBasicMaterial({ color: 0x84e255, toneMapped: false }));
  slew.add(trolley);
  const beacon = lightSprite(env, "255,120,120", 0.7, 0.9);
  beacon.position.set(0, JIB_Y + 1.6, 0);
  slew.add(beacon);
  // the cable and the hook's four straps
  const cableGeo = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 10 }, () => new THREE.Vector3()));
  const cable = new THREE.LineSegments(cableGeo, new THREE.LineBasicMaterial({ color: 0xdff1ff, transparent: true, opacity: 0.9, toneMapped: false }));
  cable.frustumCulled = false;
  group.add(cable);

  // the sweep through the building as it runs
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(FW + 1.2, FW + 1.2), new THREE.MeshBasicMaterial({ map: glowTex(env, "140,210,255"), transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  scan.rotation.x = -Math.PI / 2;
  scan.position.x = BX;
  group.add(scan);

  // the project view
  const project = makeScreen(env, uiTexture(env, "tasks", 480, 384, 21, "#84e255"), 1.9, 1.5, { accent: GLOW.sky, depth: 0.08, radius: 0.12, glow: 0.2 });
  project.group.rotation.order = "YXZ";
  group.add(project.group);

  const tagBlue = new THREE.Object3D();
  tagBlue.position.set(-3.6, 0.35, 3.4);
  const tagRoof = new THREE.Object3D();
  tagRoof.position.set(BX, BASE + totalH + 0.1, 0);
  group.add(tagBlue, tagRoof);

  const frame: Frame = { cx: 0.1, cy: 4.0, hw: 4.6, hh: 4.15 };
  const L = new THREE.Vector3();
  const T = new THREE.Vector3();
  const roof = BASE + FLOORS * PITCH - FH / 2 + FH / 2;
  /** The load's path: up from the pile, swung over the site and lowered to `yTarget`. */
  const carryAt = (f: number, yTarget: number, out: THREE.Vector3) => {
    const lift = smooth(win(f, 0, 0.26));
    const swing = smooth(win(f, 0.24, 0.6));
    const lower = smooth(win(f, 0.58, 0.92));
    out.x = lerp(PILE.x, BX, swing);
    out.z = lerp(PILE.z, 0, swing);
    out.y = lerp(lerp(PILE.y, HOIST, lift), yTarget, lower);
  };
  const model: Model = {
    group,
    tags: [tagBlue, tagRoof, project.top],
    camera: { az: [-0.35, -0.12], elev: [0.22, 0.14] },
    floorY: 0,
    set(a, l, p) {
      const built = a >= 0.999;
      const fb = START + a * (FLOORS - START);
      const c = Math.min(FLOORS - 1, Math.floor(fb));
      let f: number;
      let yTarget: number;
      if (built) {
        f = (p * 1.5) % 1;
        yTarget = roof + FH * 0.5;
      } else {
        f = fb - c;
        yTarget = BASE + c * PITCH;
      }
      floors.forEach((fl, i) => {
        const placed = built || i < c || (i === c && f > 0.94);
        fl.g.visible = placed;
        fl.g.position.set(BX, BASE + i * PITCH, 0);
        const k = clamp01(0.45 + 0.55 * l * (0.6 + 0.4 * Math.sin(p * 18 + i * 1.7)));
        fl.fm.color.setScalar(k);
      });
      // the floor on the hook
      carryAt(f, yTarget, L);
      const showCarry = built ? f < 0.94 : f <= 0.94;
      carried.visible = showCarry && (built || a > 0.001);
      carried.position.copy(L);
      carried.scale.setScalar(built ? 1 - 0.0 * f : 1);
      stock.visible = true;
      ghost.visible = true;
      (ghost.material as THREE.LineBasicMaterial).opacity = built ? 0.16 : 0.3;
      // the crane turns to the load, the trolley runs out to it, the cable comes down
      const dxm = L.x - MAST.x;
      const dzm = L.z - MAST.z;
      const phi = Math.atan2(-dzm, dxm);
      const r = Math.hypot(dxm, dzm);
      slew.rotation.y = phi;
      trolley.position.set(r, JIB_Y - 0.12, 0);
      T.set(MAST.x + Math.cos(phi) * r, JIB_Y - 0.12, MAST.z - Math.sin(phi) * r);
      const top = L.y + FH / 2;
      const hookY = top + 0.9;
      const pos = cableGeo.attributes.position as THREE.BufferAttribute;
      pos.setXYZ(0, T.x, T.y, T.z);
      pos.setXYZ(1, T.x, hookY, T.z);
      const c4: [number, number][] = [
        [-FW / 2 + 0.2, -FW / 2 + 0.2],
        [FW / 2 - 0.2, -FW / 2 + 0.2],
        [FW / 2 - 0.2, FW / 2 - 0.2],
        [-FW / 2 + 0.2, FW / 2 - 0.2],
      ];
      c4.forEach(([ox, oz], i) => {
        pos.setXYZ(2 + i * 2, T.x, hookY, T.z);
        pos.setXYZ(3 + i * 2, L.x + ox, top, L.z + oz);
      });
      pos.needsUpdate = true;
      cable.visible = carried.visible;
      beacon.visible = Math.sin(p * 70) > 0;
      // the scan sweeps up through the building
      const sy = BASE + ((p * 1.3) % 1) * (FLOORS * PITCH);
      scan.position.set(BX, sy, 0);
      scan.visible = l > 0.05;
      (scan.material as THREE.MeshBasicMaterial).opacity = 0.34 * l;
      // the project view
      const e = quint(clamp01((a * 1.4 - 0.2) / 0.6));
      project.group.position.set(3.5, 2.0 + 0.06 * Math.sin(p * TAU * 2), 2.0);
      project.group.rotation.y = -0.45;
      project.group.scale.setScalar(Math.max(0.001, e));
      (project.light.material as THREE.SpriteMaterial).opacity = (0.1 + 0.14 * l) * e;
      (siteEdge.material as THREE.LineBasicMaterial).opacity = 0.45 + 0.4 * l;
      (pool.material as THREE.MeshBasicMaterial).opacity = 0.16 + 0.16 * l;
      dim.visible = a > 0.05;
      group.updateMatrixWorld(true);
    },
    frame: () => frame,
  };
  model.set(1, 1, 0.5);
  void lit;
  return model;
};

export default build;
