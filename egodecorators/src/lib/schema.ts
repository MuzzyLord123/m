import { phone, email, site, profiles, sameAsUrls, FOUNDED } from '@content/site';
import type { Project } from './projects';

/**
 * Structured data. Every value traces back to a fact in content/.
 *
 * Deliberately absent: aggregateRating. The Yell rating belongs to Yell. Marking
 * up a third-party rating as if it were the business's own review data is
 * against Google's structured-data policy and is the kind of thing that gets a
 * small firm's rich results turned off entirely. The rating is shown on the page
 * as plain text with its source and the date it was read, or not at all.
 */

const BUSINESS_ID = `${site.url}/#business`;

const areaServed = site.areaServed.map((name) => ({
  '@type': 'AdministrativeArea' as const,
  name,
}));

/** The services, one entity each, pointed at the page that describes them. */
const SERVICES = [
  {
    path: '/repairs',
    name: 'Exterior woodwork repair',
    serviceType: 'Window, soffit and fascia repair',
    description:
      'Rotten and damaged external woodwork cut out and spliced, filled, primed and finished. Windows, doors, cills, soffits, fascias and barge boards.',
  },
  {
    path: '/exterior',
    name: 'Exterior decorating',
    serviceType: 'Exterior painting and decorating',
    description:
      'Render, pebbledash and masonry, timber, metalwork and rainwater goods, on whole houses or single elevations.',
  },
  {
    path: '/interior',
    name: 'Interior decorating',
    serviceType: 'Interior painting and decorating',
    description:
      'Walls, ceilings, woodwork and papering, from a single stained ceiling to a full property redecoration.',
  },
  {
    path: '/commercial',
    name: 'Commercial and industrial decorating',
    serviceType: 'Commercial painting and decorating',
    description:
      'Offices, warehouses, churches and care homes, worked in phases or out of hours around occupied premises.',
  },
] as const;

export function businessSchema() {
  const links = sameAsUrls();

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'HousePainter',
        '@id': BUSINESS_ID,
        name: site.name,
        url: site.url,
        telephone: phone.e164,
        email: email.address,
        description:
          'Family-run painters and decorators in Neston, Cheshire, specialising in repairs to external windows, soffits, fascias and damaged woodwork alongside interior and exterior decorating for domestic, commercial and industrial properties.',
        // foundingDate is omitted rather than guessed. The old site's
        // "15 Years Extensive Experience" was written in 2022 and has been wrong
        // every year since. See content/needed.json#founded.
        ...(FOUNDED !== null ? { foundingDate: String(FOUNDED) } : {}),
        areaServed,
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'Neston',
          addressRegion: 'Cheshire',
          addressCountry: 'GB',
        },
        knowsAbout: [
          'Exterior window repair',
          'Soffit and fascia repair',
          'Damaged woodwork repair',
          'Interior decorating',
          'Exterior decorating',
          'Commercial decorating',
        ],
        ...(links.length ? { sameAs: links } : {}),
      },

      ...SERVICES.map((s) => ({
        '@type': 'Service' as const,
        '@id': `${site.url}${s.path}#service`,
        name: s.name,
        serviceType: s.serviceType,
        description: s.description,
        provider: { '@id': BUSINESS_ID },
        areaServed,
        url: `${site.url}${s.path}`,
      })),

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
  const hero = project.after.src ?? project.before.src;

  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.problem,
    ...(project.year ? { dateCreated: String(project.year) } : {}),
    ...(project.location
      ? { contentLocation: { '@type': 'Place', name: project.location } }
      : {}),
    ...(hero ? { image: `${site.url}${hero}` } : {}),
    creator: { '@id': BUSINESS_ID },
    url: `${site.url}/projects/${project.slug}`,
  };
}

/** Rendered once per page in a <script type="application/ld+json">. */
export function jsonLd(data: object): string {
  // Escape the sequence that would let a value close the script tag early.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export { profiles };
