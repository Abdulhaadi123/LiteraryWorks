import type gsapCore from "gsap";
import type { ScrollTrigger as ScrollTriggerClass } from "gsap/ScrollTrigger";

/**
 * GSAP + ScrollTrigger, fetched only where the animation engine runs: wide screens with motion (the head script
 * sets html.motion). Phones, tablets and visitors who prefer reduced motion never download or run them.
 *
 * `gsap` and `ScrollTrigger` are live bindings: they hold the real thing once `loadMotion()` has finished
 * (`motionReady()` says when) and an inert stand-in before that, so a call that arrives early does nothing
 * instead of breaking the page.
 */
export type Gsap = typeof gsapCore;
export type ScrollTriggerStatic = typeof ScrollTriggerClass;

/** True when the page runs with motion: the head script sets html.motion on wide screens unless reduced motion is on. */
export const motionOn = (): boolean =>
  typeof document !== "undefined" && document.documentElement.classList.contains("motion");

/**
 * Pacing of the pinned scenes. A scrubbed timeline that follows the scroll 1:1 is over in a blink when someone
 * scrolls fast, so the playhead takes SCRUB seconds to catch up: short, so the picture keeps up with the hand.
 */
export const SCRUB = 0.6;

/**
 * Where a pinned scene's stage sticks, as a scroll position. Never before the top of the page, so a scene that
 * starts the page (the hero) begins at progress 0 instead of already being 72px in.
 */
export const runwayStart = (section: HTMLElement, top: number) => () =>
  Math.max(0, section.getBoundingClientRect().top + window.scrollY - top);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const inert: any = new Proxy(function () {}, {
  get: () => inert,
  apply: () => inert,
  construct: () => inert,
});

export let gsap: Gsap = inert;
export let ScrollTrigger: ScrollTriggerStatic = inert;

let loaded = false;
const listeners = new Set<() => void>();
/** True once GSAP and ScrollTrigger have been fetched and registered. */
export const motionReady = (): boolean => loaded;
export const subscribeMotion = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

let loading: Promise<boolean> | undefined;
/** Fetches the engine (once) where motion is on; resolves false at once everywhere else. */
export function loadMotion(): Promise<boolean> {
  if (!motionOn()) return Promise.resolve(false);
  loading ??= Promise.all([import("gsap"), import("gsap/ScrollTrigger")])
    .then(([core, trigger]) => {
      gsap = core.gsap;
      ScrollTrigger = trigger.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);
      // phone toolbars growing and shrinking must not re-measure every pinned section
      ScrollTrigger.config({ ignoreMobileResize: true });
      loaded = true;
      listeners.forEach((fn) => fn());
      return true;
    })
    .catch(() => false); // motion simply stays off; the head script's watchdog removes html.motion
  return loading;
}

// Start fetching as soon as this module runs (in parallel with the rest of the page's script). Last on purpose:
// `loadMotion` needs `motionOn` and `loading` to exist by now.
if (typeof window !== "undefined") void loadMotion();
