/**
 * Viewport screenshots at the four widths the site is polished against.
 *
 *   SHOT_PATHS=/,/work SHOT_WIDTHS=375,1440 node scripts/shots.mjs
 *
 * Runs with prefers-reduced-motion: reduce by default, which renders every
 * animated component in its finished state — the honest view of the layout,
 * and the same pass that audits the reduced-motion path. Set SHOT_MOTION=full
 * to capture the animated build instead.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const OUT =
  process.env.SHOT_DIR ||
  "/tmp/claude-0/-home-user-m/ae5f0dda-adb2-530b-b8d1-de27002a1dbd/scratchpad/shots";
const BASE = process.env.BASE_URL || "http://127.0.0.1:3100";
const paths = (process.env.SHOT_PATHS || "/").split(",");
const widths = (process.env.SHOT_WIDTHS || "375,768,1024,1440").split(",").map(Number);
const reduced = process.env.SHOT_MOTION !== "full";
const fullPage = process.env.SHOT_FULL !== "0";

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});

for (const path of paths) {
  for (const width of widths) {
    const page = await browser.newPage({
      viewport: { width, height: width < 700 ? 812 : 900 },
      deviceScaleFactor: 1,
      reducedMotion: reduced ? "reduce" : "no-preference",
    });

    // The Maps iframe never settles behind the egress proxy; stub it out.
    await page.route("**/maps**", (route) => route.abort());
    await page.goto(BASE + path, { waitUntil: "load" });
    await page.waitForTimeout(1000);

    const slug = path === "/" ? "home" : path.replace(/^\//, "").replace(/\//g, "-");
    const suffix = reduced ? "" : "-motion";
    await page.screenshot({ path: `${OUT}/${slug}-${width}${suffix}.png`, fullPage });
    await page.close();
    console.log(`${slug}-${width}${suffix}`);
  }
}

await browser.close();
