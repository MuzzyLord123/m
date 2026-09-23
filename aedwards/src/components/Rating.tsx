import { yellRating } from '@content/reviews'
import { formatDate, formatRating } from '@/lib/format'

/**
 * The 4.9.
 *
 * It appears here, in visible text, with its source and the date it was
 * recorded, and it links to the listing so anyone can go and check it. It does
 * NOT appear in the structured data: marking up a rating collected from a
 * third-party site is against Google's structured-data policy and can earn a
 * manual action, which for a site whose entire argument is "this man is
 * verifiably good" would be the worst possible outcome. See
 * src/components/StructuredData.tsx.
 *
 * The star is a character in the mono face, not a graphic, and it is backed by
 * a real count. Screen readers get the figure spelled out instead.
 *
 * `prominent` is the home page's. This is a site whose whole argument is thirty
 * four ratings averaging 4.9, and that figure was set in the same 15px mono as
 * a date stamp — smaller than the strapline above it. Set large, against the
 * small mono that qualifies it, it reads as the headline fact it actually is,
 * and the size contrast is the same display-against-mono the rest of the site
 * is built from. The compact version stays everywhere else, where it is a
 * supporting fact rather than the argument.
 */

export function Rating({
  className = '',
  prominent = false,
}: {
  className?: string
  prominent?: boolean
}) {
  const source = (
    <>
      <span className="tabular-nums">{yellRating.count} reviews</span>
      <span aria-hidden="true">·</span>
      <span>Yell</span>
      <span aria-hidden="true">→</span>
    </>
  )

  const provenance = (
    <p className={`${prominent ? 'mono-sm' : 'mono-sm'} mt-3 max-w-[46ch]`}>
      <span className="tabular-nums">{yellRating.breakdown.five}</span> at five stars,{' '}
      <span className="tabular-nums">{yellRating.breakdown.four}</span> at four. Figure taken
      from the Yell listing,{' '}
      <time dateTime={yellRating.recorded}>{formatDate(yellRating.recorded)}</time>.
    </p>
  )

  if (prominent) {
    return (
      <div className={className}>
        <a
          href={yellRating.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tap flex-wrap items-baseline gap-x-4 gap-y-1 underline-offset-[10px] hover:underline focus-visible:underline"
        >
          <span className="t-phone tabular-nums">
            {formatRating(yellRating.average)}
            {/* Set smaller than the numeral and nudged off the baseline. At the
                numeral's own size it stops being a mark next to a number and
                starts competing with it — and the number is the fact. */}
            <span aria-hidden="true" className="ml-[0.24em] inline-block align-[0.34em] text-[0.52em]">
              ★
            </span>
            <span className="sr-only"> out of 5</span>
          </span>
          <span className="mono-label flex items-baseline gap-x-3">{source}</span>
        </a>
        {provenance}
      </div>
    )
  }

  return (
    <div className={className}>
      <a
        href={yellRating.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mono tap flex-wrap gap-x-3 gap-y-1 underline-offset-[6px] hover:underline focus-visible:underline"
      >
        <span className="tabular-nums">
          {formatRating(yellRating.average)}
          <span aria-hidden="true"> ★</span>
          <span className="sr-only"> out of 5</span>
        </span>
        <span aria-hidden="true">·</span>
        {source}
      </a>
      {provenance}
    </div>
  )
}
