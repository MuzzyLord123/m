/**
 * /contact.
 *
 * The old site's contact details were the most broken thing on it: a footer
 * mailto missing its .com, and a phone number nobody had checked. Here there is
 * one phone constant and one email constant, both imported from content/site.ts
 * and both asserted at build time.
 */

export const contact = {
  title: 'Get a price',
  standfirst:
    'Ring, or send a photograph of what needs doing. Exterior woodwork especially — a close-up of the bad corner tells us more than a paragraph will.',

  /** What to include, so the first reply is useful rather than a list of questions. */
  helpful: {
    heading: 'What helps us price it',
    items: [
      'Which rooms, or which elevations of the house.',
      'A photograph of anything that looks soft, split or stained.',
      'Roughly when you want it done, and anything that fixes the date.',
      'Whether anyone will be living or working in it while we are there.',
    ],
  },

  /** Working hours and response time — unconfirmed, so not published. */
  hours: null as string | null,

  /** Rendered beside the form. */
  direct: {
    heading: 'Or just ring',
    body: 'If it is easier to say it than type it, ring. If nobody picks up we are up a ladder — leave a message and you will get a call back.',
  },
} as const;
