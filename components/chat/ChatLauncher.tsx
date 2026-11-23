"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";

/** The panel's code loads only when the visitor reaches for the button (hover, focus or touch), never with the page. */
const load = () => import("./ChatPanel");
const ChatPanel = dynamic(() => load().then((m) => m.ChatPanel), { ssr: false });

const OPEN_KEY = "lw-chat-open";

/** The round button in the corner that opens the website assistant. */
export function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
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

  const toggle = useCallback((next: boolean) => {
    setMounted(true);
    setOpen(next);
    try {
      sessionStorage.setItem(OPEN_KEY, next ? "1" : "0");
    } catch {}
    if (!next) requestAnimationFrame(() => button.current?.focus());
  }, []);

  return (
    <>
      <button
        ref={button}
        type="button"
        className={`chat-launcher${open ? " is-open" : ""}`}
        aria-label={open ? "Close the LiteraryWorks assistant" : "Ask the LiteraryWorks assistant"}
        aria-expanded={open}
        aria-controls="lw-chat"
        onPointerEnter={load}
        onFocus={load}
        onTouchStart={load}
        onClick={() => toggle(!open)}
      >
        <svg className="chat-launcher-icon chat-launcher-talk" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6c-.5.4-1.3.1-1.3-.6V16A2.5 2.5 0 0 1 4 13.5z" />
          <path className="chat-launcher-dots" d="M8.5 9.6h.01M12 9.6h.01M15.5 9.6h.01" />
        </svg>
        <svg className="chat-launcher-icon chat-launcher-x" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      {mounted && <ChatPanel open={open} onClose={() => toggle(false)} />}
    </>
  );
}
