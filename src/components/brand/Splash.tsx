import Image from "next/image";
import { BRUSH_MASK_URL_MIRRORED } from "@/lib/brush";
import { site } from "@/config/site";

/**
 * The opening moment: James's logo painted onto a black canvas by a brush.
 *
 * A black plane, a brush stroke sweeping left to right, and the logo appearing
 * behind the bristled edge as if the stroke is laying it down — then the plane
 * lifts away and the site is underneath. Same brush mask as the hero headline,
 * so the site's first gesture and its second are the same gesture.
 *
 * THREE THINGS ABOUT THIS THAT MATTER MORE THAN THE ANIMATION
 *
 * 1. IT CANNOT TRAP ANYONE. There is no JavaScript in the dismissal — it is a
 *    CSS animation with `both` fill, ending on visibility: hidden. If scripts
 *    fail, are blocked, or never arrive, the splash still leaves. And it is
 *    pointer-events: none throughout, so even mid-animation it cannot swallow a
 *    tap meant for the page underneath.
 *
 * 2. ONCE PER VISIT. A splash on every page view is an obstacle, not a brand
 *    moment. A three-line script in the document head sets data-splash="seen"
 *    on <html> before first paint, and the CSS honours it — so this plays on
 *    arrival and never again for that session. If sessionStorage throws (private
 *    modes do), the worst case is that it plays again, which is harmless.
 *
 * 3. NO EXTRA IMAGE REQUEST. It renders /brand/logo.png at the same width the
 *    header's wordmark asks for, so it resolves to the same optimised URL and
 *    the same cache entry. A splash that downloads its own copy of the logo is
 *    competing with the hero photograph for the first bytes of the connection.
 *
 * Under prefers-reduced-motion the whole thing is display: none. Someone who
 * has asked for less movement should not be shown a full-screen animation
 * before they are allowed to read anything.
 */
export function Splash() {
  return (
    <div
      className="splash"
      aria-hidden="true"
      /* The MIRRORED brush, so the stroke lays the logo down left to right.
         The upright one uncovers from the right, which reads backwards for a
         brush. See src/lib/brush.ts. The mask travels on a registered custom
         property — see .splash-mark and @property --wipe in globals.css. */
      style={{ ["--brush-mask" as string]: BRUSH_MASK_URL_MIRRORED }}
    >
      <div className="splash-inner">
        {/* The logo, revealed by the brush edge rather than faded in. */}
        <div className="splash-mark">
          <Image
            src="/brand/logo.png"
            alt={site.name}
            width={669}
            height={280}
            sizes="(min-width: 640px) 420px, 260px"
            className="h-auto w-[260px] sm:w-[340px] lg:w-[420px]"
          />
        </div>

        {/* The wet edge: an orange smear that travels a beat ahead of the
            reveal, so the logo reads as being laid down by it. */}
        <div className="splash-wet" aria-hidden="true" />
      </div>

      {/* A hairline that draws itself under the mark as the stroke finishes —
          the same rule that opens every section of the site. */}
      <div className="splash-rule" aria-hidden="true" />
    </div>
  );
}

/**
 * Sets data-splash="seen" before first paint so a returning page view never
 * flashes the splash. Inlined in <head> deliberately: as a module it would run
 * after paint and the splash would appear and then vanish, which is worse than
 * not having one.
 */
export const SPLASH_GUARD = `try{var k='tpm-splash';if(sessionStorage.getItem(k)){document.documentElement.dataset.splash='seen'}else{sessionStorage.setItem(k,'1')}}catch(e){}`;
