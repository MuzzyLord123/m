/**
 * Home page copy.
 *
 * The old home page said "high quality" five times, "painters and decorators"
 * in almost every sentence, and finished with "with a smile!". None of those
 * words are here. The test applied to every sentence below: would a facilities
 * manager with a building to look after learn something from reading it.
 */

export const home = {
  meta: {
    title: 'Commercial & industrial painting contractors | Cheshire & UK-wide',
    description:
      'McDonald Painting Contractors Ltd — commercial and industrial painting contracts across the UK from a base in Cheshire. Programmed maintenance, steelwork, floor and roof coatings. SafeContractor approved.',
  },

  sheet: {
    title: 'Commercial and industrial painting contractors',
    /* One paragraph. UK-wide coverage in the first sentence, because the whole
       problem with the old site was that a buyer could not tell whether this
       firm travelled or whether it painted anything larger than a hallway. */
    standfirst:
      'McDonald Painting Contractors is a family-run painting and decorating contractor taking commercial and industrial work across the United Kingdom, from a base in Cheshire. We hold long-term programmed painting contracts and maintenance contracts in factories, warehouses, offices, schools, hospitals, hotels, shops and restaurants, alongside steelwork, floor and roof coatings and the joinery and rot repairs that have to happen before any of it. Our operatives are qualified to NVQ standard and the company is SafeContractor approved, assessed by Alcumus. Most of this work is carried out in buildings that stay open while we are in them, which makes it a scheduling problem as much as a painting one.',
  },

  /**
   * The data strip. Four figures, all of them checkable.
   *
   * What is deliberately not here: years trading, operative headcount and
   * insurance limits. Those are the figures a buyer most wants, and they are
   * the three we cannot yet source — so they appear as marked questions on the
   * pages where they belong rather than as round numbers here.
   */
  figures: [
    {
      figure: 'UK',
      label: 'Coverage',
      note: 'Commercial and industrial contracts nationwide. Day-to-day work from Chester, the Wirral, North Wales and Manchester.',
    },
    {
      figure: '08',
      label: 'Sectors',
      note: 'Education, healthcare, industrial, offices, hospitality and retail, programmed maintenance, steelwork, residential.',
    },
    {
      figure: 'NVQ',
      label: 'Operatives',
      note: 'Qualified to NVQ standard, with further training funded as the work calls for it.',
    },
    {
      figure: '10402793',
      label: 'Company number',
      note: 'McDonald Painting Contractors Ltd, registered in England and Wales.',
    },
  ],

  sectorIndex: {
    title: 'What we paint, and who for',
    standfirst:
      'Eight sectors, and the differences between them are real. A school is a safeguarding and holiday-calendar problem. A production hall is an access and shutdown problem. A hotel corridor is a room-nights problem. The paint is the easy part.',
  },

  work: {
    title: 'Site records',
    standfirst:
      'A gallery shows you that we own a camera. A record tells you the sector, the scope, how long we were on site, what went on the wall and whether the building stayed open — which is what you are actually trying to find out.',
    cta: { label: 'All site records', href: '/projects' },
  },

  programmed: {
    title: 'A painting programme, not a series of quotes',
    body: [
      'A programmed contract turns redecoration from something that has to be remembered into something that happens. We survey the building or the estate once, agree a cycle for each element — internal walls on one frequency, external joinery on another, gutters annually, steelwork on whatever the coating survey says — and then phase it across the term so the spend is level and the disruption is planned instead of negotiated every time.',
      'What you get in return for committing to a term: one point of contact, a price that holds, RAMS reissued for each phase rather than each visit, and a short written report after every phase saying what was done, what was found and what should move up the order.',
    ],
    cta: { label: 'How a programme is scoped and priced', href: '/programmed-maintenance' },
  },

  compliance: {
    title: 'Compliance',
    standfirst:
      'The documents a buyer needs before an order can be raised, in one place rather than on request.',
    cta: { label: 'Compliance and accreditation', href: '/compliance' },
  },

  enquiry: {
    title: 'Enquiries',
    standfirst:
      'Three kinds of enquiry arrive here and they need different things. Tell us which one you are and it goes to the right place.',
  },
} as const;
