import { createAutoplay, type Autoplay } from "./autoplay";
import { getGL, type GL } from "./gl";
import { gsap, runwayStart, SCRUB } from "./gsap";
import { BEAT_MS, FIRST_BEAT_MS } from "./timing";
import type { LabelSpec, SceneData, SceneFactory, SceneHandle, SceneLayout, SceneName } from "./types";

/**
 * The runtime of a pinned 3D scene (the scroll, the labels, the progress track, the drawing quality). It is its own
 * chunk, fetched by Stage3D.tsx only where motion is on (or on a phone's live scene, html.live3d), so a phone's plain page
 * never downloads it. All scenes draw with one shared renderer: its canvas moves into whichever scene's stage is on screen.
 */

/** Each scene is its own chunk, fetched when its section is about to be reached (and never on phones). */
const loaders: Record<SceneName, () => Promise<{ default: SceneFactory }>> = {
  system: () => import("./scenes/system"),
  deck: () => import("./scenes/deck"),
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (t: number) => t * t * (3 - 2 * t);
const ric = (fn: () => void): number =>
  typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(fn, { timeout: 1500 }) : window.setTimeout(fn, 250);
const cic = (id: number) => (typeof window.cancelIdleCallback === "function" ? window.cancelIdleCallback(id) : window.clearTimeout(id));

/** The picture keeps this far from the window's edge... */
const EDGE = 32;
/** ... and on a very wide screen it stays within this width, centred, so it does not drift away from the copy. */
const MAX_CONTENT = 1680;
/** The floating header takes the top of the stage (5.5rem); the picture starts below it. */
const HEADER_CLEAR = 92;

export function mountStage(section: HTMLElement, host: HTMLElement, scene: SceneName, labels: LabelSpec[], data?: SceneData): () => void {
  const stageEl = section.querySelector<HTMLElement>(".xp-stage");
  if (!stageEl) return () => {};

  const query = new URLSearchParams(window.location.search);
  // a story that plays by itself (the home page's hero) is driven by a clock, not by the scroll
  const auto = section.hasAttribute("data-auto");
  // a phone or tablet has no scroll engine (GSAP): a scene that follows the scroll (the case studies' book) reads the scroll itself
  const native = !auto && !document.documentElement.classList.contains("motion");
  const items = Array.from(host.querySelectorAll<HTMLElement>("[data-xp-label]"));
  const lines = Array.from(host.querySelectorAll<SVGPolylineElement>("[data-xp-line]"));
  const dots = Array.from(host.querySelectorAll<SVGCircleElement>("[data-xp-dot]"));
  const phases = Array.from(section.querySelectorAll<HTMLElement>("[data-phase]")).map((el) => ({
    el,
    from: Number(el.dataset.from ?? 0),
    to: Number(el.dataset.to ?? 1),
  }));
  // the progress rail: a slim green line that fills as the scene plays (and, on a deck, counts the items)
  const rail = section.querySelector<HTMLElement>("[data-xp-rail]");
  const railFill = rail?.querySelector<HTMLElement>("[data-rail-fill]");
  const railDot = rail?.querySelector<HTMLElement>("[data-rail-dot]");
  const railCur = rail?.querySelector<HTMLElement>("[data-rail-cur]");
  const railTicks = Array.from(rail?.querySelectorAll<HTMLElement>("[data-rail-tick]") ?? []).map((el) => ({ el, at: Number(el.dataset.at ?? 0) }));
  const stageTop = Number.parseFloat(getComputedStyle(stageEl).top);
  const top = Number.isFinite(stageTop) ? stageTop : 0;

  const state = { p: 0 };
  let handle: SceneHandle | null = null;
  let disposed = false;
  let visible = false;
  let idleId = 0;
  let resizer: ResizeObserver | null = null;
  let pointerOff: (() => void) | undefined;
  let autoplay: Autoplay | null = null;
  // a story that plays by itself plays only while the hero is really on screen (the scene itself is drawn a little before
  // it comes into view, see `seen` below, but a story that runs while no one can see it is wasted work)
  let onScreen = true;
  let onScreenObserver: IntersectionObserver | null = null;
  // the pointer is tilting the camera (its own frame loop below runs)
  let tilting = false;

  const FADE = 0.04;

  /**
   * The copy beside the picture follows the same progress: each phase fades in just after `from` and out just
   * before `to`, one after the other, so two blocks of words are never on the screen at once. A short phase
   * (the items of a deck) fades faster, so most of it is spent fully visible.
   */
  const paintCopy = (p: number) => {
    for (const { el, from, to } of phases) {
      const h = Math.min(FADE, (to - from) * 0.24);
      const a = from <= 0 ? 1 : clamp01((p - from) / h);
      const b = to >= 1 ? 1 : clamp01((to - p) / h);
      const o = smooth(Math.min(a, b));
      el.style.opacity = String(o);
      el.style.transform = `translate3d(0, ${((1 - a) * 22 - (1 - b) * 22).toFixed(1)}px, 0)`;
      el.style.pointerEvents = o > 0.6 ? "auto" : "none";
    }
    if (railFill) railFill.style.transform = `scaleY(${p.toFixed(4)})`;
    if (railDot) railDot.style.top = `${(p * 100).toFixed(2)}%`;
    if (railTicks.length) {
      let k = 0;
      railTicks.forEach((t, i) => {
        const on = p >= t.at - 0.002;
        if (on) k = i + 1;
        t.el.classList.toggle("is-on", on);
      });
      if (railCur) railCur.textContent = String(Math.max(1, k)).padStart(2, "0");
    }
    section.classList.toggle("xp-started", p > 0.012);
  };

  /**
   * Where the picture may stand: to the right of the copy, inside the window. On a very wide window it stays
   * within MAX_CONTENT so it does not drift away from the copy.
   */
  let lay: SceneLayout = { left: 0, right: 0, top: 0, bottom: 0 };
  let tagW: number[] = [];
  const measure = () => {
    const w = host.clientWidth;
    // on a phone or tablet the picture has a block of its own (the live 3D, html.live3d): all of it is the stage
    if (window.matchMedia("(max-width: 63.99rem)").matches) {
      // (a little room at both sides: objects in perspective reach past the edges of their frame, and nothing may be cut off)
      lay = { left: w * 0.05, right: w * 0.95, top: 4, bottom: host.clientHeight - 4 };
      tagW = items.map((li) => li.offsetWidth || 160);
      return;
    }
    const right = Math.min(w - EDGE, (w + MAX_CONTENT) / 2);
    const copy = phases[0]?.el.getBoundingClientRect();
    const copyRight = copy && copy.width ? copy.right - host.getBoundingClientRect().left : w * 0.4;
    // below the floating header and as far from the bottom edge, so the picture is centred on the copy beside it
    lay = { left: copyRight + 24, right, top: HEADER_CLEAR, bottom: host.clientHeight - HEADER_CLEAR };
    tagW = items.map((li) => li.offsetWidth || 160);
  };

  /**
   * A tag for each part of the picture: a small pill with a leader line to its anchor, up and to the right of it
   * (to the left where there is no room), nudged apart where two would collide.
   */
  const TAG_H = 30;
  const placeLabels = () => {
    if (!handle || !items.length) return;
    const A = handle.anchors();
    const w = host.clientWidth;
    const h = host.clientHeight;
    const p = state.p;
    const px: number[] = [];
    const py: number[] = [];
    const side: number[] = [];
    const shown: number[] = [];
    items.forEach((_, i) => {
      const l = labels[i];
      const a = A[i];
      if (!l || !a) return;
      const on = smooth(clamp01((p - l.from) / FADE)) * (l.to ? smooth(clamp01((l.to - p) / FADE)) : 1);
      const edge = Math.min(a.x, w - a.x, a.y, h - a.y);
      shown[i] = a.behind ? 0 : on * clamp01((edge - 4) / 48);
      const tw = tagW[i] ?? 160;
      side[i] = a.x + 30 + tw > w - 16 ? -1 : 1;
      px[i] = side[i] > 0 ? a.x + 28 : a.x - 28 - tw;
      py[i] = Math.min(h - TAG_H - 12, Math.max(12, a.y - 34));
    });
    // nudge apart: a later tag moves down when it would sit on an earlier one
    const order = items.map((_, i) => i).filter((i) => shown[i] > 0.02).sort((a, b) => py[a] - py[b]);
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < order.length; i++) {
        for (let j = i + 1; j < order.length; j++) {
          const a = order[i];
          const b = order[j];
          const overlapX = px[a] < px[b] + (tagW[b] ?? 160) + 8 && px[b] < px[a] + (tagW[a] ?? 160) + 8;
          if (overlapX && Math.abs(py[b] - py[a]) < TAG_H + 6) py[b] = py[a] + TAG_H + 6;
        }
      }
    }
    items.forEach((li, i) => {
      const a = A[i];
      if (!a || shown[i] === undefined) return;
      const show = shown[i];
      li.style.opacity = show.toFixed(3);
      li.style.transform = `translate3d(${px[i].toFixed(1)}px, ${(py[i] + (1 - show) * 6).toFixed(1)}px, 0)`;
      const ay = py[i] + TAG_H / 2;
      const ex = side[i] > 0 ? px[i] : px[i] + (tagW[i] ?? 160);
      const ln = lines[i];
      if (ln) {
        ln.setAttribute("points", `${a.x.toFixed(1)},${a.y.toFixed(1)} ${(a.x + side[i] * 12).toFixed(1)},${ay.toFixed(1)} ${ex.toFixed(1)},${ay.toFixed(1)}`);
        ln.style.strokeDashoffset = String(1 - show);
        ln.style.opacity = show > 0.02 ? "1" : "0";
      }
      const dt = dots[i];
      if (dt) {
        dt.setAttribute("cx", a.x.toFixed(1));
        dt.setAttribute("cy", a.y.toFixed(1));
        dt.setAttribute("r", (3.4 * show).toFixed(2));
      }
    });
  };

  const draw = () => {
    if (!handle || !visible) return;
    // the scene that is drawing owns the one canvas: take it back if another scene's late start moved it away
    if (gl && gl.canvas.parentElement !== host) {
      attach(true);
      return;
    }
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

  /**
   * Without GSAP (a phone or tablet): the scroll position of the runway is the scene's progress, and the playhead follows it
   * with a short lag, like the desktop's scrub, so a flick still plays out. Nothing runs while the section is far from the screen.
   */
  const followScroll = (): (() => void) => {
    let target = 0;
    let raf = 0;
    let last = 0;
    const read = () => {
      const r = section.getBoundingClientRect();
      const run = r.height - stageEl.offsetHeight;
      target = run > 0 ? clamp01(-r.top / run) : 0;
    };
    const step = (now: number) => {
      raf = 0;
      read();
      const dt = Math.min(64, last ? now - last : 16);
      last = now;
      state.p += (target - state.p) * (1 - Math.exp(-dt / (SCRUB * 300)));
      if (Math.abs(target - state.p) < 0.0004) {
        state.p = target;
        last = 0;
      } else raf = requestAnimationFrame(step);
      onProgress();
    };
    const kick = () => {
      if (raf) return;
      const r = section.getBoundingClientRect();
      if (r.bottom < -window.innerHeight || r.top > 2 * window.innerHeight) return;
      raf = requestAnimationFrame(step);
    };
    read();
    state.p = target;
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", kick);
    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", kick);
      if (raf) cancelAnimationFrame(raf);
    };
  };

  // the scroll drives `state.p`; the playhead follows it with a lag (SCRUB), so a flick still plays out
  // (a story that plays by itself has no runway to scroll through: motion/autoplay.ts drives it instead)
  const unfollow = native ? followScroll() : undefined;
  const tween = auto || native
    ? null
    : gsap.to(state, {
        p: 1,
        ease: "none",
        onUpdate: onProgress,
        scrollTrigger: { trigger: section, start: runwayStart(section, top), end: "bottom bottom", scrub: SCRUB, invalidateOnRefresh: true },
      });
  if (!auto) paintCopy(state.p);

  /** No WebGL, or the scene would not load: step aside, the plain static section takes over. */
  const fail = () => {
    tween?.scrollTrigger?.kill();
    tween?.kill();
    unfollow?.();
    autoplay?.dispose();
    autoplay = null;
    for (const { el } of phases) {
      el.style.opacity = "";
      el.style.transform = "";
      el.style.pointerEvents = "";
    }
    pointerOff?.();
    section.classList.remove("xp-live", "xp-started");
    section.classList.add("xp-failed");
  };

  /** The pointer over the picture tilts the camera a few degrees: the picture follows the hand, gently. */
  if (window.matchMedia("(pointer: fine)").matches && !query.has("still")) {
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let raf = 0;
    const step = () => {
      raf = 0;
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      if (handle && visible) {
        handle.setPointer(cx, cy);
        // (a story that is playing draws a frame anyway, with the new tilt)
        if (!autoplay?.running()) draw();
      }
      if (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.003) raf = requestAnimationFrame(step);
      else tilting = false;
    };
    const move = (e: PointerEvent) => {
      const r = stageEl.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      tilting = true;
      if (!raf) raf = requestAnimationFrame(step);
    };
    const leave = () => {
      tx = 0;
      ty = 0;
      tilting = true;
      if (!raf) raf = requestAnimationFrame(step);
    };
    stageEl.addEventListener("pointermove", move, { passive: true });
    stageEl.addEventListener("pointerleave", leave);
    pointerOff = () => {
      stageEl.removeEventListener("pointermove", move);
      stageEl.removeEventListener("pointerleave", leave);
      if (raf) cancelAnimationFrame(raf);
    };
  }

  /** The shared canvas moves into this stage while it is on screen (and out when it is not). The renderer is made when the scene starts, not before. */
  let gl: GL | null = null;
  const attach = (on: boolean) => {
    if (!handle || !gl) return;
    if (on) {
      gl.attach(host);
      handle.resize(host.clientWidth, host.clientHeight);
      measure();
      handle.layout(lay);
      draw();
    } else gl.detach(host);
  };

  const start = async () => {
    try {
      const mod = await loaders[scene]();
      if (disposed) return;
      const t0 = performance.now();
      gl = getGL();
      const built = await mod.default({ gl, keys: labels.map((l) => l.key), data, invalidate: () => draw() });
      // the page may have moved on while the model was being built: give the graphics memory back at once
      if (disposed) {
        built.dispose();
        return;
      }
      handle = built;
      const t1 = performance.now();
      // shaders compile in parallel, off the main thread, before the first frame is drawn
      await built.warm();
      if (query.has("stats")) console.info("[lw3d]", scene, "built in", Math.round(t1 - t0), "ms; shaders ready after", Math.round(performance.now() - t1), "ms");
      if (disposed) return;
      resizer = new ResizeObserver(() => {
        if (!visible) return;
        built.resize(host.clientWidth, host.clientHeight);
        measure();
        built.layout(lay);
        draw();
      });
      resizer.observe(host);
      // `?stats` (a check for developers): what a frame costs, read with window.__lw3d() after scrolling
      if (query.has("stats")) (window as unknown as { __lw3d?: () => Record<string, number> | undefined }).__lw3d = () => handle?.stats();
      if (visible) attach(true);
      section.classList.add("xp-live");
      if (auto) {
        if (query.has("still")) {
          // (a developer switch: the stills are made at an exact progress, see scripts/make-posters.mjs)
          (window as unknown as { __lwSeek?: (p: number) => void }).__lwSeek = (p) => {
            state.p = p;
            draw();
          };
        } else {
          const beat = Number(query.get("beat"));
          const custom = beat >= 600 && beat <= 60000;
          // (a page may set its own pace in its scene data: the services page's beats are a second longer)
          const beatMs = custom ? beat : (data?.beatMs ?? BEAT_MS);
          autoplay = createAutoplay({
            section,
            at: phases.map((ph) => ph.from),
            show: (p) => {
              state.p = p;
              adapt();
              draw();
            },
            ready: (k) => handle?.ready?.(k) ?? true,
            visible: () => visible && onScreen,
            busy: () => tilting,
            beatMs,
            firstMs: custom || data?.firstMs === undefined ? (FIRST_BEAT_MS / BEAT_MS) * beatMs : data.firstMs,
          });
          autoplay.start();
        }
      }
    } catch {
      if (!disposed) fail();
    }
  };

  // about a screen and a half before it is reached, when the browser is idle; but a scene already on screen (the top of
  // a page) starts right after the first paint, so its picture arrives with the copy beside it without delaying the page
  const near = new IntersectionObserver(
    (entries) => {
      const e = entries.find((x) => x.isIntersecting);
      if (!e) return;
      near.disconnect();
      const onScreen = e.boundingClientRect.top < window.innerHeight && e.boundingClientRect.bottom > 0;
      if (!document.documentElement.classList.contains("motion")) {
        // a phone or tablet (the live 3D, html.live3d): the page's own load comes first, then the scene starts when the browser is idle
        const later = () => {
          if (!disposed) idleId = ric(() => void start());
        };
        if (document.readyState === "complete") later();
        else window.addEventListener("load", later, { once: true });
      } else if (onScreen) requestAnimationFrame(() => window.setTimeout(() => void start(), 0));
      else idleId = ric(() => void start());
    },
    { rootMargin: "160% 0px" },
  );
  near.observe(section);

  // draw only while the section is on screen
  const seen = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting);
      attach(visible);
      autoplay?.wake();
    },
    { rootMargin: "8% 0px" },
  );
  seen.observe(section);
  if (auto) {
    onScreenObserver = new IntersectionObserver(
      (entries) => {
        // (a section whose edge only touches the window's counts as off screen: at least 2% of it must show)
        onScreen = entries.some((e) => e.intersectionRatio >= 0.02);
        autoplay?.wake();
      },
      { threshold: [0, 0.02] },
    );
    onScreenObserver.observe(section);
  }

  return () => {
    disposed = true;
    near.disconnect();
    seen.disconnect();
    onScreenObserver?.disconnect();
    cic(idleId);
    resizer?.disconnect();
    tween?.scrollTrigger?.kill();
    tween?.kill();
    unfollow?.();
    autoplay?.dispose();
    autoplay = null;
    delete (window as unknown as { __lwSeek?: unknown }).__lwSeek;
    pointerOff?.();
    gl?.detach(host);
    handle?.dispose();
    handle = null;
    section.classList.remove("xp-live", "xp-started");
  };
}
