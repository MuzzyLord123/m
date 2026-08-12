/**
 * The masthead copy for each page. The home page does not have one — the hero
 * is its masthead.
 *
 * `colour` matches the page's colour in the navigation, so the painted bar at
 * the top of the page, the sliding underline in the desktop bar and the spine
 * in the mobile menu are all the same swatch.
 */

export type PageHeaderCopy = {
  eyebrow: string
  heading: string
  intro: string
  colour: string
}

export const pageHeaders = {
  '/what-i-do': {
    eyebrow: 'What I do',
    heading: 'Painting, preparation and woodwork.',
    intro:
      'Four things, and the paint you end up choosing between. Inside and out, houses and premises, and enough detail to tell whether I know what I am talking about before you ring.',
    colour: '#B9714F',
  },
  '/how-i-work': {
    eyebrow: 'How I work',
    heading: 'Most of the job is the part you stop seeing.',
    intro:
      'What happens before a topcoat goes on, and the four steps a job runs through from the first look at it to the walk round at the end.',
    colour: '#7C8B6A',
  },
  '/recent-work': {
    eyebrow: 'Recent work',
    heading: 'Jobs, as they were left.',
    intro:
      'Photographs taken on the job rather than in a studio, and the reviews people left on Google once I had gone.',
    colour: '#2A2723',
  },
  '/contact': {
    eyebrow: 'Contact',
    heading: 'Ring me and tell me what needs painting.',
    intro:
      'Quickest way to get a price is a phone call. If I am up a ladder I will ring you back. Below is where I work, and a form if you would rather type it out.',
    colour: '#1F3D33',
  },
} as const satisfies Record<string, PageHeaderCopy>

/** Short links out of the home page into the pages behind it. */
export const homeCopy = {
  servicesEyebrow: 'What I do',
  servicesHeading: 'Four things, done properly.',
  servicesLink: 'All four, in detail',
  proofLink: 'See recent work and reviews',
  closeEyebrow: 'Where I work',
  closeHeading: 'Wrexham, Coedpoeth and the villages around them.',
  closeBody:
    'If you are not sure whether you are in range, ring and ask. It is a short conversation and I would rather tell you straight than have you guess.',
  closeLink: 'Where I work and how to reach me',
} as const
