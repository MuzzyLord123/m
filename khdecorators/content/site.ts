/**
 * Hard facts about the business.
 *
 * Nothing goes in this file that Kenny has not confirmed. Anything still open is
 * left as a `{{...}}` placeholder and listed in /content/needed.ts, which drives
 * CONTENT-NEEDED.md and the launch gate.
 */

/* ------------------------------------------------------------------ *
 * Telephone — one constant, derived label
 * ------------------------------------------------------------------ */

/** The only place the number is written down. */
const PHONE_E164 = '+447538869832'

/**
 * '+447538869832' → '07538 869832'.
 *
 * The label is derived from the E.164 number rather than typed out a second time,
 * so the thing on screen can never disagree with the thing in the link. That is
 * not a hypothetical: the last site in this portfolio displayed one mobile number
 * and linked another two digits short, and every visitor who tapped it failed to
 * get through. On paid traffic that mistake is billed by the click.
 */
const ukMobileLabel = (e164: string): string => {
  const national = `0${e164.replace(/^\+44/, '')}`
  return `${national.slice(0, 5)} ${national.slice(5)}`
}

export const phone = {
  e164: PHONE_E164,
  href: `tel:${PHONE_E164}`,
  label: ukMobileLabel(PHONE_E164),
} as const

export const email = 'khdecorators@outlook.com'

/* ------------------------------------------------------------------ *
 * The town
 * ------------------------------------------------------------------ */

/**
 * The base town, named in the first sentence of the home page and in every page
 * title on the site.
 *
 * NOT CONFIRMED. The old site says "the north west of England" and nothing else —
 * no town anywhere on six pages — which is the single biggest reason its Google
 * Ads relevance and local search are weak. Kenny's old Yell listing points at the
 * Chester area, but a listing is a hint, not a fact, and this is not a field to
 * guess: it goes in nine page titles, the JSON-LD and the first line customers
 * read.
 *
 * One phone call fixes it. Replace the placeholder here and it changes everywhere.
 * `npm run check:launch` fails while this line is unchanged.
 */
export const town: string = '{{TOWN}}'

/** How the wider patch is described where a single town would be too narrow. */
export const region = 'the north west of England'

/* ------------------------------------------------------------------ *
 * Trading name
 * ------------------------------------------------------------------ */

/**
 * CONFIRMED: the trading name is **KH Painting and Decorating**.
 *
 * The old site used three names across six pages — KH Decorators, KH Painting and
 * Decorating, and K.H Decorating — and the reviews added more, which meant Google
 * could not tell they were one business and the local signal was split three ways.
 * That is now settled, and this is the only place it is written down.
 *
 * It has to match EVERYWHERE or the problem comes straight back: the Google
 * Business Profile, the Google Ads account, Yell, the van, and any directory
 * listing. See LAUNCH.md §5. The domain stays khdecorators.uk — a domain not
 * matching the trading name is completely normal and costs nothing.
 */
export const business = {
  name: 'KH Painting and Decorating',
  /**
   * For tight spaces — the header wordmark and the OG image. Same words: an
   * abbreviation here would reintroduce exactly the inconsistency we just removed.
   */
  shortName: 'KH Painting and Decorating',
  trade: 'Painter, decorator & spray finisher',
  /** He works on his own. The site is written in the first person because of it. */
  tradesman: 'Kenny',
} as const

/**
 * Canonical origin. Set NEXT_PUBLIC_SITE_URL in the host once the domain points
 * here — it drives canonical tags, the sitemap, Open Graph and the JSON-LD `url`.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://khdecorators.uk'

/**
 * Profiles that are the same business, for `sameAs` in the structured data. Both
 * need confirming — see CONTENT-NEEDED.md. A `sameAs` pointing at the wrong
 * listing is worse than no `sameAs` at all, so the schema omits any entry still
 * holding a placeholder rather than publishing it.
 */
export const profiles = {
  google: '{{GOOGLE_BUSINESS_PROFILE_URL}}',
  yell: '{{YELL_LISTING_URL}}',
} as const

/* ------------------------------------------------------------------ *
 * Navigation
 * ------------------------------------------------------------------ */

/**
 * Every page, in order. There is no burger menu on this site: the nav is a
 * document index and it is always visible, wrapping onto a second line on a
 * phone. A menu you have to open is a menu most paid visitors never open.
 */
export const nav = [
  { href: '/spraying', label: 'Spraying' },
  { href: '/dustless-sanding', label: 'Dustless sanding' },
  { href: '/interior-decoration', label: 'Interior' },
  { href: '/exterior-decoration', label: 'Exterior' },
  { href: '/wallpaper-hanging', label: 'Wallpaper' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const

/**
 * The home page's numbered sections, in scroll order. Drives both the section
 * numbers in each block and the sticky rail on desktop.
 */
export const homeSections = [
  { id: 'what', number: '01', label: 'What I do' },
  { id: 'specialist', number: '02', label: 'Specialist work' },
  { id: 'services', number: '03', label: 'Services' },
  { id: 'process', number: '04', label: 'How a job runs' },
  { id: 'reviews', number: '05', label: 'Reviews' },
  { id: 'areas', number: '06', label: 'Where I work' },
  { id: 'quote', number: '07', label: 'Request a quote' },
  { id: 'contact', number: '08', label: 'Contact' },
] as const

export type HomeSection = (typeof homeSections)[number]
