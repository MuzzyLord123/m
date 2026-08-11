/**
 * The single source of review truth. Read REVIEWS.md before you touch it.
 *
 * This site has one enormous asset — 34 ratings averaging 4.9 over a decade —
 * and almost nothing else. The reviews are not a testimonial strip near the
 * bottom. They are the content, the structure and the argument. Which means
 * the rules below are load-bearing, not housekeeping:
 *
 *   1. EXCERPT, DON'T REPUBLISH. The sharpest ≤30 words of a review, verbatim,
 *      with a link to the original. Not all 34 reviews copied across. The words
 *      belong to the people who wrote them, Yell's terms restrict copying its
 *      content, and Google's terms restrict storing review text. A short
 *      attributed excerpt that links back is both safer and more convincing —
 *      a reader can verify it in one tap.
 *   2. NEVER EDIT A REVIEW. No tidying grammar, no stitching two sentences
 *      together with an ellipsis, no changing "Andy" to "we". If it needs
 *      editing to work, use a different review.
 *   3. ATTRIBUTE IN FULL: display name as published, date, and the word Yell or
 *      Google in plain text. No logos, no badges, no brand colours.
 *   4. THE 4.9 IS VISIBLE TEXT WITH ITS SOURCE AND DATE, AND IS NOT IN JSON-LD.
 *      See `yellRating` below and src/components/StructuredData.tsx.
 *   5. INVENT NOTHING.
 *
 * `assertReviews()` at the bottom enforces 1, 2 and 3 at build time.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY EVERY `excerpt` IS CURRENTLY null
 *
 * The excerpts must be verbatim, and verbatim means copied off the listing —
 * not remembered, not reconstructed, not "written in the spirit of". Yell
 * blocks automated access, so no machine could read the wording, and a
 * paraphrase presented as a quotation is a fabricated review.
 *
 * So the reviewers, dates and subject matter — all of which are established —
 * are here, and the wording is null until a human opens the listing and pastes
 * it in. A review with a null excerpt renders as a labelled, dated, linked
 * frame: it still proves a real review exists and takes you to it, it just does
 * not put words in anyone's mouth. `npm run check:launch` fails while any
 * excerpt is still null. REVIEWS.md is the fifteen-minute job that clears it.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { yellListingUrl } from './site'

export type ReviewSource = 'yell' | 'google' | 'website'

export type Review = {
  id: string
  source: ReviewSource
  /** Display name exactly as published. "PaulG-11167", not "Paul G". */
  reviewer: string
  /** ISO, as published. */
  date: string
  /** As published. null where the per-review star count is not recorded. */
  rating: 1 | 2 | 3 | 4 | 5 | null
  /** VERBATIM, ≤30 words, unedited, no ellipsis-stitching. null until copied. */
  excerpt: string | null
  /** What the review evidences. Established from the listing summary. */
  job: string | null
  /** Deep link to the review, or to the listing it is published on. Required. */
  sourceUrl: string
  /** Reviews gathered on this site only: written permission to publish. */
  permission?: boolean
}

/* ---------------------------------------------------------------- rating --- */

/**
 * The headline figure. Shown in visible text with its source and the date it
 * was recorded — and deliberately NOT marked up as `aggregateRating` in
 * JSON-LD. Marking up ratings collected from a third-party site is against
 * Google's structured data policy and risks a manual action, which is the exact
 * opposite of what this site is for.
 */
export const yellRating = {
  average: 4.9,
  count: 34,
  breakdown: { five: 32, four: 2 },
  /** The date this figure was recorded in this file. */
  recorded: '2026-08-11',
  /**
   * Flip to true once a human has opened the listing and seen these numbers.
   * They came into the build from the brief, not from a fetch — Yell blocks
   * automated access. Gates launch.
   */
  seenOnListing: false,
  sourceUrl: yellListingUrl,
} as const

/* --------------------------------------------------------------- reviews --- */

/**
 * The five reviews visible on the front of the Yell listing. There are 34
 * ratings in total; the rest are behind the listing's full review view. Add
 * them here as they are transcribed — the site scales to them with no code
 * changes.
 *
 * `sourceUrl` is the listing rather than a per-review permalink because Yell's
 * per-review link format could not be confirmed without fetching the page.
 * If the listing exposes per-review anchors, use them — see
 * content/needed.json#yell-review-links.
 */
