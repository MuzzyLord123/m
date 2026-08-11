/**
 * The five service pages.
 *
 * Every one of these is a line of work from Andy's own Yell listing, so the
 * pages exist because the work exists — not because five URLs rank better than
 * one. Town pages would have been the obvious move and they are deliberately
 * not here: no town is confirmed yet, and a set of near-identical pages with
 * the place name swapped is a doorway page whatever you call it.
 *
 * ── What the copy on these pages is allowed to say ───────────────────────────
 *
 * The service lists are his, off the listing. The rest describes *the work* —
 * what wallpapering involves, why exterior jobs wait for weather — which is
 * true of the trade rather than a claim about him.
 *
 * What it deliberately does NOT do is put method claims in his mouth. No "I
 * always use two coats", no guarantees, no turnaround times, no prices, no
 * out-of-hours promises. Anything of that shape needs him to say it first. He
 * should still read these pages before launch and cross out anything he does
 * not do — see content/needed.json#service-page-copy.
 *
 * Each page ends up structurally proof-led: the work, then the reviews that
 * evidence that work, then the phone. Where no review evidences a service, the
 * page says so and points at the archive rather than borrowing a review that
 * was about something else.
 */

import { PALETTE_ORDER, type FieldColour } from './fields'

export type Service = {
  slug: string
  /** Short name, for the index lists. */
  name: string
  /** Mono section label at the top of the first field. */
  label: string
  /** The h1. */
  headline: string
  /** One plain sentence under it. */
  lead: string
  /** What the job covers. Mono list. */
  involves: readonly string[]
  /** The second idea on the page — usually the part customers underestimate. */
  detail: {
    headline: string
    body: readonly string[]
  }
  /** Where this page starts in the palette. Each page opens a different colour. */
  paletteOffset: number
  title: string
  description: string
}

export const services: readonly Service[] = [
  {
    slug: 'interior-painting',
    name: 'Interior painting',
    label: 'Inside',
    headline: 'Interior painting.',
    lead: 'Walls, ceilings, woodwork and floors. One room, or the whole house.',
    involves: [
      'Walls and ceilings',
      'Woodwork, doors and skirting',
      'Radiators and pipework',
      'Floor painting',
      'Filling, sanding and making good',
      'Furniture moved and covered',
    ],
    detail: {
      headline: 'The part you cannot see is the part that lasts.',
      body: [
        'Filling, sanding, caulking the gaps, and getting the dust off before a brush goes anywhere near a wall. On most interior jobs that is where the time goes.',
        'It is also the difference between a room that looks right for a year and one that still looks right in ten.',
      ],
    },
    paletteOffset: 3,
    title: 'Interior painting and decorating in Flint',
    description:
      'Interior painting and decorating in Flint, Flintshire — walls, ceilings, woodwork, radiators and floors, one room or a whole house.',
  },

  {
    slug: 'exterior-painting',
    name: 'Exterior painting',
    label: 'Outside',
    headline: 'Exterior painting.',
    lead: 'Render, masonry, woodwork, gutters and downpipes.',
    involves: [
      'Render and masonry',
      'Exterior woodwork',
      'Fascias, soffits and gutters',
      'Windows and doors',
      'Garden walls and railings',
      'Protective coatings',
    ],
    detail: {
      headline: 'Prep, then weather, then paint.',
      body: [
        'Washed down, scraped back, anything bare treated and primed, anything loose taken off rather than painted over. Paint on top of a bad surface fails at the surface, not at the paint.',
        'Outside work waits for dry weather, which means dates move. Better a job put back a week than a coat that lifts by spring.',
      ],
    },
    paletteOffset: 1,
    title: 'Exterior painting and render in Flint',
    description:
      'Exterior painting in Flint, Flintshire — render, masonry, exterior woodwork, fascias and gutters, prepared properly and painted in the right weather.',
  },

  {
    slug: 'wallpapering',
    name: 'Wallpapering',
    label: 'Paper',
    headline: 'Wallpapering.',
    lead: 'Feature walls, whole rooms, ceilings — and taking off whatever is up there now.',
    involves: [
      'Stripping old paper',
      'Lining walls',
      'Patterned and plain',
      'Feature walls',
      'Ceilings',
      'Making good before hanging',
    ],
    detail: {
      headline: 'Paper shows you every flaw in the wall behind it.',
      body: [
        'A wall that looks flat under paint is often not flat under paper. Anything left in it — a bad patch, a ridge, an old fixing — comes through, and it comes through worse in a low light across the room.',
        'So the wall gets sorted first, and lined if it needs lining. Hanging the paper is the quick bit.',
      ],
    },
    paletteOffset: 2,
    title: 'Wallpapering in Flint',
    description:
      'Wallpapering in Flint, Flintshire — feature walls, full rooms and ceilings, with the wall behind it prepared and lined first.',
  },

  {
    slug: 'wood-finishes',
    name: 'Wood finishes and staining',
    label: 'Wood',
    headline: 'Wood finishes and staining.',
    lead: 'Doors, stairs, floors, beams and garden timber. Stained, oiled, waxed or painted.',
    involves: [
      'Interior doors and staircases',
      'Floors and beams',
      'Exterior timber and decking',
      'Stains and wood dyes',
      'Oils, waxes and varnishes',
      'Stripping back and re-finishing',
    ],
    detail: {
      headline: 'Wood moves. Whatever goes on it has to move with it.',
      body: [
        'Colour on wood is not the same as colour on a wall. The grain takes it unevenly, the same tin reads differently on oak and on pine, and once it is in, it is in.',
        'Which is why it goes on a test piece first, somewhere you will actually see it, before the whole staircase is committed to a colour.',
      ],
    },
    paletteOffset: 5,
    title: 'Wood staining and finishing in Flint',
    description:
      'Wood finishes and staining in Flint, Flintshire — doors, staircases, floors, beams and exterior timber, stained, oiled, waxed or painted.',
  },

  {
    slug: 'commercial-decorating',
    name: 'Commercial and industrial',
    label: 'Commercial',
    headline: 'Commercial and industrial.',
    lead: 'Shops, offices, units and communal areas.',
    involves: [
      'Shops and offices',
      'Industrial units and workshops',
      'Communal areas and stairwells',
      'Protective coatings',
      'Floor painting',
      'Landlords and managing agents',
    ],
    detail: {
      headline: 'Somebody still has to open up in the morning.',
      body: [
        'A commercial job is mostly a logistics job. What can be shut, what cannot, where the dust goes, what has to be usable again by eight.',
        'Worth saying up front what your hours are and what has to stay open, because that decides the order the work happens in more than anything else does.',
      ],
    },
    paletteOffset: 4,
    title: 'Commercial and industrial decorating in Flint',
    description:
      'Commercial and industrial decorating in Flint, Flintshire — shops, offices, units, communal areas, protective coatings and floor painting.',
  },
]

export function serviceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug)
}

export function otherServices(slug: string): readonly Service[] {
  return services.filter((s) => s.slug !== slug)
}

/**
 * Each page walks the palette from its own starting point, so five pages built
 * from one component still open on five different colours and never repeat a
 * colour back to back.
 */
export function paletteFor(service: Service, length: number): FieldColour[] {
  return Array.from(
    { length },
    (_, i) => PALETTE_ORDER[(service.paletteOffset + i) % PALETTE_ORDER.length],
  )
}
