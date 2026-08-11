import Link from 'next/link'
import { areas } from '@content/areas'
import { business, nav, phone, region, town } from '@content/site'
import { isPlaceholder } from '@content/types'
import { CallLink, EmailLink } from './CallLink'
import { Needed } from './Needed'

/**
 * The foot of every page: how to get hold of him, where he works, and the index.
 *
 * Laid out as the last block of the specification rather than as a separate visual
 * region — same paper, same rules, no dark band. Dark full-bleed sections belong to
 * another site in this portfolio.
 */
export function Footer() {
  return (
    <footer className="kh-well border-t-2 border-gold-deep">
      <div className="kh-chalk" />
      <div className="mx-auto max-w-[90rem] px-5 py-12 md:px-8 md:py-16">
        <div className="grid gap-10 md:grid-cols-12 md:gap-6">
          {/* Contact */}
          <div className="md:col-span-4">
            <h2 className="annotation-lg text-gold">Get hold of me</h2>
            <div className="mt-5 space-y-3">
              <p>
                <CallLink
                  className="display-xs text-gold underline decoration-1 underline-offset-4 transition-colors duration-150 hover:text-gold-lift hover:decoration-2"
                  from="footer"
                />
              </p>
              <p>
                <EmailLink className="link link-hover-target" from="footer" />
              </p>
            </div>
            <p className="annotation mt-6 max-w-[30ch] leading-relaxed">
              Phone is quickest. If I am spraying I will not hear it — leave a message and I will
              ring back.
            </p>
          </div>

          {/* Where */}
          <div className="md:col-span-4">
            <h2 className="annotation-lg text-gold">Where I work</h2>
            <p className="mt-5">
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
              <p className="annotation mt-4 leading-relaxed">{areas.towns.join(' · ')}</p>
            ) : (
              <p className="mt-4">
                <Needed token="areas.towns" />
              </p>
            )}
          </div>

          {/* Index */}
          <div className="md:col-span-4">
            <h2 className="annotation-lg text-gold">Pages</h2>
            <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2">
              <li>
                <Link href="/" prefetch={false} className="annotation hover:text-paper">
                  Home
                </Link>
              </li>
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} prefetch={false} className="annotation hover:text-paper">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/leave-a-review"
                  prefetch={false}
                  className="annotation hover:text-paper"
                >
                  Leave a review
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-baseline justify-between gap-4 border-t border-rule pt-6">
          <p className="annotation">
            {business.name} — {business.trade}
          </p>
          <p className="annotation">
            <span className="sr-only">Telephone </span>
            {phone.label}
          </p>
        </div>
      </div>
    </footer>
  )
}
