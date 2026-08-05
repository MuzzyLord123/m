"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

/**
 * Signature interaction 2 — roller-pass section transition.
 *
 * A solid band of accent sits over the section and is carried off to the right
 * as the section rises into view, laying the section down behind it like a coat
 * off a roller. Scroll-linked through useScroll, so it tracks the reader's
 * hand rather than firing on a timer.
 *
 * Reserved for major section boundaries — three or four on the site, not every
 * section. Not rendered at all under prefers-reduced-motion.
 */
export function RollerPass({
  children,
  className = "",
  tone = "accent",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "accent" | "plaster";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.95", "start 0.25"],
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "102%"]);
  // The trailing edge of a roller is never perfectly square.
  const skew = useTransform(scrollYProgress, [0, 0.5, 1], [0, -1.2, 0]);

  return (
    <div ref={ref} className={`relative isolate ${className}`}>
      {children}
      {!reduced && (
        <motion.div
          aria-hidden="true"
          style={{ x, skewX: skew }}
          className={`pointer-events-none absolute inset-y-0 -left-[2%] z-20 w-[104%] ${
            tone === "accent" ? "bg-accent" : "bg-plaster"
          }`}
        />
      )}
    </div>
  );
}
