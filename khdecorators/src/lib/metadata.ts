import type { Metadata } from 'next'
import { siteUrl, town } from '@content/site'

/**
 * Page titles and descriptions.
 *
 * The old site's titles were "Home", "About us" and "Reviews" — no business name, no
 * service, no place. That is the cheapest high-impact fix on the whole project: those
 * are the words a person reads in a search result before deciding whether to click,
 * and they are a ranking input for the local searches Kenny is paying for.
 *
 * Every title on this site names a service and a place. Every description names the
 * town and gives the number. `{town}` is substituted from /content/site.ts, so when
 * the town is confirmed it updates in all nine of them at once.
 */

/** Substitute the shared placeholders into a string of copy. */
export function fill(text: string): string {
  return text.replaceAll('{town}', town)
}

export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string
  description: string
  /** Route, with a leading slash. '/' for the home page. */
  path: string
}): Metadata {
  const resolvedTitle = fill(title)
  const resolvedDescription = fill(description)
  const url = path === '/' ? siteUrl : `${siteUrl}${path}`

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: { canonical: url },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url,
      siteName: 'KH Decorators',
      locale: 'en_GB',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description: resolvedDescription,
    },
  }
}
