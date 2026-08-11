/**
 * /capabilities — the full schedule, plus the detail on the three specifications
 * that separate this firm from a decorator: steelwork, floors and roofs.
 *
 * A note on how these are written. Everything below describes what the work
 * involves and what a specification will ask for — surface preparation grades,
 * coat build, dry film thickness, cure times. All of it is public standard
 * practice and it is written so a client's surveyor can see we know what they
 * are going to send us.
 *
 * What is NOT written below: a claim that the company is approved by, trained
 * by or accredited to any manufacturer or standard. That is a different
 * sentence and it does not get written until Sean says it. See
 * content/needed.json#coating-systems.
 */

export const capabilities = {
  meta: {
    title:
      'Painting capability schedule — steelwork, floors, roofs & decoration | McDonald Painting Contractors',
    description:
      'The full schedule of works: internal and external decoration, steelwork painting, floor and roof coatings, joinery and rot repairs, gutter cleaning, and what can be placed on a programmed contract.',
  },

  sheet: {
    title: 'Capability schedule',
    standfirst:
      'Everything we are set up to do, what it is applied to, and whether it belongs on a programme or is priced as it arises. Where a client or their surveyor issues a specification, we work to it; where there is no specification, the notes below are what we would propose and why.',
  },

  table: {
    title: 'Schedule of works',
    note: 'Sectors listed are where the work most often falls, not a limit on where it is available.',
  },

  sections: [
    {
      id: 'steelwork',
      number: '01',
      title: 'Steelwork painting',
      body: [
        'Structural steel, portal frames, gantries, walkways, handrails, plant, tanks and pipework. On an occupied industrial site this is usually the job that has to be done around production rather than instead of it, so most of it happens on shutdowns, night shifts and weekends.',
        'A steelwork specification is mostly a specification for preparation, not for paint. The grade of cleaning required is what decides the life of the coating, and it is what the specification should state — hand and power tool cleaning grades are set out in BS EN ISO 8501-1, and the difference between St 2 and St 3 is the difference between a coating that lasts a cycle and one that does not. If your specification names a grade, we work to it. If it does not, we will tell you what the steel in front of us needs before we price it.',
        'Above the preparation, the questions are the same every time and worth settling before anyone orders paint: what is the existing coating and does the new system tolerate it; is there a primer, an intermediate build coat and a finish, or is this a single-coat maintenance overcoat; what dry film thickness is required and how is it being checked; what are the cure and overcoat windows, and will the building be warm enough to meet them at the time of year you want the work done.',
      ],
      confirm: 'coating-systems',
      confirmNote:
        'Which coating systems and manufacturers the team has applied, and which preparation grades it is equipped for.',
    },
    {
      id: 'floors',
      number: '02',
      title: 'Floor painting',
      body: [
        'Warehouse, workshop and plant room floors, walkways, bay markings and hatched areas. Floor coatings fail for two reasons and neither of them is the paint: moisture coming up through the slab, and contamination that was never fully removed. Both are found before the job is priced, not after it is laid.',
        'What a floor job needs settled in advance: whether the slab has a damp-proof membrane and what a moisture test says; what has been spilt on it and for how long; whether the existing coating is sound enough to overcoat or has to come off; how the surface is being prepared — grinding, shot blasting or acid etching, each with a different amount of dust and noise attached; and how long the area can be out of use, because the cure time is the constraint on almost every industrial floor, not the application.',
        'Traffic is the other half of the brief. A floor taking pedestrians is a different specification from one taking counterbalance forklifts, and a coating chosen for the wrong one will look finished and then fail in a year.',
      ],
      confirm: 'coating-systems',
      confirmNote: 'Floor systems held, and whether preparation plant is owned or hired in.',
    },
    {
      id: 'roofs',
      number: '03',
      title: 'Roof coatings and roof repairs',
      body: [
        'Profiled metal sheet roofs, roof light surrounds, flashings and gutters. Coating an industrial roof is normally the cheap alternative to replacing one, and whether it is the right alternative is a survey question — a roof with failed fixings, split sheets or corroded gutter lines needs those put right first, and a coating applied over them buys a year rather than a decade.',
        'This is work at height on a fragile surface, so the access and the fall-arrest arrangements are settled before anything else. Where a roof cannot be safely accessed, we say so rather than pricing around it.',
        'Roof and gutter work is also where a maintenance programme earns its money. Clearing gutters and hoppers annually and dealing with a failed lap while it is a failed lap is materially cheaper than the internal decoration that follows water getting in.',
      ],
    },
    {
      id: 'joinery',
      number: '04',
      title: 'Joinery and rot repairs',
      body: [
        'Windows, doors, frames, cills, fascias and soffits, made good before they are painted. External joinery on a school or an older commercial building is usually the reason the decoration failed early: paint applied over wet or rotted timber comes off on the schedule the timber decides, not the one in the contract.',
        'On a survey we mark up what needs cutting out and splicing, what can take a resin repair, and what has gone too far and should be replaced as joinery rather than patched as decoration. That last category is worth knowing about before the scaffold goes up, not after.',
      ],
    },
    {
      id: 'programmed',
      number: '05',
      title: 'Programmed and maintenance contracts',
      body: [
        'The commercial half of the business: multi-year painting cycles across a building or an estate, and reactive maintenance painting against an agreed schedule of rates. Scoping, phasing, pricing and reporting are set out in full on the programmed maintenance page.',
      ],
      cta: { label: 'Programmed maintenance', href: '/programmed-maintenance' },
    },
  ],

  /* The FAQ page is retired. These were the questions on it that were worth
     keeping, answered where they arise instead of behind an accordion. */
  answered: {
    title: 'Questions that used to be on the FAQ page',
    items: [
      {
        q: 'Do you work outside Cheshire?',
        a: 'Yes. Commercial and industrial contracts are taken across the United Kingdom. Domestic and smaller commercial work is served from Chester, the Wirral, North Wales and Manchester, where a team can get to site and back in a day.',
      },
      {
        q: 'Can you work while the building is occupied?',
        a: 'Most of our work is in occupied buildings. What that costs in programme is set out sector by sector — term time and holidays for schools, shutdowns and shift patterns for industry, trading hours for shops and restaurants.',
      },
      {
        q: 'Do you provide method statements and risk assessments?',
        a: 'Yes, site-specific, before work starts, and reissued for each phase of a programmed contract rather than written once and filed.',
      },
      {
        q: 'Are you insured, and can we see the certificates?',
        a: 'The company is fully insured and SafeContractor approved. Limits, certificate numbers and expiry dates are on the compliance page so they can be forwarded to whoever needs them without asking us first.',
      },
    ],
  },
} as const;
