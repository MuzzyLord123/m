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

  await page.locator("button[aria-label^='Victorian terrace']").first().click();
  await page.waitForTimeout(950);
  const lightbox = page.getByRole("dialog", { name: /Victorian terrace/ });
  check("lightbox opens", await lightbox.isVisible());
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(250);
  check(
    "arrow key steps photograph",
    (await page.locator("[role='dialog'] dd").nth(1).innerText()) === "2 of 3",
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
  check("escape closes lightbox", (await lightbox.count()) === 0);
  await page.close();
}

// ----------------------------------------------------------------- mobile
{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, hasTouch: true });
  await page.goto(`${BASE}/work`, { waitUntil: "load" });
  await page.waitForTimeout(500);

  await page.locator("h2:has-text('Victorian terrace'):visible").first().click();
  await page.waitForTimeout(500);
  const sheet = page.getByRole("dialog", { name: /Victorian terrace/ });
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

await browser.close();

console.log(results.join("\n"));
if (results.some((line) => line.startsWith("FAIL"))) process.exitCode = 1;
