"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { teaserFor } from "@/lib/chat/teasers";

/** The panel's code loads only when the visitor reaches for the button (hover, focus or touch), never with the page. */
const load = () => import("./ChatPanel");
const ChatPanel = dynamic(() => load().then((m) => m.ChatPanel), { ssr: false });

const OPEN_KEY = "lw-chat-open";
/** Set once the visitor has closed the bubble or opened the chat: the bubble does not come back in this tab. */
const QUIET_KEY = "lw-chat-quiet";
/** How long a page is on screen before the bubble asks its question. */
const TEASER_DELAY_MS = 4500;

const getQuiet = () => {
  try {
    return sessionStorage.getItem(QUIET_KEY) === "1";
  } catch {
    return false;
  }
};
const setQuiet = () => {
  try {
    sessionStorage.setItem(QUIET_KEY, "1");
  } catch {}
};

/**
 * The website assistant's button in the corner, and the question it asks above it: a different one on each page (the
 * home page, a service, a case study ...). Tapping the question opens the chat and asks it; the cross puts it away for
 * the rest of the visit.
 */
export function ChatLauncher() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [teaser, setTeaser] = useState<{ text: string; ask: string } | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const button = useRef<HTMLButtonElement>(null);

  // reopen after a page change if it was open (the conversation itself is kept by the panel)
  useEffect(() => {
    try {
      if (sessionStorage.getItem(OPEN_KEY) === "1" && window.matchMedia("(min-width: 48rem)").matches) {
        setMounted(true);
        setOpen(true);
      }
    } catch {}
  }, []);

  // each page asks its own question, a few seconds after it opens (never while the chat is open, never after "no thanks")
  useEffect(() => {
    setTeaser(null);
    if (open || getQuiet()) return;
    const t = teaserFor(path);
    if (!t) return;
    const id = window.setTimeout(() => {
      if (!getQuiet()) setTeaser(t);
    }, TEASER_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [path, open]);

  const toggle = useCallback((next: boolean) => {
    setMounted(true);
    setOpen(next);
    if (next) {
      setQuiet();
      setTeaser(null);
    }
    try {
      sessionStorage.setItem(OPEN_KEY, next ? "1" : "0");
    } catch {}
    if (!next) requestAnimationFrame(() => button.current?.focus());
  }, []);

  const askTeaser = () => {
    if (!teaser) return;
    void load();
    setPending(teaser.ask);
    toggle(true);
  };
  const dismiss = () => {
    setQuiet();
    setTeaser(null);
  };

  return (
    <>
      {teaser && !open ? (
        <div className="chat-teaser" role="complementary" aria-label="A question from the Literary Worx assistant">
          <button type="button" className="chat-teaser-body" onClick={askTeaser} onPointerEnter={load} onFocus={load}>
            <span className="chat-teaser-who">
              <i aria-hidden="true" />
              Literary Worx assistant
            </span>
            <span className="chat-teaser-text">{teaser.text}</span>
            <span className="chat-teaser-go">
              Ask this
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </button>
          <button type="button" className="chat-teaser-x" onClick={dismiss} aria-label="Dismiss the assistant's question">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      ) : null}
      <button
        ref={button}
        type="button"
        className={`chat-launcher${open ? " is-open" : ""}${teaser && !open ? " is-asking" : ""}`}
        aria-label={open ? "Close the Literary Worx assistant" : "Ask the Literary Worx assistant"}
        aria-expanded={open}
        aria-controls="lw-chat"
        onPointerEnter={load}
        onFocus={load}
        onTouchStart={load}
        onClick={() => toggle(!open)}
      >
        <span className="chat-launcher-ring" aria-hidden="true" />
        <svg className="chat-launcher-icon chat-launcher-talk" viewBox="0 0 32 32" aria-hidden="true">
          <path className="chat-launcher-bubble" d="M6.5 6h19A3.5 3.5 0 0 1 29 9.5v11a3.5 3.5 0 0 1-3.5 3.5H15l-5.6 4.6c-.7.5-1.6 0-1.6-.8V24H6.5A3.5 3.5 0 0 1 3 20.5v-11A3.5 3.5 0 0 1 6.5 6z" />
          <circle className="chat-launcher-dot d1" cx="11" cy="15" r="1.7" />
          <circle className="chat-launcher-dot d2" cx="16" cy="15" r="1.7" />
          <circle className="chat-launcher-dot d3" cx="21" cy="15" r="1.7" />
        </svg>
        <svg className="chat-launcher-icon chat-launcher-x" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
        <span className="chat-launcher-live" aria-hidden="true" />
      </button>
      {mounted && <ChatPanel open={open} onClose={() => toggle(false)} ask={pending} onAsked={() => setPending(null)} />}
    </>
  );
}
