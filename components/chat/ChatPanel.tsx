"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { Mark } from "@/components/Logo";
import { balosys } from "@/lib/site";
import { services } from "@/lib/services";
import { topics } from "@/lib/topics";

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

/** What the visitor most likely wants to talk about, from the page they are on (a service page names its service). */
function topicHere(): string {
  const path = window.location.pathname;
  const slug = path.match(/^\/services\/([a-z0-9-]+)/)?.[1];
  const hit = slug ? topics.find((t) => t.key === slug) : undefined;
  if (hit) return hit.value;
  return path.startsWith("/ai-audit") ? "Free AI audit" : "Something else";
}

/** A link to the contact page in an answer: /contact, or /contact?topic=<key> (the form opens with that topic chosen). */
const contactTopic = (href: string): string | null => {
  const m = href.match(/^\/contact(?:\?topic=([a-z-]+))?$/);
  if (!m) return null;
  return topics.find((t) => t.key === m[1])?.value ?? "Something else";
};

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
  // the contact form inside the conversation (open, with the topic it starts on), so nobody has to leave to write to the team
  const [form, setForm] = useState<{ topic: string; n: number } | null>(null);
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
  }, [messages, form]);

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
      setForm(null);
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
    setForm(null);
    setDraft("");
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch {}
    input.current?.focus();
  };

  const openForm = (topic?: string) => {
    pinned.current = true;
    setForm({ topic: topic ?? topicHere(), n: Date.now() });
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
        <button type="button" className="chat-icon-btn" onClick={() => openForm()} aria-label="Message the team" title="Message the team">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6.5h16v11H4zM4.5 7l7.5 6 7.5-6" />
          </svg>
        </button>
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
                          <button type="button" className="chat-linkbtn" onClick={() => openForm()}>
                            Write to us here
                          </button>
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
                      <Rich text={m.content} onNavigate={closeOnPhone(onClose)} onContact={openForm} />
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
              {isLast && settled && (m.a === "book" || m.a === "contact") && !form && (
                <div className="chat-card">
                  <p className="chat-card-title">Talk to the LiteraryWorks team</p>
                  <button type="button" className="chat-btn is-primary" onClick={() => openForm("Free AI audit")}>
                    Book a free AI audit
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </button>
                  <button type="button" className="chat-btn" onClick={() => openForm(m.a === "book" ? "Free AI audit" : "Something else")}>
                    Ask us to contact you
                  </button>
                </div>
              )}
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

        {form && <LeadForm key={form.n} messages={messages} topic={form.topic} onCancel={() => setForm(null)} />}
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
        AI answers can be wrong. For anything important,{" "}
        <button type="button" className="chat-linkbtn" onClick={() => openForm()}>
          message the team here
        </button>
        .
      </p>
    </div>
  );
}

/** On a phone the panel covers the page, so following a link closes it; on a desktop it stays open beside the page. */
const closeOnPhone = (onClose: () => void) => () => {
  if (window.matchMedia("(max-width: 47.99rem)").matches) onClose();
};

