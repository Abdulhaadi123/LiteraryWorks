#!/usr/bin/env node
/**
 * Checks the first-run setup of the admin area over HTTP: the sign-in page offers to make the account while there is none,
 * refuses weak or mismatched passwords, wrong setup keys and requests from other sites, lets exactly one of several
 * simultaneous requests make the account, then closes the form for good and signs in with what was made.
 *
 *   SETUP_EMAIL=… SETUP_PASSWORD=… [SETUP_KEY=…] [BASE=http://localhost:3000] node scripts/verify-admin-setup.mjs
 *
 * The server must have a store and NO ADMIN_EMAIL, ADMIN_PASSWORD_HASH or ADMIN_SESSION_SECRET set, and an empty store
 * (use a scratch database). Afterwards run scripts/verify-admin.mjs with the same e-mail and password for the rest of the
 * checks (ADMIN_EMAIL=SETUP_EMAIL, ADMIN_PASSWORD=SETUP_PASSWORD).
 */
const base = (process.env.BASE || "http://localhost:3000").replace(/\/+$/, "");
const email = process.env.SETUP_EMAIL;
const password = process.env.SETUP_PASSWORD;
const setupKey = process.env.SETUP_KEY || "";
if (!email || !password) {
  console.error("Set SETUP_EMAIL and SETUP_PASSWORD (and SETUP_KEY if the server has ADMIN_SETUP_KEY).");
  process.exit(2);
}
const origin = new URL(base).origin;
let fails = 0;
let total = 0;
const check = (ok, what, detail = "") => {
  total++;
  if (!ok) fails++;
  console.log(ok ? "  ok  " : "  FAIL", what, ok ? "" : detail);
};
let ipN = 40;
const newIp = () => `10.30.0.${ipN++}`;
async function call(path, { method = "GET", json, cookie = "", ip = newIp(), sameSite = true, headers = {} } = {}) {
  const h = { "x-real-ip": ip, "user-agent": "verify-admin-setup/1 (Windows; Chrome/120)", ...headers };
  if (cookie) h.cookie = cookie;
  if (sameSite && method !== "GET") h.origin = origin;
  let body;
  if (json !== undefined) {
    h["content-type"] = "application/json";
    body = JSON.stringify(json);
  }
  const res = await fetch(base + path, { method, headers: h, body, redirect: "manual" });
  const text = await res.text();
  const set = res.headers.getSetCookie?.() ?? [];
  return { status: res.status, text, location: res.headers.get("location") || "", cookie: set.map((c) => c.split(";")[0]).join("; "), set: set.join("\n"), json: () => JSON.parse(text) };
}
const markup = (html) => html.replace(/<script[\s\S]*?<\/script>/g, "");
const setup = (over = {}, opts = {}) => call("/api/admin/setup", { method: "POST", json: { email, password, confirm: password, key: setupKey, ...over }, ...opts });

console.log("\nBefore the account exists");
{
  const page = await call("/admin/login");
  const html = markup(page.text);
  check(page.status === 200 && /Make the admin account/.test(html), "the sign-in page offers to make the account", String(page.status));
  check(/autocomplete="new-password"/i.test(html) && !/autocomplete="current-password"/i.test(html), "it is the setup form, not the sign-in form");
  check(setupKey ? /Setup key/.test(html) : !/Setup key/.test(html), setupKey ? "and it asks for the setup key" : "and it does not ask for a setup key");
  check(/noindex/i.test(page.text), "it asks search engines to stay away, like every admin page");
  const gate = await call("/admin");
  check(gate.status >= 300 && gate.status < 400 && /\/admin\/login/.test(gate.location), "/admin sends a visitor to that page");
  const signin = await call("/api/admin/login", { method: "POST", json: { email, password, code: "" } });
  check(signin.status === 503, "signing in is refused: there is no account yet", String(signin.status));
  check((await call("/api/admin/export")).status === 401, "the data routes are closed");
}

