import { chromium } from "playwright";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const p = await b.newPage({ viewport: { width: 412, height: 823 }, deviceScaleFactor: 1.75 });
const c = await p.context().newCDPSession(p);
await c.send("Network.enable");
await c.send("Network.emulateNetworkConditions", { offline: false, downloadThroughput: 1.6*1024*1024/8, uploadThroughput: 750*1024/8, latency: 150 });
await c.send("Emulation.setCPUThrottlingRate", { rate: 4 });
await p.addInitScript(() => {
  window.__shifts = [];
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) {
      if (e.hadRecentInput) continue;
      window.__shifts.push({
        v: +e.value.toFixed(4),
        t: Math.round(e.startTime),
        srcs: (e.sources || []).map((s) => (s.node ? `${s.node.tagName}.${(s.node.className||"").toString().slice(0,50)}` : "?")),
      });
    }
  }).observe({ type: "layout-shift", buffered: true });
});
await p.goto("http://127.0.0.1:3100/", { waitUntil: "load" });
await p.waitForTimeout(6000);
const s = await p.evaluate(() => window.__shifts);
console.log(JSON.stringify(s, null, 1).slice(0, 1400));
await b.close();
