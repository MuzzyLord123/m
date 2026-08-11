/**
 * /about — replaces /about-mcdonald-painting-contractors/ and takes the traffic
 * from the stranded /home-m-r-painting-contractors/ page.
 *
 * Family-run is said once, plainly, and then used — because on a tender list
 * against a national contractor it is an argument, not a sentiment. Said twice
 * it turns into a decorator's website again.
 */

export const about = {
  meta: {
    title: 'About McDonald Painting Contractors Ltd | Family-run, Cheshire',
    description:
      'A family-run painting and decorating contractor based in Cheshire, working on commercial and industrial contracts across the UK. Run by Sean McDonald, with operatives qualified to NVQ standard.',
  },

  sheet: {
    title: 'About the company',
    standfirst:
      'McDonald Painting Contractors Ltd is a family business. On a commercial job that means the person who priced the work is the person who turns up to look at it, and the person you ring when something needs moving is the person who can move it. It is the one thing a national contractor cannot offer you at this size, and it is the reason most of our commercial work is repeat work.',
  },

  history: {
    title: 'The name',
    body: [
      'The company traded as M & R Painting Contractors before it became McDonald Painting Contractors Ltd, and the older name still turns up in search results and on a couple of social accounts. It is the same business, the same people and the same company number.',
    ],
  },

  people: {
    title: 'Who you deal with',
    body: [
      'Sean runs the company and prices the work. On a programmed contract he is the point of contact for the term, and on a one-off job he is the person who surveys it and the person who comes back if something is not right.',
      'Operatives are qualified to NVQ standard, and training is funded as the work requires it rather than when a certificate expires. On commercial sites that matters less as a credential and more as the reason a team can be left in an occupied building without being supervised by the client.',
    ],
    confirm: 'headcount',
    confirmNote:
      'How many operatives there are and how many teams can be put on site at once — the question behind every enquiry from a main contractor.',
  },

  method: {
    title: 'How a job runs',
    steps: [
      {
        number: '01',
        title: 'Survey',
        body: 'Someone comes and looks at it. Substrate, condition, access, and the constraint attached — occupied hours, term dates, production, trading. Nothing is priced off a photograph or a floor area alone.',
      },
      {
        number: '02',
        title: 'Written scope and price',
        body: 'A quotation that states what is included, what is excluded and what is provisional, so it can be compared with the other two you have. Where a specification has been issued, we price against it line for line rather than substituting our own.',
      },
      {
        number: '03',
        title: 'Documents before mobilisation',
        body: 'Site-specific risk assessment and method statement, COSHH assessments for the products in use, and insurance and accreditation details, sent before anyone arrives rather than on the morning.',
      },
      {
        number: '04',
        title: 'Dates that hold',
        body: 'Start and finish dates agreed against your calendar — the holiday, the shutdown, the closed period. On a programme, the phase dates are set at the beginning of the year.',
      },
      {
        number: '05',
        title: 'The work, in an occupied building',
        body: 'Areas segregated and signed, routes kept clear, and each area handed back usable at the end of the shift rather than at the end of the job.',
      },
      {
        number: '06',
        title: 'Handover, and what we found',
        body: 'A walk round with whoever is signing it off, and a note of anything found that is not decoration — rot, a failed gutter, a roof lap — because that is what decides when you are painting it again.',
      },
    ],
  },

  testimonials: {
    title: 'What clients have said',
    standfirst:
      'Two quotes, in full and attributed. A wall of anonymous praise devalues the real ones sitting next to it, so there are two here and there will be two here.',
  },

  founded: {
    confirm: 'founded',
    confirmNote:
      'The incorporation date from the Companies House record — so the site can say how long the company has been trading instead of implying it.',
  },
} as const;
