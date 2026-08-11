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

  /* A SERVER ACTION MUST NEVER BE REWRITTEN. This is the one line in the file
     that is not about what a visitor sees, and it closes a hole that took the
     whole site down from a single request.
     /quote and /contact are the only routes that own Server Actions, and both
     are gated — so an action POST to /quote was rewritten here to
     /preview-locked, which owns no actions. Next's action handler responds to
     an unknown action by re-dispatching it to the page that does own it: it
     fetches this site's own origin at /quote, which arrives back at this
     middleware, is rewritten again, and forwards again. Measured on this build,
     one POST produced roughly 1,500 internal requests per second and ~14,700
     open sockets in ten seconds before the server died on EMFILE. No
     authentication needed — the action id is readable in a public JS chunk.
     404 rather than next(): while the preview is up the mailer is meant to be
     switched off, and that is what the locked page tells people. If the forms
     should work during a preview, put "/quote" and "/contact" in BUILT_PAGES so
     nothing is rewritten — but never leave an action's owning page rewritten to
     a page that does not own it.

     IT MUST STAY ABOVE THE isKnownPage CHECK BELOW. That ordering is not
     tidiness, it is half the fix: an action POST to a path this site does not
     have looped too. It renders /_not-found, which owns no actions, so Next
     forwards it to /contact — which this middleware then rewrites, and round it
     goes. Moving this guard below isKnownPage, or scoping it to known pages,
     reopens the hole through any nonsense URL. */
  if (request.method === "POST" && request.headers.has("next-action")) {
    return new NextResponse(null, { status: 404 });
  }

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
