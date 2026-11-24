"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Quote } from "@/lib/content";

const initials = (name: string) =>
  name
    .replace(/[.,]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

const GAP = 20; // between two cards, in px (the same as in the CSS)
/** How fast the row drifts, in px a second, and how long it waits after the visitor has touched it. */
const SPEED = 42;
const AFTER_TOUCH_MS = 3500;

/**
 * What clients say: a row of cards that drifts sideways by itself, the way the band of logos does, from one edge of the
 * window to the other, and starts over seamlessly (the cards are repeated once). It stops under the pointer and while
 * keyboard focus is in it, and for a moment after a touch, a swipe, the wheel or a key; the two buttons and a swipe move it
 * by hand. For a visitor who asked for reduced motion it stands still (and is not repeated). Every quote is in the page once.
 */
export function Testimonials({ items }: { items: Quote[] }) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const [at, setAt] = useState(0);
  // the row is repeated once, in the browser only (the page itself carries each quote once)
  const [copies, setCopies] = useState(1);
  const n = items.length;
  const hold = useRef({ quietUntil: 0, smoothUntil: 0 });

  /** The width of one full set of cards: where the row starts over. 0 while it is not repeated. */
  const setWidth = useCallback(() => {
    const el = track.current;
    const cards = el?.querySelectorAll<HTMLElement>("li");
    if (!el || !cards || cards.length < 2 * n) return 0;
    return cards[n].offsetLeft - cards[0].offsetLeft;
  }, [n]);

  const read = useCallback(() => {
    const el = track.current;
    const card = el?.querySelector<HTMLElement>("li");
    if (!el || !card) return;
    setAt(Math.round(el.scrollLeft / (card.offsetWidth + GAP)) % n);
  }, [n]);

  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setCopies(2);
  }, []);

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
    const card = el?.querySelector<HTMLElement>("li");
    if (!el || !card) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = card.offsetWidth + GAP;
    // about as many cards as are in view, so a press shows a fresh set
    const by = Math.max(1, Math.floor(el.clientWidth / step)) * step;
    hold.current.smoothUntil = Date.now() + (reduced ? 0 : 900);
    hold.current.quietUntil = Date.now() + 6000;
    const w = setWidth();
    if (dir < 0 && w && el.scrollLeft < by) el.scrollLeft += w; // (the same picture one set along: going back past the first card)
    el.scrollBy({ left: dir * by, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div className="tcar" ref={root} data-reveal>
      <ul
        className="tcar-track"
        ref={track}
        tabIndex={0}
        aria-label="Client testimonials, scroll sideways"
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
        {Array.from({ length: copies }, (_, c) =>
          items.map((q) => (
            <li key={`${c}-${q.name}${q.role}`} className="tcar-card" aria-hidden={c > 0 || undefined}>
              <figure>
                <span className="tcar-mark" aria-hidden="true">
                  “
                </span>
                <blockquote>{q.text}</blockquote>
                <figcaption>
                  <span className="tcar-avatar" aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {q.photo ? <img src={q.photo} alt="" width={96} height={96} loading="lazy" decoding="async" /> : initials(q.name)}
                  </span>
                  <span className="tcar-who">
                    <b>{q.name}</b>
                    <span>{q.role}</span>
                  </span>
                </figcaption>
              </figure>
            </li>
          )),
        )}
      </ul>
      <div className="wrap tcar-nav">
        <span className="tcar-count" aria-hidden="true">
          <b>{String(at + 1).padStart(2, "0")}</b> / {String(n).padStart(2, "0")}
        </span>
        <span className="tcar-bar" aria-hidden="true">
          <i style={{ transform: `scaleX(${((at + 1) / n).toFixed(3)})` }} />
        </span>
        <button type="button" className="tcar-arrow" aria-label="Earlier testimonials" onClick={() => move(-1)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
        </button>
        <button type="button" className="tcar-arrow" aria-label="More testimonials" onClick={() => move(1)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
