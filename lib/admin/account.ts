import { randomBytes } from "node:crypto";
import { hashPassword } from "./crypto";
import { cmd } from "./kv";

/**
 * The admin account when it is made on the sign-in page (the first visit to /admin, with a store connected) instead of
 * in the host's settings. It lives in the store under one key: the e-mail address, the scrypt hash of the password (never the
 * password) and a random secret that signs the session cookie. It is written once, with "only if absent" (SET NX), so two
 * people opening the setup form at the same moment cannot both win, and once it exists the form is closed for good.
 */

export type Account = { email: string; hash: string; secret: string; createdAt: number };
const KEY = "lw:admin:account";

// An account that exists does not change, so it is remembered for a few seconds per server instance (one store read fewer
// on most requests). "No account yet" is never remembered: the setup form must see the account the moment it exists.
let known: { at: number; account: Account } | undefined;

export async function storedAccount(now = Date.now()): Promise<Account | null> {
  if (known && now - known.at < 10_000) return known.account;
  const raw = (await cmd(["GET", KEY])) as string | null;
  if (!raw) {
    known = undefined;
    return null;
  }
  try {
    const a = JSON.parse(raw) as Account;
    if (typeof a.email === "string" && typeof a.hash === "string" && typeof a.secret === "string" && a.secret.length >= 32) {
      known = { at: now, account: a };
      return a;
    }
  } catch {
    /* a damaged value counts as no account */
  }
  return null;
}

/** Makes the account, or returns null when there is one already (someone got there first). */
export async function createAccount(email: string, password: string): Promise<Account | null> {
  const account: Account = { email, hash: await hashPassword(password), secret: randomBytes(48).toString("base64url"), createdAt: Date.now() };
  const done = await cmd(["SET", KEY, JSON.stringify(account), "NX"]);
  if (done === null) return null;
  known = { at: Date.now(), account };
  return account;
}
