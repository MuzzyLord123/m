import type { MetadataRoute } from 'next';
import { site } from '@content/site';

// Generated at build time. Required by the static-export bundle, and correct
// for the Node deployment too — neither file varies per request.
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Exists to be texted to a customer, not to be indexed.
      disallow: ['/leave-a-review'],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
