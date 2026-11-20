/**
 * The contract between `Stage3D` (the pinned section, the labels, the scroll) and a scene module
 * (`scenes/*.ts`, each loaded on demand so that three.js never reaches phones or the first paint).
 * `setProgress(p)` is a pure function of p: no accumulated state, so scrubbing forwards and backwards is exact.
 */

export type SceneName = "assembly";

/** A label that follows a point on the model. Plain data, so a server component can pass it down. */
export interface LabelSpec {
  /** Matches the scene's own anchor key. */
  key: string;
  label: string;
  note?: string;
  /** The label shows from this scroll progress on (0..1) and, when `to` is set, fades out again at `to`. */
  from: number;
  to?: number;
  tone?: "blue" | "green" | "navy";
}

export interface SceneCtx {
  canvas: HTMLCanvasElement;
  /** The label keys, in the order the page lists them. */
  keys: string[];
}

export interface SceneAnchor {
  /** CSS pixels from the canvas' top-left corner. */
  x: number;
  y: number;
  behind: boolean;
}

/** Where the model may stand, in CSS pixels from the canvas' left edge: the copy is on the left, the labels on the right. */
export interface SceneLayout {
  /** The model starts to the right of this (the edge of the copy, plus a gap). */
  left: number;
  /** ... and, while it is closed, ends before this. */
  right: number;
  /** ... and, while it is open and the labels are showing, ends before this (the labels' column). */
  rightOpen: number;
}

export interface SceneHandle {
  resize(width: number, height: number): void;
  layout(layout: SceneLayout): void;
  /** Scroll progress through the scene, 0..1 (already smoothed). */
  setProgress(p: number): void;
  /** Compiles the shaders before the first frame, without blocking the page. */
  warm(): Promise<void>;
  render(): void;
  /** Where the labels point, one per key, after the latest `setProgress`. */
  anchors(): SceneAnchor[];
  /** Steps the drawing resolution down (for a graphics card that cannot keep up). False when it cannot go lower. */
  lowerQuality(): boolean;
  /** What the last frame cost (draw calls, triangles, memory): for the `?stats` check. */
  stats(): Record<string, number>;
  dispose(): void;
}

/** A scene builds itself in steps and gives the browser a breath between them, so it may be asynchronous. */
export type SceneFactory = (ctx: SceneCtx) => SceneHandle | Promise<SceneHandle>;
