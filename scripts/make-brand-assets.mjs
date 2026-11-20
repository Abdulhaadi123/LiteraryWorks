// Makes the files that identify the site outside the page itself, from the site's own pictures, font and mark:
//   public/og/literaryworks.jpg   the 1200x630 picture that link previews show (Open Graph and Twitter)
//   app/apple-icon.png            the 180x180 icon for an iPhone's home screen
//   app/favicon.ico               16, 32 and 48 px, for browsers and crawlers that still ask for /favicon.ico
//
//   node scripts/make-brand-assets.mjs
//
// It needs public/scene/system-ring.webp (scripts/make-posters.mjs), app/fonts/inter-latin-400-800.woff2 and
// app/icon.svg, and Chrome (CHROME_PATH). No dependencies. Re-run it when the look of the home page changes.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import http from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = process.cwd();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const files = {
  "/inter.woff2": [join(root, "app", "fonts", "inter-latin-400-800.woff2"), "font/woff2"],
  "/poster.webp": [join(root, "public", "scene", "system-ring.webp"), "image/webp"],
  "/icon.svg": [join(root, "app", "icon.svg"), "image/svg+xml"],
};
for (const [, [p]] of Object.entries(files)) if (!existsSync(p)) throw new Error(`Missing ${p}`);

const L = "M8 6h15v73h73v15H8z";
const W = "M28.5 24h15l17 44h-15zM45.5 68l9-24h15l-9 24zM54.5 44h15l9 24h-15zM63.5 68l17-44h15l-17 44z";
const mark = (l, w) => `<svg viewBox="0 0 100 100" style="width:100%;height:100%"><path d="${L}" fill="${l}"/><path d="${W}" fill="${w}"/></svg>`;

const pages = {
  "/og.html": `<!doctype html><meta charset="utf-8"><style>
    @font-face { font-family: Inter; font-weight: 100 900; src: url(/inter.woff2) format("woff2"); }
    * { box-sizing: border-box; margin: 0; }
    body { width: 1200px; height: 630px; overflow: hidden; font-family: Inter, Arial, sans-serif; background: radial-gradient(46% 70% at 76% 50%, rgba(34,66,95,.10) 0%, rgba(34,66,95,0) 72%), linear-gradient(180deg, #ffffff 0%, #f4f6f7 100%); position: relative; }
    .grid { position: absolute; inset: 0; background: radial-gradient(rgba(34,66,95,.2) 1px, transparent 1.5px) 0 0/28px 28px; -webkit-mask-image: radial-gradient(60% 90% at 76% 50%, #000, transparent); }
    .logo { position: absolute; left: 76px; top: 64px; display: flex; align-items: center; gap: 14px; color: #182f46; }
    .logo i { display: block; width: 58px; height: 58px; }
    .logo b { display: block; font-size: 30px; font-weight: 800; line-height: .9; letter-spacing: -.05em; }
    h1 { position: absolute; left: 76px; top: 190px; width: 520px; font-size: 62px; font-weight: 700; line-height: 1.03; letter-spacing: -.04em; color: #191716; }
    h1 em { font-style: normal; color: #22425f; text-decoration: underline; text-decoration-color: #73c94a; text-decoration-thickness: .085em; text-underline-offset: .14em; text-decoration-skip-ink: none; }
    p { position: absolute; left: 76px; bottom: 72px; width: 520px; font-size: 25px; font-weight: 500; line-height: 1.35; color: #4b5262; }
    img { position: absolute; right: -30px; top: 53%; width: 640px; transform: translateY(-50%); }
  </style><div class="grid"></div>
  <div class="logo"><i>${mark("#22425f", "#73c94a")}</i><span><b>Literary</b><b>Works</b></span></div>
  <h1>AI and software, <em>working as one system.</em></h1>
  <p>AI, software and cloud engineering for U.S. businesses.</p>
  <img src="/poster.webp" alt="">`,
  "/tile.html": (size, rounded) => `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}img{display:block;width:${size}px;height:${size}px}</style><img src="/icon.svg" alt="">`,
  "/apple.html": `<!doctype html><meta charset="utf-8"><style>html,body{margin:0}div{width:180px;height:180px;background:#22425f;display:grid;place-items:center}span{display:block;width:126px;height:126px}</style><div><span>${mark("#ffffff", "#73c94a")}</span></div>`,
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  if (files[url.pathname]) {
    const [p, type] = files[url.pathname];
    res.writeHead(200, { "content-type": type });
    res.end(readFileSync(p));
    return;
  }
  const page = pages[url.pathname];
  if (page) {
    const size = Number(url.searchParams.get("s") || 48);
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(typeof page === "function" ? page(size) : page);
    return;
  }
  res.writeHead(404).end();
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const list =
    process.platform === "win32"
      ? ["C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"]
      : process.platform === "darwin"
        ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium"]
        : ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
  return list.find((p) => existsSync(p)) || "google-chrome";
}