/** The answer's light markdown (paragraphs, lists, **bold**, links to our own pages) as React elements, never HTML. */
function Rich({ text, onNavigate, onContact }: { text: string; onNavigate: () => void; onContact: (topic?: string) => void }) {
  const blocks: ReactNode[] = [];
  const lines = text.split(/\r?\n/);
  let para: string[] = [];
  let items: string[] = [];
  let ordered = false;
  const flushPara = () => {
    if (para.length) blocks.push(<p key={blocks.length}>{inline(para.join(" "), onNavigate, onContact)}</p>);
    para = [];
  };
  const flushList = () => {
    if (items.length) {
      const children = items.map((t, i) => <li key={i}>{inline(t, onNavigate, onContact)}</li>);
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

/** The only other websites a link may point to: our own products' (the assistant may name them; nothing else becomes a link). */
const OUTSIDE_HOSTS = [new URL(balosys.url).host.replace(/^www\./, "")];
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** The address of a link to one of those websites (https only, no login in it), or null. */
const outsideUrl = (href: string): string | null => {
  try {
    const u = new URL(/^https?:\/\//i.test(href) ? href : `https://${href}`);
    return u.protocol === "https:" && !u.username && OUTSIDE_HOSTS.includes(u.host.replace(/^www\./, "")) ? u.href : null;
  } catch {
    return null;
  }
};
/** The words of such a link: the domain (and path), without the https:// and a closing slash: balosys.com */
const outsideLabel = (href: string) => href.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
/** A bare mention of one of those websites in the text (balosys.com, www.balosys.com, https://balosys.com/ ...). */
const OUTSIDE_MENTION = `(?:https?:\\/\\/)?(?:www\\.)?(?:${OUTSIDE_HOSTS.map(escapeRe).join("|")})(?:\\/[^\\s)<]*)?`;

/** A link to one of those websites: it opens in a new tab and says so for assistive technology. */
function Outside({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

const SAFE_PATH = /^\/(?:(?:services|work)(?:\/[a-z0-9-]+)?|ai-audit|about|privacy|contact(?:\?topic=[a-z-]+)?)?$/;

/** A page's address written out in the text (/contact, /ai-audit, /work/some-project): it is shown by name, never as a path. */
const BARE_PATH = "\\/(?:contact(?:\\?topic=[a-z-]+)?|ai-audit|about|privacy|work(?:\\/[a-z0-9-]+)?|services(?:\\/[a-z0-9-]+)?)";

/** The words for one of our pages: what a visitor reads instead of its address. */
function pathWords(href: string): string {
  const path = href.split("?")[0].replace(/\/$/, "");
  if (path === "/contact") return "contact form";
  if (path === "/ai-audit") return "free AI audit";
  if (path === "/about") return "about page";
  if (path === "/privacy") return "privacy policy";
  if (path === "/work") return "case studies";
  if (path.startsWith("/work/")) return "this case study";
  if (path === "/services") return "services";
  const service = services.find((s) => path === `/services/${s.slug}`);
  if (service) return service.name;
  return "this page";
}

function inline(text: string, onNavigate: () => void, onContact: (topic?: string) => void): ReactNode[] {
  const out: ReactNode[] = [];
  const re = new RegExp(`\\*\\*([^*]+)\\*\\*|\\[([^\\]]+)\\]\\(([^)\\s]+)\\)|(${OUTSIDE_MENTION})|(${BARE_PATH})`, "gi");
  let at = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    // a mention that is part of a longer word or address (notbalosys.com, balosys.com.other.example, someone@balosys.com) is not ours
    if (m[4] && ((m.index > 0 && /[\w@./-]/.test(text[m.index - 1])) || /^(?:[\w@-]|\.\w)/.test(text.slice(m.index + m[0].length, m.index + m[0].length + 2)))) continue;
    // the same for a page's address: only on its own (after a space or a bracket, not followed by more of a word or path)
    if (m[5] && ((m.index > 0 && !/[\s(["'“,:;]/.test(text[m.index - 1])) || /^[\w/-]/.test(text.slice(m.index + m[0].length, m.index + m[0].length + 1)))) continue;
    if (m.index > at) out.push(text.slice(at, m.index));
    if (m[1]) out.push(<strong key={m.index}>{m[1]}</strong>);
    else if (m[4]) {
      // one of our products' websites written out in the text: a link, with the full stop or comma that ends the sentence left outside it
      const trail = m[4].match(/[.,;:!?)\]]+$/)?.[0] ?? "";
      const written = trail ? m[4].slice(0, -trail.length) : m[4];
      const url = outsideUrl(written);
      out.push(
        url ? (
          <Outside key={m.index} href={url}>
            {outsideLabel(written)}
          </Outside>
        ) : (
          written
        ),
      );
      if (trail) out.push(trail);
    } else {
      // only our own pages (and our products' websites) become links; anything else stays as its words
      const href = m[5] ?? (m[3].replace(/^https?:\/\/[^/]*literaryworx?\.com/i, "") || "/");
      // the words of the link are never a page's address: /contact is shown as "contact form", and still goes there
      const label = m[5] || /^\s*(?:https?:\/\/[^/\s]*literaryworx?\.com)?\/[\w?=&/-]*\s*$/i.test(m[2]) ? pathWords(href) : m[2];
      const topic = contactTopic(href);
      const outside = m[5] ? null : outsideUrl(m[3]);
      out.push(
        outside ? (
          <Outside key={m.index} href={outside}>
            {m[2]}
          </Outside>
        ) : topic ? (
          // a link to the contact page opens the form here, in the conversation (the address stays for a new tab)
          <Link
            key={m.index}
            href={href}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              onContact(topic);
            }}
          >
            {label}
          </Link>
        ) : SAFE_PATH.test(href) ? (
          <Link key={m.index} href={href} onClick={onNavigate}>
            {label}
          </Link>
        ) : (
          label
        ),
      );
    }
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}

type FormState = "idle" | "sending" | "sent" | "error";

/** The contact form, inside the conversation: the same inquiry the contact page sends, with this conversation attached for context. */
function LeadForm({ messages, topic: start, onCancel }: { messages: Msg[]; topic: string; onCancel: () => void }) {
  const [state, setState] = useState<FormState>("idle");
  const [note, setNote] = useState("");
  const [topic, setTopic] = useState(start);
  const first = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLFormElement>(null);
  const id = useId();
  // with no conversation to send along, the visitor says what they need; after a conversation it is optional
  const talked = messages.some((m) => !m.error);

  useEffect(() => {
    first.current?.focus({ preventScroll: true });
    root.current?.scrollIntoView({ block: "nearest" });
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
    <form ref={root} className="chat-card chat-form" onSubmit={onSubmit} aria-labelledby={`${id}-t`}>
      <p className="chat-card-title" id={`${id}-t`}>
        Message the team
      </p>
      <p className="chat-small">Tell us who you are and what you need. We reply by email, usually within one business day.</p>
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
      <label className="sr-only" htmlFor={`${id}-i`}>
        What do you need help with?
      </label>
      <select id={`${id}-i`} name="interest" value={topic} onChange={(e) => setTopic(e.target.value)}>
        {topics.map((t) => (
          <option key={t.key} value={t.value}>
            {t.value}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor={`${id}-m`}>
        {talked ? "How can we help? (optional)" : "How can we help? (required)"}
      </label>
      <textarea
        id={`${id}-m`}
        name="message"
        placeholder={talked ? "How can we help? (optional)" : "How can we help? *"}
        rows={3}
        maxLength={5000}
        required={!talked}
        minLength={talked ? undefined : 10}
      />
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
