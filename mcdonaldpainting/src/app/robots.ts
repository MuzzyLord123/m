import type { MetadataRoute } from 'next';

import { site } from '@content/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The filtered views of the records page are the same records in a
      // different order. Useful to link to, not worth indexing four times.
      disallow: ['/projects?'],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
