'use client'

import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import type { FieldColour } from '@content/fields'

/**
 * The corner swatch: a 14px unrounded square of the next field's colour, with
 * that colour's plain descriptive name beside it. Never a trademarked paint
 * name — these are "stone" and "burnt red", not anybody's product.
 *
 * It fills with the next colour as the field arrives, over 300ms. That wipe is
 * the one paint-like flourish the site is allowed, and it is doing a job: it
 * tells you the page is about to change colour a beat before it does.
 *
 * The square starts clipped to nothing rather than starting as an outline,
 * because an outline would be a border and this site does not have borders.
 *
 * The observer is on the paragraph, not on the clipped square — see the note in
 * Reveal.tsx. A clipped element measures as 0% visible to IntersectionObserver
 * for as long as it is clipped, so watching it for its own reveal never fires.
 */

export function Swatch({ next }: { next: FieldColour }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })

  return (
    <p
      ref={ref}
      className="mono-sm absolute bottom-[clamp(1.25rem,4vh,2.5rem)] left-[max(1.25rem,4vw)] flex items-center gap-3"
    >
      <span aria-hidden="true" className="relative block h-[14px] w-[14px] shrink-0">
        <motion.span
          data-clip=""
          className="absolute inset-0 block"
          style={{ backgroundColor: next.bg }}
          initial={{ clipPath: 'inset(100% 0 0 0)' }}
          animate={inView ? { clipPath: 'inset(0% 0 0 0)' } : undefined}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
      </span>
      <span className="uppercase">{next.name}</span>
    </p>
  )
}
