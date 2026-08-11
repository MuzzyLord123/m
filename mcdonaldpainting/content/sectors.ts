/**
 * The sector index.
 *
 * This is the site's primary navigation, and it is the argument the whole
 * rebuild rests on. The old navigation was eight tabs — Home, About Us, Projects
 * Gallery, Health & Safety, Blog, FAQ, Testimonials, Contact — none of which
 * told a facilities manager whether this firm could paint their factory.
 *
 * These eight rows do. They are also eight real pages, eight entries in the
 * sitemap and eight landing surfaces for searches that name a building type
 * rather than a trade.
 *
 * Numbering is fixed and starts at 01. It is displayed, so it does not get
 * reordered on a whim — a numbered index that changes order is just a list.
 */

export type SectorEntry = {
  /** Displayed. Two digits, always. */
  number: string;
  label: string;
  href: string;
  /** The MDX file in content/sectors that supplies the page body.
   *  Null for 06, which is a top-level route of its own. */
  slug: string | null;
  /** One line, shown under the label in the overlay and on the home page. */
  summary: string;
  /**
   * `full` — written out at length, with phasing, compliance and evidence.
   * `written` — a real page, shorter, because the evidence to go deeper is not
   *   in yet. Not padded to look like the others.
   *
   * Nothing here is a stub. If a sector could not support a page it would have
   * been cut rather than filled.
   */
  depth: 'full' | 'written';
};

export const SECTORS: readonly SectorEntry[] = [
  {
    number: '01',
    label: 'Education',
    href: '/sectors/education',
    slug: 'education',
    summary:
      'Schools, colleges and academy trusts. Holiday programmes, term-time evening work, safeguarding.',
    depth: 'full',
  },
  {
    number: '02',
    label: 'Healthcare',
    href: '/sectors/healthcare',
    slug: 'healthcare',
    summary:
      'Hospitals, clinics and care settings. Infection control, ward decant, low-odour systems.',
    depth: 'written',
  },
  {
    number: '03',
    label: 'Industrial & manufacturing',
    href: '/sectors/industrial',
    slug: 'industrial',
    summary:
      'Factories, warehouses and production halls. Steelwork, floors, roofs, shutdowns and night shifts.',
    depth: 'full',
  },
  {
    number: '04',
    label: 'Offices & commercial',
    href: '/sectors/offices',
    slug: 'offices',
    summary:
      'Offices, common parts and multi-let buildings. Out-of-hours working, landlord and tenant scope.',
    depth: 'written',
  },
  {
    number: '05',
    label: 'Hospitality & retail',
    href: '/sectors/hospitality-retail',
    slug: 'hospitality-retail',
    summary:
      'Hotels, shops, restaurants and cafés. Closed-period working and rooms handed back for service.',
    depth: 'written',
  },
  {
    number: '06',
    label: 'Programmed maintenance',
    href: '/programmed-maintenance',
    slug: null,
    summary:
      'Multi-year painting programmes: how they are surveyed, phased, priced and reported.',
    depth: 'full',
  },
  {
    number: '07',
    label: 'Steelwork & specialist coatings',
    href: '/sectors/steelwork',
    slug: 'steelwork',
    summary:
      'Structural steel, plant, floors and roofs. Preparation grades, coating build, dry film thickness.',
    depth: 'written',
  },
  {
    number: '08',
    label: 'Residential',
    href: '/sectors/residential',
    slug: 'residential',
    summary:
      'Houses and private work across Chester, the Wirral and North Wales. The trade the company grew from.',
    depth: 'written',
  },
];

export function sectorByHref(href: string): SectorEntry | undefined {
  return SECTORS.find((s) => s.href === href);
}

export function sectorBySlug(slug: string): SectorEntry | undefined {
  return SECTORS.find((s) => s.slug === slug);
}

/** The slugs that resolve under /sectors/[sector]. 06 is not one of them. */
export const SECTOR_SLUGS = SECTORS.map((s) => s.slug).filter(
  (s): s is string => s !== null,
);
