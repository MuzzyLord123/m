import type { MetadataRoute } from 'next';
import { site } from '@content/site';
import { getProjects } from '@/lib/projects';

/**
 * Every indexable page. /leave-a-review is deliberately absent — it exists to
 * be texted to a customer the day a job finishes, not to be crawled.
 */
const PAGES: { path: string; priority: number }[] = [
  { path: '/', priority: 1 },
  // The differentiator, and the page this site is pointed at.
  { path: '/repairs', priority: 0.9 },
  { path: '/exterior', priority: 0.8 },
  { path: '/interior', priority: 0.8 },
  { path: '/commercial', priority: 0.8 },
  { path: '/projects', priority: 0.7 },
  { path: '/about', priority: 0.6 },
  { path: '/contact', priority: 0.6 },
];

// Generated at build time. Required by the static-export bundle, and correct
// for the Node deployment too — neither file varies per request.
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    ...PAGES.map((page) => ({
      url: `${site.url}${page.path}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: page.priority,
    })),
    ...getProjects().map((project) => ({
      url: `${site.url}/projects/${project.slug}`,
      lastModified,
      changeFrequency: 'yearly' as const,
      priority: 0.5,
    })),
  ];
}
