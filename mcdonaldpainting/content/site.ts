/**
 * The hard facts. Nothing on this site states anything about the company that
 * is not either in this file or in content/sectors and content/projects.
 *
 * The rule for this file: a value is here because someone can point at where it
 * came from. Anything else is a question in content/needed.json and renders on
 * the page as a `<Confirm>` marker, not as a claim.
 */

export const site = {
  name: 'McDonald Painting Contractors',
  legalName: 'McDonald Painting Contractors Ltd',

  /**
   * Companies House, England and Wales. This is the one number on the site that
   * anybody can check in ten seconds, which is exactly why a contractor puts it
   * in the footer.
   */
  companyNumber: '10402793',

  /**
   * CONFIRM before DNS is touched — MIGRATION.md §3.
   *
   * This is the single most expensive thing to get wrong on cutover day. The
   * live site canonicalises to one host and the Search Console property is
   * verified against one host. Read both, then set this to match. Do not switch
   * apex↔www "because it looks tidier": on a site with existing rankings that is
   * a re-index, not a preference.
   *
   * Set NEXT_PUBLIC_SITE_URL in the host's dashboard to override without a code
   * change.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mcdonaldpaintingcontractors.co.uk',

  /**
   * Carried across from the current site's <head> so the Search Console
   * property survives the move. Do not remove it until the new property has
   * been verified by another method and a new sitemap has been accepted.
   */
  googleSiteVerification: 'VOUd_RzPODzRYTEbDIRNHrRsHL3YzQ_60S4styu_3f4',

  base: 'Cheshire',
} as const;

export const phone = {
  /** Sean. The number on the current site, and the number that gets answered. */
  display: '07851 113 929',
  e164: '+447851113929',
  href: 'tel:+447851113929',
  who: 'Sean',
} as const;

/**
 * The website is mcdonaldpaintingcontractors.co.uk and the published email is
 * on mcdonaldpainting.co.uk — a different domain. That is not a typo on the old
 * site; it is genuinely what it says.
 *
 * It matters more here than it would elsewhere. Procurement teams and school
 * business managers whitelist sending domains, and a tender response arriving
 * from a domain that does not match the letterhead gets held or binned.
 *
 * Until Sean confirms which address is canonical and that mail on it is
 * reliable, the site shows the number rather than an address it cannot vouch
 * for. See content/needed.json#email.
 */
export const email = {
  confirmed: false,
  /** What the current site publishes. Shown only once `confirmed` is true. */
  published: 'info@mcdonaldpainting.co.uk',
} as const;

/**
 * Two lists, and the distinction is the whole positioning argument.
 *
 * `local` is where a van goes out and comes back the same day — this is what
 * the current site is optimised for, and it is the smaller half of the business.
 * `wider` is the commercial and industrial work, which travels.
 */
export const coverage = {
  local: ['Chester', 'North Wales', 'the Wirral', 'Manchester'],
  localLong:
    'Chester, North Wales, the Wirral, Manchester and the towns around them',
  wider: 'Commercial and industrial contracts across the United Kingdom',
} as const;

export const socials = {
  /**
   * The correct accounts. The current site's header links to these and its body
   * copy links to a second, older set under the M & R Painting Contractors
   * name — two different sets of social links on one page.
   *
   * The `mandr` handles are not listed here and are not in the schema. See
   * content/needed.json#mandr-accounts before anything is deleted at the other
   * end: if those accounts still hold photographs, they need exporting first.
   */
  instagram: 'https://www.instagram.com/mcdonaldpaintingcontractors/',
  facebook: 'https://www.facebook.com/mcdonaldpaintingcontractors/',
} as const;

/**
 * The accreditation. SafeContractor is assessed by Alcumus, and an approved
 * contractor is licensed to display the mark — so the badge can go on the site,
 * but the file has to come from Sean's certificate, not from an image search.
 *
 * Certificate number, assessment scope and expiry are left null rather than
 * guessed. A buyer who asks for the certificate and is given a wrong number
 * stops reading there.
 */
export const accreditation = {
  name: 'SafeContractor',
  body: 'Alcumus',
  held: true,
  certificateNumber: null as string | null,
  scope: null as string | null,
  expires: null as string | null,
  /** Path under /public once the certificate image is supplied. */
  badge: null as string | null,
} as const;

/**
 * "Fully insured" is what the current site says, and it is worth nothing to a
 * procurement team without the two figures. They are always asked for, usually
 * in the first email, and the answer decides whether the enquiry proceeds.
 */
export const insurance = {
  publicLiability: null as string | null,
  employersLiability: null as string | null,
  /** Insurer and policy expiry, for the pre-qualification questionnaire. */
  insurer: null as string | null,
  expires: null as string | null,
} as const;

export const workforce = {
  /** "Operatives qualified to NVQ standard" is the company's own wording. */
  qualification: 'NVQ',
  headcount: null as number | null,
  teams: null as number | null,
} as const;

/**
 * Registration date is public on Companies House and the number suggests 2016 —
 * but "suggests" is not a source, and a founding year is the kind of thing a
 * buyer checks. It stays null until someone reads the record.
 */
export const founded = {
  year: null as number | null,
} as const;

export const registeredOffice = {
  /** Public on Companies House. Needed in the footer for the same reason the
   *  company number is: it is what a contractor's site carries. */
  confirmed: false,
  lines: [] as string[],
} as const;

/** Convenience for the schema and the sheet header. */
export const areaServed = [...coverage.local, 'Cheshire', 'England', 'Wales', 'Scotland'];
