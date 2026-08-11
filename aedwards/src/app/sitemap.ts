import type { MetadataRoute } from 'next'
import { services } from '@content/services'
import { SITE_URL } from '@content/site'

/** Rendered once at build. Required for `npm run build:static`. */
export const dynamic = 'force-static'

/**
 * The home page, the review archive and the five service pages.
 *
 * /leave-a-review is left out on purpose — it is a page Andy texts to a
 * customer, not a page anyone should arrive at from a search. So are the
 * filtered review views, which are noindex.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/reviews`, changeFrequency: 'monthly', priority: 0.8 },
    ...services.map((service) => ({
      url: `${SITE_URL}/${service.slug}`,
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    })),
  ]
}
