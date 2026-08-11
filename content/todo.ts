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
} satisfies Record<string, TodoEntry>

/** Convenience: the Checkatrade profile URL, or null if we do not have it yet. */
export const checkatradeUrl: string | null = todos.checkatradeUrl.value
