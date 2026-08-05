"use client";

import { LazyMotion, domAnimation } from "motion/react";

/**
 * Feature provider for the two forms that still animate through the library.
 *
 * It is deliberately NOT in the root layout. The shell, the home page and the
 * about page were rebuilt on CSS scroll-driven animations and transitions, so
 * the library is no longer on the critical path of a first visit — it now ships
 * only with /quote, /contact and /work, which are pages a visitor reaches after
 * the landing impression is already made.
 *
 * Layout projection and drag are not in this bundle. The gallery grid's filter
 * reflow and the mobile bottom sheet declare their own with the fuller set.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={domAnimation}>{children}</LazyMotion>;
}
