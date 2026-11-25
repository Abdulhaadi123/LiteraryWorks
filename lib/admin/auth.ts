import { createAccount, storedAccount } from "./account";
import { base32Decode, decoyHash, isPasswordHash, passwordProblem, randomToken, safeEqual, sha256, sign, totpMatch, unsign, verifyPassword } from "./crypto";
import { cmd, getKv, pipe, storeKind, StoreError } from "./kv";

/**
 * Signing in to the admin area.
 *
 *  - One owner account, from one of two places: the host's settings (ADMIN_EMAIL, ADMIN_PASSWORD_HASH, ADMIN_SESSION_SECRET,
 *    made by `npm run admin:setup`), or, when none of those is set, the account made on the sign-in page the first time
 *    /admin is opened with a store connected (see account.ts). Optionally ADMIN_TOTP_SECRET adds two-step sign-in with an
 *    authenticator app. Nothing is stored in plain text: only a scrypt hash of the password.
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

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readEnv() {
  const email = env("ADMIN_EMAIL").toLowerCase();
  const hash = env("ADMIN_PASSWORD_HASH");
  const secret = env("ADMIN_SESSION_SECRET");
  const totp = env("ADMIN_TOTP_SECRET").replace(/\s+/g, "").toUpperCase();
  const bad: string[] = [];
  if (!EMAIL.test(email)) bad.push("ADMIN_EMAIL");
  if (!isPasswordHash(hash)) bad.push("ADMIN_PASSWORD_HASH");
  if (secret.length < 32) bad.push("ADMIN_SESSION_SECRET");
  const bytes = totp ? base32Decode(totp) : null;
  const totpBad = !!totp && (!bytes || bytes.length < 10);
  // any of the three set means the account comes from the settings (and must then be complete)
  const fromSettings = !!(env("ADMIN_EMAIL") || env("ADMIN_PASSWORD_HASH") || env("ADMIN_SESSION_SECRET"));
  return { email, hash, secret, totp, bad, totpBad, fromSettings };
}

export type Config = { email: string; hash: string; secret: string; totp: string; source: "settings" | "store" };

/** The account that signs in, or null when there is none (yet). Throws a StoreError if the store has to be asked and cannot be. */
export async function loadConfig(): Promise<Config | null> {
  const e = readEnv();
  if (e.totpBad) return null;
  if (e.fromSettings) return e.bad.length ? null : { email: e.email, hash: e.hash, secret: e.secret, totp: e.totp, source: "settings" };
  if (!storeKind()) return null;
  const a = await storedAccount();
  return a ? { email: a.email.toLowerCase(), hash: a.hash, secret: a.secret, totp: e.totp, source: "store" } : null;
}

export type AdminStatus = {
  /** An account exists and sign-in works. */
  ready: boolean;
  /** No account yet and a store is connected: the sign-in page offers to make it. */
  setupNeeded: boolean;
  /** The setup form must also ask for ADMIN_SETUP_KEY. */
  needsSetupKey: boolean;
  /** The store could not be reached just now. */
  unavailable: boolean;
  /** What is still to set up (names of settings), when neither signed in nor ready for setup. */
  missing: string[];
  twoFactor: boolean;
  storage: "redis" | "file" | "mongo" | null;
  source: "settings" | "store" | null;
};