console.log("\nWhat setup refuses (and none of it makes the account)");
{
  const evil = await setup({}, { sameSite: false, headers: { origin: "https://evil.example" } });
  check(evil.status === 403, "a request from another site", String(evil.status));
  const noOrigin = await setup({}, { sameSite: false });
  check(noOrigin.status === 403, "a request with no Origin", String(noOrigin.status));
  const notJson = await call("/api/admin/setup", { method: "POST", ip: newIp(), headers: { "content-type": "text/plain" } });
  check(notJson.status === 400, "a body that is not JSON", String(notJson.status));
  const badEmail = await setup({ email: "not-an-email" });
  check(badEmail.status === 400 && /e-mail/i.test(badEmail.json().message), "an invalid e-mail address", badEmail.text);
  const short = await setup({ password: "Short1!", confirm: "Short1!" });
  check(short.status === 400 && /12/.test(short.json().message), "a short password", short.text);
  const common = await setup({ password: "password12345", confirm: "password12345" });
  check(common.status === 400, "a very common password", common.text);
  const plain = await setup({ password: "alllowercaseab", confirm: "alllowercaseab" });
  check(plain.status === 400, "a password of one kind of character under 16 long", plain.text);
  const withName = await setup({ email: "someonehere@example.com", password: "someonehere-Strong9", confirm: "someonehere-Strong9" });
  check(withName.status === 400 && /e-mail name/i.test(withName.json().message), "a password that contains the e-mail name", withName.text);
  const mismatch = await setup({ confirm: password + "x" });
  check(mismatch.status === 400 && /match/i.test(mismatch.json().message), "two passwords that differ", mismatch.text);
  const odd = await call("/api/admin/setup", { method: "POST", json: { email: ["a"], password: { x: 1 }, confirm: 5, key: 9 }, ip: newIp() });
  check([400, 403].includes(odd.status), "odd types are refused, not crashed on", String(odd.status));
  if (setupKey) {
    const wrongKey = await setup({ key: setupKey + "x" });
    check(wrongKey.status === 403, "a wrong setup key", String(wrongKey.status));
    const noKey = await setup({ key: "" });
    check(noKey.status === 403, "no setup key", String(noKey.status));
  }
  const page = await call("/admin/login");
  check(/Make the admin account/.test(markup(page.text)), "the form is still offered: nothing above made the account");
}

console.log("\nSeveral at once: one wins");
let owner = { cookie: "" };
{
  const racers = await Promise.all(Array.from({ length: 6 }, () => setup()));
  const won = racers.filter((r) => r.status === 200);
  const lost = racers.filter((r) => r.status === 409);
  check(won.length === 1 && lost.length === 5, "6 simultaneous requests: exactly one account is made, the rest get 409", racers.map((r) => r.status).join(","));
  owner = won[0] || owner;
  const sc = owner.set || "";
  check(/HttpOnly/i.test(sc) && /SameSite=Strict/i.test(sc) && /Path=\//i.test(sc) && /Max-Age=\d+/i.test(sc), "the winner is signed in with a protected cookie", sc);
}

console.log("\nAfter");
{
  const page = await call("/admin/login", { cookie: owner.cookie });
  check(page.status >= 300 && page.status < 400 && /\/admin$/.test(page.location), "a signed-in visit to the sign-in page goes on to /admin", `${page.status} ${page.location}`);
  const panel = await call("/admin", { cookie: owner.cookie });
  check(panel.status === 200 && /Overview/.test(panel.text) && /Latest messages/.test(panel.text), "the panel opens with that cookie", String(panel.status));
  const anon = await call("/admin/login");
  check(/Admin sign-in/.test(markup(anon.text)) && !/Make the admin account/.test(markup(anon.text)) && /autocomplete="current-password"/i.test(anon.text), "the page now shows the sign-in form: the setup form is closed");
  const again = await setup({ email: "someone.else@example.com", password: "Another-Strong-Pass-77", confirm: "Another-Strong-Pass-77" });
  check(again.status === 409, "another setup (even with good details) is refused", String(again.status));
  const log = await call("/admin/security", { cookie: owner.cookie });
  check(/Admin account made/.test(log.text) && /Signed in/.test(log.text), "the log records the account being made");
  check(!/scrypt:/.test(log.text + panel.text), "no hash or secret appears in the pages");

  const wrong = await call("/api/admin/login", { method: "POST", json: { email, password: password + "x", code: "" } });
  check(wrong.status === 401, "a wrong password is refused", String(wrong.status));
  const out = await call("/api/admin/logout", { method: "POST", json: {}, cookie: owner.cookie });
  check(out.status === 200, "sign out");
  check((await call("/admin", { cookie: owner.cookie })).status >= 300, "the old cookie no longer works");
  const back = await call("/api/admin/login", { method: "POST", json: { email: email.toUpperCase(), password, code: "" } });
  check(back.status === 200 && /HttpOnly/i.test(back.set), "signing in with the e-mail and password just made works (any capitals)", `${back.status} ${back.text}`);
  const other = await call("/api/admin/login", { method: "POST", json: { email: "someone.else@example.com", password: "Another-Strong-Pass-77", code: "" } });
  check(other.status === 401, "the account that lost the race cannot sign in", String(other.status));
}

console.log("\nThe limit on setup attempts (here the form is closed, so it answers 409 first)");
{
  const flood = await Promise.all(Array.from({ length: 12 }, () => setup({}, { ip: "10.31.0.1" })));
  check(flood.every((r) => r.status === 409), "once closed, every attempt is a plain 409 (nothing to guess)", flood.map((r) => r.status).join(","));
}

console.log(`\n${total - fails}/${total} checks passed`);
process.exit(fails ? 1 : 0);
