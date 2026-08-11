import type { Metadata } from 'next'
import { CallLink, EmailLink } from '@/components/CallLink'
import { Drawn } from '@/components/Drawn'
import { GridRules } from '@/components/GridRules'
import { Needed } from '@/components/Needed'
import { Section } from '@/components/Section'
import { PageShell } from '@/components/Shell'
import { pageMetadata } from '@/lib/metadata'
import { leaveAReview } from '@content/reviews'
import { isPlaceholder } from '@content/types'

export const metadata: Metadata = pageMetadata({
  title: 'Leave a review — decorating in {town} | KH Painting and Decorating',
  description:
    'Had painting, decorating or spray work done by Kenny in {town}? Links to leave a review on Google or Yell.',
  path: '/leave-a-review',
})

/**
 * Somewhere Kenny can text a customer from the van.
 *
 * That is the entire purpose of the page, so it is short, the links are large, and
 * there is nothing else on it. A link that has to be found on a contact page under a
 * heading is a link that never gets used.
 *
 * A destination still holding a placeholder renders as a marked gap rather than as a
 * button, because a review button that goes nowhere costs the review AND the goodwill
 * of the customer who tried to leave it.
 */
export default function LeaveAReviewPage() {
  return (
    <PageShell>
      <Drawn className="relative py-14 md:py-20">
        <GridRules />
        <div className="relative md:grid md:grid-cols-12 md:gap-x-6">
          <div className="md:col-span-8">
            <p className="annotation-lg text-ink">Reviews</p>
            <h1 className="display mt-4">Leave a review</h1>
            <p className="measure mt-8 text-lg leading-relaxed">{leaveAReview.lede}</p>
            <p className="measure mt-5 text-muted">{leaveAReview.ask}</p>
          </div>
        </div>
      </Drawn>

      <Section number="01" title="Where to leave it">
        <ul className="max-w-[46rem] border-t border-rule">
          {leaveAReview.places.map((place) => (
            <li key={place.name} className="border-b border-rule py-6">
              {isPlaceholder(place.url) ? (
                <div>
                  <p className="annotation-lg text-ink">{place.name}</p>
                  <p className="mt-3 text-muted">{place.note}</p>
                  <div className="mt-4">
                    <Needed
                      token={
                        place.name === 'Google'
                          ? '{{GOOGLE_BUSINESS_PROFILE_URL}}'
                          : '{{YELL_LISTING_URL}}'
                      }
                      inline={false}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
                  <div>
                    <a
                      href={place.url}
                      rel="noopener"
                      target="_blank"
                      className="text-xl font-medium tracking-[-0.01em] text-signal underline decoration-1 underline-offset-4 hover:decoration-2"
                    >
                      Review me on {place.name}
                      <span aria-hidden="true"> ↗</span>
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                    <p className="mt-3 max-w-[46ch] text-muted">{place.note}</p>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>

        <p className="measure mt-10 text-muted">{leaveAReview.alternative}</p>

        <div className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-3">
          <p className="annotation">
            Text or ring{' '}
            <CallLink className="link link-hover-target text-signal" from="leave-a-review" />
          </p>
          <p className="annotation">
            Email <EmailLink className="link link-hover-target text-signal" from="leave-a-review" />
          </p>
        </div>
      </Section>
    </PageShell>
  )
}
