import type { ReactNode } from 'react'

/**
 * The one parallax on the site: the hero photo layer drifts against the scroll.
 * Nothing else moves on load.
 *
 * Driven by a scroll-linked CSS animation, so it costs no JavaScript and never
 * runs a scroll handler. Browsers without animation-timeline simply hold the
 * layer still, which is a perfectly good hero. Off under
 * prefers-reduced-motion.
 */
export function HeroParallax({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="hero-drift absolute inset-x-0 top-0 h-[116%]">{children}</div>
    </div>
  )
}
