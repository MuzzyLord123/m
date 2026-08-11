import type { Metadata } from 'next';

import { site } from '@content/site';

/**
 * One place that builds a page's title, description, canonical URL and sharing
 * tags together.
 *
 * It exists because of a trap: setting `openGraph` on a page replaces the
 * inherited object wholesale, which silently drops the site's sharing image. Do
 * that on eight pages by hand and seven of them end up previewing as a blank
 * grey box. Here the image is always attached — the job's own hero photograph
 * where there is one, the typographic card otherwise.
 */

const DEFAULT_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: `${site.name} — decorator and hand-painted kitchens, Chester`,
};

export function pageMetadata({
  title,
  description,
  path,
  type = 'website',
  image,
}: {
  title: string;
  description: string;
  /** Route path, leading slash. Used for the canonical and og:url. */
  path: string;
  type?: 'website' | 'article';
  /** A job's hero photograph, where it has one. */
  image?: { url: string; alt: string };
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      type,
      siteName: site.name,
      locale: 'en_GB',
      images: [image ?? DEFAULT_IMAGE],
    },
  };
}
