/**
 * Reduced-motion and scroll-listener audit.
 *
 *   node scripts/motion-audit.mjs
 *
 * Checks the two rules the site is not allowed to break:
 *   1. Under prefers-reduced-motion every signature animation collapses to its
 *      finished state — content visible, nothing moving, no accent band left
 *      covering a section.
 *   2. Exactly one scroll listener exists, in the mobile action bar, and it is
 *      passive. Scroll *direction* cannot come from a scroll-driven animation
 *      or an IntersectionObserver — a timeline knows position, not heading — so
 *      the hide-on-scroll-down behaviour needs one. Everything else on the site
 *      is scroll-linked through CSS timelines. Any new offender fails here.
 */
import { chromium } from "playwright";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3100";
const results = [];
const check = (label, value) => {
  const line = `${value ? "PASS" : "FAIL"}  ${label}`;
  results.push(line);
  console.log(line);
};

// ------------------------------------------------- static: no scroll listeners
function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const ALLOWED_SCROLL_LISTENER = "src/components/layout/MobileActionBar.tsx";

const sources = walk("src").filter((path) => /\.(ts|tsx|mdx)$/.test(path));
const offenders = sources.filter((path) => {
  const source = readFileSync(path, "utf8");
  return /addEventListener\(\s*["'`]scroll["'`]/.test(source) || /onscroll\s*=/.test(source);
});
const unexpected = offenders.filter((path) => path !== ALLOWED_SCROLL_LISTENER);
check(
  `only the documented scroll listener in src (${sources.length} files scanned)`,
  unexpected.length === 0,
);
if (unexpected.length) console.log("   ", unexpected.join("\n    "));

// The one that is allowed must stay passive, or it is not worth the exception.
const barSource = readFileSync(ALLOWED_SCROLL_LISTENER, "utf8");
check(
  "the one scroll listener is passive",
  /addEventListener\("scroll",\s*onScroll,\s*\{\s*passive:\s*true\s*\}\)/.test(barSource),
);

// ------------------------------------------------------- runtime: reduced motion
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});

const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
await page.route("**/maps**", (route) => route.abort());
await page.goto(`${BASE}/`, { waitUntil: "load" });
await page.waitForTimeout(900);

// 1. Hero brush reveal is fully wiped in, not mid-stroke.
const wipe = await page.locator("h1 > span").first().evaluate((el) =>
  getComputedStyle(el).getPropertyValue("--wipe").trim(),
);
check(`hero mask starts fully drawn (--wipe: ${wipe || "unset"})`, wipe === "100%");

// 2. No roller-pass band is left sitting over a section.
const bands = await page.evaluate(() => {
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim();
  return [...document.querySelectorAll("div[aria-hidden='true']")].filter((el) => {
    const style = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    return style.backgroundColor.includes("29, 79, 216") && box.width > window.innerWidth * 0.9 && box.height > 200;
  }).length;
});
check(`no roller-pass band covering a section (found ${bands})`, bands === 0);

// 3. Scroll-revealed content is visible without ever being scrolled to.
const hidden = await page.evaluate(() => {
  const candidates = [...document.querySelectorAll("main *")];
  return candidates.filter((el) => {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const opacity = Number.parseFloat(style.opacity);
    return opacity > 0 && opacity < 0.9 && el.textContent && el.textContent.trim().length > 40;
  }).length;
});
check(`no content left part-faded below the fold (found ${hidden})`, hidden === 0);

// 4. The whole page carries no running animations.
const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
check(`no animations running under reduced motion (found ${running})`, running === 0);

await page.close();
await browser.close();

console.log(`\n${results.filter((r) => r.startsWith("PASS")).length}/${results.length} checks pass.`);
if (results.some((line) => line.startsWith("FAIL"))) process.exitCode = 1;
