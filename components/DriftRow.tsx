"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/** How fast the row drifts, in px a second, and how long it waits after the visitor has touched it. */
const SPEED = 40;
const AFTER_TOUCH_MS = 3500;

/**
 * A row of cards that drifts sideways by itself, the way the client testimonials do (components/Testimonials.tsx), and starts
 * over seamlessly (the cards are repeated once, in the browser only: the page itself carries each card once). It stops under
 * the pointer and while keyboard focus is in it, and for a moment after a touch, a swipe, the wheel or a key; the two buttons,
 * the arrow keys and a swipe move it by hand. For a visitor who asked for reduced motion it stands still (and is not
 * repeated). `children` are the cards (list items); `count` is how many there are.
 */
export function DriftRow({ count, label, children }: { count: number; label: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const [copies, setCopies] = useState(1);
  const hold = useRef({ quietUntil: 0, smoothUntil: 0 });

  /** The distance between the start of the cards and the start of their repeat: where the row starts over. 0 while not repeated. */
  const setWidth = useCallback(() => {
    const sets = track.current?.querySelectorAll<HTMLElement>(":scope > .drift-set");
    return sets && sets.length > 1 ? sets[1].offsetLeft - sets[0].offsetLeft : 0;
  }, []);

  /** One card and its gap: the distance from one card's start to the next's. */
  const step = useCallback(() => {
    const cards = track.current?.querySelectorAll<HTMLElement>(":scope > .drift-set:first-child > li");
    return cards && cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : 0;
  }, []);

  const read = useCallback(() => {
    const el = track.current;
    const s = step();
    if (el && s) setAt(Math.round(el.scrollLeft / s) % count);
  }, [count, step]);

  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setCopies(2);
  }, []);

  // the repeat is for the eye only: its links are not tab stops, and it is hidden from screen readers
  useEffect(() => {
    track.current?.querySelectorAll<HTMLAnchorElement>(":scope > .drift-set + .drift-set a").forEach((a) => (a.tabIndex = -1));
  }, [copies]);

  useEffect(() => {
    const el = track.current;
    const box = root.current;
    if (!el || !box) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = 0;
    let acc = 0;
    let hover = false;
    let focus = false;
    let visible = false;
    const wrap = () => {
      const w = setWidth();
      if (w && Date.now() >= hold.current.smoothUntil && el.scrollLeft >= w) el.scrollLeft -= w;
    };
    const frame = (t: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(64, Math.max(0, t - last));
      last = t;
      if (reduced || !visible || hover || focus || document.hidden || Date.now() < hold.current.quietUntil || Date.now() < hold.current.smoothUntil) return;
      acc += (SPEED * dt) / 1000;
      const whole = Math.floor(acc);
      if (whole >= 1) {
        acc -= whole;
        el.scrollLeft += whole;
        wrap();
      }
    };
    const onScroll = () => {
      wrap();
      read();
    };
    const touched = () => {
      hold.current.quietUntil = Date.now() + AFTER_TOUCH_MS;
    };
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        if (visible && !raf) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
        } else if (!visible && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { threshold: 0.1 },
    );
    io.observe(box);
    const enter = () => (hover = true);
    const leave = () => (hover = false);
    const fin = () => (focus = true);
    const fout = () => (focus = false);
    box.addEventListener("pointerenter", enter);
    box.addEventListener("pointerleave", leave);
    box.addEventListener("focusin", fin);
    box.addEventListener("focusout", fout);
    for (const ev of ["pointerdown", "touchstart", "wheel", "keydown"]) el.addEventListener(ev, touched, { passive: true });
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", read);
    read();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      box.removeEventListener("pointerenter", enter);
      box.removeEventListener("pointerleave", leave);
      box.removeEventListener("focusin", fin);
      box.removeEventListener("focusout", fout);
      for (const ev of ["pointerdown", "touchstart", "wheel", "keydown"]) el.removeEventListener(ev, touched);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", read);
    };
  }, [copies, read, setWidth]);

  const move = (dir: 1 | -1) => {
    const el = track.current;
    const s = step();
    if (!el || !s) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // about as many cards as are in view, so a press shows a fresh set
    const by = Math.max(1, Math.floor(el.clientWidth / s)) * s;
    hold.current.smoothUntil = Date.now() + (reduced ? 0 : 900);
    hold.current.quietUntil = Date.now() + 6000;
    const w = setWidth();
    if (dir < 0 && w && el.scrollLeft < by) el.scrollLeft += w; // (the same picture one set along: going back past the first card)
    el.scrollBy({ left: dir * by, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div className="tcar drift" ref={root}>
      <div
        className="tcar-track drift-track"
        ref={track}
        tabIndex={0}
        role="region"
        aria-label={label}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            move(1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            move(-1);
          }
        }}
      >
        <ul className="drift-set">{children}</ul>
        {copies > 1 ? (
          <ul className="drift-set" aria-hidden="true">
            {children}
          </ul>
        ) : null}
      </div>
      <div className="wrap tcar-nav">
        <span className="tcar-count" aria-hidden="true">
          <b>{String(at + 1).padStart(2, "0")}</b> / {String(count).padStart(2, "0")}
        </span>
        <span className="tcar-bar" aria-hidden="true">
          <i style={{ transform: `scaleX(${((at + 1) / count).toFixed(3)})` }} />
        </span>
        <button type="button" className="tcar-arrow" aria-label="Earlier case studies" onClick={() => move(-1)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
        </button>
        <button type="button" className="tcar-arrow" aria-label="More case studies" onClick={() => move(1)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
