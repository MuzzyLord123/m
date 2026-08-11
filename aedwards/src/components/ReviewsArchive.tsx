import Link from 'next/link'
import { PALETTE, PALETTE_ORDER } from '@content/fields'
import { reviewsPage } from '@content/copy'
import {
  presentSources,
  reviewsBySource,
  sourceLabel,
  yellRating,
  type ReviewSource,
} from '@content/reviews'
import { yellListingUrl } from '@content/site'
import { Field } from './Field'
import { Ground } from './Ground'
import { Rating } from './Rating'
import { ReviewBlock } from './ReviewBlock'

/**
 * The proof archive, shared by /reviews and /reviews/[source].
 *
 * Every review gets a full-width row of its own — excerpt in display type,
 * mono metadata, link out — and the page repaints down the palette as you
 * scroll, the same machinery as the home page. Scrolling this is meant to be
 * the argument all by itself.
 *
 * The filter is a set of plain links to real pages, not a query string and not
 * a dropdown. That keeps every view static and prerendered, gives each one its
 * own address, and means it works with JavaScript switched off. The filter
 * links only appear once there is more than one source to choose between.
 */

export function ReviewsArchive({ source }: { source: ReviewSource | 'all' }) {
  const shown = reviewsBySource(source)
  const head = PALETTE.f5

  const filters: { key: ReviewSource | 'all'; label: string; href: string }[] = [
    { key: 'all', label: reviewsPage.all, href: '/reviews' },
    ...presentSources.map((s) => ({
      key: s,
      label: sourceLabel[s],
      href: `/reviews/${s}`,
    })),
  ]

  // The whole archive is on one page until there is a second source to split
  // it by. One "Yell" link next to one "All" link is not a filter, it is noise.
  const showFilters = filters.length > 2

  const notShown = yellRating.count - shown.length

  return (
    <>
      <Ground colour={head} />

      <Field colour={head} next={PALETTE_ORDER[0]} label={reviewsPage.title} snap={false}>
        <h1 className="t-display max-w-[16ch]">{reviewsPage.headline}</h1>
        <p className="mono mt-[clamp(2rem,5vh,3rem)] max-w-[52ch]">{reviewsPage.intro}</p>
        <Rating className="mt-[clamp(2rem,5vh,3rem)]" />

        {showFilters ? (
          <p className="mono-label mt-[clamp(2.5rem,6vh,3.5rem)] flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>{reviewsPage.filterLabel}</span>
            {filters.map((filter) => (
              <Link
                key={filter.key}
                href={filter.href}
                aria-current={filter.key === source ? 'true' : undefined}
                className={
                  filter.key === source
                    ? 'underline underline-offset-[6px]'
                    : 'underline-offset-[6px] hover:underline'
                }
              >
                {filter.label}
              </Link>
            ))}
          </p>
        ) : null}
      </Field>

      {shown.map((review, i) => (
        <Field
          key={review.id}
          colour={PALETTE_ORDER[i % PALETTE_ORDER.length]}
          next={PALETTE_ORDER[(i + 1) % PALETTE_ORDER.length]}
          label={`Review · ${sourceLabel[review.source]}`}
          height="row"
          snap={false}
        >
          <ReviewBlock review={review} variant="row" />
        </Field>
      ))}

      {/*
        The honest footer. There are 34 ratings and fewer than 34 of them are
        written down here — saying so, with the number, is the whole difference
        between an archive and a sales page.
      */}
      <Field colour={PALETTE.f5} next={null} label="The rest" height="row" snap={false} id="the-rest">
        {notShown > 0 ? (
          <p className="t-line max-w-[26ch]">
            <span className="tabular-nums">{notShown}</span> more ratings sit on the Yell
            listing. They are excerpted here as they are transcribed, word for word.
          </p>
        ) : (
          <p className="t-line max-w-[26ch]">
            That is all <span className="tabular-nums">{yellRating.count}</span> of them.
          </p>
        )}
        <a
          href={yellListingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mono-label mt-10 inline-flex items-center gap-3 underline underline-offset-[6px]"
        >
          Read them on Yell
          <span aria-hidden="true">→</span>
        </a>
      </Field>
    </>
  )
}
