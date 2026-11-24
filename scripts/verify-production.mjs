// Checks a running production build in a real (headless) Chrome. No dependencies: it talks to Chrome over the
// DevTools Protocol with Node's built-in fetch and WebSocket (Node 22).
//
//   npm run build && npm run start -- -p 3000      (in another terminal)
//   node scripts/verify-production.mjs http://127.0.0.1:3000
//
// Environment: CHROME_PATH (default: the usual Chrome, Chromium or Edge locations), SHOTS_DIR (default previews),
// CI (adds the flags a container needs).
//
// What it checks, following the scroll-driven 3D storytelling skill's "fallbacks and checks":
//   1. every page in the sitemap answers 200 with a title and exactly one <h1>
//   2. desktop: motion starts and every 3D scene on the site (the home story, which plays by itself, the services and work decks, a
//      service page, the audit and about pages) builds without an error, changes the copy as the
//      page scrolls, draws a picture that moves with the scroll, moves on to its next object with the copy, and keeps ONE shared canvas that
//      moves from scene to scene; the model stays clear of the copy and of the header on small and wide windows
//   3. phone: no motion, no three.js, GSAP or Lenis code is downloaded, the hero picture loads, the plain list takes
//      the deck's place, no sideways scrolling, a small script budget
//   4. reduced motion: the static layout, again without those libraries
//   5. JavaScript off: everything is visible
//   5b. a browser without WebGL: the scenes step aside at once and the static page takes over
//   6. the inquiry API validates its input
// Screenshots are written to the previews folder.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = (process.argv[2] || "http://127.0.0.1:3000").replace(/\/+$/, "");
const shots = process.env.SHOTS_DIR || "previews";
mkdirSync(shots, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** What a phone may download in script (compressed), on the home page. */
const SCRIPT_BUDGET_KB = 150;

const failures = [];
let passed = 0;
const check = (ok, what, detail = "") => {
  if (ok) {
    passed++;
    console.log(`  ok    ${what}`);
  } else {
    failures.push(`${what}${detail ? ` (${detail})` : ""}`);
    console.log(`  FAIL  ${what}${detail ? ` (${detail})` : ""}`);
  }
};

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const list =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
          "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        ]
      : process.platform === "darwin"
        ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium"]
        : ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
  return list.find((p) => existsSync(p)) || "google-chrome";
}

async function launch(port = 9444, { webgl = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "lw-verify-"));
  const flags = [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${dir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--hide-scrollbars",
    "--mute-audio",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
  ];
  if (process.env.CI) flags.push("--no-sandbox");
  // a browser with WebGL switched off (to check the fallback), or, with no GPU (a container), the software renderer
  if (!webgl) flags.push("--disable-3d-apis", "--disable-webgl", "--disable-webgl2");
  else if (process.env.CI || process.env.SOFTWARE_GL) flags.push("--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist");
  const proc = spawn(chromePath(), [...flags, "about:blank"], { stdio: "ignore", windowsHide: true });
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) break;
    } catch {}
    await sleep(150);
  }
  const close = () => {
    try {
      if (process.platform === "win32") spawn("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
      else proc.kill();
    } catch {}
    setTimeout(() => {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {}
    }, 1500);
  };
  return { port, close };
}

async function openPage(port) {
  const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });
  let id = 0;
  const pending = new Map();
  const handlers = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      if (m.error) rej(new Error(m.error.message));
      else res(m.result);
    } else if (m.method) (handlers.get(m.method) || []).forEach((h) => h(m.params));
  };
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const i = ++id;
      pending.set(i, { res, rej });
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  const on = (method, h) => handlers.set(method, [...(handlers.get(method) || []), h]);
  const ev = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  return { send, on, ev, close: () => ws.close() };
}

