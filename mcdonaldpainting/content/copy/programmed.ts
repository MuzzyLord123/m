/**
 * /programmed-maintenance — the commercial money page.
 *
 * The reader is a facilities manager, an estates officer, a school business
 * manager or a managing agent. They are not shopping for a decorator. They are
 * trying to work out whether committing three or five years of a maintenance
 * budget to one contractor is a defensible decision, and whether the contractor
 * understands that the building has to keep working while it happens.
 *
 * So the page is written as a method: how a programme is surveyed, phased,
 * priced and reported, including the part where a programme is the wrong answer.
 */

export const programmed = {
  meta: {
    title:
      'Programmed painting maintenance contracts | McDonald Painting Contractors',
    description:
      'Multi-year painting programmes for buildings and estates: how the survey works, how elements are phased on cycles, how the price holds across the term, and what you get reported after each phase.',
  },

  sheet: {
    title: 'Programmed painting maintenance',
    standfirst:
      'A painting programme is a schedule of every paintable element in a building or an estate, each on its own cycle, phased across a term so the spend is level and the work is planned around the building rather than the other way round. It replaces the annual scramble of getting three quotes for whatever has become embarrassing.',
  },

  argument: {
    title: 'Why a programme instead of quotes',
    body: [
      'Redecoration bought a job at a time is bought at the worst possible moment: when something has failed, when it is visible, or when a budget is about to be handed back. It is priced against whoever is available that month, the specification changes every time, and nothing gets done to the parts of the building nobody walks through — which is where the expensive failures start.',
      'A programme moves the decision upstream. Every element is surveyed once, given a frequency that reflects what it is made of and what it takes, and put in an order. External joinery and rainwater goods go near the front, because water getting behind paint is what turns decoration into joinery. Circulation and back-of-house go on their own cycles rather than waiting for a complaint.',
      'The result a budget holder can defend: a known annual figure, a written record of what was done and what was found, and no year in which a single failure eats the whole line.',
    ],
  },

  stages: [
    {
      number: '01',
      title: 'Survey',
      body: 'We walk the building or the estate with whoever knows it and produce a schedule of every paintable element: substrate, current condition, existing coating where it can be identified, access required, and the constraint attached to it — occupied hours, ward or classroom use, production, trading, roof access, fixed plant. Anything that is not a painting job gets written down as well. A rotted cill or a split roof sheet is going to decide the paint cycle above it whether or not it is in our scope.',
    },
    {
      number: '02',
      title: 'Programme',
      body: 'Each element is given a cycle — the frequency it actually needs, not a single number applied to the whole building — and the cycles are then phased across the term so the annual spend is level and no year carries the whole external elevation. Where an element is in worse condition than its cycle would suggest, it is pulled into year one and rejoins the cycle afterwards. You get the programme as a schedule you can put in front of a finance committee.',
    },
    {
      number: '03',
      title: 'Price',
      body: 'Programmed work is priced per phase against the surveyed schedule, so the figure for each year is known at the start of the term rather than discovered. Reactive and as-arising work — damage, churn, hand-backs, rot found once the paint comes off — is priced against an agreed schedule of rates, so it does not need re-quoting each time and you can see what it is costing you across the year.',
      confirm: 'insurance',
      confirmNote:
        'Insurance limits, so a pre-qualification questionnaire can be answered from the site rather than by email.',
    },
    {
      number: '04',
      title: 'Report',
      body: 'After each phase you get a short written report: what was done, what was found, what was deferred and why, and what should move up the order for next year. It is two pages, not twenty, and its job is to be the thing you forward when someone asks why the line is what it is. Over a term it becomes the condition history of the building — which is worth more than the decoration by the time the term ends.',
    },
  ],

  occupied: {
    title: 'Working in a building that stays open',
    body: [
      'Almost every programmed contract is carried out in a building in use, which makes the schedule the hard part and the painting the straightforward part. What that means in practice depends on the sector — the education, healthcare and industrial pages set it out for each — but the constraints are agreed at survey stage and written into the programme rather than negotiated on the day.',
      'Where work genuinely cannot be done around occupation, it goes into the window the building already has: school holidays, a production shutdown, a closed period, or a night and weekend phase.',
    ],
    confirm: 'out-of-hours',
    confirmNote:
      'Confirmation of evening, weekend, shutdown and school-holiday working, and any limit on distance for it.',
  },

  honest: {
    title: 'When a programme is the wrong answer',
    body: [
      'A programme needs a building with enough paintable area for the cycles to be worth administering, and an owner who will still be responsible for it in three years. A single unit on a short lease, or a building with a refurbishment already funded, is better served by pricing the work in front of it.',
      'Nor does a programme fix a fabric problem. If the survey finds failed rainwater goods, standing water or a roof at the end of its life, the honest advice is to deal with that first — otherwise the programme spends its first two cycles repainting the same wall.',
    ],
  },

  needFromYou: {
    title: 'What we need from you to price a programme',
    items: [
      'Floor plans or an elevation drawing if you have them — a schedule of areas if you do not.',
      'The constraint on each area: occupied hours, term dates, shift patterns, trading hours, any area that cannot be closed at all.',
      'Who holds the asbestos register and how we get sight of it before anything is disturbed.',
      'Access arrangements: what can be reached from a tower, what needs a MEWP, what needs scaffold, and where plant can stand.',
      'The term you are contemplating, and whether the budget is annual or drawn down.',
      'Any specification your own surveyor intends to issue, so we price against yours rather than proposing our own.',
    ],
  },
} as const;
