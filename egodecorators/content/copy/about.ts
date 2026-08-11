/**
 * /about — family run, Ted and Mario, how they work.
 *
 * The reviews on this site are about people, not about a company: customers
 * write "Edward" and "Ted" and "Mario", never "Ego Decorators". So the page is
 * about the people too.
 *
 * What we will not do is describe a team we have not had confirmed. `people` is
 * empty and the page renders a labelled frame until needed.json#team is
 * answered. There is no Mission and there are no Values.
 */

export const about = {
  title: 'Ted, Mario, and whoever else is on the van',
  standfirst:
    'A small family firm out of Neston. The reviews name the men rather than the company, which tells you most of what the company is.',

  /** Confirmed people only. See content/needed.json#team. */
  people: [] as { name: string; known: string | null; role: string }[],

  /** How the work runs, from first call to last coat. Plain sequence, no promises. */
  how: {
    heading: 'How it goes',
    items: [
      {
        title: 'You ring, or you send a photograph',
        body: 'A picture of the bit that is bothering you saves both of us a trip. If it is outside woodwork, the photograph usually tells us whether it wants filling, splicing or a joiner.',
      },
      {
        title: 'We come and look',
        body: 'Free, and we will tell you if something does not need doing yet. We would rather come back next year for the whole job than talk you into half of it now.',
      },
      {
        title: 'You get a price, in writing',
        body: 'What is included, what is not, and roughly how long we will be in the house. If we find something once the paint is off, you hear about it before we do anything about it.',
      },
      {
        title: 'We work tidy and we go home',
        body: 'Floors covered, tools off the stairs at the end of the day, and the kettle asked about rather than assumed. Somebody else lives here.',
      },
    ],
  },

  /** The register the reviews describe. Short — showing beats saying. */
  manner: {
    heading: 'The bit customers actually write about',
    body: 'Read the reviews and they are not really about paint. They are about men who turned up when they said they would, were careful in somebody’s mother’s house, and left it clean. That is the part of the job you cannot photograph, so we will let the customers say it.',
  },

  cta: {
    heading: 'Come and have a look at a job',
    body: 'If you want to see the work rather than a photograph of it, ask — there is usually something on the go within a few miles of you.',
  },
} as const;
