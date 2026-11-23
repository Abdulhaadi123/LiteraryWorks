import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { instructions, META_CLOSE, META_OPEN, pageNote } from "@/lib/chat/prompt";

/**
 * The website assistant. It streams the answer from Claude (Anthropic's Messages API, through the official SDK) to the
 * browser as newline-delimited JSON:
 *   {"t":"d","v":"..."}                    a piece of the answer
 *   {"t":"m","s":["..."],"a":"book"}      follow-up suggestions and the suggested action, once, at the end
 *   {"t":"e","m":"..."}                    the answer could not be finished
 * The key never leaves the server. The instructions and the site knowledge are one fixed block that Anthropic caches
 * (a faster first word and a fraction of the cost); the page the visitor is on comes after it, so it never breaks
 * the cache.
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

/** The page the visitor is on (a path of this site), so "this service" means the right one; anything else is ignored. */
function readPage(input: unknown): string {
  const page = (input as { page?: unknown })?.page;
  return typeof page === "string" && /^\/[a-z0-9/-]{0,80}$/.test(page) ? page : "/";
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

let client: Anthropic | null = null;

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

  if (!process.env.ANTHROPIC_API_KEY) return fail("The assistant is not available right now. Please use the contact form.", 503);
  client ??= new Anthropic({ maxRetries: 1, timeout: 45_000 });

  const stream = client.beta.messages.stream(
    {
      model: process.env.ANTHROPIC_MODEL || "claude-opus-5-5",
      max_tokens: Number(process.env.ANTHROPIC_MAX_TOKENS) || 2000,
      // a short, direct answer: low effort keeps the first word fast (thinking is adaptive and stays brief)
      output_config: { effort: "low" },
      // if a safety check declines the request, Anthropic answers it with a fallback model instead of stopping
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [
        { type: "text", text: instructions, cache_control: { type: "ephemeral" } },
        { type: "text", text: pageNote(readPage(input)) },
      ],
      messages: turns,
    },
    { signal: request.signal },
  );

  // wait for the answer to start, so a refused or failed request gets a proper status instead of a broken stream
  const events = stream[Symbol.asyncIterator]();
  let first: IteratorResult<Anthropic.Beta.BetaRawMessageStreamEvent>;
  try {
    first = await events.next();
  } catch (error) {
    return failFor(error);
  }

  return new Response(relay(first, events, stream), {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

function failFor(error: unknown) {
  if (error instanceof Anthropic.RateLimitError) {
    console.error("Claude is rate limited:", error.message);
    return fail("The assistant is busy right now. Please try again in a moment.", 503);
  }
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    console.error("Claude refused the key:", error.status);
    return fail("The assistant is not available right now. Please use the contact form.", 503);
  }
  if (error instanceof Anthropic.APIError) {
    console.error(`Claude refused the chat request: ${error.status} ${error.message.slice(0, 300)}`);
    return fail("The assistant could not answer. Please try again in a moment.", 502);
  }
  console.error("Claude could not be reached:", error instanceof Error ? error.message : error);
  return fail("The assistant could not be reached. Please try again in a moment.", 502);
}

type Meta = { s: string[]; a: "book" | "contact" | "none" };

/**
 * Now and then a model starts its answer with a stray line of internal markup (a tag or a setting) before the real
 * answer. Such a line at the very start is dropped. Returns null while the start is still too short to tell.
 */
/** A line of internal markup: a tag such as <thinking> or <system>, or a setting such as reasoning_effort. Ordinary words never match. */
const junkLine = (line: string) => /^\s*<\/?\s*(antml:|thinking|system|instructions)\b/i.test(line) || /antml:|reasoning_effort/i.test(line);
function cleanHead(text: string): string | null {
  let t = text;
  for (;;) {
    const nl = t.indexOf("\n");
    const line = nl < 0 ? t : t.slice(0, nl);
    if (!junkLine(line)) break;
    if (nl < 0) return null; // the stray line has not ended yet
    t = t.slice(nl + 1);
  }
  const start = t.trimStart();
  // too short to know whether it is the start of such a line
  const low = start.toLowerCase();
  if (start.length < 16 && (start.startsWith("<") || "antml:".startsWith(low.slice(0, 6)) || "reasoning_effort".startsWith(low))) return null;
  return start;
}

/** Turns Claude's event stream into ours: the answer text without the meta line, then the meta as data. */
function relay(
  first: IteratorResult<Anthropic.Beta.BetaRawMessageStreamEvent>,
  events: AsyncIterator<Anthropic.Beta.BetaRawMessageStreamEvent>,
  stream: ReturnType<Anthropic["beta"]["messages"]["stream"]>,
) {
  const encoder = new TextEncoder();
  let full = "";
  let sent = 0;

  /** The part of the answer that is safe to show: up to the meta line, holding back anything that may start it. */
  const visible = () => {
    const body = cleanHead(full);
    if (body === null) return "";
    const at = body.indexOf(META_OPEN);
    if (at >= 0) return body.slice(0, at).trimEnd();
    for (let n = Math.min(META_OPEN.length - 1, body.length); n > 0; n--) if (META_OPEN.startsWith(body.slice(-n))) return body.slice(0, -n);
    return body;
  };

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      // the visitor may close the chat mid-answer: writing to a cancelled stream throws, and that is fine
      const send = (o: object) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(o) + "\n"));
        } catch {}
      };
      const take = (event: Anthropic.Beta.BetaRawMessageStreamEvent) => {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          full += event.delta.text;
          const v = visible();
          if (v.length > sent) {
            send({ t: "d", v: v.slice(sent) });
            sent = v.length;
          }
        }
      };
      try {
        if (!first.done) take(first.value);
        for (let r = await events.next(); !r.done; r = await events.next()) take(r.value);
        const message = await stream.finalMessage();
        // (opt in with CHAT_LOG_USAGE=1: what each answer cost, and whether the cached block was read; never the text)
        if (process.env.CHAT_LOG_USAGE === "1") {
          const u = message.usage;
          console.info(`[chat] ${message.model} in=${u.input_tokens} cache_read=${u.cache_read_input_tokens ?? 0} cache_write=${u.cache_creation_input_tokens ?? 0} out=${u.output_tokens} stop=${message.stop_reason}`);
        }
        if (message.stop_reason === "refusal") {
          send({ t: "e", m: "I can only help with questions about LiteraryWorks and our work. Please try another question, or contact the team." });
          return;
        }
        const body = cleanHead(full + "\n") ?? "";
        const at = body.indexOf(META_OPEN);
        const text = (at >= 0 ? body.slice(0, at) : body).trimEnd();
        if (text.length > sent) send({ t: "d", v: text.slice(sent) });
        if (!text) throw new Error("empty");
        send({ t: "m", ...readMeta(at >= 0 ? body.slice(at) : "") });
      } catch (error) {
        if (!stream.aborted) {
          console.error("Claude stopped the answer:", error instanceof Error ? error.message : error);
          send({ t: "e", m: "The answer was cut off. Please try again." });
        }
      } finally {
        try {
          controller.close();
        } catch {}
      }
    },
    cancel() {
      stream.abort();
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
