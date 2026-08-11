import fs from 'node:fs';
import path from 'node:path';

import { PLATES, type Plate } from '@content/gallery';
import { SECTOR_SLUGS, sectorBySlug, type SectorEntry } from '@content/sectors';

/**
 * Gallery plates, resolved against what is actually on disk.
 *
 * The point of this file is the `present` flag. A plate can be listed in
 * content/gallery.ts before its photograph has been uploaded, and the page
 * renders a labelled empty frame for it instead of a broken image. That is what
 * makes it possible to write up fifty photographs in one sitting and upload
 * them over a week without the site being wrong in the meantime.
 *
 * The check runs at build time, in a server component. It costs nothing at
 * request time and it cannot be forgotten.
 */

export type ResolvedImage = {
  src: string;
  alt: string;
  /** False when the file is not in public/ yet. */
  present: boolean;
};

export type ResolvedPlate = {
  plate: Plate;
  /** 01, 02, 03 … in document order, across the whole gallery. */
  number: string;
  sectorEntry: SectorEntry;
  images: ResolvedImage[];
  /** True when every image the plate needs is on disk. */
  complete: boolean;
};

const PUBLIC = path.join(process.cwd(), 'public');

function resolve(image: { src: string; alt: string }): ResolvedImage {
  return { ...image, present: fs.existsSync(path.join(PUBLIC, image.src)) };
}

function imagesOf(plate: Plate): ResolvedImage[] {
  return plate.kind === 'single'
    ? [resolve({ src: plate.src, alt: plate.alt })]
    : [resolve(plate.before), resolve(plate.after)];
}

let cache: ResolvedPlate[] | null = null;

export function getPlates(): ResolvedPlate[] {
  if (cache) return cache;

  cache = PLATES.map((plate, i) => {
    const sectorEntry = sectorBySlug(plate.sector);
    if (!sectorEntry) {
      throw new Error(
        `content/gallery.ts: plate "${plate.id}" has sector "${plate.sector}", which is not in content/sectors.ts. Valid: ${SECTOR_SLUGS.join(', ')}`,
      );
    }

    const images = imagesOf(plate);
    for (const image of images) {
      if (!image.alt?.trim()) {
        throw new Error(
          `content/gallery.ts: plate "${plate.id}" has an image with no alt text. It describes the work shown, and it is what a blind visitor hears.`,
        );
      }
    }

    return {
      plate,
      number: String(i + 1).padStart(2, '0'),
      sectorEntry,
      images,
      complete: images.every((image) => image.present),
    };
  });

  const missing = cache.filter((p) => !p.complete).length;
  if (missing && process.env.NODE_ENV !== 'production') {
    console.warn(
      `[gallery] ${missing} of ${cache.length} plates are waiting for their photographs. They render as labelled frames until the files land in public/photographs/gallery/.`,
    );
  }

  return cache;
}

export function platesForSector(slug: string | null): ResolvedPlate[] {
  const all = getPlates();
  return slug ? all.filter((p) => p.plate.sector === slug) : all;
}

/** Sectors with at least one plate, in the order of the sector index. */
export function galleryFilters(): SectorEntry[] {
  const used = new Set(getPlates().map((p) => p.plate.sector));
  return SECTOR_SLUGS.filter((s) => used.has(s)).map((s) => sectorBySlug(s)!);
}

export function galleryCounts() {
  const all = getPlates();
  return {
    plates: all.length,
    photographs: all.reduce((n, p) => n + p.images.length, 0),
    // Both kinds are a before and after; only one of them has a divider.
    comparisons: all.filter((p) => p.plate.kind !== 'single').length,
    awaiting: all.filter((p) => !p.complete).length,
  };
}

/** Tailwind cannot see a class it has to compute, so the spans are spelled out. */
export const SPAN_CLASS: Record<number, string> = {
  4: 'md:col-span-6 lg:col-span-4',
  6: 'md:col-span-6',
  8: 'md:col-span-12 lg:col-span-8',
  12: 'md:col-span-12',
};

export const RATIO_CLASS: Record<string, string> = {
  '1/1': 'aspect-square',
  '3/4': 'aspect-[3/4]',
  '4/3': 'aspect-[4/3]',
  '3/2': 'aspect-[3/2]',
  '16/9': 'aspect-[16/9]',
  '21/9': 'aspect-[21/9]',
};
