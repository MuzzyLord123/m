'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import { bestForeground } from '@content/fields'

/**
 * The repaint. This is the motion on this site; almost nothing else moves.
 *
 * As you scroll, the page's background interpolates from one field colour to
 * the next, so you never see a hard edge between two colours — the whole
 * viewport is one colour at a time and it changes underneath you. The colour is
 * written straight onto :root as --bg from a motion value subscription: no
 * React state per frame, no re-render per frame, one style write.
 *
 * It reads the fields out of the DOM rather than taking them as props, so it
 * works unchanged on the home page, on /reviews and on anything added later:
 * a field publishes data-bg and data-fg, and this finds it.
 *
 * Measured, not assumed. Fields are nominally a viewport tall, but the contact
 * field is taller and /reviews' rows are shorter, so positions come from
 * getBoundingClientRect and are re-taken on resize and after the fonts land.
 *
 * ── Two decisions worth knowing about ────────────────────────────────────────
 *
 * The foreground is DERIVED from the background rather than interpolated
 * alongside it. Every transition in this palette goes from light-on-dark to
 * dark-on-light, so crossfading both sends the text and the page through the
 * same mid-tone simultaneously and the words disappear — 1.01:1, measured,
 * halfway through every single transition. Deriving it means the text flips at
 * the crossover, always to whichever foreground is legible on the colour the
 * page actually is.
 *
 * The background is eased through the middle of each transition rather than
 * crossfaded linearly. Mid-transition is where a light field and a dark field
 * average out to mud, and mud is where contrast is at its worst — so the ramp
 * hurries through it and lingers at the two ends, where the page looks like a
 * painted wall.
 *
 * prefers-reduced-motion collapses the crossfade band to a single pixel, which
 * makes the change instant at the section boundary. Same code path, no
 * animation, no mid-tone at all.
 */

type Ramp = { input: number[]; bg: string[] }

/** How much of a viewport the crossfade takes. */
const BAND = 0.32
/** How far before a field's top edge the crossfade finishes. */
const LEAD = 0.05

/**
 * Fast through the middle, slow at the ends. Anything below 1 steepens the
 * curve where the two colours average out.
 */
function rush(t: number): number {
  const u = 2 * t - 1
  return 0.5 + 0.5 * Math.sign(u) * Math.abs(u) ** 0.6
}

export function Repaint() {
  const { scrollY } = useScroll()
  const reduce = useReducedMotion()
  const [ramp, setRamp] = useState<Ramp | null>(null)

  const measure = useCallback(() => {
    const fields = Array.from(document.querySelectorAll<HTMLElement>('[data-field]'))
    if (fields.length === 0) {
      setRamp(null)
      return
    }

    const vh = window.innerHeight
    const band = reduce ? 1 : Math.max(80, vh * BAND)

    const input: number[] = [0]
    const bg: string[] = [fields[0].dataset.bg ?? '']

    for (let i = 1; i < fields.length; i++) {
      const top = fields[i].getBoundingClientRect().top + window.scrollY
      const last = input[input.length - 1]
      const end = Math.max(top - vh * LEAD, last + 2)
      const start = Math.max(end - band, last + 1)

      // Hold the previous colour until `start`, arrive at the new one by `end`.
      input.push(start, end)
      bg.push(bg[bg.length - 1], fields[i].dataset.bg ?? '')
    }

    // useTransform needs at least two stops. A single-field page is a constant.
    if (input.length === 1) {
      input.push(1)
      bg.push(bg[0])
    }

    setRamp({ input, bg })
  }, [reduce])

  useEffect(() => {
    measure()

    let frame = 0
    const remeasure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }

    window.addEventListener('resize', remeasure)
    // Fonts landing changes how tall the display type is, which moves every
    // field below it. Re-measure once they have.
    document.fonts?.ready.then(remeasure).catch(() => {})

    const observer = new ResizeObserver(remeasure)
    observer.observe(document.documentElement)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', remeasure)
      observer.disconnect()
    }
  }, [measure])

  const bg = useTransform(scrollY, ramp?.input ?? [0, 1], ramp?.bg ?? ['#1e3a34', '#1e3a34'], {
    ease: rush,
  })
  /*
   * Both properties are computed from ONE sample of the background, in one
   * call. Deriving the foreground into its own motion value and reading the
   * two separately lets them fall a frame out of step, and a frame out of step
   * here means a foreground chosen for a colour the page is no longer painted:
   * measured at 3.33:1 where the correct pairing for that instant was 4.70:1.
   */
  const write = useCallback(() => {
    const value = bg.get()
    const root = document.documentElement.style
    root.setProperty('--bg', value)
    root.setProperty('--fg', bestForeground(value))
  }, [bg])

  // Nothing is written until the page has been measured, so the colours the
  // server rendered stay put rather than flashing to a default.
  useMotionValueEvent(bg, 'change', () => {
    if (ramp) write()
  })

  useEffect(() => {
    if (ramp) write()
  }, [ramp, write])

  return null
}
