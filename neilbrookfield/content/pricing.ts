/**
 * Workshop pricing.
 *
 * Published pricing is a trust signal, so it is set in type rather than hidden
 * behind "from" — but only once it is right. The figures below are what the old
 * site said in 2024. Until Neil confirms them, `confirmed` stays false and the
 * page shows a frame instead of a number, because a stale price is worse than
 * no price.
 *
 * To publish: check the figures with Neil, correct them here, set confirmed to
 * true. Nothing else needs touching.
 */

export const workshop = {
  confirmed: false,
  /** The year these figures were last known to be current. */
  quotedIn: 2024,
  currency: '£',
  hourly: 55,
  block: { hours: 3, price: 150 },
  /** Kept as prose because it is a conversation, not a rate. */
  travel: 'Travel outside the immediate area is worth a word on the phone.',
} as const;
