"use client";

import type { gsap as GSAP } from "gsap";
import type { ScrollTrigger as ScrollTriggerType } from "gsap/ScrollTrigger";
import type LenisType from "lenis";

export let gsap: typeof GSAP | null = null;
export let ScrollTrigger: typeof ScrollTriggerType | null = null;
let lenis: LenisType | null = null;
let loading: Promise<void> | null = null;

export function motionOn(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains("motion") &&
    window.matchMedia("(min-width: 64rem) and (prefers-reduced-motion: no-preference)").matches;
}
export function motionReady(): boolean {
  return motionOn() && document.documentElement.classList.contains("motion-ready");
}

export async function loadMotion() {
  if (!motionOn()) return;
  if (!loading) {
    loading = (async () => {
      const [{ gsap: g }, { ScrollTrigger: st }, { default: Lenis }] = await Promise.all([
        import("gsap"), import("gsap/ScrollTrigger"), import("lenis")
      ]);
      if (!motionOn()) return;
      gsap = g;
      ScrollTrigger = st;
      g.registerPlugin(st);
      lenis = new Lenis({ lerp: 0.09, smoothWheel: true, anchors: true, prevent: (node: Element) => node.hasAttribute("data-lenis-prevent") });
      const tick = (time: number) => lenis?.raf(time * 1000);
      g.ticker.add(tick);
      g.ticker.lagSmoothing(0);
      lenis.on("scroll", st.update);
      document.documentElement.classList.add("motion-ready");
      window.dispatchEvent(new Event("literaryworks:motion-ready"));
      st.refresh();
    })().catch(error => {
      console.error("Motion layer unavailable; static content remains accessible.", error);
      document.documentElement.classList.remove("motion", "motion-ready");
      loading = null;
    });
  }
  return loading;
}

export function lockScroll(locked: boolean) {
  if (locked) lenis?.stop();
  else lenis?.start();
}
