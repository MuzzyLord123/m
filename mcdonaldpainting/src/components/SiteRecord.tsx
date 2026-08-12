import Image from 'next/image';
import Link from 'next/link';

import { captionFields, type SiteRecordData } from '@/lib/projects';
import { Arrow } from '@/components/Arrow';
import { ConfirmInline } from '@/components/Confirm';

/**
 * The component that turns a gallery into evidence.
 *
 * A full-bleed photograph with a graphite scrim over the lower third and a
 * caption block in label type carrying the same seven fields every time:
 * sector, client type, scope, location, duration, system applied, and whether
 * the building stayed open.
 *
 * The seven fields are the point. A buyer looking at a painting contractor's
 * photographs is trying to answer one question — have they done this, in a
 * building like mine, while it was in use — and a photograph cannot answer it.
 *
 * Where a field has not been confirmed it shows as an outstanding item rather
 * than being dropped. A caption with five of seven fields filled in and two
 * marked is honest; the same caption with two fields silently missing is a
 * different kind of document.
 */

function Caption({ record }: { record: SiteRecordData }) {
  return (
    <dl className="grid grid-cols-1 gap-x-[var(--spacing-gutter)] sm:grid-cols-2 lg:grid-cols-4">
      {captionFields(record).map((field) => (
        <div key={field.label} className="border-t border-[var(--rule)] py-3">
          <dt className="t-label">{field.label}</dt>
          <dd className="mt-1.5 text-[15px] leading-[1.4] text-[var(--ink)]">
            {field.value ?? <ConfirmInline id="project-detail" label={field.label} />}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * The empty frame. Not a stock photograph, not a grey box with a camera icon —
 * a labelled slot that states what belongs in it, so a gap on the page is a
 * brief for a photographer rather than a mistake.
 */
function EmptyFrame({ brief }: { brief: string }) {
  return (
    /* Deliberately shorter than the 16:9 a real photograph gets. An empty slot
       at full plate height is 700px of nothing, which reads as a broken page
       rather than as a brief — and this site has several of them until the
       photographs arrive. */
    <div className="flex min-h-[13rem] w-full items-end border border-[var(--rule)] border-t-[3px] border-t-[var(--flag)] bg-[var(--raised)] p-6 md:min-h-[17rem] md:p-10">
      <div className="max-w-[52ch]">
        <p className="t-label !text-[var(--mark)]">Photograph to come</p>
        <p className="mt-3 text-[15px] leading-[1.5] text-[var(--muted)]">{brief}</p>
      </div>
    </div>
  );
}

export function SiteRecord({
  record,
  size = 'full',
  priority = false,
  headingLevel = 'h3',
}: {
  record: SiteRecordData;
  /** `full` — full-bleed plate. `index` — one row in the records list. */
  size?: 'full' | 'index';
  priority?: boolean;
  /**
   * h3 where the records sit under a section heading, h2 where they are the
   * page's own top-level content — as on /projects, which has no section
   * heading above them. Skipping a level is a real navigation problem for
   * anyone moving through a page by heading.
   */
  headingLevel?: 'h2' | 'h3';
}) {
  const tall = size === 'full';
  const href = `/projects/${record.slug}`;
  const Heading = headingLevel;

  return (
    <article data-ground="paper" className="pb-[var(--spacing-band)]" data-reveal>
      <div className="shell">
        <div className="relative overflow-hidden">
          {record.image.src ? (
            <>
              <Image
                src={record.image.src}
                alt={record.image.alt ?? ''}
                width={record.image.width!}
                height={record.image.height!}
                priority={priority}
                sizes={tall ? '100vw' : '(min-width: 1024px) 50vw, 100vw'}
                className={`reveal-plate w-full object-cover ${
                  tall ? 'aspect-[16/9]' : 'aspect-[3/2]'
                }`}
              />
              {/* The scrim sits over the lower third only, and lifts from 70%
                  to 55% on entry. It is there so the label type below reads
                  against whatever the photograph happens to be doing. */}
              <div
                aria-hidden
                className="reveal-scrim pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-graphite to-transparent"
              />
            </>
          ) : (
            <EmptyFrame brief={record.image.needs ?? ''} />
          )}
        </div>

        <div className="mt-8 grid12 gap-y-8">
          <div className="col-span-12 lg:col-span-8">
            <Heading className={tall ? 't-section' : 't-sub'}>
              <Link href={href} className="hover:decoration-[var(--flag)] underline decoration-transparent decoration-1 underline-offset-[6px] transition-[text-decoration-color]">
                {record.title}
              </Link>
            </Heading>
            <p className="mt-4 max-w-[58ch] text-[var(--muted)]">{record.summary}</p>
            {record.image.credit ? (
              <p className="t-label mt-4">Photograph {record.image.credit}</p>
            ) : null}
          </div>
          <div className="col-span-12 lg:col-span-4 lg:col-start-9 lg:text-right">
            <Link href={href} className="t-label !text-[var(--mark)] inline-flex items-center gap-2 hover:underline underline-offset-4">
              Full record
              <Arrow />
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <Caption record={record} />
        </div>
      </div>
    </article>
  );
}

/**
 * A record that does not exist yet, shown as a request rather than hidden.
 *
 * This is what stops the projects page quietly implying six jobs when there are
 * three. It also does something more useful in a meeting than a shorter page
 * would: it tells Sean exactly which photograph is worth ten minutes of his
 * time and why.
 */
export function WantedRecord({ record }: { record: SiteRecordData }) {
  return (
    <article className="border-t border-[var(--rule)] py-10" data-reveal>
      <div className="grid12 gap-y-6">
        <div className="col-span-12 lg:col-span-3">
          <p className="t-label">{record.sectorEntry.number} · {record.sectorEntry.label}</p>
          <p className="t-label !text-[var(--mark)] mt-2">Record wanted</p>
        </div>
        <div className="col-span-12 lg:col-span-9">
          <h3 className="t-sub">{record.title}</h3>
          <p className="mt-3 max-w-[58ch] text-[var(--muted)]">{record.summary}</p>
          {record.image.needs ? (
            <p className="mt-4 max-w-[58ch] border-l-[3px] border-[var(--rule)] pl-4 text-[15px] leading-[1.5] text-[var(--muted)]">
              <span className="t-label block mb-1">Photograph wanted</span>
              {record.image.needs}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
