"use client";

import { useEffect, useRef } from "react";
import { gsap, loadMotion, motionOn, ScrollTrigger } from "@/motion/gsap";

/**
 * Drives a pinned horizontal gallery (components/CaseReel.tsx): while the page scrolls through the tall section,
 * the row of cards slides sideways and a thin line fills. Only where motion is on (wide screens, no reduced
 * motion); everywhere else the cards simply stack. It sits inside the section it drives.
 */
export function ReelDriver() {
  const mark = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const section = mark.current?.closest<HTMLElement>("[data-reel]");
    // a screen under 640px high cannot hold the heading, a picture and the words at once: there the cards stack
    if (!section || !motionOn() || window.innerHeight < 640) return;
    const track = section.querySelector<HTMLElement>("[data-reel-track]");
    const bar = section.querySelector<HTMLElement>("[data-reel-bar]");
    if (!track) return;
    let disposed = false;
    let tween: gsap.core.Tween | undefined;

    const distance = () => Math.max(0, track.scrollWidth - (section.clientWidth - 0));

    void loadMotion().then((ok) => {
      if (!ok || disposed) return;
      const measure = () => section.style.setProperty("--reel-x", `${Math.round(distance())}px`);
      measure();
      tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          invalidateOnRefresh: true,
          onRefreshInit: measure,
          onUpdate: (self) => {
            if (bar) bar.style.transform = `scaleX(${self.progress.toFixed(4)})`;
          },
        },
      });
      section.classList.add("is-live");
      ScrollTrigger.refresh();
    });

    return () => {
      disposed = true;
      tween?.scrollTrigger?.kill();
      tween?.kill();
      if (track) track.style.transform = "";
      section.classList.remove("is-live");
      section.style.removeProperty("--reel-x");
    };
  }, []);

  return <span ref={mark} className="sr-only" aria-hidden="true" />;
}
