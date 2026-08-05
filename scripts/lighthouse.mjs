/**
 * Lighthouse, mobile profile, against a locally running production build.
 *
 *   npm run build && npx next start -p 3100
 *   node scripts/lighthouse.mjs                 # home page
 *   LH_PATHS=/,/work,/quote node scripts/lighthouse.mjs
 *
 * The target is 95+ across Performance, Accessibility, Best Practices and SEO.
 */
import { chromium } from "playwright";
import lighthouse from "lighthouse";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3100";
const paths = (process.env.LH_PATHS || "/").split(",");

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--no-sandbox", "--remote-debugging-port=9222"],
});

const rows = [];

for (const path of paths) {
  const result = await lighthouse(
    `${BASE}${path}`,
    { port: 9222, output: "json", logLevel: "error" },
    undefined,
  );
  if (!result) continue;

  const { categories, audits } = result.lhr;
  const score = (key) => Math.round((categories[key]?.score ?? 0) * 100);

  if (process.env.LH_DETAIL) {
    const el = audits["largest-contentful-paint-element"];
    console.log("LCP element:", JSON.stringify(el?.details?.items?.[0]?.items?.[0]?.node?.snippet ?? el?.displayValue)?.slice(0, 200));
    for (const key of ["render-blocking-resources", "unused-javascript", "server-response-time", "uses-responsive-images", "modern-image-formats", "third-party-summary", "mainthread-work-breakdown", "bootup-time", "font-display", "prioritize-lcp-image"]) {
      const a = audits[key];
      if (a && a.score !== null && a.score < 1) console.log(`  ${key}: ${a.displayValue ?? ""} (score ${a.score})`);
    }
    const a11y = Object.values(audits).filter((a) => a.score !== null && a.score < 1 && result.lhr.categories.accessibility.auditRefs.some((r) => r.id === a.id));
    console.log("  a11y failures:", a11y.map((a) => a.id).join(", ") || "none");
    const bp = Object.values(audits).filter((a) => a.score !== null && a.score < 1 && result.lhr.categories["best-practices"].auditRefs.some((r) => r.id === a.id));
    console.log("  best-practice failures:", bp.map((a) => a.id).join(", ") || "none");
    const net = audits["network-requests"]?.details?.items ?? [];
    console.log("  top transfers:");
    for (const r of net.slice().sort((a,b)=>(b.transferSize||0)-(a.transferSize||0)).slice(0,8))
      console.log(`    ${String(Math.round((r.transferSize||0)/1024)).padStart(5)}K  ${r.resourceType||""}  ${String(r.url).replace(/^https?:\/\/[^/]+/,"").slice(0,72)}`);
    const phases = audits["largest-contentful-paint-element"]?.details?.items?.[1]?.items ?? [];
    for (const ph of phases) console.log(`    LCP phase ${ph.phase}: ${ph.timing}ms`);
    for (const id of ["color-contrast", "label-content-name-mismatch", "errors-in-console"]) {
      const items = audits[id]?.details?.items ?? [];
      for (const item of items.slice(0, 6)) {
        console.log(`   ${id}:`, (item.node?.snippet ?? item.description ?? item.source ?? JSON.stringify(item)).slice(0, 180));
        if (item.node?.explanation) console.log("      ->", item.node.explanation.slice(0, 160));
      }
    }
  }

  rows.push({
    path,
    performance: score("performance"),
    accessibility: score("accessibility"),
    bestPractices: score("best-practices"),
    seo: score("seo"),
    LCP: audits["largest-contentful-paint"]?.displayValue ?? "?",
    CLS: audits["cumulative-layout-shift"]?.displayValue ?? "?",
    TBT: audits["total-blocking-time"]?.displayValue ?? "?",
  });
}

await browser.close();
console.table(rows);

const failed = rows.filter(
  (row) =>
    row.performance < 95 || row.accessibility < 95 || row.bestPractices < 95 || row.seo < 95,
);
if (failed.length) {
  console.log(`\n${failed.length} page(s) below the 95 target.`);
  process.exitCode = 1;
}
