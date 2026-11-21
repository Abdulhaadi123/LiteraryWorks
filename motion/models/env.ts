import type * as THREE from "three";
import { loadImage } from "../kit";
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
  return {
    aniso,
    textures,
    rnd: rng(hash(seed)),
    image: (name) => picture(name.startsWith("/") ? `${name}.webp` : `/shots/${name}.webp`),
    async shot(name, w = 1024, h = 576) {
      const img = await picture(name.startsWith("/") ? `${name}.webp` : `/shots/${name}.webp`);
      const tex = img ? screenTexture(img, aniso, w, h) : placeholderScreen(aniso, w, h);
      textures.push(tex);
      // give the browser a breath between pictures, so building a scene is many short tasks, not one long one
      await new Promise((r) => setTimeout(r, 0));
      return tex;
    },
  };
}

/** Each model is its own chunk, fetched only by the page that shows it. */
export const modelLoaders: Record<string, () => Promise<{ default: ModelBuilder }>> = {
  devices: () => import("./hero"),
  report: () => import("./report"),
  scanner: () => import("./scanner"),
  blueprint: () => import("./blueprint"),
  call: () => import("./call"),
  hub: () => import("./hub"),
  product: () => import("./product"),
  headset: () => import("./headset"),
  dashboard: () => import("./dashboard"),
  warehouse: () => import("./warehouse"),
  browsers: () => import("./windows"),
  phones: () => import("./phones"),
  uikit: () => import("./uikit"),
  servers: () => import("./servers"),
  pipeline: () => import("./pipeline"),
  book: () => import("./book"),
};

/** The model each service shows first (the services deck passes the services' slugs). */
export const serviceModel: Record<string, string> = {
  "ai-automation": "scanner",
  "ai-voice-systems": "headset",
  "saas-platforms": "dashboard",
  "enterprise-software": "warehouse",
  "ai-web-apps": "browsers",
  "ai-mobile-apps": "phones",
  "ui-ux-design": "uikit",
  "cloud-devops": "servers",
  "construction-technology": "pipeline",
};

/** A model by its id: a model's name, a service's slug, or "book:<kind>" (a case's slug, "cases", "handbook" or "about"). */
export async function loadModel(id: string): Promise<ModelBuilder> {
  const [name, arg] = id.split(":");
  if (name === "book") return (await import("./book")).bookFor(arg ?? "cases");
  const load = modelLoaders[serviceModel[name] ?? name] ?? modelLoaders.devices;
  return (await load()).default;
}
