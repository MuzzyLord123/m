"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The quiet workhorse: content settles up into place once, when scrolled to.
 *
 * This is deliberately hand-rolled on an IntersectionObserver and a CSS
 * transition rather than the animation library. It is used forty-odd times on
 * the home page alone, and every instance carried a chunk of library machinery
 * and its own main-thread work. A class swap on transform and opacity buys the
 * same result for almost nothing.
 *
 * Reduced motion is handled in CSS: the global media query in globals.css
 * collapses the transition, and the element is rendered visible from the start
 * so nothing depends on the observer ever firing.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
  immediate = false,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "span";
  /**
   * Render visible from the first paint, skipping the observer entirely.
   *
   * Set this on anything above the fold. A reveal starts at opacity 0, so an
   * LCP element inside one cannot paint until hydration has run and the
   * observer has fired — which is what held the first service photograph at a
   * 2.5s LCP despite it being a preloaded 8KB file.
   */
  immediate?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (immediate) return;
    const node = ref.current;
    if (!node) return;

    // No observer support, or already past: show it and move on.
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [immediate]);

  return (
    <Tag
      ref={ref as never}
      data-reveal={immediate || shown ? "in" : "out"}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
      className={`reveal ${className}`}
    >
      {children}
    </Tag>
  );
}
