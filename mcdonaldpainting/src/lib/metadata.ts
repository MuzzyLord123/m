import type { Metadata } from 'next';

import { site } from '@content/site';

/**
 * One place that knows how a page's head is assembled, so canonical, Open Graph
 * and robots cannot drift apart page by page.
 *
 * Titles are built on sector and place rather than on the trade. The current
 * site's title stuffs "Painters & Decorators", which competes for domestic
 * searches the company does not want to win and does nothing for the searches
 * it does — "commercial painting contractors", "factory painting", "school
 * decorating contractors".
 */
export function pageMetadata({
  title,
  description,
  path,
  type = 'website',
}: {
  title: string;
  description: string;
  /** Leading slash, no trailing slash. '/' for the home page. */
  path: string;
  type?: 'website' | 'article';
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      locale: 'en_GB',
      siteName: site.name,
      url: path,
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
  };
}
