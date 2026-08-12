import type { Service } from '@content/services'
import { confirmedTowns } from '@content/areas'
import { SITE_URL, business } from '@content/site'

/**
 * A `Service` entity for the page, and a breadcrumb back to the home page.
 *
 * The provider is a reference to the `HousePainter` declared on the home page
 * rather than a second copy of the business, so there is one business in the
 * graph with one identity, described once.
 *
 * Still no `aggregateRating` anywhere — see REVIEWS.md rule 4. It would be even
 * more wrong here: the 4.9 covers all of his work, not this one service, so
 * marking it up per page would misattribute a real rating as well as breaking
 * Google's policy.
 */

export function ServiceStructuredData({ service }: { service: Service }) {
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
        '@type': 'Service',
        '@id': `${SITE_URL}/${service.slug}#service`,
        name: service.name,
        serviceType: service.name,
        description: service.description,
        url: `${SITE_URL}/${service.slug}`,
        provider: { '@id': `${SITE_URL}#business` },
        areaServed,
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: service.name,
          itemListElement: service.involves.map((item) => ({
            '@type': 'Offer',
            itemOffered: { '@type': 'Service', name: item },
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: business.name,
            item: SITE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: service.name,
            item: `${SITE_URL}/${service.slug}`,
          },
        ],
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