export async function adminStatus(): Promise<AdminStatus> {
  const e = readEnv();
  const storage = storeKind();
  const base: AdminStatus = { ready: false, setupNeeded: false, needsSetupKey: !!env("ADMIN_SETUP_KEY"), unavailable: false, missing: [], twoFactor: false, storage, source: null };
  const missing = [...(e.fromSettings ? e.bad : []), ...(e.totpBad ? ["ADMIN_TOTP_SECRET"] : [])];
  if (!storage) missing.push("a store (MongoDB: MONGODB_URI, or Redis: KV_REST_API_URL and KV_REST_API_TOKEN)");
  if (missing.length) return { ...base, missing };
  if (e.fromSettings) return { ...base, ready: true, twoFactor: !!e.totp, source: "settings" };
  try {
    return (await storedAccount()) ? { ...base, ready: true, twoFactor: !!e.totp, source: "store" } : { ...base, setupNeeded: true };
  } catch (error) {
    if (error instanceof StoreError) return { ...base, unavailable: true };
    throw error;
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// who is asking
// ---------------------------------------------------------------------------------------------------------------------

export { clientCountry, clientIp, sameOrigin } from "../request";

/** "Chrome on Windows" from a User-Agent string. */
export function describeAgent(ua: string): string {
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\/|CriOS\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "";
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad|iOS/.test(ua) ? "iOS" : /Mac OS X|Macintosh/.test(ua) ? "macOS" : /Linux|X11/.test(ua) ? "Linux" : "";
  return browser && os ? `${browser} on ${os}` : browser || os || "Unknown device";
}

// ---------------------------------------------------------------------------------------------------------------------
// the log
// ---------------------------------------------------------------------------------------------------------------------

export type AuditKind = "signin" | "failed" | "blocked" | "signout" | "signout_all" | "setup";
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
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase().slice(0, 254) : "";
  const password = typeof input.password === "string" ? input.password.slice(0, 512) : "";
  const code = typeof input.code === "string" ? input.code.replace(/\s+/g, "").slice(0, 12) : "";

  try {
    const cfg = await loadConfig();
    if (!cfg) return { ok: false, status: 503, message: "Sign-in is not set up on this server." };
    const isOwner = email !== "" && safeEqual(email, cfg.email);

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
    const passwordOk = await verifyPassword(password, isOwner ? cfg.hash : await decoyHash());
    if (!isOwner || !passwordOk) {
      await audit("failed", ctx, isOwner ? "wrong password" : "unknown e-mail address");
      return { ok: false, status: 401, message: FAIL };
    }

    if (cfg.totp) {
      const step = totpMatch(cfg.totp, code);
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
    return { ok: true, ...issueSession(cfg.email, cfg.secret) };
  } catch (error) {
    if (error instanceof StoreError) return { ok: false, status: 503, message: "Sign-in is unavailable for a moment. Please try again." };
    throw error;
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// the first-run setup: make the account on the sign-in page
// ---------------------------------------------------------------------------------------------------------------------

const SETUP_LIMIT = 10;
const SETUP_WINDOW = 60 * 60;

/**
 * Makes the admin account (once) and signs it in. Only possible while there is no account and a store is connected; the
 * account is written with "only if absent", so the first request wins and the form is closed for good afterwards.
 * ADMIN_SETUP_KEY, when set on the host, must be given too (so nobody else can make the account in the first minutes).
 */
export async function setupAccount(input: { email: unknown; password: unknown; confirm: unknown; key: unknown }, ctx: { ip: string; ua: string }): Promise<LoginResult> {
  try {
    const status = await adminStatus();
    if (status.unavailable) return { ok: false, status: 503, message: "The store is unavailable for a moment. Please try again." };
    if (status.ready) return { ok: false, status: 409, message: "The admin account has already been made. Please sign in." };
    if (!status.setupNeeded) return { ok: false, status: 503, message: "Connect a store first (see the README), then reload this page." };

    // counted before any work, like sign-in attempts
    const limitKey = `lw:rl:setup:${sha256(ctx.ip).slice(0, 32)}`;
    const [count] = await pipe([["INCR", limitKey], ["EXPIRE", limitKey, SETUP_WINDOW, "NX"]]);
    if (Number(count) > SETUP_LIMIT) return { ok: false, status: 429, message: "Too many attempts. Please wait an hour and try again.", retryAfter: SETUP_WINDOW };

    const setupKey = env("ADMIN_SETUP_KEY");
    if (setupKey && !safeEqual(typeof input.key === "string" ? input.key.trim() : "", setupKey)) {
      await audit("failed", ctx, "wrong setup key");
      return { ok: false, status: 403, message: "That setup key is not correct." };
    }
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase().slice(0, 254) : "";
    if (!EMAIL.test(email)) return { ok: false, status: 400, message: "Enter a valid e-mail address." };
    const password = typeof input.password === "string" ? input.password : "";
    if (typeof input.confirm !== "string" || input.confirm !== password) return { ok: false, status: 400, message: "The two passwords do not match." };
    const problem = passwordProblem(password, email);
    if (problem) return { ok: false, status: 400, message: problem };

    const account = await createAccount(email, password);
    if (!account) return { ok: false, status: 409, message: "The admin account has already been made. Please sign in." };
    await audit("setup", ctx, "account created");
    await audit("signin", ctx);
    return { ok: true, ...issueSession(account.email, account.secret) };
  } catch (error) {
    if (error instanceof StoreError) return { ok: false, status: 503, message: "The store is unavailable for a moment. Please try again." };
    throw error;
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// the session
// ---------------------------------------------------------------------------------------------------------------------

export type Session = { sub: string; iat: number; exp: number; sid: string };
const REVOKED = "lw:auth:revoked-before";

export function issueSession(email: string, secret: string, now = Date.now()): { token: string; maxAge: number } {
  const maxAge = Math.round(sessionHours() * 3600);
  const session: Session = { sub: email, iat: now, exp: now + maxAge * 1000, sid: randomToken(12) };
  return { token: sign(session, secret), maxAge };
}

/**
 * The session a cookie value stands for, or null. It must carry our signature, be within its time, belong to the
 * owner, not have been ended by a sign-out, and not predate "sign out everywhere". Throws a StoreError if the store
 * cannot be asked (the caller must not let anyone in then).
 */
export async function readSession(token: string | undefined, now = Date.now()): Promise<Session | null> {
  if (!token) return null;
  const cfg = await loadConfig();
  if (!cfg) return null;
  const s = unsign<Session>(token, cfg.secret);
  if (!s || typeof s.sid !== "string" || typeof s.iat !== "number" || typeof s.exp !== "number" || typeof s.sub !== "string") return null;
  if (s.exp <= now || s.iat > now + 60_000 || s.exp - s.iat > 72 * 3600_000 + 1000) return null;
  if (!safeEqual(s.sub, cfg.email)) return null;
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
