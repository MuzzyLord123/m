import type { MetadataRoute } from 'next'
import { siteUrl } from '@content/site'

/**
 * The sitemap, for Search Console.
 *
 * /contact/sent is left out on purpose: it is noindex, and a thank-you page in a
 * sitemap is an invitation for Google to index a page that means nothing to anybody
 * arriving cold.
 *
 * Priorities are relative and only advisory, but they are set honestly here: the home
 * page and /spraying are the two that matter commercially, and /spraying is the one
 * the paid traffic is meant to reach.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes: { path: string; priority: number; changeFrequency: 'monthly' | 'yearly' }[] = [
    { path: '/', priority: 1, changeFrequency: 'monthly' },
    { path: '/spraying', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/dustless-sanding', priority: 0.8, changeFrequency: 'yearly' },
    { path: '/interior-decoration', priority: 0.7, changeFrequency: 'yearly' },
    { path: '/exterior-decoration', priority: 0.7, changeFrequency: 'yearly' },
    { path: '/wallpaper-hanging', priority: 0.6, changeFrequency: 'yearly' },
    { path: '/reviews', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/about', priority: 0.5, changeFrequency: 'yearly' },
    { path: '/contact', priority: 0.8, changeFrequency: 'yearly' },
    { path: '/leave-a-review', priority: 0.3, changeFrequency: 'yearly' },
  ]

  return routes.map((route) => ({
    url: route.path === '/' ? siteUrl : `${siteUrl}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
