import { business, meta, siteUrl } from '@/content/site'
import { checkatradeUrl } from '@/content/todo'

/**
 * HousePainter, a subtype of LocalBusiness.
 *
 * Deliberately incomplete. `address`, `openingHours`, `priceRange` and
 * `aggregateRating` are all omitted rather than guessed — a made-up rating in
 * structured data is a manual action waiting to happen, and none of those
 * facts have been confirmed. `sameAs` appears only once there is a real
 * Checkatrade profile URL to point at.
 */
export function StructuredData() {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'HousePainter',
    name: business.name,
    description: meta.description,
    telephone: business.phoneE164,
    url: siteUrl,
    areaServed: [
      { '@type': 'City', name: 'Wrexham' },
      { '@type': 'Place', name: 'Coedpoeth' },
    ],
  }

  if (checkatradeUrl) data.sameAs = [checkatradeUrl]

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
