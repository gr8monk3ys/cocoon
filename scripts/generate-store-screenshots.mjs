#!/usr/bin/env node
/**
 * Generate the Chrome Web Store screenshots from the REAL built extension.
 *
 * The previous PNGs in docs/assets/store/ were captured by hand, so they went
 * stale the moment the UI changed and nothing detected it — they still showed
 * boxed cards, native form controls and the old coin-stack icon after the
 * redesign. Uploading them would have advertised a product that no longer
 * exists. This script rebuilds them from dist/, so a redesign refreshes the
 * store assets the same way `npm run icons` refreshes the mark.
 *
 * Usage: npm run screenshots   (runs the build first)
 * Needs: Google Chrome installed. No new npm dependencies.
 */

import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, rmSync } from "node:fs";
import { extname, join, dirname } from "node:path";
import { tmpdir } from "node:os";
// Imported explicitly rather than relied on as ambient globals: the eslint
// config for this repo targets browser/extension code and does not declare
// Node timer globals.
import { setInterval, clearInterval } from "node:timers";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const OUT = join(ROOT, "docs", "assets", "store");

const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser"
];

const WIDTH = 1280;
const HEIGHT = 800;

/**
 * The extension pages call chrome.* on load, so they cannot render in a plain
 * browser. This stub is injected BEFORE the module script — injecting after
 * would be too late, the app has already thrown.
 *
 * It also pins the light palette. Screenshots must not depend on whatever
 * colour scheme the machine running this script happens to use.
 */
const STUB = `    <script>
      const store = {};
      window.chrome = {
        storage: { local: {
          get: () => Promise.resolve(store),
          set: (v) => { Object.assign(store, v); return Promise.resolve(); }
        }},
        tabs: {
          query: () => Promise.resolve([{ id: 1, url: "https://x.com/home" }]),
          sendMessage: () => Promise.resolve()
        },
        runtime: { sendMessage: () => Promise.resolve(), lastError: null },
        alarms: { create: () => {}, clear: () => {} }
      };
      document.documentElement.style.colorScheme = "light";
      addEventListener("DOMContentLoaded", () => {
        const s = document.documentElement.style;
        Object.entries({
          "--cocoon-ink": "#20264a", "--cocoon-muted": "#5a6180",
          "--cocoon-bg": "#ffffff", "--cocoon-surface": "#ffffff",
          "--cocoon-border": "#d8dcef", "--cocoon-field": "#ffffff",
          "--cocoon-primary": "#3b4ac4", "--cocoon-primary-soft": "#eef1fe",
          "--cocoon-primary-soft-border": "#c7cdf4", "--cocoon-focus": "#636efa",
          "--cocoon-teal-ink": "#17706b", "--cocoon-btn-bg": "#3b4ac4",
          "--cocoon-btn-ink": "#ffffff",
          "--cocoon-chevron": "url(\\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5 6 6.5 11 1.5' fill='none' stroke='%235a6180' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\\")",
          "--cocoon-check": "url(\\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='10' viewBox='0 0 12 10'%3E%3Cpath d='M1 5.2 4.3 8.5 11 1.5' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\\")"
        }).forEach(([k, v]) => s.setProperty(k, v));
      });
    </script>
`;

/** Marketing frame. Deliberately mirrors the shipped design system: one silk
 *  thread stub, letterspaced eyebrow, no boxed cards. A frame styled the old
 *  way would misrepresent the product as surely as a stale capture. */