/** Opens a page with the given conditions and returns it once the document has loaded. */
async function visit(chrome, path, { width, height, mobile = false, reduced = false, noScript = false }) {
  const page = await openPage(chrome.port);
  page.errors = [];
  page.failed = [];
  page.foreign = [];
  page.warnings = [];
  await page.send("Runtime.enable");
  await page.send("Page.enable");
  await page.send("Network.enable");
  page.on("Network.requestWillBeSent", (e) => {
    if (/^https?:/.test(e.request.url) && !e.request.url.startsWith(base)) page.foreign.push(e.request.url);
  });
  page.on("Network.responseReceived", (e) => {
    if (e.response.status >= 400) page.failed.push(`${e.response.status} ${e.response.url}`);
  });
  page.on("Network.loadingFailed", (e) => {
    if (!e.canceled) page.failed.push(`${e.errorText} ${e.requestId}`);
  });
  page.on("Runtime.exceptionThrown", (e) => page.errors.push(e.exceptionDetails.exception?.description || e.exceptionDetails.text));
  page.on("Runtime.consoleAPICalled", (e) => {
    const text = e.args.map((a) => a.value ?? a.description ?? "").join(" ");
    if (e.type === "error") page.errors.push(text);
    if (e.type === "warning") page.warnings.push(text);
  });
  await page.send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
  if (reduced) await page.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  if (noScript) await page.send("Emulation.setScriptExecutionDisabled", { value: true });
  if (mobile) await page.send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36" });
  await page.send("Page.navigate", { url: base + path });
  for (let i = 0; i < 80; i++) {
    try {
      if ((await page.ev("document.readyState")) === "complete") break;
    } catch {}
    await sleep(250);
  }
  return page;
}

async function shot(page, name) {
  const r = await page.send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(shots, name), Buffer.from(r.data, "base64"));
}

/** Which of the heavy libraries did this page download? (looks inside every script it fetched) */
const libraries = (page) =>
  page.ev(`(async () => {
    const urls = performance.getEntriesByType('resource').filter(r => r.name.endsWith('.js')).map(r => r.name);
    const found = new Set();
    for (const u of urls) {
      const t = await (await fetch(u)).text();
      if (/WebGLRenderer/.test(t)) found.add('three.js');
      if (/_gsap/.test(t)) found.add('GSAP');
      if (/refreshPriority/.test(t)) found.add('ScrollTrigger');
      if (/lenis-stopped|lenis-smooth/.test(t)) found.add('Lenis');
    }
    return [...found];
  })()`);

const sceneState = (page, id = ".xp") =>
  page.ev(`(() => { const h = document.documentElement.classList; const x = document.querySelector(${JSON.stringify(id)}); return { motion: h.contains('motion'), ready: h.contains('motion-ready'), live: !!x && x.classList.contains('xp-live'), failed: !!x && x.classList.contains('xp-failed') }; })()`);

async function waitForScene(page, id = ".xp") {
  for (let i = 0; i < 100; i++) {
    const s = await sceneState(page, id);
    if (s.failed || (s.ready && s.live)) return s;
    await sleep(250);
  }
  return sceneState(page, id);
}

/** Scrolls to a fraction of a pinned scene and reports which copy is showing. */
async function copyAt(page, selector, p) {
  const y = await page.ev(`(() => { const s = document.querySelector(${JSON.stringify(selector)}); const top = s.getBoundingClientRect().top + scrollY; const stp = parseFloat(getComputedStyle(s.querySelector('.xp-stage')).top); const st = Number.isFinite(stp) ? stp : 0; const start = Math.max(0, top - st); const end = top + s.offsetHeight - innerHeight; return start + ${p} * (end - start); })()`);
  await page.ev(`window.scrollTo(0, ${y})`);
  await sleep(2800);
  return page.ev(`[...document.querySelectorAll('${selector} [data-phase]')].map(e => ({ t: (e.querySelector('h1,h2')?.textContent || '').trim(), o: Number(getComputedStyle(e).opacity) })).filter(x => x.o > 0.6).map(x => x.t)`);
}

/**
 * The home hero and the other stories (the services page, a service page, the audit and about pages) play by themselves (no
 * runway to scroll). On a page opened with `?beat=60000` (beats a minute long, so it stands still while it is measured):
 * presses the bar of beat k, waits for the camera to arrive and the words to change, and reports which copy is showing.
 */
async function heroBeat(page, k, id = "#story") {
  await page.ev(`document.querySelector('${id} [data-auto-step="${k}"]').click()`);
  for (let i = 0; i < 80; i++) {
    if (await page.ev(`document.querySelector('${id}').dataset.moving === 'false' && document.querySelector('${id}').dataset.beat === '${k}'`)) break;
    await sleep(150);
  }
  await sleep(1500);
  return page.ev(`[...document.querySelectorAll('${id} [data-phase]')].map(e => ({ t: (e.querySelector('h1,h2')?.textContent || '').trim(), o: Number(getComputedStyle(e).opacity) })).filter(x => x.o > 0.6).map(x => x.t)`);
}

/** Scrolls a scene that starts further down the page into reach (they only start when near) and waits until it is live. */
async function reach(page, id) {
  await copyAt(page, id, 0.02);
  return waitForScene(page, id);
}

