/**
 * /commercial — offices, warehouses, churches and care homes.
 *
 * The argument on this page is not "we also do commercial". It is that a
 * commercial job is mostly a logistics problem: the building has people in it
 * and it is not going to close for you.
 */

export const commercial = {
  title: 'Working around a business that cannot stop',
  standfirst:
    'Offices, warehouses, churches and care homes. The painting is the easy half — the job is fitting it around people who still have to work, worship or live there while you do it.',

  comparison: {
    project: 'reagent-offices-and-warehouse',
    eyebrow: 'ReAgent · offices and warehouse',
    before: 'Occupied offices, tired walls, nothing moved out',
    after: 'Feature wall and durable white matt throughout',
  },

  /** How the working-around actually happens. Specific, not reassuring. */
  how: {
    heading: 'How we fit around you',
    items: [
      {
        title: 'In phases, by room',
        body: 'Nobody has to clear a whole floor. We take one area at a time, get it finished and handed back, then move on — so there is always somewhere for people to sit.',
      },
      {
        title: 'Out of hours where it has to be',
        body: 'Evenings, weekends and shutdowns. A warehouse floor is easier at six on a Sunday morning than at eleven on a Tuesday, and the price of the awkward hours is usually less than the price of the disruption.',
      },
      {
        title: 'Round the things that cannot move',
        body: 'Racking, machinery, stock, server cabinets, a piano. We sheet them, cut in around them and work over the top. We would rather do that than ask you to shift something you have nowhere to shift to.',
      },
      {
        title: 'Finishes chosen for the traffic',
        body: 'A corridor in a care home and a warehouse wall want a paint that will take being scrubbed and scuffed. We use durable matts and eggshells that keep their colour when they are washed, not the cheapest tin that covers.',
      },
    ],
  },

  /** The kinds of premises, with what is different about each. */
  premises: {
    heading: 'Where we have worked',
    items: [
      {
        title: 'Offices',
        body: 'Occupied, usually. Low odour paints, cabling and desks worked around, and the noisy preparation done when the floor is empty.',
      },
      {
        title: 'Warehouses and industrial units',
        body: 'Height, racking and a floor that is still moving stock. Access equipment where the ladders will not reach it safely.',
      },
      {
        title: 'Churches',
        body: 'Big volumes, awkward access and a building that is in use every week. Work planned around the services rather than the other way round.',
      },
      {
        title: 'Care homes',
        body: 'Residents in the rooms next door, sometimes in the room. Quiet, tidy, dust kept down, and the same manners the reviews on this site are actually about.',
      },
    ],
  },

  /** Insurance and paperwork — the thing commercial clients ask before price. */
  paperwork: {
    heading: 'Insurance and paperwork',
    /** Rendered only once needed.json#insurance is answered. */
    body: null as string | null,
  },

  cta: {
    heading: 'Tell us what the building has to keep doing',
    body: 'When the work can happen matters more than what the walls need. Tell us the hours you cannot lose and we will price it around them.',
  },
} as const;
