/**
 * Drives the interactive parts of the site in a real browser: gallery
 * lightbox, mobile sheet, mobile menu, and the multi-step quote flow.
 *
 *   node scripts/interaction-check.mjs
 *
 * Expects a server on BASE_URL (default http://127.0.0.1:3100).
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3100";
const SHOTS =
  process.env.SHOT_DIR ||
  "/tmp/claude-0/-home-user-m/ae5f0dda-adb2-530b-b8d1-de27002a1dbd/scratchpad/shots";

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox"],
});

const results = [];
const check = (label, value) => {
  const line = `${value ? "PASS" : "FAIL"}  ${label}`;
  results.push(line);
  console.log(line);
};

// ---------------------------------------------------------------- gallery
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/work`, { waitUntil: "load" });
  await page.waitForTimeout(500);

  await page.locator("button[aria-label^='Kitchen extension']").first().click();
  await page.waitForTimeout(950);
  const lightbox = page.getByRole("dialog", { name: /Kitchen extension/ });
  check("lightbox opens", await lightbox.isVisible());
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(250);
  // Assert it stepped, not how many photographs the project happens to hold —
  // that count changes every time a batch of photographs arrives.
  check(
    "arrow key steps photograph",
    /^2 of \d+$/.test(await page.locator("[role='dialog'] dd").nth(1).innerText()),
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
  check("escape closes lightbox", (await lightbox.count()) === 0);
  await page.close();
}

// ------------------------------------------------------- desktop mega menu
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.route("**/maps**", (route) => route.abort());
  await page.goto(`${BASE}/`, { waitUntil: "load" });
  await page.waitForTimeout(1200);

  const panel = page.locator("#services-mega");
  const trigger = page.locator("button[aria-controls='services-mega']");

  // Park the pointer away from the header: hovering the trigger opens the
  // panel, which would mask whether the keyboard path works on its own.
  await page.mouse.move(1400, 820);
  await trigger.focus();
  await page.waitForTimeout(300);
  check("mega menu starts closed", (await panel.getAttribute("data-open")) === "false");

  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  check("mega menu opens by keyboard", (await panel.getAttribute("data-open")) === "true");
  check("trigger reports expanded", (await trigger.getAttribute("aria-expanded")) === "true");

  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  check("escape closes mega menu", (await panel.getAttribute("data-open")) === "false");

  await page.locator("span.nav-link:has-text('Services')").hover();
  await page.waitForTimeout(500);
  check("mega menu opens on hover", (await panel.getAttribute("data-open")) === "true");
  await page.screenshot({ path: `${SHOTS}/mega.png`, clip: { x: 0, y: 0, width: 1440, height: 560 } });
  await page.close();
}

// ----------------------------------------------------------------- mobile
{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, hasTouch: true });
  await page.goto(`${BASE}/work`, { waitUntil: "load" });
  await page.waitForTimeout(500);

  await page.locator("h2:has-text('Kitchen extension'):visible").first().click();
  await page.waitForTimeout(500);
  const sheet = page.getByRole("dialog", { name: /Kitchen extension/ });
  check("bottom sheet opens", await sheet.isVisible());
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
  check("escape closes sheet", (await sheet.count()) === 0);

  await page.locator("button[aria-label='Open menu']").click();
  await page.waitForTimeout(600);
  check("menu floods open", (await page.locator('#mobile-menu[data-open="true"]').count()) === 1);
  check(
    "scroll locks",
    (await page.evaluate(() => document.documentElement.style.overflow)) === "hidden",
  );
  await page.screenshot({ path: `${SHOTS}/menu.png` });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  check("escape closes menu", (await page.locator('#mobile-menu[data-open="true"]').count()) === 0);
  check(
    "scroll unlocks",
    (await page.evaluate(() => document.documentElement.style.overflow)) !== "hidden",
  );
  await page.close();
}

