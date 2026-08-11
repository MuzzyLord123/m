/**
 * /decorating — the wider work: interiors, exteriors, paper, plaster, coving,
 * exterior woodwork repair, and paint effects.
 */

export const decorating = {
  meta: {
    title: 'Decorating in Chester — interiors, exteriors, wallpaper | Neil Brookfield',
    description:
      'Interior and exterior decorating around Chester and Cheshire: walls and woodwork, wallpaper hung, plaster made good, lightweight coving, rotten window frames cut out and repaired before painting.',
  },

  eyebrow: 'Decorating',
  heading: 'The rest of the house.',
  lede: 'Kitchens are what I am known for, but most weeks are ordinary decorating: rooms, hallways, staircases, the outside of a house before winter. It is the same order of work — everything that matters happens before the topcoat.',

  services: [
    {
      eyebrow: 'Interiors',
      heading: 'Walls, woodwork and ceilings',
      paragraphs: [
        'Filled, caulked, sanded and cut in by hand. Old gloss on skirting and architrave gets flatted back properly rather than painted over, because the shine underneath is what makes a new coat peel at the edges two winters later.',
        'On period rooms in and around Chester there is usually something underneath — distemper, a dozen coats of gloss, a wall that has been papered over four times. I would rather find that on day one than on the day the furniture is due back in.',
      ],
    },
    {
      eyebrow: 'Exteriors',
      heading: 'Outside, and what is under the paint',
      paragraphs: [
        'Exterior work is mostly repair with painting at the end of it. Rotten sections of window frame and sill get cut out and spliced with new timber rather than filled and hoped for — filler in a rotten sill is a two-year fix at best, and you pay for the whole job again.',
        'Then it is back to bare where it needs to be, knots treated, primed, and finished in coats thin enough to cure. Done in the right months, in weather that will let it dry.',
      ],
    },
    {
      eyebrow: 'Wallpaper',
      heading: 'Hanging paper',
      paragraphs: [
        'Walls sized and made flat first — paper does not hide a bad wall, it lights it up. Patterns set out so the drop that matters falls where the eye goes, and joins kept off the corners of a chimney breast where the wall is never quite plumb.',
        'Heavy and hand-printed papers included, which are less forgiving and want more time on the table than on the wall.',
      ],
    },
    {
      eyebrow: 'Plaster and coving',
      heading: 'Making good, and lightweight coving',
      paragraphs: [
        'Cracks raked out and filled properly, patches of blown plaster taken off and made good, so the wall is flat before anything decorative goes near it.',
        'Lightweight coving run in where a room wants finishing off at the top — mitres cut on site, joints filled and sanded so it reads as one length rather than several.',
      ],
    },
    {
      eyebrow: 'Paint effects',
      heading: 'Effects, where the room asks for them',
      paragraphs: [
        'Ageing, dragging, and broken-colour work on furniture and joinery — the sort of finish that is meant to look like it has been there longer than it has. It is occasional work and it is worth doing badly never, so it gets sampled on a board first and looked at in the room.',
      ],
    },
  ],

  how: {
    eyebrow: 'How it goes',
    heading: 'What a week with us in the house is like.',
    points: [
      'Floors covered before anything is carried in, every day, not just the first.',
      'Furniture moved and sheeted by us, and moved back.',
      'Dust kept down — sanders on extraction where they can be, doors closed, the mess cleared at the end of each day rather than the end of the job.',
      'You get told what is happening tomorrow before we leave today.',
    ],
  },
} as const;
