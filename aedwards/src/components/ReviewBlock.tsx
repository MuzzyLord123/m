import type { Review } from '@content/reviews'
import { sourceLabel } from '@content/reviews'
import { Reveal } from './Reveal'
import { ReviewCredit } from './ReviewCredit'

/**
 * A review, in the two places reviews appear: filling a field on the home page,
 * and as a row in the archive at /reviews.
 *
 * The quote marks are part of the display type, not a decorative glyph hung off
 * the side of it — the site has no icons and no ornaments.
 *
 * Two states, because a review can be established without its wording being
 * known. When `excerpt` is null the block renders what is actually true — that
 * a named person left a review on a named date about a named job, and here is
 * the link to it — and does not put a single word in their mouth. That is the
 * whole point: a paraphrase set in 72px display type would be a fabricated
 * review, which is the one thing this site cannot contain.
 */

export function ReviewBlock({
  review,
  variant = 'field',
}: {
  review: Review
  variant?: 'field' | 'row'
}) {
  const pendingClass = variant === 'field' ? 't-display' : 't-line'
  const gap = variant === 'field' ? 'mt-[clamp(2rem,6vh,4rem)]' : 'mt-6'

  if (review.excerpt === null) {
    return (
      <div>
        <Reveal>
          <p className={pendingClass}>
            {review.job ? `${review.job}.` : `A review left on ${sourceLabel[review.source]}.`}
          </p>
        </Reveal>
        <p className="mono mt-6 max-w-[46ch]">
          Their words are on the listing. They are not copied here until they can be
          copied exactly.
        </p>
        <div className={gap}>
          <ReviewCredit review={review} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <Reveal>
        <blockquote cite={review.sourceUrl} className="t-quote">
          &ldquo;{review.excerpt}&rdquo;
        </blockquote>
      </Reveal>
      {review.job ? <p className="mono-label mt-8">{review.job}</p> : null}
      <div className={gap}>
        <ReviewCredit review={review} />
      </div>
    </div>
  )
}
