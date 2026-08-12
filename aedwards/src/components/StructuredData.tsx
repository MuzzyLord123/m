import { argument } from '@content/copy'
import { confirmedTowns } from '@content/areas'
import {
  SITE_URL,
  business,
  googleProfileUrl,
  phone,
  yellListingUrl,
} from '@content/site'

/**
 * HousePainter, with no aggregateRating in it. Deliberately.
 *
 * The 4.9 is the most valuable thing this business owns and the temptation is
 * to mark it up so it shows as stars in the search results. Don't. Google's
 * structured-data policy does not allow a site to mark up ratings collected
 * from a third-party site about itself, and the penalty for doing it is a
 * manual action against the domain. The rating appears in visible text with its
 * source and a link instead — see src/components/Rating.tsx — which is what
 * the policy is for and what a reader can actually verify.
 *
 * No street address either: he works from home, and locality plus service area
 * is what a service business should be publishing anyway. No openingHours,
 * because the only hours anyone has are a directory's "open 24 hours" default.
 */

export function StructuredData() {
  const sameAs = [yellListingUrl, googleProfileUrl].filter(
    (url): url is string => typeof url === 'string' && url.length > 0,
  )

  const areaServed =
    confirmedTowns.length > 0
      ? confirmedTowns.map((town) => ({ '@type': 'City', name: town.name }))
      : [
          { '@type': 'AdministrativeArea', name: 'North Wales' },
          { '@type': 'AdministrativeArea', name: 'Chester and the surrounding area' },
        ]

  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'HousePainter',
        '@id': `${SITE_URL}#business`,
        name: business.name,
        description: `${business.trade} in ${business.town}, ${business.county}. Interior and exterior, domestic and commercial.`,
        telephone: phone.e164,
        url: SITE_URL,
        address: {
          '@type': 'PostalAddress',
          addressLocality: business.town,
          addressRegion: business.county,
          addressCountry: 'GB',
        },
        areaServed,
        ...(sameAs.length > 0 ? { sameAs } : {}),
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Decorating',
          itemListElement: argument.services.map((service) => ({
            '@type': 'Offer',
            itemOffered: {
              '@type': 'Service',
              name: service,
              serviceType: service,
              provider: { '@id': `${SITE_URL}#business` },
            },
          })),
        },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
