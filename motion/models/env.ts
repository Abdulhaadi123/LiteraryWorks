import type * as THREE from "three";
import { loadImage, rectShadowTexture } from "../kit";
import { placeholderScreen, screenTexture } from "../screens";
import type { ModelBuilder, ModelEnv } from "./types";

/** A small seeded random generator (mulberry32). */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const hash = (s: string) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

/** The pictures already asked for, so a page's models (or the deck's nine) never fetch one twice. */
const pictures = new Map<string, Promise<HTMLImageElement | null>>();
const picture = (url: string) => {
  let p = pictures.get(url);
  if (!p) {
    p = loadImage(url).catch(() => null);
    pictures.set(url, p);
  }
  return p;
};

export function createEnv(renderer: THREE.WebGLRenderer, seed: string): ModelEnv {
  const textures: THREE.Texture[] = [];
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const shadow = rectShadowTexture();
  textures.push(shadow);
  return {
    aniso,
    textures,
    rnd: rng(hash(seed)),
    shadow,
    async shot(name, w = 1024, h = 576) {
      const img = await picture(name.startsWith("/") ? `${name}.webp` : `/shots/${name}.webp`);
      const tex = img ? screenTexture(img, aniso, w, h) : placeholderScreen(aniso, w, h);
      textures.push(tex);
      return tex;
    },
  };
}

/** Each kind of model is its own chunk, fetched only by the page that shows it (and by the deck, which shows them all). */
export const modelLoaders: Record<string, () => Promise<{ default: ModelBuilder }>> = {
  hero: () => import("./core"),
  audit: () => import("./audit"),
  about: () => import("./journey"),
  "ai-automation": () => import("./flow"),
  "ai-voice-systems": () => import("./voice"),
  "saas-platforms": () => import("./layers"),
  "enterprise-software": () => import("./wall"),
  "ai-web-apps": () => import("./browser"),
  "ai-mobile-apps": () => import("./appui"),
  "ui-ux-design": () => import("./design"),
  "cloud-devops": () => import("./globe"),
  "construction-technology": () => import("./building"),
};
