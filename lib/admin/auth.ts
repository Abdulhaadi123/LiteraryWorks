import { base32Decode, decoyHash, isPasswordHash, randomToken, safeEqual, sha256, sign, totpMatch, unsign, verifyPassword } from "./crypto";
import { cmd, getKv, pipe, storeKind, StoreError } from "./kv";

/**
 * Signing in to the admin area.
 *
 *  - One owner account: ADMIN_EMAIL, ADMIN_PASSWORD_HASH (a scrypt hash, made by `npm run admin:setup`) and
 *    optionally ADMIN_TOTP_SECRET (two-step sign-in with an authenticator app). Nothing is stored in plain text.
 *  - Sign-in is one form (e-mail, password, code) with one answer for every kind of failure, so it does not say
 *    which part was wrong. A wrong e-mail address still costs a full password check (no timing difference).
 *  - Attempts are limited per address (8 in 15 minutes) and for the account as a whole (30 an hour); the counters
 *    live in the store, so the limit holds across every server instance.
 *  - A code can be used once (replay guard). Every sign-in, failure, block and sign-out is written to a log the
 *    Security page shows.
 *  - The session is a signed cookie (HttpOnly, SameSite=Strict, Secure on https) that expires on its own (8 hours by
 *    default), and it can be ended early: one sign-out ends that session, "sign out everywhere" ends all of them.
 */

export const COOKIE = process.env.NODE_ENV === "production" ? "__Host-lw_admin" : "lw_admin";

const env = (name: string) => (process.env[name] ?? "").trim();

export function sessionHours(): number {
  const n = Number(env("ADMIN_SESSION_HOURS"));
  return Number.isFinite(n) && n >= 1 && n <= 72 ? n : 8;
}

export type AdminStatus = {
  ready: boolean;
  /** What is still to set up (names of settings), when not ready. */
  missing: string[];
  twoFactor: boolean;
  storage: "redis" | "file" | null;
};

export function adminStatus(): AdminStatus {
  const missing: string[] = [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env("ADMIN_EMAIL"))) missing.push("ADMIN_EMAIL");
  if (!isPasswordHash(env("ADMIN_PASSWORD_HASH"))) missing.push("ADMIN_PASSWORD_HASH");
  if (env("ADMIN_SESSION_SECRET").length < 32) missing.push("ADMIN_SESSION_SECRET");
  const totp = env("ADMIN_TOTP_SECRET");
  const bytes = totp ? base32Decode(totp) : null;
  if (totp && (!bytes || bytes.length < 10)) missing.push("ADMIN_TOTP_SECRET");
  const storage = storeKind();
  if (!storage) missing.push("a store (Redis: KV_REST_API_URL and KV_REST_API_TOKEN)");
  return { ready: missing.length === 0, missing, twoFactor: !!totp && !missing.includes("ADMIN_TOTP_SECRET"), storage };
}

// ---------------------------------------------------------------------------------------------------------------------
// who is asking
// ---------------------------------------------------------------------------------------------------------------------

/** The visitor's address. Behind Vercel the platform sets these headers itself, so they cannot be forged. */
export function clientIp(headers: Headers): string {
  const raw = headers.get("x-vercel-forwarded-for") || headers.get("x-real-ip") || headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  return raw.trim().slice(0, 64) || "unknown";
}

/** True when the request comes from a page of this same site (the Origin header is the site's own host). */
export function sameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  const host = headers.get("x-forwarded-host") || headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host.split(",")[0].trim();
  } catch {
    return false;
  }
}

/** "Chrome on Windows" from a User-Agent string. */
export function describeAgent(ua: string): string {
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\/|CriOS\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "";
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad|iOS/.test(ua) ? "iOS" : /Mac OS X|Macintosh/.test(ua) ? "macOS" : /Linux|X11/.test(ua) ? "Linux" : "";
  return browser && os ? `${browser} on ${os}` : browser || os || "Unknown device";
}

// ---------------------------------------------------------------------------------------------------------------------
// the log
// ---------------------------------------------------------------------------------------------------------------------

export type AuditKind = "signin" | "failed" | "blocked" | "signout" | "signout_all";
export type AuditEvent = { t: number; kind: AuditKind; ip: string; ua: string; detail?: string };
const LOG = "lw:auth:log";
const LOG_MAX = 200;

async function audit(kind: AuditKind, ctx: { ip: string; ua: string }, detail?: string) {
  const event: AuditEvent = { t: Date.now(), kind, ip: ctx.ip, ua: ctx.ua.slice(0, 160), detail };
  try {
    await pipe([["LPUSH", LOG, JSON.stringify(event)], ["LTRIM", LOG, 0, LOG_MAX - 1]]);
  } catch {
    // the log is a record, not a gate: if the store is down the sign-in itself has already failed or succeeded on its own terms
  }
}

