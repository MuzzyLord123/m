import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
for (const path of ["/", "/services", "/quote", "/work"]) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const c = await p.context().newCDPSession(p);
  await c.send("Network.enable");
  await c.send("Network.emulateNetworkConditions", { offline: false, downloadThroughput: 1.6*1024*1024/8, uploadThroughput: 750*1024/8, latency: 150 });
  await c.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await p.route("**/maps**", (r) => r.abort());
  await p.addInitScript(() => {
    window.__lcp = null;
    new PerformanceObserver((l) => { const e = l.getEntries().at(-1); window.__lcp = { t: Math.round(e.startTime), url: (e.url||"").slice(-58), tag: e.element?.tagName, cls: (e.element?.className||"").toString().slice(0,40) }; }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  await p.goto("http://127.0.0.1:3100" + path, { waitUntil: "load" });
  await p.waitForTimeout(5000);
  const lcp = await p.evaluate(() => window.__lcp);
  console.log(path.padEnd(11), JSON.stringify(lcp));
  await p.close();
}
await b.close();
