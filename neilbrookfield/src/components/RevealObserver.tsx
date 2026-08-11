'use client';

import { useEffect } from 'react';

/**
 * One IntersectionObserver for every [data-reveal] element on the page.
 *
 * Mounted once in the root layout. Elements are revealed as they arrive and then
 * unobserved — the animations are once-only, and nothing re-runs on scroll back.
 *
 * If IntersectionObserver is missing, everything is revealed immediately rather
 * than left hidden. Failing open is the only acceptable direction here.
 */
export function RevealObserver() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!nodes.length) return;

    const revealAll = () => nodes.forEach((n) => n.classList.add('is-in'));

    if (typeof IntersectionObserver === 'undefined') {
      revealAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
    );

    nodes.forEach((n) => observer.observe(n));

    // Anything added later (a route change re-renders the tree) is picked up by
    // the next mount of this component, which is what we want.
    return () => observer.disconnect();
  }, []);

  return null;
}
