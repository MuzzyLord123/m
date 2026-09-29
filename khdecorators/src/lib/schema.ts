import { areas } from '@content/areas'
import { business, email, phone, profiles, region, siteUrl, town } from '@content/site'
import { isPlaceholder } from '@content/types'

/**
 * Structured data.
 *
 * `HousePainter` — a real schema.org type and a more specific one than
 * `LocalBusiness`, which is worth using when it fits exactly, as it does here. Plus a
 * `Service` entity for each thing he does, so the spraying work is described to
 * Google as a service and not just as a heading on a page.
 *
 * ## No aggregateRating. Deliberately, and it must stay that way.
 *
 * Marking up ratings collected from Yell and Google as first-party review data on
 * your own domain is against Google's structured-data policy for reviews, and the
 * penalty is a manual action against the site. On a site running paid traffic, a
 * manual action is an expensive way to buy one gold star in a search result. Any
 * average Kenny wants to show goes on the page as plain text with the source named
 * next to it.
 *
 * ## Placeholders are omitted, not published
 *
 * A `sameAs` pointing at an unconfirmed URL is worse than no `sameAs`, and an
 * `areaServed` of "{{TOWN}}" tells Google something false. Anything still holding a
 * placeholder is left out of the graph entirely.
 */

const services = [
  {
    name: 'Exterior spraying',
    description:
      'Render, cladding, fascias, soffits and gutters spray-applied in two coats, after cleaning, treating growth and making good.',
  },
  {
    name: 'UPVC spraying',
    description:
      'UPVC windows, doors and conservatory frames degreased, keyed, primed with an adhesion primer for rigid plastic and sprayed in any colour.',
  },
  {
    name: 'Garage door spraying',
    description:
      'Steel, GRP and timber garage doors sprayed in place. Rust taken back and spot-primed, existing coating keyed, two topcoats.',
  },
  {
    name: 'Furniture and kitchen door spraying',
    description:
      'Kitchen doors, wardrobes and furniture sprayed flat off the hinges, after degreasing, keying and adhesion priming.',
  },
  {
    name: 'Interior decoration',
    description:
      'Walls, ceilings and woodwork. Filled, flatted with dust extraction, caulked and cut in by hand, two coats.',
  },
  {
    name: 'Exterior decoration',
    description:
      'Render, masonry, timber and metalwork. Cleaned, made good and stabilised before two coats by brush, roller or spray.',
  },
  {
    name: 'Wallpaper hanging',
    description:
      'Lining, plain and patterned papers. Walls stripped, filled and sized, set out from a plumb line, seams butted and rolled.',
  },
  {
    name: 'Dustless sanding',
    description:
      'Sanding with extraction at the abrasive pad, so dust is captured as it is made and the house stays liveable while the work happens.',
  },
]

export function businessSchema() {
  /** Only real, confirmed places. A placeholder here would be a false statement. */
  const areaServed = [
    ...(isPlaceholder(town) ? [] : [{ '@type': 'City', name: town }]),
    ...areas.towns.map((name) => ({ '@type': 'City', name })),
  ]

  const sameAs = [profiles.google, profiles.yell].filter((url) => url && !isPlaceholder(url))

  return {
    '@context': 'https://schema.org',
    '@type': 'HousePainter',
    '@id': `${siteUrl}#business`,
    name: business.name,
    url: siteUrl,
    telephone: phone.e164,
    email,
    description:
      'Painter, decorator and spray finisher working across the north west of England. Spray finishing for UPVC, garage doors, render and furniture, and dustless sanding so you can stay in the house.',
    /**
     * A service-area business, not a shop. No `address` beyond the region, because
     * he works out of a van and his home address should not be on the internet — and
     * the Google Business Profile must be set up the same way. See LAUNCH.md.
     */
    areaServed: areaServed.length > 0 ? areaServed : region,
    ...(sameAs.length > 0 ? { sameAs } : {}),
    founder: { '@type': 'Person', name: business.tradesman },
    priceRange: '££',
    makesOffer: services.map((service) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: service.name,
        description: service.description,
        provider: { '@id': `${siteUrl}#business` },
        ...(areaServed.length > 0 ? { areaServed } : {}),
      },
    })),
    // No aggregateRating. See the note at the top of this file.
  }
}

/** A `WebSite` node, so the sitelinks and the canonical name are unambiguous. */
export function siteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}#website`,
    url: siteUrl,
    name: business.name,
    inLanguage: 'en-GB',
    publisher: { '@id': `${siteUrl}#business` },
  }
}
