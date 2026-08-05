"use client";

import { useEffect } from "react";

/**
 * Drives the `data-condensed` fallback for the header chrome.
 *
 * The nav condense, the utility strip and the mobile bar's background are all
 * scroll-driven CSS animations where the browser supports them. Where it does
 * not — Firefox, and Safari before 26 — the `@supports not` branches in
 * globals.css transition the same properties off a `data-condensed` attribute,
 * and something has to set it. Without this the header stays transparent for
 * those visitors and the wordmark sits directly on top of the page content.
 *
 * An IntersectionObserver on a zero-height sentinel at the top of the document,
 * not a scroll listener: the only question being asked is "are we past the top",
 * which is exactly what an observer answers. It costs no scroll work at all.
 *
 * Mounted unconditionally but inert where the CSS already handles it, so the two
 * mechanisms can never fight over the same properties.
 */
export function NavSentinel() {
  useEffect(() => {
    if (CSS.supports("animation-timeline: scroll()")) return;

    const sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText =
      "position:absolute;top:64px;left:0;width:1px;height:1px;pointer-events:none";
    document.body.prepend(sentinel);

    const root = document.documentElement;
    const observer = new IntersectionObserver(
      ([entry]) => {
        root.dataset.condensed = String(!entry.isIntersecting);
      },
      { threshold: 0 },
    );
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      sentinel.remove();
      delete root.dataset.condensed;
    };
  }, []);

  return null;
}
