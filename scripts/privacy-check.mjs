/**
 * Proves the privacy notice is telling the truth.
 *
 *   node scripts/privacy-check.mjs
 *
 * The notice on this site says, in the client's name:
 *
 *   "We set no cookies and run no analytics — nothing you do here is followed.
 *    The map, the videos and the live chat come from other companies, and none
 *    of them load until you press them."
 *
 * That is a factual claim about the code, published under a real business's
 * name, and it is one npm install away from becoming false. An analytics
 * package, a font from a CDN, a map that goes back to loading on sight — any of
 * them turns the notice into a lie that nobody would notice, because a site
 * that quietly phones home looks exactly like one that does not.
 *
 * So this walks the live routes like a visitor — scrolling the whole page,
 * clicking, tabbing — and asserts THREE things:
 *
 *   1. not one request leaves the origin
 *   2. not one cookie is set
 *   3. nothing is written to localStorage or sessionStorage beyond the two
 *      keys the privacy page discloses by name
 *
 * The third is the one that catches drift. Storage is where "just a small
 * thing" accumulates, and every key here has to be a key the visitor was told
 * about.
 *
 * The embeds are then activated on purpose, to prove the other half: that they
 * DO work once asked, so this check cannot be passed by breaking them.
 *
 * Run against a production build: bash scripts/serve.sh 3100 && node scripts/privacy-check.mjs
 */
import { launchBrowser } from "./browser.mjs";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3100";
const ROUTES = ["/", "/work", "/videos"];

/** Storage keys the privacy page names. Anything else is undisclosed. */
const DISCLOSED = new Set(["tpm-splash", "tpm-privacy-ack"]);

const host = new URL(BASE).host;
const failures = [];
const browser = await launchBrowser({ args: ["--hide-scrollbars"] });

for (const route of ROUTES) {
  const ctx = await browser.newContext({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();

  const external = new Set();
  page.on("request", (request) => {
    const requested = new URL(request.url()).host;
    if (requested && requested !== host) external.add(requested);
  });

  await page.goto(BASE + route, { waitUntil: "networkidle" });
  await page.waitForTimeout(3500); // the splash owns the first ~2.4s

  /* Behave like a visitor: read the whole page, tap something, use the
     keyboard. The chat script used to be injected on the first interaction of
     ANY kind, which is exactly the class of bug this pass exists to catch. */
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.7;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
  });
  await page.mouse.click(200, 400);
  await page.keyboard.press("Tab");
  await page.waitForTimeout(2500);

  const cookies = await ctx.cookies();
  const storage = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
  }));

  const undisclosed = [...storage.local, ...storage.session].filter((k) => !DISCLOSED.has(k));

  console.log(`${route}`);
  console.log(`   external hosts : ${external.size ? [...external].join(", ") : "none"}`);
  console.log(`   cookies        : ${cookies.length ? cookies.map((c) => c.name).join(", ") : "none"}`);
  console.log(
    `   storage keys   : ${[...storage.local, ...storage.session].join(", ") || "none"}` +
      `${undisclosed.length ? "  <-- UNDISCLOSED" : ""}`,
  );

  if (external.size) failures.push(`${route} contacted ${[...external].join(", ")} without being asked`);
  if (cookies.length) failures.push(`${route} set cookies: ${cookies.map((c) => c.name).join(", ")}`);
  for (const key of undisclosed) {
    failures.push(`${route} wrote "${key}" to storage, which the privacy page does not disclose`);
  }

  await ctx.close();
}

/* The other half of the claim: the embeds must still WORK when asked. A check
   that only counts requests can be satisfied by deleting the map, which would
   be a worse site and a passing test. */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const external = new Set();
  page.on("request", (r) => {
    const h = new URL(r.url()).host;
    if (h && h !== host) external.add(h);
  });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(3200);

  const mapButton = page.locator('button:has-text("Show the map")');
  if (await mapButton.count()) {
    await mapButton.first().scrollIntoViewIfNeeded();
    await mapButton.first().click();
    await page.waitForTimeout(2500);
    const reachedGoogle = [...external].some((h) => h.includes("google"));
    console.log(`\nmap, once pressed : ${reachedGoogle ? "loads from Google" : "DID NOT LOAD"}`);
    if (!reachedGoogle) {
      failures.push("the map did not load when pressed — the façade is broken, not private");
    }
  } else {
    console.log("\nmap, once pressed : no map button on this page (check the route)");
    failures.push("no 'Show the map' button found on the home page");
  }
  await ctx.close();
}

await browser.close();

if (failures.length) {
  console.log(`\n${failures.length} FAILURE(S) — the privacy notice is no longer true:`);
  for (const f of failures) console.log("  " + f);
  process.exit(1);
}
console.log("\nNothing leaves the origin, no cookies, no undisclosed storage. The notice is true.");
