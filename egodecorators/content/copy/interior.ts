/**
 * /interior — the bread and butter.
 *
 * The point of difference here is scale: they will genuinely come out for one
 * ceiling. Most firms will not, and say so only after you have rung them.
 */

export const interior = {
  title: 'Interior decorating',
  standfirst:
    'One room or the whole house. Walls, ceilings, woodwork and papering — and yes, we will come out for a single stained ceiling.',

  comparison: {
    project: 'hall-stairs-and-landing',
    eyebrow: 'Hall, stairs and landing',
    before: 'Dated two-tone walls, dark and closed in',
    after: 'One colour throughout, the whole run opened up',
  },

  /** What the job actually is, room by room. */
  work: {
    heading: 'What we do',
    items: [
      {
        title: 'Walls and ceilings',
        body: 'Filled, sanded, and cut in by hand rather than taped. Ceilings done first, walls after, so nothing lands on finished work.',
      },
      {
        title: 'Woodwork',
        body: 'Skirtings, architraves, doors and stairs. Rubbed down, any gaps between timber and plaster caulked, and finished in a hard-wearing eggshell or satin rather than something that stays soft and marks.',
      },
      {
        title: 'Papering',
        body: 'Feature walls and whole rooms, including the lining that most of the failures on papered walls come back to.',
      },
      {
        title: 'Stains and small repairs',
        body: 'A water mark on a kitchen ceiling, a patch after a leak, a wall made good after somebody has taken a radiator off. Stain-blocked properly first, or it will come back through however many coats go over it.',
      },
    ],
  },

  /** Halls, stairs and landings — the job they clearly do a lot of. */
  hallways: {
    heading: 'Halls, stairs and landings',
    body: [
      'It is the job we get asked for most, and the one people put off longest, because it is the hardest room in the house to work in and the hardest to live without.',
      'It is usually two storeys of wall meeting at an angle over a staircase, which means proper access rather than a ladder propped on a step, and it is nearly always the darkest space in the house. Taking a dated lower half off the walls and running one colour from the front door to the top landing changes the feel of the whole house more than any single room does.',
      'We work it so you can still get up and down it. Nobody gets shut out of their own bedroom.',
    ],
  },

  cta: {
    heading: 'One room, or all of them',
    body: 'Tell us which rooms and roughly when, and we will come out and price it.',
  },
} as const;
