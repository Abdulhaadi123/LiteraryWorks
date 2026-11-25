#!/usr/bin/env node
/**
 * Checks the admin area of a running server, over HTTP (no browser): that nothing opens without signing in, that sign-in
 * is as strict as it claims (one answer for every failure, two-step code that works once, attempt limits, same-site
 * requests only), that an inquiry sent through the form reaches the inbox and can be read, changed, exported and deleted,
 * and that what visitors type cannot run in the admin pages.
 *
 *   ADMIN_EMAIL=… ADMIN_PASSWORD=… [ADMIN_TOTP_SECRET=…] [ADMIN_SESSION_SECRET=…] [BASE=http://localhost:3000] node scripts/verify-admin.mjs
 *
 * Use a server with a clean store (the checks add inquiries and use up sign-in attempts) and with the same ADMIN_*
 * settings. Without ADMIN_TOTP_SECRET the server must have two-step sign-in off; with ADMIN_SESSION_SECRET the
 * script also forges tokens to check that expired and tampered ones are refused.
 */
import { createHmac } from "node:crypto";

const base = (process.env.BASE || "http://localhost:3000").replace(/\/+$/, "");
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const totpSecret = process.env.ADMIN_TOTP_SECRET || "";
const sessionSecret = process.env.ADMIN_SESSION_SECRET || "";
if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (and ADMIN_TOTP_SECRET if two-step sign-in is on).");
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

