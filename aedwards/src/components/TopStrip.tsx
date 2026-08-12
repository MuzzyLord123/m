import Link from 'next/link'
import { business, phone } from '@content/site'
import { Menu } from './Menu'

/**
 * A mono strip fixed to the top of the viewport, inheriting whatever colours
 * the page is currently painted: name on the left, then the phone number, then
 * the menu. Plain text and one small hard-edged mark, nothing else.
 *
 * It carried no navigation at all until the site grew from three pages to
 * eight — at which point a service page had no route to the reviews, which are
 * the entire argument. The menu is in Menu.tsx and it is built out of this
 * site's own palette rather than bolted on. The number stays where it was, to
 * the left of it, because it is still the thing most people came for.
 *
 * 44px tall on mobile, and every control in it fills that full height, so they
 * are real tap targets at the size a thumb actually is.
 */

export function TopStrip() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-11 items-center gap-4 px-[max(1.25rem,4vw)] md:h-14">
      <Link href="/" className="mono-sm flex h-full items-center truncate uppercase">
        {business.name}
      </Link>

      <a
        data-strip-phone
        href={phone.href}
        className="mono-sm ml-auto flex h-full shrink-0 items-center whitespace-nowrap tabular-nums"
      >
        {phone.display}
      </a>

      <Menu />
    </header>
  )
}
