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

/** Anchored sections, in scroll order. Drives the desktop nav indicator. */
export const navSections = [
  { id: 'services', label: 'What I do' },
  { id: 'preparation', label: 'Preparation' },
  { id: 'finishes', label: 'Finishes' },
  { id: 'how-it-runs', label: 'How a job runs' },
  { id: 'work', label: 'Recent work' },
  { id: 'areas', label: 'Where I work' },
  { id: 'contact', label: 'Contact' },
] as const

export type NavSection = (typeof navSections)[number]
