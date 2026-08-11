import { emptyPhoto } from './types'

/**
 * The home page, section by section, in the order they appear.
 *
 * This is the page paid traffic lands on, so it is built to answer three
 * questions in the first screen — what he does, where he is, and how to get hold
 * of him — and then to earn the enquiry with detail rather than with adjectives.
 *
 * `{town}` is substituted at render time from /content/site.ts. Section 01's first
 * sentence names it deliberately: the old site never named a single place across
 * six pages, which is most of why its local search and its Ads relevance are weak.
 */

export const home = {
  /* ---------------------------------------------------------------- *
   * Hero
   * ---------------------------------------------------------------- */
  hero: {
    /** The H1. A service and a place, because that is what people search for. */
    h1: 'Painter, decorator and spray finisher in {town}',
    /** First sentence on the page. The town is in it on purpose. */
    lede: 'I’m Kenny. I paint and decorate houses in {town} and across the north west of England, and I spray the things a brush cannot do properly — UPVC, garage doors, render and kitchen doors.',
    /** Two or three facts, set as annotations. Kept to things that are true. */
    facts: [
      'One man, one job at a time',
      'Dustless sanding — you stay in the house',
      'Photographs at the end of every day',
    ],
    ctaPrimary: 'Request a quote',
    ctaSecondary: 'Ring me',

    /**
     * The hero figure. Its own slot rather than a reuse of §02's, so the callout
     * sides can be set for a wide figure — this one runs the full width of the page
     * beneath the title block, which is where there is room for labels on both sides.
     */
    photo: emptyPhoto(
      'The best single spray photograph there is, landscape and wide — UPVC frames or a garage door mid-job, masked, gun in shot. This is the first thing a paid visitor sees on the whole site.',
    ),
    callouts: [
      { x: 18, y: 34, side: 'left' as const, label: 'Glass and seals masked' },
      { x: 72, y: 30, side: 'right' as const, label: 'Even film, no brush marks' },
      { x: 58, y: 72, side: 'right' as const, label: 'Ground sheeted before I start' },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 01 — What I do and where
   * ---------------------------------------------------------------- */
  what: {
    heading: 'What I do, and where',
    body: [
      'I’m a time-served painter and decorator working out of {town}. I do the ordinary work — walls, ceilings, woodwork, papering, the outside of the house — and I do two things most decorators round here don’t: I spray, and I sand with extraction so the dust doesn’t end up through your house.',
      'It’s me on the job. Not a team, not a subcontractor turning up in a van with my name on it. That means I can only be in one place at a time, so the dates I give you are real ones, and it means the person who quoted the job is the person doing it.',
      'Most of my work comes from people who have had me before, or from their neighbours. That is the way I would rather it stayed, which is a reasonable summary of how I approach a job.',
    ],
    /** Short specification block. Facts, not claims. */
    spec: [
      { label: 'Based', value: '{town}' },
      { label: 'Works across', value: 'The north west of England' },
      { label: 'Trade', value: 'Painter, decorator, spray finisher' },
      { label: 'Team size', value: 'One — Kenny' },
      { label: 'Sanding', value: 'Dust-extracted at the pad' },
      { label: 'Time served', value: '{{TIME_SERVED}}' },
      { label: 'Insurance', value: '{{INSURANCE}}' },
      { label: 'Working hours', value: '{{HOURS}}' },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 02 — The two differentiators
   * ---------------------------------------------------------------- */
  specialist: {
    heading: 'The two things worth ringing me about',
    standfirst:
      'Any decorator can paint a wall, and plenty of them do it well. These two are the reason people ring me rather than the man down the road.',
    items: [
      {
        number: '01',
        name: 'Spray finishing',
        href: '/spraying',
        linkLabel: 'What can be sprayed, and what can’t',
        body: [
          'UPVC windows, garage doors, render, cladding, kitchen doors and furniture. On a hard, non-absorbent surface a brush leaves marks that never level out, because the paint has nothing to sink into. Sprayed, it lands as an even film — into the rebates and the beading at the same thickness as on the flat.',
          'The spraying itself is the quick part. The masking is the job, and the masking is what you are paying for.',
        ],
        photo: emptyPhoto(
          'The single best spray photograph available — UPVC frames or a garage door mid-job, masked, gun in shot. This is the most important image on the site.',
        ),
        // Right side only: this figure sits in a seven-column slot, which has room
        // for one gutter, not two. See the container-query note in Annotated.tsx.
        callouts: [
          { x: 30, y: 30, side: 'right' as const, label: 'Glass and seals masked' },
          { x: 62, y: 52, side: 'right' as const, label: 'Even film, no brush marks' },
          { x: 44, y: 78, side: 'right' as const, label: 'Ground sheeted before I start' },
        ],
      },
      {
        number: '02',
        name: 'Dustless sanding',
        href: '/dustless-sanding',
        linkLabel: 'How the extraction works',
        body: [
          'The sander runs connected to an extractor and the dust is pulled off through the abrasive as it is made, so it goes into a filtered machine instead of into your carpets, your curtains and the top of every picture frame in the house.',
          'It means you can carry on living in the house while I work, and it means the surface I am painting is clean — which shows up in the finish as well as in the hoovering.',
        ],
        photo: emptyPhoto(
          'Sander and extractor connected, mid-sand, with the room obviously still lived in and no grey film anywhere. The contrast is the argument.',
        ),
        callouts: [
          { x: 32, y: 34, side: 'right' as const, label: 'Extracted at the pad' },
          { x: 58, y: 56, side: 'right' as const, label: 'Fine dust retained, not blown back' },
          { x: 40, y: 80, side: 'right' as const, label: 'Furniture stays where it is' },
        ],
      },
    ],
  },

  /* ---------------------------------------------------------------- *
   * 03 — Services
   * ---------------------------------------------------------------- */
  services: {
    heading: 'Everything I do',
    standfirst:
      'The application column is the useful one. It says which work is sprayed, which is hand-painted, and which depends on the surface.',
  },

  /* ---------------------------------------------------------------- *
   * 04 — How a job runs
   * ---------------------------------------------------------------- */
  process: {
    heading: 'How a job runs',
    standfirst:
      'Same for a feature wall as for a full exterior. The only difference is how long each step takes.',
  },

  /* ---------------------------------------------------------------- *
   * 05 — Reviews
   * ---------------------------------------------------------------- */
  reviews: {
    heading: 'What people have said',
    standfirst:
      'Quoted exactly as written, with the name as published and a link to the original where there is one.',
    allLabel: 'Read all the reviews',
  },

  /* ---------------------------------------------------------------- *
   * 06 — Where I work
   * ---------------------------------------------------------------- */
  areas: {
    heading: 'Where I work',
  },

  /* ---------------------------------------------------------------- *
   * 07 — Quote
   * ---------------------------------------------------------------- */
  quote: {
    heading: 'Request a quote',
    standfirst:
      'Tell me what needs doing and roughly when. I read these myself and I answer them myself, usually the same day. If it is easier, ring me — I would rather have a two-minute conversation than a long form.',
  },

  /* ---------------------------------------------------------------- *
   * 08 — Contact
   * ---------------------------------------------------------------- */
  contact: {
    heading: 'Contact',
    standfirst:
      'Phone is quickest. If I am up a ladder or spraying, leave a message and I will ring back.',
  },
} as const
