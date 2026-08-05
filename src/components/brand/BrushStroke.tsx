"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Hand-drawn brush-stroke underline. Two overlapping tapered strokes give it
 * the loaded-then-drying weight of a real brush rather than a ruled line.
 * Draws left to right by animating pathLength; collapses to fully drawn under
 * prefers-reduced-motion.
 */

const strokeVariants = {
  rest: { pathLength: 0, opacity: 0 },
  drawn: { pathLength: 1, opacity: 1 },
};

export function BrushStroke({
  className = "",
  colour = "currentColor",
}: {
  className?: string;
  colour?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <svg
      className={className}
      viewBox="0 0 120 10"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <motion.path
        d="M1.5 6.2c14-2.3 30.4-3.4 47.8-3.3 19.4.1 38.6 1.4 69.2 3.6"
        stroke={colour}
        strokeWidth={3.2}
        strokeLinecap="round"
        variants={strokeVariants}
        transition={{
          pathLength: { duration: reduced ? 0 : 0.42, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: reduced ? 0 : 0.08 },
        }}
      />
      {/* Dry-brush trail — lighter, slightly offset, a beat behind. */}
      <motion.path
        d="M4 8.4c16-1.6 34-2.4 52-2.2 17 .2 34 1 62 2.4"
        stroke={colour}
        strokeWidth={1.1}
        strokeLinecap="round"
        opacity={0.45}
        variants={strokeVariants}
        transition={{
          pathLength: { duration: reduced ? 0 : 0.5, ease: [0.16, 1, 0.3, 1], delay: reduced ? 0 : 0.05 },
          opacity: { duration: reduced ? 0 : 0.08 },
        }}
      />
    </svg>
  );
}
