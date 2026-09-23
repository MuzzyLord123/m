'use client'

import { useEffect } from 'react'

/**
 * The light that follows the pointer across a lacquered card (`.kh-spot` in
 * globals.css). One delegated, passive listener for the whole page rather than
 * one per card, coalesced to a frame, and only where there is a real pointer —
 * on a phone it never attaches. Writes two custom properties and nothing else.
 */
export function Spotlight() {
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    let last: PointerEvent | null = null

    const paint = () => {
      frame = 0
      const event = last
      if (!event) return
      const card = (event.target as Element | null)?.closest?.('.kh-spot') as HTMLElement | null
      if (!card) return
      const box = card.getBoundingClientRect()
      card.style.setProperty('--mx', `${event.clientX - box.left}px`)
      card.style.setProperty('--my', `${event.clientY - box.top}px`)
    }

    const onMove = (event: PointerEvent) => {
      last = event
      if (!frame) frame = requestAnimationFrame(paint)
    }

    document.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      document.removeEventListener('pointermove', onMove)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return null
}
