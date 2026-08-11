import type { ReactNode } from 'react'
import type { FieldColour } from '@content/fields'
import { Swatch } from './Swatch'

/**
 * Every section on the site is one of these. Build it once, properly.
 *
 * A field is a full-viewport block of one colour with one idea in it. It does
 * not paint its own background: the page's colour lives in --bg on :root and
 * Repaint interpolates it on scroll, so a field publishes its colours as data
 * attributes and lets the page do the painting. That is what keeps a section
 * and the page from ever disagreeing about what colour they are.
 *
 * The corner swatch shows the colour of whatever is coming next.
 */

export type FieldProps = {
  colour: FieldColour
  /** The field after this one. null on the last field — the sequence ends. */
  next: FieldColour | null
  /** Small mono label at the top of the block. */
  label?: string
  id?: string
  /**
   * Set on any field that can grow taller than the viewport — the contact
   * field, mainly, and more so once the enquiry form is switched on.
   *
   * It does NOT remove this field's snap point. Removing it was the first
   * attempt and it was worse than the problem: under mandatory snap a field
   * with `scroll-snap-align: none` has no snap position at all, so the browser
   * rests on the previous field instead and you cannot reach this one. On a
   * 390x844 phone that left the bottom of every service page — the phone
   * number at its largest, and the links to the other four pages —
   * unreachable, with scroll stopping at 3376 of 4220.
   *
   * Instead it steps the whole page down to proximity snapping on mobile.
   * Proximity still snaps when you land near a boundary, and it can never
   * strand anything, because every resting position is legal.
   */
  tall?: boolean
  /**
   * 'screen' is the home page: one idea, one viewport. 'row' is the archive at
   * /reviews, where the fields are shorter so the page keeps moving.
   */
  height?: 'screen' | 'row'
  children: ReactNode
}

export function Field({
  colour,
  next,
  label,
  id,
  tall = false,
  height = 'screen',
  children,
}: FieldProps) {
  return (
    <>
      {/* Emitted by the field that knows it might overflow, so a page carrying
          one opts itself down to proximity snapping without every page having
          to declare it. Identical across fields, so it collapses to one rule. */}
      {tall ? (
        <style
          dangerouslySetInnerHTML={{
            __html: '@media (max-width:767px){html{scroll-snap-type:y proximity}}',
          }}
        />
      ) : null}

      <section
        id={id}
        data-field=""
        data-bg={colour.bg}
        data-fg={colour.fg}
        // Every field keeps a snap point. See the note on `tall` above.
        style={{ scrollSnapAlign: 'start' }}
        className={
          height === 'screen'
            ? 'relative flex min-h-[100svh] flex-col justify-start px-[max(1.25rem,4vw)] pt-[clamp(5rem,18svh,11rem)] pb-[clamp(5.5rem,12svh,9rem)]'
            : 'relative flex min-h-[68svh] flex-col justify-center px-[max(1.25rem,4vw)] pt-[clamp(4.5rem,10svh,7rem)] pb-[clamp(5.5rem,10svh,7rem)]'
        }
      >
        <div className="field-grid w-full">
          <div className="field-col">
            {label ? <p className="mono-label mb-[clamp(1.5rem,4vh,3rem)]">{label}</p> : null}
            {children}
          </div>
        </div>

        {next ? <Swatch next={next} /> : null}
      </section>
    </>
  )
}
