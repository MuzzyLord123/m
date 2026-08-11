import type { Metadata } from 'next'
import Link from 'next/link'
import { Drawn } from '@/components/Drawn'
import { GridRules } from '@/components/GridRules'
import { ReviewList, ReviewsPending, UnsourcedNote } from '@/components/Reviews'
import { Section } from '@/components/Section'
import { PageShell } from '@/components/Shell'
import { pageMetadata } from '@/lib/metadata'
import { sourcedReviews, unsourcedReviews } from '@content/reviews'

export const metadata: Metadata = pageMetadata({
  // Slug unchanged from the old site. The old title was the single word "Reviews".
  title: 'Reviews — painter & decorator in {town} | KH Painting and Decorating',
  description:
    'What customers have said about Kenny’s painting, decorating and spray work in {town} and across the north west. Quoted verbatim, with the source and a link to the original.',
  path: '/reviews',
})

/**
 * The review archive.
 *
 * Two groups: the ones with a source and a link, and the ones credited only by a
 * first name. They are kept apart deliberately and the second group is labelled for
 * what it is. Never a star graphic — there is no verified rating behind one — and
 * never an `aggregateRating` in the structured data, which would be a Google policy
 * violation and a manual-action risk on a site running paid traffic.
 */
export default function ReviewsPage() {
  const sourced = sourcedReviews()
  const unsourced = unsourcedReviews()
  const hasAny = sourced.length > 0 || unsourced.length > 0

  return (
    <PageShell>
      <Drawn className="relative py-14 md:py-20">
        <GridRules />
        <div className="relative lg:grid lg:grid-cols-12 lg:gap-x-6">
          <div className="lg:col-span-8">
            <p className="annotation-lg text-ink">Reviews</p>
            <h1 className="display mt-4">What people have said</h1>
            <p className="measure mt-8 text-lg leading-relaxed">
              Quoted exactly as written, with the name as it was published and a link to the
              original where there is one. Nothing here has been tidied up, shortened in the middle,
              or written on anybody’s behalf.
            </p>

            {/*
              There is no average rating shown, and `averageRating` is null in the content
              because there is no verified figure to state. If one is ever added it goes
              here as plain text with its source named next to it — "4.9 on Yell from 12
              reviews" — never as a row of stars, and never as structured data. See the
              note in content/reviews.ts.
            */}

            <p className="mt-8">
              <Link
                href="/leave-a-review"
                className="link link-hover-target annotation-lg text-signal"
              >
                Had work done? Leave a review <span aria-hidden="true">→</span>
              </Link>
            </p>
          </div>
        </div>
      </Drawn>

      {!hasAny ? (
        <Section number="01" title="Not transcribed yet">
          <ReviewsPending />
        </Section>
      ) : (
        <>
          {sourced.length > 0 ? (
            <Section
              number="01"
              title="From Yell and Google"
              standfirst="Published on a platform, with a date, and linked where the original is still up."
              standfirstTone="annotation"
            >
              <ReviewList reviews={sourced} />
            </Section>
          ) : null}

          {unsourced.length > 0 ? (
            <Section number="02" title="Unverified">
              <UnsourcedNote />
              <div className="mt-10">
                <ReviewList reviews={unsourced} />
              </div>
            </Section>
          ) : null}
        </>
      )}
    </PageShell>
  )
}
