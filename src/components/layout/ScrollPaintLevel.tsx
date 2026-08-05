"use client";

import { motion, useScroll, useSpring } from "motion/react";

/**
 * Signature interaction 7 — scroll paint level.
 * A 3px band of accent laid across the top of the viewport as the page is read.
 * Driven entirely by a motion value; no scroll listener, no state.
 */
export function ScrollPaintLevel() {
  const { scrollYProgress } = useScroll();
  const level = useSpring(scrollYProgress, { stiffness: 260, damping: 40, restDelta: 0.001 });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX: level }}
      className="fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-accent"
    />
  );
}
