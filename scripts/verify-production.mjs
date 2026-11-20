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
//   2. desktop: motion starts, the 3D scene builds (no error), the copy changes as the page scrolls, all seven
//      labels show when the model is open, and the last frame matches the first (the scene closes exactly)
//   3. phone: no motion, no three.js, GSAP or Lenis code is downloaded, the hero picture loads, no sideways
//      scrolling, a small script budget
//   4. reduced motion: the static layout, again without those libraries
//   5. JavaScript off: everything is visible
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

const sceneState = (page) =>
  page.ev(`(() => { const h = document.documentElement.classList; const x = document.querySelector('.xp'); return { motion: h.contains('motion'), ready: h.contains('motion-ready'), live: !!x && x.classList.contains('xp-live'), failed: !!x && x.classList.contains('xp-failed') }; })()`);

async function waitForScene(page) {
  for (let i = 0; i < 100; i++) {
    const s = await sceneState(page);
    if (s.failed || (s.ready && s.live)) return s;
    await sleep(250);
  }
  return sceneState(page);
}

/** Scrolls to a fraction of a pinned scene and reports which copy is showing. */
async function copyAt(page, selector, p) {
  const y = await page.ev(`(() => { const s = document.querySelector(${JSON.stringify(selector)}); const top = s.getBoundingClientRect().top + scrollY; const stp = parseFloat(getComputedStyle(s.querySelector('.xp-stage')).top); const st = Number.isFinite(stp) ? stp : 0; const start = Math.max(0, top - st); const end = top + s.offsetHeight - innerHeight; return start + ${p} * (end - start); })()`);
  await page.ev(`window.scrollTo(0, ${y})`);
  await sleep(2800);
  return page.ev(`[...document.querySelectorAll('${selector} [data-phase]')].map(e => ({ t: (e.querySelector('h1,h2')?.textContent || '').trim(), o: Number(getComputedStyle(e).opacity) })).filter(x => x.o > 0.6).map(x => x.t)`);
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
    // 2. desktop with motion
    console.log("\nDesktop, motion on (1440x900)");
    for (const [path, id, name] of [["/", "#story", "home"]]) {
      const page = await visit(chrome, path, { width: 1440, height: 900 });
      const s = await waitForScene(page);
      check(s.motion && s.ready, `${name}: motion starts`);
      check(s.live && !s.failed, `${name}: the 3D scene is live`, s.failed ? "it fell back to the static section" : "");
      const first = await copyAt(page, id, 0.05);
      const later = await copyAt(page, id, 0.55);
      check(first.length === 1 && later.length === 1 && first[0] !== later[0], `${name}: the copy changes as you scroll`, `${first} -> ${later}`);
      // the opened model names all seven of its layers
      await copyAt(page, id, 0.5);
      const shown = await page.ev("[...document.querySelectorAll('.xp-labels li')].filter(e => Number(getComputedStyle(e).opacity) > 0.9).length");
      check(shown === 7, `${name}: the opened model shows all seven labels`, `${shown} shown`);
      // the story is a loop: the last frame is the first frame (compared on the model's area, no copy in it)
      const frameAt = async (p) => {
        await copyAt(page, id, p);
        // a clip is in page coordinates, so add how far the page has scrolled
        const sy = await page.ev("scrollY");
        const r = await page.send("Page.captureScreenshot", { format: "png", clip: { x: 620, y: 200 + sy, width: 620, height: 560, scale: 1 } });
        return "data:image/png;base64," + r.data;
      };
      const a = await frameAt(0);
      const b = await frameAt(1);
      const diff = await page.ev(`(async () => {
        const load = (u) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = u; });
        const [x, y] = await Promise.all([load(${JSON.stringify(a)}), load(${JSON.stringify(b)})]);
        const c = document.createElement('canvas'); c.width = x.width; c.height = x.height;
        const g = c.getContext('2d', { willReadFrequently: true });
        g.drawImage(x, 0, 0); const d1 = g.getImageData(0, 0, c.width, c.height).data;
        g.clearRect(0, 0, c.width, c.height); g.drawImage(y, 0, 0); const d2 = g.getImageData(0, 0, c.width, c.height).data;
        let s = 0; for (let i = 0; i < d1.length; i += 4) s += Math.abs(d1[i] - d2[i]) + Math.abs(d1[i + 1] - d2[i + 1]) + Math.abs(d1[i + 2] - d2[i + 2]);
        return s / (d1.length / 4) / 3;
      })()`);
      check(diff < 0.3, `${name}: the last frame matches the first (the scene closes exactly)`, `mean difference ${diff.toFixed(2)} of 255`);
      // scroll down the whole page, then nothing that should have revealed itself may still be hidden
      const total = await page.ev("document.documentElement.scrollHeight");
      for (let y = 0; y < total; y += 500) {
        await page.ev(`window.scrollTo(0, ${y})`);
        await sleep(250);
      }
      await sleep(1800);
      const stuck = await page.ev("[...document.querySelectorAll('[data-reveal], [data-stagger] > *, [data-wipe], .split-part')].filter((e) => Number(getComputedStyle(e).opacity) < 0.99 || (e.classList.contains('split-part') && !/matrix\\(1, 0, 0, 1, 0, 0\\)|none/.test(getComputedStyle(e).transform))).length");
      check(stuck === 0, `${name}: every scroll reveal completes`, `${stuck} still hidden`);
      await page.ev("window.scrollTo(0, 0)");
      await sleep(1500);
      await shot(page, `${name}-desktop.png`);
      check(page.errors.length === 0, `${name}: no console errors`, page.errors[0]?.slice(0, 120));
      check(page.failed.length === 0, `${name}: no request fails`, page.failed[0]);
      check(page.foreign.length === 0, `${name}: nothing is requested from another site`, page.foreign[0]);
      page.close();
    }

    // 2b. the model never runs over the copy, on a small laptop or an ultra-wide screen (the canvas is drawn with and without; only the copy's area is compared)
    console.log("\nLayout (the 3D model and the copy)");
    for (const [w, h] of [[1024, 768], [1440, 900], [2560, 1080]]) {
      for (const p of [0, 0.5]) {
        const page = await visit(chrome, "/", { width: w, height: h });
        await waitForScene(page);
        await copyAt(page, "#story", p);
        const box = await page.ev(`(() => {
          const phase = [...document.querySelectorAll('.xp-phase')].sort((a, b) => Number(getComputedStyle(b).opacity) - Number(getComputedStyle(a).opacity))[0];
          const parts = [...phase.querySelectorAll('.kicker, h1, h2, .lead, .btn')].map((e) => e.getBoundingClientRect());
          const x0 = Math.min(...parts.map((r) => r.left)), y0 = Math.min(...parts.map((r) => r.top)), x1 = Math.max(...parts.map((r) => r.right)), y1 = Math.max(...parts.map((r) => r.bottom));
          return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
        })()`);
        const sy = await page.ev("scrollY");
        const shoot = async () => "data:image/png;base64," + (await page.send("Page.captureScreenshot", { format: "png", clip: { ...box, y: box.y + sy, scale: 1 } })).data;
        const withModel = await shoot();
        await page.ev("document.querySelector('.xp-canvas').style.visibility = 'hidden'");
        await sleep(300);
        const without = await shoot();
        const strong = await page.ev(`(async () => {
          const load = (u) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = u; });
          const [x, y] = await Promise.all([load(${JSON.stringify(withModel)}), load(${JSON.stringify(without)})]);
          const c = document.createElement('canvas'); c.width = x.width; c.height = x.height;
          const g = c.getContext('2d', { willReadFrequently: true });
          g.drawImage(x, 0, 0); const d1 = g.getImageData(0, 0, c.width, c.height).data;
          g.clearRect(0, 0, c.width, c.height); g.drawImage(y, 0, 0); const d2 = g.getImageData(0, 0, c.width, c.height).data;
          let n = 0; for (let i = 0; i < d1.length; i += 4) if (Math.abs(d1[i] - d2[i]) + Math.abs(d1[i + 1] - d2[i + 1]) + Math.abs(d1[i + 2] - d2[i + 2]) > 150) n++;
          return n / (d1.length / 4);
        })()`);
        check(strong < 0.002, `${w}x${h}, ${p === 0 ? "closed" : "open"}: the model stays clear of the copy`, `${(strong * 100).toFixed(2)}% of the copy's area is covered`);
        page.close();
      }
    }

    // 2c. the page keeps working when you move around and resize the window
    console.log("\nNavigation and resizing");
    {
      const page = await visit(chrome, "/", { width: 1440, height: 900 });
      await waitForScene(page);
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
      for (let round = 0; round < 2; round++) {
        await page.ev("document.querySelector('.site-nav a[href=\"/services\"]').click()");
        ok = ok && (await waitFor("location.pathname === '/services' && !!document.querySelector('h1')"));
        await sleep(800);
        ok = ok && (await page.ev("document.querySelectorAll('canvas').length === 0"));
        await page.ev("document.querySelector('.brand').click()");
        ok = ok && (await waitFor("location.pathname === '/' && !!document.querySelector('.xp.xp-live')", 150));
      }
      check(ok, "client-side navigation: away from the home page and back (twice) rebuilds the 3D scene");
      check(await page.ev("document.querySelectorAll('canvas').length === 1"), "no stray 3D canvases are left behind");
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
    {
      const page = await visit(chrome, "/", { width: 390, height: 844, mobile: true });
      await sleep(1200);
      const s = await sceneState(page);
      check(!s.motion, "no motion class on a phone");
      const libs = await libraries(page);
      check(libs.length === 0, "no three.js, GSAP or Lenis is downloaded", libs.join(", "));
      const wide = await page.ev("document.documentElement.scrollWidth - innerWidth");
      check(wide <= 1, "no sideways scrolling", `${wide}px too wide`);
      const picture = await page.ev("(() => { const i = document.querySelector('.xp-poster img'); return !!i && i.complete && i.naturalWidth > 0; })()");
      check(picture, "the hero picture (a render of the real 3D model) loads");
      // (the page's own fetches of the same files, made by the library check above, are not downloads)
      const kb = await page.ev("Math.round(performance.getEntriesByType('resource').filter((r) => /\\.js(\\?|$)/.test(r.name) && r.initiatorType !== 'fetch').reduce((n, r) => n + r.encodedBodySize, 0) / 1024)");
      console.log(`        (script on a phone: ${kb} kB)`);
      check(kb <= SCRIPT_BUDGET_KB, `the phone downloads at most ${SCRIPT_BUDGET_KB} kB of script`, `${kb} kB`);
      check(page.failed.length === 0, "phone: no request fails", page.failed[0]);
      await shot(page, "home-phone.png");
      page.close();
    }

    // 4. reduced motion
    console.log("\nReduced motion (1366x768)");
    {
      const page = await visit(chrome, "/", { width: 1366, height: 768, reduced: true });
      await sleep(1200);
      const s = await sceneState(page);
      check(!s.motion, "no motion class");
      const libs = await libraries(page);
      check(libs.length === 0, "no three.js, GSAP or Lenis is downloaded", libs.join(", "));
      await shot(page, "home-reduced-motion.png");
      page.close();
    }

    // 5. JavaScript off
    console.log("\nJavaScript off");
    {
      const page = await visit(chrome, "/", { width: 1366, height: 768, noScript: true });
      await sleep(2500); // the hero's short CSS fade-in has finished by then
      const hidden = await page.ev("[...document.querySelectorAll('h1, h2, p.lead, .xp-phase')].filter(e => Number(getComputedStyle(e).opacity) < 0.99 || getComputedStyle(e).visibility === 'hidden').length");
      check(hidden === 0, "all headings and copy are visible", `${hidden} hidden`);
      page.close();
    }
  } finally {
    chrome.close();
  }

  // 5b. a browser without WebGL: the 3D section steps aside and the static page takes over
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
          copy: [...document.querySelectorAll('.xp-phase')].every((e) => Number(getComputedStyle(e).opacity) === 1),
          sticky: getComputedStyle(stage).position === 'sticky',
          tall: xp.offsetHeight > 6 * innerHeight,
          sideways: document.documentElement.scrollWidth - innerWidth,
        };
      })()`);
      check(view.picture && view.copy, "the still picture and all the copy are visible", JSON.stringify(view));
      check(!view.sticky && !view.tall && view.sideways <= 1, "no pinned runway is left over (normal height, no sideways scroll)", JSON.stringify(view));
      page.close();
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
