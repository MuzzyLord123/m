/**
 * Contrast, measured on the RENDERED page rather than on the token table.
 *
 *   bash scripts/serve.sh 3100 && node scripts/contrast-live.mjs
 *
 * WHY THIS EXISTS ALONGSIDE contrast-audit.mjs. That script checks the design
 * system: every pair the palette is *supposed* to produce. It reads the tokens
 * out of globals.css so the palette cannot drift away from it — and it still
 * cannot see a component that uses the wrong pair, because it never looks at a
 * component. That gap has now shipped twice:
 *
 *   1. the flood menu's five rows kept measuring "on-accent on accent" for
 *      months after the menu stopped being orange — passing at 6.2:1 against a
 *      pairing the menu no longer had.
 *   2. the menu's "Get a Free Quote" pill went out as near-white on the accent,
 *      2.9:1, because a find-and-replace that swapped text-on-accent for
 *      text-ink ran after the rule that had just correctly set that button to
 *      text-on-accent. The static audit passed the whole time: its row said
 *      "flood menu CTA — on-accent on the accent pill", which is what the code
 *      was meant to say, not what it said.
 *
 * Both are the same failure — an audit measuring intent while the code drifts —
 * and neither is catchable without reading computed styles off a real page.
 *
 * WHAT IT CHECKS, deliberately narrowly. Every element carrying visible text on
 * a non-transparent background, with the effective background resolved by
 * walking up through transparent ancestors. Elements over photographs are
 * skipped: their background is an image, the contrast depends on the pixels
 * underneath, and guessing produces false failures that get the whole check
 * switched off. The one that matters most here is text on the accent, which is
 * the site's single documented forbidden pairing.
 *
 * AA: 4.5:1 for body text, 3:1 for large text (>=24px, or >=18.66px bold).
 */
import { launchBrowser } from "./browser.mjs";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3100";
/* Every page of the site, not just the four that used to be reachable.
   This list was ["/", "/work", "/videos", "/privacy"] while preview mode gated
   the rest — correct then, and silently wrong the moment the site was unlocked,
   because six public pages would have gone on passing a check that never opened
   them. A route list that mirrors a feature flag has to be revisited when the
   flag moves; keeping the full list here means it never needs to be again. */
const ROUTES = [
  "/",
  "/work",
  "/videos",
  "/services",
  "/about",
  "/quote",
  "/contact",
  "/blog",
  "/blog/cost-to-paint-a-three-bed-house",
  "/privacy",
];

const MEASURE = () => {
  const toRgb = (value) => {
    const m = /rgba?\(([^)]+)\)/.exec(value);
    if (!m) return null;
    const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  };
  const lum = ({ r, g, b }) => {
    const f = (c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const ratio = (a, b) => {
    const [x, y] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)];
    return (x + 0.05) / (y + 0.05);
  };

  /** The background actually behind this text, or null if it is over an image. */
  const groundOf = (el) => {
    let stack = null;
    for (let node = el; node && node !== document.documentElement; node = node.parentElement) {
      const cs = getComputedStyle(node);
      if (cs.backgroundImage && cs.backgroundImage !== "none") return null; // photo/gradient
      const bg = toRgb(cs.backgroundColor);
      if (!bg || bg.a === 0) continue;
      stack = stack ? over(stack, bg) : bg;
      if (stack.a >= 0.999) return stack;
    }
    return null;
  };

  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    // Only elements with their OWN visible text, so a wrapper is not blamed
    // for its child's colours.
    const own = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join("");
    if (own.length < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) < 0.15) continue;
    const box = el.getBoundingClientRect();
    if (box.width < 2 || box.height < 2) continue;

    const ground = groundOf(el);
    if (!ground) continue;
    const colour = toRgb(cs.color);
    if (!colour) continue;
    const ink = colour.a < 1 ? over(colour, ground) : colour;

    const size = parseFloat(cs.fontSize);
    const weight = Number(cs.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const min = large ? 3 : 4.5;
    const value = ratio(ink, ground);
    if (value >= min) continue;

    out.push({
      text: own.slice(0, 42),
      tag: el.tagName,
      cls: String(el.className).slice(0, 60),
      colour: cs.color,
      ground: `rgb(${Math.round(ground.r)}, ${Math.round(ground.g)}, ${Math.round(ground.b)})`,
      size: Math.round(size),
      ratio: Number(value.toFixed(2)),
      min,
    });
  }
  return out;
};

const browser = await launchBrowser({ args: ["--hide-scrollbars"] });
const failures = [];
let checked = 0;

for (const [width, height, label] of [
  [412, 915, "mobile"],
  [1440, 900, "desktop"],
]) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: width < 700,
    hasTouch: width < 700,
  });
  const page = await ctx.newPage();

  for (const route of ROUTES) {
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(3600); // past the splash
    // Dismiss the privacy sheet so what is under it is measured too.
    await page.evaluate(() => {
      try {
        localStorage.setItem("tpm-privacy-ack", "1");
      } catch {
        /* private mode */
      }
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(3400);
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 80));
      }
      window.scrollTo(0, 0);
    });

    for (const found of await page.evaluate(MEASURE)) {
      failures.push({ ...found, where: `${label} ${route}` });
    }
    checked += 1;

    /* The menu is the reason this script exists, so it is opened and measured
       rather than left to a route walk that never sees it. */
    if (route === "/" && label === "mobile") {
      await page.click('button[aria-controls="mobile-menu"]');
      await page.waitForTimeout(1200);
      for (const found of await page.evaluate(MEASURE)) {
        failures.push({ ...found, where: `${label} ${route} (menu open)` });
      }
      checked += 1;
    }
  }
  await ctx.close();
}
await browser.close();

console.log(`measured ${checked} rendered views across ${ROUTES.length} routes at two widths`);

if (failures.length) {
  console.log(`\n${failures.length} ELEMENT(S) BELOW AA:`);
  for (const f of failures) {
    console.log(
      `  ${f.ratio}:1 (min ${f.min})  "${f.text}"\n` +
        `     ${f.where} — ${f.tag} ${f.size}px, ${f.colour} on ${f.ground}\n` +
        `     ${f.cls}`,
    );
  }
  process.exit(1);
}
console.log("Every measured text element meets AA against the background it is actually on.");
