"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { Mark } from "@/components/Logo";

type Action = "book" | "contact" | "none";
type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** follow-up questions and the suggested next step, sent once the answer is complete */
  s?: string[];
  a?: Action;
  /** the answer failed; the text is the reason to show */
  error?: boolean;
  /** shown as an error, but there is nothing to retry (the assistant is switched off) */
  final?: boolean;
  /** part of the answer arrived, then the stream broke */
  cut?: boolean;
};

const STORE_KEY = "lw-chat-v1";
const MAX_INPUT = 800;
const STARTERS = ["What does LiteraryWorks do?", "How does the free AI audit work?", "What does a project cost?", "Show me your case studies"];

const uid = () => Math.random().toString(36).slice(2, 10);

function loadMessages(): Msg[] {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    const list = raw ? (JSON.parse(raw) as Msg[]) : [];
    return Array.isArray(list) ? list.filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string").slice(-40) : [];
  } catch {
    return [];
  }
}

/** The website assistant: a conversation that streams in, follow-up suggestions, and a way to reach the team. */
export function ChatPanel({ open, onClose, ask: asked, onAsked }: { open: boolean; onClose: () => void; ask?: string | null; onAsked?: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [formFor, setFormFor] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const abort = useRef<AbortController | null>(null);
  const pinned = useRef(true);
  const loaded = useRef(false);
  const titleId = useId();

  useEffect(() => {
    setMessages(loadMessages());
    loaded.current = true;
  }, []);

  // keep the conversation for this browser tab (an answer still streaming is saved once it is complete)
  useEffect(() => {
    if (!loaded.current || busy) return;
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {}
  }, [messages, busy]);

  // follow the answer as it streams, unless the visitor has scrolled up to read
  useLayoutEffect(() => {
    const el = list.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [messages, formFor]);

  useEffect(() => {
    if (!open) return;
    pinned.current = true;
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
    // a phone keyboard would cover half the conversation on open: focus only where there is a real keyboard
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) input.current?.focus({ preventScroll: true });
    // on a phone the panel covers the page: the page behind must not scroll
    const phone = window.matchMedia("(max-width: 47.99rem)").matches;
    if (phone) document.documentElement.classList.add("chat-locked");
    return () => document.documentElement.classList.remove("chat-locked");
  }, [open]);

  useEffect(() => () => abort.current?.abort(), []);

  const onScroll = () => {
    const el = list.current;
    if (el) pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  };

  const ask = useCallback(
    async (text: string, history: Msg[]) => {
      const question = text.trim().slice(0, MAX_INPUT);
      if (!question || busy) return;
      const user: Msg = { id: uid(), role: "user", content: question };
      const reply: Msg = { id: uid(), role: "assistant", content: "" };
      const base = [...history.filter((m) => !m.error), user];
      setMessages([...base, reply]);
      setDraft("");
      setFormFor(null);
      setBusy(true);
      setAnnounce("");
      pinned.current = true;

      const patch = (p: Partial<Msg>) => setMessages((all) => all.map((m) => (m.id === reply.id ? { ...m, ...p } : m)));
      const controller = new AbortController();
      abort.current = controller;
      let content = "";
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: base.map(({ role, content }) => ({ role, content })), page: window.location.pathname }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const json = (await res.json().catch(() => ({}))) as { message?: string };
          patch({ content: json.message || "Something went wrong. Please try again.", error: true, final: res.status === 503 && !/busy/i.test(json.message || "") });
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let meta: Pick<Msg, "s" | "a"> | null = null;
        let failed = "";
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nl: number;
          let changed = false;
          while ((nl = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, nl);
            buffer = buffer.slice(nl + 1);
            if (!line.trim()) continue;
            try {
              const ev = JSON.parse(line) as { t: string; v?: string; s?: string[]; a?: Action; m?: string };
              if (ev.t === "d" && ev.v) {
                content += ev.v;
                changed = true;
              } else if (ev.t === "m") meta = { s: ev.s ?? [], a: ev.a ?? "none" };
              else if (ev.t === "e") failed = ev.m || "The answer was cut off. Please try again.";
            } catch {}
          }
          if (changed) patch({ content });
        }
        if (failed && !content) patch({ content: failed, error: true });
        else if (failed) patch({ content, s: [], a: "none", cut: true });
        else if (!content) patch({ content: "The answer was cut off. Please try again.", error: true });
        else {
          patch({ content, ...(meta ?? { s: [], a: "none" as Action }) });
          setAnnounce(content);
        }
      } catch {
        if (controller.signal.aborted) {
          // stopped by the visitor: keep what arrived, or drop the empty bubble
          if (content) patch({ content, s: [], a: "none" });
          else setMessages((all) => all.filter((m) => m.id !== reply.id));
        } else if (content) patch({ content, s: [], a: "none", cut: true });
        else patch({ content: "We could not reach the assistant. Check your connection and try again.", error: true });
      } finally {
        abort.current = null;
        setBusy(false);
      }
    },
    [busy],
  );

  // a question handed over by the button's bubble: asked once, as soon as the panel is open and ready
  useEffect(() => {
    if (!open || !asked || busy || !loaded.current) return;
    onAsked?.();
    void ask(asked, messages);
  }, [open, asked, busy, ask, messages, onAsked]);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    ask(draft, messages);
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };
  const retry = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    const at = messages.lastIndexOf(lastUser);
    ask(lastUser.content, messages.slice(0, at));
  };
  const reset = () => {
    abort.current?.abort();
    setMessages([]);
    setFormFor(null);
    setDraft("");
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch {}
    input.current?.focus();
  };

  const onPanelKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    }
  };

  // grow the box with the text, up to a few lines
  useLayoutEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 132)}px`;
  }, [draft]);

  const last = messages[messages.length - 1];
  const settled = !busy && last?.role === "assistant" && !last.error;

  return (
    <div id="lw-chat" className={`chat${open ? " is-open" : ""}`} role="dialog" aria-labelledby={titleId} aria-hidden={!open} inert={!open} onKeyDown={onPanelKey}>
      <div className="chat-head">
        <span className="chat-avatar" aria-hidden="true">
          <Mark />
        </span>
        <div className="chat-title">
          <h2 id={titleId}>LiteraryWorks assistant</h2>
          <p>
            <span className="chat-live" aria-hidden="true" />
            Ask about our services and work
          </p>
        </div>
        <button type="button" className="chat-icon-btn" onClick={reset} aria-label="Start a new conversation" title="New conversation" disabled={!messages.length}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" />
          </svg>
        </button>
        <button type="button" className="chat-icon-btn" onClick={onClose} aria-label="Close the assistant" title="Close">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="chat-log" ref={list} onScroll={onScroll} data-lenis-prevent aria-live="off">
        <div className="chat-msg is-bot">
          <div className="chat-bubble">
            <p>Hi, I&apos;m the LiteraryWorks assistant. Ask me about our services, case studies, prices or the free AI audit.</p>
            <p className="chat-langs">You can write in any language.</p>
          </div>
        </div>
        {!messages.length && (
          <div className="chat-chips" aria-label="Suggested questions">
            {STARTERS.map((q) => (
              <button key={q} type="button" className="chat-chip" onClick={() => ask(q, [])}>
                {q}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => {
          const isLast = i === messages.length - 1;
          if (m.role === "user")
            return (
              <div key={m.id} className="chat-msg is-me">
                <div className="chat-bubble">{m.content}</div>
              </div>
            );
          const typing = busy && isLast && !m.content;
          return (
            <Fragment key={m.id}>
              <div className={`chat-msg is-bot${m.error ? " is-error" : ""}`}>
                <div className="chat-bubble" aria-busy={busy && isLast}>
                  {typing ? (
                    <span className="chat-typing" aria-label="The assistant is writing">
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : m.error ? (
                    <>
                      <p>{m.content}</p>
                      {m.final ? (
                        <p>
                          <Link href="/contact" onClick={closeOnPhone(onClose)}>
                            Write to us through the contact form
                          </Link>
                        </p>
                      ) : (
                        isLast && (
                          <button type="button" className="chat-retry" onClick={retry}>
                            Try again
                          </button>
                        )
                      )}
                    </>
                  ) : (
                    <>
                      <Rich text={m.content} onNavigate={closeOnPhone(onClose)} />
                      {m.cut && isLast && !busy && (
                        <p className="chat-cut">
                          The answer was cut off.{" "}
                          <button type="button" className="chat-retry" onClick={retry}>
                            Try again
                          </button>
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
              {isLast && settled && (m.a === "book" || m.a === "contact") && formFor !== m.id && (
                <div className="chat-card">
                  <p className="chat-card-title">Talk to the LiteraryWorks team</p>
                  <Link className="chat-btn is-primary" href="/contact?topic=audit" onClick={closeOnPhone(onClose)}>
                    Book a free AI audit
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                  <button type="button" className="chat-btn" onClick={() => setFormFor(m.id)}>
                    Ask us to contact you
                  </button>
                </div>
              )}
              {isLast && settled && formFor === m.id && <LeadForm messages={messages} topic={m.a === "book" ? "Free AI audit" : "Something else"} onCancel={() => setFormFor(null)} />}
              {isLast && settled && !!m.s?.length && (
                <div className="chat-chips" aria-label="Suggested questions">
                  {m.s.map((q) => (
                    <button key={q} type="button" className="chat-chip" onClick={() => ask(q, messages)}>
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </Fragment>
          );
        })}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>

      <form className="chat-input" onSubmit={submit}>
        <label className="sr-only" htmlFor="lw-chat-text">
          Your message
        </label>
        <textarea
          id="lw-chat-text"
          ref={input}
          rows={1}
          value={draft}
          maxLength={MAX_INPUT}
          placeholder="Type your question..."
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          enterKeyHint="send"
          autoComplete="off"
        />
        {busy ? (
          <button type="button" className="chat-send is-stop" onClick={() => abort.current?.abort()} aria-label="Stop the answer">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="7" y="7" width="10" height="10" rx="2" />
            </svg>
          </button>
        ) : (
          <button type="submit" className="chat-send" disabled={!draft.trim()} aria-label="Send">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 19V5M6 11l6-6 6 6" />
            </svg>
          </button>
        )}
      </form>
      <p className="chat-note">
        AI answers can be wrong. For anything important, <Link href="/contact" onClick={closeOnPhone(onClose)}>contact the team</Link>.
      </p>
    </div>
  );
}

/** On a phone the panel covers the page, so following a link closes it; on a desktop it stays open beside the page. */
const closeOnPhone = (onClose: () => void) => () => {
  if (window.matchMedia("(max-width: 47.99rem)").matches) onClose();
};

/** The answer's light markdown (paragraphs, lists, **bold**, links to our own pages) as React elements, never HTML. */
function Rich({ text, onNavigate }: { text: string; onNavigate: () => void }) {
  const blocks: ReactNode[] = [];
  const lines = text.split(/\r?\n/);
  let para: string[] = [];
  let items: string[] = [];
  let ordered = false;
  const flushPara = () => {
    if (para.length) blocks.push(<p key={blocks.length}>{inline(para.join(" "), onNavigate)}</p>);
    para = [];
  };
  const flushList = () => {
    if (items.length) {
      const children = items.map((t, i) => <li key={i}>{inline(t, onNavigate)}</li>);
      blocks.push(ordered ? <ol key={blocks.length}>{children}</ol> : <ul key={blocks.length}>{children}</ul>);
    }
    items = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      flushPara();
      if (items.length && ordered !== !!numbered) flushList();
      ordered = !!numbered;
      items.push((bullet || numbered)![1]);
    } else if (!line) {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line.replace(/^#+\s*/, ""));
    }
  }
  flushPara();
  flushList();
  return <>{blocks}</>;
}

const SAFE_PATH = /^\/(?:(?:services|work)(?:\/[a-z0-9-]+)?|ai-audit|about|privacy|contact(?:\?topic=[a-z-]+)?)?$/;

function inline(text: string, onNavigate: () => void): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let at = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > at) out.push(text.slice(at, m.index));
    if (m[1]) out.push(<strong key={m.index}>{m[1]}</strong>);
    else {
      // only our own pages become links; anything else stays as its words
      const href = m[3].replace(/^https?:\/\/[^/]*literaryworx?\.com/i, "") || "/";
      out.push(
        SAFE_PATH.test(href) ? (
          <Link key={m.index} href={href} onClick={onNavigate}>
            {m[2]}
          </Link>
        ) : (
          m[2]
        ),
      );
    }
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}

type FormState = "idle" | "sending" | "sent" | "error";

/** "Ask us to contact you": the same inquiry the contact page sends, with this conversation attached for context. */
function LeadForm({ messages, topic, onCancel }: { messages: Msg[]; topic: string; onCancel: () => void }) {
  const [state, setState] = useState<FormState>("idle");
  const [note, setNote] = useState("");
  const first = useRef<HTMLInputElement>(null);
  const id = useId();

  useEffect(() => {
    first.current?.focus({ preventScroll: true });
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "sending") return;
    const data = new FormData(e.currentTarget);
    const help = String(data.get("message") || "").trim();
    setState("sending");
    setNote("");
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          company: data.get("company"),
          interest: topic,
          message: help.length >= 10 ? help : `Sent from the website assistant.${help ? ` ${help}` : ""}`,
          website: data.get("website"),
          conversation: messages.filter((m) => !m.error).slice(-20).map(({ role, content }) => ({ role, content })),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setState("error");
        setNote(json.message || "Something went wrong. Please try again.");
        return;
      }
      setState("sent");
    } catch {
      setState("error");
      setNote("We could not reach the server. Please try again in a moment.");
    }
  }

  if (state === "sent")
    return (
      <div className="chat-card is-done" role="status">
        <p className="chat-card-title">Thank you. Your details are with the team.</p>
        <p>We will reply by email, usually within one business day.</p>
      </div>
    );

  return (
    <form className="chat-card chat-form" onSubmit={onSubmit} aria-labelledby={`${id}-t`}>
      <p className="chat-card-title" id={`${id}-t`}>
        Ask us to contact you
      </p>
      <label className="sr-only" htmlFor={`${id}-n`}>
        Name (required)
      </label>
      <input ref={first} id={`${id}-n`} name="name" placeholder="Name *" autoComplete="name" required minLength={2} maxLength={120} />
      <label className="sr-only" htmlFor={`${id}-e`}>
        Work email (required)
      </label>
      <input id={`${id}-e`} name="email" type="email" placeholder="Work email *" autoComplete="email" required maxLength={254} />
      <label className="sr-only" htmlFor={`${id}-c`}>
        Company (optional)
      </label>
      <input id={`${id}-c`} name="company" placeholder="Company" autoComplete="organization" maxLength={120} />
      <label className="sr-only" htmlFor={`${id}-m`}>
        How can we help? (optional)
      </label>
      <textarea id={`${id}-m`} name="message" placeholder="How can we help?" rows={3} maxLength={5000} />
      <div className="chat-hp" aria-hidden="true">
        <label htmlFor={`${id}-w`}>Website</label>
        <input id={`${id}-w`} name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <p className="chat-small">
        We use these details and this conversation only to reply to you. See our <Link href="/privacy">privacy policy</Link>.
      </p>
      {note && (
        <p className="chat-form-error" role="alert">
          {note}
        </p>
      )}
      <div className="chat-form-row">
        <button type="button" className="chat-btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="chat-btn is-primary" disabled={state === "sending"}>
          {state === "sending" ? "Sending..." : "Send"}
        </button>
      </div>
    </form>
  );
}
