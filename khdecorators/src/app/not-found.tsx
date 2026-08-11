import Link from 'next/link'
import { CallLink } from '@/components/CallLink'
import { PageShell } from '@/components/Shell'
import { nav, phone } from '@content/site'

/**
 * 404.
 *
 * It lists every page rather than apologising, because the likeliest visitor here is
 * somebody following an old Google Sites URL that never made it into the redirect map
 * — and the second likeliest is a paid click on a stale ad. Either way the useful
 * response is the index and the phone number, not a joke.
 *
 * If this page is getting traffic after launch, that is a redirect to add. LAUNCH.md
 * §2 says to check it in Search Console at the two-week mark.
 */
export default function NotFound() {
  return (
    <PageShell>
      <div className="py-20 md:py-28">
        <div className="md:grid md:grid-cols-12 md:gap-x-6">
          <div className="md:col-span-8">
            <p className="annotation-lg text-gold">404</p>
            <h1 className="display mt-4">That page isn’t here</h1>
            <p className="measure mt-8 text-lg leading-relaxed">
              It may have moved when the site was rebuilt. Everything is listed below, or ring me
              and I will tell you what you need to know faster than you will find it.
            </p>

            <div className="mt-10">
              <CallLink className="kh-btn" from="404">
                Ring Kenny — {phone.label}
              </CallLink>
            </div>

            <ul className="mt-12 grid border-t border-rule sm:grid-cols-2 sm:gap-x-10">
              <li className="border-b border-rule py-3">
                <Link href="/" className="link link-hover-target">
                  Home
                </Link>
              </li>
              {nav.map((item) => (
                <li key={item.href} className="border-b border-rule py-3">
                  <Link href={item.href} className="link link-hover-target">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
