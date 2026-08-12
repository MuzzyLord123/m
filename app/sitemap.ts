import type { MetadataRoute } from 'next'
import { navPages, siteUrl } from '@/content/site'

/**
 * Driven by the same array as the navigation, so a page cannot exist in the
 * menu and be missing from the sitemap, or the other way round.
 *
 * The /enquiry/* pages are form outcomes and marked noindex, so they stay out.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return navPages.map((page) => ({
    url: `${siteUrl}${page.href === '/' ? '/' : page.href}`,
    changeFrequency: 'monthly',
    priority: page.href === '/' ? 1 : 0.8,
  }))
}
