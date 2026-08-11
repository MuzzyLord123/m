/**
 * Single register of everything the client still has to confirm or supply.
 *
 * Nothing in this file is invented. Where a value is `null` the site renders
 * around the gap rather than guessing — the Checkatrade link, for example,
 * simply does not appear until a real profile URL is pasted in below.
 *
 * Every entry here is written out as a plain question in CONTENT-NEEDED.md.
 */

export type TodoEntry = {
  /** Grep token: search the repo for "{{TODO" to find every open item. */
  token: string
  /** The question, as it would be asked over the phone. */
  question: string
  /** Filled-in value, or null while it is still outstanding. */
  value: string | null
}

export const todos = {
  checkatradeUrl: {
    token: '{{TODO: Checkatrade profile URL}}',
    question:
      'What is the web address of your Checkatrade profile? Open your profile, copy the address from the browser bar, and send it over.',
    value: null,
  },
  siteUrl: {
    token: '{{TODO: live domain}}',
    question: 'What domain is the site going live on?',
    value: process.env.NEXT_PUBLIC_SITE_URL ?? null,
  },
  enquiryDestination: {
    token: '{{TODO: where enquiries go}}',
    question:
      'When somebody fills the form in, where should it land — a text to your mobile, or an email address? If email, which address?',
    value: null,
  },
  googleProfileUrl: {
    token: '{{TODO: Google Business Profile URL}}',
    question:
      'What is the web address of your Google Business Profile? The reviews are on the site, and a link to the profile lets anybody check they are real. Until you send it there is no link for them to follow.',
    value: null,
  },
  truncatedReviews: {
    token: '{{TODO: full text of two reviews}}',
    question:
      'Two reviews were cut off by Google’s "More" link in the screenshots — Lee Penney’s and Sue Jones’s. Open each one on your profile, tap More, and send the full wording so they are not shown half-finished.',
    value: null,
  },
  tradingNameSpelling: {
    token: '{{TODO: F.A.S or F.A.S.}}',
    question:
      'Your Google profile says "F.A.S. Painter & Decorator" with a full stop after the S and an ampersand; the site says "F.A.S Painter and Decorator". Which is right? They should match everywhere.',
    value: null,
  },
  firstName: {
    token: '{{TODO: use your first name?}}',
    question:
      'Your customers call you Fardin, and one calls you Fas. Do you want the site to use your first name — "Fardin" — anywhere, or keep it to the trading name? At the moment it only appears where a customer wrote it in their own review.',
    value: null,
  },
} satisfies Record<string, TodoEntry>

/** Convenience: the Checkatrade profile URL, or null if we do not have it yet. */
export const checkatradeUrl: string | null = todos.checkatradeUrl.value

/**
 * The Google Business Profile the reviews were left on. Null until the client
 * sends it, in which case no "read them on Google" link is rendered — a review
 * nobody can go and verify should at least not pretend to be linkable.
 */
export const googleProfileUrl: string | null = todos.googleProfileUrl.value
