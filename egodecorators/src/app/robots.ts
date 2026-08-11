import type { MetadataRoute } from 'next';
import { site } from '@content/site';

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
