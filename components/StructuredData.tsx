import { business, meta, siteUrl } from '@/content/site'
import { checkatradeUrl } from '@/content/todo'

/**
 * HousePainter, a subtype of LocalBusiness.
 *
 * Deliberately incomplete. `address`, `openingHours` and `priceRange` are
 * omitted rather than guessed — none of those facts have been confirmed.
 * `sameAs` appears only once there is a real Checkatrade profile URL to point
 * at.
 *
 * There is no `aggregateRating` and no `Review` markup, even though the site
 * now carries real Google reviews, for two separate reasons:
 *
 *   1. Google's structured data guidelines say reviews collected on a
 *      third-party site should not be marked up on your own. Doing it anyway
 *      is a manual-action risk, which is the opposite of what the reviews are
 *      there for.
 *   2. We hold six reviews the client sent us, not his profile's true total,
 *      so any average we published would be a number we made up.
 *
 * If he later collects reviews through his own site, that changes — but it
 * would be a different mechanism, not a markup tweak.
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