// ---- an independent TOTP (RFC 6238), so the server's is checked against another implementation
const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function b32decode(text) {
  let bits = 0;
  let acc = 0;
  const out = [];
  for (const ch of text.replace(/[\s=-]/g, "").toUpperCase()) {
    acc = (acc << 5) | A.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((acc >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const usedSteps = new Set();
function codeForStep(step) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const h = createHmac("sha1", b32decode(totpSecret)).update(counter).digest();
  const o = h[h.length - 1] & 15;
  return String((((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1e6).padStart(6, "0");
}
const stepNow = () => Math.floor(Date.now() / 30000);
/** A code for a time step this script has not used yet (the server accepts one step either side; it waits for the next step when all three are spent). */
async function freshCode() {
  for (;;) {
    for (const off of [0, -1, 1]) {
      const step = stepNow() + off;
      if (!usedSteps.has(step)) {
        usedSteps.add(step);
        return codeForStep(step);
      }
    }
    await sleep(1500);
  }
}

// ---- a tiny client: a cookie, an "address" (the server reads x-real-ip), and the same-site Origin a browser sends
let ipCounter = 10;
const newIp = () => `10.20.${Math.floor(ipCounter / 250)}.${(ipCounter++ % 250) + 1}`;
function client(ip = newIp()) {
  const c = { cookie: "", ip };
  c.req = async (path, { method = "GET", body, json, headers = {}, sameSite = true, follow = false } = {}) => {
    const h = { "x-real-ip": c.ip, "user-agent": "verify-admin/1 (Windows; Chrome/120)", ...headers };
    if (c.cookie) h.cookie = c.cookie;
    if (sameSite && method !== "GET") h.origin = origin;
    let payload = body;
    if (json !== undefined) {
      h["content-type"] = "application/json";
      payload = JSON.stringify(json);
    }
    const res = await fetch(base + path, { method, headers: h, body: payload, redirect: follow ? "follow" : "manual" });
    const set = res.headers.getSetCookie?.() ?? [];
    for (const line of set) {
      const [pair] = line.split(";");
      const [name, ...rest] = pair.split("=");
      const value = rest.join("=");
      if (!value) c.cookie = "";
      else c.cookie = `${name}=${value}`;
    }
    c.lastSetCookie = set;
    // decoded by hand: res.text() would drop a byte-order mark, and the CSV check needs to see it
    const text = Buffer.from(await res.arrayBuffer()).toString("utf8");
    return { status: res.status, headers: res.headers, text, location: res.headers.get("location") || "", json: () => JSON.parse(text) };
  };
  // a sign-in with the right details takes a fresh code; one that is meant to fail (or be blocked) does not use one up
  c.login = async (extra = {}) => {
    const meantToFail = extra.password !== undefined || extra.email !== undefined || extra.code !== undefined;
    const withCode = extra.code ?? (totpSecret && !meantToFail ? await freshCode() : totpSecret ? "000000" : "");
    return c.req("/api/admin/login", { method: "POST", json: { email, password, ...extra, code: withCode } });
  };
  return c;
}
/** The page's visible markup: no scripts (the framework's data blocks name client components, which is not the page showing them). */
const markup = (html) => html.replace(/<script[\s\S]*?<\/script>/g, "");
const PUBLIC_FRAME = /class="site-header|class="skip-link|class="chat-|MobileCta|id="story"/;
const isLoginRedirect = (r) => r.status >= 300 && r.status < 400 && /\/admin\/login/.test(r.location);

console.log("\nNothing opens without signing in");
{
  const anon = client();
  for (const path of ["/admin", "/admin/inquiries", "/admin/inquiries/abcdefghijkl", "/admin/security"]) {
    const r = await anon.req(path);
    check(isLoginRedirect(r), `${path} sends a visitor to the sign-in page`, `${r.status} ${r.location}`);
    check(!/Latest messages|Signed in as|Sign out|Export CSV|Private note/.test(r.text), `${path} shows nothing of the panel`);
  }
  check((await anon.req("/api/admin/export")).status === 401, "the CSV export needs a session");
  check((await anon.req("/api/admin/inquiries/abcdefghijkl")).status === 401, "reading one inquiry needs a session");
  check((await anon.req("/api/admin/inquiries/abcdefghijkl", { method: "PATCH", json: { status: "read" } })).status === 401, "changing an inquiry needs a session");
  check((await anon.req("/api/admin/inquiries/abcdefghijkl", { method: "DELETE" })).status === 401, "deleting an inquiry needs a session");
  const forged = client();
  forged.cookie = "lw_admin=abc.def";
  check(isLoginRedirect(await forged.req("/admin")), "a made-up cookie is refused");
  forged.cookie = "__Host-lw_admin=abc.def";
  check(isLoginRedirect(await forged.req("/admin")), "a made-up cookie (production name) is refused");
}

console.log("\nThe sign-in page");
{
  const anon = client();
  const r = await anon.req("/admin/login");
  check(r.status === 200, "it opens", String(r.status));
  check(/noindex/i.test(r.text) && /noindex/i.test(r.headers.get("x-robots-tag") || ""), "it asks search engines to stay away (meta and header)");
  check(/no-store/.test(r.headers.get("cache-control") || ""), "it is never cached");
  check(/DENY/i.test(r.headers.get("x-frame-options") || "") && /frame-ancestors 'none'/.test(r.headers.get("content-security-policy") || ""), "it cannot be put in a frame");
  check(!PUBLIC_FRAME.test(markup(r.text)), "it has none of the public site's header, footer or assistant");
  check(/autocomplete="current-password"/i.test(r.text) && /autocomplete="username"/i.test(r.text), "the fields work with a password manager");
  check(totpSecret ? /autocomplete="one-time-code"/i.test(r.text) : !/one-time-code/i.test(markup(r.text)), totpSecret ? "it asks for the authentication code" : "it does not ask for a code (two-step is off)");
  const robots = await (await fetch(`${base}/robots.txt`)).text();
  check(/Disallow: \/admin/.test(robots), "robots.txt keeps crawlers out of /admin");
  const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
  check(!/\/admin/.test(sitemap), "the sitemap does not list /admin");
}

console.log("\nSigning in");
const owner = client();
{
  const noOrigin = await client().req("/api/admin/login", { method: "POST", json: { email, password, code: totpSecret ? "000000" : "" }, sameSite: false });
  check(noOrigin.status === 403, "a sign-in that does not come from the site's own page is refused", String(noOrigin.status));
  const evil = await client().req("/api/admin/login", { method: "POST", json: { email, password }, sameSite: false, headers: { origin: "https://evil.example" } });
  check(evil.status === 403, "a sign-in from another site is refused", String(evil.status));

  const a = client();
  const wrongEmail = await a.login({ email: "someone.else@example.com" });
  const wrongPass = await a.login({ password: password + "x" });
  check(wrongEmail.status === 401 && wrongPass.status === 401, "a wrong e-mail and a wrong password are both refused");
  check(wrongEmail.json().message === wrongPass.json().message, "and with the very same words (it does not say which part was wrong)");
  check(!a.cookie, "no cookie is given on a failure");
  const empty = await a.req("/api/admin/login", { method: "POST", json: {} });
  check(empty.status === 401, "an empty form is refused", String(empty.status));
  const notJson = await a.req("/api/admin/login", { method: "POST", body: "email=a", headers: { "content-type": "application/x-www-form-urlencoded" } });
  check(notJson.status === 400, "something that is not JSON is refused", String(notJson.status));
  check((await a.req("/api/admin/login", { method: "POST", json: { email: ["a"], password: { x: 1 }, code: 5 } })).status === 401, "odd types are refused, not crashed on");

  if (totpSecret) {
    const noCode = await a.login({ code: "" });
    const badCode = await a.login({ code: codeForStep(stepNow()) === "123456" ? "654321" : "123456" });
    check(noCode.status === 401 && badCode.status === 401, "the right password without the right code is refused");
    check(noCode.json().message === wrongPass.json().message, "with the same words again");
    const stale = await a.login({ code: codeForStep(stepNow() - 5) });
    check(stale.status === 401, "a code from two minutes ago is refused");
  }

  const ok = await owner.login();
  check(ok.status === 200, "the right details sign in", `${ok.status} ${ok.text.slice(0, 120)}`);
  const sc = owner.lastSetCookie.join("\n");
  check(/HttpOnly/i.test(sc) && /SameSite=Strict/i.test(sc) && /Path=\//i.test(sc), "the cookie is HttpOnly, SameSite=Strict, Path=/", sc);
  check(/Max-Age=\d+/i.test(sc) && !/Max-Age=0/.test(sc), "and it expires on its own");
  if (/__Host-/.test(sc)) check(/Secure/i.test(sc) && !/Domain=/i.test(sc), "the production cookie is Secure with no Domain (the __Host- rules)");
  check(/no-store/.test(ok.headers.get("cache-control") || ""), "the answer is never cached");

  if (totpSecret) {
    const used = await freshCode();
    const first = await client().login({ code: used });
    const second = await client().login({ code: used });
    check(first.status === 200, "(a fresh code signs in)", String(first.status));
    check(second.status === 401, "the same code a second time is refused: a code works once", String(second.status));
  }
}

console.log("\nThe panel, signed in");
{
  const r = await owner.req("/admin");
  check(r.status === 200 && /Overview/.test(r.text), "the overview opens", String(r.status));
  check(/no-store/.test(r.headers.get("cache-control") || "") && /noindex/i.test(r.headers.get("x-robots-tag") || ""), "and is neither cached nor indexed");
  check(!PUBLIC_FRAME.test(markup(r.text)), "with none of the public site's frame");
  for (const path of ["/admin/inquiries", "/admin/security"]) {
    const p = await owner.req(path);
    check(p.status === 200, `${path} opens`, String(p.status));
  }
  const sec = await owner.req("/admin/security");
  check(/Signed in/.test(sec.text) && /Failed attempt/.test(sec.text), "the Security page lists the sign-ins and the failed attempts");
  check(/Windows|Chrome/.test(sec.text), "with the device");
  check(!/ADMIN_PASSWORD_HASH=|scrypt:/.test(sec.text + r.text), "and never shows the password hash or a secret");
}

console.log("\nA message sent through the contact form reaches the inbox");
const marker = `verify-${Date.now()}`;
let id = "";
{
  const visitor = client();
  const post = (over = {}) =>
    visitor.req("/api/inquiry", {
      method: "POST",
      sameSite: false,
      json: { name: `Ada ${marker}`, email: "ada@example.com", company: "Analytical Engines", interest: "AI and automation", message: `Hello, ${marker}: we want to automate our invoices.`, website: "", ...over },
    });
  const sent = await post();
  check(sent.status === 200, "the form is accepted", `${sent.status} ${sent.text.slice(0, 160)}`);
  const bot = await post({ website: "http://spam.example", name: `Bot ${marker}` });
  check(bot.status === 200, "a bot (filled the hidden field) is answered as if it worked");
  const bad = await post({ email: "not-an-email" });
  check(bad.status === 400, "an invalid form is refused");
  const topic = await post({ interest: "Not a topic" });
  check(topic.status === 400, "an unknown topic is refused");

  const list = await owner.req("/admin/inquiries");
  check(list.status === 200 && list.text.includes(`Ada ${marker}`), "it is in the inbox");
  check(!list.text.includes(`Bot ${marker}`), "the bot's message is not");
  const m = list.text.match(/href="\/admin\/inquiries\/([A-Za-z0-9_-]{8,40})"/);
  id = m ? m[1] : "";
  check(!!id, "with a link to its page", id);

  const search = await owner.req(`/admin/inquiries?q=${encodeURIComponent(marker)}&status=new`);
  check(search.text.includes(`Ada ${marker}`), "search and the New tab find it");
  const none = await owner.req(`/admin/inquiries?q=zzzzzz-no-such-text`);
  check(/Nothing matches/.test(none.text), "a search with no match says so");
  const tab = await owner.req(`/admin/inquiries?status=archived`);
  check(!tab.text.includes(`Ada ${marker}`), "it is not under Archived");
  const odd = await owner.req(`/admin/inquiries?status=%27%3Cscript%3E&topic=x&page=-4&q=%00`);
  check(odd.status === 200, "odd filters do not break the page", String(odd.status));

  const over = await owner.req("/admin");
  check(over.text.includes(`Ada ${marker}`) && /AI and automation/.test(over.text), "the overview shows it and the topic");

  const page = await owner.req(`/admin/inquiries/${id}`);
  check(page.status === 200 && page.text.includes("we want to automate our invoices") && page.text.includes("ada@example.com"), "its page shows the whole message and the e-mail address");
  check(/mailto:ada@example\.com\?subject=/.test(page.text), "with a reply link");
  check((await owner.req("/admin/inquiries/does-not-exist-1")).status === 404, "an unknown message is a 404");
  check(/Back to the inbox/.test((await owner.req("/admin/inquiries/does-not-exist-1")).text), "which is the admin's own page (with a way back), not the public site's");
  check((await owner.req("/admin/inquiries/..%2F..%2Fsecret")).status === 404, "an address with path tricks is a 404");
}

console.log("\nChanging, noting, exporting, deleting");
{
  const url = `/api/admin/inquiries/${id}`;
  const read = await owner.req(url, { method: "PATCH", json: { status: "read" } });
  check(read.status === 200 && read.json().inquiry.status === "read", "status: read");
  const replied = await owner.req(url, { method: "PATCH", json: { status: "replied", note: "Called Ada; quote on Friday." } });
  check(replied.status === 200 && replied.json().inquiry.status === "replied" && replied.json().inquiry.note.includes("quote on Friday"), "status: replied, with a note");
  check((await owner.req(`/admin/inquiries?status=replied`)).text.includes(`Ada ${marker}`), "it now sits under Replied");
  check((await owner.req(`/admin/inquiries/${id}`)).text.includes("quote on Friday"), "and its page shows the note");
  check((await owner.req(url, { method: "PATCH", json: { status: "deleted" } })).status === 400, "a made-up status is refused");
  check((await owner.req(url, { method: "PATCH", json: { note: "x".repeat(2001) } })).status === 400, "a note over the limit is refused");
  check((await owner.req(url, { method: "PATCH", json: { status: 5 } })).status === 400, "a status of the wrong type is refused");
  check((await owner.req(url, { method: "PATCH", body: "not json", headers: { "content-type": "application/json" } })).status === 400, "a broken request body is refused");
  check((await owner.req("/api/admin/inquiries/nope1234", { method: "PATCH", json: { status: "read" } })).status === 404, "an unknown id is a 404");

  const noOrigin = await owner.req(url, { method: "PATCH", json: { status: "new" }, sameSite: false });
  const evil = await owner.req(url, { method: "PATCH", json: { status: "new" }, sameSite: false, headers: { origin: "https://evil.example" } });
  check(noOrigin.status === 403 && evil.status === 403, "a change that does not come from the site's own page is refused (even with the cookie)");
  check((await owner.req(url, { method: "DELETE", sameSite: false, headers: { origin: "https://evil.example" } })).status === 403, "so is a delete from another site");
  check((await owner.req(url)).json().inquiry.status === "replied", "and nothing changed");

  const csv = await owner.req("/api/admin/export");
  check(csv.status === 200 && /text\/csv/.test(csv.headers.get("content-type") || "") && /attachment/.test(csv.headers.get("content-disposition") || ""), "the CSV export downloads");
  check(csv.text.charCodeAt(0) === 0xfeff && csv.text.includes(`Ada ${marker}`) && csv.text.includes("Replied"), "with a byte-order mark, the message and its status");

  // what a visitor types must not run, in the pages or in a spreadsheet
  const visitor = client();
  const payload = `<img src=x onerror=alert(1)>${marker}`;
  const formula = `=HYPERLINK("http://evil.example","x")`;
  const hostile = await visitor.req("/api/inquiry", { method: "POST", sameSite: false, json: { name: payload, email: "x@example.com", company: "<script>alert(2)</script>", interest: "Something else", message: `${formula} ${"y".repeat(20)}` } });
  check(hostile.status === 200, "a message full of markup is accepted as text");
  const l = await owner.req("/admin/inquiries");
  const hid = (l.text.match(new RegExp(`href="/admin/inquiries/([A-Za-z0-9_-]{8,40})"[^>]*>${payload.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/</g, "&lt;").replace(/>/g, "&gt;")}`)) || [])[1];
  const rows = await owner.req(`/admin/inquiries?q=${encodeURIComponent(marker)}`);
  check(!/<img src=x/.test(rows.text) && !/<script>alert/.test(rows.text), "markup in a name or company is shown as text in the list");
  const ids = [...rows.text.matchAll(/href="\/admin\/inquiries\/([A-Za-z0-9_-]{8,40})"/g)].map((x) => x[1]);
  let detailOk = true;
  for (const one of new Set(ids)) {
    const d = await owner.req(`/admin/inquiries/${one}`);
    if (/<img src=x|<script>alert/.test(d.text)) detailOk = false;
  }
  check(detailOk, "and on each message's page");
  void hid;
  const csv2 = await owner.req("/api/admin/export");
  check(csv2.text.includes(`"'=HYPERLINK(`), "a spreadsheet formula in a message is defused in the CSV");

  const del = await owner.req(url, { method: "DELETE" });
  check(del.status === 200, "delete");
  check((await owner.req(url)).status === 404 && (await owner.req(url, { method: "DELETE" })).status === 404, "it is gone, and a second delete is a 404");
  check(!(await owner.req("/admin/inquiries")).text.includes(`Ada ${marker}`), "and gone from the inbox");
  for (const one of new Set(ids)) await owner.req(`/api/admin/inquiries/${one}`, { method: "DELETE" });
}

if (sessionSecret) {
  console.log("\nTokens that should not work");
  const sign = (payload, secret = sessionSecret) => {
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
  };
  const now = Date.now();
  const names = ["lw_admin", "__Host-lw_admin"];
  const tryToken = async (token) => {
    const c = client();
    let allowed = false;
    for (const n of names) {
      c.cookie = `${n}=${token}`;
      const r = await c.req("/admin");
      if (r.status === 200) allowed = true;
    }
    return allowed;
  };
  check(await tryToken(sign({ sub: email.toLowerCase(), iat: now, exp: now + 3600_000, sid: "forged-ok-1" })), "(a correctly signed token is accepted: the check below means something)");
  check(!(await tryToken(sign({ sub: email.toLowerCase(), iat: now - 7200_000, exp: now - 3600_000, sid: "forged-old" }))), "an expired token is refused");
  check(!(await tryToken(sign({ sub: email.toLowerCase(), iat: now, exp: now + 3600_000, sid: "forged-sig" }, "another-secret-another-secret-another"))), "a token signed with another secret is refused");
  check(!(await tryToken(sign({ sub: "intruder@example.com", iat: now, exp: now + 3600_000, sid: "forged-sub" }))), "a token for another e-mail address is refused");
  check(!(await tryToken(sign({ sub: email.toLowerCase(), iat: now, exp: now + 400 * 3600_000, sid: "forged-long" }))), "a token that lives for weeks is refused");
}

console.log("\nSigning out");
{
  const a = client();
  const b = client();
  check((await a.login()).status === 200 && (await b.login()).status === 200, "(two sessions open for these checks)");
  const bad = await a.req("/api/admin/logout", { method: "POST", json: {}, sameSite: false });
  check(bad.status === 403, "signing out from another site is refused");
  const tokenA = a.cookie;
  const out = await a.req("/api/admin/logout", { method: "POST", json: {} });
  check(out.status === 200 && !a.cookie, "sign out clears the cookie");
  const replay = client();
  replay.cookie = tokenA;
  check(isLoginRedirect(await replay.req("/admin")), "and the old cookie no longer works, even if someone kept a copy");
  check((await b.req("/admin")).status === 200, "(the other session is still open)");
  const tokenB = b.cookie;
  const all = await b.req("/api/admin/logout", { method: "POST", json: { everywhere: true } });
  check(all.status === 200, "sign out everywhere");
  const replayB = client();
  replayB.cookie = tokenB;
  check(isLoginRedirect(await replayB.req("/admin")), "every earlier session is ended");
  await sleep(30);
  const fresh = client();
  check((await fresh.login()).status === 200 && (await fresh.req("/admin")).status === 200, "a sign-in made afterwards works again");
  const log = await fresh.req("/admin/security");
  check(/Signed out/.test(log.text) && /Signed out everywhere/.test(log.text), "the sign-outs are in the log");
}

console.log("\nAttempt limits");
{
  const flood = client("10.99.0.1");
  let last = 0;
  let retry = "";
  for (let n = 0; n < 9; n++) {
    const r = await flood.login({ password: `wrong-${n}` });
    last = r.status;
    retry = r.headers.get("retry-after") || "";
    if (n < 8) check(r.status === 401, `attempt ${n + 1} from one address: refused as wrong`, String(r.status));
  }
  check(last === 429 && Number(retry) > 0, "the 9th attempt in the window is blocked with a Retry-After", `${last} ${retry}`);
  const right = await flood.login({ code: totpSecret ? "000000" : "" });
  check(right.status === 429, "and now even the right password is refused from that address until the window ends", String(right.status));
  const other = client("10.99.0.2");
  const fine = await other.login();
  check(fine.status === 200, "another address is not locked out by it", String(fine.status));
}

console.log(`\n${total - fails}/${total} checks passed`);
process.exit(fails ? 1 : 0);
