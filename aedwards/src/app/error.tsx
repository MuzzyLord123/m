'use client'

import { PALETTE } from '@content/fields'
import { phone } from '@content/site'

/**
 * If a page throws in production, the customer still gets his phone number.
 *
 * No stack trace, no "something went wrong" shrug, no retry button that will
 * probably fail the same way. One sentence and the thing they came for.
 */

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div
      style={{ backgroundColor: PALETTE.f3.bg, color: PALETTE.f3.fg }}
      className="flex min-h-[100svh] flex-col justify-start px-[max(1.25rem,4vw)] pt-[clamp(5rem,18svh,11rem)] pb-[clamp(5.5rem,12svh,9rem)]"
    >
      <p className="mono-label">Something broke</p>
      <h1 className="t-display mt-[clamp(1.5rem,4vh,3rem)]">Sorry — this page is not loading.</h1>
      <a href={phone.href} className="t-phone mt-10 block tabular-nums">
        {phone.display}
      </a>
      <p className="mono-label mt-10">
        <button type="button" onClick={reset} className="underline underline-offset-[6px]">
          Try again
        </button>
      </p>
    </div>
  )
}
