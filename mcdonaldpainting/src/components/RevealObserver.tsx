'use client';

import { useEffect } from 'react';

/**
 * One observer for the whole site.
 *
 * Anything with a `data-reveal` attribute gets `data-revealed="true"` the first
 * time it comes into view, and the CSS in globals.css does the rest. That keeps
 * every page a server component — no motion wrapper around each heading, no
 * hydration cost per animated element, nothing on the critical path.
 *
 * A MutationObserver picks up nodes that arrive after a client-side navigation,
 * so this does not need to know about the router.
 *
 * Reduced motion is handled in CSS rather than here: the attribute is still set,
 * the animations are simply switched off. That way nothing depends on
 * JavaScript having read the preference correctly.
 */
export function RevealObserver() {
  useEffect(() => {
    const seen = new WeakSet<Element>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute('data-revealed', 'true');
          io.unobserve(entry.target);
        }
      },
      // Fires a little before the element is fully on screen, so the reveal has
      // finished by the time it is being read rather than starting then.
      { rootMargin: '0px 0px -12% 0px', threshold: 0.01 },
    );

    const scan = () => {
      // `data-reveal="now"` is animated by CSS on load and is deliberately not
      // this component's business — see globals.css.
      for (const node of document.querySelectorAll('[data-reveal]:not([data-reveal="now"])')) {
        if (seen.has(node)) continue;
        seen.add(node);
        // Anything already on screen at load is revealed immediately rather
        // than animating in behind the fold-line.
        io.observe(node);
      }
    };

    scan();

    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
