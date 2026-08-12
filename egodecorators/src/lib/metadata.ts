import type { Metadata } from 'next';
import { site } from '@content/site';

/**
 * Page metadata.
 *
 * Every title names the place, because every search that matters here has a
 * place in it. Descriptions are written for a person deciding whether to click,
 * not stuffed for a crawler.
 */

export function pageMetadata({
  title,
  description,
  path,
  type = 'website',
}: {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
}): Metadata {
  const url = `${site.url}${path}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      locale: 'en_GB',
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}
