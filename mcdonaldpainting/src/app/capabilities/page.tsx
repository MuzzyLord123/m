import type { Metadata } from 'next';
import Link from 'next/link';

import { Band, SectionHead } from '@/components/Band';
import { Confirm } from '@/components/Confirm';
import { CapabilityStatementAction } from '@/components/PrimaryAction';
import { SheetHeader } from '@/components/SheetHeader';
import { SpecTable } from '@/components/SpecTable';
import { Arrow } from '@/components/Arrow';
import { pageMetadata } from '@/lib/metadata';
import { capabilities } from '@content/copy/capabilities';

export const metadata: Metadata = pageMetadata({
  title: capabilities.meta.title,
  description: capabilities.meta.description,
  path: '/capabilities',
});

/**
 * /capabilities — the schedule of works, plus the detail on the three
 * specifications that separate a contractor from a decorator.
 *
 * This page also absorbs the old /faq/. The questions worth keeping are
 * answered at the bottom, in the open, rather than folded into an accordion —
 * an answer nobody can find is not an answer.
 */
export default function CapabilitiesPage() {
  return (
    <>
      <SheetHeader title={capabilities.sheet.title} standfirst={capabilities.sheet.standfirst}>
        <CapabilityStatementAction />
      </SheetHeader>

      <Band ground="paper">
        <SectionHead number="01" title={capabilities.table.title} standfirst={capabilities.table.note} />
        <div className="mt-10">
          <SpecTable ground="paper" />
        </div>
      </Band>

      {capabilities.sections.map((section, i) => (
        <Band
          key={section.id}
          id={section.id}
          ground={i % 2 === 0 ? 'graphite' : 'paper'}
        >
          <div className="grid12 gap-y-8">
            <div className="col-span-12 lg:col-span-3">
              <p className="t-figure text-[clamp(1.75rem,3vw,2.5rem)]">{section.number}</p>
              <h2 className="t-section mt-4" data-reveal>
                <span className="reveal-type">{section.title}</span>
              </h2>
            </div>
            <div className="col-span-12 lg:col-span-8 lg:col-start-5">
              {section.body.map((para) => (
                <p key={para.slice(0, 24)} className="t-body mt-0 mb-5 max-w-[64ch] last:mb-0">
                  {para}
                </p>
              ))}

              {'confirm' in section && section.confirm ? (
                <Confirm
                  id={section.confirm}
                  note={'confirmNote' in section ? section.confirmNote : undefined}
                  className="mt-8 max-w-[56ch]"
                />
              ) : null}

              {'cta' in section && section.cta ? (
                <Link
                  href={section.cta.href}
                  className="t-label mt-8 inline-flex items-center gap-2 underline decoration-1 underline-offset-4"
                >
                  {section.cta.label}
                  <Arrow />
                </Link>
              ) : null}
            </div>
          </div>
        </Band>
      ))}

      <Band ground="graphite">
        <SectionHead title={capabilities.answered.title} />
        <dl className="mt-10 border-t border-[var(--rule)]">
          {capabilities.answered.items.map((item) => (
            <div key={item.q} className="grid12 gap-y-3 border-b border-[var(--rule)] py-7" data-reveal>
              <dt className="col-span-12 lg:col-span-4">
                <span className="t-sub text-[var(--ink)]">{item.q}</span>
              </dt>
              <dd className="col-span-12 lg:col-span-8">
                <p className="max-w-[64ch] text-[15px] leading-[1.55] text-[var(--muted)]">{item.a}</p>
              </dd>
            </div>
          ))}
        </dl>
      </Band>
    </>
  );
}
