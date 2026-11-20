// Measures how fast the pages really load, in headless Chrome: largest contentful paint, layout shift, blocking
// time and what was downloaded. Two profiles: a phone on a slow 4G connection with a 4x slower processor, and a
// desktop on a fast connection. No dependencies (Chrome over the DevTools Protocol, Node 22).
//
//   npm run build && npm run start -- -p 3000      (in another terminal)
//   node scripts/perf-report.mjs http://127.0.0.1:3000 [path ...]
//
// Environment: CHROME_PATH. Numbers from a laptop are a guide, not a lab score: run it on the machine that matters
// and use PageSpeed Insights on the deployed site for the official figures. The desktop profile draws the 3D scene
// with the software renderer when there is no GPU (CI, SOFTWARE_GL=1), which makes its blocking time look worse
// than it is on a real graphics card.

import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = (process.argv[2] || "http://127.0.0.1:3000").replace(/\/+$/, "");
const paths = process.argv.slice(3).length ? process.argv.slice(3) : ["/", "/services"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function launch(port = 9446) {
  const dir = mkdtempSync(join(tmpdir(), "lw-perf-"));
  const flags = ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, "--no-first-run", "--no-default-browser-check", "--disable-extensions", "--hide-scrollbars", "--mute-audio"];
  if (process.env.CI) flags.push("--no-sandbox");
  if (process.env.CI || process.env.SOFTWARE_GL) flags.push("--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist");
  const proc = spawn(chromePath(), [...flags, "about:blank"], { stdio: "ignore", windowsHide: true });
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) break;
    } catch {}
    await sleep(150);
  }
  return {
    port,
    close() {
      try {
        if (process.platform === "win32") spawn("taskkill", ["/pid", String(proc.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
        else proc.kill();
      } catch {}
      setTimeout(() => {
        try {
          rmSync(dir, { recursive: true, force: true });
        } catch {}
      }, 1500);
    },
  };
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

const OBSERVERS = `
  window.__m = { lcp: 0, cls: 0, tbt: 0, tasks: 0, fcp: 0 };
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__m.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__m.tasks++; window.__m.tbt += Math.max(0, e.duration - 50); } }).observe({ type: 'longtask', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__m.fcp = e.startTime; }).observe({ type: 'paint', buffered: true });
`;

const profiles = [
  { name: "Phone: slow 4G, 4x slower processor", width: 390, height: 844, mobile: true, cpu: 4, net: { latency: 150, down: (1.6 * 1024 * 1024) / 8, up: (750 * 1024) / 8 } },
  { name: "Desktop: fast connection", width: 1440, height: 900, mobile: false, cpu: 1, net: null },
];

async function measure(chrome, profile, path) {
  const page = await openPage(chrome.port);
  const sizes = new Map();
  const kinds = new Map();
  try {
    await page.send("Page.enable");
    await page.send("Network.enable");
    await page.send("Network.setCacheDisabled", { cacheDisabled: true });
    page.on("Network.responseReceived", (e) => kinds.set(e.requestId, e.type));
    page.on("Network.loadingFinished", (e) => sizes.set(e.requestId, e.encodedDataLength));
    await page.send("Emulation.setDeviceMetricsOverride", { width: profile.width, height: profile.height, deviceScaleFactor: profile.mobile ? 2 : 1, mobile: profile.mobile });
    if (profile.mobile) await page.send("Emulation.setUserAgentOverride", { userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36" });
    if (profile.cpu > 1) await page.send("Emulation.setCPUThrottlingRate", { rate: profile.cpu });
    if (profile.net) await page.send("Network.emulateNetworkConditions", { offline: false, latency: profile.net.latency, downloadThroughput: profile.net.down, uploadThroughput: profile.net.up });
    await page.send("Page.addScriptToEvaluateOnNewDocument", { source: OBSERVERS });
    await page.send("Page.navigate", { url: base + path });
    for (let i = 0; i < 160; i++) {
      try {
        if ((await page.ev("document.readyState")) === "complete") break;
      } catch {}
      await sleep(250);
    }
    await sleep(4000); // let the page settle (the scene loads when the browser is idle)
    const m = await page.ev("window.__m");
    const total = { all: 0, js: 0, img: 0, font: 0, css: 0, other: 0, n: 0 };
    for (const [rid, bytes] of sizes) {
      const k = kinds.get(rid);
      total.n++;
      total.all += bytes;
      if (k === "Script") total.js += bytes;
      else if (k === "Image") total.img += bytes;
      else if (k === "Font") total.font += bytes;
      else if (k === "Stylesheet") total.css += bytes;
      else total.other += bytes;
    }
    return { m, total };
  } finally {
    page.close();
  }
}

const kb = (n) => `${(n / 1024).toFixed(0)} kB`;
const ms = (n) => `${Math.round(n)} ms`;

const chrome = await launch();
try {
  console.log(`Measuring ${base}\n`);
  for (const profile of profiles) {
    console.log(profile.name);
    for (const path of paths) {
      const { m, total } = await measure(chrome, profile, path);
      console.log(`  ${path.padEnd(14)} first paint ${ms(m.fcp).padEnd(8)} largest paint ${ms(m.lcp).padEnd(8)} layout shift ${m.cls.toFixed(3)}  blocking ${ms(m.tbt)} (${m.tasks} long tasks)`);
      console.log(`  ${"".padEnd(14)} ${total.n} requests, ${kb(total.all)} in all: script ${kb(total.js)}, images ${kb(total.img)}, fonts ${kb(total.font)}, css ${kb(total.css)}, other ${kb(total.other)}`);
    }
    console.log("");
  }
} finally {
  chrome.close();
}
