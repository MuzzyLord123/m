import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';

import { Band, SectionHead } from '@/components/Band';
import { Confirm } from '@/components/Confirm';
import { EnquiryForm } from '@/components/EnquiryForm';
import { mdxComponents } from '@/components/mdx';
import { CapabilityStatementAction, PhoneAction } from '@/components/PrimaryAction';
import { SheetHeader, DEFAULT_META } from '@/components/SheetHeader';
import { Arrow } from '@/components/Arrow';
import { SiteRecord, WantedRecord } from '@/components/SiteRecord';
import { pageMetadata } from '@/lib/metadata';
import { recordsForSector } from '@/lib/projects';
import { breadcrumbSchema, jsonLd } from '@/lib/schema';
import { getSectorPage } from '@/lib/sectorPages';
import { SECTOR_SLUGS } from '@content/sectors';

/**
 * The sector page template.
 *
 * Same shape every time, because it is the shape of the question a buyer asks:
 * what do buildings like mine need, how do you work around us being in it,
 * what have you done, and what compliance applies here. The answers are written
 * per sector in content/sectors/*.mdx and are genuinely different — an
 * assembly hall and a production hall have nothing in common except that
 * somebody has to paint them while people are inside.
 *
 * The primary action changes with the sector: a capability statement for the
 * commercial ones, the phone for residential.
 */

export function generateStaticParams() {
  return SECTOR_SLUGS.map((sector) => ({ sector }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sector: string }>;
}): Promise<Metadata> {
  const { sector } = await params;
  const page = getSectorPage(sector);
  if (!page) return {};

  return pageMetadata({
    title: page.metaTitle,
    description: page.metaDescription,
    path: `/sectors/${sector}`,
  });
}

export default async function SectorPage({
  params,
}: {
  params: Promise<{ sector: string }>;
}) {
  const { sector } = await params;
  const page = getSectorPage(sector);
  if (!page) notFound();

  const records = recordsForSector(sector);
  const real = records.filter((r) => r.status !== 'wanted');
  const wanted = records.filter((r) => r.status === 'wanted');
  const domestic = sector === 'residential';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: page.entry.label, path: `/sectors/${sector}` },
          ]),
        )}
      />

      <SheetHeader
        eyebrow={`${page.entry.number} · Sector`}
        title={page.title}
        standfirst={page.standfirst}
        meta={[
          { label: 'Sector', value: `${page.entry.number} · ${page.entry.label}` },
          ...DEFAULT_META.slice(0, 3),
        ]}
      >
        {domestic ? (
          <PhoneAction note={page.enquiry.line} />
        ) : (
          <CapabilityStatementAction />
        )}
      </SheetHeader>

      <Band ground="mist">
        <SectionHead number="01" title="What these buildings need" />
        <dl className="mt-10 border-t border-[var(--rule)]">
          {page.surfaces.map((item) => (
            <div
              key={item.label}
              className="grid12 gap-y-2 border-b border-[var(--rule)] py-6"
              data-reveal
            >
              <dt className="col-span-12 lg:col-span-4">
                <span className="t-sub">{item.label}</span>
              </dt>
              <dd className="col-span-12 lg:col-span-8">
                <p className="max-w-[62ch] text-[15px] leading-[1.55]">{item.note}</p>
                {item.confirm ? <Confirm id={item.confirm} className="mt-4 max-w-[52ch]" /> : null}
              </dd>
            </div>
          ))}
        </dl>
      </Band>

      <Band ground="graphite">
        <SectionHead number="02" title={page.phasing.title} />
        <dl className="mt-10 grid grid-cols-1 gap-x-[var(--spacing-gutter)] gap-y-8 md:grid-cols-2 lg:grid-cols-3">
          {page.phasing.points.map((point) => (
            <div key={point.label} className="border-t border-[var(--rule)] pt-5" data-reveal>
              <dt className="t-sub text-[var(--ink)]">{point.label}</dt>
              <dd className="mt-3 text-[15px] leading-[1.55] text-[var(--muted)]">{point.note}</dd>
            </div>
          ))}
        </dl>
      </Band>

      {page.body ? (
        <Band ground="mist">
          <div className="grid12">
            <div className="col-span-12 lg:col-span-8">
              <div className="prose-sheet">
                <MDXRemote source={page.body} components={mdxComponents} />
              </div>
            </div>
          </div>
        </Band>
      ) : null}

      {real.length ? (
        <div data-ground="graphite" className="pt-[var(--spacing-band)]">
          <div className="shell">
            <SectionHead number="03" title="Site records in this sector" />
          </div>
          <div className="mt-12">
            {real.map((record) => (
              <SiteRecord key={record.slug} record={record} size="full" />
            ))}
          </div>
        </div>
      ) : null}

      {wanted.length ? (
        <Band ground="graphite" className={real.length ? '!pt-0' : ''}>
          <SectionHead
            number={real.length ? '04' : '03'}
            title="What is missing from this sector"
          />
          <div className="mt-8">
            {wanted.map((record) => (
              <WantedRecord key={record.slug} record={record} />
            ))}
          </div>
        </Band>
      ) : null}

      <Band ground="mist">
        <SectionHead number="05" title="Compliance that matters here" />
        <dl className="mt-10 border-t border-[var(--rule)]">
          {page.compliance.map((item) => (
            <div
              key={item.label}
              className="grid12 gap-y-2 border-b border-[var(--rule)] py-6"
              data-reveal
            >
              <dt className="col-span-12 lg:col-span-4">
                <span className="t-sub">{item.label}</span>
              </dt>
              <dd className="col-span-12 lg:col-span-8">
                <p className="max-w-[62ch] text-[15px] leading-[1.55]">{item.note}</p>
                {item.confirm ? <Confirm id={item.confirm} className="mt-4 max-w-[52ch]" /> : null}
              </dd>
            </div>
          ))}
        </dl>
        <Link
          href="/compliance"
          className="t-label mt-8 inline-flex items-center gap-2 underline decoration-1 underline-offset-4"
        >
          The full compliance page
          <Arrow />
        </Link>

        {page.evidence ? (
          <div className="mt-12 max-w-[62ch] border-t border-[var(--rule)] pt-6">
            <p className="t-label">A note on evidence</p>
            <p className="mt-3 text-[15px] leading-[1.55]">{page.evidence.note}</p>
            <Confirm id={page.evidence.needed} className="mt-5" />
          </div>
        ) : null}
      </Band>

      <Band ground="graphite" id="enquiries">
        <SectionHead title={`${page.entry.label} enquiries`} standfirst={page.enquiry.line} />
        <div className="mt-12">
          <EnquiryForm initialType={domestic ? 'domestic' : 'commercial'} />
        </div>
      </Band>
    </>
  );
}
