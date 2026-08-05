"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Signature interaction 4 — the drip.
 *
 * One paint drip hanging off the services heading rule. It runs once, when the
 * heading first comes into view, and then it is finished. No loop.
 */
export function DripAccent({ className = "" }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <motion.svg
      aria-hidden="true"
      viewBox="0 0 14 30"
      fill="none"
      className={`h-[38px] w-[17px] overflow-visible ${className}`}
      initial={reduced ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ duration: 0.001 }}
    >
      <motion.g
        style={{ transformOrigin: "7px 0px" }}
        initial={reduced ? false : { scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true, amount: 0.8 }}
        transition={{ duration: reduced ? 0 : 0.6, ease: [0.34, 0.9, 0.4, 1] }}
      >
        {/* A run of wet paint: heavy where it leaves the rule, thinning as it
            falls, gathering into the bead that hangs at the tip. */}
        <path
          d="M3.4 0h7.2c-.15 2.6-1.05 4.3-1.6 6.4-.5 1.9-.5 3.8-.75 5.7-.2 1.6-.5 3.2-.5 4.8 0 .9 1.4 1.5 2.35 2.4a4.6 4.6 0 1 1-7.4 0c.95-.9 2.35-1.5 2.35-2.4 0-1.6-.3-3.2-.5-4.8-.25-1.9-.25-3.8-.75-5.7C3.25 4.3 2.35 2.6 2.2 0Z"
          fill="var(--color-accent)"
        />
      </motion.g>
    </motion.svg>
  );
}
