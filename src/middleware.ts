import { NextResponse, type NextRequest } from "next/server";
import { isBuilt, isKnownPage, previewMode } from "@/config/preview";

/**
 * In preview mode, anything outside BUILT_PAGES shows the "not built yet"
 * notice instead of the real page.
 *
 * This is here rather than in each page for one reason: greying a link out in
 * the menu is theatre if typing the address still opens the finished page — and
 * the site links to /services, /quote and /contact from a dozen places that are
 * not the menu (the mega-menu, the footer, every CTA button, the service cards
 * on the home page). One rewrite covers all of them, including addresses nobody
 * has thought of.
 *
 * A REWRITE, not a redirect: the address bar keeps the page the visitor asked
 * for, so they can see it is /services that is not built rather than being
 * bounced somewhere unrelated.
 *
 * Costs nothing when preview mode is off — the first line returns immediately.
 */
export function middleware(request: NextRequest) {
  if (!previewMode) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (pathname === "/preview-locked" || isBuilt(pathname)) return NextResponse.next();

  /* Only a REAL page of this site gets the notice. Rewriting everything turned
     every mistyped address into a 200 — a soft 404, which search engines index
     and which the content audit fails the build over. Anything unknown falls
     through to the site's own 404. */
  if (!isKnownPage(pathname)) return NextResponse.next();

  return NextResponse.rewrite(new URL("/preview-locked", request.url));
}

export const config = {
  /**
   * Everything except Next's own output, the API, and the files that live at
   * the root of the site. Those must never be rewritten: an og-image or a
   * favicon answered with an HTML page is a broken share card and a missing
   * icon, and robots.txt answered with HTML is a crawler error.
   */
  matcher: [
    "/((?!_next/static|_next/image|api/|favicon.ico|icon.png|apple-icon.png|opengraph-image|robots.txt|sitemap.xml|work/|social/|brand/|fonts/).*)",
  ],
};
