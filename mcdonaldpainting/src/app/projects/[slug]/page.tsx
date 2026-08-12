import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';

import { Band, SectionHead } from '@/components/Band';
import { ConfirmInline, Confirm } from '@/components/Confirm';
import { mdxComponents } from '@/components/mdx';
import { CapabilityStatementAction } from '@/components/PrimaryAction';
import { SheetHeader } from '@/components/SheetHeader';
import { Arrow } from '@/components/Arrow';
import { pageMetadata } from '@/lib/metadata';
import { captionFields, getRecord, getRecords } from '@/lib/projects';
import { breadcrumbSchema, jsonLd } from '@/lib/schema';

export function generateStaticParams() {
  return getRecords().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const record = getRecord(slug);
  if (!record) return {};

  const where = record.location ? `, ${record.location}` : '';
  return pageMetadata({
    title: `${record.title}${where} | ${record.sectorEntry.label} painting | McDonald Painting Contractors`,
    description: record.summary,
    path: `/projects/${slug}`,
    type: 'article',
  });
}

/**
 * One site record.
 *
 * The caption block is the page. The prose underneath is context — what shaped
 * the job, what was found — and it is deliberately short. A buyer reading this
 * is checking a list, not reading an essay.
 */
export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const record = getRecord(slug);
  if (!record) notFound();

  const others = getRecords().filter((r) => r.slug !== slug && r.status !== 'wanted').slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Site records', path: '/projects' },
            { name: record.title, path: `/projects/${slug}` },
          ]),
        )}
      />

      <SheetHeader
        eyebrow={`${record.sectorEntry.number} · ${record.sectorEntry.label}`}
        title={record.title}
        standfirst={record.summary}
        meta={captionFields(record)
          .slice(0, 4)
          .map((f) => ({ label: f.label, value: f.value ?? 'To be confirmed' }))}
      />

      <div data-ground="graphite">
        <div className="shell">
          <div className="relative overflow-hidden" data-reveal>
            {record.image.src ? (
              <>
                <Image
                  src={record.image.src}
                  alt={record.image.alt ?? ''}
                  width={record.image.width!}
                  height={record.image.height!}
                  priority
                  sizes="100vw"
                  className="reveal-plate aspect-[16/9] w-full object-cover"
                />
                <div
                  aria-hidden
                  className="reveal-scrim pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-graphite to-transparent"
                />
              </>
            ) : (
              <div className="flex min-h-[15rem] w-full items-end border border-[var(--rule)] border-t-[3px] border-t-[var(--flag)] bg-[var(--raised)] p-6 md:min-h-[20rem] md:p-10">
                <div className="max-w-[52ch]">
                  <p className="t-label !text-[var(--mark)]">Photograph to come</p>
                  <p className="mt-3 text-[15px] leading-[1.5] text-[var(--muted)]">
                    {record.image.needs}
                  </p>
                </div>
              </div>
            )}
          </div>
          {record.image.credit ? (
            <p className="t-label mt-4">Photograph {record.image.credit}</p>
          ) : null}
        </div>
      </div>

      <Band ground="graphite">
        <p className="t-label mb-5">Record</p>
        <dl className="border-t border-[var(--rule)]">
          {captionFields(record).map((field) => (
            <div key={field.label} className="grid12 gap-y-1 border-b border-[var(--rule)] py-4">
              <dt className="col-span-12 lg:col-span-3">
                <span className="t-label">{field.label}</span>
              </dt>
              <dd className="col-span-12 lg:col-span-9">
                {field.value ? (
                  <span className="text-[15px] leading-[1.5] text-[var(--ink)]">{field.value}</span>
                ) : (
                  <ConfirmInline id="project-detail" label={`${field.label} — not yet confirmed`} />
                )}
              </dd>
            </div>
          ))}
        </dl>

        {record.status === 'drafted' ? (
          <Confirm
            id="project-detail"
            className="mt-8 max-w-[62ch]"
            note={`This record is drafted from what is known about the job. The unconfirmed fields above need ten minutes with Sean: roughly when it was, who the client was, how long we were on site, what was applied, and whether the building stayed open.`}
          />
        ) : null}
      </Band>

      {record.body ? (
        <Band ground="mist">
          <div className="grid12">
            <div className="col-span-12 lg:col-span-8">
              <div className="prose-sheet">
                <MDXRemote source={record.body} components={mdxComponents} />
              </div>
            </div>
          </div>
        </Band>
      ) : null}

      <Band ground="graphite">
        <SectionHead title="Other records">
          <CapabilityStatementAction note="Three site records, the capability schedule and the compliance detail, as one PDF." />
        </SectionHead>
        <ul className="mt-10 border-t border-[var(--rule)]">
          {others.map((other) => (
            <li key={other.slug} className="border-b border-[var(--rule)]">
              <Link
                href={`/projects/${other.slug}`}
                className="group grid12 items-baseline gap-y-2 py-6"
              >
                <span className="col-span-12 lg:col-span-3">
                  <span className="t-label">
                    {other.sectorEntry.number} · {other.sectorEntry.label}
                  </span>
                </span>
                <span className="col-span-12 lg:col-span-7">
                  <span className="t-sub text-[var(--ink)] group-hover:text-[var(--mark)]">{other.title}</span>
                </span>
                <span className="col-span-12 lg:col-span-2 lg:text-right">
                  <span className="t-label !text-[var(--mark)] inline-flex items-center gap-2">
                    Record
                    <Arrow />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Band>
    </>
  );
}
