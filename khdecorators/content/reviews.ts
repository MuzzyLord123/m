import type { Review } from './types'
import { profiles } from './site'

/**
 * ============================================================================
 *  THE REVIEWS ARE NOT WRITTEN. THEY ARE TRANSCRIBED. READ THIS FIRST.
 * ============================================================================
 *
 * Every entry below was copied off the old site's /reviews page (fetched
 * 23 September 2026 by scripts/import-live-photos.mjs) — word for word, spelling
 * and spacing as published, names exactly as shown. Nothing was reworded and
 * nothing was written. Seventeen reviews:
 *
 *   - Seven Yell reviews, shown on the old site with a Yell username and a date.
 *   - Two Google reviews from named reviewers.
 *   - Eight credited only by a first name and an initial. They are `unsourced`:
 *     no date and no link, rendered in their own group.
 *
 * Where a review is longer than 30 words, the excerpt is one unbroken run of the
 * reviewer's own words, cut only at the start or the end and marked with an
 * ellipsis. No two sentences that were apart in the original have been joined.
 *
 * The Yell and Google entries have `url: null` because the listing addresses are
 * still unconfirmed (see `profiles` in site.ts). The source is named in plain
 * text and nothing links anywhere; once the listing URLs are known, put them in
 * `url` and each review links to where it can be checked.
 *
 * Writing something that sounds like what a happy customer might have said is
 * fabricating a testimonial for a real business, which is a lie to the next
 * customer, a Google structured-data violation, and — for a trading business —
 * potentially an unfair commercial practice. Add new ones the same way these were
 * added: copied, never composed.
 *
 * ---------------------------------------------------------------------------
 *  HOW TO ADD ONE (no code knowledge needed)
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
 * 6. `url` links to the review or to the listing holding it. `null` if the link is
 *    not known yet — the source is still named, it just is not clickable. A
 *    review with no known source at all is 'unsourced', and never gets a link.
 * 7. `source` is 'Yell', 'Google', or 'unsourced' for the first-name-and-initial
 *    ones. The unsourced group renders separately, labelled as unverified, with no
 *    date and no link. That is the honest way to show them, and the better fix is
 *    to ask those customers for a Google review so they become real ones.
 *
 * Order does not matter — the page groups them by source itself.
 */

export const reviews: Review[] = [
  /* ---- Google ------------------------------------------------------------ */
  {
    name: 'Jonny Harrop',
    quote:
      '…Absolutely superb service and quality work. Quoted for 5 days work and managed to get us back in the space half way through the 4th day, with the space immaculate.…',
    source: 'Google',
    date: null,
    url: null,
    context: 'Office repainted, magnolia to postbox red',
  },
  {
    name: 'Annette Llywarch',
    quote:
      'Great communication and service throughout! Very happy with how professional and punctual Ken was. He did such a great job and was quick and efficient.',
    source: 'Google',
    date: null,
    url: null,
  },

  /* ---- Yell --------------------------------------------------------------- */
  {
    name: 'SueT-479',
    quote:
      'Fantastic job by Kenny - decorated 2 bedrooms for me at pretty short notice. He’s clearly a perfectionist with great results! Was prompt and kept me informed at all times.…',
    source: 'Yell',
    date: '2022-10-09',
    url: null,
    context: 'Two bedrooms',
  },
  {
    name: 'ChloeW-292',
    quote:
      'Will always get Kenny to do any painting and decorating work that’s needed. He does exactly what’s asked of him and finishes jobs to a very high standard. 100% recommend.',
    source: 'Yell',
    date: '2022-04-14',
    url: null,
  },
  {
    name: 'JessS-203',
    quote:
      'Highly recommend Kenny!! Attention to detail, neat and tidy, extremely hardworking and a lovely person. Our rooms now look Amazing!…',
    source: 'Yell',
    date: '2021-06-27',
    url: null,
  },
  {
    name: 'DebbieM-1314',
    quote:
      '…The polite young man came on time ,and gave an outstanding job inside the house and outside.…',
    source: 'Yell',
    date: '2022-08-08',
    url: null,
    context: 'Inside and out',
  },
  {
    name: 'ChristinaA-74',
    quote:
      'Fantastic job done decorating our kitchen, finished to a high standard, Kenny is reliable punctual and cleans as he goes.…',
    source: 'Yell',
    date: '2022-09-09',
    url: null,
    context: 'Kitchen',
  },
  {
    name: 'RebeccaA-295',
    quote:
      '…he is very professional and never leaves a mess always cleaning as he goes I will be calling him back when it’s time to do my kids bedrooms…',
    source: 'Yell',
    date: '2022-08-22',
    url: null,
    context: 'A returning customer',
  },
  {
    name: 'GarethP-30',
    quote:
      "It's the first time I've use Kenny, but was very impressed by the quality of his work.…",
    source: 'Yell',
    date: '2022-04-12',
    url: null,
  },

  /* ---- First name and initial only: unsourced -------------------------------- */
  {
    name: 'Robert L',
    quote:
      'very high quality workmanship, nothing to much trouble, works hard , turns up on time and knows his trade. would highly recommend him.',
    source: 'unsourced',
    date: null,
    url: null,
  },
  {
    name: 'Michelene M',
    quote:
      '…Hall, stairs and landing professionally completed to a high standard. You arrived on time and got to work straight away with a friendly, polite manner.…',
    source: 'unsourced',
    date: null,
    url: null,
    context: 'Hall, stairs and landing',
  },
  {
    name: 'Heather C',
    quote:
      "Really pleased with Kenny's work, very professional finish. Friendly and reliable, turned up when he said he would. Couldn't fault him.…",
    source: 'unsourced',
    date: null,
    url: null,
  },
  {
    name: 'Abbie A',
    quote:
      'Kenny wallpapered my baby’s nursey with such short notice and has done an absolutely amazing job! It’s so neat and he left no mess whatsoever…',
    source: 'unsourced',
    date: null,
    url: null,
    context: 'Nursery wallpapered',
  },
  {
    name: 'Nikki K',
    quote:
      'Fantastic work painting our bathroom. So neat and fresh! thank you so much to Kenny at K.H Decorating. It looks amazing.',
    source: 'unsourced',
    date: null,
    url: null,
    context: 'Bathroom',
  },
  {
    name: 'Sarah J',
    quote:
      'Kenny painted my hall stairs and landing he did a amazing Job very professional , reliable and hard working !…',
    source: 'unsourced',
    date: null,
    url: null,
    context: 'Hall, stairs and landing',
  },
  {
    name: 'Phil C',
    quote:
      'Fantastic standard of work. High quality & a professional finish. Clean and tidy. Thanks Kenny',
    source: 'unsourced',
    date: null,
    url: null,
  },
  {
    name: 'Janette A',
    quote:
      '…He is such a clean professional worker and I am over the moon with the beautiful finish he has done in all rooms.…',
    source: 'unsourced',
    date: null,
    url: null,
    context: 'Kitchen, dining room, conservatory, bedroom and bathroom',
  },
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
