import * as THREE from "three";
import { lerp, smooth } from "../engine";
import type { ScreenHandle } from "../devices";
import { drawn, fillRR, marker, plane, rr } from "./parts";
import { mat, put, rbox, screenFader, shadow } from "./real";
import type { Model, ModelBuilder, ModelEnv } from "./types";

/**
 * AI web apps: three browser windows, one behind the other, each showing a web app we built (a language tutor, a
 * workspace, an executive search tool). Real windows: a title bar with its three buttons, a tab and an address bar over
 * the page. As the page scrolls they drift apart in depth and each moves on to another project.
 */

/** One of our projects inside a browser window, drawn as one picture. */
async function windowPicture(env: ModelEnv, name: string, host: string, mini: boolean): Promise<THREE.Texture> {
  const img = await env.image(name);
  return drawn(env, mini ? 640 : 1024, mini ? 400 : 640, (g, w, h) => {
    g.fillStyle = "#ffffff";
    g.fillRect(0, 0, w, h);
    // the title bar
    const bar = g.createLinearGradient(0, 0, 0, 62);
    bar.addColorStop(0, "#eef1f5");
    bar.addColorStop(1, "#e3e8ee");
    g.fillStyle = bar;
    g.fillRect(0, 0, w, 62);
    ["#ff6159", "#ffbd2e", "#28c940"].forEach((c, i) => {
      g.beginPath();
      g.arc(34 + i * 30, 31, 9, 0, Math.PI * 2);
      g.fillStyle = c;
      g.fill();
    });
    fillRR(g, 150, 12, 190, 38, 12, "#ffffff");
    fillRR(g, 160, 26, 100, 10, 5, "rgba(34,66,95,0.35)");
    fillRR(g, 360, 14, w - 400, 34, 17, "#ffffff");
    // a lock and the address, as a bar (no made-up web address)
    g.fillStyle = "rgba(34,66,95,0.4)";
    g.beginPath();
    g.roundRect(388, 26, 14, 11, 3);
    g.fill();
    fillRR(g, 416, 26, 220, 10, 5, "rgba(34,66,95,0.22)");
    void host;
    g.fillStyle = "rgba(34,66,95,0.14)";
    g.fillRect(0, 62, w, 2);
    // the page
    const ph = h - 64;
    g.save();
    g.beginPath();
    g.rect(0, 64, w, ph);
    g.clip();
    if (img) {
      const k = Math.max(w / img.naturalWidth, ph / img.naturalHeight);
      const dw = img.naturalWidth * k;
      const dh = img.naturalHeight * k;
      g.imageSmoothingQuality = "high";
      g.drawImage(img, (w - dw) / 2, 64 + (ph - dh) / 2, dw, dh);
    } else {
      g.fillStyle = "#22425f";
      g.fillRect(0, 64, w, ph);
    }
    g.restore();
    rr(g, 2, 2, w - 4, h - 4, 6);
    g.strokeStyle = "rgba(34,66,95,0.22)";
    g.lineWidth = 3;
    g.stroke();
  });
}

const SPECS = [
  { names: ["tutor", "kalibur"], hosts: ["tutor.example", "kalibur.example"], w: 5.6, y: 3.0, z: -2.0, x: 0.6, yaw: -0.1 },
  { names: ["wizilink", "storyia"], hosts: ["workspace.example", "storyia.example"], w: 4.8, y: 2.0, z: -0.4, x: -1.0, yaw: 0.06 },
  { names: ["aztech", "vyarl"], hosts: ["search.example", "vyarl.example"], w: 4.0, y: 1.2, z: 1.3, x: 1.6, yaw: -0.14 },
];

const build: ModelBuilder = async (env, mini) => {
  const group = new THREE.Group();
  const wins = await Promise.all(
    SPECS.map(async (s) => {
      const pics = await Promise.all(s.names.map((n, i) => windowPicture(env, n, s.hosts[i], mini)));
      const h = s.w * 0.625;
      const g = new THREE.Group();
      put(g, rbox(s.w + 0.1, h + 0.1, 0.1, 0.05), mat.white(0.3), 0, 0, 0);
      const face = plane(pics[0], s.w, h, 0.07);
      face.position.z = 0.052;
      (face.material as THREE.MeshBasicMaterial).polygonOffset = true;
      (face.material as THREE.MeshBasicMaterial).polygonOffsetFactor = -2;
      (face.material as THREE.MeshBasicMaterial).polygonOffsetUnits = -2;
      g.add(face);
      const handle: ScreenHandle = { mesh: face, mat: face.material as THREE.MeshBasicMaterial, w: s.w, h, parent: g };
      g.position.set(s.x, s.y, s.z);
      g.rotation.y = s.yaw;
      group.add(g);
      group.add(shadow(env, s.w * 1.15, h * 0.9, 0.2, s.x, s.z + 0.6));
      return { g, h, s, fade: screenFader(handle, pics, [0.55]) };
    }),
  );

  const tags = [marker(wins[0].g, -SPECS[0].w / 2 + 0.2, wins[0].h / 2 - 0.2, 0.1), marker(wins[2].g, SPECS[2].w / 2 - 0.2, wins[2].h / 2 - 0.2, 0.1)];
  const model: Model = {
    group,
    tags,
    camera: { az: [-0.32, 0.2], elev: [0.2, 0.15] },
    floorY: 0,
    set(_a, _l, p) {
      const open = smooth(Math.min(1, p / 0.6));
      wins.forEach((w, i) => {
        w.g.position.z = SPECS[i].z + lerp(0.5, -0.1, open) * (i - 1) * -1;
        w.g.position.y = SPECS[i].y + Math.sin(p * Math.PI * 2 + i * 1.3) * 0.05;
        w.fade(p + i * 0.04);
      });
    },
    frame: () => ({ cx: 0.4, cy: 2.4, hw: 4.2, hh: 2.6 }),
  };
  model.set(1, 1, 0);
  return model;
};

export default build;
