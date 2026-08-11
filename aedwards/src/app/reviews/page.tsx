import type { Metadata } from 'next'
import Link from 'next/link'
import { PALETTE, PALETTE_ORDER } from '@content/fields'
import { reviewsPage } from '@content/copy'
import {
  presentSources,
  reviewsBySource,
  reviewsNotYetTranscribed,
  sourceLabel,
  yellRating,
  type ReviewSource,
} from '@content/reviews'
import { yellListingUrl } from '@content/site'
import { Field } from '@/components/Field'
import { Ground } from '@/components/Ground'
import { Rating } from '@/components/Rating'
import { ReviewBlock } from '@/components/ReviewBlock'

/**
 * The proof archive.
 *
 * Every review gets a full-width row of its own — excerpt in display type, mono
 * metadata, link out — and the page repaints down the palette as you scroll it,
 * the same machinery as the home page. Scrolling this is meant to be the
 * argument all by itself.
 *
 * The filter is plain mono text links backed by a query string, not a dropdown
 * and not a click handler, so it works with JavaScript switched off and every
 * filtered view has its own address.
 */

export const metadata: Metadata = {
  title: 'Reviews',
  description: `Every review of A Edwards Decorating, excerpted and linked to the original. ${yellRating.average} from ${yellRating.count} ratings on Yell.`,
  alternates: { canonical: '/reviews' },
}

const SOURCES: readonly ReviewSource[] = ['yell', 'google', 'website']

function parseSource(raw: string | string[] | undefined): ReviewSource | 'all' {
  const value = Array.isArray(raw) ? raw[0] : raw
  return SOURCES.includes(value as ReviewSource) ? (value as ReviewSource) : 'all'
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const source = parseSource((await searchParams).source)
  const shown = reviewsBySource(source)

  const filters: { key: ReviewSource | 'all'; label: string; href: string }[] = [
    { key: 'all', label: reviewsPage.all, href: '/reviews' },
    ...presentSources.map((s) => ({
      key: s,
      label: sourceLabel[s],
      href: `/reviews?source=${s}`,
    })),
  ]

  const head = PALETTE.f5

  return (
    <>
      <Ground colour={head} />

      <Field colour={head} next={PALETTE_ORDER[0]} label={reviewsPage.title} snap={false}>
        <h1 className="t-display max-w-[16ch]">{reviewsPage.headline}</h1>
        <p className="mono mt-[clamp(2rem,5vh,3rem)] max-w-[52ch]">{reviewsPage.intro}</p>
        <Rating className="mt-[clamp(2rem,5vh,3rem)]" />

        {filters.length > 2 ? (
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

      {shown.map((review, i) => {
        const colour = PALETTE_ORDER[i % PALETTE_ORDER.length]
        const next = PALETTE_ORDER[(i + 1) % PALETTE_ORDER.length]
        return (
          <Field
            key={review.id}
            colour={colour}
            next={next}
            label={`Review · ${sourceLabel[review.source]}`}
            height="row"
            snap={false}
          >
            <ReviewBlock review={review} variant="row" />
          </Field>
        )
      })}

      {/*
        The honest footer. There are 34 ratings and fewer than 34 of them are
        written down here — saying so, with the number, is the whole difference
        between an archive and a sales page.
      */}
      <Field
        colour={PALETTE.f5}
        next={null}
        label="The rest"
        height="row"
        snap={false}
        id="the-rest"
      >
        {reviewsNotYetTranscribed > 0 ? (
          <p className="t-line max-w-[26ch]">
            <span className="tabular-nums">{reviewsNotYetTranscribed}</span> more ratings sit
            on the Yell listing. They are excerpted here as they are transcribed, word for
            word.
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
