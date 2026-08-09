import Image from "next/image";
import { site } from "@/config/site";

/**
 * How many band elements to render. How many are actually USED is `--n` in
 * globals.css, which drops to four on a phone; the spare ones park off the
 * right-hand edge and are clipped. This is the ceiling, not the count.
 */
const BANDS = 6;

/**
 * The opening moment: the logo fades up on black, then the black clears in
 * vertical bands and the site is underneath.
 *
 *   0.20 – 1.00s  the logo fades and settles up into place
 *   0.85 – 1.35s  a hairline draws itself underneath
 *   1.45 – 1.73s  the logo eases away
 *   1.55 – 2.40s  six bands lift, 60ms apart — like roller strokes clearing
 *                 a wall, which is the one reveal that belongs on a
 *                 decorator's site rather than being borrowed from anywhere
 *
 * THE BANDS ARE THE BACKGROUND. The panel itself is transparent; the six bands
 * hold the black. That is what lets the site appear THROUGH the gaps as they
 * lift rather than the whole plane sliding off in one piece. They are absolutely
 * positioned with a 1px overlap because six flexed children land on sub-pixel
 * boundaries and hairline seams of the page behind show through the black.
 *
 * THREE THINGS THAT MATTER MORE THAN THE ANIMATION
 *
 * 1. IT CANNOT TRAP ANYONE. No JavaScript in the dismissal — CSS animations
 *    with `both` fill, ending on visibility: hidden. If scripts fail, are
 *    blocked, or never arrive, the splash still leaves. pointer-events: none
 *    from the first frame, so it cannot swallow a tap either.
 *
 * 2. ONCE PER VISIT, and `?splash` replays it. See SPLASH_GUARD below.
 *
 * 3. NO EXTRA IMAGE REQUEST, AND NO PRIORITY. It renders /brand/logo.png at a
 *    width that lands on the same srcset candidate the header already asks for,
 *    so it is one shared request and one cache entry.
 *
 *    `loading="eager"` rather than `priority`, and the difference is measurable.
 *    The optimised logo is ~33KB — over twice the weight of the hero photograph
 *    at the size it renders — because the mark is glossy and gradient-heavy.
 *    `priority` adds a preload link, which on a throttled connection puts those
 *    33KB in front of the LCP element: Lighthouse went 95 -> 89 and LCP
 *    2.8s -> 3.7s on that one attribute alone. Eager still starts the fetch
 *    immediately, it just does not outrank the photograph. The logo has 200ms
 *    before it is needed and 1.5s before the reveal, which is ample.
 *
 * Under prefers-reduced-motion the whole thing is display: none. Someone who
 * has asked for less movement should not be shown a full-screen animation
 * before they are allowed to read anything.
 */
export function Splash() {
  return (
    <div className="splash" aria-hidden="true">
      {/* The black, in pieces. */}
      <div className="splash-bands">
        {Array.from({ length: BANDS }, (_, i) => (
          <span key={i} className="splash-band" style={{ ["--i" as string]: i }} />
        ))}
      </div>

      {/* Warms the black from below so the plane reads as a surface rather than
          an absence. Fades with the logo, before the bands move, so it never
          sits over the site. */}
      <div className="splash-glow" />

      <div className="splash-mark">
        <Image
          src="/brand/logo.png"
          alt={site.name}
          width={669}
          height={280}
          loading="eager"
          sizes="(min-width: 1024px) 420px, (min-width: 640px) 340px, 260px"
          className="h-auto w-[260px] sm:w-[340px] lg:w-[420px]"
        />
        <span className="splash-rule" />
      </div>
    </div>
  );
}

/**
 * Sets data-splash="seen" before first paint so a returning page view never
 * flashes the splash. Inlined in <head> deliberately: as a module it would run
 * after paint and the splash would appear and then vanish, which is worse than
 * not having one.
 *
 * `?splash` FORCES IT, and exists because once-per-session made the splash
 * almost impossible to look at. The first load plays it and every load after
 * that in the same browser session correctly does not — which is right for a
 * visitor and useless for anyone reviewing it, or showing it to a client. Add
 * ?splash to any address and it plays, as many times as you like:
 *
 *     https://…/?splash
 *
 * It clears the flag rather than just skipping the check, so a plain reload
 * afterwards behaves like a first visit too.
 */
export const SPLASH_GUARD = `try{var k='tpm-splash';if(location.search.indexOf('splash')>-1){sessionStorage.removeItem(k)}else if(sessionStorage.getItem(k)){document.documentElement.dataset.splash='seen'}else{sessionStorage.setItem(k,'1')}}catch(e){}`;
