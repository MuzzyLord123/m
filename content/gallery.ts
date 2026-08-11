import { emptyPhoto, type Photo, type SwatchKey } from './types'

/**
 * Recent work.
 *
 * Every entry below is an EMPTY SLOT waiting on a real photograph of a real
 * job. `caption`, `place` and `finish` stay null until the client tells us what
 * the job actually was — nothing here is invented, and no stock photography is
 * used anywhere on this site.
 *
 * The slot renders as a flat colour block carrying `photo.brief` (the shot we
 * need) until `photo.src` is filled in. See README.md for how to add a job.
 *
 * A /gallery page and per-job /work/[slug] pages are deliberately NOT built
 * yet: they only earn their place once there are three or more real jobs with
 * before-and-after photographs. Until then this on-page gallery is the whole of
 * it.
 */

export type Job = {
  id: string
  /** What the job was. Client-supplied. */
  caption: string | null
  /** Town or village. Client-supplied. */
  place: string | null
  /** Finish used, e.g. "satin woodwork, matt emulsion walls". Client-supplied. */
  finish: string | null
  /** Desktop grid weighting — mixed cell sizes, deliberately not a neat 3-up. */
  span: 'wide' | 'tall' | 'std'
  swatch: SwatchKey
  photo: Photo
  /** Draggable before/after comparison. Null where there is only one shot. */
  beforeAfter: { before: Photo; after: Photo } | null
}

export const jobs: Job[] = [
  {
    id: 'job-1',
    caption: null,
    place: null,
    finish: null,
    span: 'wide',
    swatch: 'blue',
    photo: emptyPhoto('Best finished room you have. Wide, from the corner, curtains open.'),
    beforeAfter: {
      before: emptyPhoto('The same room before you started. Same corner, same angle.'),
      after: emptyPhoto('The same room finished. Same corner, same angle, same time of day.'),
    },
  },
  {
    id: 'job-2',
    caption: null,
    place: null,
    finish: null,
    span: 'tall',
    swatch: 'clay',
    photo: emptyPhoto('A staircase or hallway, shot upright so the whole run of it is in frame.'),
    beforeAfter: null,
  },
  {
    id: 'job-3',
    caption: null,
    place: null,
    finish: null,
    span: 'std',
    swatch: 'sage',
    photo: emptyPhoto('Woodwork close up — skirting, architrave or a panelled door in satin or gloss.'),
    beforeAfter: null,
  },
  {
    id: 'job-4',
    caption: null,
    place: null,
    finish: null,
    span: 'std',
    swatch: 'black',
    photo: emptyPhoto('Exterior: render, soffits and fascias, taken from across the road on a dry day.'),
    beforeAfter: {
      before: emptyPhoto('The same elevation before, showing the state of the old paintwork.'),
      after: emptyPhoto('The same elevation after, same spot across the road.'),
    },
  },
  {
    id: 'job-5',
    caption: null,
    place: null,
    finish: null,
    span: 'std',
    swatch: 'blue',
    photo: emptyPhoto('A kitchen or bathroom, painted. Wide enough to show the ceiling line.'),
    beforeAfter: null,
  },
  {
    id: 'job-6',
    caption: null,
    place: null,
    finish: null,
    span: 'wide',
    swatch: 'clay',
    photo: emptyPhoto('A commercial job — shop, office, unit or communal stairwell.'),
    beforeAfter: null,
  },
]

/** True once there is enough real work to justify a dedicated gallery route. */
export const hasRealJobs = jobs.filter((j) => j.photo.src !== null).length >= 3

export const galleryCopy = {
  eyebrow: 'Recent work',
  heading: 'Jobs, as they were left.',
  body: 'Photographs of finished work, taken on the job rather than in a studio. No stock pictures and nothing borrowed.',
  /** Shown while the slots are still empty. Honest, and it disappears on its own. */
  awaitingNote:
    'Photographs of recent jobs are being added here. In the meantime, ring and I will talk you through work I have done nearby.',
} as const

export type GalleryPhoto = Photo
