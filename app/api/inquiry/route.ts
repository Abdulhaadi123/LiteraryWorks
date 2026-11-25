import { NextResponse } from "next/server";
import { markNotified, saveInquiry, storeReady, type StoredInquiry } from "@/lib/admin/inquiries";
import { clientCountry, clientIp } from "@/lib/request";
import { topics } from "@/lib/topics";
import { confirmationEmail, oneLine, teamEmail, type ChatTurn, type Inquiry } from "@/lib/mail/inquiry-email";

const allowedInterests = new Set<string>(topics.map((t) => t.value));
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max + 1) : "");
/** The website-assistant conversation sent with a chat inquiry: at most 20 turns, each kept short. */
function readConversation(value: unknown): ChatTurn[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const turns = value
    .slice(-20)
    .filter((t): t is ChatTurn => !!t && typeof t === "object" && (t.role === "user" || t.role === "assistant") && typeof t.content === "string")
    .map((t) => ({ role: t.role, content: t.content.trim().slice(0, 2400) }))
    .filter((t) => t.content);
  return turns.length ? turns : undefined;
}
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
const addressOf = (request: Request) => clientIp(request.headers);

export async function POST(request: Request) {
  if (limited(addressOf(request))) return fail("Too many messages from this address. Please try again in a few minutes.", 429, { "Retry-After": "600" });

  // a form message is small: refuse anything large before reading it
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 80_000) return fail("That message is too long.", 413);

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
    conversation: readConversation(input.conversation),
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

  const { SENDGRID_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL } = process.env;
  const emailOn = !!(SENDGRID_API_KEY && CONTACT_TO_EMAIL && CONTACT_FROM_EMAIL);
  const inboxOn = storeReady();
  if (!emailOn && !inboxOn) {
    return fail("Our inquiry inbox is not configured yet. Please try again later.", 503);
  }

  // 1. the message is kept in the admin inbox first (it is quick, and then it is safe whatever happens to the e-mail)
  let saved: StoredInquiry | null = null;
  if (inboxOn) {
    try {
      saved = await saveInquiry({ ...inquiry, notified: emailOn ? false : null, country: clientCountry(request.headers) });
    } catch (error) {
      console.error("The inquiry could not be saved to the admin inbox:", error instanceof Error ? error.message : error);
    }
  }

  // 2. the team is told by e-mail. When the inbox has the message, a failed e-mail no longer loses it.
  let notified = false;
  let sent: "ok" | "refused" | "unreachable" = "ok";
  const fromName = process.env.CONTACT_FROM_NAME || "Literary Worx";
  const team = (CONTACT_TO_EMAIL ?? "").split(",").map((e) => e.trim()).filter(Boolean);
  if (emailOn) {
    const notice = teamEmail(inquiry);
    sent = await sendMail(SENDGRID_API_KEY!, {
      to: team,
      from: { email: CONTACT_FROM_EMAIL!, name: `${fromName} website` },
      replyTo: { email: inquiry.email, name: oneLine(inquiry.name) },
      ...notice,
      category: "inquiry",
    });
    notified = sent === "ok";
    if (saved && notified) await markNotified(saved.id, true).catch(() => {});
  }

  // the message counts as received once the inbox or the e-mail has it
  if (!saved && !notified) {
    if (!emailOn) return fail("We could not save your message. Please try again later.", 503);
    if (sent === "unreachable") return fail("We could not reach our email service. Please try again later.", 502);
    return fail("We could not deliver your message. Please try again later.", 502);
  }

  // the confirmation to the visitor is a courtesy: if it fails, their message has still reached us
  if (emailOn && process.env.CONTACT_SEND_CONFIRMATION !== "false") {
    const reply = confirmationEmail(inquiry, process.env.CONTACT_REPLY_EMAIL || team[0]);
    await sendMail(SENDGRID_API_KEY!, {
      to: [inquiry.email],
      from: { email: CONTACT_FROM_EMAIL!, name: fromName },
      replyTo: { email: process.env.CONTACT_REPLY_EMAIL || team[0], name: fromName },
      ...reply,
      category: "inquiry-confirmation",
    });
  }
  return NextResponse.json({ message: "Message sent." }, { status: 200 });
}

type Mail = {
  to: string[];
  from: { email: string; name: string };
  replyTo: { email: string; name: string };
  subject: string;
  html: string;
  text: string;
  category: string;
};

/**
 * One email through SendGrid's v3 Mail Send API (https://www.twilio.com/docs/sendgrid/api-reference/mail-send).
 * SENDGRID_API_BASE switches the region (https://api.eu.sendgrid.com for EU data residency). Click and open tracking
 * are off: links stay as written and no tracking pixel is added. Success is 202 Accepted.
 */
async function sendMail(key: string, m: Mail): Promise<"ok" | "refused" | "unreachable"> {
  const base = (process.env.SENDGRID_API_BASE || "https://api.sendgrid.com").replace(/\/+$/, "");
  try {
    const response = await fetch(`${base}/v3/mail/send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: m.to.map((email) => ({ email })) }],
        from: m.from,
        reply_to: m.replyTo,
        subject: m.subject,
        content: [
          { type: "text/plain", value: m.text },
          { type: "text/html", value: m.html },
        ],
        categories: [m.category],
        tracking_settings: { click_tracking: { enable: false, enable_text: false }, open_tracking: { enable: false } },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) return "ok";
    // SendGrid explains a refusal in its body; log the reason (never the key or the visitor's message)
    const detail = await response.text().catch(() => "");
    console.error(`SendGrid refused the ${m.category} email: ${response.status} ${detail.slice(0, 500)}`);
    return "refused";
  } catch (error) {
    console.error(`SendGrid could not be reached for the ${m.category} email:`, error instanceof Error ? error.message : error);
    return "unreachable";
  }
}
