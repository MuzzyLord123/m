'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * The only piece of JavaScript driving motion on this site.
 *
 * It sets `data-drawn="true"` on itself once it has entered the viewport, and the
 * CSS in globals.css does the rest — grid rules draw downward, callout leader
 * lines retract their dash offset, labels fade in as the line lands. Once, then
 * the observer disconnects.
 *
 * No animation library. §7 asks for four specific movements and every one of them
 * is a CSS transition on a 1px line; importing a runtime to do that would cost
 * more kilobytes than the whole of the rest of the page, and this build is judged
 * on cost per enquiry.
 *
 * `prefers-reduced-motion` is handled entirely in CSS: the transitions are
 * removed and the end state applies immediately. Nothing is hidden behind an
 * animation that never runs, so a reduced-motion visitor sees the finished
 * drawing rather than an empty frame.
 */
export function Drawn({
  /** Fraction of the block that must be visible. §7 asks for 40% on photographs. */
  threshold = 0.15,
  className,
  children,
  id,
}: {
  threshold?: number
  className?: string
  children: ReactNode
  id?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [drawn, setDrawn] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || drawn) return

    // No observer (old browser, or a crawler that runs scripts): show everything.
    if (typeof IntersectionObserver === 'undefined') {
      setDrawn(true)
      return
    }

    // A block taller than the viewport can never reach 40% visibility, so it would
    // sit undrawn forever. Tall blocks get a low threshold instead.
    const effective = el.offsetHeight > window.innerHeight * 0.7 ? 0.05 : threshold

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setDrawn(true)
            observer.disconnect()
          }
        }
      },
      { threshold: effective },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, drawn])

  return (
    <div ref={ref} id={id} data-drawn={drawn} className={className}>
      {children}
    </div>
  )
}
