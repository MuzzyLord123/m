import Image from "next/image";
import { BRUSH_MASK_URL_MIRRORED } from "@/lib/brush";
import { site } from "@/config/site";

/**
 * The opening moment, in two beats:
 *
 *   1. The brush in James's own logo lays the orange stroke down, left to
 *      right, behind a bristled edge with a wet leading smear.
 *   2. The wording fades up on top of it, and the mark is complete.
 *
 * Then the black plane lifts and the site is underneath. About 2.2s.
 *
 * IT IS TWO IMAGES, NOT ONE. logo.png is a flat PNG, so the stroke and the type
 * cannot move independently while they share a file. scripts/make-logo-layers.mjs
 * splits the artwork into logo-stroke.png and logo-text.png on a rectangle that
 * no part of the swoosh crosses, and that script fails if the two layers do not
 * composite back to the original pixel for pixel. They are stacked here in the
 * same box, at the same size, so together they ARE the logo.
 *
 * THREE THINGS THAT MATTER MORE THAN THE ANIMATION
 *
 * 1. IT CANNOT TRAP ANYONE. No JavaScript in the dismissal — a CSS animation
 *    with `both` fill ending on visibility: hidden. If scripts fail, are
 *    blocked, or never arrive, the splash still leaves. pointer-events: none
 *    from the first frame, so it cannot swallow a tap either.
 *
 * 2. ONCE PER VISIT, and `?splash` replays it. See SPLASH_GUARD below.
 *
 * 3. ONLY THE STROKE IS PRIORITY. It is the first thing on screen, so it is
 *    fetched eagerly; the wording is not needed until a second in and would
 *    only compete with the hero photograph for the first bytes of the
 *    connection if it were.
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
      /* The MIRRORED brush, so the stroke is laid down left to right. The
         upright one uncovers from the right, which reads backwards for a brush.
         See src/lib/brush.ts. */
      style={{ ["--brush-mask" as string]: BRUSH_MASK_URL_MIRRORED }}
    >
      <div className="splash-logo">
        {/* Beat one — the stroke, painted on behind the brush edge. */}
        <Image
          src="/brand/logo-stroke.png"
          alt=""
          fill
          priority
          sizes="(min-width: 640px) 420px, 260px"
          className="splash-stroke object-contain"
        />

        {/* Beat two — the wording, fading up into place. */}
        <Image
          src="/brand/logo-text.png"
          alt={site.name}
          fill
          sizes="(min-width: 640px) 420px, 260px"
          className="splash-text object-contain"
        />

        {/* The wet edge, travelling a beat ahead of the stroke. */}
        <span className="splash-wet" aria-hidden="true" />
      </div>

      {/* The hairline, drawn last — the same rule that opens every section. */}
      <span className="splash-rule" aria-hidden="true" />
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
