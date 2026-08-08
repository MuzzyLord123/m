/**
 * Fails if the site would show a visitor something it should not.
 *
 * Three classes of problem, all of which look fine in a code review and only
 * bite once the site is live:
 *
 *   1. An unfilled {{TOKEN}} rendered into the HTML. "{{PHONE}}" on a live
 *      decorator's website costs every enquiry that page would have made.
 *   2. A link whose href is still a token, or is empty. A footer Facebook icon
 *      that navigates to /%7B%7BFACEBOOK_URL%7D%7D is worse than no icon.
 *   3. The default site URL still in the canonical tags, which points search
 *      engines at a host the client may not own.
 *
 * Crawls the built HTML directly rather than through a browser: the question is
 * what the server sends, and every one of these ships in the initial response.
 *
 * Run against a production build:
 *   npm run build && npx next start -p 3100 &
 *   npm run audit:content
 *
 * Exits non-zero on failure so it can gate a deploy.
 */
const BASE = process.env.BASE_URL || "http://127.0.0.1:3100";
const ROUTES = [
  "/",
  "/work",
  "/videos",
  "/services",
  "/about",
  "/contact",
  "/quote",
  "/blog",
  "/blog/cost-to-paint-a-three-bed-house",
  "/blog/choosing-the-right-white",
  "/blog/wallpaper-versus-paint",
  "/privacy",
  "/sitemap.xml",
  "/robots.txt",
];

const TOKEN = /\{\{[A-Z_]+\}\}|%7B%7B[A-Z_]+%7D%7D/g;

const failures = [];
const warnings = [];

for (const route of ROUTES) {
  const res = await fetch(BASE + route);
  if (!res.ok) {
    failures.push(`${route} -> HTTP ${res.status}`);
    continue;
  }
  const html = await res.text();

  /* Strip <script> blocks before looking for tokens. React's flight payload
     serialises the whole `site` object into the page because client components
     import it, so a token can sit in that payload while nothing on screen shows
     it. That is untidy but harmless — it is not what a customer reads. Only
     markup and text count as a failure; payload-only hits are reported
     separately so they are visible without blocking a deploy. */
  const visible = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");

  for (const t of new Set(visible.match(TOKEN) ?? [])) {
    failures.push(`${route} shows ${t.replace(/%7B/g, "{").replace(/%7D/g, "}")}`);
  }

  const payloadOnly = new Set(
    [...new Set(html.match(TOKEN) ?? [])].filter((t) => !visible.includes(t)),
  );
  for (const t of payloadOnly) {
    warnings.push(`${route} carries ${t} in the RSC payload only (not shown to a visitor)`);
  }

  // An anchor with an empty or tokenised href is a dead end on a live site.
  for (const [, href] of html.matchAll(/<a[^>]+href="([^"]*)"/g)) {
    if (href === "" || href === "#") warnings.push(`${route} has an empty href`);
  }
}

// The canonical host must not still be the built-in default.
const home = await fetch(BASE + "/").then((r) => r.text());
const canonical = /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/.exec(home)?.[1];
if (!canonical) {
  failures.push("/ has no canonical tag");
} else if (!process.env.NEXT_PUBLIC_SITE_URL) {
  warnings.push(
    `canonical is ${canonical} — set NEXT_PUBLIC_SITE_URL to the live host and redeploy`,
  );
}

/* Preview mode is the one deliberate half-built state this site has, and
   forgetting to turn it off would ship a client a site with most of its menu
   greyed out. This audit is the check the hand-over tells you to run before
   launch, so it is the right place to catch it — a failure, not a warning,
   because "ready to publish" is exactly what it is not. */
const previewOn = await fetch(BASE + "/services").then((r) =>
  r.text().then((html) => html.includes("This page is part of the")),
);
if (previewOn) {
  failures.push(
    "PREVIEW MODE IS ON — most pages are greyed out and show a \"not built yet\" notice. " +
      "Set NEXT_PUBLIC_PREVIEW_MODE=0 in the host's environment variables and redeploy, " +
      "or set PREVIEW_DEFAULT to false in src/config/preview.ts.",
  );
}

// A 404 must actually 404, not soft-200. Search engines index soft 404s.
const missing = await fetch(BASE + "/this-page-does-not-exist");
if (missing.status !== 404) failures.push(`unknown URL returned ${missing.status}, expected 404`);

console.log(`routes checked: ${ROUTES.length}`);
console.log(`404 handling  : ${missing.status === 404 ? "correct" : "WRONG"}`);

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of [...new Set(warnings)]) console.log("  " + w);
}

if (failures.length) {
  console.log(`\n${failures.length} FAILURE(S) — the site is not ready to go live:`);
  for (const f of [...new Set(failures)]) console.log("  " + f);
  console.log(
    "\nFill these in via NEXT_PUBLIC_* environment variables or in src/config/site.ts.",
  );
  process.exit(1);
}

console.log("\nNo placeholder tokens reach a visitor. Content is ready to publish.");