function frame({ eyebrow, headline, sub, bullets, src, frameWidth, scale }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><style>
  :root {
    --ink:#20264a; --muted:#5a6180; --border:#dcdff0;
    --grad-a:#636efa; --grad-b:#33c9c0;
  }
  * { box-sizing:border-box; }
  html,body { margin:0; padding:0; width:${WIDTH}px; height:${HEIGHT}px; overflow:hidden; }
  body {
    display:grid; grid-template-columns: 1fr 1fr; align-items:center; gap:40px;
    padding:0 64px;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color:var(--ink);
    background:
      radial-gradient(900px 620px at 8% -12%, rgba(99,110,250,0.13), transparent 62%),
      radial-gradient(760px 520px at 98% 4%, rgba(51,201,192,0.12), transparent 58%),
      #f7f8fd;
  }
  .brand { display:flex; align-items:center; gap:14px; }
  .brand img { width:52px; height:52px; border-radius:13px; }
  .brand span { font-size:30px; font-weight:600; letter-spacing:-0.015em; }
  .thread { width:44px; height:2px; border-radius:2px;
            background:linear-gradient(90deg,var(--grad-a),var(--grad-b)); margin:18px 0 22px; }
  .eyebrow { font-size:11.5px; font-weight:600; letter-spacing:0.09em;
             text-transform:uppercase; color:var(--muted); margin:0 0 10px; }
  h2 { margin:0 0 14px; font-size:34px; line-height:1.15; font-weight:600; letter-spacing:-0.02em; }
  p.sub { margin:0 0 22px; font-size:16px; line-height:1.5; color:var(--muted); max-width:30ch; }
  ul { margin:0; padding:0; list-style:none; }
  li { font-size:15px; margin-bottom:11px; padding-left:18px; position:relative; }
  li::before { content:""; position:absolute; left:0; top:8px; width:6px; height:6px;
               border-radius:50%; background:var(--grad-a); }
  .stage { display:flex; justify-content:center; align-items:center; height:${HEIGHT}px; }
  .shot {
    width:${frameWidth}px; transform:scale(${scale}); transform-origin:center center;
    border-radius:16px; overflow:hidden; background:#fff;
    border:1px solid var(--border); box-shadow:0 24px 70px rgba(32,38,74,0.16);
  }
  iframe { display:block; width:${frameWidth}px; border:0; }
</style></head><body>
  <div>
    <div class="brand"><img src="/icons/icon-128.png" alt=""><span>Cocoon</span></div>
    <div class="thread"></div>
    <p class="eyebrow">${eyebrow}</p>
    <h2>${headline}</h2>
    <p class="sub">${sub}</p>
    <ul>${bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
  </div>
  <div class="stage"><div class="shot"><iframe src="${src}" scrolling="no"></iframe></div></div>
</body></html>`;
}


/** Promo tile: brand only, no UI. This is the one surface where the full
 *  indigo->teal gradient is the ground rather than a 2px thread — it is a
 *  marketing tile, not an interface, so the restraint rule does not apply. */
function promoFrame({ w, h }) {
  const pad = Math.round(h * 0.14);
  const tile = Math.round(h * 0.34);
  const name = Math.round(h * 0.155);
  const tag = Math.round(h * 0.062);
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><style>
  * { box-sizing:border-box; }
  html,body { margin:0; padding:0; width:${w}px; height:${h}px; overflow:hidden; }
  body {
    display:flex; align-items:center; gap:${Math.round(h * 0.075)}px; padding:0 ${pad}px;
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    color:#fff; background:linear-gradient(135deg,#636efa 0%,#4f7ce8 45%,#33c9c0 100%);
  }
  img { width:${tile}px; height:${tile}px; border-radius:${Math.round(tile * 0.26)}px;
        box-shadow:0 ${Math.round(h * 0.03)}px ${Math.round(h * 0.08)}px rgba(20,24,60,0.22); }
  h1 { margin:0 0 ${Math.round(h * 0.022)}px; font-size:${name}px; font-weight:600; letter-spacing:-0.02em; }
  p { margin:0; font-size:${tag}px; line-height:1.4; opacity:0.93; max-width:22ch; }
</style></head><body>
  <img src="/icons/icon-128.png" alt="">
  <div><h1>Cocoon</h1><p>Calm, private browsing for neurodivergent minds</p></div>
</body></html>`;
}

const PROMOS = [
  { name: "promo-440x280", w: 440, h: 280 },
  { name: "promo-1400x560", w: 1400, h: 560 }
];

const SHOTS = [
  {
    name: "screenshot-popup",
    page: "popup",
    frameWidth: 340,
    // Heights are chosen to end on a SECTION BOUNDARY. A capture that stops
    // halfway through an eyebrow label reads as a broken screenshot rather
    // than a deliberate crop.
    iframeHeight: 645,
    scale: 1.05,
    eyebrow: "Toolbar popup",
    headline: "Quick controls,<br>one click away",
    sub: "Profiles, feed intensity, sensory toggles and timed scenario switches.",
    bullets: ["Profile presets you own", "Timed scenario quick-switches", "Per-site feed cleaner control"]
  },
  {
    name: "screenshot-options",
    page: "options",
    frameWidth: 680,
    iframeHeight: 1058,
    scale: 0.62,
    eyebrow: "Settings",
    headline: "Every setting,<br>fully yours",
    sub: "Feature toggles, adaptive suggestions and per-site overrides — stored only on your device.",
    bullets: ["Adaptive domain & schedule rules", "Inline validation, no surprises", "No accounts, no analytics"]
  }
];

function findChrome() {
  const found = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!found) {
    console.error(
      "Google Chrome not found. Looked in:\n  " + CHROME_CANDIDATES.join("\n  ")
    );
    process.exit(1);
  }
  return found;
}

