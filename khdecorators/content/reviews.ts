import type { Review } from './types'
import { profiles } from './site'

/**
 * ============================================================================
 *  THE REVIEWS ARE NOT WRITTEN. THEY ARE TRANSCRIBED. READ THIS FIRST.
 * ============================================================================
 *
 * Kenny already has a good collection — Yell reviews from 2021–22 with usernames
 * and dates, two Google reviews from named reviewers, and a further set credited
 * only by a first name and an initial. One of them describes an office repaint
 * quoted at five days, finished halfway through day four, with the space left
 * immaculate. That one review is worth more than every adjective on this site put
 * together, and it is worth getting the wording exactly right.
 *
 * `reviews` below is EMPTY, and it is empty on purpose. It is not an oversight and
 * it is not waiting on a design decision.
 *
 * The reason: the live site could not be read from the build environment, so the
 * real wording, the real usernames and the real dates were not available. The only
 * ways to fill this array are to copy them off the live pages or off Yell and
 * Google. Writing something that sounds like what a happy customer might have said
 * is fabricating a testimonial for a real business, which is a lie to the next
 * customer, a Google structured-data violation, and — for a trading business —
 * potentially an unfair commercial practice. So the array stays empty until
 * somebody transcribes them.
 *
 * While it is empty, the site does not fake it: the home page and /reviews render
 * a plainly marked placeholder, and `npm run check:launch` exits non-zero. Nothing
 * ships with an invented quote in it.
 *
 * ---------------------------------------------------------------------------
 *  HOW TO FILL THIS IN (about twenty minutes, no code knowledge needed)
 * ---------------------------------------------------------------------------
 *
 * 1. Open the old site's reviews page, the Yell listing and the Google profile
 *    side by side.
 * 2. For each review, copy the words. Do not retype them from memory and do not
 *    tidy them up. If it says "very pleased with the finnish", it says that.
 * 3. Trim to 30 words or fewer by cutting from the START or the END and marking
 *    the cut with an ellipsis (…). Never cut from the middle to join two separate
 *    sentences together — that changes what the person said.
 * 4. `name` is the name exactly as published, including a Yell username that looks
 *    like a username. "Kaz2021" stays "Kaz2021". Making it "Karen" is inventing a
 *    person.
 * 5. `date` as published: '2022-03-14' if the day is shown, '2022-03' if only the
 *    month is. If no date is shown, `null`. Never estimate one.
 * 6. `url` links to the review or to the listing holding it. If there is nothing to
 *    link to, `null` — and then `source` must be 'unsourced'.
 * 7. `source` is 'Yell', 'Google', or 'unsourced' for the first-name-and-initial
 *    ones. The unsourced group renders separately, labelled as unverified, with no
 *    date and no link. That is the honest way to show them, and the better fix is
 *    to ask those customers for a Google review so they become real ones.
 *
 * Order does not matter — the page groups them by source itself.
 */

export const reviews: Review[] = [
  /*
   * The shape, for reference. Copy it, fill it in with the real words, and delete
   * this comment. Left as a comment rather than as sample data so that it cannot
   * possibly be mistaken for a real review or accidentally shipped as one.
   *
   * {
   *   name: '<exactly as published>',
   *   quote: '<verbatim, ≤30 words, unedited>',
   *   source: 'Yell',
   *   date: '2022-03',
   *   url: 'https://www.yell.com/biz/...',
   *   context: 'Office repaint',   // optional, our words, shown as ours
   * },
   */
]

/**
 * The average rating.
 *
 * `null`, and it stays null unless the number can be stated with the source it
 * came from, in plain text, next to it — "4.9 on Yell from 12 reviews", say.
 *
 * It is NOT going into the JSON-LD either way. Marking up ratings collected from
 * third-party sites as if they were first-party review data on your own domain is
 * against Google's structured-data policy for reviews and risks a manual action
 * against the whole site. A manual action on a site running paid traffic is an
 * expensive way to gain one gold star in a search result. See ADS-MIGRATION.md.
 */
export const averageRating: null = null

/* ------------------------------------------------------------------ *
 * Grouping
 * ------------------------------------------------------------------ */

/** Verifiable reviews — a real source and, where published, a link. */
export const sourcedReviews = (): Review[] => reviews.filter((r) => r.source !== 'unsourced')

/**
 * The first-name-and-initial ones. Shown in their own group, plainly labelled,
 * with no date and no link. Never dressed up as a linked review.
 */
export const unsourcedReviews = (): Review[] => reviews.filter((r) => r.source === 'unsourced')

/** The four excerpts on the home page. Sourced ones only — they carry more weight. */
export const homeReviews = (): Review[] => sourcedReviews().slice(0, 4)

/* ------------------------------------------------------------------ *
 * /leave-a-review
 * ------------------------------------------------------------------ */

/**
 * Somewhere to send a customer who has just said "that's smashing, thanks Kenny".
 * The point of this page is that it can be texted as a link from the van.
 *
 * Both URLs need confirming — see CONTENT-NEEDED.md. Any entry still holding a
 * placeholder is not rendered as a link, because a review button that goes nowhere
 * is worse than no button.
 */
export const leaveAReview = {
  lede: 'If I have done work for you and you are happy with it, a review is genuinely the most useful thing you can do for me. It takes a minute and it is the reason the next person rings.',
  ask: 'What helps most is a sentence about what the job actually was — "garage door sprayed", "hall stairs and landing" — because that is what the next person is searching for.',
  places: [
    {
      name: 'Google',
      /** Google's own review-writing link, once the profile URL is known. */
      url: profiles.google,
      note: 'Quickest if you already have a Google account. This is the one that helps most.',
    },
    {
      name: 'Yell',
      url: profiles.yell,
      note: 'Where most of my older reviews are.',
    },
  ],
  alternative:
    'If you would rather not write one publicly, a text or an email is still worth having — and if something was not right, I would much rather hear it from you than read it.',
}
