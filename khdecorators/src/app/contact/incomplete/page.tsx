import type { Metadata } from 'next'
import Link from 'next/link'
import { CallLink } from '@/components/CallLink'
import { phone } from '@content/site'

export const metadata: Metadata = {
  title: 'Something’s missing | KH Painting and Decorating',
  robots: { index: false, follow: false },
}

/**
 * Reached only by a visitor whose form posted without JavaScript and left out a
 * required field.
 *
 * It exists as its own static page so /contact can stay prerendered — see the note in
 * the route handler. No conversion is fired here: nothing was sent.
 */
export default function IncompletePage() {
  return (
    <div className="mx-auto max-w-[78rem] px-5 md:px-8">
      <div className="py-20 md:py-28">
        <div className="md:grid md:grid-cols-12 md:gap-x-6">
          <div className="md:col-span-8">
            <p className="annotation-lg text-gold">Not sent</p>
            <h1 className="display mt-4">I need one more thing</h1>
            <p className="measure mt-8 text-lg leading-relaxed">
              To come back to you I need a name and either a phone number or an email address. One
              of those was missing, so nothing has been sent.
            </p>
            <p className="measure mt-5 text-paper-dim">
              Sorry — you will have to type it again. Or skip the form altogether and ring me, which
              is quicker anyway.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <CallLink className="kh-btn" from="incomplete">
                Ring Kenny — {phone.label}
              </CallLink>
              <Link href="/contact" className="kh-btn-ghost">
                Back to the form
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
