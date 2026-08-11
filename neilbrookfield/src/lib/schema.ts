import { phone, site, FOUNDED } from '@content/site';
import { googleProfileUrl } from '@content/reviews';
import type { Project } from './projects';

/**
 * Structured data. Every value here traces to a fact in content/.
 *
 * Deliberately absent: aggregateRating. There are three reviews and no score
 * that came from anything real, and inventing one is both dishonest and against
 * Google's guidelines. If a rating is ever added it comes from the Business
 * Profile, not from here.
 */

const BUSINESS_ID = `${site.url}/#business`;

/** Google profile first, then anything else confirmed. Empty is omitted. */
function sameAs(): string[] {
  return [googleProfileUrl].filter((u): u is string => Boolean(u));
  // See content/needed.ts#social for Facebook / Instagram, if they exist.
}

export function businessSchema() {
  const links = sameAs();

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'HousePainter',
        '@id': BUSINESS_ID,
        name: site.name,
        url: site.url,
        telephone: phone.e164,
        description:
          'Decorator in Chester specialising in hand-painted kitchens and furniture, alongside interior and exterior decorating, wallpapering and exterior woodwork repair.',
        foundingDate: site.foundingDate,
        founder: {
          '@type': 'Person',
          name: site.name,
        },
        areaServed: site.areaServed.map((name) => ({
          '@type': 'AdministrativeArea',
          name,
        })),
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Chester',
          addressRegion: 'Cheshire',
          addressCountry: 'GB',
        },
        knowsAbout: [
          'Hand-painted kitchens',
          'Hand-painted furniture',
          'Paint effects',
          'Interior decorating',
          'Exterior decorating',
          'Wallpapering',
          'Exterior woodwork repair',
        ],
        ...(links.length ? { sameAs: links } : {}),
      },
      {
        '@type': 'Service',
        '@id': `${site.url}/hand-painted-kitchens#service`,
        name: 'Hand-painted kitchens',
        serviceType: 'Hand-painted kitchen and furniture painting',
        description:
          'Existing kitchens painted by hand on site: doors removed and labelled, degreased, filled, flatted and primed, then finished in two thin coats of brushed eggshell.',
        provider: { '@id': BUSINESS_ID },
        areaServed: site.areaServed.map((name) => ({ '@type': 'AdministrativeArea', name })),
        url: `${site.url}/hand-painted-kitchens`,
      },
      {
        '@type': 'Service',
        '@id': `${site.url}/workshops#service`,
        name: 'One-to-one home decorating lessons',
        serviceType: 'Decorating tuition',
        description:
          "A Saturday session in the customer's own home, one to one: preparation, hanging wallpaper, preparing and painting furniture, and advice on colour and materials.",
        provider: { '@id': BUSINESS_ID },
        areaServed: site.areaServed.map((name) => ({ '@type': 'AdministrativeArea', name })),
        url: `${site.url}/workshops`,
        // No offers block: the 2024 pricing has not been re-confirmed.
        // See content/needed.ts#workshop-pricing.
      },
      {
        '@type': 'WebSite',
        '@id': `${site.url}/#website`,
        url: site.url,
        name: site.name,
        publisher: { '@id': BUSINESS_ID },
        inLanguage: 'en-GB',
      },
    ],
  };
}

export function projectSchema(project: Project) {
  const hero = project.images.find((i) => i.src);

  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    ...(project.brief ? { description: project.brief } : {}),
    ...(project.year ? { dateCreated: String(project.year) } : {}),
    ...(project.location ? { contentLocation: { '@type': 'Place', name: project.location } } : {}),
    ...(hero?.src ? { image: `${site.url}${hero.src}` } : {}),
    creator: { '@id': BUSINESS_ID },
    url: `${site.url}/work/${project.slug}`,
  };
}

/** Rendered once per page in a <script type="application/ld+json">. */
export function jsonLd(data: object): string {
  // Escape the sequence that would let a value close the script tag early.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export { FOUNDED };
