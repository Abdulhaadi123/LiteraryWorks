// Renders the home story's still pictures from the live 3D scene: our projects on a laptop, a tablet and a phone
// (system-ring) and the browser windows of the build beat (system-dash), as WebP on the scene's own light ground (a few tens of kB each, where
// the same pictures with a transparent background were over 200 kB), in public/scene/. Phones, tablets, reduced
// motion and a browser without WebGL show these, so what they see is the real scene and not a drawing of it.
//
//   npm run build && npm run start -- -p 3000      (in another terminal)
//   node scripts/make-posters.mjs http://127.0.0.1:3000
//
// Re-run it whenever the scene's look changes, then run scripts/make-brand-assets.mjs (the link-preview picture
// uses the first still). No dependencies: Chrome is driven over the DevTools Protocol with Node's built-in fetch
// and WebSocket (Node 22). Environment: CHROME_PATH, SOFTWARE_GL=1 (or CI) to force the software renderer when
// there is no GPU.

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = (process.argv[2] || "http://127.0.0.1:3000").replace(/\/+$/, "");
const out = join(process.cwd(), "public", "scene");
mkdirSync(out, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DPR = 1.75;
const W = 1600;
const H = 1000;

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

/** Hides everything except the stage (its ground and the canvas), so the picture is the scene as it stands on the page. */
const STILL_CSS = `
  .site-header, .mobile-cta, .xp-copy, .xp-lines, .xp-labels, .xp-hint, .xp-poster, .xp-rail { display: none !important; }
  .xp-stage::before { display: none !important; }
`;

async function main() {
  console.log(`Rendering the stills from ${base}\n`);
  const chrome = await launch();
  const page = await openPage(chrome.port);
  try {
    await page.send("Page.enable");
    await page.send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: DPR, mobile: false });
    await page.send("Page.navigate", { url: `${base}/?still` });
    for (let i = 0; i < 120; i++) {
      try {
        if (await page.ev("document.readyState === 'complete' && !!document.querySelector('#story.xp-live')")) break;
      } catch {}
      await sleep(250);
    }
    const live = await page.ev("!!document.querySelector('#story.xp-live')");
    if (!live) throw new Error("The 3D scene did not start (is WebGL available? try SOFTWARE_GL=1).");

    // where the scene stands: to the right of the copy, below the header (the same numbers as motion/mountStage.ts)
    const band = await page.ev(`(() => {
      const w = innerWidth, h = innerHeight;
      const copy = document.querySelector('#story .xp-phase').getBoundingClientRect();
      const right = Math.min(w - 32, (w + 1680) / 2);
      return { left: copy.right + 24, right, top: 92, bottom: h - 20 };
    })()`);
    await page.ev(`(() => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(STILL_CSS)}; document.head.appendChild(s); })()`);

    const scrollTo = async (p) => {
      const y = await page.ev(`(() => { const s = document.querySelector('#story'); const top = s.getBoundingClientRect().top + scrollY; const stp = parseFloat(getComputedStyle(s.querySelector('.xp-stage')).top); const st = Number.isFinite(stp) ? stp : 0; const start = Math.max(0, top - st); const end = top + s.offsetHeight - innerHeight; return start + ${p} * (end - start); })()`);
      await page.ev(`window.scrollTo(0, ${y})`);
      await sleep(4500); // the scrub catches up, then the frame is drawn
    };

    /** `cap` is the widest the full-size file needs to be: a phone shows it about 360 px wide, so 1200 px is plenty even at 3x. */
    const render = async (name, p, cap, aspect) => {
      await scrollTo(p);
      // the band the scene stands in, with a margin for the glow and the waves around the core
      const bw = band.right - band.left;
      const bh = band.bottom - band.top;
      const m = 0.07 * Math.max(bw, bh);
      let x = band.left - m;
      let y = band.top - m;
      let w = bw + 2 * m;
      let h = bh + 2 * m;
      x = Math.max(0, x);
      y = Math.max(0, y);
      w = Math.min(w, W - x);
      h = Math.min(h, H - y);
      // a wide picture (the dashboard) is cut to its own proportions around the middle of the band
      if (aspect && h > w / aspect) {
        const nh = w / aspect;
        y += (h - nh) / 2;
        h = nh;
      }
      // a clip is in page coordinates, not in the window's: add how far the page has scrolled
      const sy = await page.ev("scrollY");
      for (const [file, px] of [[`${name}.webp`, cap], [`${name}-800.webp`, 800]]) {
        const scale = Math.min(1, px / (w * DPR));
        const shot = await page.send("Page.captureScreenshot", { format: "webp", quality: 68, fromSurface: true, clip: { x, y: y + sy, width: w, height: h, scale } });
        const bytes = Buffer.from(shot.data, "base64");
        writeFileSync(join(out, file), bytes);
        console.log(`  ${file}  ${Math.round(w * DPR * scale)}x${Math.round(h * DPR * scale)}  ${(bytes.length / 1024).toFixed(0)} kB`);
        if (px === cap) {
          // the scene must be in the picture: some of it is clearly darker than the pale ground (navy lines, rings, the core)
          const s = await page.ev(`(async () => { const img = new Image(); img.src = "data:image/webp;base64,${shot.data}"; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11 < 120) n++; return { dark: n / (d.length / 4) }; })()`);
          if (s.dark < 0.002) throw new Error(`${file}: the scene is missing from the picture (${(s.dark * 100).toFixed(2)}% dark)`);
        }
      }
    };

    await render("system-ring", 0.03, 1200);
    await render("system-dash", 0.58, 1200);
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