// ------------------------------------------------------------- quote flow
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/quote`, { waitUntil: "load" });
  await page.waitForTimeout(500);

  await page.locator("button:has-text('Continue')").click();
  await page.waitForTimeout(300);
  check(
    "step 1 blocks an empty answer",
    await page.locator("text=Pick the trade that fits best").isVisible(),
  );

  await page.locator("label:has-text('Interior decorating')").first().click();
  await page.locator("button:has-text('Continue')").click();
  await page.waitForTimeout(950);
  check("advances to step 2", await page.locator("text=Tell us about the place").isVisible());

  await page.locator("label:has-text('Semi-detached')").click();
  await page.locator("label:has-text('Two or three rooms')").click();
  await page.locator("button:has-text('Continue')").click();
  await page.waitForTimeout(950);
  check("advances to step 3", await page.locator("text=When would you like it done").isVisible());

  await page.locator("label:has-text('Within a month')").click();
  await page.locator("button:has-text('Continue')").click();
  await page.waitForTimeout(950);
  check("advances to step 4", await page.locator("text=Where do we send the price").isVisible());

  await page.fill("input[name='name']", "Rachel Whitmore");
  await page.fill("input[name='phone']", "07700 900123");
  await page.fill("input[name='email']", "not-an-email");
  await page.fill("input[name='town']", "Frodsham");
  await page.locator("button:has-text('Send my enquiry')").click();
  await page.waitForTimeout(700);
  check(
    "invalid email is caught before sending",
    await page.locator("text=Check the email address").isVisible(),
  );

  await page.fill("input[name='email']", "rachel@example.com");
  await page.screenshot({ path: `${SHOTS}/quote-step4.png` });
  await page.locator("button:has-text('Send my enquiry')").click();
  await page.waitForTimeout(3000);
  // With no RESEND_API_KEY set, the action must fail loudly and hand the
  // visitor the phone number — never silently swallow a lead.
  const fallback = await page.locator("[role='alert']").filter({ hasText: "Ring" }).count();
  check("a missing Resend key surfaces the phone fallback", fallback > 0);
  await page.screenshot({ path: `${SHOTS}/quote-error.png` });
  await page.close();
}

// ------------------------------------------------- accessibility regressions
/* Three defects found by review, each fixed, each cheap to reintroduce and
   invisible without a keyboard. They are asserted here so they cannot come
   back quietly. */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Every radiogroup must resolve its aria-labelledby to the actual question.
  // A dangling IDREF leaves a screen reader reading bare options with no idea
  // what is being asked, on the site's only lead channel.
  await page.goto(`${BASE}/quote`, { waitUntil: "load" });
  await page.waitForTimeout(600);
  await page.locator('label:has-text("Interior decorating")').first().click();
  await page.locator('button:has-text("Continue")').first().click();
  await page.waitForTimeout(800);
  const groups = await page.evaluate(() =>
    [...document.querySelectorAll('[role="radiogroup"]')].map((g) => {
      const id = g.getAttribute("aria-labelledby");
      const el = id ? document.getElementById(id) : null;
      return Boolean(el && el.textContent && el.textContent.trim().length > 0);
    }),
  );
  check(
    "every radiogroup has a resolvable accessible name",
    groups.length > 0 && groups.every(Boolean),
  );

  // Focus opens on the dialog container, which is neither first nor last in the
  // focusable list — so Shift+Tab is the direction that escapes.
  await page.goto(`${BASE}/work`, { waitUntil: "load" });
  await page.waitForTimeout(700);
  await page.locator("li[id] button:visible").first().click();
  await page.waitForTimeout(650);
  await page.keyboard.press("Shift+Tab");
  await page.waitForTimeout(200);
  check(
    "lightbox holds focus on Shift+Tab",
    await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      return Boolean(d && d.contains(document.activeElement));
    }),
  );
  await page.close();
}

{
  // The bottom sheet declares aria-modal="true"; Tab must honour it.
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${BASE}/work`, { waitUntil: "load" });
  await page.waitForTimeout(700);
  await page.locator("li[id] button:visible").first().evaluate((el) => el.click());
  await page.waitForTimeout(800);
  let held = true;
  for (let i = 0; i < 25 && held; i++) {
    await page.keyboard.press("Tab");
    held = await page.evaluate(() => {
      const d = document.querySelector('[role="dialog"]');
      return Boolean(d && d.contains(document.activeElement));
    });
  }
  check("mobile sheet traps focus over 25 tabs", held);
  await page.close();
}

await browser.close();

console.log(results.join("\n"));
if (results.some((line) => line.startsWith("FAIL"))) process.exitCode = 1;
