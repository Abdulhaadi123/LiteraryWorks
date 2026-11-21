import type * as THREE from "three";

/**
 * A model is one kind of 3D animation: a self-contained thing built from code (a pipeline of cards, a ring of sound
 * bars, a stack of layers, a globe, a building going up ...) with our own projects shown on its screens. A page's scene
 * (`scenes/system.ts`) and the services deck (`scenes/deck.ts`) both host models; each service has its own.
 * `set` is a pure function of its arguments, so scrubbing the page forwards and backwards is exact.
 */

/** The box the model fills right now, in the model's own units: the camera frames it. */
export interface Frame {
  cx: number;
  cy: number;
  hw: number;
  hh: number;
}

export interface Model {
  group: THREE.Group;
  /**
   * Poses everything. `a`: how built it is (0 loose, 1 built). `l`: how much it is running (0 still, 1 live). `p`: the
   * page's scroll progress (0..1), for motion that simply follows the scroll (turning, flowing).
   */
  set(a: number, l: number, p: number): void;
  /** The box it fills after the latest `set`. */
  frame(): Frame;
  /** The points the tags follow, in the order of the page's tags (lib/scenes.ts). */
  tags: THREE.Object3D[];
  /** How the camera moves round it: azimuth and elevation (radians) at the start and the end. Defaults suit most models. */
  camera?: { az: [number, number]; elev: [number, number] };
  /** Draws a soft ground under it (most models float or stand on nothing). */
  ground?: boolean;
  /** Where the middle of its ground is, in its own units (default: under the frame's middle). */
  floorY?: number;
  /** False when the model keeps its own frame up to date as it opens (the camera frames what the model reports, not what it measures). */
  fit?: boolean;
  /** More states (`a`, `l`, `p`) the model passes through that the frame must hold, beside the usual ones (a peak that the usual ones miss). */
  fitStates?: [number, number, number][];
  /** Frees what it made (geometries and materials are freed with the scene; textures through `env.textures`). */
  dispose?(): void;
}

export interface ModelEnv {
  aniso: number;
  /** Everything pushed here is freed with the scene. */
  textures: THREE.Texture[];
  /** A seeded random generator: the same on every visit and every scrub. */
  rnd: () => number;
  /** The soft shadow that sits behind a floating panel. */
  shadow: THREE.Texture;
  /** One of our own project pictures as it is (null if it cannot be fetched), for a model that draws it into something else. */
  image(name: string): Promise<HTMLImageElement | null>;
  /** A screen texture from one of our own project pictures (public/shots/<name>.webp; a leading "/" is a full path); a branded placeholder if it cannot load. */
  shot(name: string, w?: number, h?: number): Promise<THREE.Texture>;
}

/** Builds a model. `mini` is a smaller, lighter version for the deck, where nine are on the drum at once. */
export type ModelBuilder = (env: ModelEnv, mini: boolean) => Promise<Model>;