/** Where the one shared 3D canvas is: how many there are, and which scene it is in. */
const canvasHome = (page) => page.ev("(() => { const c = document.querySelectorAll('canvas'); return { n: c.length, id: c[0] ? (c[0].closest('.xp')?.id ?? null) : null }; })()");

const shootUrl = async (page) => "data:image/png;base64," + (await page.send("Page.captureScreenshot", { format: "png" })).data;

/** How different two pictures are: the mean difference of the three colours (0 to 255), and the share of pixels whose three colours differ by more than `min` in all (150 by default: "by a lot"). */
const compare = (page, a, b, min = 150) =>
  page.ev(`(async () => {
    const load = (u) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = u; });
    const [x, y] = await Promise.all([load(${JSON.stringify(a)}), load(${JSON.stringify(b)})]);
    const c = document.createElement('canvas'); c.width = x.width; c.height = x.height;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(x, 0, 0); const d1 = g.getImageData(0, 0, c.width, c.height).data;
    g.clearRect(0, 0, c.width, c.height); g.drawImage(y, 0, 0); const d2 = g.getImageData(0, 0, c.width, c.height).data;
    let s = 0, n = 0;
    for (let i = 0; i < d1.length; i += 4) { const d = Math.abs(d1[i] - d2[i]) + Math.abs(d1[i + 1] - d2[i + 1]) + Math.abs(d1[i + 2] - d2[i + 2]); s += d; if (d > ${min}) n++; }
    return { mean: s / (d1.length / 4) / 3, strong: n / (d1.length / 4) };
  })()`);

/**
 * The share of the window the 3D picture covers: the window with and without its canvas. A pixel counts when the
 * picture changes it visibly (the three colours differ by more than 45 in all): the scenes are mostly white and
 * pale objects on a pale page, so only counting strong contrast would call a light picture empty.
 */
async function coverage(page) {
  const withIt = await shootUrl(page);
  await page.ev("document.querySelector('canvas.xp-gl').style.visibility = 'hidden'");
  await sleep(250);
  const without = await shootUrl(page);
  await page.ev("document.querySelector('canvas.xp-gl').style.visibility = ''");
  return (await compare(page, withIt, without, 45)).strong;
}

