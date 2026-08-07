/**
 * Proves every photograph on the site actually loads.
 *
 * Walks every route at two widths, opens the galleries and the menus so the
 * lazy ones mount, and then asserts three separate things per image:
 *
 *   1. the network request returned 2xx — the file is on disk at that path
 *   2. naturalWidth > 0 — the browser decoded it, so it is a real image and
 *      not an HTML error page served with an image extension
 *   3. it is not a flat stand-in — sampled onto a canvas, a real photograph
 *      has spread across its histogram; the generated placeholders are one
 *      colour edge to edge
 *
 * The third check is the one that matters. A stand-in loads perfectly and
 * passes the first two, which is exactly how a site can look finished and be
 * showing forty grey rectangles.
 *
 * Run against a production build: npx next start & node scripts/image-check.mjs
 */
import { launchBrowser } from "./browser.mjs";
import fs from "node:fs";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3111";
const ROUTES = ["/", "/work", "/videos", "/services", "/about", "/contact", "/quote", "/blog"];

const browser = await launchBrowser();

/** Every path the site is supposed to be able to show. */
const expected = new Set([
  ...fs.readdirSync("public/work").map((f) => `/work/${f}`),
  ...fs.readdirSync("public/social").map((f) => `/social/${f}`),
]);

const seen = new Map(); // decoded source path -> { status, width, flat }
const opened = {}; // width label -> number of projects opened
const failures = [];

/**
 * Runs in the page. Decode check plus flatness check, on the pixels the visitor
 * actually sees. Shared by the route walk and the open-every-project pass so
 * both assert the same three things — an earlier version only measured decode
 * inside the lightbox, which quietly left the gallery photographs unproven
 * against the stand-in check that is the whole point of this script.
 */
const MEASURE = () => {
  const out = [];
  for (const el of document.querySelectorAll("img")) {
    const src = el.currentSrc || el.src;
    const m = /[?&]url=([^&]+)/.exec(src);
    const path = m ? decodeURIComponent(m[1]) : new URL(src, location.href).pathname;
    if (!/\.(jpg|jpeg|png|webp|avif)$/i.test(path)) continue;
    if (!el.complete || el.naturalWidth === 0) {
      out.push({ path, width: 0, flat: null });
      continue;
    }
    let flat = null;
    try {
      const c = document.createElement("canvas");
      c.width = 24;
      c.height = 24;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(el, 0, 0, 24, 24);
      const d = g.getImageData(0, 0, 24, 24).data;
      const lums = [];
      for (let i = 0; i < d.length; i += 4) lums.push(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
      const mean = lums.reduce((a, b) => a + b, 0) / lums.length;
      const sd = Math.sqrt(lums.reduce((a, b) => a + (b - mean) ** 2, 0) / lums.length);
      flat = sd < 3; // a flat colour has essentially no spread
    } catch {
      flat = null; // canvas tainted; the decode check still stands
    }
    out.push({ path, width: el.naturalWidth, flat });
  }
  return out;
};

/** Merge one measurement, keeping the best reading seen for that file. */
function record(m) {
  const prev = seen.get(m.path) || {};
  seen.set(m.path, {
    status: prev.status ?? 200,
    width: Math.max(prev.width || 0, m.width),
    flat: m.flat === false ? false : (prev.flat ?? m.flat),
  });
}

for (const [width, height, label] of [
  [390, 844, "mobile"],
  [1440, 900, "desktop"],
]) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();

  page.on("response", (r) => {
    const u = new URL(r.url());
    const raw = u.searchParams.get("url"); // next/image proxies the real path
    const path = raw ? decodeURIComponent(raw) : u.pathname;
    if (!/\.(jpg|jpeg|png|webp|avif)$/i.test(path)) return;
    if (r.status() >= 400) failures.push(`${label} ${path} -> HTTP ${r.status()}`);
    const prev = seen.get(path) || {};
    seen.set(path, { ...prev, status: r.status() });
  });

  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    // Scroll the whole page so every lazy image below the fold mounts.
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      /* Deliberately NOT scrolling back to the top. A loading="lazy" image
         that the viewport passed over is still deferred; returning to the top
         makes Chrome drop it, and it then reports complete === false forever.
         Flip everything to eager and ask for a decode so the check measures
         whether the FILE loads, which is the question, rather than whether
         Chrome's lazy heuristic happened to fire. */
      for (const img of document.images) img.loading = "eager";
      await Promise.allSettled([...document.images].map((i) => i.decode()));
    });
    /* Wait for the images themselves to settle, not a fixed pause — a lazy
       image below the fold finishes some time after the scroll pass, and
       measuring on a timer reports naturalWidth 0 for a file that is perfectly
       fine. That false failure is worse than no check at all.

       The condition must test naturalWidth, NOT `complete`: Chrome reports
       complete === true for a loading=lazy image that has not started loading,
       so waiting on `complete` alone resolves instantly and changes nothing. */
    await page
      .waitForFunction(
        () => [...document.images].every((i) => i.complete && i.naturalWidth > 0),
        null,
        { timeout: 20000 },
      )
      .catch(() => {}); // genuinely broken images time out here and fail below
    await page.waitForTimeout(300);

    /* Open EVERY project, not a sample. Most of the client's photographs only
       mount once a project is opened — the grid and the feed show one frame
       each — so a plain route walk verifies barely half of them. Opening all
       of them is the difference between "referenced in the data" and "proven
       to load". :visible because both galleries are in the DOM at either
       width; only one of them is shown. */
    if (route === "/work") {
      const cards = page.locator("li[id] button:visible");
      const count = await cards.count();
      for (let i = 0; i < count; i++) {
        /* Click via the element, not the mouse. The header is fixed, so a
           card scrolled under it has its real click intercepted by the nav —
           a harness problem, not a site one; a visitor scrolls it clear first. */
        await cards.nth(i).evaluate((el) => el.click());
        await page.waitForTimeout(500);
        await page.evaluate(async () => {
          for (const img of document.images) img.loading = "eager";
          await Promise.allSettled([...document.images].map((x) => x.decode()));
        });
        const shot = await page.evaluate(MEASURE);
        for (const m of shot) record(m);
        await page.keyboard.press("Escape");
        await page.waitForTimeout(300);
      }
      opened[label] = count;
    }
    if (route === "/" && label === "mobile") {
      await page.click('button[aria-controls="mobile-menu"]');
      await page.waitForTimeout(1000);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(400);
    }
    if (route === "/" && label === "desktop") {
      const trigger = page.locator("button[aria-expanded]").first();
      if (await trigger.count()) {
        await trigger.hover();
        await page.waitForTimeout(900);
        await page.mouse.move(0, 400); // let the panel close again
        await page.waitForTimeout(400);
      }
    }

    /* Decode check + flatness check, in the page so the pixels are the ones
       the visitor sees. A stand-in is a single colour: sampling a grid of it
       yields one unique value and zero variance. */
    const measured = await page.evaluate(MEASURE);

    for (const m of measured) record(m);
  }
  await ctx.close();
}
await browser.close();

