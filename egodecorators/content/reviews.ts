/**
 * Customer reviews.
 *
 * Rules, and they are not negotiable:
 *
 *   1. `quote` is verbatim. Copied and pasted from where the customer wrote it,
 *      spelling and all. Not tidied, not shortened into something snappier.
 *   2. `name` is exactly as published. Two of these were left under Yell
 *      usernames; a username stays a username. Turning `Jane58539` into
 *      "Jane Smith" invents a person.
 *   3. No date is written here unless it was read off the review.
 *   4. No star graphics, no Yell or Checkatrade logos, no aggregateRating in
 *      the structured data.
 *
 * `quote: null` means we know the review exists and who wrote it, but not the
 * exact words — the summaries below came from a search index, not from the
 * reviews themselves. Those render as a labelled frame and
 * `npm run check:launch` fails while any remain. Paste the real text in and
 * delete `gist`.
 */

export type Review = {
  id: string;
  /** Verbatim, ≤30 words when excerpted. null until pasted in from the source. */
  quote: string | null;
  /** Exactly as published. A username is a username. */
  name: string;
  /** Where it was published, for the source line. */
  source: 'Yell' | 'Checkatrade' | 'MyBuilder';
  /** Only if it was read off the review. */
  date: string | null;
  /**
   * What the review is about, in our words, so the right one can be placed on
   * the right page while the verbatim text is still outstanding. Never rendered
   * as a quotation — delete it once `quote` is filled in.
   */
  gist: string;
  /** Which page this one belongs on. */
  placement: 'home' | 'commercial' | 'about';
};

export const REVIEWS: readonly Review[] = [
  {
    id: 'jane58539',
    quote: null,
    name: 'Jane58539',
    source: 'Yell',
    date: null,
    gist: 'Asked for a reliable decorator and got one. Names Edward and Mario, and says they were respectful and considerate around her elderly mother. Turned up when they said they would.',
    placement: 'home',
  },
  {
    id: 'mrs23657',
    quote: null,
    name: 'Mrs23657',
    source: 'Yell',
    date: null,
    gist: 'Great service from estimate through to completion. Ted and the team always on time.',
    placement: 'about',
  },
  {
    id: 'gray',
    quote: null,
    name: 'Mrs Gray',
    source: 'Yell',
    date: null,
    gist: 'Living room and kitchen diner, done quickly and to a high standard for a reasonable price. Calls them the best around.',
    placement: 'home',
  },
  {
    // Placed on /commercial because that page needs the review about working
    // around premises that could not clear out for us. Whether this is that
    // review is not yet settled: the summaries these entries were built from
    // came from a search index rather than from the reviews themselves. When
    // the four are pasted in verbatim, check which one is the commercial job
    // and move `placement` to match.
    id: 'four-coats',
    quote: null,
    name: 'CONFIRM: the name exactly as published',
    source: 'Yell',
    date: null,
    gist: 'Four coats of paint over dark wood throughout a house, to a tight timescale. Names Ted and Lauren. Accurate work, professional finish, courteous.',
    placement: 'commercial',
  },
];

/**
 * The Yell rating, as plain text.
 *
 * Null until someone opens the listing and reads it. A search index reported
 * 4.9 from 29 reviews in August 2026; that is not the same as having read it,
 * so it is not published. When it is filled in, `readOn` is displayed with it —
 * a rating without a date is a rating that will be wrong later.
 */
export const yellRating: { score: string; count: number; readOn: string } | null = null;

/**
 * Where a customer is sent to leave a review, from /leave-a-review.
 * Google stays null until we know a profile exists — see needed.json#google-profile.
 */
export const reviewLinks = {
  yell: 'https://www.yell.com/biz/ego-decorators-neston-10357583/writereview',
  google: null as string | null,
} as const;

export function reviewsFor(placement: Review['placement']): Review[] {
  return REVIEWS.filter((r) => r.placement === placement);
}
