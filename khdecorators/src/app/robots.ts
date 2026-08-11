import type { MetadataRoute } from 'next'
import { siteUrl } from '@content/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The endpoint accepts POST only, and the thank-you page is noindex anyway.
      disallow: ['/api/', '/contact/sent'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
