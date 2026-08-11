import type { Metadata } from 'next'
import Link from 'next/link'
import { CallLink, EmailLink } from '@/components/CallLink'
import { phone } from '@content/site'

export const metadata: Metadata = {
  title: 'That didn’t send | KH Painting and Decorating',
  robots: { index: false, follow: false },
}

/**
 * The enquiry was valid but the email did not go out.
 *
 * It says so plainly rather than showing a tick, because a form that reports success
 * for an email that never left is the worst possible failure on a site where every
 * visitor cost money to acquire — and it is the kind that goes unnoticed for months.
 *
 * The enquiry itself is written to the server log in full by deliver.ts, so it can
 * still be recovered and rung back. No conversion is fired here.
 */
export default function ProblemPage() {
  return (
    <div className="mx-auto max-w-[78rem] px-5 md:px-8">
      <div className="py-20 md:py-28">
        <div className="md:grid md:grid-cols-12 md:gap-x-6">
          <div className="md:col-span-8">
            <p className="annotation-lg text-gold">Not sent</p>
            <h1 className="display mt-4">That didn’t send</h1>
            <p className="measure mt-8 text-lg leading-relaxed">
              Something went wrong at my end rather than yours, and I would rather tell you than
              show you a tick for a message that never arrived.
            </p>
            <p className="measure mt-5 text-paper-dim">
              Ring me or send an email and I will pick it up straight away.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <CallLink className="kh-btn" from="problem">
                Ring Kenny — {phone.label}
              </CallLink>
              <EmailLink className="kh-btn-ghost" from="problem">
                Send an email instead
              </EmailLink>
            </div>

            <p className="mt-10">
              <Link href="/contact" className="link link-hover-target annotation-lg text-gold">
                Back to the form <span aria-hidden="true">→</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