async function main() {
  console.log(`Checking ${base}\n`);

  // 1. every page in the sitemap
  console.log("Pages");
  const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
  const paths = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  check(paths.length > 10, "the sitemap lists the pages", `${paths.length} found`);
  const robots = await fetch(`${base}/robots.txt`);
  check(robots.ok, "robots.txt answers");
  for (const p of paths) {
    const res = await fetch(base + p);
    const html = await res.text();
    const h1 = (html.match(/<h1[\s>]/g) || []).length;
    const title = /<title>[^<]{4,}<\/title>/.test(html);
    check(res.status === 200 && title && h1 === 1, p || "/", `status ${res.status}, title ${title}, h1 x${h1}`);
  }
  check((await fetch(`${base}/no-such-page`)).status === 404, "an unknown address gives a 404");

  const chrome = await launch();
  try {
    // 2. desktop with motion: every pinned 3D scene on the site
    console.log("\nDesktop, motion on (1440x900)");
    const runways = [
      { path: "/", id: "#story", name: "home story", auto: true },
      { path: "/services", id: "#services-deck", name: "services story", auto: true },
      { path: "/work", id: "#cases-deck", name: "work deck", at: [0.03, 0.3, 0.64] },
      { path: "/services/ai-voice-systems", id: "#top", name: "service page", auto: true },
      { path: "/ai-audit", id: "#top", name: "audit page", auto: true },
      { path: "/about", id: "#top", name: "about page", auto: true },
    ];
    for (const r of runways) {
      const page = await visit(chrome, r.path, { width: 1440, height: 900 });
      const s = r.auto || r.id === "#top" ? await waitForScene(page, r.id) : await reach(page, r.id);
      check(s.motion && s.ready, `${r.name}: motion starts`);
      check(s.live && !s.failed, `${r.name}: the 3D scene is live`, s.failed ? "it fell back to the static section" : "");
      const auto = !!r.auto;
      if (auto) {
        // the hero plays by itself: one screen tall, the next section right under it, and the beat moves on with no scrolling
        // (the next section is the next one that takes room: a hidden plain list may sit in between)
        const geo = await page.ev(`(() => { const s = document.querySelector('${r.id}'); let n = s.nextElementSibling; while (n && !n.offsetHeight) n = n.nextElementSibling; return { h: s.offsetHeight, vh: innerHeight, next: Math.round(n.getBoundingClientRect().top) }; })()`);
        check(geo.h === geo.vh && geo.next === geo.vh, `${r.name}: one screen tall, the next section right under it`, JSON.stringify(geo));
        let moved = false;
        for (let i = 0; i < 100 && !moved; i++) {
          moved = (await page.ev(`document.querySelector('${r.id}').dataset.beat`)) !== "0";
          if (!moved) await sleep(200);
        }
        check(moved, `${r.name}: it plays by itself (the beat moves on without scrolling)`);
        const bars = await page.ev(`document.querySelectorAll('${r.id} [data-auto-step]').length === document.querySelectorAll('${r.id} [data-phase]').length`);
        check(bars, `${r.name}: a bar for each beat`);
        // the rest is measured with beats a minute long, so it stands still meanwhile
        await page.send("Page.navigate", { url: `${base}${r.path}?beat=60000` });
        await sleep(1500);
        await waitForScene(page, r.id);
      }
      const first = auto ? await heroBeat(page, 0, r.id) : await copyAt(page, r.id, r.at[0]);
      const frameA = await shootUrl(page);
      const later = auto ? await heroBeat(page, 3, r.id) : await copyAt(page, r.id, r.at[2]);
      check(first.length === 1 && later.length === 1 && first[0] !== later[0], `${r.name}: the copy changes ${auto ? "with the beat" : "as you scroll"}`, `${first} -> ${later}`);
      const home = await canvasHome(page);
      check(home.n === 1 && `#${home.id}` === r.id, `${r.name}: one 3D canvas, in this scene`, JSON.stringify(home));
      if (r.tags) {
        await copyAt(page, r.id, 0.55);
        const shown = await page.ev("[...document.querySelectorAll('.xp-labels li')].filter(e => Number(getComputedStyle(e).opacity) > 0.9).length");
        check(shown === r.tags, `${r.name}: all ${r.tags} tags show once the scene is connected`, `${shown} shown`);
      }
      // the picture is there and it moves with the scroll (the hero: with the beat)
      if (auto) await heroBeat(page, 1, r.id);
      else await copyAt(page, r.id, r.at[1]);
      const share = await coverage(page);
      check(share > 0.02, `${r.name}: the 3D picture is drawn`, `${(share * 100).toFixed(1)}% of the window`);
      const frameB = await shootUrl(page);
      const moved = await compare(page, frameA, frameB);
      check(moved.mean > 1.5, `${r.name}: the picture changes ${auto ? "with the beat" : "as you scroll"}`, `mean difference ${moved.mean.toFixed(2)} of 255`);
      await shot(page, `${r.name.replace(/\W+/g, "-")}-desktop.png`);
      check(page.errors.length === 0, `${r.name}: no console errors`, page.errors[0]?.slice(0, 120));
      check(page.failed.length === 0, `${r.name}: no request fails`, page.failed[0]);
      check(page.foreign.length === 0, `${r.name}: nothing is requested from another site`, page.foreign[0]);
      page.close();
    }

    // 2a. scroll down the whole home page: nothing that should have revealed itself may still be hidden
    {
      const page = await visit(chrome, "/", { width: 1440, height: 900 });
      await waitForScene(page, "#story");
      const total = await page.ev("document.documentElement.scrollHeight");
      for (let y = 0; y < total; y += 500) {
        await page.ev(`window.scrollTo(0, ${y})`);
        await sleep(250);
      }
      await sleep(1800);
      const stuck = await page.ev("[...document.querySelectorAll('[data-reveal], [data-stagger] > *, [data-wipe], .split-part')].filter((e) => !e.closest('.xp') && (Number(getComputedStyle(e).opacity) < 0.99 || (e.classList.contains('split-part') && !/matrix\\(1, 0, 0, 1, 0, 0\\)|none/.test(getComputedStyle(e).transform)))).length");
      check(stuck === 0, "home: every scroll reveal completes", `${stuck} still hidden`);
      // the services grid: nine cards, each with its picture loaded, and no pinned runway in the way (the pictures are lazy:
      // bring the grid on screen and give them a moment)
      await page.ev("document.querySelector('#services')?.scrollIntoView({ block: 'center' })");
      for (let i = 0; i < 40; i++) {
        if (await page.ev("[...document.querySelectorAll('#services .svc-card img')].every((i) => i.complete && i.naturalWidth > 0)")) break;
        await sleep(250);
      }
      const grid = await page.ev("(() => { const s = document.querySelector('#services'); if (!s) return null; const imgs = [...s.querySelectorAll('.svc-card img')]; return { cards: s.querySelectorAll('.svc-card').length, loaded: imgs.filter((i) => i.complete && i.naturalWidth > 0).length, pinned: !!s.closest('.xp') || s.classList.contains('xp') }; })()");
      check(grid && grid.cards === 9 && grid.loaded === 9 && !grid.pinned, "home: the services grid shows nine cards with their pictures", JSON.stringify(grid));
      page.close();
    }

    // 2a2. the case studies reel on the home page: pinned, and the cards slide sideways while you scroll through it
    {
      const page = await visit(chrome, "/", { width: 1440, height: 900 });
      await waitForScene(page, "#story");
      let live = false;
      for (let i = 0; i < 40 && !live; i++) {
        live = await page.ev("!!document.querySelector('#work.reel.is-live')");
        if (!live) await sleep(250);
      }
      check(live, "home: the case studies reel is pinned (motion on)");
      // (with the software renderer the shaders compile on the main thread, which can hold it for many seconds after the
      // page opens; so wait for the reel to answer instead of reading it once)
      const read = () => page.ev("(() => { const t = document.querySelector('[data-reel-track]'); const m = new DOMMatrix(getComputedStyle(t).transform); const b = document.querySelector('[data-reel-bar]'); return { x: m.m41, bar: new DOMMatrix(getComputedStyle(b).transform).a }; })()");
      const at = async (p, until) => {
        const y = await page.ev(`(() => { const s = document.querySelector('#work'); const top = s.getBoundingClientRect().top + scrollY; return top + ${p} * (s.offsetHeight - innerHeight); })()`);
        await page.ev(`window.scrollTo(0, ${y})`);
        await sleep(3200);
        let r = await read();
        for (let i = 0; i < 60 && until && !until(r); i++) {
          await sleep(500);
          r = await read();
        }
        return r;
      };
      const start = await at(0.02);
      // through the middle like a visitor, so every card passes the screen (their pictures are lazy)
      let prev = start;
      for (const p of [0.35, 0.65]) prev = await at(p, (r) => r.x < prev.x - 100);
      const end = await at(0.98, (r) => r.x < start.x - 500 && r.bar > start.bar + 0.5);
      check(end.x < start.x - 500, "home: the reel's cards slide sideways as you scroll", `from ${Math.round(start.x)} to ${Math.round(end.x)} px`);
      check(end.bar > start.bar + 0.5, "home: the reel's green line fills as you scroll", `from ${start.bar.toFixed(2)} to ${end.bar.toFixed(2)}`);
      let pics = 0;
      for (let i = 0; i < 40; i++) {
        pics = await page.ev("[...document.querySelectorAll('#work .reel-img img')].filter((i) => i.complete && i.naturalWidth > 0).length");
        if (pics === 6) break;
        await sleep(250);
      }
      check(pics === 6, "home: all six case study pictures load", `${pics} loaded`);
      page.close();
    }

    // 2b. the model never runs over the copy, on a small laptop or an ultra-wide screen (the canvas is drawn with and without; only the copy's area is compared)
    console.log("\nLayout (the 3D model and the copy)");
    // (the home story, the services story and one service page, the audit and about pages: each at its own beats)
    const stories = [
      { name: "home", path: "/", id: "#story", beats: [0, 1, 3] },
      { name: "services", path: "/services", id: "#services-deck", beats: [0, 1, 4, 9] },
      { name: "service page", path: "/services/ai-voice-systems", id: "#top", beats: [0, 1, 2, 3] },
      { name: "audit", path: "/ai-audit", id: "#top", beats: [0, 1, 2, 3] },
      { name: "about", path: "/about", id: "#top", beats: [0, 1, 2, 3] },
    ];
    for (const st of stories)
    for (const [w, h] of st.name === "home" ? [[1024, 768], [1280, 640], [1440, 900], [2560, 1080]] : [[1024, 768], [1280, 640], [1440, 900]]) {
      for (const p of st.beats) {
        const page = await visit(chrome, `${st.path}?beat=60000`, { width: w, height: h });
        await waitForScene(page, st.id);
        await heroBeat(page, p, st.id);
        const box = await page.ev(`(() => {
          const phase = [...document.querySelectorAll('.xp-phase')].sort((a, b) => Number(getComputedStyle(b).opacity) - Number(getComputedStyle(a).opacity))[0];
          const parts = [...phase.querySelectorAll('.kicker, h1, h2, .lead, .btn')].map((e) => e.getBoundingClientRect());
          const x0 = Math.min(...parts.map((r) => r.left)), y0 = Math.min(...parts.map((r) => r.top)), x1 = Math.max(...parts.map((r) => r.right)), y1 = Math.max(...parts.map((r) => r.bottom));
          return { x: x0, y: y0, width: x1 - x0, height: y1 - y0, controls: document.querySelector('.xp-controls').getBoundingClientRect().top, header: document.querySelector('.site-header-bar').getBoundingClientRect().bottom };
        })()`);
        const sy = await page.ev("scrollY");
        const { controls, header, ...rect } = box;
        check(rect.y + rect.height <= controls - 4 && rect.y >= header - 4, `${st.name} ${w}x${h}, beat ${p + 1}: the copy fits between the header and the beat bars`, `copy ${Math.round(rect.y)}-${Math.round(rect.y + rect.height)} px, header ends ${Math.round(header)}, bars start ${Math.round(controls)}`);
        const shoot = async () => "data:image/png;base64," + (await page.send("Page.captureScreenshot", { format: "png", clip: { ...rect, y: rect.y + sy, scale: 1 } })).data;
        const withModel = await shoot();
        await page.ev("document.querySelector('.xp-canvas').style.visibility = 'hidden'");
        await sleep(300);
        const without = await shoot();
        const { strong } = await compare(page, withModel, without);
        check(strong < 0.002, `${st.name} ${w}x${h}, beat ${p + 1}: the model stays clear of the copy`, `${(strong * 100).toFixed(2)}% of the copy's area is covered`);
        // and clear of the floating header
        await page.ev("document.querySelector('.xp-canvas').style.visibility = ''");
        const headerShare = await page.ev("(() => { const b = document.querySelector('.site-header-bar').getBoundingClientRect(); return b.bottom; })()");
        check(headerShare < 100, `${st.name} ${w}x${h}, beat ${p + 1}: the header leaves room (its bottom edge is at ${Math.round(headerShare)} px)`);
        page.close();
      }
    }

    // 2c. the page keeps working when you move around and resize the window
    console.log("\nNavigation and resizing");
    {
      const page = await visit(chrome, "/", { width: 1440, height: 900 });
      await waitForScene(page, "#story");
      const waitFor = async (expr, tries = 100) => {
        for (let i = 0; i < tries; i++) {
          try {
            if (await page.ev(expr)) return true;
          } catch {}
          await sleep(200);
        }
        return false;
      };
      let ok = true;
      let moved = true;
      for (let round = 0; round < 2; round++) {
        await page.ev("document.querySelector('.site-nav a[href=\"/services\"]').click()");
        ok = ok && (await waitFor("location.pathname === '/services' && !!document.querySelector('.xp-deck.xp-live')"));
        await sleep(600);
        const onServices = await canvasHome(page);
        moved = moved && onServices.n === 1 && onServices.id === "services-deck";
        await page.ev("document.querySelector('.brand').click()");
        ok = ok && (await waitFor("location.pathname === '/' && !!document.querySelector('#story.xp-live')", 150));
        const onHome = await canvasHome(page);
        moved = moved && onHome.n === 1 && onHome.id === "story";
      }
      check(ok, "client-side navigation: the home page and the services page (twice) each rebuild their 3D scene");
      check(moved, "the one shared canvas moves with the page: never zero, never two");
      await page.ev("document.querySelector('.site-nav a[href=\"/contact\"], .site-cta a').click()");
      await waitFor("location.pathname === '/contact'");
      await sleep(800);
      check(await page.ev("document.querySelectorAll('canvas').length === 0"), "a page without a scene leaves no canvas behind");
      await page.ev("history.back()");
      await waitFor("location.pathname === '/' && !!document.querySelector('#story.xp-live')", 150);
      const contexts = page.warnings.filter((t) => /WebGL/i.test(t) && /context|too many/i.test(t));
      check(contexts.length === 0, "no WebGL context warnings after repeated visits", contexts[0]?.slice(0, 100));
      let sized = true;
      for (const [w, h] of [[1100, 800], [1920, 1080], [1440, 900]]) {
        await page.send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
        await sleep(1500);
        sized = sized && (await page.ev("(() => { const c = document.querySelector('canvas.xp-gl'); const h = c.parentElement; return !!document.querySelector('.xp.xp-live') && Math.abs(c.clientWidth - h.clientWidth) <= 1 && Math.abs(c.clientHeight - h.clientHeight) <= 1; })()"));
      }
      check(sized, "resizing the window keeps the 3D picture the size of its stage");
      check(page.errors.length === 0, "no console errors while moving around and resizing", page.errors[0]?.slice(0, 120));
      page.close();
    }

    // 3. phone
    console.log("\nPhone (390x844)");
    for (const path of ["/", "/services", "/services/ai-automation", "/work"]) {
      const page = await visit(chrome, path, { width: 390, height: 844, mobile: true });
      await sleep(1200);
      const s = await sceneState(page);
      check(!s.motion, `${path}: no motion class on a phone`);
      const libs = await libraries(page);
      check(libs.length === 0, `${path}: no three.js, GSAP or Lenis is downloaded`, libs.join(", "));
      const wide = await page.ev("document.documentElement.scrollWidth - innerWidth");
      check(wide <= 1, `${path}: no sideways scrolling`, `${wide}px too wide`);
      if (path === "/") {
        const picture = await page.ev("(() => { const i = document.querySelector('.xp-poster img'); return !!i && i.complete && i.naturalWidth > 0; })()");
        check(picture, "the hero picture (a render of the real 3D scene) loads");
        // (the page's own fetches of the same files, made by the library check above, are not downloads)
        const kb = await page.ev("Math.round(performance.getEntriesByType('resource').filter((r) => /\\.js(\\?|$)/.test(r.name) && r.initiatorType !== 'fetch').reduce((n, r) => n + r.encodedBodySize, 0) / 1024)");
        console.log(`        (script on a phone: ${kb} kB)`);
        check(kb <= SCRIPT_BUDGET_KB, `the phone downloads at most ${SCRIPT_BUDGET_KB} kB of script`, `${kb} kB`);
        await shot(page, "home-phone.png");
        // an in-page link lands on its section (it did not while the sections below the first screen were laid out lazily)
        await page.ev("document.querySelector('a[href$=\"#method\"]')?.click()");
        await sleep(900);
        const top = await page.ev("Math.round(document.querySelector('#method')?.getBoundingClientRect().top ?? -1)");
        check(top >= 0 && top < 200, "an in-page link (See how we build) lands on its section", `${top}px from the top of the window`);
        // Back returns to the same place: a fresh visit (lower sections laid out lazily), scroll down by hand, open a
        // service, come back
        await page.send("Page.navigate", { url: `${base}/` });
        await sleep(2500);
        const lazy = await page.ev("document.documentElement.classList.contains('lazy')");
        for (let i = 0; i < 60; i++) {
          await page.ev("window.scrollBy(0, 400)");
          await sleep(100);
          if ((await page.ev("document.querySelector('#method').getBoundingClientRect().top")) < 150) break;
        }
        await sleep(500);
        const was = await page.ev("Math.round(document.querySelector('#method').getBoundingClientRect().top)");
        await page.ev("document.querySelector('#services .svc-card').click()");
        await sleep(2500);
        await page.ev("history.back()");
        await sleep(2500);
        const back = await page.ev("Math.round(document.querySelector('#method').getBoundingClientRect().top)");
        check(lazy && Math.abs(back - was) < 60, "Back after opening a service returns to the same place", `lazy ${lazy}, #method at ${was}px, after Back ${back}px`);
      }
      if (path === "/services" || path === "/work") {
        const list = await page.ev("(() => { const f = document.querySelector('.deck-fallback'); const d = document.querySelector('.xp-deck'); return { list: !!f && f.offsetHeight > 200, deck: !!d && getComputedStyle(d).display !== 'none' }; })()");
        check(list.list && !list.deck, `${path}: the plain list is shown and the 3D deck is not`, JSON.stringify(list));
      }
      check(page.failed.length === 0, `${path}: no request fails`, page.failed[0]);
      page.close();
    }

    // 4. reduced motion
    console.log("\nReduced motion (1366x768)");
    for (const path of ["/", "/services"]) {
      const page = await visit(chrome, path, { width: 1366, height: 768, reduced: true });
      await sleep(1200);
      const s = await sceneState(page);
      check(!s.motion, `${path}: no motion class`);
      const libs = await libraries(page);
      check(libs.length === 0, `${path}: no three.js, GSAP or Lenis is downloaded`, libs.join(", "));
      await shot(page, `${path === "/" ? "home" : "services"}-reduced-motion.png`);
      page.close();
    }

    // 5. JavaScript off
    console.log("\nJavaScript off");
    for (const path of ["/", "/services"]) {
      const page = await visit(chrome, path, { width: 1366, height: 768, noScript: true });
      await sleep(2500); // the hero's short CSS fade-in has finished by then
      const hidden = await page.ev("[...document.querySelectorAll('h1, h2, p.lead, .xp-phase')].filter(e => !e.closest('.xp-deck') && (Number(getComputedStyle(e).opacity) < 0.99 || getComputedStyle(e).visibility === 'hidden')).length");
      check(hidden === 0, `${path}: all headings and copy are visible`, `${hidden} hidden`);
      page.close();
    }
  } finally {
    chrome.close();
  }

  // 5b. a browser without WebGL: the 3D sections step aside and the static page takes over
  console.log("\nNo WebGL");
  {
    const bare = await launch(9445, { webgl: false });
    try {
      const page = await visit(bare, "/", { width: 1440, height: 900 });
      let failed = false;
      for (let i = 0; i < 120 && !failed; i++) {
        failed = await page.ev("!!document.querySelector('.xp.xp-failed')");
        if (!failed) await sleep(250);
      }
      check(failed, "the 3D section falls back to the static layout");
      const view = await page.ev(`(() => {
        const img = document.querySelector('.xp-poster img');
        const stage = document.querySelector('.xp-stage');
        const xp = document.querySelector('.xp');
        return {
          picture: !!img && img.complete && img.naturalWidth > 0 && img.getBoundingClientRect().width > 100,
          copy: [...document.querySelectorAll('#story .xp-phase')].every((e) => Number(getComputedStyle(e).opacity) === 1),
          sticky: getComputedStyle(stage).position === 'sticky',
          // a runway is height beyond the stage itself; the static layout is only as tall as its content
          tall: xp.offsetHeight > stage.offsetHeight + 40,
          sideways: document.documentElement.scrollWidth - innerWidth,
        };
      })()`);
      check(view.picture && view.copy, "the still picture and all the copy are visible", JSON.stringify(view));
      check(!view.sticky && !view.tall && view.sideways <= 1, "no pinned runway is left over (normal height, no sideways scroll)", JSON.stringify(view));
      page.close();
      // the services page: its deck gives way to the plain list
      const svc = await visit(bare, "/services", { width: 1440, height: 900 });
      let gone = false;
      for (let i = 0; i < 120 && !gone; i++) {
        gone = await svc.ev("!!document.querySelector('.xp-deck.xp-failed') || getComputedStyle(document.querySelector('.xp-deck')).display === 'none'");
        if (!gone) await sleep(250);
      }
      const list = await svc.ev("(() => { const d = document.querySelector('.xp-deck'); const f = document.querySelector('.deck-fallback'); return { deckHidden: !!d && getComputedStyle(d).display === 'none', listShown: !!f && f.offsetHeight > 200 }; })()");
      check(list.deckHidden && list.listShown, "the services deck gives way to the plain list", JSON.stringify(list));
      svc.close();
    } finally {
      bare.close();
    }
  }

  // 6. the inquiry API
  console.log("\nInquiry API");
  // each request comes from its own made-up address (the API limits one address to 8 in ten minutes)
  let nth = 0;
  const post = (body, address = `203.0.113.${((Date.now() + ++nth * 7) % 250) + 1}`) =>
    fetch(`${base}/api/inquiry`, { method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": address }, body: JSON.stringify(body) });
  check((await post({ name: "A" })).status === 400, "rejects an incomplete message");
  check((await post({ name: "Test", email: "not-an-email", interest: "Free AI audit", message: "A message long enough." })).status === 400, "rejects a bad email address");
  check((await post({ name: "Bot", email: "bot@example.com", interest: "Free AI audit", message: "Spam spam spam spam", website: "http://spam.example" })).status === 200, "answers a bot's honeypot without delivering");
  const valid = await post({ name: "Test Person", email: "test@example.com", company: "", interest: "Free AI audit", message: "A message long enough to pass." });
  check([200, 502, 503].includes(valid.status), "a valid message is accepted or the inbox is reported as not configured", `status ${valid.status}`);
  const same = `198.51.100.${(Date.now() % 250) + 1}`;
  let last = 0;
  for (let i = 0; i < 9; i++) last = (await post({ name: "A" }, same)).status;
  check(last === 429, "the ninth request from one address within ten minutes is refused (429)", `status ${last}`);

  console.log(`\n${passed} checks passed, ${failures.length} failed. Screenshots are in ${shots}/`);
  if (failures.length) {
    console.log("\nFailed:\n - " + failures.join("\n - "));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
