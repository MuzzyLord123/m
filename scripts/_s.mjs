import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75 });
const c = await p.context().newCDPSession(p);
await c.send("Network.enable");
await c.send("Network.emulateNetworkConditions", { offline: false, downloadThroughput: 1.6*1024*1024/8, uploadThroughput: 750*1024/8, latency: 150 });
await c.send("Emulation.setCPUThrottlingRate", { rate: 4 });
const sizes = [];
p.on("response", async (r) => {
  const t = r.request().resourceType();
  if (t === "image" || t === "font" || t === "script") {
    const len = Number(r.headers()["content-length"] || 0);
    if (len > 12000) sizes.push(`${t.padEnd(6)} ${(len/1024).toFixed(0).padStart(4)}KB ${r.url().slice(-52)}`);
  }
});
await p.addInitScript(() => {
  window.__lcp = null;
  new PerformanceObserver((l) => { const e = l.getEntries().at(-1); window.__lcp = { t: Math.round(e.startTime), url: (e.url||"").slice(-50), tag: e.element?.tagName }; }).observe({ type: "largest-contentful-paint", buffered: true });
});
await p.goto("http://127.0.0.1:3100/services", { waitUntil: "load" });
await p.waitForTimeout(6000);
console.log("LCP:", JSON.stringify(await p.evaluate(() => window.__lcp)));
console.log(sizes.sort().join("\n"));
await b.close();
