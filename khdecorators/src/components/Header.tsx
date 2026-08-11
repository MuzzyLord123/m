'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { business, nav, phone } from '@content/site'
import { CallLink } from './CallLink'

/**
 * The header. No burger menu.
 *
 * A menu you have to open is a menu most paid visitors never open, and this is a
 * ten-page site whose index fits on two lines. So every page is listed, always
 * visible, wrapping onto a second row on a phone. The current page is in signal
 * blue; there is no underline indicator and nothing slides.
 *
 * The number is in the header on every page because a decorator's site converts on
 * the phone more than on the form. It is not a fixed bottom bar — that belongs to
 * another site in this portfolio, and a bar pinned over the bottom of a phone screen
 * covers the content it is trying to sell.
 */
export function Header() {
  const pathname = usePathname()

  return (
    <header className="border-b border-rule bg-paper">
      <div className="mx-auto max-w-[90rem] px-5 md:px-8">
        {/* Row one: who, and how to ring. */}
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 py-5">
          <Link href="/" className="group">
            <span className="text-lg font-medium tracking-[-0.01em]">{business.shortName}</span>
            <span className="annotation ml-3 hidden sm:inline">{business.trade}</span>
          </Link>

          <p className="flex items-baseline gap-3">
            <span className="annotation">Ring Kenny</span>
            <CallLink
              className="text-lg font-medium tracking-[-0.01em] text-signal underline decoration-1 underline-offset-4 hover:decoration-2"
              from="header"
            >
              {phone.label}
            </CallLink>
          </p>
        </div>

        {/* Row two: the index. */}
        <nav aria-label="Pages">
          <ul className="-mx-2 flex flex-wrap pb-3">
            {nav.map((item) => {
              const active = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    // No prefetch on the persistent nav.
                    //
                    // Every one of these links is in the viewport the moment the page
                    // loads, so Next fetches all eight pages speculatively before the
                    // visitor has done anything — about 60KB competing with the font for
                    // bandwidth during the window that decides LCP. Measured on mobile
                    // 4G that was worth roughly half a second on the landing page, in
                    // exchange for making a navigation nobody has asked for yet slightly
                    // quicker. On paid traffic that is the wrong way round. The pages are
                    // static and tiny; they load fast enough when actually clicked.
                    prefetch={false}
                    aria-current={active ? 'page' : undefined}
                    className={`annotation block px-2 py-1.5 transition-colors duration-150 ${
                      active ? 'text-signal' : 'hover:text-ink'
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
