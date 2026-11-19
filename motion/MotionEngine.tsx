"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger, loadMotion, motionOn } from "./loadMotion";

function initDeclarativeAnimations(): () => void {
  if (!gsap || !ScrollTrigger) return () => {};
  const g = gsap;
  const triggers: Array<{ kill(): void }> = [];
  const tweens: Array<{ kill(): void }> = [];

  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach(element => {
    const kind = element.dataset.reveal || "rise";
    const from = kind === "left" ? { x: -36, y: 0, opacity: 0 } : kind === "right" ? { x: 36, y: 0, opacity: 0 } : kind === "scale" ? { scale: 0.94, y: 0, opacity: 0 } : { x: 0, y: kind === "fade" ? 0 : 30, opacity: 0 };
    const tween = g.fromTo(element, from, { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.85, ease: "power3.out", immediateRender: false, scrollTrigger: { trigger: element, start: "top 91%", once: true } });
    tweens.push(tween);
  });
  document.querySelectorAll<HTMLElement>("[data-stagger]").forEach(container => {
    const children = Array.from(container.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
    const tween = g.fromTo(children, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: "power2.out", immediateRender: false, scrollTrigger: { trigger: container, start: "top 85%", once: true } });
    tweens.push(tween);
  });
  document.querySelectorAll<HTMLElement>("[data-wipe]").forEach(element => {
    tweens.push(g.fromTo(element, {clipPath: "inset(0 100% 0 0)"}, {clipPath: "inset(0 0% 0 0)", duration: 1, ease: "power2.inOut", immediateRender: false, scrollTrigger: {trigger: element, start: "top 88%", once: true}}));
  });
  document.querySelectorAll<HTMLElement>("[data-parallax]").forEach(element => {
    const n = Math.max(-0.4, Math.min(0.4, Number(element.dataset.parallax) || 0.08));
    tweens.push(g.fromTo(element, {yPercent: -n * 100}, {yPercent: n * 100, ease: "none", scrollTrigger: { trigger: element, start: "top bottom", end: "bottom top", scrub: true }}));
  });
  document.querySelectorAll<HTMLElement>("[data-progress]").forEach(element => {
    tweens.push(g.fromTo(element, {scaleX: 0, transformOrigin: "left center"}, {scaleX: 1, ease: "none", scrollTrigger: {trigger: element, start: "top bottom", end: "bottom top", scrub: true}}));
  });
  document.querySelectorAll<HTMLElement>("[data-counter]").forEach(element => {
    const end = Number(element.dataset.counter);
    if (!Number.isFinite(end)) return;
    const state = {value: 0};
    tweens.push(g.to(state, {value: end, duration: 1.5, ease: "power2.out", onUpdate: () => {element.textContent = Math.round(state.value).toLocaleString("en-US");}, scrollTrigger: {trigger: element, start: "top 88%", once: true}}));
  });
  document.querySelectorAll<HTMLElement>("[data-marquee]").forEach(element => {
    tweens.push(g.to(element, {xPercent: -25, duration: 24, repeat: -1, ease: "none"}));
  });
  document.querySelectorAll<HTMLElement>("[data-split]").forEach(element => {
    const mode = element.dataset.split === "chars" && document.documentElement.dir !== "rtl" ? "chars" : "words";
    const original = element.textContent || "";
    const pieces = mode === "chars" ? Array.from(original) : original.split(/(\s+)/);
    element.textContent = "";
    const parts = pieces.map(part => {const span = document.createElement("span");span.textContent = part; span.style.display = "inline-block"; element.append(span); return span;});
    tweens.push(g.fromTo(parts, {opacity: 0, y: 16}, {opacity: 1, y: 0, duration: 0.5, stagger: 0.025, immediateRender: false, scrollTrigger: {trigger: element, start: "top 88%", once: true}}));
    triggers.push({kill: () => { element.textContent = original; }});
  });
  return () => { tweens.forEach(t => t.kill()); triggers.forEach(t => t.kill()); };
}

export function MotionEngine() {
  useEffect(() => {
    if (!motionOn()) return;
    let cleanup: (() => void) | undefined;
    let disposed = false;
    loadMotion().then(() => {
      if (disposed || !motionOn()) return;
      cleanup = initDeclarativeAnimations();
      ScrollTrigger?.refresh();
    });
    const onResize = () => {
      if (!window.matchMedia("(min-width: 64rem) and (prefers-reduced-motion: no-preference)").matches) {
        document.documentElement.classList.remove("motion", "motion-ready");
      }
    };
    window.addEventListener("resize", onResize);
    return () => { disposed = true; cleanup?.(); window.removeEventListener("resize", onResize); };
  }, []);
  return null;
}
