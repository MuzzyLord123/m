/**
 * Real Google reviews, supplied by the client from his own Google Business
 * Profile — the profile replies to Sue Jones as "F.A.S. Painter & Decorator
 * (owner)", so these are his.
 *
 * RULES FOR THIS FILE
 *
 * 1. Quoted verbatim. Spelling, punctuation and typos are left exactly as the
 *    customer wrote them, because tidying somebody's review is the first step
 *    towards writing it for them. "both out en-suites" and the space before the
 *    comma in Fona Olyott's are theirs, not ours.
 * 2. Nothing invented. Two reviews were cut off by Google's "… More" link in the
 *    screenshots we were given; they carry `truncated: true` and are shown with
 *    an ellipsis rather than a guessed ending. See CONTENT-NEEDED.md.
 * 3. No aggregate. We do not know the true total or average on the profile —
 *    only the seven we were shown — so the site never claims an overall score.
 *    See the note in components/StructuredData.tsx for why there is no
 *    aggregateRating in the structured data either.
 * 4. A review only goes in here if it is real and on a public profile somebody
 *    could go and check.
 */

export type Review = {
  /** The reviewer's name exactly as it appears on the profile. */
  name: string
  /** Stars given, out of five. */
  rating: 1 | 2 | 3 | 4 | 5
  /** The review, word for word. */
  body: string
  /** True where Google's "… More" cut the text off in the source screenshot. */
  truncated: boolean
  /** Where it was left. */
  source: 'Google'
  /** Shown in the teaser on the page rather than only inside the dialog. */
  featured?: boolean
}

export const reviews: Review[] = [
  {
    name: 'Peter Baker',
    rating: 5,
    body: 'Fardin arrived at the exact time he advised. 8am. He worked non stop today to get our job finished, even in this terrible heat. He painted the outside of our bungalow and garage. The finish looks brilliant and is exactly as we wanted. We would not hesitate to recommend Fardin.',
    truncated: false,
    source: 'Google',
    featured: true,
  },
  {
    name: 'Bethany',
    rating: 5,
    body: 'Fardin did a fantastic job of both out en-suites. He was very knowledgeable in using the correct paint to combat our mould problems. Work was neat and done in a timely fashion. I would definitely recommend and will use him again in the future.',
    truncated: false,
    source: 'Google',
    featured: true,
  },
  {
    name: 'Angela Mcquigg',
    rating: 5,
    body: 'Excellent service and quality to detail, took pride in his work and cleaned up as he went along, would certainly recommend..',
    truncated: false,
    source: 'Google',
  },
  {
    name: 'Fona Olyott',
    rating: 5,
    body: 'Fardin did a really good job of decorating my living area ,kitchen and bathrooms and left the place so tidy afterwards.',
    truncated: false,
    source: 'Google',
  },
  {
    name: 'Lee Penney',
    rating: 5,
    body: "Fardin recently completed some painting and decorating work for me, and I couldn't be happier with the results. His workmanship was exceptional, with great attention to detail and a flawless finish throughout the entire room.",
    truncated: true,
    source: 'Google',
  },
  {
    name: 'Sue Jones',
    rating: 5,
    body: "I recently used Fas for some painting and decorating, and I couldn't be happier with the result. He's one of the most reliable tradesmen I've come across locally since moving here.",
    truncated: true,
    source: 'Google',
  },
]

/**
 * Duncan Beaumont left five stars three months ago with no written review, so
 * there is nothing to quote and he is not in the list above. Counting him in a
 * "7 reviews" headline while showing six would be the kind of small dishonesty
 * this site is trying to avoid.
 */

export const reviewsCopy = {
  heading: 'What people said afterwards',
  /** Deliberately no score, no average, no review count beyond what we hold. */
  standfirst:
    'Left on Google by people who had the work done. Quoted word for word, including the typos.',
  openLabel: 'Read the reviews',
  dialogTitle: 'Reviews left on Google',
  truncatedNote: 'Cut short on Google — the full review is on the profile.',
} as const

export const featuredReviews = reviews.filter((r) => r.featured)
