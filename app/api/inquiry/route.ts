import { NextResponse } from "next/server";
import { topics } from "@/lib/topics";

type Inquiry = { name: string; email: string; company: string; interest: string; message: string };

const allowedInterests = new Set<string>(topics.map((t) => t.value));
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max + 1) : "");
const fail = (message: string, status: number, headers?: Record<string, string>) => NextResponse.json({ message }, { status, headers });

/**
 * A small, best-effort limit: 8 requests per ten minutes from one address, counted in memory. On a long-running
 * server that is a real limit; on a serverless host every instance keeps its own count, so use the platform's rate
 * limiting for a hard one.
 */
const WINDOW_MS = 10 * 60_000;
const LIMIT = 8;
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

export async function POST(request: Request) {
  if (limited(addressOf(request))) return fail("Too many messages from this address. Please try again in a few minutes.", 429, { "Retry-After": "600" });

  // a form message is small: refuse anything large before reading it
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 20_000) return fail("That message is too long.", 413);

  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return fail("Please provide a valid inquiry.", 400);
  }
  if (!input || typeof input !== "object" || Array.isArray(input)) return fail("Please provide a valid inquiry.", 400);

  // honeypot: bots fill the hidden field; answer as if it worked and deliver nothing
  if (clean(input.website, 200)) return NextResponse.json({ message: "Thank you." }, { status: 200 });

  const inquiry: Inquiry = {
    name: clean(input.name, 120),
    email: clean(input.email, 254),
    company: clean(input.company, 120),
    interest: clean(input.interest, 80),
    message: clean(input.message, 5000),
  };
  if (
    inquiry.name.length < 2 ||
    inquiry.name.length > 120 ||
    !emailRe.test(inquiry.email) ||
    inquiry.email.length > 254 ||
    inquiry.company.length > 120 ||
    !allowedInterests.has(inquiry.interest) ||
    inquiry.message.length < 10 ||
    inquiry.message.length > 5000
  ) {
    return fail("Please complete all required fields with valid information.", 400);
  }

  const { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = process.env;
  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL) {
    return fail("Our inquiry inbox is not configured yet. Please try again later.", 503);
  }

  // untrusted text goes into a plain-text email, never into HTML
  const text = `New LiteraryWorks inquiry\n\nName: ${inquiry.name}\nEmail: ${inquiry.email}\nCompany: ${inquiry.company || "Not provided"}\nInterest: ${inquiry.interest}\n\nMessage:\n${inquiry.message}`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL,
        to: [CONTACT_TO_EMAIL],
        subject: `LiteraryWorks inquiry: ${inquiry.interest}`,
        text,
        reply_to: inquiry.email,
      }),
      cache: "no-store",
    });
    if (!response.ok) return fail("We could not deliver your message. Please try again later.", 502);
    return NextResponse.json({ message: "Message sent." }, { status: 200 });
  } catch {
    return fail("We could not reach our email service. Please try again later.", 502);
  }
}
