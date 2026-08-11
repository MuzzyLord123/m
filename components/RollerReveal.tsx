'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Roller wipe. A block of the section's swatch colour covers the content, then
 * pulls back to the right as the section comes into view. 420ms, once only.
 *
 * An IntersectionObserver and a CSS transition — about a line of JavaScript
 * each way. The animation library is reserved for the before/after handle,
 * where a MotionValue genuinely earns its keep; putting it on the critical path
 * for a one-shot wipe would cost more than the wipe is worth.
 *
 * scaleX from a right-hand origin rather than a translate, so nothing ever
 * sits outside the box and no horizontal scrollbar can appear.
 *
 * prefers-reduced-motion: the wipe becomes an opacity change, instantly.
 * No JavaScript at all: the <noscript> rule in the layout removes the covers.
 */
export function RollerReveal({
  colour,
  children,
  className = '',
  delay = 0,
}: {
  colour: string
  children: ReactNode
  className?: string
  /** Seconds, to stagger a pair of reveals. */
  delay?: number
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        el.dataset.revealed = 'true'
        observer.disconnect()
      },
      { threshold: 0.2 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`roller ${className}`}>
      {children}
      <span
        data-roller
        aria-hidden
        className="roller__cover"
        style={{ backgroundColor: colour, transitionDelay: delay ? `${delay}s` : undefined }}
      />
    </div>
  )
}
