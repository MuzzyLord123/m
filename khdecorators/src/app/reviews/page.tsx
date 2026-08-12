import type { Metadata } from 'next'
import Link from 'next/link'
import { Band } from '@/components/Band'
import { Drawn } from '@/components/Drawn'
import { ReviewList, ReviewsPending, UnsourcedNote } from '@/components/Reviews'
import { ArrowIcon } from '@/components/icons'
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
    <>
      <section className="relative">
        <Drawn className="mx-auto max-w-[78rem] px-5 pt-14 pb-14 md:px-8 md:pt-20 md:pb-16">
          <div className="kh-reveal mx-auto max-w-[46rem] text-center">
            <p className="annotation text-gold">Reviews</p>
            <h1 className="display mt-4">What people have said</h1>
            <p className="mt-6 text-lg leading-relaxed text-paper-dim">
              Quoted exactly as written, with the name as it was published and a link to the
              original where there is one. Nothing here has been tidied up, shortened in the middle,
              or written on anybody’s behalf.
            </p>
            <p className="mt-8">
              <Link href="/leave-a-review" className="kh-btn-ghost inline-flex gap-2">
                Had work done? Leave a review
                <ArrowIcon className="size-4" />
              </Link>
            </p>
          </div>
        </Drawn>
      </section>

      {!hasAny ? (
        <Band tone="well" divider>
          <ReviewsPending />
        </Band>
      ) : (
        <>
          {sourced.length > 0 ? (
            <Band
              tone="well"
              eyebrow="Verified"
              title="From Yell and Google"
              standfirst="Published on a platform, with a date, and linked where the original is still up."
              align="centre"
              divider
            >
              <ReviewList reviews={sourced} layout="grid" />
            </Band>
          ) : null}

          {unsourced.length > 0 ? (
            <Band eyebrow="Unverified" title="Credited by first name only" align="centre">
              <div className="mx-auto mb-10 max-w-[52ch] text-center">
                <UnsourcedNote />
              </div>
              <ReviewList reviews={unsourced} layout="grid" />
            </Band>
          ) : null}
        </>
      )}
    </>
  )
}
