import { gsap, runwayStart, SCRUB } from "./gsap";
import type { LabelSpec, SceneFactory, SceneHandle, SceneName } from "./types";

/**
 * The runtime of a pinned 3D scene (the scroll, the labels, the progress track, the reticle, the drawing quality).
 * It is its own chunk, fetched by Stage3D.tsx only where motion is on, so phones and tablets never download it.
 */

/** Each scene is its own chunk, fetched when its section is about to be reached (and never on phones). */
const loaders: Record<SceneName, () => Promise<{ default: SceneFactory }>> = {
  assembly: () => import("./scenes/assembly"),
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (t: number) => t * t * (3 - 2 * t);
const ric = (fn: () => void): number =>
  typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(fn, { timeout: 1500 }) : window.setTimeout(fn, 250);
const cic = (id: number) => (typeof window.cancelIdleCallback === "function" ? window.cancelIdleCallback(id) : window.clearTimeout(id));

/** Width of the label column: 200 px, a little narrower on a narrow window (the CSS reads it from --xp-col). */
const colWidth = (w: number) => Math.max(160, Math.min(200, Math.round(w * 0.15)));
/** The labels keep this far from the window's edge... */
const EDGE = 32;
/** ... and on a very wide screen the picture stays within this width, centred, so the labels do not drift away from the model. */
const MAX_CONTENT = 1680;

export function mountStage(section: HTMLElement, host: HTMLElement, scene: SceneName, labels: LabelSpec[]): () => void {
  const canvas = host.querySelector<HTMLCanvasElement>("canvas.xp-gl");
  const stageEl = section.querySelector<HTMLElement>(".xp-stage");
  if (!canvas || !stageEl) return () => {};

  const query = new URLSearchParams(window.location.search);
  const items = Array.from(host.querySelectorAll<HTMLElement>("[data-xp-label]"));
  const lines = Array.from(host.querySelectorAll<SVGPolylineElement>("[data-xp-line]"));
  const dots = Array.from(host.querySelectorAll<SVGCircleElement>("[data-xp-dot]"));
  const phases = Array.from(section.querySelectorAll<HTMLElement>("[data-phase]")).map((el) => ({
    el,
    from: Number(el.dataset.from ?? 0),
    to: Number(el.dataset.to ?? 1),
    ch: Number(el.dataset.ch ?? 0),
  }));
  // the progress track: a ruler that fills as the scene plays, with the current chapter's number beside it
  const track = section.querySelector<HTMLElement>("[data-xp-track]");
  const trackFill = track?.querySelector<HTMLElement>("i");
  const trackNum = track?.querySelector<HTMLElement>("b");
  const stageTop = Number.parseFloat(getComputedStyle(stageEl).top);
  const top = Number.isFinite(stageTop) ? stageTop : 0;

  const state = { p: 0 };
  let chapter = -1;
  let cursorOff: (() => void) | undefined;
  let handle: SceneHandle | null = null;
  let disposed = false;
  let visible = false;
  let idleId = 0;
  let resizer: ResizeObserver | null = null;

  const FADE = 0.04;

  /** The copy beside the picture follows the same progress: each phase fades in at `from` and out at `to`. */
  const paintCopy = (p: number) => {
    for (const { el, from, to } of phases) {
      const a = from <= 0 ? 1 : clamp01((p - from) / FADE);
      const b = to >= 1 ? 1 : clamp01((to - p) / FADE);
      const o = smooth(Math.min(a, b));
      el.style.opacity = String(o);
      el.style.transform = `translate3d(0, ${((1 - a) * 22 - (1 - b) * 22).toFixed(1)}px, 0)`;
      el.style.pointerEvents = o > 0.6 ? "auto" : "none";
    }
    if (trackFill) trackFill.style.transform = `scaleY(${p.toFixed(4)})`;
    if (track) track.style.setProperty("--p", p.toFixed(4));
    if (trackNum) {
      const now = phases.find((ph) => ph.ch > 0 && p >= ph.from && p < ph.to)?.ch ?? 0;
      if (now !== chapter) {
        chapter = now;
        trackNum.textContent = now ? String(now).padStart(2, "0") : "";
        trackNum.classList.toggle("is-on", now > 0);
      }
    }
    section.classList.toggle("xp-started", p > 0.012);
  };

  /**
   * Where things stand on this screen: the copy is on the left, the labels in a column on the right, and the model
   * between them. On a very wide window the column stays within MAX_CONTENT so it does not drift away from the model.
   */
  let lay = { colX: 0, left: 0, right: 0, rightOpen: 0 };
  const measure = () => {
    const w = host.clientWidth;
    const col = colWidth(w);
    host.style.setProperty("--xp-col", `${col}px`);
    const right = Math.min(w - EDGE, (w + MAX_CONTENT) / 2);
    const colX = right - col;
    const copy = phases[0]?.el.getBoundingClientRect();
    const copyRight = copy && copy.width ? copy.right - host.getBoundingClientRect().left : w * 0.4;
    lay = { colX, left: copyRight + 36, right: right - 28, rightOpen: colX - 32 };
  };

  /** Labels sit in one column on the right, in the order of their anchors, spaced so they never overlap. */
  const placeLabels = () => {
    if (!handle) return;
    const A = handle.anchors();
    const w = host.clientWidth;
    const h = host.clientHeight;
    const p = state.p;
    const colX = lay.colX;
    const gap = 58;
    const ly: number[] = [];
    const order = A.map((_, i) => i).sort((a, b) => A[a].y - A[b].y);
    let prev = 30 - gap;
    order.forEach((i) => {
      prev = Math.max(A[i].y, prev + gap);
      ly[i] = prev;
    });
    let next = h - 30 + gap;
    [...order].reverse().forEach((i) => {
      next = Math.min(ly[i], next - gap);
      ly[i] = next;
    });
    items.forEach((li, i) => {
      const l = labels[i];
      const a = A[i];
      if (!l || !a) return;
      const on = smooth(clamp01((p - l.from) / FADE)) * (l.to ? smooth(clamp01((l.to - p) / FADE)) : 1);
      // a label fades out while the thing it points at nears the edge of the picture
      const edge = Math.min(a.x, w - a.x, a.y, h - a.y);
      const show = a.behind ? 0 : on * clamp01((edge - 4) / 56);
      const y = ly[i];
      li.style.opacity = show.toFixed(3);
      li.style.transform = `translate3d(${colX}px, ${(y - 14 + (1 - show) * 6).toFixed(1)}px, 0)`;
      const endX = colX - 12;
      const bendX = endX - 34;
      const ln = lines[i];
      if (ln) {
        ln.setAttribute("points", `${a.x.toFixed(1)},${a.y.toFixed(1)} ${bendX.toFixed(1)},${y.toFixed(1)} ${endX.toFixed(1)},${y.toFixed(1)}`);
        ln.style.strokeDashoffset = String(1 - show);
        ln.style.opacity = show > 0.02 ? "1" : "0";
      }
      const dt = dots[i];
      if (dt) {
        dt.setAttribute("cx", a.x.toFixed(1));
        dt.setAttribute("cy", a.y.toFixed(1));
        dt.setAttribute("r", (3.6 * show).toFixed(2));
      }
    });
  };

  const draw = () => {
    if (!handle || !visible) return;
    handle.setProgress(state.p);
    handle.render();
    placeLabels();
  };

  /**
   * The picture is drawn at the screen's pixel ratio. If the graphics card cannot keep up while the page is being
   * scrolled (ten frames in a row slower than about 28 a second), it steps down a quarter at a time, to a ratio of
   * 1. A gap of more than 130 ms is a pause in the scrolling, not a slow frame, and the first frames are ignored.
   * (Not when the page is making still pictures: `?still`.)
   */
  let lastFrame = 0;
  let frames = 0;
  let slow = 0;
  const adapt = () => {
    if (!handle || query.has("still")) return;
    const now = performance.now();
    const dt = now - lastFrame;
    lastFrame = now;
    if (dt > 130 || dt <= 0) {
      slow = 0;
      return;
    }
    if (++frames < 20) return;
    slow = dt > 36 ? slow + 1 : Math.max(0, slow - 2);
    if (slow >= 10) {
      slow = 0;
      handle.lowerQuality();
    }
  };

  const onProgress = () => {
    paintCopy(state.p);
    adapt();
    draw();
  };

  // the scroll drives `state.p`; the playhead follows it with a lag (SCRUB), so a flick still plays out
  const tween = gsap.to(state, {
    p: 1,
    ease: "none",
    onUpdate: onProgress,
    scrollTrigger: { trigger: section, start: runwayStart(section, top), end: "bottom bottom", scrub: SCRUB, invalidateOnRefresh: true },
  });
  paintCopy(0);

  /** No WebGL, or the scene would not load: step aside, the plain static section takes over. */
  const fail = () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    for (const { el } of phases) {
      el.style.opacity = "";
      el.style.transform = "";
      el.style.pointerEvents = "";
    }
    if (trackFill) trackFill.style.transform = "";
    track?.style.removeProperty("--p");
    cursorOff?.();
    section.classList.remove("xp-live", "xp-started");
    section.classList.add("xp-failed");
  };

  /** A fine reticle that follows the pointer over the model; it steps aside over the copy and the buttons. */
  const cursor = section.querySelector<HTMLElement>("[data-xp-cursor]");
  if (cursor && window.matchMedia("(pointer: fine)").matches) {
    let cx = 0;
    let cy = 0;
    let raf = 0;
    const paint = () => {
      raf = 0;
      cursor.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
    };
    const move = (e: PointerEvent) => {
      const r = stageEl.getBoundingClientRect();
      cx = e.clientX - r.left;
      cy = e.clientY - r.top;
      cursor.classList.toggle("is-on", !(e.target as Element | null)?.closest("a, button, .xp-phase"));
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const leave = () => cursor.classList.remove("is-on");
    stageEl.addEventListener("pointermove", move, { passive: true });
    stageEl.addEventListener("pointerleave", leave);
    cursorOff = () => {
      stageEl.removeEventListener("pointermove", move);
      stageEl.removeEventListener("pointerleave", leave);
      if (raf) cancelAnimationFrame(raf);
      cursor.classList.remove("is-on");
    };
  }

  const start = async () => {
    try {
      const mod = await loaders[scene]();
      if (disposed) return;
      const t0 = performance.now();
      const built = await mod.default({ canvas, keys: labels.map((l) => l.key) });
      // the page may have moved on while the model was being built: give the graphics memory back at once
      if (disposed) {
        built.dispose();
        return;
      }
      handle = built;
      const t1 = performance.now();
      // shaders compile in parallel, off the main thread, before the first frame is drawn
      await built.warm();
      if (query.has("stats")) console.info("[lw3d] model built in", Math.round(t1 - t0), "ms; shaders ready after", Math.round(performance.now() - t1), "ms");
      if (disposed) return;
      built.resize(host.clientWidth, host.clientHeight);
      measure();
      built.layout(lay);
      resizer = new ResizeObserver(() => {
        built.resize(host.clientWidth, host.clientHeight);
        measure();
        built.layout(lay);
        draw();
      });
      resizer.observe(host);
      // `?stats` (a check for developers): what a frame costs, read with window.__lw3d() after scrolling
      if (query.has("stats")) (window as unknown as { __lw3d?: () => Record<string, number> | undefined }).__lw3d = () => handle?.stats();
      draw();
      section.classList.add("xp-live");
    } catch {
      if (!disposed) fail();
    }
  };

  // about a screen and a half before it is reached; starts when the browser is idle, so the page's own first
  // paint and hydration never wait for it
  const near = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        near.disconnect();
        idleId = ric(() => void start());
      }
    },
    { rootMargin: "160% 0px" },
  );
  near.observe(section);

  // draw only while the section is on screen
  const seen = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting);
      if (visible) draw();
    },
    { rootMargin: "8% 0px" },
  );
  seen.observe(section);

  return () => {
    disposed = true;
    near.disconnect();
    seen.disconnect();
    cic(idleId);
    resizer?.disconnect();
    tween.scrollTrigger?.kill();
    tween.kill();
    cursorOff?.();
    handle?.dispose();
    handle = null;
    section.classList.remove("xp-live", "xp-started");
  };
}
