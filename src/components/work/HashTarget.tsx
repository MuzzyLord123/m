"use client";

import { useEffect } from "react";

/**
 * Resolves /work#slug to whichever gallery is actually on screen.
 *
 * The page ships two galleries — a desktop grid and a mobile feed — both
 * server-rendered, with CSS deciding which one is shown. They used to give
 * their cards the same `id={slug}`, which meant two things:
 *
 *   1. duplicate ids, which is invalid HTML, and
 *   2. a deep link that landed on the FIRST match in document order — the
 *      desktop card. On a phone that card is display:none, so the browser had
 *      nothing to scroll to and the link silently did nothing. Every "Recent
 *      work" link in the mobile menu points at /work#slug.
 *
 * The ids are now scoped per gallery and each card carries data-slug. This
 * finds the one with layout and scrolls to it. Native anchor behaviour still
 * works for everything else on the site; this is only needed where the same
 * content is deliberately rendered twice.
 */
export function HashTarget() {
  useEffect(() => {
    const go = () => {
      /* decodeURIComponent throws URIError on a malformed escape — /work#% is
       enough. This runs from a rAF callback and a hashchange listener, so the
       throw lands outside React and error.tsx never sees it. The raw fragment
       is a fine fallback; CSS.escape below makes it safe to interpolate either
       way. */
    let slug = window.location.hash.slice(1);
    try {
      slug = decodeURIComponent(slug);
    } catch {
      /* malformed escape — match on the raw fragment instead */
    }
      if (!slug) return;

      const candidates = document.querySelectorAll<HTMLElement>(
        `[data-slug="${CSS.escape(slug)}"]`,
      );
      // offsetParent is null for a display:none subtree — the cheap "is this the
      // one the visitor can see" test, with no layout read.
      const visible = [...candidates].find((el) => el.offsetParent !== null);
      if (!visible) return;

      visible.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    };

    // rAF so the galleries have laid out before we measure visibility.
    const frame = requestAnimationFrame(go);
    window.addEventListener("hashchange", go);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", go);
    };
  }, []);

  return null;
}
