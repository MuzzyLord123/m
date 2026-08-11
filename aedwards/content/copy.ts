/**
 * Every word on the site that is not a review, a fact or a form label.
 *
 * Register: Andy is one man, so the copy is first person singular. Never "we",
 * never "our team", never "we pride ourselves". Short sentences, no
 * salesmanship — the reviews already did the selling and the site's job is to
 * get out of their way.
 *
 * Nothing here claims anything that is not established. What he is good at,
 * according to 34 people over ten years, is turning up, being tidy, handling
 * the awkward jobs and being asked back. That is the argument, and it is what
 * the copy says.
 */

/* ------------------------------------------------------------- field one --- */

export const intro = {
  label: 'Flint, Flintshire',
  /** Set in Bricolage 800 and stopped. There is no logo. */
  name: 'A Edwards Decorating',
  line: 'Painter and decorator, inside and out.',
} as const

/* ------------------------------------------------------------- field two --- */

export const argument = {
  label: 'How I work',
  sentence: 'I turn up when I say I will, I keep the place tidy, and I get it right.',
  /** His own listing, his own order. */
  services: [
    'Interior painting',
    'Exterior painting',
    'Wallpapering',
    'Wood finishes and staining',
    'Floor painting',
    'Protective coatings',
    'Industrial painting',
    'Domestic and commercial',
  ],
} as const

/* ------------------------------------------------------------ field four --- */

export const interior = {
  label: 'Inside',
  headline: 'Rooms, start to finish.',
  work: [
    'Walls and ceilings',
    'Woodwork, doors and skirting',
    'Wallpapering',
    'Wood finishes and staining',
    'Floor painting',
  ],
  /**
   * His own description of himself, one plain sentence, and nothing more.
   * No logo, no colour lists, nothing implying a partnership or an endorsement
   * — because there isn't one, and Farrow & Ball's name is theirs.
   */
  farrowAndBall: 'Farrow & Ball specialist.',
} as const

/* ------------------------------------------------------------- field six --- */

export const exterior = {
  label: 'Outside, and commercial',
  /**
   * The prep line. The brief puts it in field 5, alongside AndM-6's review —
   * but a review field carries the quote and nothing else, so it leads the
   * exterior field instead, where AndM-6's point about preparation is what the
   * work actually is.
   */
  headline: 'Most of it is preparation.',
  note: 'That is the part that decides how it looks in five years.',
  work: [
    'Exterior walls and render',
    'Exterior woodwork',
    'Protective coatings',
    'Industrial painting',
    'Shops and commercial premises',
  ],
} as const

/* ----------------------------------------------------------- field eight --- */

export const record = {
  label: 'On record',
  headline: 'Ten years of it, in public.',
  /** Rendered only if there is at least one confirmed credential. */
  credentialsNote: 'Confirmed and current:',
} as const

/* ------------------------------------------------------------ field nine --- */

export const area = {
  label: 'Where I work',
  headline: 'Flint, and out from there.',
  /**
   * The general statement is his own and can be published. The specific town
   * list cannot be — naming towns he does not cover is how a small local site
   * turns into spam. See content/needed.json#service-towns.
   */
  pendingTownsNote:
    'The towns are being confirmed rather than guessed. Ring and ask — if it is a reasonable drive from Flint the answer is usually yes.',
} as const

/* ------------------------------------------------------------- field ten --- */

export const photographs = {
  label: 'Work',
  headline: 'A few rooms.',
} as const

/* ---------------------------------------------------------- field eleven --- */

export const contact = {
  label: 'Get in touch',
  headline: 'Call Andy.',
  line: 'Ring or text. If I am up a ladder I will call you back.',
  form: {
    heading: 'Or leave it here',
    name: 'Your name',
    phone: 'Your phone number',
    job: 'What needs doing',
    submit: 'Send it',
    /** Shown in place of the form once it has gone. */
    sent: 'Got it. I will ring you back.',
    error: 'That did not send. Ring or text instead:',
    /** Shown instead of the form until a delivery address is configured. */
    unconfigured:
      'The form goes live once Andy has an email address set up. Until then, ring or text the number above.',
  },
} as const

/* ------------------------------------------------------------ /reviews --- */

export const reviewsPage = {
  title: 'Reviews',
  headline: 'Every one of them, with a link.',
  intro:
    'Excerpts, not copies. Each one is a few words exactly as they were written, and the link takes you to the original so you can read the rest.',
  filterLabel: 'Show',
  all: 'All',
} as const

/* ------------------------------------------------------ /leave-a-review --- */

export const leaveAReview = {
  title: 'Leave a review',
  headline: 'Thanks for having me.',
  line: 'If I have done work for you, a couple of lines helps more than anything else I could pay for. Thank you.',
} as const

/* ------------------------------------------------------------- not found --- */

export const notFound = {
  label: 'Not found',
  headline: 'Nothing here.',
  line: 'That page does not exist. The phone still works.',
} as const
