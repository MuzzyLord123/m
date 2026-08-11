import Link from 'next/link';
import { nav, phone } from '@content/site';
import { Wordmark } from '@/components/Wordmark';

/**
 * The header.
 *
 * On a narrow screen the menu is a native <details>: no JavaScript, works
 * before hydration, keyboard-operable without anyone having to implement that.
 * The toggle is the word "Menu" — there are no icons on this site, so there is
 * no hamburger.
 *
 * Wide, the wordmark sits astride the seam like everything else, with the
 * navigation running outward from it on both sides.
 *
 * Only one of the two layouts is ever in the accessibility tree, because the
 * other is display:none — so both can safely be the "Main" landmark.
 *
 * The phone number is a link from the top of every page, at every size. It is
 * what most visitors came for.
 */

const HALF = Math.ceil(nav.length / 2);

export function Nav() {
  return (
    // z-10, deliberately below the seam's z-30: the centre line runs over the
    // header too, straight through the gap in the wordmark. It is the site's
    // spine and nothing interrupts it.
    <header data-tone="paper" className="relative z-10 border-b border-hair">
      {/* ------------------------------------------------------------ narrow */}
      <div className="md:hidden">
        <div className="mx-auto flex max-w-[104rem] items-center justify-between gap-4 px-gutter py-4">
          <Link href="/" aria-label="Ego Decorators — home">
            <Wordmark size="small" />
          </Link>
          <a href={phone.href} className="link-seam meta">
            {phone.display}
          </a>
        </div>

        <details className="border-t border-hair">
          <summary className="meta cursor-pointer list-none px-gutter py-3">Menu</summary>
          <nav aria-label="Main">
            <ul className="px-gutter pb-4">
              {nav.map((item) => (
                <li key={item.href} className="border-t border-hair py-2">
                  <Link href={item.href} className="link-seam">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="border-t border-hair py-2">
                <Link href="/contact" className="link-seam">
                  Get a price
                </Link>
              </li>
            </ul>
          </nav>
        </details>
      </div>

      {/* -------------------------------------------------------------- wide */}
      <div className="mx-auto hidden max-w-[104rem] px-gutter py-4 md:block">
        <div className="split items-center">
          <div data-seam-side="right" className="flex items-center justify-end gap-6">
            <nav aria-label="Main">
              <ul className="flex items-center gap-6">
                {nav.slice(0, HALF).map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="link-seam meta">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <Link
              href="/"
              aria-label="Ego Decorators — home"
              className="shrink-0 font-display text-[clamp(1.5rem,2.4vw,2rem)] font-extrabold leading-none tracking-[-0.02em]"
            >
              <span aria-hidden="true">EG</span>
            </Link>
          </div>

          <div data-seam-side="left" className="flex items-center gap-6">
            {/* The other half of the wordmark. Not a second link — one logo, one
                link, and no focusable element hidden from assistive software. */}
            <span
              aria-hidden="true"
              className="shrink-0 font-display text-[clamp(1.5rem,2.4vw,2rem)] font-extrabold leading-none tracking-[-0.02em]"
            >
              O
            </span>
            <ul className="flex items-center gap-6">
              {nav.slice(HALF).map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="link-seam meta">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a href={phone.href} className="link-seam meta">
                  {phone.display}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}