export const reviews: readonly Review[] = [
  {
    id: 'yell-paulg-11167',
    source: 'yell',
    reviewer: 'PaulG-11167',
    date: '2025-11-17',
    rating: null,
    excerpt: null,
    job: 'Three bedrooms',
    sourceUrl: yellListingUrl,
  },
  {
    id: 'yell-darrenj-427',
    source: 'yell',
    reviewer: 'DarrenJ-427',
    date: '2025-08-26',
    rating: null,
    excerpt: null,
    job: 'Full exterior repaint',
    sourceUrl: yellListingUrl,
  },
  {
    id: 'yell-andm-6',
    source: 'yell',
    reviewer: 'AndM-6',
    date: '2025-06-03',
    rating: null,
    excerpt: null,
    job: 'Exterior woodwork and render, May 2025',
    sourceUrl: yellListingUrl,
  },
  {
    id: 'yell-lightning',
    source: 'yell',
    reviewer: 'lightning',
    date: '2024-12-13',
    rating: null,
    excerpt: null,
    job: null,
    sourceUrl: yellListingUrl,
  },
  {
    id: 'yell-ianh-1759',
    source: 'yell',
    reviewer: 'IanH-1759',
    date: '2024-08-08',
    rating: null,
    excerpt: null,
    job: null,
    sourceUrl: yellListingUrl,
  },
]

/** How many of the 34 are transcribed here. Rendered plainly on /reviews. */
export const reviewsTranscribed = reviews.length
export const reviewsNotYetTranscribed = yellRating.count - reviews.length

export function reviewById(id: string): Review | undefined {
  return reviews.find((r) => r.id === id)
}

export function reviewsBySource(source: ReviewSource | 'all'): readonly Review[] {
  return source === 'all' ? reviews : reviews.filter((r) => r.source === source)
}

/** Sources actually present in the data — the /reviews filter is built from this. */
export const presentSources: readonly ReviewSource[] = Array.from(
  new Set(reviews.map((r) => r.source)),
)

/** "Yell", "Google" — plain text, never a logo. */
export const sourceLabel: Record<ReviewSource, string> = {
  yell: 'Yell',
  google: 'Google',
  website: 'Left on this site',
}

/* ------------------------------------------------------------ the rules --- */

const MAX_EXCERPT_WORDS = 30

/**
 * Runs at module load, which means at build. The rules at the top of this file
 * are only worth writing down if something checks them.
 */
function assertReviews(list: readonly Review[]): void {
  const seen = new Set<string>()

  for (const r of list) {
    const where = `review "${r.id}"`

    if (seen.has(r.id)) throw new Error(`Duplicate review id: ${r.id}`)
    seen.add(r.id)

    if (!r.reviewer.trim()) {
      throw new Error(`${where} has no reviewer. Attribution is not optional.`)
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date)) {
      throw new Error(`${where} has date "${r.date}"; expected ISO YYYY-MM-DD.`)
    }

    if (!r.sourceUrl) {
      throw new Error(
        `${where} has no sourceUrl. A review a reader cannot go and verify is ` +
          `not evidence, and this site is nothing but evidence.`,
      )
    }

    if (r.source === 'website' && r.permission !== true) {
      throw new Error(
        `${where} was left on this site but has no permission flag. Do not ` +
          `publish a customer's words without their say-so.`,
      )
    }

    if (r.excerpt !== null) {
      const words = r.excerpt.trim().split(/\s+/).filter(Boolean)
      if (words.length > MAX_EXCERPT_WORDS) {
        throw new Error(
          `${where} runs to ${words.length} words. The limit is ` +
            `${MAX_EXCERPT_WORDS}: take a shorter passage, do not trim theirs.`,
        )
      }
      if (/\.{3}|…/.test(r.excerpt)) {
        throw new Error(
          `${where} contains an ellipsis. Excerpts are one unbroken verbatim ` +
            `passage — stitching two halves of a review together edits it.`,
        )
      }
      if (!r.excerpt.trim()) {
        throw new Error(`${where} has an empty excerpt. Use null, not "".`)
      }
    }
  }
}

assertReviews(reviews)
