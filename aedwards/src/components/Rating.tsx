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
 */

export function Rating({ className = '' }: { className?: string }) {
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
        <span className="tabular-nums">{yellRating.count} reviews</span>
        <span aria-hidden="true">·</span>
        <span>Yell</span>
        <span aria-hidden="true">→</span>
      </a>

      <p className="mono-sm mt-3">
        <span className="tabular-nums">{yellRating.breakdown.five}</span> at five stars,{' '}
        <span className="tabular-nums">{yellRating.breakdown.four}</span> at four. Figure
        taken from the Yell listing, <time dateTime={yellRating.recorded}>{formatDate(yellRating.recorded)}</time>.
      </p>
    </div>
  )
}
