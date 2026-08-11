import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

import { SECTORS, sectorBySlug, type SectorEntry } from '@content/sectors';
import { neededById } from '@content/needed';

/**
 * Sector pages.
 *
 * Every sector in the index has a real page behind it, written from its own
 * frontmatter rather than from a shared template with the nouns swapped. The
 * shape is the same on each — what the buildings need, how the work is phased
 * around occupation, which compliance points matter here — because that is the
 * shape of the question a buyer is asking. The answers are not.
 *
 * `depth: full` marks the three that are written out at length. The rest are
 * shorter because the evidence to go deeper is not in yet, and a padded page is
 * what the company already had.
 */

export type SectorPoint = {
  label: string;
  note: string;
  /** Optional id from content/needed.json, rendered as an outstanding item. */
  confirm?: string;
};

export type SectorPage = {
  slug: string;
  entry: SectorEntry;
  title: string;
  metaTitle: string;
  metaDescription: string;
  standfirst: string;
  depth: 'full' | 'written';
  surfaces: SectorPoint[];
  phasing: { title: string; points: SectorPoint[] };
  compliance: SectorPoint[];
  enquiry: { line: string };
  /** Said out loud where a sector page is not yet backed by a site record. */
  evidence?: { note: string; needed: string };
  body: string;
};

const DIR = path.join(process.cwd(), 'content', 'sectors');

function fail(file: string, message: string): never {
  throw new Error(`content/sectors/${file}: ${message}`);
}

function points(value: unknown, file: string, field: string): SectorPoint[] {
  if (!Array.isArray(value) || value.length === 0) {
    fail(file, `${field} must be a non-empty list`);
  }
  return value.map((p, i) => {
    if (!p || typeof p.label !== 'string' || typeof p.note !== 'string') {
      fail(file, `${field}[${i}] needs a label and a note`);
    }
    if (p.confirm && !neededById(p.confirm)) {
      fail(file, `${field}[${i}].confirm = "${p.confirm}" is not in content/needed.json`);
    }
    return { label: p.label, note: p.note, confirm: p.confirm };
  });
}

function parse(slug: string): SectorPage {
  const file = `${slug}.mdx`;
  const full = path.join(DIR, file);
  if (!fs.existsSync(full)) {
    throw new Error(
      `content/sectors/${file} is missing. It is listed in content/sectors.ts, so it must exist — a sector in the index with no page behind it is a dead row in the primary navigation.`,
    );
  }

  const { data, content } = matter(fs.readFileSync(full, 'utf8'));
  const entry = sectorBySlug(slug);
  if (!entry) fail(file, 'no matching entry in content/sectors.ts');

  for (const field of ['title', 'metaTitle', 'metaDescription', 'standfirst'] as const) {
    if (typeof data[field] !== 'string' || data[field].trim() === '') {
      fail(file, `${field} is required`);
    }
  }

  if (data.depth !== 'full' && data.depth !== 'written') {
    fail(file, 'depth must be "full" or "written"');
  }
  if (data.depth !== entry.depth) {
    fail(file, `depth "${data.depth}" disagrees with content/sectors.ts ("${entry.depth}")`);
  }

  if (!data.phasing || typeof data.phasing.title !== 'string') {
    fail(file, 'phasing.title is required');
  }
  if (!data.enquiry || typeof data.enquiry.line !== 'string') {
    fail(file, 'enquiry.line is required — every sector page ends with its own enquiry line');
  }

  let evidence: SectorPage['evidence'];
  if (data.evidence) {
    if (typeof data.evidence.note !== 'string' || !neededById(data.evidence.needed)) {
      fail(file, 'evidence needs a note and a `needed` id from content/needed.json');
    }
    evidence = { note: data.evidence.note, needed: data.evidence.needed };
  }

  return {
    slug,
    entry,
    title: data.title,
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
    standfirst: data.standfirst,
    depth: data.depth,
    surfaces: points(data.surfaces, file, 'surfaces'),
    phasing: { title: data.phasing.title, points: points(data.phasing.points, file, 'phasing.points') },
    compliance: points(data.compliance, file, 'compliance'),
    enquiry: { line: data.enquiry.line },
    evidence,
    body: content.trim(),
  };
}

let cache: Map<string, SectorPage> | null = null;

function all(): Map<string, SectorPage> {
  if (cache) return cache;
  const map = new Map<string, SectorPage>();
  for (const entry of SECTORS) {
    if (entry.slug) map.set(entry.slug, parse(entry.slug));
  }
  cache = map;
  return map;
}

export function getSectorPage(slug: string): SectorPage | undefined {
  return all().get(slug);
}

export function getSectorPages(): SectorPage[] {
  return [...all().values()];
}
