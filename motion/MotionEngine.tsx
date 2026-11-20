"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";
import { gsap, runwayStart, SCENE_PACE, ScrollTrigger } from "./gsap";
import { splitText } from "./split";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** The pinned scenes (`data-pace`) that are on screen right now: while any is, the wheel moves the page less. */
const pinned = new Set<Element>();
let lenis: Lenis | null = null;
let refreshTimer = 0;

/** One re-measure of every scroll trigger, however many things ask for it within a moment. */
function refreshSoon(delay = 120) {
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), delay);
}

/**
 * The declarative layer: server-rendered markup opts in with data attributes and this file animates it with
 * GSAP + ScrollTrigger (transform, opacity and clip-path only, never a filter).
 *   data-reveal="rise|fade|left|right|scale"   fade-and-rise when scrolled into view
 *   data-stagger                               its children rise in one after another
 *   data-wipe                                  a clip-path wipe, left to right (rules, frames)
 *   data-parallax="0.08"                       drifts while scrolling
 *   data-split="words|chars"                   masked word / letter rise-in for headings
 *   data-progress                              a bar that tracks page scroll
 *   data-pace                                  a pinned scene: while it is on screen the wheel moves the page less
 * It re-runs on every route change.
 */
function setupPage(): () => void {
  const cleanups: Array<() => void> = [];
  const q = (selector: string) => Array.from(document.querySelectorAll<HTMLElement>(selector));

  const ctx = gsap.context(() => {
    q("[data-reveal]").forEach((el) => {
      if (el.parentElement?.hasAttribute("data-stagger")) return;
      const kind = el.dataset.reveal || "rise";
      const from = kind === "fade" ? {} : kind === "left" ? { x: -48 } : kind === "right" ? { x: 48 } : kind === "scale" ? { scale: 0.94, y: 16 } : { y: 32 };
      gsap.fromTo(
        el,
        { opacity: 0, ...from },
        {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: 1.05,
          ease: "power3.out",
          delay: Number(el.dataset.delay ?? 0),
          clearProps: "transform",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        },
      );
    });

    q("[data-stagger]").forEach((group) => {
      const items = Array.from(group.children) as HTMLElement[];
      if (!items.length) return;
      gsap.fromTo(
        items,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.95,
          ease: "power3.out",
          stagger: 0.09,
          clearProps: "transform",
          scrollTrigger: { trigger: group, start: "top 88%", once: true },
        },
      );
    });

    q("[data-wipe]").forEach((el) => {
      gsap.fromTo(
        el,
        { clipPath: "inset(0 100% 0 0)" },
        {
          clipPath: "inset(0 0% 0 0)",
          duration: 1.3,
          ease: "power3.inOut",
          clearProps: "clipPath",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
        },
      );
    });

    q("[data-parallax]").forEach((el) => {
      const amount = Number(el.dataset.parallax) || 0.08;
      gsap.fromTo(
        el,
        { yPercent: -amount * 100 },
        {
          yPercent: amount * 100,
          ease: "none",
          scrollTrigger: { trigger: el.parentElement ?? el, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    });

    q("[data-split]").forEach((el) => {
      const mode = el.dataset.split === "chars" ? "chars" : "words";
      const split = splitText(el, mode);
      cleanups.push(split.revert);
      gsap.set(split.parts, { yPercent: 118 });
      gsap.to(split.parts, {
        yPercent: 0,
        duration: 1.1,
        ease: "power4.out",
        stagger: mode === "chars" ? 0.018 : 0.07,
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });
    });

    /* pinned scenes: note when one is on screen (the wheel is slowed meanwhile, see Lenis below) */
    q("[data-pace]").forEach((scene) => {
      const stage = scene.querySelector<HTMLElement>(".xp-stage");
      const stageTop = stage ? Number.parseFloat(getComputedStyle(stage).top) : 0;
      const top = Number.isFinite(stageTop) ? stageTop : 0;
      const st = ScrollTrigger.create({
        trigger: scene,
        start: runwayStart(scene, top),
        end: "bottom bottom",
        onToggle: (self) => {
          if (self.isActive) pinned.add(scene);
          else pinned.delete(scene);
        },
      });
      cleanups.push(() => {
        st.kill();
        pinned.delete(scene);
      });
    });

    q("[data-progress]").forEach((bar) => {
      gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
    });
  });

  return () => {
    cleanups.forEach((fn) => fn());
    ctx.revert();
  };
}

/**
 * The page's motion engine, mounted once (by MotionRoot, and only where motion is on): smooth scroll with Lenis,
 * driven by GSAP's ticker so ScrollTrigger and Lenis share one clock, plus the declarative layer above.
 */
export function MotionEngine() {
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    if (!html.classList.contains("motion")) return;

    const instance = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      anchors: true,
      // inside a pinned scene a wheel notch counts for less, so a fast flick cannot skip the animation
      // (Lenis reads the deltas after this callback, so changing them here takes effect)
      virtualScroll: (data) => {
        if (pinned.size && data.event.type === "wheel") {
          data.deltaX *= SCENE_PACE;
          data.deltaY *= SCENE_PACE;
        }
        return true;
      },
    });
    lenis = instance;
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // heights change as fonts arrive: measure again (once, merged with any other request)
    document.fonts?.ready.then(() => refreshSoon()).catch(() => {});

    return () => {
      window.clearTimeout(refreshTimer);
      gsap.ticker.remove(tick);
      instance.destroy();
      lenis = null;
    };
  }, []);

  useIsoLayoutEffect(() => {
    const html = document.documentElement;
    if (!html.classList.contains("motion")) return;

    lenis?.scrollTo(0, { immediate: true, force: true });
    const cleanup = setupPage();
    html.classList.add("motion-ready");
    refreshSoon(80);

    return cleanup;
  }, [pathname]);

  return null;
}
