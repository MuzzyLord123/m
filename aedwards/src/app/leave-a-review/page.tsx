import type { Metadata } from 'next'
import { PALETTE } from '@content/fields'
import { leaveAReview } from '@content/copy'
import { googleProfileUrl, googleReviewUrl, yellListingUrl } from '@content/site'
import { Field } from '@/components/Field'
import { Ground } from '@/components/Ground'
import { Pending } from '@/components/Pending'
import { Reveal } from '@/components/Reveal'

/**
 * Something Andy can text to a customer. Two links, twenty words, nothing else.
 *
 * This is the first-party path forward: 34 reviews is a decade's worth of luck
 * and word of mouth, and the way that becomes 60 is a link he can send from his
 * phone on the last day of a job. Reviews he gathers on his own site later go
 * into the same model with source: 'website' and a permission flag.
 *
 * The Google link only appears once there is a Google profile to point at. A
 * dead link here is worse than one link.
 */

export const metadata: Metadata = {
  title: leaveAReview.title,
  description: 'Leave a review for A Edwards Decorating on Yell or Google.',
  alternates: { canonical: '/leave-a-review' },
  robots: { index: false, follow: true },
}

export default function LeaveAReviewPage() {
  const google = googleReviewUrl ?? googleProfileUrl

  return (
    <>
      <Ground colour={PALETTE.f2} />
      <Field colour={PALETTE.f2} next={null} label={leaveAReview.title} snap={false}>
        <Reveal>
          <h1 className="t-display max-w-[14ch]">{leaveAReview.headline}</h1>
        </Reveal>
        <p className="mono mt-[clamp(2rem,5vh,3rem)] max-w-[46ch]">{leaveAReview.line}</p>

        <ul className="mt-[clamp(2.5rem,7vh,4rem)] flex flex-col gap-5">
          <li>
            <a
              href={yellListingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mono-label inline-flex items-center gap-3 underline underline-offset-[6px]"
            >
              Leave a review on Yell
              <span aria-hidden="true">→</span>
            </a>
          </li>
          {google ? (
            <li>
              <a
                href={google}
                target="_blank"
                rel="noopener noreferrer"
                className="mono-label inline-flex items-center gap-3 underline underline-offset-[6px]"
              >
                Leave a review on Google
                <span aria-hidden="true">→</span>
              </a>
            </li>
          ) : null}
        </ul>

        <Pending id="google-profile" />
      </Field>
    </>
  )
}
