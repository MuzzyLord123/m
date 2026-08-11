import type { Review } from '@content/reviews'
import { sourceLabel } from '@content/reviews'
import { formatDate } from '@/lib/format'

/**
 * The mono footer under a review: name · date · Yell or Google · link.
 *
 * The whole footer is the link, so the tap target is the attribution rather
 * than a stray arrow, and so a reader can get to the original in one go — that
 * verifiability is the entire reason the excerpts are short.
 *
 * Plain text sources. No Yell logo, no Google logo, no badges and no brand
 * colours: those are trademarks, and Yell's yellow on a decorator's own site
 * would imply a paid relationship that does not exist.
 */

export function ReviewCredit({ review }: { review: Review }) {
  const label = sourceLabel[review.source]

  return (
    <a
      href={review.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mono-sm tap flex-wrap gap-x-3 gap-y-1 underline-offset-[6px] hover:underline focus-visible:underline"
    >
      <span>{review.reviewer}</span>
      <span aria-hidden="true">·</span>
      <span>
        <time dateTime={review.date}>{formatDate(review.date)}</time>
      </span>
      <span aria-hidden="true">·</span>
      <span>
        {label}
        <span className="sr-only"> — opens the original review</span>
      </span>
      <span aria-hidden="true">→</span>
    </a>
  )
}
