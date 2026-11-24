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

/**
 * What clients say: a row of cards that scrolls sideways (the wheel, a swipe, the arrow keys, or the two buttons), each
 * with the person's photo or initials, name and role. Every quote is in the page; only the position in the row changes.
 */
export function Testimonials({ items }: { items: Quote[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [at, setAt] = useState(0);
  const [edge, setEdge] = useState({ start: true, end: false });

  const read = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("li");
    const step = card ? card.offsetWidth + GAP : 1;
    setAt(Math.min(items.length - 1, Math.round(el.scrollLeft / step)));
    setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, [items.length]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let raf = 0;
    const on = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        read();
      });
    };
    read();
    el.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      el.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [read]);

  const move = (dir: 1 | -1) => {
    const el = track.current;
    const card = el?.querySelector<HTMLElement>("li");
    if (!el || !card) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // about as many cards as are in view, so a press shows a fresh set
    const n = Math.max(1, Math.floor(el.clientWidth / (card.offsetWidth + GAP)));
    el.scrollBy({ left: dir * n * (card.offsetWidth + GAP), behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div className="tcar" data-reveal>
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
        {items.map((q) => (
          <li key={q.name + q.role} className="tcar-card">
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
        ))}
      </ul>
      <div className="tcar-nav">
        <span className="tcar-count" aria-hidden="true">
          <b>{String(at + 1).padStart(2, "0")}</b> / {String(items.length).padStart(2, "0")}
        </span>
        <span className="tcar-bar" aria-hidden="true">
          <i style={{ transform: `scaleX(${((at + 1) / items.length).toFixed(3)})` }} />
        </span>
        <button type="button" className="tcar-arrow" aria-label="Earlier testimonials" disabled={edge.start} onClick={() => move(-1)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
        </button>
        <button type="button" className="tcar-arrow" aria-label="More testimonials" disabled={edge.end} onClick={() => move(1)}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
