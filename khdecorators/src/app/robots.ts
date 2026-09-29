import type { MetadataRoute } from 'next'
import { siteUrl } from '@content/site'
import { isIndexable } from '@/lib/indexable'

export default function robots(): MetadataRoute.Robots {
  /*
   * While the content is unfinished, disallow everything. A deployed preview of
   * this site would otherwise be indexable on its hosting URL, and a page titled
   * "Painters & decorators in {{TOWN}}" in Google's index is expensive to undo.
   * See src/lib/indexable.ts — it turns itself on when the town is filled in.
   */
  if (!isIndexable()) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    }
  }

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
