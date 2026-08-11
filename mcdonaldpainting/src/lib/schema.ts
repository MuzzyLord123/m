import {
  accreditation,
  areaServed,
  coverage,
  email,
  founded,
  phone,
  site,
  socials,
} from '@content/site';

/**
 * Structured data. Every value traces to content/site.ts, and anything not
 * confirmed there is omitted rather than guessed.
 *
 * Deliberately absent:
 *
 *   aggregateRating — there are no reviews on this site yet, and third-party
 *   aggregate markup is against Google's structured data policy regardless.
 *   If a rating is ever added it comes from the company's own verified Business
 *   Profile, not from here.
 *
 *   foundingDate — the company number suggests 2016. A suggestion is not a
 *   source, and this is exactly the field a buyer cross-checks against
 *   Companies House.
 *
 *   hasCredential — SafeContractor approval is real, but a credential entity
 *   without an identifier, a scope and an expiry is decoration. It goes in the
 *   moment content/needed.json#safecontractor is answered; the shape is below,
 *   commented, so it is a two-line change rather than a research task.
 */

const BUSINESS_ID = `${site.url}/#business`;

function sameAs(): string[] {
  // The M & R Painting Contractors handles are not here on purpose. The current
  // site links to both sets on the same page; telling Google the company owns
  // two identities is not a tidy-up we want to make permanent.
  return [socials.instagram, socials.facebook];
}

function areas() {
  return [
    ...areaServed.map((name) => ({ '@type': 'AdministrativeArea' as const, name })),
    { '@type': 'Country' as const, name: 'United Kingdom' },
  ];
}

function service(id: string, name: string, serviceType: string, description: string) {
  return {
    '@type': 'Service',
    '@id': `${site.url}${id}`,
    name,
    serviceType,
    description,
    provider: { '@id': BUSINESS_ID },
    areaServed: areas(),
  };
}

export function businessSchema() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        // HousePainter is the specific type Google understands; Organization is
        // the one a procurement system will parse. Both, on one node.
        '@type': ['HousePainter', 'Organization'],
        '@id': BUSINESS_ID,
        name: site.name,
        legalName: site.legalName,
        url: site.url,
        telephone: phone.e164,
        ...(email.confirmed ? { email: email.published } : {}),
        description:
          'Family-run painting and decorating contractor based in Cheshire, working on commercial and industrial contracts across the United Kingdom. Programmed and maintenance painting contracts, steelwork, floor and roof coatings.',
        identifier: {
          '@type': 'PropertyValue',
          name: 'Companies House company number',
          value: site.companyNumber,
        },
        ...(founded.year ? { foundingDate: String(founded.year) } : {}),
        address: {
          '@type': 'PostalAddress',
          addressRegion: 'Cheshire',
          addressCountry: 'GB',
        },
        areaServed: areas(),
        knowsAbout: [
          'Commercial painting contracts',
          'Industrial painting contracts',
          'Programmed painting maintenance',
          'Steelwork painting',
          'Floor coatings',
          'Roof coatings',
          'School and college decorating',
          'Working in occupied buildings',
        ],
        sameAs: sameAs(),
        // Filled in from content/site.ts once the certificate is to hand:
        // hasCredential: {
        //   '@type': 'EducationalOccupationalCredential',
        //   credentialCategory: 'certification',
        //   name: 'SafeContractor approved',
        //   identifier: accreditation.certificateNumber,
        //   recognizedBy: { '@type': 'Organization', name: accreditation.body },
        //   validUntil: accreditation.expires,
        // },
        ...(accreditation.certificateNumber
          ? {
              hasCredential: {
                '@type': 'EducationalOccupationalCredential',
                credentialCategory: 'certification',
                name: `${accreditation.name} approved`,
                identifier: accreditation.certificateNumber,
                recognizedBy: { '@type': 'Organization', name: accreditation.body },
                ...(accreditation.expires ? { validUntil: accreditation.expires } : {}),
              },
            }
          : {}),
      },
      service(
        '/programmed-maintenance#service',
        'Programmed painting maintenance contracts',
        'Programmed and cyclical painting maintenance',
        'Multi-year painting programmes for buildings and estates: surveyed once, phased across the term, priced per phase against the surveyed schedule and reported after each phase.',
      ),
      service(
        '/sectors/steelwork#service',
        'Steelwork painting',
        'Industrial steelwork painting and protective coatings',
        'Preparation and coating of structural steel, portal frames, gantries, walkways, plant and pipework, worked around shutdowns and shift patterns.',
      ),
      service(
        '/capabilities#floors',
        'Floor coatings',
        'Industrial floor painting and coating',
        'Warehouse, workshop and plant room floor coatings, walkways and bay markings, specified against traffic type, slab moisture and the time the area can be out of use.',
      ),
      service(
        '/capabilities#roofs',
        'Roof coatings',
        'Industrial roof coating and repair',
        'Coating and localised repair to profiled metal sheet roofs, flashings and gutter lines, surveyed before coating rather than coated over failure.',
      ),
    ],
  };
}

/** Breadcrumbs, so a sector page shows its place in search results. */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${site.url}${item.path}`,
    })),
  };
}

/** Coverage, said once in the schema and once in the sheet header. */
export const coverageSummary = `${coverage.localLong}. ${coverage.wider}.`;

export function jsonLd(data: unknown) {
  return {
    __html: JSON.stringify(data).replace(/</g, '\\u003c'),
  };
}
