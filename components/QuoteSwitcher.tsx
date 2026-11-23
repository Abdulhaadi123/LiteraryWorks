"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Quote } from "@/lib/content";

const initials = (name: string) =>
  name
    .replace(/[.,]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

/**
 * What clients say, one at a time: the clients as tabs down the left (across the top on a phone) and their words in a
 * large card. Every quote is in the page; only the chosen one is shown.
 */
export function QuoteSwitcher({ items }: { items: Quote[] }) {
  const [at, setAt] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const first = useRef(true);
  // on a phone the tabs are a row that scrolls sideways: keep the chosen one in view (the row only, never the page)
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const tab = tabs.current[at];
    const row = tab?.parentElement;
    if (!tab || !row || row.scrollWidth <= row.clientWidth) return;
    row.scrollTo({
      left: tab.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [at]);
  const go = (i: number, focus = false) => {
    const n = (i + items.length) % items.length;
    setAt(n);
    if (focus) tabs.current[n]?.focus({ preventScroll: true });
  };
  const onKey = (e: KeyboardEvent) => {
    const k = e.key;
    if (k === "ArrowDown" || k === "ArrowRight") go(at + 1, true);
    else if (k === "ArrowUp" || k === "ArrowLeft") go(at - 1, true);
    else if (k === "Home") go(0, true);
    else if (k === "End") go(items.length - 1, true);
    else return;
    e.preventDefault();
  };

  return (
    <div className="voices" data-reveal>
      <div
        className="voices-tabs"
        role="tablist"
        aria-label="Clients"
        aria-orientation="vertical"
        onKeyDown={onKey}
      >
        {items.map((q, i) => (
          <button
            key={q.name + q.role}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`voice-tab-${i}`}
            aria-controls={`voice-${i}`}
            aria-selected={i === at}
            tabIndex={i === at ? 0 : -1}
            className="voices-tab"
            onClick={() => go(i)}
          >
            <span className="avatar" aria-hidden="true">
              {initials(q.name)}
            </span>
            <span className="voices-who">
              <b>{q.name}</b>
              <span>{q.role}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="voices-stage">
        {items.map((q, i) => (
          <div
            key={q.name + q.role}
            className="voices-card"
            role="tabpanel"
            id={`voice-${i}`}
            aria-labelledby={`voice-tab-${i}`}
            hidden={i !== at}
          >
            <figure>
              <span className="voices-mark" aria-hidden="true">
                “
              </span>
              <blockquote>{q.text}</blockquote>
              <figcaption>
                <span className="avatar" aria-hidden="true">
                  {initials(q.name)}
                </span>
                <span className="voices-who">
                  <b>{q.name}</b>
                  <span>{q.role}</span>
                </span>
              </figcaption>
            </figure>
          </div>
        ))}
        <div className="voices-nav">
          <span className="voices-count" aria-hidden="true">
            <b>{String(at + 1).padStart(2, "0")}</b> /{" "}
            {String(items.length).padStart(2, "0")}
          </span>
          <button
            type="button"
            className="voices-arrow"
            aria-label="Previous client"
            onClick={() => go(at - 1)}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
          </button>
          <button
            type="button"
            className="voices-arrow"
            aria-label="Next client"
            onClick={() => go(at + 1)}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
