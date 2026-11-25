#!/usr/bin/env node
/**
 * Sets up the admin sign-in: asks for an e-mail address and a password, then prints the settings to add to the host
 * (Vercel > Project Settings > Environment Variables) or to .env.local:
 *
 *   ADMIN_EMAIL, ADMIN_PASSWORD_HASH (a scrypt hash: the password itself is never kept), ADMIN_SESSION_SECRET (signs the
 *   session cookie), and ADMIN_TOTP_SECRET (the key for the authenticator app: two-step sign-in).
 *
 *   npm run admin:setup                      asks for everything
 *   npm run admin:setup -- --generate        makes a strong password for you and shows it once
 *   npm run admin:setup -- --no-2fa          without two-step sign-in (not recommended)
 *   npm run admin:setup -- --write .env.local   also writes the settings into that file (replacing older ones)
 *
 * The hash format is the one lib/admin/crypto.ts reads: scrypt:N:r:p:salt:hash.
 */
import { randomBytes, scrypt } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import readline from "node:readline";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const N = 65536;
const R = 8;
const P = 1;
const hashPassword = (password) =>
  new Promise((resolve, reject) => {
    const salt = randomBytes(16);
    scrypt(password.normalize("NFKC"), salt, 64, { N, r: R, p: P, maxmem: 128 * N * R * 2 }, (err, key) =>
      err ? reject(err) : resolve(`scrypt:${N}:${R}:${P}:${salt.toString("base64url")}:${key.toString("base64url")}`),
    );
  });

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32(bytes) {
  let bits = 0;
  let acc = 0;
  let out = "";
  for (const b of bytes) {
    acc = (acc << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(acc >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(acc << (5 - bits)) & 31];
  return out;
}

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      const out = rl.output;
      rl._writeToOutput = (text) => out.write(text.includes(question) ? question : "");
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    });
  });
}

const COMMON = ["password", "passw0rd", "123456789012", "qwertyuiop12", "letmein12345", "administrator", "welcome12345"];
function weakness(password, email) {
  if (password.length < 12) return "Use at least 12 characters.";
  if (new Set(password).size < 6) return "Use a more varied password.";
  const lower = password.toLowerCase();
  if (COMMON.some((c) => lower.includes(c))) return "That is a very common password.";
  const local = email.split("@")[0].toLowerCase();
  if (local.length >= 4 && lower.includes(local)) return "Do not use your e-mail name inside the password.";
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  if (password.length < 16 && classes < 3) return "Use 16 or more characters, or mix letters, numbers and symbols.";
  return "";
}

function generate() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(24);
  const group = (from) => Array.from(bytes.subarray(from, from + 6), (b) => chars[b % chars.length]).join("");
  return `${group(0)}-${group(6)}-${group(12)}-${group(18)}`;
}

const email = (process.env.ADMIN_SETUP_EMAIL || value("email") || (await ask("Admin e-mail address: "))).trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("That is not an e-mail address.");
  process.exit(1);
}

let password = process.env.ADMIN_SETUP_PASSWORD || "";
let shown = false;
if (!password && flag("generate")) {
  password = generate();
  shown = true;
}
if (!password) {
  for (;;) {
    password = await ask("Password (typing is hidden; 12+ characters): ", { hidden: true });
    const problem = weakness(password, email);
    if (problem) {
      console.log(problem);
      continue;
    }
    if ((await ask("Again: ", { hidden: true })) !== password) {
      console.log("They did not match. Try again.");
      continue;
    }
    break;
  }
} else {
  const problem = weakness(password, email);
  if (problem) {
    console.error(problem);
    process.exit(1);
  }
}

const hash = await hashPassword(password);
const settings = {
  ADMIN_EMAIL: email,
  ADMIN_PASSWORD_HASH: hash,
  ADMIN_SESSION_SECRET: randomBytes(48).toString("base64url"),
};
let totp = "";
if (!flag("no-2fa")) {
  totp = base32(randomBytes(20));
  settings.ADMIN_TOTP_SECRET = totp;
}

const lines = Object.entries(settings).map(([k, v]) => `${k}=${v}`);
console.log("\nAdd these settings (Vercel: Project Settings > Environment Variables; or .env.local on this computer):\n");
console.log(lines.join("\n"));
if (shown) console.log(`\nYour password (shown once, keep it in a password manager):\n${password}`);
if (totp) {
  const grouped = totp.match(/.{1,4}/g).join(" ");
  console.log("\nTwo-step sign-in: in an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, Authy)");
  console.log('choose "Add account" > "Enter a setup key", with the account name and this key (time-based):\n');
  console.log(`  ${grouped}\n`);
  console.log(`or open this link on the phone: otpauth://totp/Literary%20Worx:${encodeURIComponent(email)}?secret=${totp}&issuer=Literary%20Worx`);
}

const target = value("write");
if (target) {
  let text = existsSync(target) ? readFileSync(target, "utf8") : "";
  for (const name of Object.keys(settings)) text = text.replace(new RegExp(`^${name}=.*\\r?\\n?`, "gm"), "");
  if (text && !text.endsWith("\n")) text += "\n";
  if (!totp) text = text.replace(/^ADMIN_TOTP_SECRET=.*\r?\n?/gm, "");
  writeFileSync(target, text + lines.join("\n") + "\n");
  console.log(`\nWritten to ${target}.`);
}
console.log("\nAlso needed on Vercel: a Redis store (Storage > Redis), which adds KV_REST_API_URL and KV_REST_API_TOKEN by itself. Then redeploy.");
