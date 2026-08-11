import Link from 'next/link'
import { business, phone } from '@content/site'

/**
 * There is no navigation, in the usual sense.
 *
 * A mono strip fixed to the top of the viewport, inheriting whatever colours
 * the page is currently painted: name on the left, phone on the right, both
 * plain text. No menu, no burger, no overlay — the home page is a sequence you
 * scroll, and the only thing anyone needs is the number, which is why it never
 * leaves the screen.
 *
 * 44px tall on mobile, so the number is a real tap target at the size a thumb
 * actually is.
 */

export function TopStrip() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-11 items-center justify-between gap-4 px-[max(1.25rem,4vw)] md:h-14">
      {/* Both fill the strip's full height. The number here is the primary
          call to action on a phone and it was a 21px target before this. */}
      <Link href="/" className="mono-sm flex h-full items-center truncate uppercase">
        {business.name}
      </Link>

      <a
        href={phone.href}
        className="mono-sm flex h-full shrink-0 items-center whitespace-nowrap tabular-nums"
      >
        {phone.display}
      </a>
    </header>
  )
}
