import type { Metadata } from 'next'
import Link from 'next/link'
import { CallLink } from '@/components/CallLink'
import { PageShell } from '@/components/Shell'
import { ConversionOnLoad } from '@/components/ConversionOnLoad'
import { phone } from '@content/site'

export const metadata: Metadata = {
  title: 'Enquiry sent | KH Painting and Decorating',
  // Never index a thank-you page: it has no value in a search result and it would
  // pollute the Ads conversion picture if somebody landed on it directly.
  robots: { index: false, follow: false },
}

/**
 * Where the form goes when it posts without JavaScript.
 *
 * With JavaScript the form shows its confirmation inline and never comes here, so
 * exactly one of the two paths fires the conversion for any given enquiry — this
 * page on load, or the form component on a successful fetch. Never both.
 *
 * A dedicated thank-you URL is also the belt-and-braces option in Google Ads: if the
 * event-based conversion ever needs replacing, a URL-based conversion action can
 * point at /contact/sent instead. That is written up in ADS-MIGRATION.md §5.
 */
export default function EnquirySentPage() {
  return (
    <PageShell>
      <ConversionOnLoad kind="form" />

      <div className="py-20 md:py-28">
        <div className="md:grid md:grid-cols-12 md:gap-x-6">
          <div className="md:col-span-8">
            <p className="annotation-lg text-gold">Enquiry sent</p>
            <h1 className="display mt-4">That’s come through.</h1>
            <p className="measure mt-8 text-lg leading-relaxed">
              I have got it and I will come back to you, usually the same day. If it is urgent, ring
              me rather than waiting for an email.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <CallLink className="kh-btn" from="sent">
                Ring Kenny — {phone.label}
              </CallLink>
              <Link href="/" className="kh-btn-ghost">
                Back to the start
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
