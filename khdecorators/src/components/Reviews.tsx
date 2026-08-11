import type { Review } from '@content/types'
import { needed } from '@content/needed'

/**
 * Reviews, set in the site's own type.
 *
 * Ink on paper, a 1px rule above each one, attribution in the annotation register.
 * No cards, no carousel, no star graphics — there is no verified numeric rating
 * behind a star on this site, and drawing five of them anyway is the kind of thing
 * that makes everything else on a page less believable. No Yell or Google logos
 * either: their brand colours would be a second and third accent on a site with one.
 *
 * The source is plain text, and the link goes to the original where there is one.
 */
export function ReviewList({ reviews }: { reviews: Review[] }) {
  return (
    <ul className="space-y-0">
      {reviews.map((review, i) => (
        <li
          key={`${review.name}-${i}`}
          className="border-t border-rule py-8 first:border-t-0 first:pt-0"
        >
          <blockquote className="measure text-lg leading-relaxed">
            <p>“{review.quote}”</p>
          </blockquote>

          <div className="annotation mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            {/* As published. A Yell username stays a Yell username. */}
            <cite className="not-italic text-ink">{review.name}</cite>

            {review.source !== 'unsourced' ? <span>{review.source}</span> : null}

            {review.date ? (
              <time dateTime={review.date}>{formatReviewDate(review.date)}</time>
            ) : null}

            {review.url ? (
              <a
                href={review.url}
                rel="nofollow noopener"
                target="_blank"
                className="text-signal hover:underline"
              >
                Read it <span aria-hidden="true">↗</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : null}

            {review.context ? (
              <span className="normal-case tracking-normal">{review.context}</span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * '2022-03-14' → '14 March 2022'. '2022-03' → 'March 2022'.
 *
 * Formatted from the parts rather than through `new Date()`, which would apply a
 * timezone to a date that never had one and can move a review back a day.
 */
function formatReviewDate(date: string): string {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  const [year, month, day] = date.split('-')
  const monthName = month ? months[Number(month) - 1] : undefined
  if (!monthName) return year ?? date
  return day ? `${Number(day)} ${monthName} ${year}` : `${monthName} ${year}`
}

/**
 * What the site shows while the reviews have not been transcribed yet.
 *
 * It is a plainly marked gap, not a placeholder quote and not a "coming soon".
 * Kenny's reviews exist and they are good — the wording just was not reachable when
 * this was built, and writing something plausible in the meantime would be
 * fabricating a testimonial for a trading business. See the top of
 * /content/reviews.ts for how to fill them in.
 */
export function ReviewsPending() {
  const entry = needed.find((n) => n.token === 'reviews')

  return (
    <div className="border border-rule p-6 md:p-8">
      <div className="annotation">
        To be transcribed — {entry?.blocking ? 'blocks launch' : 'not blocking'}
      </div>
      <p className="measure mt-4">
        Kenny’s reviews are not written yet because they are not ours to write. There is a good
        collection already — Yell reviews from 2021–22, two on Google, and a further set credited by
        first name — and they need copying across word for word, with the names and dates exactly as
        they were published.
      </p>
      <p className="measure mt-4 text-muted">
        Nothing plausible has been put here in the meantime. An invented testimonial is a lie to the
        next customer and a structured-data violation, and it would undermine every other claim on
        the site. The instructions for transcribing them are at the top of{' '}
        <span className="spec-value">/content/reviews.ts</span>.
      </p>
    </div>
  )
}

/**
 * The heading above the unsourced group.
 *
 * These are the quotes credited only by a first name and an initial. They are
 * probably real, there is nothing to link them to, and the honest thing is to say so
 * and put them in their own group — never to give them an invented date or dress
 * them up as verified. Better still, ask those customers for a Google review so
 * they become real ones.
 */
export function UnsourcedNote() {
  return (
    <p className="annotation max-w-[52ch] leading-relaxed">
      Credited by first name only, from the old site. No date and nothing to link to, so they are
      shown separately rather than presented as verified reviews.
    </p>
  )
}
