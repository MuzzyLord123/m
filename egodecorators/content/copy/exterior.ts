/**
 * /exterior — the other half of the bread and butter.
 *
 * Distinct from /repairs: this is the painting. /repairs is what happens when
 * the timber underneath it has gone. Each page points at the other rather than
 * repeating it.
 */

export const exterior = {
  title: 'Exterior decorating',
  standfirst:
    'Whole houses and single elevations, on the Wirral coast where the weather comes in off the Dee and finds every gap you left.',

  comparison: {
    project: 'external-masonry-and-windows',
    eyebrow: 'Exterior · masonry and windows',
    before: 'Discoloured render, paint gone from the frames',
    after: 'Walls brought back, windows in a warm brown',
  },

  work: {
    heading: 'What we take on outside',
    items: [
      {
        title: 'Render, pebbledash and masonry',
        body: 'Washed down, cracks cut out and filled, and painted in a masonry paint that will move with the wall instead of sitting on it and flaking.',
      },
      {
        title: 'Windows, doors and cills',
        body: 'Prepared, repaired where the timber has gone, and finished. Where the wood is soft rather than just bare, it goes onto the repairs page before it goes onto this one.',
      },
      {
        title: 'Soffits, fascias and barge boards',
        body: 'The first thing on a house to fail and the last thing anyone looks at. Boards replaced where they have split or gone soft, everything primed on all faces.',
      },
      {
        title: 'Rainwater goods and metalwork',
        body: 'Gutters, downpipes, railings and gates. Rust taken back and treated, not painted over, because paint over rust is just a slower way of watching it rust.',
      },
    ],
  },

  /** Weather. Local, specific, and true — this is a coastal patch. */
  weather: {
    heading: 'Weather, and when we will not paint',
    body: [
      'A house in Parkgate facing the estuary takes salt air and a prevailing south-westerly for its whole life. It will not hold paint as long as the same house two streets back, and pretending otherwise is how you end up with a customer who thinks you did a bad job.',
      'We do not put finish on when it is going to be damp before it has gone off, when the surface is in full sun and the paint is skinning before it has levelled, or below about eight degrees. That is why exterior work gets planned for the part of the year it will actually last, and why we will sometimes tell you to wait until spring.',
    ],
  },

  cta: {
    heading: 'Have a look at the bottom corners',
    body: 'The bottom of the frames and the ends of the cills are where it starts. Send us a photograph of those and we can tell you a lot before we come out.',
  },
} as const;
