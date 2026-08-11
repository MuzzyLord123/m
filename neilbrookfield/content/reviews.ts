/**
 * Three real Google reviews, by name.
 *
 * The wording is NOT reproduced from memory. Until the exact text arrives from
 * Neil (or is copied off the Google Business Profile), `quote` stays null and
 * the review renders as a labelled frame. A paraphrased review is a fabricated
 * review.
 *
 * On the old site all three credits linked to the same Google contributor, so
 * two of the three pointed at the wrong person. Here there is one link, to the
 * business profile, or no link at all.
 */

export type Review = {
  name: string;
  /** Verbatim, or null. Never a paraphrase. See content/needed.ts#review-quotes. */
  quote: string | null;
  /** What the review is about — established, unlike its wording. */
  covers: string | null;
};

/** See content/needed.ts#google-profile. */
export const googleProfileUrl: string | null = null;

export const reviews: readonly Review[] = [
  {
    name: 'Janet Leclercq',
    quote: null,
    covers: null,
  },
  {
    name: 'Andrew Waugh',
    quote: null,
    covers: 'Rotten window woodwork repaired and the outside of the house repainted.',
  },
  {
    name: 'Stella Steele',
    quote: null,
    covers: null,
  },
] as const;
