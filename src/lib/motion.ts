/**
 * One motion system for the whole site.
 *
 * Before this, animation was decided per component: eight different easing
 * curves, durations between 0.3s and 1.2s, and `y: 80` slides that make an
 * element look like it is being thrown onto the page. Different timings on every
 * section is the single clearest tell of a site assembled from parts rather than
 * designed — the eye reads inconsistency long before it reads the layout.
 *
 * Everything below is small, slow and shared. Movement is 12–28px, never more.
 * Openings use a clip reveal rather than a fade so type appears to be uncovered
 * instead of materialising.
 */

/** Deceleration curve. Fast start, long settle — reads as weight. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Symmetric curve for hovers and state changes. */
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

/** Slight overshoot, for a single element claiming attention. Use sparingly. */
export const EASE_SPRING = [0.34, 1.4, 0.64, 1] as const;

export const DURATION = {
  /** Hover, focus, colour. Below ~120ms feels broken, above ~250ms feels slow. */
  fast: 0.2,
  /** Default for anything entering. */
  base: 0.7,
  /** Large surfaces and pinned sequences. */
  slow: 1.1,
} as const;

/** Gap between siblings in a stagger. Above ~0.09 the last item feels forgotten. */
export const STAGGER = 0.06;

/** Viewport trigger. Fires a little before the element is fully on screen. */
export const VIEWPORT = { once: true, margin: "-12% 0px -12% 0px" } as const;

/**
 * Clip-and-lift reveal. The element rises 18px while its mask opens upward.
 * `clipPath` is used rather than `opacity` alone because a fade makes text look
 * like it is switching on, where a wipe makes it look like it is being revealed.
 */
export const revealUp = {
  hidden: { opacity: 0, y: 18, clipPath: "inset(0% 0% 100% 0%)" },
  visible: {
    opacity: 1,
    y: 0,
    clipPath: "inset(0% 0% 0% 0%)",
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
} as const;

/** Horizontal counterpart, for split layouts. */
export const revealSide = (from: "left" | "right") => ({
  hidden: { opacity: 0, x: from === "left" ? -22 : 22 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.base, ease: EASE_OUT },
  },
});

/** Parent that releases its children in sequence. */
export const staggerParent = (stagger = STAGGER, delayChildren = 0.05) => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
});

/** Child of `staggerParent`. Deliberately smaller travel than the parent block. */
export const staggerChild = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_OUT },
  },
} as const;

/**
 * Reduced-motion equivalents. Not "no animation" — opacity only, fast. Removing
 * transitions entirely makes a site feel broken to people who set the
 * preference; what they are asking to avoid is movement.
 */
export const reducedVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
} as const;
