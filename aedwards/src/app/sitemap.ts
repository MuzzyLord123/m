import type { MetadataRoute } from 'next'
import { SITE_URL } from '@content/site'

/**
 * Three pages. /leave-a-review is left out on purpose — it is a page Andy texts
 * to a customer, not a page anyone should arrive at from a search.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/reviews`, changeFrequency: 'monthly', priority: 0.8 },
  ]
}
