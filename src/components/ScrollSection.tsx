import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, ReactNode } from "react";
import {
  DURATION,
  EASE_OUT,
  reducedVariants,
  revealSide,
  revealUp,
  staggerChild,
  staggerParent,
} from "@/lib/motion";

/**
 * Kept at its original API — six pages and dozens of call sites use
 * `<ScrollSection direction="left" delay={0.2}>` — but rewired onto the shared
 * motion system in `lib/motion.ts`.
 *
 * What changed underneath: travel dropped from 80px to 18–22px, the easing is
 * the site's single curve instead of a one-off, `up` now uses a clip reveal
 * rather than a slide, and `prefers-reduced-motion` is honoured (it was not
 * before — the old version threw content 80px regardless).
 *
 * 80px of travel is why the old page felt like slides being flung in. The
 * distance is what reads as cheap, not the fact of the animation.
 */

interface ScrollSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "scale";
}

export function ScrollSection({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: ScrollSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-12% 0px -12% 0px" });
  const reduce = useReducedMotion();

  const variants = reduce
    ? reducedVariants
    : direction === "left" || direction === "right"
      ? revealSide(direction)
      : direction === "scale"
        ? {
            // Was scale 0.85 — a 15% pop. 2% reads as the block settling.
            hidden: { opacity: 0, scale: 0.98 },
            visible: {
              opacity: 1,
              scale: 1,
              transition: { duration: DURATION.base, ease: EASE_OUT },
            },
          }
        : direction === "down"
          ? {
              hidden: { opacity: 0, y: -18 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: DURATION.base, ease: EASE_OUT },
              },
            }
          : revealUp;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggeredScrollSectionProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggeredScrollSection({
  children,
  className = "",
  staggerDelay = 0.06,
}: StaggeredScrollSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-8% 0px -8% 0px" });
  const reduce = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={reduce ? reducedVariants : staggerParent(staggerDelay)}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScrollItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div variants={reduce ? reducedVariants : staggerChild} className={className}>
      {children}
    </motion.div>
  );
}
