'use client'

import type { ReactNode } from 'react'
import { useRef } from 'react'
import { motion, useInView } from 'motion/react'

/**
 * Display type enters with a clip-path reveal from the baseline up, 380ms,
 * once per field. inset(100% 0 0 0) keeps the bottom edge and grows the visible
 * rectangle upward, so the words rise off their own baseline.
 *
 * ── Why there is a wrapper element here ──────────────────────────────────────
 *
 * The observed element and the clipped element MUST be different elements.
 *
 * An element clipped with inset(100%) reports an intersectionRatio of 0 to
 * IntersectionObserver in Chrome, however much of it is on screen — its own
 * clip is applied before the intersection rectangle is worked out. So watching
 * the clipped element for "is 20% of this visible yet" is a catch-22: it is
 * hidden because it has not been revealed, and it is never revealed because
 * being hidden makes it measure as invisible. The type silently never appears.
 *
 * The outer div carries no clip, so it measures honestly. Do not collapse it.
 *
 * ── Reduced motion ───────────────────────────────────────────────────────────
 *
 * Handled in CSS rather than in a branch here: globals.css forces clip-path to
 * none on [data-clip] under prefers-reduced-motion, which leaves the opacity
 * fade on its own — the clip reveal becomes an opacity reveal, with no second
 * code path to keep in step and no hydration wobble from reading a media query
 * during render. Without JavaScript a noscript rule in the layout neutralises
 * the same attribute, and the text is simply there.
 */

export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <div ref={ref} className={className}>
      <motion.div
        data-clip=""
        initial={{ clipPath: 'inset(100% 0 0 0)', opacity: 0 }}
        animate={inView ? { clipPath: 'inset(0% 0 0 0)', opacity: 1 } : undefined}
        transition={{ duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </div>
  )
}
