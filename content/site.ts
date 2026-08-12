/**
 * Hard facts about the business. Everything in `business` below was supplied by
 * the client. Nothing may be added here that has not been confirmed by him —
 * see /content/todo.ts for the things we are still waiting on.
 */

export const business = {
  /** Trading name, exactly as it should appear everywhere. */
  name: 'F.A.S Painter and Decorator',
  /** Short form for tight spaces (nav, footer, OG image). */
  shortName: 'F.A.S',
  trade: 'Painter & Decorator',
  base: 'Wrexham',
  region: 'North Wales',
  /** Display format. Used identically in every position on the site. */
  phoneDisplay: '07951 320566',
  /** E.164, for tel: links and structured data. */
  phoneHref: 'tel:+447951320566',
  phoneE164: '+447951320566',
} as const

/**
 * Canonical origin. Set NEXT_PUBLIC_SITE_URL in the hosting environment once
 * the domain is live — it drives canonical tags, the sitemap, Open Graph and
 * the JSON-LD `url`. See CONTENT-NEEDED.md.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'

export const meta = {
  title: 'Painter & Decorator in Wrexham | F.A.S Painter and Decorator',
  description:
    'Painter and decorator in Wrexham and Coedpoeth. Interior and exterior painting, proper preparation, woodwork finishing. Ring 07951 320566.',
} as const

/**
 * The five pages, in order. This one array drives the desktop bar, the mobile
 * menu and the sitemap, so the navigation cannot drift out of step with what
 * actually exists.
 *
 * `colour` is the swatch each page is keyed to — it paints the block beside
 * that page in the mobile menu and the underline in the desktop bar. Five
 * pages, five colours: the four service swatches plus the brand green for
 * contact.
 */
export type NavPage = {
  href: string
  label: string
  /** One line, shown under the label in the mobile menu. */
  blurb: string
  colour: string
}

export const navPages: NavPage[] = [
  {
    href: '/',
    label: 'Home',
    blurb: 'Painter and decorator, Wrexham and Coedpoeth',
    colour: '#5B7C99',
  },
  {
    href: '/what-i-do',
    label: 'What I do',
    blurb: 'Interiors, exteriors, woodwork — and which finish goes where',
    colour: '#B9714F',
  },
  {
    href: '/how-i-work',
    label: 'How I work',
    blurb: 'The preparation, and how a job actually runs',
    colour: '#7C8B6A',
  },
  {
    href: '/recent-work',
    label: 'Recent work',
    blurb: 'Photographs, and what people said afterwards',
    colour: '#2A2723',
  },
  {
    href: '/contact',
    label: 'Contact',
    blurb: 'Where I work, and how to get a price',
    colour: '#1F3D33',
  },
]

/** Per-page title and description. Keeps every page distinct in search. */
export const pageMeta = {
  '/': {
    title: meta.title,
    description: meta.description,
  },
  '/what-i-do': {
    title: 'What I do | F.A.S Painter and Decorator, Wrexham',
    description:
      'Interior and exterior painting, surface preparation and woodwork finishing in Wrexham and Coedpoeth, plus which finish suits where. Ring 07951 320566.',
  },
  '/how-i-work': {
    title: 'How I work | F.A.S Painter and Decorator, Wrexham',
    description:
      'Why the preparation decides how long a finish lasts, and the four steps a job runs through, from the first look to the snagging. Wrexham and Coedpoeth.',
  },
  '/recent-work': {
    title: 'Recent work | F.A.S Painter and Decorator, Wrexham',
    description:
      'Photographs of finished painting and decorating around Wrexham and Coedpoeth, and the reviews customers left on Google afterwards.',
  },
  '/contact': {
    title: 'Contact | F.A.S Painter and Decorator, Wrexham',
    description:
      'Ring 07951 320566 for a price on painting and decorating in Wrexham, Coedpoeth and the surrounding area, or leave your details and I will come back to you.',
  },
} as const satisfies Record<string, { title: string; description: string }>
