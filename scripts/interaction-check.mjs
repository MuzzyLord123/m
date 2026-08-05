import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });

// Desktop: lightbox open, arrow, escape
const d = await b.newPage({ viewport: { width: 1440, height: 900 } });
await d.goto("http://127.0.0.1:3100/work", { waitUntil: "load" });
await d.waitForTimeout(600);
await d.locator("button[aria-label^='Victorian terrace']").first().click();
await d.waitForTimeout(500);
console.log("lightbox open:", await d.locator("[role='dialog']").isVisible());
console.log("caption:", (await d.locator("[role='dialog'] h2").innerText()).slice(0, 40));
await d.keyboard.press("ArrowRight");
await d.waitForTimeout(300);
console.log("counter:", await d.locator("[role='dialog'] dd").nth(1).innerText());
await d.keyboard.press("Escape");
await d.waitForTimeout(400);
console.log("lightbox closed:", (await d.locator("[role='dialog']").count()) === 0);

// Mobile: bottom sheet + menu flood
const m = await b.newPage({ viewport: { width: 375, height: 812 }, hasTouch: true });
await m.goto("http://127.0.0.1:3100/work", { waitUntil: "load" });
await m.waitForTimeout(600);
await m.locator("h2:has-text('Victorian terrace'):visible").first().click();
await m.waitForTimeout(600);
console.log("sheet open:", await m.locator("[role='dialog']").isVisible());
await m.keyboard.press("Escape");
await m.waitForTimeout(400);
console.log("sheet closed:", (await m.locator("[role='dialog']").count()) === 0);

await m.locator("button[aria-label='Open menu']").click();
await m.waitForTimeout(700);
console.log("menu open:", await m.locator("#mobile-menu").isVisible());
console.log("scroll locked:", await m.evaluate(() => document.documentElement.style.overflow));
await m.screenshot({ path: "/tmp/claude-0/-home-user-m/ae5f0dda-adb2-530b-b8d1-de27002a1dbd/scratchpad/shots/menu.png" });
await m.keyboard.press("Escape");
await m.waitForTimeout(600);
console.log("menu closed:", (await m.locator("#mobile-menu").count()) === 0);
await b.close();
