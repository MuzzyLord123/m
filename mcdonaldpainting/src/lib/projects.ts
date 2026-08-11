import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

import { SECTOR_SLUGS, sectorBySlug, type SectorEntry } from '@content/sectors';

/**
 * Site records.
 *
 * A record is an MDX file in content/projects. The frontmatter carries the seven
 * caption fields; the body carries whatever is worth saying about the job that
 * does not fit in them.
 *
 * Validation here is deliberately loud. A record with a photograph and no alt
 * text, or a sector that is not in the index, fails the build with the filename
 * in the message. What it does NOT do is complain about a null caption field —
 * a null is the honest answer to a question nobody has asked Sean yet, and it
 * renders on the page as an outstanding item rather than being filled in.
 */

/**
 * confirmed — every field checked with Sean and with the client.
 * drafted   — written from what is known; unconfirmed fields left null.
 * wanted    — not a job. A request for a record that is missing, rendered as a
 *             labelled empty frame stating what is needed and why.
 */
export type RecordStatus = 'confirmed' | 'drafted' | 'wanted';

export type RecordImage = {
  src?: string;
  /** Required once src is set. One line describing the work shown. */
  alt?: string;
  /** Required when src is absent: what photograph belongs here. */
  needs?: string;
  /** Intrinsic pixel size. Reserves the space and keeps CLS at zero. */
  width?: number;
  height?: number;
  /** Where a client or a third party supplied the image. Kept for the
   *  permission trail — one of the company's Instagram posts credits a client
   *  account, and that matters if the photograph is republished here. */
  credit?: string;
};

export type SiteRecordData = {
  slug: string;
  title: string;
  status: RecordStatus;
  sector: string;
  sectorEntry: SectorEntry;
  summary: string;
  featured: boolean;

  /** The caption block. Null means outstanding, not absent. */
  clientType: string | null;
  scope: string | null;
  location: string | null;
  duration: string | null;
  system: string | null;
  occupied: boolean | null;
  year: number | null;

  image: RecordImage;
  body: string;
};

const DIR = path.join(process.cwd(), 'content', 'projects');

function fail(file: string, message: string): never {
  throw new Error(`content/projects/${file}: ${message}`);
}

function optionalString(value: unknown, file: string, field: string): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') fail(file, `${field} must be a string or null`);
  return value;
}

function parse(file: string): SiteRecordData {
  const raw = fs.readFileSync(path.join(DIR, file), 'utf8');
  const { data, content } = matter(raw);

  const slug = file.replace(/\.mdx$/, '');

  if (typeof data.title !== 'string' || data.title.trim() === '') {
    fail(file, 'title is required');
  }

  const status = data.status as RecordStatus;
  if (!['confirmed', 'drafted', 'wanted'].includes(status)) {
    fail(file, `status must be confirmed, drafted or wanted (got ${String(data.status)})`);
  }

  if (typeof data.sector !== 'string' || !SECTOR_SLUGS.includes(data.sector)) {
    fail(
      file,
      `sector must be one of ${SECTOR_SLUGS.join(', ')} (got ${String(data.sector)})`,
    );
  }
  const sectorEntry = sectorBySlug(data.sector);
  if (!sectorEntry) fail(file, `no sector entry for ${data.sector}`);

  if (typeof data.summary !== 'string' || data.summary.trim() === '') {
    fail(file, 'summary is required — one line for the index page');
  }

  const image = (data.image ?? {}) as RecordImage;
  if (image.src) {
    if (!image.alt) fail(file, 'image.src is set, so image.alt is required');
    if (!image.width || !image.height) {
      fail(file, 'image.src is set, so image.width and image.height are required (real pixel size)');
    }
  } else if (!image.needs) {
    fail(file, 'image needs either src + alt + width + height, or a `needs` line saying what belongs there');
  }

  if (data.occupied !== null && data.occupied !== undefined && typeof data.occupied !== 'boolean') {
    fail(file, 'occupied must be true, false or null');
  }

  if (data.year !== null && data.year !== undefined && typeof data.year !== 'number') {
    fail(file, 'year must be a number or null');
  }

  // A confirmed record is one that claims to be complete, so it has to be.
  if (status === 'confirmed') {
    const outstanding = (['clientType', 'scope', 'location', 'duration', 'system'] as const).filter(
      (k) => !data[k],
    );
    if (outstanding.length) {
      fail(
        file,
        `status is "confirmed" but ${outstanding.join(', ')} ${
          outstanding.length === 1 ? 'is' : 'are'
        } still null. Either fill them in or set status to "drafted".`,
      );
    }
  }

  return {
    slug,
    title: data.title,
    status,
    sector: data.sector,
    sectorEntry,
    summary: data.summary,
    featured: data.featured === true,
    clientType: optionalString(data.clientType, file, 'clientType'),
    scope: optionalString(data.scope, file, 'scope'),
    location: optionalString(data.location, file, 'location'),
    duration: optionalString(data.duration, file, 'duration'),
    system: optionalString(data.system, file, 'system'),
    occupied: (data.occupied ?? null) as boolean | null,
    year: (data.year ?? null) as number | null,
    image,
    body: content.trim(),
  };
}

let cache: SiteRecordData[] | null = null;

/** Real records first, then the wanted slots. Within each, by sector order. */
export function getRecords(): SiteRecordData[] {
  if (cache) return cache;

  const files = fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith('.mdx') && !f.startsWith('_'));

  const records = files.map(parse);

  const sectorRank = (r: SiteRecordData) => SECTOR_SLUGS.indexOf(r.sector);
  records.sort(
    (a, b) =>
      Number(a.status === 'wanted') - Number(b.status === 'wanted') ||
      sectorRank(a) - sectorRank(b) ||
      a.title.localeCompare(b.title),
  );

  cache = records;
  return records;
}

export function getRecord(slug: string): SiteRecordData | undefined {
  return getRecords().find((r) => r.slug === slug);
}

export function recordsForSector(slug: string): SiteRecordData[] {
  return getRecords().filter((r) => r.sector === slug);
}

/**
 * Home page: three records, commercial first.
 *
 * `featured: true` in the frontmatter opts a record in. Residential is filtered
 * out regardless — the home page is arguing for commercial work, and a domestic
 * job at the top of it undoes the argument.
 */
export function featuredRecords(limit = 3): SiteRecordData[] {
  return getRecords()
    .filter((r) => r.featured && r.status !== 'wanted' && r.sector !== 'residential')
    .slice(0, limit);
}

/** The seven caption fields, in the order they are always shown. */
export function captionFields(record: SiteRecordData) {
  return [
    { label: 'Sector', value: record.sectorEntry.label },
    { label: 'Client type', value: record.clientType },
    { label: 'Scope', value: record.scope },
    { label: 'Location', value: record.location },
    { label: 'Duration', value: record.duration },
    { label: 'System applied', value: record.system },
    {
      label: 'Occupied during works',
      value: record.occupied === null ? null : record.occupied ? 'Yes' : 'No',
    },
  ] as const;
}
