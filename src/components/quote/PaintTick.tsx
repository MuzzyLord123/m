"use client";

import { m, useReducedMotion } from "motion/react";

/**
 * The success mark: a disc of colour laid down, then a tick brushed through it
 * in one stroke. Runs once, on arrival.
 */
export function PaintTick() {
  const reduced = useReducedMotion();

  return (
    <svg viewBox="0 0 64 64" className="size-16" fill="none" aria-hidden="true">
      <m.circle
        cx="32"
        cy="32"
        r="30"
        fill="var(--color-accent)"
        initial={reduced ? false : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.42, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: "32px 32px" }}
      />
      <m.path
        d="M19 33.5 28 42l17-19"
        stroke="#fff"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          duration: reduced ? 0 : 0.4,
          delay: reduced ? 0 : 0.22,
          ease: [0.16, 1, 0.3, 1],
        }}
      />
    </svg>
  );
}
