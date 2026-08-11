import type { Metadata } from 'next';
import Link from 'next/link';

import { Arrow } from '@/components/Arrow';
import { Band, SectionHead } from '@/components/Band';
import { DataStrip } from '@/components/DataStrip';
import { GalleryPlate } from '@/components/GalleryPlate';
import { CapabilityStatementAction } from '@/components/PrimaryAction';
import { SheetHeader, DEFAULT_META } from '@/components/SheetHeader';
import { pageMetadata } from '@/lib/metadata';
import { galleryCounts, galleryFilters, platesForSector } from '@/lib/gallery';
import { gallery } from '@content/copy/gallery';

export const metadata: Metadata = pageMetadata({
  title: gallery.meta.title,
  description: gallery.meta.description,
  path: '/gallery',
});

/**
 * /gallery — replaces the old /projects-gallery/.
 *
 * The old page was photographs with nothing attached. This one is photographs
 * with a number, a shape somebody chose, and a caption saying what the work
 * was. It is still a gallery, and it is deliberately not pretending to be the
 * evidence: the site records are a page away and every plate points at them.
 *
 * The filter is links with a query string rather than a client-side control, so
 * it works with JavaScript off, each view is a real URL somebody can send, and
 * the page stays a server component.
 */
export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string }>;
}) {
  const { sector } = await searchParams;
  const filters = galleryFilters();
  const active = filters.find((f) => f.slug === sector)?.slug ?? null;
  const plates = platesForSector(active);
  const counts = galleryCounts();

  return (
    <>
      <SheetHeader
        eyebrow="Gallery"
        title={gallery.sheet.title}
        standfirst={gallery.sheet.standfirst}
        meta={[
          { label: 'Plates', value: String(counts.plates) },
          { label: 'Before and after', value: String(counts.comparisons) },
          ...DEFAULT_META.slice(2),
        ]}
      >
        <CapabilityStatementAction />
      </SheetHeader>

      {/* Only shown while photographs are outstanding. It disappears by itself
          the moment the last file lands — nothing to remember to delete. */}
      {counts.awaiting ? (
        <Band ground="steel" className="!py-10">
          <div className="border-l-[3px] border-hivis pl-5">
            <p className="t-label !text-hivis">Uploading</p>
            <p className="mt-2 max-w-[68ch] text-[15px] leading-[1.55] text-bone">
              {counts.awaiting} of {counts.plates} plates are waiting for their files. Each one
              below states the filename it wants; drop it into{' '}
              <code className="font-display font-bold">public/photographs/gallery/</code> and the
              frame becomes the photograph. Nothing else to change.
            </p>
          </div>
        </Band>
      ) : null}

      {filters.length > 1 ? (
        <Band ground="steel" className="!py-8">
          <nav aria-label="Filter the gallery by sector" className="flex flex-wrap items-baseline gap-x-6 gap-y-3">
            <span className="t-label">Filter</span>
            <Link
              href="/gallery"
              aria-current={active ? undefined : 'page'}
              className={`t-label ${active ? '!text-bone hover:!text-hivis' : '!text-hivis underline underline-offset-4'}`}
            >
              All sectors
            </Link>
            {filters.map((f) => (
              <Link
                key={f.number}
                href={`/gallery?sector=${f.slug}`}
                aria-current={active === f.slug ? 'page' : undefined}
                className={`t-label ${
                  active === f.slug
                    ? '!text-hivis underline underline-offset-4'
                    : '!text-bone hover:!text-hivis'
                }`}
              >
                {f.number} {f.label}
              </Link>
            ))}
          </nav>
        </Band>
      ) : null}

      <Band ground="graphite">
        <div className="grid12 gap-y-14">
          {plates.map((item, i) => (
            <GalleryPlate key={item.plate.id} item={item} index={i} />
          ))}
        </div>
      </Band>

      <DataStrip figures={gallery.figures} ground="steel" />

      <Band ground="concrete">
        <SectionHead title={gallery.records.title} standfirst={gallery.records.standfirst}>
          <Link
            href="/projects"
            className="t-label inline-flex items-center gap-2 underline decoration-1 underline-offset-4"
          >
            Site records
            <Arrow />
          </Link>
        </SectionHead>
      </Band>
    </>
  );
}
