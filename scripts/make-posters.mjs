// Renders the hero scene's still pictures from the live 3D scene: the closed model and the opened one, as WebP
// with a transparent background, in public/scene/. Phones, tablets, reduced motion and the moment before WebGL is
// ready show these, so what they see is the real model and not a drawing of it.
//
//   npm run build && npm run start -- -p 3000      (in another terminal)
//   node scripts/make-posters.mjs http://127.0.0.1:3000
//
// Re-run it whenever the scene's look changes. No dependencies: Chrome is driven over the DevTools Protocol with
// Node's built-in fetch and WebSocket (Node 22). Environment: CHROME_PATH, SOFTWARE_GL=1 (or CI) to force the
// software renderer when there is no GPU.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = (process.argv[2] || "http://127.0.0.1:3000").replace(/\/+$/, "");
const out = join(process.cwd(), "public", "scene");
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DPR = 1.75;
const W = 1440;
const H = 900;

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

async function launch(port = 9445) {
  const dir = mkdtempSync(join(tmpdir(), "lw-posters-"));
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
  if (process.env.CI || process.env.SOFTWARE_GL) flags.push("--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist");
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
  const ev = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  return { send, ev, close: () => ws.close() };
}

/** Hides everything except the canvas, so the picture is the model and its shadow on a clear ground. */
const STILL_CSS = `
  .site-header, .mobile-cta, .xp-copy, .xp-lines, .xp-labels, .xp-hint, .xp-track, .xp-cursor, .xp-poster { display: none !important; }
  html, body, .xp, .xp-stage { background: transparent !important; }
  .xp-stage::before { display: none !important; }
`;

async function main() {
  console.log(`Rendering the stills from ${base}\n`);
  const chrome = await launch();
  const page = await openPage(chrome.port);
  try {
    await page.send("Page.enable");
    await page.send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: DPR, mobile: false });
    await page.send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
    await page.send("Page.navigate", { url: `${base}/?still` });
    for (let i = 0; i < 120; i++) {
      try {
        if (await page.ev("document.readyState === 'complete' && !!document.querySelector('.xp.xp-live')")) break;
      } catch {}
      await sleep(250);
    }
    const live = await page.ev("!!document.querySelector('.xp.xp-live')");
    if (!live) throw new Error("The 3D scene did not start (is WebGL available? try SOFTWARE_GL=1).");
    await page.ev(`(() => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(STILL_CSS)}; document.head.appendChild(s); })()`);

    const scrollTo = async (p) => {
      const y = await page.ev(`(() => { const s = document.querySelector('#story'); const top = s.getBoundingClientRect().top + scrollY; const stp = parseFloat(getComputedStyle(s.querySelector('.xp-stage')).top); const st = Number.isFinite(stp) ? stp : 0; const start = Math.max(0, top - st); const end = top + s.offsetHeight - innerHeight; return start + ${p} * (end - start); })()`);
      await page.ev(`window.scrollTo(0, ${y})`);
      await sleep(4000); // the scrub catches up, then the frame is drawn
    };

    // the box of everything that is drawn (alpha above a small threshold), found in the page
    const boxOf = async () => {
      const full = await page.send("Page.captureScreenshot", { format: "png", fromSurface: true });
      return page.ev(`(async () => {
        const img = new Image(); img.src = "data:image/png;base64,${full.data}"; await img.decode();
        const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
        const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(img, 0, 0);
        const d = g.getImageData(0, 0, c.width, c.height).data;
        let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
        for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        return { x0, y0, x1, y1, w: c.width, h: c.height, corner: d[3] };
      })()`);
    };

    /** `cap` is the widest the full-size file needs to be: a phone shows it about 360 px wide, so 1100 px is plenty even at 3x. */
    const render = async (name, p, aspect, cap) => {
      await scrollTo(p);
      const b = await boxOf();
      if (b.x1 < 0) throw new Error(`${name}: nothing was drawn`);
      // css pixels, with a margin, grown to the aspect ratio and kept inside the viewport
      const bw = (b.x1 - b.x0 + 1) / DPR;
      const bh = (b.y1 - b.y0 + 1) / DPR;
      const m = 0.035 * Math.max(bw, bh);
      let w = bw + 2 * m;
      let h = bh + 2 * m;
      if (w / h < aspect) w = h * aspect;
      else h = w / aspect;
      const cx = (b.x0 + b.x1 + 1) / 2 / DPR;
      const cy = (b.y0 + b.y1 + 1) / 2 / DPR;
      let x = cx - w / 2;
      let y = cy - h / 2;
      x = Math.max(0, Math.min(W - w, x));
      y = Math.max(0, Math.min(H - h, y));
      if (w > W || h > H) throw new Error(`${name}: the model does not fit the viewport`);
      // a clip is in page coordinates, not in the window's: add how far the page has scrolled
      const sy = await page.ev("scrollY");
      for (const [file, px] of [[`${name}.webp`, cap], [`${name}-800.webp`, 800]]) {
        const scale = Math.min(1, px / (w * DPR));
        const shot = await page.send("Page.captureScreenshot", { format: "webp", quality: 82, fromSurface: true, clip: { x, y: y + sy, width: w, height: h, scale } });
        const bytes = Buffer.from(shot.data, "base64");
        writeFileSync(join(out, file), bytes);
        console.log(`  ${file}  ${Math.round(w * DPR * scale)}x${Math.round(h * DPR * scale)}  ${(bytes.length / 1024).toFixed(0)} kB`);
        if (px === cap) {
          // the corner must be clear (or the still would show a box on the page) and the model must be in it
          const s = await page.ev(`(async () => { const img = new Image(); img.src = "data:image/webp;base64,${shot.data}"; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 200) n++; return { corner: d[3], solid: n / (d.length / 4) }; })()`);
          if (s.corner > 2) throw new Error(`${file}: the background is not transparent (alpha ${s.corner}); the renderer or the browser lost it`);
          if (s.solid < 0.1) throw new Error(`${file}: the model is missing from the picture (${(s.solid * 100).toFixed(1)}% solid); box ${JSON.stringify(b)}, clip ${JSON.stringify({ x, y, w, h })}`);
        }
      }
    };

    await render("assembly-closed", 0, 4 / 3, 1100);
    await render("assembly-open", 0.5, 4 / 5, 1056);
    console.log("\nDone. Keep the width, height and srcset sizes in components/Posters.tsx in step with the sizes printed above.");
  } finally {
    page.close();
    chrome.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
