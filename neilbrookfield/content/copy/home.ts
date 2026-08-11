/**
 * Home page copy. Neil's first person throughout.
 * Order is fixed by the brief: hero → what he's known for → three projects →
 * the 1990 story → the three reviews → enquiry.
 */

export const home = {
  meta: {
    title: 'Neil Brookfield — Decorator & hand-painted kitchens, Chester',
    description:
      "I'm Neil Brookfield, a decorator in Chester. I hand-paint kitchens and furniture and decorate houses inside and out across Cheshire. Trading on my own account since 1990.",
  },

  hero: {
    eyebrow: 'Decorator · Chester and Cheshire',
    heading: 'Kitchens painted by hand, in Chester.',
    lede: "I'm Neil Brookfield. I've decorated houses around Chester since 1990, and hand-painted kitchens and furniture for most of that. It's a slow way to work and it's the only way I've found that still looks right in five years.",
  },

  knownFor: {
    eyebrow: 'What I get asked for',
    items: [
      {
        heading: 'Hand-painted kitchens and furniture',
        body: 'Doors off and labelled, everything degreased, filled and flatted, then built back up in thin coats. It takes days before any colour goes on. That is the part you pay for.',
        href: '/hand-painted-kitchens',
        linkLabel: 'How I paint a kitchen',
      },
      {
        heading: 'Decorating, inside and out',
        body: 'Walls and woodwork, paper hung, plaster made good, lightweight coving run in. Outside, rotten window frames get cut out and spliced rather than filled and hoped for.',
        href: '/decorating',
        linkLabel: 'The wider work',
      },
      {
        heading: 'Saturdays, one to one',
        body: "If you would rather do it yourself and nobody has ever shown you how, I'll come to your house on a Saturday and show you. Prep, papering, painting furniture, what to buy.",
        href: '/workshops',
        linkLabel: 'Saturday sessions',
      },
    ],
  },

  work: {
    eyebrow: 'Recent work',
    heading: 'Three jobs, in some detail.',
    link: { href: '/work', label: 'See all the work' },
  },

  story: {
    eyebrow: 'Since 1990',
    heading: 'I served my time in hotels.',
    body: "Eight years on luxury bedrooms before I went out on my own in 1990 — the sort of rooms where a bad line shows from the doorway. An interior designer here in Chester taught me early on that the paint is the easy part, and that the preparation decides how a job looks years later. I have a small team now, taught the same way, and taught to leave a house tidier than they found it.",
    link: { href: '/about', label: 'The longer version' },
  },

  reviews: {
    eyebrow: 'From Google',
    heading: "Three people who've had me in.",
  },

  enquiry: {
    eyebrow: 'Arrange a visit',
    heading: 'Tell me about the job.',
    body: "I would rather come and look at it than quote off a description. If you have photographs, send them — I can tell more from a photograph of a window sill than from a paragraph about it.",
  },
} as const;
