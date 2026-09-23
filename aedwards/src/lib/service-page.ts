import type { Metadata } from 'next'
import { serviceBySlug, type Service } from '@content/services'

/**
 * The two things every service route needs, so the route files stay four lines
 * each and there is one place to change how a service page is titled.
 *
 * Titles come out as "Interior painting and decorating in Flint | A Edwards
 * Decorating" — the template lives in the root layout.
 */

export function service(slug: string): Service {
  const found = serviceBySlug(slug)
  if (!found) {
    throw new Error(
      `There is a route for service "${slug}" but no entry in content/services.ts. ` +
        `Add it there or delete the route — an empty service page is worse than none.`,
    )
  }
  return found
}

export function serviceMetadata(slug: string): Metadata {
  const s = service(slug)
  return {
    title: s.title,
    description: s.description,
    alternates: { canonical: `/${s.slug}` },
    openGraph: {
      title: s.title,
      description: s.description,
      url: `/${s.slug}`,
    },
  }
}
