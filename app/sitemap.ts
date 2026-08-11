import type { MetadataRoute } from 'next'
import { siteUrl } from '@/content/site'

/**
 * One page, so one URL. The /enquiry/* pages are form outcomes and are marked
 * noindex, so they stay out of here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${siteUrl}/`,
      changeFrequency: 'monthly',
      priority: 1,
    },
  ]
}
