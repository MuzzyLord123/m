import type { Metadata } from 'next';
import Link from 'next/link';

import { Band, SectionHead } from '@/components/Band';
import { SheetHeader } from '@/components/SheetHeader';
import { SiteRecord, WantedRecord } from '@/components/SiteRecord';
import { pageMetadata } from '@/lib/metadata';
import { getRecords } from '@/lib/projects';
import { projects } from '@content/copy/projects';
import { SECTORS } from '@content/sectors';

export const metadata: Metadata = pageMetadata({
  title: projects.meta.title,
  description: projects.meta.description,
  path: '/projects',
});

/**
 * /projects — replaces /projects-gallery/.
 *
 * The filter is a set of links with a query string rather than a client-side
 * control. It works with JavaScript off, each filtered view is a real URL that
 * can be sent to somebody, and the page stays a server component.
 */
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string }>;
}) {
  const { sector } = await searchParams;
  const all = getRecords();
  const active = SECTORS.find((s) => s.slug === sector)?.slug ?? null;

  const shown = active ? all.filter((r) => r.sector === active) : all;
  const real = shown.filter((r) => r.status !== 'wanted');
  const wanted = shown.filter((r) => r.status === 'wanted');

  // Only offer a filter for sectors that have something behind them.
  const available = SECTORS.filter((s) => s.slug && all.some((r) => r.sector === s.slug));

  return (
    <>
      <SheetHeader title={projects.sheet.title} standfirst={projects.sheet.standfirst} />

      <Band ground="steel" className="!py-8">
        <nav aria-label={projects.filter.label} className="flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <span className="t-label">{projects.filter.label}</span>
          <Link
            href="/projects"
            aria-current={active ? undefined : 'page'}
            className={`t-label ${active ? '!text-bone hover:!text-hivis' : '!text-hivis underline underline-offset-4'}`}
          >
            {projects.filter.all}
          </Link>
          {available.map((s) => (
            <Link
              key={s.number}
              href={`/projects?sector=${s.slug}`}
              aria-current={active === s.slug ? 'page' : undefined}
              className={`t-label ${
                active === s.slug ? '!text-hivis underline underline-offset-4' : '!text-bone hover:!text-hivis'
              }`}
            >
              {s.number} {s.label}
            </Link>
          ))}
        </nav>
      </Band>

      {real.length ? (
        <div data-ground="graphite" className="pt-[var(--spacing-band)]">
          {real.map((record, i) => (
            <SiteRecord
              key={record.slug}
              record={record}
              size="full"
              priority={i === 0}
              headingLevel="h2"
            />
          ))}
        </div>
      ) : (
        <Band ground="graphite">
          <p className="t-lead max-w-[52ch] text-concrete">
            No published record in this sector yet. What is wanted, and why, is below.
          </p>
        </Band>
      )}

      {wanted.length ? (
        <Band ground="graphite" className={real.length ? '!pt-0' : '!pt-0'}>
          <SectionHead title={projects.note.title} standfirst={projects.note.body} />
          <div className="mt-10">
            {wanted.map((record) => (
              <WantedRecord key={record.slug} record={record} />
            ))}
          </div>
        </Band>
      ) : null}
    </>
  );
}