export async function recentAudit(limit = 50): Promise<AuditEvent[]> {
  const rows = (await cmd(["LRANGE", LOG, 0, limit - 1])) as string[];
  const out: AuditEvent[] = [];
  for (const row of rows) {
    try {
      out.push(JSON.parse(row) as AuditEvent);
    } catch {
      /* skip a damaged row */
    }
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// signing in
// ---------------------------------------------------------------------------------------------------------------------

const IP_LIMIT = 8;
const IP_WINDOW = 15 * 60;
const ACCOUNT_LIMIT = 30;
const ACCOUNT_WINDOW = 60 * 60;
const FAIL = "That e-mail address, password or code is not correct.";

export type LoginResult = { ok: true; token: string; maxAge: number } | { ok: false; status: number; message: string; retryAfter?: number };

export async function login(input: { email: unknown; password: unknown; code: unknown }, ctx: { ip: string; ua: string }): Promise<LoginResult> {
  const status = adminStatus();
  if (!status.ready) return { ok: false, status: 503, message: "Sign-in is not set up on this server." };

  const email = typeof input.email === "string" ? input.email.trim().toLowerCase().slice(0, 254) : "";
  const password = typeof input.password === "string" ? input.password.slice(0, 512) : "";
  const code = typeof input.code === "string" ? input.code.replace(/\s+/g, "").slice(0, 12) : "";
  const isOwner = email !== "" && safeEqual(email, env("ADMIN_EMAIL").toLowerCase());

  try {
    // count this attempt first (before any work), so a flood of parallel attempts cannot get past the limit
    const ipKey = `lw:rl:ip:${sha256(ctx.ip).slice(0, 32)}`;
    const accountKey = "lw:rl:account";
    const counted: Parameters<typeof pipe>[0] = [["INCR", ipKey], ["EXPIRE", ipKey, IP_WINDOW, "NX"]];
    if (isOwner) counted.push(["INCR", accountKey], ["EXPIRE", accountKey, ACCOUNT_WINDOW, "NX"]);
    const replies = await pipe(counted);
    const ipCount = Number(replies[0]);
    const accountCount = isOwner ? Number(replies[2]) : 0;
    if (ipCount > IP_LIMIT || accountCount > ACCOUNT_LIMIT) {
      // log the first block only, so a flood does not fill the log
      if (ipCount === IP_LIMIT + 1 || accountCount === ACCOUNT_LIMIT + 1) await audit("blocked", ctx, ipCount > IP_LIMIT ? "too many attempts from this address" : "too many attempts on the account");
      return { ok: false, status: 429, message: "Too many sign-in attempts. Please wait 15 minutes and try again.", retryAfter: IP_WINDOW };
    }

    // the password is always checked, against a decoy when the e-mail is wrong, so the time taken tells nothing
    const passwordOk = await verifyPassword(password, isOwner ? env("ADMIN_PASSWORD_HASH") : await decoyHash());
    if (!isOwner || !passwordOk) {
      await audit("failed", ctx, isOwner ? "wrong password" : "unknown e-mail address");
      return { ok: false, status: 401, message: FAIL };
    }

    if (status.twoFactor) {
      const step = totpMatch(env("ADMIN_TOTP_SECRET"), code);
      if (step === null) {
        await audit("failed", ctx, code ? "wrong code" : "no code given");
        return { ok: false, status: 401, message: FAIL };
      }
      // a code works once: the step it belongs to is remembered for two minutes
      const fresh = await cmd(["SET", `lw:auth:totp:${step}`, "1", "EX", 120, "NX"]);
      if (fresh === null) {
        await audit("failed", ctx, "code used again");
        return { ok: false, status: 401, message: FAIL };
      }
    }

    await pipe([["DEL", ipKey]]);
    await audit("signin", ctx);
    return { ok: true, ...issueSession(env("ADMIN_EMAIL").toLowerCase()) };
  } catch (error) {
    if (error instanceof StoreError) return { ok: false, status: 503, message: "Sign-in is unavailable for a moment. Please try again." };
    throw error;
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// the session
// ---------------------------------------------------------------------------------------------------------------------

export type Session = { sub: string; iat: number; exp: number; sid: string };
const REVOKED = "lw:auth:revoked-before";

export function issueSession(email: string, now = Date.now()): { token: string; maxAge: number } {
  const maxAge = Math.round(sessionHours() * 3600);
  const session: Session = { sub: email, iat: now, exp: now + maxAge * 1000, sid: randomToken(12) };
  return { token: sign(session, env("ADMIN_SESSION_SECRET")), maxAge };
}

/**
 * The session a cookie value stands for, or null. It must carry our signature, be within its time, belong to the
 * owner, not have been ended by a sign-out, and not predate "sign out everywhere". Throws a StoreError if the store
 * cannot be asked (the caller must not let anyone in then).
 */
export async function readSession(token: string | undefined, now = Date.now()): Promise<Session | null> {
  if (!token || !adminStatus().ready) return null;
  const s = unsign<Session>(token, env("ADMIN_SESSION_SECRET"));
  if (!s || typeof s.sid !== "string" || typeof s.iat !== "number" || typeof s.exp !== "number" || typeof s.sub !== "string") return null;
  if (s.exp <= now || s.iat > now + 60_000 || s.exp - s.iat > 72 * 3600_000 + 1000) return null;
  if (!safeEqual(s.sub, env("ADMIN_EMAIL").toLowerCase())) return null;
  const [revokedBefore, ended] = (await cmd(["MGET", REVOKED, `lw:auth:dead:${s.sid}`])) as (string | null)[];
  if (ended) return null;
  if (revokedBefore && Number(revokedBefore) >= s.iat) return null;
  return s;
}

/** Ends this one session (until it would have expired anyway). */
export async function endSession(session: Session, ctx: { ip: string; ua: string }) {
  const left = Math.max(1, Math.ceil((session.exp - Date.now()) / 1000));
  await cmd(["SET", `lw:auth:dead:${session.sid}`, "1", "EX", left]);
  await audit("signout", ctx);
}

/** Ends every session made so far, on every device. */
export async function endAllSessions(ctx: { ip: string; ua: string }) {
  await cmd(["SET", REVOKED, String(Date.now())]);
  await audit("signout_all", ctx);
}

export { getKv, StoreError };
