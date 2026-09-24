import Image from 'next/image'
import Link from 'next/link'
import { areas } from '@content/areas'
import { business, nav, phone, region, town } from '@content/site'
import { isPlaceholder } from '@content/types'
import { CallLink, EmailLink } from './CallLink'
import { Needed } from './Needed'

/**
 * The foot of every page: the logo, the number in gold leaf, where he works, and
 * the index. A double gilt keyline along its head — the moulding at the top of a
 * signboard — and the deepest lacquer on the site beneath it.
 */
export function Footer() {
  return (
    <footer className="kh-well relative mt-px">
      <div className="kh-moulding" />

      <div className="shell py-16 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <Image
              src="/brand/kh-logo.png"
              alt={business.name}
              width={640}
              height={338}
              sizes="220px"
              className="h-auto w-[11rem] md:w-[13.5rem]"
            />
            <p className="mt-6 max-w-[34ch] text-paper-dim">
              Painting, decorating and spray finishing across {region}, by one tradesman from quote
              to clean-up.
            </p>
          </div>

          <div>
            <p className="kh-eyebrow annotation">Ring Kenny</p>
            <p className="mt-4">
              <CallLink
                className="gilt display-sm inline-block transition-opacity duration-300 hover:opacity-85"
                from="footer"
              />
            </p>
            <p className="mt-4">
              <EmailLink className="link link-hover-target" from="footer" />
            </p>
            <p className="mt-5 max-w-[40ch] text-sm text-paper-faint">
              Phone is quickest. If I am spraying I will not hear it — leave a message and I will
              ring you back.
            </p>
          </div>
        </div>

        <div className="mt-14 grid gap-10 border-t border-rule pt-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h2 className="annotation text-gold">Where I work</h2>
            <p className="mt-4 text-paper-dim">
              {isPlaceholder(town) ? (
                <>
                  Based in <Needed token="{{TOWN}}" />, working across {region}.
                </>
              ) : (
                <>
                  Based in {town}, working across {region}.
                </>
              )}
            </p>
            {areas.towns.length > 0 ? (
              <p className="mt-3 text-sm leading-relaxed text-paper-faint">
                {areas.towns.join(' · ')}
              </p>
            ) : (
              <p className="mt-3">
                <Needed token="areas.towns" />
              </p>
            )}
          </div>

          <div className="lg:col-span-2">
            <h2 className="annotation text-gold">Pages</h2>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
              {[{ href: '/', label: 'Home' }, ...nav, { href: '/leave-a-review', label: 'Leave a review' }].map(
                (item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={false}
                      className="text-[0.9375rem] text-paper-dim transition-colors duration-300 hover:text-gold-lift"
                    >
                      {item.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-baseline justify-between gap-4 border-t border-rule pt-6">
          <p className="annotation text-paper-faint">
            {business.name} · {business.trade}
          </p>
          <p className="annotation text-paper-faint">
            <span className="sr-only">Telephone </span>
            {phone.label}
          </p>
        </div>
      </div>
    </footer>
  )
}
