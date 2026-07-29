import { ReactNode, useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";

/**
 * Drift — scroll-scrubbed parallax. The wrapped layer moves a small fraction
 * of the scroll delta (2–6%), which is felt rather than seen. Budget: max two
 * per page. Compositor-only (translateY), springs lightly so it never judders
 * on coarse trackpads.
 */
export function Drift({
  children,
  className,
  /** Total travel in px across the element's scroll-through. Keep it 20–70. */
  travel = 40,
  reverse = false,
}: {
  children: ReactNode;
  className?: string;
  travel?: number;
  reverse?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const raw = useTransform(scrollYProgress, [0, 1], reverse ? [travel, -travel] : [-travel, travel]);
  const y = useSpring(raw, { stiffness: 120, damping: 30, mass: 0.4 });

  return (
    <motion.div ref={ref} className={className} style={reduce ? undefined : { y }}>
      {children}
    </motion.div>
  );
}

/**
 * Scrub Scene — one element transforming in direct proportion to scroll.
 * Used on the homepage for the globe *wrapper* (never its internals): as the
 * hero scrolls away the globe recedes — slight scale-down, drift, and fade —
 * so leaving the hero feels like leaving orbit rather than the picture simply
 * sliding off-screen. Budget: max two per page.
 */
export function HeroScrub({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  // Progress 0 while the hero is fully in view → 1 once scrolled past.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const opacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 0.9, 0.55]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={reduce ? undefined : { scale, y, opacity }}>{children}</motion.div>
    </div>
  );
}

/**
 * WordReveal — the statement move. Each word's opacity is tied directly to
 * scroll progress, so reading pace and scroll pace fuse: the sentence
 * *arrives* as the visitor moves. Opacity only — nothing cheaper exists.
 * Counts against the page's scrub budget.
 */
function Word({
  progress,
  range,
  children,
}: {
  progress: MotionValue<number>;
  range: [number, number];
  children: string;
}) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <motion.span style={{ opacity }} className="inline">
      {children}{" "}
    </motion.span>
  );
}

export function WordReveal({
  text,
  className,
  as: Tag = "p",
}: {
  text: string;
  className?: string;
  as?: "p" | "h2" | "h3";
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    // The reveal runs while the block crosses the middle half of the viewport.
    offset: ["start 0.85", "start 0.35"],
  });

  const words = text.split(/\s+/).filter(Boolean);
  const MTag = motion[Tag];

  if (reduce) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <MTag ref={ref as never} className={className} aria-label={text}>
      <span aria-hidden>
        {words.map((w, i) => (
          <Word
            key={`${w}-${i}`}
            progress={scrollYProgress}
            range={[i / words.length, Math.min(1, (i + 1.6) / words.length)]}
          >
            {w}
          </Word>
        ))}
      </span>
    </MTag>
  );
}

/**
 * MaskReveal — imagery entrance: clip-path inset opens upward while the inner
 * image settles from 1.15 to 1. Imagery only, never text. (Unused on the
 * homepage — it has no photographic imagery — wired here for the portfolio
 * rollout in Phase 4.)
 */
export function MaskReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      style={{ overflow: "hidden" }}
      initial={{ clipPath: "inset(0 0 100% 0)" }}
      whileInView={{ clipPath: "inset(0 0 0% 0)" }}
      viewport={{ once: true, margin: "-12% 0px -12% 0px" }}
      transition={{ duration: 1.0, ease: [0.65, 0, 0.35, 1], delay }}
    >
      <motion.div
        initial={{ scale: 1.15 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: "-12% 0px -12% 0px" }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
