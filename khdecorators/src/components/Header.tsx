'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { business, nav, phone } from '@content/site'
import { CallLink } from './CallLink'

/**
 * The header, treated as a signwritten fascia board: a raised satin plank on the
 * matt wall, edged along its bottom in gold. That edge is `--shadow-fascia` — a
 * hard 1px gold line over a 1px shadow, zero blur, so it costs nothing to repaint
 * while the page scrolls beneath it.
 *
 * No burger menu. A menu you have to open is a menu most paid visitors never open,
 * and this is a ten-page site whose index fits on two lines. Every page is listed,
 * always visible, wrapping onto a second row on a phone.
 *
 * The number is in the header on every page at every width, never behind a
 * disclosure. A decorator's site converts on the phone more than on the form, and
 * on paid traffic the number is the conversion. It is not a fixed bottom bar
 * either — that belongs to another site in this portfolio, and a bar pinned over
 * the bottom of a phone screen covers the content it is trying to sell.
 */
export function Header() {
  const pathname = usePathname()

  return (
    <header className="kh-panel relative z-40 shadow-fascia">
      <div className="mx-auto max-w-[90rem] px-5 md:px-8">
        {/* Row one: whose business this is, and how to ring him. */}
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 py-5">
          <Link href="/" className="group flex items-baseline gap-3">
            {/*
              A gold "KH" set in the display face, with the full trading name beside
              it. Two words of type rather than a logo: there is no logo, and a
              fabricated crest on a one-man decorator's site reads as a stock badge.
            */}
            <span className="display-xs text-gold">KH</span>
            <span className="flex flex-col leading-tight">
              <span className="text-[0.9375rem] font-medium tracking-[0.01em] text-paper">
                Painting and Decorating
              </span>
              <span className="annotation mt-0.5 text-paper-faint">{business.trade}</span>
            </span>
          </Link>

          <p className="flex items-baseline gap-3">
            <span className="annotation hidden sm:inline">Ring Kenny</span>
            <CallLink
              className="display-xs text-gold underline decoration-1 underline-offset-4 transition-colors duration-150 hover:text-gold-lift hover:decoration-2"
              from="header"
            >
              {phone.label}
            </CallLink>
          </p>
        </div>

        {/* Row two: the index, as a plain always-visible list. */}
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
                    // visitor has done anything — about 60KB competing with the fonts
                    // for bandwidth in the window that decides LCP. Measured on mobile
                    // 4G that was worth roughly half a second on the landing page, in
                    // exchange for making a navigation nobody has asked for yet
                    // slightly quicker. On paid traffic that is the wrong way round.
                    prefetch={false}
                    aria-current={active ? 'page' : undefined}
                    className={`annotation block px-2 py-2 transition-colors duration-150 ${
                      active
                        ? // The current page carries a gold underline drawn with an
                          // inset shadow rather than a border, so nothing reflows.
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
