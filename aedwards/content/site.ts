/**
 * Site-wide facts. Single source of truth.
 *
 * Nothing in this file may be invented. If a fact is not confirmed it gets a
 * `confirmed: false` flag or a `null`, it does not get a plausible guess, and
 * the open question goes in content/needed.json so `npm run check:content`
 * lists it and CONTENT-NEEDED.md asks for it.
 *
 * Andy has no website, no email on file and no confirmed opening hours. That
 * is the honest starting position and the site is built to be correct in it,
 * not to paper over it.
 */

/* ------------------------------------------------------------- telephone --- */
/* One constant. The label and the tel: href are both derived from it, so they
   cannot drift apart — which is the single most common way a tradesman's site
   quietly stops working. */

const PHONE_E164 = '+447928784903'

/** Flip to true once someone has actually dialled it. Gates launch. */
const PHONE_CONFIRMED = false

function nationalDigits(e164: string): string {
  if (!/^\+447\d{9}$/.test(e164)) {
    throw new Error(
      `PHONE_E164 must be a UK mobile in E.164 form (+447… , 13 chars), got: ${e164}`,
    )
  }
  return `0${e164.slice(3)}`
}

/** 07928 784903 — UK mobiles group 5 + 6 after the leading zero. */
function formatUkMobile(e164: string): string {
  const n = nationalDigits(e164)
  return `${n.slice(0, 5)} ${n.slice(5)}`
}

export const phone = {
  e164: PHONE_E164,
  href: `tel:${PHONE_E164}`,
  /** 07928 784903 */
  display: formatUkMobile(PHONE_E164),
  confirmed: PHONE_CONFIRMED,
} as const

/* -------------------------------------------------------------- business --- */

export const business = {
  /** Exactly this. Not "A. Edwards", not "AED". */
  name: 'A Edwards Decorating',
  /** What customers call him. The site is written in his voice, singular. */
  knownAs: 'Andy',
  trade: 'Painter and decorator',
  town: 'Flint',
  county: 'Flintshire',
  /** Outward code only. The full address is NOT published — he works from home. */
  outwardCode: 'CH6',
  /** His own description of where he works. Specific towns need confirming. */
  areaStatement: 'North Wales and the Chester area',
} as const

/**
 * No street address on this site. It is on the Yell listing, but he works from
 * home and that is his decision to make, not ours. Same reasoning as hours.
 */
export const publishStreetAddress = false

/**
 * Opening hours are omitted entirely.
 *
 * Yell shows "Open 24 Hours" seven days a week — that is a directory default,
 * not a fact about Andy — and a citation aggregator carries different hours
 * again. Publishing either would be publishing something we know to be untrue.
 * When he gives real hours they go here and the section appears.
 */
export const openingHours: null = null

/* ------------------------------------------------------------------ urls --- */

/**
 * The Yell listing. Found by search; not fetched, because Yell blocks
 * automated access. Click it once before launch and confirm it is his.
 */
export const yellListingUrl = 'https://www.yell.com/biz/a-edwards-decorating-flint-7648594/'
export const yellListingConfirmed = false

/** Unknown. Ask Andy — see content/needed.json#google-profile. */
export const googleProfileUrl: string | null = null
/** The "write a review" deep link off the Google profile, once it exists. */
export const googleReviewUrl: string | null = null

/** No domain registered yet. aedwardsdecorating.co.uk was available on 11 Aug 2026. */
export const DOMAIN_REGISTERED = false
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.aedwardsdecorating.co.uk'

/** Unknown. Never invent one — a bounced address is worse than none. */
export const email: string | null = null

/* ----------------------------------------------------------- credentials --- */

/**
 * All four of these are self-reported on a directory listing of unknown
 * vintage. Insurance and a CSCS card have expiry dates; printing a lapsed one
 * on a website is worse than printing nothing. So `confirmed` starts false and
 * only confirmed credentials render.
 */
export type Credential = { id: string; label: string; confirmed: boolean }

export const credentials: readonly Credential[] = [
  { id: 'insured', label: 'Fully insured', confirmed: false },
  { id: 'cscs', label: 'CSCS registered', confirmed: false },
  { id: 'quotes', label: 'Free quotations', confirmed: false },
  { id: 'rates', label: 'Competitive rates', confirmed: false },
]

export const confirmedCredentials = credentials.filter((c) => c.confirmed)

/* ------------------------------------------------------------- longevity --- */

/** Established: the Yell listing has been running for over ten years. */
export const longevity = 'Listed on Yell for over ten years'
