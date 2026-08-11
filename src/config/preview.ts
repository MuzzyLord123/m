/**
 * PREVIEW MODE — the half-built site you send a prospect.
 * ============================================================================
 *
 * The whole site is finished. This exists so a prospect can be sent a live
 * link showing the home page and the two galleries, with the rest of the menu
 * greyed out and marked as not built yet.
 *
 * TO TURN IT OFF — which is the whole point of it being one switch:
 *
 *   In Vercel:  Settings -> Environment Variables -> set
 *               NEXT_PUBLIC_PREVIEW_MODE to 0, then redeploy.
 *
 *   Or in code: change PREVIEW_DEFAULT below to false.
 *
 * The site is then complete: every page reachable, nothing greyed, nothing
 * blocked, and no trace of any of this in the HTML.
 *
 * A SAFETY NET, because forgetting to turn this off would ship a crippled site
 * to a paying client: `npm run audit:content` FAILS while preview mode is on
 * and says so in plain words. That audit is the one the hand-over tells you to
 * run before launch, so this cannot go live by accident.
 *
 * Preview mode also sets noindex site-wide and trims the sitemap to the built
 * pages, so a half-site is never picked up by Google on the way past.
 */

/**
 * Whether preview mode is on when no environment variable says otherwise.
 *
 * True, because the immediate need is the prospect preview. Set the env var to
 * "0" for the real launch — or flip this to false once the sale is done and you
 * never want to think about it again.
 */
const PREVIEW_DEFAULT = true;

const flag = process.env.NEXT_PUBLIC_PREVIEW_MODE;

/**
 * ON unless the flag says otherwise, and the flag is read forgivingly.
 *
 * It used to be `flag === "1"`, which meant every other truthy spelling turned
 * preview mode OFF rather than on: setting NEXT_PUBLIC_PREVIEW_MODE=true — the
 * obvious thing to type into a Vercel dashboard — published the whole
 * half-finished site, which is the exact failure the flag exists to prevent.
 * "0", "false", "off" and "no" switch it off; anything else that is set leaves
 * it on; unset falls back to PREVIEW_DEFAULT. The asymmetry is deliberate: a
 * typo should fail towards showing less, never towards publishing more.
 */
const OFF = new Set(["0", "false", "off", "no"]);

export const previewMode =
  flag === undefined || flag.trim() === ""
    ? PREVIEW_DEFAULT
    : !OFF.has(flag.trim().toLowerCase());

/**
 * The pages the prospect can actually open: the home page and the two
 * galleries. Everything else is greyed in the menu and shows the "not built
 * yet" notice if its address is typed in directly.
 *
 * ONE THING TO KNOW BEFORE YOU SEND IT. /quote and /contact are not on this
 * list, and every "Get a Free Quote" button on the site points at /quote — so
 * on a preview those all land on the notice rather than the form. That is
 * consistent (the enquiry flow is part of the full build) but it does mean the
 * prospect cannot try the form. Add "/quote" to this array if you would rather
 * show it off; nothing else needs changing.
 *
 * /privacy IS ON THIS LIST AND SHOULD STAY ON IT. It is not a page being shown
 * off — it is the legal notice for a live site that collects names, phone
 * numbers, email addresses and job addresses through a form, and a privacy
 * notice nobody can open is not a privacy notice. It was gated with everything
 * else at first, which left the link in the footer and in the privacy pop-up
 * pointing at "this page has not been built yet" while the site was publicly
 * reachable and collecting details. It is deliberately NOT in the menu, so
 * unlocking it does not change what the prospect is being shown.
 */
export const BUILT_PAGES = ["/", "/work", "/videos", "/privacy"] as const;

/**
 * Every page this site actually has.
 *
 * The middleware needs this to tell "a real page that is switched off" from "a
 * URL that does not exist". Without it, /whatever-nonsense was answered with
 * the not-built notice and a 200 — a soft 404, which search engines index and
 * which `npm run audit:content` rightly failed the build over. Anything not on
 * this list now falls through to the real 404.
 *
 * /blog covers /blog/<post> by prefix. Add a route here if one is ever added
 * to the site.
 */
export const ALL_PAGES = [
  "/",
  "/work",
  "/videos",
  "/services",
  "/about",
  "/quote",
  "/contact",
  "/blog",
  "/privacy",
] as const;

/** Path without its query string or hash: /services#kitchens is /services. */
function normalise(href: string): string {
  const path = href.split(/[?#]/)[0];
  return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
}

function matches(path: string, route: string): boolean {
  return route === "/" ? path === "/" : path === route || path.startsWith(`${route}/`);
}

/** True when a path is a real page of this site (built or not). */
export function isKnownPage(href: string): boolean {
  const path = normalise(href);
  return ALL_PAGES.some((route) => matches(path, route));
}

/** True when a path is reachable in the current mode. */
export function isBuilt(href: string): boolean {
  if (!previewMode) return true;
  const path = normalise(href);
  return BUILT_PAGES.some((route) => matches(path, route));
}

/** Shown wherever a locked page is named. Kept short — it is a chip, not a page. */
export const NOT_BUILT_LABEL = "Not built yet";
