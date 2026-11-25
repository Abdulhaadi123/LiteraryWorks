import { createHash, createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";

/**
 * The admin area's cryptography, with nothing but Node's own crypto module:
 *  - passwords are stored as scrypt hashes (memory-hard, per-password random salt), never as text;
 *  - the session cookie is a signed token (HMAC-SHA256);
 *  - two-step sign-in is a time-based one-time code (TOTP, RFC 6238), the kind every authenticator app makes.
 * Every comparison of a secret is constant-time.
 */

const b64 = (b: Buffer) => b.toString("base64url");

/** A constant-time comparison of two strings of any length (both are hashed first, so the length is not leaked). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
export const randomToken = (bytes = 16) => b64(randomBytes(bytes));

// ---------------------------------------------------------------------------------------------------------------------
// passwords: scrypt:<N>:<r>:<p>:<salt>:<hash>   (no "$", so .env files and shells leave it alone)
// ---------------------------------------------------------------------------------------------------------------------

const SCRYPT = { N: 65536, r: 8, p: 1, keyLen: 64, saltLen: 16 } as const;

function scrypt(password: string, salt: Buffer, N: number, r: number, p: number, keyLen: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // the memory scrypt needs is 128 * N * r bytes; the limit is set a little above it
    scryptCb(password.normalize("NFKC"), salt, keyLen, { N, r, p, maxmem: 128 * N * r * 2 }, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SCRYPT.saltLen);
  const key = await scrypt(password, salt, SCRYPT.N, SCRYPT.r, SCRYPT.p, SCRYPT.keyLen);
  return `scrypt:${SCRYPT.N}:${SCRYPT.r}:${SCRYPT.p}:${b64(salt)}:${b64(key)}`;
}

/** Reads the parameters out of a stored hash; null when it is not one this module made (or its numbers are out of range). */
function parseHash(stored: string) {
  const parts = stored.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return null;
  const [N, r, p] = [Number(parts[1]), Number(parts[2]), Number(parts[3])];
  const salt = Buffer.from(parts[4], "base64url");
  const key = Buffer.from(parts[5], "base64url");
  const pow2 = Number.isInteger(N) && N >= 2 ** 14 && N <= 2 ** 20 && (N & (N - 1)) === 0;
  if (!pow2 || !Number.isInteger(r) || r < 1 || r > 16 || !Number.isInteger(p) || p < 1 || p > 4) return null;
  if (salt.length < 8 || key.length < 16 || key.length > 128) return null;
  return { N, r, p, salt, key };
}

export const isPasswordHash = (stored: string) => parseHash(stored) !== null;

/** True when `password` is the one `stored` was made from. A hash that is not understood never matches. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const h = parseHash(stored);
  if (!h) return false;
  const key = await scrypt(password, h.salt, h.N, h.r, h.p, h.key.length);
  return key.length === h.key.length && timingSafeEqual(key, h.key);
}

let decoy: Promise<string> | undefined;
/** A hash of a random password, made once. Checking a wrong e-mail address against it takes as long as a real check. */
export const decoyHash = () => (decoy ??= hashPassword(randomToken(24)));

// ---------------------------------------------------------------------------------------------------------------------
// signed tokens: <payload>.<signature>
// ---------------------------------------------------------------------------------------------------------------------

export function sign(payload: object, secret: string): string {
  const body = b64(Buffer.from(JSON.stringify(payload)));
  const mac = createHmac("sha256", secret).update(body).digest();
  return `${body}.${b64(mac)}`;
}

/** The payload of a token this secret signed, or null. (Whether it has expired is for the caller to decide.) */
export function unsign<T = Record<string, unknown>>(token: string, secret: string): T | null {
  const dot = token.indexOf(".");
  if (dot < 1 || dot === token.length - 1 || token.length > 2048) return null;
  const body = token.slice(0, dot);
  const expected = createHmac("sha256", secret).update(body).digest();
  let given: Buffer;
  try {
    given = Buffer.from(token.slice(dot + 1), "base64url");
  } catch {
    return null;
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const value = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return value && typeof value === "object" ? (value as T) : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// two-step sign-in: TOTP (RFC 6238, SHA-1, 6 digits, 30 seconds: what every authenticator app does)
// ---------------------------------------------------------------------------------------------------------------------

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(bytes: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

/** The bytes of a base32 string (spaces, dashes and case are ignored); null if it holds anything else. */
export function base32Decode(text: string): Buffer | null {
  const clean = text.replace(/[\s-]/g, "").replace(/=+$/, "").toUpperCase();
  if (!clean) return null;
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const i = ALPHABET.indexOf(ch);
    if (i < 0) return null;
    value = (value << 5) | i;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export const newTotpSecret = () => base32Encode(randomBytes(20));
export const TOTP_STEP = 30;

export function totpCode(secret: Buffer, step: number, digits = 6): string {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const h = createHmac("sha1", secret).update(counter).digest();
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 10 ** digits).padStart(digits, "0");
}

/**
 * The time step (a number) of the code if `code` is right for now, one step either side allowed for a slow clock;
 * otherwise null. The caller remembers the step, so a code cannot be used twice.
 */
export function totpMatch(secretBase32: string, code: string, now = Date.now()): number | null {
  const secret = base32Decode(secretBase32);
  if (!secret || !/^\d{6}$/.test(code)) return null;
  const current = Math.floor(now / 1000 / TOTP_STEP);
  let hit: number | null = null;
  // every step is compared (no early exit), so the time taken does not say which one was close
  for (const step of [current - 1, current, current + 1]) {
    if (safeEqual(totpCode(secret, step), code) && hit === null) hit = step;
  }
  return hit;
}

export const otpauthUri = (secretBase32: string, account: string, issuer: string) =>
  `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secretBase32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=${TOTP_STEP}`;
