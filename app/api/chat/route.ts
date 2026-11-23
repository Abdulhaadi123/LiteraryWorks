import { NextResponse } from "next/server";
import { instructions, META_CLOSE, META_OPEN } from "@/lib/chat/prompt";

/**
 * The website assistant. It streams the answer from OpenAI's Responses API
 * (https://platform.openai.com/docs/api-reference/responses) to the browser as newline-delimited JSON:
 *   {"t":"d","v":"..."}                    a piece of the answer
 *   {"t":"m","s":["..."],"a":"book"}      follow-up suggestions and the suggested action, once, at the end
 *   {"t":"e","m":"..."}                    the answer could not be finished
 * The key never leaves the server, nothing is stored (store: false), and the instructions plus the site knowledge
 * form one fixed prefix, which OpenAI caches: a faster first word and a lower cost.
 */

export const dynamic = "force-dynamic";

const MAX_TURNS = 12; // messages of history sent to the model
const MAX_USER = 800; // characters in one visitor message
const MAX_ASSISTANT = 2400;
const MAX_TOTAL = 14_000;

const fail = (message: string, status: number, headers?: Record<string, string>) => NextResponse.json({ message }, { status, headers });

/** Best-effort, in-memory: 24 messages per ten minutes from one address (each serverless instance counts on its own). */
const WINDOW_MS = 10 * 60_000;
const LIMIT = 24;
const hits = new Map<string, number[]>();
function limited(address: string, now = Date.now()) {
  const recent = (hits.get(address) ?? []).filter((t) => now - t < WINDOW_MS);
  const over = recent.length >= LIMIT;
  if (!over) recent.push(now);
  hits.set(address, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  return over;
}
const addressOf = (request: Request) => (request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown").trim().slice(0, 64);

type Turn = { role: "user" | "assistant"; content: string };

function readTurns(input: unknown): Turn[] | null {
  if (!input || typeof input !== "object" || !Array.isArray((input as { messages?: unknown }).messages)) return null;
  const raw = (input as { messages: unknown[] }).messages;
  if (raw.length < 1 || raw.length > 60) return null;
  const turns: Turn[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const text = content.trim();
    if (!text) continue;
    if (text.length > (role === "user" ? MAX_USER : MAX_ASSISTANT)) return null;
    turns.push({ role, content: text });
  }
  const recent = turns.slice(-MAX_TURNS);
  while (recent.length && recent[0].role !== "user") recent.shift();
  if (!recent.length || recent[recent.length - 1].role !== "user") return null;
  if (recent.reduce((n, t) => n + t.content.length, 0) > MAX_TOTAL) return null;
  return recent;
}

/** A request from another website (a browser always sends Origin on a cross-site POST) is refused. */
function sameSite(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === (request.headers.get("x-forwarded-host") || request.headers.get("host"));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameSite(request)) return fail("Not allowed.", 403);
  if (limited(addressOf(request))) return fail("You have sent a lot of messages. Please wait a few minutes and try again.", 429, { "Retry-After": "600" });
  if (Number(request.headers.get("content-length") ?? 0) > 64_000) return fail("That conversation is too long. Please start a new chat.", 413);

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return fail("Please send a valid message.", 400);
  }
  const turns = readTurns(input);
  if (!turns) return fail(`Please keep each message under ${MAX_USER} characters.`, 400);

  const key = process.env.OPENAI_API_KEY;
  if (!key) return fail("The assistant is not available right now. Please use the contact form.", 503);
  const base = (process.env.OPENAI_API_BASE || "https://api.openai.com").replace(/\/+$/, "");
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const effort = process.env.OPENAI_REASONING_EFFORT;

  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(45_000)]);
  let upstream: Response;
  try {
    upstream = await fetch(`${base}/v1/responses`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        instructions,
        input: turns,
        stream: true,
        store: false,
        max_output_tokens: Number(process.env.OPENAI_MAX_OUTPUT_TOKENS) || 700,
        prompt_cache_key: "literaryworks-assistant",
        ...(effort ? { reasoning: { effort } } : {}),
      }),
      cache: "no-store",
      signal,
    });
  } catch (error) {
    console.error("OpenAI could not be reached:", error instanceof Error ? error.message : error);
    return fail("The assistant could not be reached. Please try again in a moment.", 502);
  }
  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.error(`OpenAI refused the chat request: ${upstream.status} ${detail.slice(0, 500)}`);
    const busy = upstream.status === 429;
    return fail(busy ? "The assistant is busy right now. Please try again in a moment." : "The assistant could not answer. Please try again in a moment.", busy ? 503 : 502);
  }

  return new Response(relay(upstream.body), {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

type Meta = { s: string[]; a: "book" | "contact" | "none" };

/** Turns OpenAI's event stream into ours: the answer text without the meta line, then the meta as data. */
function relay(body: ReadableStream<Uint8Array>) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  let sent = 0;
  let finished = false;
  const reader = body.getReader();

  /** The part of the answer that is safe to show: up to the meta line, holding back anything that may start it. */
  const visible = () => {
    const at = full.indexOf(META_OPEN);
    if (at >= 0) return full.slice(0, at).trimEnd();
    for (let n = Math.min(META_OPEN.length - 1, full.length); n > 0; n--) if (META_OPEN.startsWith(full.slice(-n))) return full.slice(0, -n);
    return full;
  };

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (o: object) => controller.enqueue(encoder.encode(JSON.stringify(o) + "\n"));
      const flush = () => {
        const v = visible();
        if (v.length > sent) {
          send({ t: "d", v: v.slice(sent) });
          sent = v.length;
        }
      };
      try {
        while (!finished) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buffer.indexOf("\n")) >= 0) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            let event: { type?: string; delta?: string; error?: { message?: string }; response?: { error?: { message?: string } } };
            try {
              event = JSON.parse(data);
            } catch {
              continue;
            }
            if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
              full += event.delta;
              flush();
            } else if (event.type === "response.completed" || event.type === "response.incomplete") {
              finished = true;
            } else if (event.type === "response.failed" || event.type === "error") {
              console.error("OpenAI stopped the answer:", event.error?.message || event.response?.error?.message || event.type);
              throw new Error("failed");
            }
          }
        }
        // the full answer: show what is left (an answer cut short by the length cap still ends cleanly)
        const at = full.indexOf(META_OPEN);
        const text = (at >= 0 ? full.slice(0, at) : full).trimEnd();
        if (text.length > sent) send({ t: "d", v: text.slice(sent) });
        if (!text) throw new Error("empty");
        send({ t: "m", ...readMeta(at >= 0 ? full.slice(at) : "") });
      } catch {
        send({ t: "e", m: "The answer was cut off. Please try again." });
      } finally {
        reader.cancel().catch(() => {});
        try {
          controller.close();
        } catch {}
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });
}

function readMeta(line: string): Meta {
  const json = line.slice(META_OPEN.length).split(META_CLOSE)[0]?.trim();
  try {
    const m = JSON.parse(json) as { s?: unknown; a?: unknown };
    const s = Array.isArray(m.s)
      ? m.s
          .filter((x): x is string => typeof x === "string")
          .map((x) => x.replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, 70))
          .filter(Boolean)
          .slice(0, 3)
      : [];
    const a = m.a === "book" || m.a === "contact" ? m.a : "none";
    return { s, a };
  } catch {
    return { s: [], a: "none" };
  }
}
