import type { Metadata } from 'next';

import { Band, NumberedItem, SectionHead } from '@/components/Band';
import { Confirm } from '@/components/Confirm';
import { EnquiryForm } from '@/components/EnquiryForm';
import { CapabilityStatementAction } from '@/components/PrimaryAction';
import { SheetHeader, DEFAULT_META } from '@/components/SheetHeader';
import { pageMetadata } from '@/lib/metadata';
import { breadcrumbSchema, jsonLd } from '@/lib/schema';
import { programmed } from '@content/copy/programmed';

export const metadata: Metadata = pageMetadata({
  title: programmed.meta.title,
  description: programmed.meta.description,
  path: '/programmed-maintenance',
});

/**
 * 06 in the sector index, and the commercial money page.
 *
 * It is written as a method rather than as a pitch, including the section that
 * says when a programme is the wrong answer. That section is there because a
 * facilities manager has read forty contractor websites and none of them have
 * ever told them not to buy something.
 */
export default function ProgrammedMaintenancePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Programmed maintenance', path: '/programmed-maintenance' },
          ]),
        )}
      />

      <SheetHeader
        eyebrow="06 · Sector"
        title={programmed.sheet.title}
        standfirst={programmed.sheet.standfirst}
        meta={[
          { label: 'Sector', value: '06 · Programmed maintenance' },
          ...DEFAULT_META.slice(0, 3),
        ]}
      >
        <CapabilityStatementAction />
      </SheetHeader>

      <Band ground="mist">
        <div className="grid12">
          <div className="col-span-12 lg:col-span-8">
            <h2 className="t-section" data-reveal>
              <span className="reveal-type">{programmed.argument.title}</span>
            </h2>
            {programmed.argument.body.map((para) => (
              <p key={para.slice(0, 24)} className="t-body mt-6 max-w-[64ch]">
                {para}
              </p>
            ))}
          </div>
        </div>
      </Band>

      <Band ground="graphite">
        <SectionHead title="How a programme is put together" />
        <div className="mt-10">
          {programmed.stages.map((stage) => (
            <NumberedItem key={stage.number} number={stage.number} title={stage.title}>
              <p className="max-w-[64ch] text-[15px] leading-[1.6] text-[var(--muted)]">{stage.body}</p>
              {'confirm' in stage && stage.confirm ? (
                <Confirm
                  id={stage.confirm}
                  note={'confirmNote' in stage ? stage.confirmNote : undefined}
                  className="mt-6 max-w-[56ch]"
                />
              ) : null}
            </NumberedItem>
          ))}
        </div>
      </Band>

      <Band ground="mist">
        <div className="grid12 gap-y-10">
          <div className="col-span-12 lg:col-span-7">
            <h2 className="t-section" data-reveal>
              <span className="reveal-type">{programmed.occupied.title}</span>
            </h2>
            {programmed.occupied.body.map((para) => (
              <p key={para.slice(0, 24)} className="t-body mt-6 max-w-[62ch]">
                {para}
              </p>
            ))}
            <Confirm
              id={programmed.occupied.confirm}
              note={programmed.occupied.confirmNote}
              className="mt-8 max-w-[56ch]"
            />
          </div>

          <div className="col-span-12 lg:col-span-4 lg:col-start-9">
            <p className="t-label mb-5">{programmed.needFromYou.title}</p>
            <ul className="border-t border-[var(--rule)]">
              {programmed.needFromYou.items.map((item) => (
                <li key={item} className="border-b border-[var(--rule)] py-4 text-[15px] leading-[1.5]">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Band>

      <Band ground="graphite">
        <div className="grid12">
          <div className="col-span-12 lg:col-span-8">
            <h2 className="t-section" data-reveal>
              <span className="reveal-type">{programmed.honest.title}</span>
            </h2>
            {programmed.honest.body.map((para) => (
              <p key={para.slice(0, 24)} className="t-body mt-6 max-w-[64ch] text-[var(--muted)]">
                {para}
              </p>
            ))}
          </div>
        </div>
      </Band>

      <Band ground="mist" id="enquiries">
        <SectionHead
          title="Talk to us about a programme"
          standfirst="A first conversation is about the building and the constraint on it, not about paint. If you have a schedule of areas or a set of plans, send them and we will come back with what a survey would cost and what it would produce."
        />
        <div className="mt-12">
          <EnquiryForm initialType="commercial" />
        </div>
      </Band>
    </>
  );
}
