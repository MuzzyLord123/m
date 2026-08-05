"use client";

import { LazyMotion, domAnimation } from "motion/react";

/**
 * Every animated component on this site uses the `m` primitives rather than
 * `motion`, and gets its features from here.
 *
 * The bundle is passed directly rather than through a dynamic import. A
 * dynamic import of "motion/react" was measured and made things worse: the
 * async chunk duplicates the barrel the static imports already pull in, and
 * first load grew from 162KB to 185KB.
 *
 * Layout projection and drag are NOT in this bundle. The two components that
 * need them (the gallery grid's filter reflow and the mobile bottom sheet)
 * load the fuller set themselves, so that weight lands on the gallery page
 * alone.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