const port = 9447;
const dir = mkdtempSync(join(tmpdir(), "lw-brand-"));
const proc = spawn(chromePath(), ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--hide-scrollbars", ...(process.env.CI ? ["--no-sandbox"] : []), "about:blank"], { stdio: "ignore", windowsHide: true });
for (let i = 0; i < 120; i++) {
  try {
    if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) break;
  } catch {}
  await sleep(150);
}
const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((res, rej) => {
  ws.onopen = res;
  ws.onerror = rej;
});
let id = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    const { res, rej } = pending.get(m.id);
    pending.delete(m.id);
    if (m.error) rej(new Error(m.error.message));
    else res(m.result);
  }
};
const send = (method, params = {}) =>
  new Promise((res, rej) => {
    const i = ++id;
    pending.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params }));
  });
const ev = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result.value;

async function shoot(path, w, h, opts = {}) {
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await send("Emulation.setDefaultBackgroundColorOverride", { color: opts.transparent ? { r: 0, g: 0, b: 0, a: 0 } : { r: 255, g: 255, b: 255, a: 1 } });
  await send("Page.navigate", { url: origin + path });
  for (let i = 0; i < 80; i++) {
    if ((await ev("document.readyState")) === "complete" && (await ev("document.fonts ? document.fonts.status : 'loaded'")) === "loaded") break;
    await sleep(100);
  }
  await ev("Promise.all([...document.images].map((i) => i.decode().catch(() => {})))");
  await sleep(300);
  const r = await send("Page.captureScreenshot", { format: opts.format || "png", quality: opts.quality, clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
  return Buffer.from(r.data, "base64");
}

try {
  mkdirSync(join(root, "public", "og"), { recursive: true });
  const og = await shoot("/og.html", 1200, 630, { format: "jpeg", quality: 90 });
  writeFileSync(join(root, "public", "og", "literaryworks.jpg"), og);
  console.log(`public/og/literaryworks.jpg  1200x630  ${(og.length / 1024).toFixed(0)} kB`);

  const apple = await shoot("/apple.html", 180, 180);
  writeFileSync(join(root, "app", "apple-icon.png"), apple);
  console.log(`app/apple-icon.png  180x180  ${(apple.length / 1024).toFixed(1)} kB`);

  const sizes = [16, 32, 48];
  const pngs = [];
  for (const s of sizes) pngs.push({ size: s, buf: await shoot(`/tile.html?s=${s}`, s, s, { transparent: true }) });
  // an ICO file is a small header, one 16-byte entry per picture, then the pictures (PNG is allowed inside)
  const head = Buffer.alloc(6);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, buf }) => {
    const e = Buffer.alloc(16);
    e[0] = size;
    e[1] = size;
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += buf.length;
    return e;
  });
  const icoFile = Buffer.concat([head, ...entries, ...pngs.map((p) => p.buf)]);
  writeFileSync(join(root, "app", "favicon.ico"), icoFile);
  console.log(`app/favicon.ico  16, 32, 48 px  ${(icoFile.length / 1024).toFixed(1)} kB`);
} finally {
  ws.close();
  try {
    if (process.platform === "win32") spawn("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    else proc.kill();
  } catch {}
  server.close();
  setTimeout(() => {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {}
    process.exit(0);
  }, 1500);
}
