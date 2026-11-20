"use client";

import { useEffect, useLayoutEffect, useState, useSyncExternalStore, type ComponentType } from "react";
import { motionOn, motionReady, subscribeMotion } from "./gsap";

/**
 * Mounts the page's motion engine (`MotionEngine`: smooth scroll and the declarative layer) once GSAP has
 * arrived. Where there is no motion (phones, tablets, reduced motion) neither GSAP nor the engine is fetched:
 * the page is plain markup plus the light CSS animations, and this component renders nothing.
 */

// the engine's own code is fetched at once, in parallel with GSAP, not after it
const engine = typeof window !== "undefined" && motionOn() ? import("./MotionEngine") : null;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const useMotionReady = () => useSyncExternalStore(subscribeMotion, motionReady, () => false);

export function MotionRoot() {
  const ready = useMotionReady();
  const [Engine, setEngine] = useState<ComponentType | null>(null);

  // Safety net: if anything swaps the <html> element and wipes the classes the head script put on it, the page
  // would stay in its static, animation-free layout. A mount that finds the engine already loaded but
  // `html.motion` gone reloads once (the guard stops a loop) so the head script runs again.
  useIsoLayoutEffect(() => {
    if (motionReady() && !document.documentElement.classList.contains("motion")) {
      try {
        if (sessionStorage.getItem("lw-reload")) return;
        sessionStorage.setItem("lw-reload", "1");
      } catch {
        return;
      }
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    if (!ready || !engine) return;
    let live = true;
    void engine.then((m) => {
      if (live) setEngine(() => m.MotionEngine);
    });
    return () => {
      live = false;
    };
  }, [ready]);

  return Engine ? <Engine /> : null;
}
