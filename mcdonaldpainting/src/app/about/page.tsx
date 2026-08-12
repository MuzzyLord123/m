import type { Metadata } from 'next';

import { Band, NumberedItem, SectionHead } from '@/components/Band';
import { Confirm } from '@/components/Confirm';
import { SheetHeader } from '@/components/SheetHeader';
import { Testimonials } from '@/components/Testimonials';
import { CapabilityStatementAction } from '@/components/PrimaryAction';
import { pageMetadata } from '@/lib/metadata';
import { about } from '@content/copy/about';
import { founded, site, workforce } from '@content/site';

export const metadata: Metadata = pageMetadata({
  title: about.meta.title,
  description: about.meta.description,
  path: '/about',
});

/**
 * /about — takes the traffic from /about-mcdonald-painting-contractors/,
 * /testimonials/ and the stranded /home-m-r-painting-contractors/ page.
 */
export default function AboutPage() {
  return (
    <>
      <SheetHeader title={about.sheet.title} standfirst={about.sheet.standfirst}>
        <CapabilityStatementAction />
      </SheetHeader>

      <Band ground="mist">
        <div className="grid12 gap-y-10">
          <div className="col-span-12 lg:col-span-7">
            <h2 className="t-section" data-reveal>
              <span className="reveal-type">{about.people.title}</span>
            </h2>
            {about.people.body.map((para) => (
              <p key={para.slice(0, 24)} className="t-body mt-6 max-w-[62ch]">
                {para}
              </p>
            ))}
            <Confirm
              id={about.people.confirm}
              note={about.people.confirmNote}
              className="mt-8 max-w-[56ch]"
            />
          </div>

          <div className="col-span-12 lg:col-span-4 lg:col-start-9">
            <dl className="border-t border-[var(--rule)]">
              {[
                { label: 'Registered name', value: site.legalName },
                { label: 'Company number', value: site.companyNumber },
                { label: 'Base', value: site.base },
                {
                  label: 'Operatives',
                  value: `Qualified to ${workforce.qualification} standard`,
                },
              ].map((row) => (
                <div key={row.label} className="border-b border-[var(--rule)] py-4">
                  <dt className="t-label">{row.label}</dt>
                  <dd className="mt-1.5 text-[15px]">{row.value}</dd>
                </div>
              ))}
            </dl>
            {founded.year ? null : (
              <Confirm id={about.founded.confirm} note={about.founded.confirmNote} className="mt-6" />
            )}
          </div>
        </div>
      </Band>

      <Band ground="graphite">
        <div className="grid12">
          <div className="col-span-12 lg:col-span-8">
            <h2 className="t-section" data-reveal>
              <span className="reveal-type">{about.history.title}</span>
            </h2>
            {about.history.body.map((para) => (
              <p key={para.slice(0, 24)} className="t-body mt-6 max-w-[62ch] text-[var(--muted)]">
                {para}
              </p>
            ))}
            <Confirm id="mandr-accounts" className="mt-8 max-w-[56ch]" />
          </div>
        </div>
      </Band>

      <Band ground="mist">
        <SectionHead title={about.method.title} />
        <div className="mt-8">
          {about.method.steps.map((step) => (
            <NumberedItem key={step.number} number={step.number} title={step.title}>
              <p className="max-w-[64ch] text-[15px] leading-[1.6]">{step.body}</p>
            </NumberedItem>
          ))}
        </div>
      </Band>

      <Band ground="graphite" id="testimonials">
        <SectionHead title={about.testimonials.title} standfirst={about.testimonials.standfirst} />
        <div className="mt-12">
          <Testimonials ground="graphite" />
        </div>
      </Band>
    </>
  );
}