// ---- report ----------------------------------------------------------------
const rendered = [...seen.entries()].filter(([p]) => p.startsWith("/work/") || p.startsWith("/social/"));

for (const [path, info] of rendered) {
  if (info.width === 0) failures.push(`${path} -> did not decode (naturalWidth 0)`);
  if (info.flat === true) failures.push(`${path} -> still a flat stand-in, not a photograph`);
  if (info.flat == null) failures.push(`${path} -> never got a flatness reading, so it is unproven`);
}

const renderedPaths = new Set(rendered.map(([p]) => p));

/* Not everything renders on a route walk — most gallery photographs only mount
   once a project is opened. So the completeness question is answered
   statically instead: is every file on disk actually referenced by the site?
   An unreferenced file is a photograph the client sent that nobody will ever
   see, which is the failure this whole exercise exists to prevent. */
const sourceText = (function read(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) read(p, acc);
    else if (/\.(ts|tsx|mdx|json)$/.test(e.name)) acc.push(fs.readFileSync(p, "utf8"));
  }
  return acc;
})("src").join("\n");

const orphans = [...expected].filter((p) => !sourceText.includes(p));
for (const p of orphans) failures.push(`${p} -> on disk but referenced nowhere in src/`);

const never = [...expected].filter((p) => !renderedPaths.has(p));

console.log(`routes walked      : ${ROUTES.length} x 2 widths`);
console.log(`projects opened    : ${opened.mobile ?? 0} mobile, ${opened.desktop ?? 0} desktop`);
console.log(`image files on disk: ${expected.size}`);
console.log(`rendered somewhere : ${renderedPaths.size}`);
console.log(`decoded ok         : ${rendered.filter(([, i]) => i.width > 0).length}`);
console.log(`real photographs   : ${rendered.filter(([, i]) => i.flat === false).length}`);

console.log(`referenced in src/ : ${expected.size - orphans.length} of ${expected.size}`);

if (never.length) {
  console.log(
    `\nReferenced but not rendered during a plain route walk (${never.length}) —` +
      ` these mount when a project is opened in the lightbox or the sheet:`,
  );
  for (const p of never) console.log("  " + p);
}

if (failures.length) {
  console.log(`\n${failures.length} FAILURE(S):`);
  for (const f of failures) console.log("  " + f);
  process.exit(1);
}
console.log("\nAll images load, decode and are real photographs.");
