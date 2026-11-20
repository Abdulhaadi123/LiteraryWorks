import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

/** The sharpest the picture is ever drawn: a retina screen gets 1.75, never four times the pixels of a large one. */
const MAX_PIXEL_RATIO = 1.75;

/**
 * One renderer and one canvas for the whole site. Every pinned scene draws with it, so the browser holds a single
 * WebGL context, the studio lighting is built once and compiled shaders are reused from scene to scene. The
 * canvas simply moves into whichever scene's stage is on screen (`attach`).
 */
export interface GL {
  renderer: THREE.WebGLRenderer;
  canvas: HTMLCanvasElement;
  /** Soft studio reflections, shared by every scene. */
  env: THREE.Texture;
  size: { w: number; h: number };
  /** Pixels drawn per CSS pixel right now (it can be lowered, see `setRatio`). */
  readonly ratio: number;
  /** True while the browser has taken the graphics context away. */
  readonly lost: boolean;
  /** Puts the canvas into this stage (and takes it out of the previous one). */
  attach(host: HTMLElement): void;
  /** Takes the canvas out of `host` if it is in there. */
  detach(host: HTMLElement): void;
  resize(w: number, h: number): void;
  /** Draws with another pixel ratio (never above the screen's own, never below 1). */
  setRatio(ratio: number): void;
}

let shared: GL | null = null;

export function getGL(): GL {
  if (shared) return shared;
  const canvas = document.createElement("canvas");
  canvas.className = "xp-gl";
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // a neutral curve that keeps whites white and blues blue (ACES would grey them)
  renderer.toneMapping = THREE.NeutralToneMapping;

  // a neutral studio: soft light on every surface without loading any image
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  pmrem.dispose();

  const size = { w: 1, h: 1 };
  // the screen's own ratio (it changes when the visitor zooms the page) and the ratio in use (it may have been lowered)
  let cap = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  let ratio = cap;
  let lost = false;
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    lost = true;
  });
  canvas.addEventListener("webglcontextrestored", () => {
    lost = false;
  });

  shared = {
    renderer,
    canvas,
    env,
    size,
    get ratio() {
      return ratio;
    },
    get lost() {
      return lost;
    },
    attach(host) {
      if (canvas.parentElement !== host) host.prepend(canvas);
    },
    detach(host) {
      if (canvas.parentElement === host) canvas.remove();
    },
    resize(w, h) {
      const screen = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      if (screen !== cap) {
        ratio = ratio >= cap ? screen : Math.min(ratio, screen);
        cap = screen;
      }
      const nw = Math.max(1, Math.round(w));
      const nh = Math.max(1, Math.round(h));
      if (nw === size.w && nh === size.h && renderer.getPixelRatio() === ratio) return;
      size.w = nw;
      size.h = nh;
      renderer.setPixelRatio(ratio);
      renderer.setSize(nw, nh, false);
    },
    setRatio(r) {
      ratio = Math.max(1, Math.min(r, cap));
      renderer.setPixelRatio(ratio);
      renderer.setSize(size.w, size.h, false);
    },
  };
  return shared;
}
