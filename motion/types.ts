/**
 * The contract between the pinned section (`mountStage`: the scroll, the labels, the progress track) and a scene
 * module (`scenes/*.ts`, each loaded on demand so that three.js never reaches phones or the first paint).
 * `setProgress(p)` is a pure function of p: no accumulated state, so scrubbing forwards and backwards is exact.
 */

import type { GL } from "./gl";

export type SceneName = "system" | "deck";

/** The devices our work runs on, which the scenes show with our own projects on their screens. */
export type DeviceType = "phone" | "laptop" | "tablet" | "monitor";

/** What a page tells its scene: which variant to draw and the words to put on it. Plain data, so a server component can pass it. */
export interface SceneData {
  /** Which picture the scene draws: "hero", "audit" or a service slug ("system"); "services" or "cases" ("deck"). */
  variant: string;
  title?: string;
  items?: { id: string; title: string; note?: string; tags?: string[]; stats?: { value: string; label: string }[] }[];
  /** For a deck: where in the scroll each item takes over (the first is 0); by default after a short intro, evenly. */
  at?: number[];
  /**
   * For a deck that plays by itself: after the last item the camera comes round to the first again, over the end of the
   * range (progress 1 to 1 + LOOP_TAIL in motion/timing.ts), so the story can start over without a cut.
   */
  loop?: boolean;
  /** For a deck that plays by itself: how long each beat lasts, and the first one, in ms (default: motion/timing.ts). */
  beatMs?: number;
  firstMs?: number;
}

/** A tag that follows a panel of the model. */
export interface LabelSpec {
  /** Matches the scene's own anchor key. */
  key: string;
  label: string;
  /** A second, smaller line under the label. */
  note?: string;
  tone?: "blue" | "navy";
  /** The label shows from this scroll progress on (0..1) and, when `to` is set, fades out again at `to`. */
  from: number;
  to?: number;
}

export interface SceneCtx {
  gl: GL;
  /** The label keys, in the order the page lists them. */
  keys: string[];
  data?: SceneData;
  /** Asks for a new frame (a scene that finishes building parts of itself later calls it). */
  invalidate?: () => void;
}

export interface SceneAnchor {
  /** CSS pixels from the canvas' top-left corner. */
  x: number;
  y: number;
  behind: boolean;
}

/** Where the model may stand, in CSS pixels from the canvas' left edge: the copy is on the left. */
export interface SceneLayout {
  /** The model starts to the right of this (the edge of the copy, plus a gap). */
  left: number;
  /** ... and ends before this. */
  right: number;
  /** The model stays below this (the floating header) ... */
  top: number;
  /** ... and above this. */
  bottom: number;
}

export interface SceneHandle {
  resize(width: number, height: number): void;
  layout(layout: SceneLayout): void;
  /** Scroll progress through the scene, 0..1 (already smoothed). */
  setProgress(p: number): void;
  /** The pointer over the stage, -1..1 each way (a very small tilt of the camera). */
  setPointer(x: number, y: number): void;
  /** Compiles the shaders before the first frame, without blocking the page. */
  warm(): Promise<void>;
  render(): void;
  /** Where the labels point, one per key, after the latest `setProgress`. */
  anchors(): SceneAnchor[];
  /** Is the object for this place in the sequence built and its shaders compiled, so the camera may travel to it? (Absent: always.) */
  ready?(place: number): boolean;
  /** Steps the drawing resolution down (for a graphics card that cannot keep up). False when it cannot go lower. */
  lowerQuality(): boolean;
  /** What the last frame cost (draw calls, triangles, memory): for the `?stats` check. */
  stats(): Record<string, number>;
  dispose(): void;
}

/** A scene builds itself in steps and gives the browser a breath between them, so it may be asynchronous. */
export type SceneFactory = (ctx: SceneCtx) => SceneHandle | Promise<SceneHandle>;
