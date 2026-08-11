import type { MetadataRoute } from 'next';

import { getRecords } from '@/lib/projects';
import { SECTOR_SLUGS } from '@content/sectors';
import { site } from '@content/site';

/**
 * The sitemap. Submitted to Search Console after cutover, not before —
 * MIGRATION.md §3.
 *
 * Priorities reflect what the rebuild is for: programmed maintenance and the
 * sector pages are the commercial surface, the home page is the introduction.
 * The `wanted` record slots are excluded — they are questions for Sean, not
 * pages for Google.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes = [
    { path: '/', priority: 1 },
    { path: '/programmed-maintenance', priority: 0.9 },
    { path: '/capabilities', priority: 0.9 },
    { path: '/compliance', priority: 0.8 },
    { path: '/projects', priority: 0.7 },
    { path: '/gallery', priority: 0.7 },
    { path: '/about', priority: 0.6 },
    { path: '/contact', priority: 0.6 },
    { path: '/privacy', priority: 0.2 },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${site.url}${route.path}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: route.priority,
    })),
    ...SECTOR_SLUGS.map((slug) => ({
      url: `${site.url}/sectors/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...getRecords()
      .filter((r) => r.status !== 'wanted')
      .map((record) => ({
        url: `${site.url}/projects/${record.slug}`,
        lastModified: now,
        changeFrequency: 'yearly' as const,
        priority: 0.5,
      })),
  ];
}
