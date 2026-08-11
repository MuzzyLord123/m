import type { MetadataRoute } from 'next';

import { getProjects } from '@/lib/projects';
import { site } from '@content/site';

/**
 * Static routes plus one entry per job. Priorities reflect what the site is
 * actually for: the kitchens page is the money page, the work index is how
 * somebody decides.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes: Array<{ path: string; priority: number }> = [
    { path: '/', priority: 1 },
    { path: '/hand-painted-kitchens', priority: 0.9 },
    { path: '/work', priority: 0.9 },
    { path: '/decorating', priority: 0.8 },
    { path: '/workshops', priority: 0.7 },
    { path: '/about', priority: 0.6 },
    { path: '/contact', priority: 0.6 },
  ];

  return [
    ...routes.map((r) => ({
      url: `${site.url}${r.path}`,
      changeFrequency: 'monthly' as const,
      priority: r.priority,
    })),
    ...getProjects().map((p) => ({
      url: `${site.url}/work/${p.slug}`,
      changeFrequency: 'yearly' as const,
      priority: 0.7,
    })),
  ];
}
