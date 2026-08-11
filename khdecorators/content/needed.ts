/**
 * The register of open questions.
 *
 * Every `{{PLACEHOLDER}}` used anywhere in /content has an entry here saying what
 * it is, why it matters and who can answer it. This file is the source for
 * CONTENT-NEEDED.md and for `npm run check:launch`, which exits non-zero while any
 * blocking item is unanswered — so the site cannot be launched with `{{TOWN}}` in
 * nine page titles by accident.
 *
 * `blocking: true` means it must be resolved before the domain is pointed at this
 * build. `blocking: false` means the site is honest and launchable without it, and
 * it should be chased afterwards.
 */

export type NeededItem = {
  /** The placeholder token, or a short id where it is not a token. */
  token: string
  /** What we are asking for, in the words you would use on the phone. */
  ask: string
  /** Why it matters. Written so a non-developer can see the cost of not having it. */
  why: string
  /** Where it appears once answered. */
  appears: string
  blocking: boolean
  /** Who can answer it. */
  from: 'Kenny' | 'Google Ads account' | 'Google Business Profile' | 'Yell'
}

export const needed: NeededItem[] = [
  /* ---------------------------------------------------------------- *
   * Blocking — the site should not go live without these
   * ---------------------------------------------------------------- */
  {
    token: '{{TOWN}}',
    ask: 'Which town are you based in, and which town do you want to be found for?',
    why: 'The old site names no place at all across six pages. This one word goes in nine page titles, in the first sentence of the home page, and in the structured data. It is the single biggest fix on the project and it is also the cheapest.',
    appears: 'Every page title and description, home page §01, /about, /contact, JSON-LD',
    blocking: true,
    from: 'Kenny',
  },
  {
    token: 'areas.towns',
    ask: 'Name the towns you would actually drive to on a Tuesday. Six or eight, not thirty.',
    why: 'Ads money is currently being spent on clicks from anywhere in the north west, including places he would turn down. A real list lets the campaign be targeted and gives Google something local to match against.',
    appears: 'Home page §06, /contact, JSON-LD areaServed',
    blocking: true,
    from: 'Kenny',
  },
  {
    token: 'reviews',
    ask: 'The real reviews, transcribed word for word from Yell, Google and the old site — with the names and dates as published.',
    why: 'They are already collected and they are the strongest thing he has. They cannot be written for him: an invented testimonial is a lie to the next customer and a structured-data violation. See the top of /content/reviews.ts for exactly how to transcribe them.',
    appears: 'Home page §05, /reviews',
    blocking: true,
    from: 'Kenny',
  },
  {
    token: 'business.name',
    ask: 'Confirm the exact trading name. KH Decorators, KH Painting and Decorating, or K.H Decorating?',
    why: 'All three appear on the current site and the reviews add more. Google cannot tell they are one business, so the local signal is split three ways. Pick one and it goes on the site, the Ads account, the Google profile and Yell.',
    appears: 'Everywhere, plus the JSON-LD name',
    blocking: true,
    from: 'Kenny',
  },
  {
    token: 'ADS_CONVERSION_LABELS',
    ask: 'Access to the Google Ads account, so the existing conversion actions can be found and their send_to labels copied.',
    why: 'The tag AW-11172797357 is live and has conversion history behind it. If the new form gets a NEW conversion action instead of being mapped to the existing one, smart bidding restarts its learning from zero and performance drops for weeks. This is the most expensive mistake available on this project. See ADS-MIGRATION.md §1.',
    appears: 'Environment variables — see .env.example',
    blocking: true,
    from: 'Google Ads account',
  },

  /* ---------------------------------------------------------------- *
   * Non-blocking — launch without them, chase them straight after
   * ---------------------------------------------------------------- */
  {
    token: 'photographs',
    ask: 'Photographs of spray work, at full resolution, off the phone or camera they were taken on — UPVC and garage doors above all.',
    why: 'The annotated photograph is the signature device of this design, and /spraying is the page paid traffic is meant to land on. Until there are spray photographs, those slots render as marked empty frames. Do not save them off the old site: googleusercontent.com serves resized copies and they will look soft at this size.',
    appears: 'Home page §02, /spraying, /dustless-sanding, every service page',
    blocking: false,
    from: 'Kenny',
  },
  {
    token: '{{TIME_SERVED}}',
    ask: '"Time served" — what does that mean for you? Which apprenticeship, where, and finishing when?',
    why: 'It is a real trade term and worth keeping, but on its own it is vague. "Four-year apprenticeship, finished 2006" is a fact a customer can weigh. It is also the honest version of the qualifications question.',
    appears: 'Home page §01, /about',
    blocking: false,
    from: 'Kenny',
  },
  {
    token: '{{YEARS_TRADING}}',
    ask: 'How long have you been working for yourself?',
    why: 'The current copy says nothing verifiable about experience. This is the one number customers actually look for.',
    appears: '/about',
    blocking: false,
    from: 'Kenny',
  },
  {
    token: '{{QUALIFICATIONS}}',
    ask: 'Any certificates — NVQ, City & Guilds, spray training, PASMA or IPAF for towers?',
    why: 'Spray training and access tickets are worth naming on a page selling spray work, particularly for commercial enquiries.',
    appears: '/about',
    blocking: false,
    from: 'Kenny',
  },
  {
    token: '{{INSURANCE}}',
    ask: 'Public liability insurance — insurer and cover amount?',
    why: 'Commercial and industrial customers ask before they enquire. Having it stated on the page removes a phone call and wins the work that requires it.',
    appears: 'Home page §01, /about',
    blocking: false,
    from: 'Kenny',
  },
  {
    token: '{{HOURS}}',
    ask: 'What hours do you want to be rung on, and do you take calls at weekends?',
    why: 'Stops the Ads budget generating calls at times he cannot answer, and stops customers assuming he is ignoring them.',
    appears: 'Home page §01, /contact',
    blocking: false,
    from: 'Kenny',
  },
  {
    token: '{{TRAVEL_RADIUS}}',
    ask: 'How far will you travel, and does spray work justify a longer drive than a repaint?',
    why: 'Sets the geographic radius on the Ads campaign, which is a direct saving.',
    appears: 'Home page §06, /contact',
    blocking: false,
    from: 'Kenny',
  },
  {
    token: '{{GUARANTEE_SPRAY}} / {{GUARANTEE_UPVC}}',
    ask: 'Do you offer a guarantee on sprayed work, and for how long?',
    why: 'It is the commonest objection to sprayed UPVC — "will it peel?" — and a stated guarantee answers it in four words on the page that sells it.',
    appears: '/spraying specification tables',
    blocking: false,
    from: 'Kenny',
  },
  {
    token: '{{DAYS_*}} / {{HOURS_FEATURE_WALL}}',
    ask: 'Rough durations: a house of UPVC windows, a single garage door, a kitchen of doors, a three-bed interior, a semi outside, a feature wall.',
    why: 'Every specification table on the site has a duration row. "How long will you be here?" is one of the top three questions a customer has, and answering it on the page removes friction before the enquiry.',
    appears: 'Specification tables on /spraying and every service page',
    blocking: false,
    from: 'Kenny',
  },
  {
    token: '{{DUSTLESS_SYSTEM}}',
    ask: 'Which sander and extractor do you use — make and model?',
    why: 'Naming the kit is the difference between a claim and a fact on the dustless sanding page. Decorators who know the brands will recognise it, and so will commercial customers.',
    appears: '/dustless-sanding specification table',
    blocking: false,
    from: 'Kenny',
  },
  {
    token: '{{GOOGLE_BUSINESS_PROFILE_URL}}',
    ask: 'Do you have a Google Business Profile, and do you have the login for it?',
    why: 'A named Google review exists, so a profile almost certainly does. It needs to be a service-area business rather than a home address, linked both ways with the site, and it is where the /leave-a-review page sends customers. Without it the review button has nowhere to point.',
    appears: 'JSON-LD sameAs, /leave-a-review',
    blocking: false,
    from: 'Google Business Profile',
  },
  {
    token: '{{YELL_LISTING_URL}}',
    ask: 'The Yell listing URL, where the 2021–22 reviews live.',
    why: 'It is where the older reviews can be linked to and verified, and it is the second link on /leave-a-review.',
    appears: 'JSON-LD sameAs, /reviews, /leave-a-review',
    blocking: false,
    from: 'Yell',
  },
]

export const blockingItems = (): NeededItem[] => needed.filter((n) => n.blocking)
