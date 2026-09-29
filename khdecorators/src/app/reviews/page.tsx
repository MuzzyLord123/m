import type { Metadata } from 'next'
import Link from 'next/link'
import { Band } from '@/components/Band'
import type { CSSProperties } from 'react'
import { Hero } from '@/components/Hero'
import { photos } from '@content/photos'
import { ReviewList, ReviewsPending, UnsourcedNote } from '@/components/Reviews'
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
      <Hero
        photo={photos.staircase}
        focus="50% 40%"
        eyebrow={`Reviews · ${sourced.length + unsourced.length} of them`}
        title="What people have said"
        gild="said"
        lede="Quoted exactly as written, with the name as it was published. Nothing here has been tidied up, shortened in the middle, or written on anybody’s behalf."
        plaque={photos.staircase.caption}
        from="reviews-hero"
        quoteHref="/contact"
      >
        <p className="hero-in mt-6" style={{ '--i': 5 } as CSSProperties}>
          <Link href="/leave-a-review" className="link link-hover-target text-[0.9375rem]">
            Had work done? Leave a review
          </Link>
        </p>
      </Hero>

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
