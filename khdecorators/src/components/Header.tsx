'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { business, nav, phone } from '@content/site'
import { CallLink } from './CallLink'
import { PhoneIcon } from './icons'

/**
 * The header: Kenny's own logo, every page, and the number as a gold board.
 *
 * It sits transparent over the hero photograph and the lacquer comes up under
 * it as the page scrolls (a scroll timeline in globals.css — no listener). A
 * gilt rule draws itself out from the centre along its foot at the same time.
 *
 * NO BURGER MENU, and no bar pinned to the bottom of the phone — that belongs
 * to another site in this portfolio, and a menu you have to open is a menu most
 * paid visitors never open. On a phone every page sits in one row beneath the
 * logo that swipes sideways, fading at the edge so it reads as more-to-the-side
 * rather than as cut off. On a laptop they fit on one line.
 *
 * The number is in the header at every width because a decorator's site
 * converts on the phone more than on the form.
 */
export function Header() {
  const pathname = usePathname()

  return (
    <header className="kh-header sticky top-0 z-40">
      <div className="shell flex h-[4.25rem] items-center justify-between gap-5 xl:h-[5rem]">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label={`${business.name}, home`}>
          {/* The mark alone on a phone, where the strapline inside the full
              logo would be six pixels tall; the full logo from a laptop up. */}
          <Image
            src="/brand/kh-mark.png"
            alt=""
            width={526}
            height={200}
            loading="eager"
            sizes="92px"
            className="h-9 w-auto xl:hidden"
          />
          <span className="annotation leading-tight text-paper xl:hidden">
            Painting &amp;
            <br />
            Decorating
          </span>
          <Image
            src="/brand/kh-logo.png"
            alt=""
            width={640}
            height={338}
            loading="eager"
            sizes="112px"
            className="hidden h-[3.6rem] w-auto xl:block"
          />
        </Link>

        <nav aria-label="Pages" className="hidden xl:block">
          <ul className="flex items-center">
            {nav.map((item) => (
              <NavItem key={item.href} href={item.href} label={item.label} active={pathname === item.href} />
            ))}
          </ul>
        </nav>

        <CallLink className="kh-btn min-h-11 shrink-0 px-4 xl:min-h-12 xl:px-5" from="header">
          <PhoneIcon className="size-4" />
          <span className="hidden sm:inline xl:hidden 2xl:inline">{phone.label}</span>
          <span className="sm:hidden xl:inline 2xl:hidden">Call</span>
        </CallLink>
      </div>

      {/* The page strip, phone and tablet. */}
      <nav aria-label="Pages" className="xl:hidden">
        <ul className="kh-strip flex gap-1 overflow-x-auto px-[calc(var(--gutter)-0.75rem)] pb-2">
          {nav.map((item) => (
            <NavItem key={item.href} href={item.href} label={item.label} active={pathname === item.href} />
          ))}
          <li aria-hidden="true" className="w-6 shrink-0" />
        </ul>
      </nav>

      <div className="kh-header-rule h-px bg-linear-to-r from-transparent via-gold-deep to-transparent" />
    </header>
  )
}

function NavItem({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <li className="shrink-0">
      <Link
        href={href}
        // No prefetch on the persistent nav: every link is in the viewport on
        // load, and fetching all eight pages speculatively competes with the
        // hero photograph for bandwidth in the window that decides LCP.
        prefetch={false}
        aria-current={active ? 'page' : undefined}
        className={`group relative block px-3 py-2.5 annotation transition-colors duration-300 xl:px-2.5 xl:tracking-[0.15em] xl:[font-stretch:112%] 2xl:px-3.5 ${
          active ? 'text-gold' : 'text-paper-dim hover:text-paper'
        }`}
      >
        {label}
        {/* The underline: a gilt hairline that draws out from the centre. */}
        <span
          aria-hidden="true"
          className={`absolute inset-x-3 bottom-1 h-px origin-center bg-gold transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${
            active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
          }`}
        />
      </Link>
    </li>
  )
}