const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
  ".png": "image/png", ".svg": "image/svg+xml", ".json": "application/json"
};


/**
 * Capture one page.
 *
 * Chrome writes the screenshot and then DOES NOT EXIT in this configuration,
 * so spawnSync blocks forever — the whole reason this is hand-rolled rather
 * than a two-line spawnSync. Poll for the file instead, wait for its size to
 * stop changing so a half-written PNG is never accepted, then terminate.
 */
function capture(chrome, url, dest, w, h, timeoutMs = 45000) {
  return new Promise((resolve) => {
    const profile = join(tmpdir(), `cocoon-shot-${process.pid}-${Math.random().toString(36).slice(2)}`);
    const child = spawn(
      chrome,
      [
        // Old headless, deliberately: --headless=new hangs indefinitely on
        // macOS here and never writes the file at all.
        "--headless",
        "--disable-gpu",
        "--no-sandbox",
        "--no-first-run",
        "--no-default-browser-check",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        `--window-size=${w},${h}`,
        "--virtual-time-budget=5000",
        `--screenshot=${dest}`,
        `--user-data-dir=${profile}`,
        url
      ],
      { stdio: "ignore" }
    );

    let lastSize = -1;
    let stableTicks = 0;
    const started = Date.now();
    const tick = setInterval(() => {
      let size;
      try {
        size = statSync(dest).size;
      } catch {
        size = -1;
      }
      if (size > 0 && size === lastSize) {
        stableTicks += 1;
      } else {
        stableTicks = 0;
      }
      lastSize = size;

      const done = stableTicks >= 2;
      const timedOut = Date.now() - started > timeoutMs;
      if (done || timedOut) {
        clearInterval(tick);
        child.kill("SIGKILL");
        rmSync(profile, { recursive: true, force: true });
        resolve(done);
      }
    }, 400);

    child.on("error", () => {
      clearInterval(tick);
      rmSync(profile, { recursive: true, force: true });
      resolve(false);
    });
  });
}

async function main() {
  if (!existsSync(join(DIST, "popup.html"))) {
    console.error("dist/ not built. Run `npm run build` first.");
    process.exit(1);
  }
  mkdirSync(OUT, { recursive: true });
  const chrome = findChrome();
  const temps = [];

  for (const shot of SHOTS) {
    const src = readFileSync(join(DIST, `${shot.page}.html`), "utf8");
    const harness = join(DIST, `_shot-${shot.page}.html`);
    writeFileSync(harness, src.replace('    <script type="module"', STUB + '    <script type="module"'));
    const framePath = join(DIST, `_frame-${shot.page}.html`);
    writeFileSync(
      framePath,
      frame({ ...shot, src: `/_shot-${shot.page}.html` }).replace(
        "<iframe ",
        `<iframe height="${shot.iframeHeight}" `
      )
    );
    temps.push(harness, framePath);
  }

  for (const p of PROMOS) {
    const path = join(DIST, `_promo-${p.name}.html`);
    writeFileSync(path, promoFrame(p));
    temps.push(path);
  }

  const server = createServer((req, res) => {
    const path = decodeURIComponent((req.url || "/").split("?")[0]);
    const file = join(DIST, path === "/" ? "index.html" : path);
    if (!file.startsWith(DIST) || !existsSync(file)) {
      res.writeHead(404).end("not found");
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
    res.end(readFileSync(file));
  });

  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;

  let failed = false;
  for (const shot of SHOTS) {
    const dest = join(OUT, `${shot.name}.png`);
    rmSync(dest, { force: true });
    const ok = await capture(chrome, `http://127.0.0.1:${port}/_frame-${shot.page}.html`, dest, WIDTH, HEIGHT);
    if (!ok) {
      console.error(`FAILED ${shot.name}: no PNG produced within the timeout`);
      failed = true;
      continue;
    }
    console.log(`wrote docs/assets/store/${shot.name}.png`);
  }

  for (const p of PROMOS) {
    const dest = join(OUT, `${p.name}.png`);
    rmSync(dest, { force: true });
    const ok = await capture(chrome, `http://127.0.0.1:${port}/_promo-${p.name}.html`, dest, p.w, p.h);
    if (!ok) {
      console.error(`FAILED ${p.name}`);
      failed = true;
      continue;
    }
    console.log(`wrote docs/assets/store/${p.name}.png`);
  }

  server.close();
  for (const t of temps) rmSync(t, { force: true });
  if (failed) process.exit(1);
}

main();
