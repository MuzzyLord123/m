/**
 * Home page copy.
 *
 * Order is fixed by the design: wordmark, first comparison, the repair
 * specialism, the commercial comparison, services, two reviews, area, enquiry.
 *
 * Nothing here would survive a find-and-replace of the company name. If a
 * sentence would sit just as happily on another decorator's site, it is cut.
 */

export const home = {
  /** Under the wordmark. What they do and where, in one line. */
  standfirst:
    'We repair and paint the outside of buildings, and decorate the inside of them. Neston, and out across Cheshire, the Wirral and Flintshire.',

  /** The first comparison. Full width, seam as the handle. */
  leadComparison: {
    project: 'external-masonry-and-windows',
    eyebrow: 'Exterior · masonry and windows',
    /** What was wrong, then what was done. Metadata type, both sides. */
    before: 'Flaking window paint, discoloured masonry',
    after: 'Woodwork made good and repainted, walls brought back',
  },

  /** The repair specialism. Three sentences, and no more than three. */
  specialism: {
    heading: 'We repair it first',
    body: [
      'Most decorators will paint what you put in front of them. Rotten window bottoms, split fascia boards and soffits that have been soaking up water behind the gutter for years get filled over, painted, and look well for a season.',
      'We cut the soft timber out, splice new wood in, prime the bare edges and the end grain, and then paint it.',
      'It costs more on the day and it lasts years longer, which is the entire argument.',
    ],
    link: { href: '/repairs', label: 'What we do to rotten woodwork' },
  },

  /** The second comparison, positioned as commercial proof. */
  commercialComparison: {
    project: 'reagent-offices-and-warehouse',
    eyebrow: 'Commercial · offices and warehouse',
    before: 'Tired office walls, live working floor',
    after: 'Repainted throughout, nobody sent home',
    /** The point being made, in one line above the comparison. */
    lead:
      'ReAgent asked us to paint three small offices. By the time we finished they had us do the rest of the offices and the warehouse as well — around their staff, their stock and their working day.',
    link: { href: '/commercial', label: 'Working around a business that cannot stop' },
  },

  /** Services, split across the seam. Left column, then right. */
  services: {
    heading: 'What we take on',
    items: [
      {
        title: 'Exterior repair and painting',
        body: 'Windows, doors, cills, soffits, fascias and barge boards. Rotten timber cut out and spliced, filled, primed and finished. Masonry brought back.',
        href: '/repairs',
      },
      {
        title: 'Exterior decorating',
        body: 'Whole houses and single elevations. Render and pebbledash, timber, metalwork and rainwater goods, on ladders or a tower where the height needs it.',
        href: '/exterior',
      },
      {
        title: 'Interior decorating',
        body: 'One room or a whole house. Walls, ceilings, woodwork and papering — and a stain on a kitchen ceiling if that is genuinely all you need.',
        href: '/interior',
      },
      {
        title: 'Commercial and industrial',
        body: 'Offices, warehouses, churches and care homes. Out of hours where the work cannot happen during the day, and in phases where it can.',
        href: '/commercial',
      },
    ],
  },

  /** The area. Plain, no map graphic, no invented radius. */
  area: {
    heading: 'Where we work',
    body: 'We are based in Neston and work across Cheshire, the Wirral and Flintshire — Neston, Parkgate, Willaston, Heswall, West Kirby, Chester and the villages between them. If you are near the edge of that, ring and ask.',
  },

  /** The enquiry block at the foot. */
  enquiry: {
    heading: 'Tell us what needs doing',
    body: 'A photograph of the bit you are worried about is usually enough to start with. We will tell you whether it wants repairing or replacing before we quote for painting it.',
  },
} as const;
