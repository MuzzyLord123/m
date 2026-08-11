'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { business, nav, phone } from '@content/site'
import { CallLink } from './CallLink'
import { PhoneIcon } from './icons'

/**
 * The header.
 *
 * A wordmark, the pages, and the number as a gold button. That is what a
 * tradesman's site needs and it is all this does. The previous version dressed it
 * as a "signwritten fascia board" with a gold shadow edge, which was a lot of
 * concept for a strip 120px tall.
 *
 * Sticky, because on a long page the number should never be more than a glance
 * away — and it is a real button rather than a line of text, because that is the
 * conversion on a decorator's site.
 *
 * Still no burger menu. Eight links fit on one row on a laptop and two on a
 * phone, and a menu you have to open is a menu most paid visitors never open.
 */
export function Header() {
  const pathname = usePathname()

  return (
    <header className="kh-panel sticky top-0 z-40 border-b border-rule">
      <div className="mx-auto max-w-[78rem] px-5 md:px-8">
        <div className="flex items-center justify-between gap-6 py-3.5">
          {/* Wordmark. "KH" in gold, the trade beneath — two lines of type rather
              than a logo, because there is no logo and a stock crest on a
              one-man decorator's site fools nobody. */}
          <Link href="/" className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-[--radius-chip] border border-gold-deep bg-well"
            >
              <span className="display-xs text-gold">KH</span>
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[0.9375rem] font-semibold tracking-[0.01em] text-paper">
                Painting and Decorating
              </span>
              <span className="annotation mt-0.5 text-paper-faint">{business.trade}</span>
            </span>
          </Link>

          <CallLink className="kh-btn shrink-0 gap-2 px-4 md:px-6" from="header">
            <PhoneIcon className="size-4" />
            <span className="hidden sm:inline">{phone.label}</span>
            <span className="sm:hidden">Call</span>
          </CallLink>
        </div>
      </div>

      <div className="border-t border-rule">
        <nav aria-label="Pages" className="mx-auto max-w-[78rem] px-5 md:px-8">
          <ul className="-mx-2.5 flex flex-wrap">
            {nav.map((item) => {
              const active = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    // No prefetch on the persistent nav. Every one of these links
                    // is in the viewport on load, so Next would fetch all eight
                    // pages speculatively — about 60KB competing for bandwidth in
                    // the window that decides LCP, to speed up a navigation
                    // nobody has asked for yet. On paid traffic that is the wrong
                    // way round.
                    prefetch={false}
                    aria-current={active ? 'page' : undefined}
                    className={`annotation block px-2.5 py-3 transition-colors duration-150 ${
                      active
                        ? // Inset shadow rather than a border, so nothing reflows.
                          'text-gold shadow-[inset_0_-2px_0_0_var(--color-gold)]'
                        : 'hover:text-paper'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </header>
  )
}
