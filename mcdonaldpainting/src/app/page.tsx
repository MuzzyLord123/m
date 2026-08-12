import Link from 'next/link';

import { Band, SectionHead } from '@/components/Band';
import { DataStrip } from '@/components/DataStrip';
import { EnquiryForm } from '@/components/EnquiryForm';
import { CapabilityStatementAction } from '@/components/PrimaryAction';
import { SectorIndexList } from '@/components/SectorIndex';
import { SheetHeader } from '@/components/SheetHeader';
import { Arrow } from '@/components/Arrow';
import { SiteRecord } from '@/components/SiteRecord';
import { Testimonials } from '@/components/Testimonials';
import { featuredRecords } from '@/lib/projects';
import { compliance } from '@content/copy/compliance';
import { home } from '@content/copy/home';
import { about } from '@content/copy/about';

/**
 * Home.
 *
 * The order is an argument, made once, in this sequence: what they are and where
 * they work → the figures that back it → the eight sectors → three jobs, with
 * the evidence attached → the commercial offer → the compliance a buyer needs →
 * two quotes → an enquiry route that knows who is filling it in.
 *
 * What is not here: a slider, a three-card services grid, a "why choose us"
 * four-up, a floating quote button, or the word "quality".
 */
export default function HomePage() {
  const records = featuredRecords(3);

  return (
    <>
      <SheetHeader title={home.sheet.title} standfirst={home.sheet.standfirst}>
        <CapabilityStatementAction />
      </SheetHeader>

      <DataStrip figures={home.figures} ground="mist" />

      {/* Ground change: hard cut, graphite to concrete. */}
      <Band ground="paper">
        <SectionHead title={home.sectorIndex.title} standfirst={home.sectorIndex.standfirst} />
        <div className="mt-12">
          <SectorIndexList ground="paper" />
        </div>
      </Band>

      <Band ground="paper" className="!pb-10">
        <SectionHead title={home.work.title} standfirst={home.work.standfirst}>
          <Link
            href={home.work.cta.href}
            className="t-label !text-[var(--mark)] inline-flex items-center gap-2 hover:underline underline-offset-4"
          >
            {home.work.cta.label}
            <Arrow />
          </Link>
        </SectionHead>
      </Band>

      <div data-ground="paper">
        {records.map((record, i) => (
          <SiteRecord key={record.slug} record={record} size="full" priority={i === 0} />
        ))}
      </div>

      <Band ground="mist">
        <div className="grid12 gap-y-10">
          <div className="col-span-12 lg:col-span-7">
            <h2 className="t-section" data-reveal>
              <span className="reveal-type">{home.programmed.title}</span>
            </h2>
            {home.programmed.body.map((para) => (
              <p key={para.slice(0, 24)} className="t-body mt-6 max-w-[62ch]">
                {para}
              </p>
            ))}
            <Link
              href={home.programmed.cta.href}
              className="t-label mt-8 inline-flex items-center gap-2 underline decoration-1 underline-offset-4 hover:!text-[var(--color-navy)]"
            >
              {home.programmed.cta.label}
              <Arrow />
            </Link>
          </div>

          {/* The four stages, as a table down the right. Density 6: the page is
              allowed to carry two things at once here. */}
          <div className="col-span-12 lg:col-span-4 lg:col-start-9">
            <dl className="border-t border-[var(--rule)]">
              {['Survey', 'Programme', 'Price', 'Report'].map((stage, i) => (
                <div
                  key={stage}
                  className="grid grid-cols-[3rem_1fr] gap-4 border-b border-[var(--rule)] py-4"
                >
                  <dt className="t-label pt-1">{String(i + 1).padStart(2, '0')}</dt>
                  <dd className="t-sub">{stage}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Band>

      <Band ground="graphite">
        <SectionHead title={home.compliance.title} standfirst={home.compliance.standfirst}>
          <Link
            href={home.compliance.cta.href}
            className="t-label !text-[var(--mark)] inline-flex items-center gap-2 hover:underline underline-offset-4"
          >
            {home.compliance.cta.label}
            <Arrow />
          </Link>
        </SectionHead>

        <dl className="mt-12 grid grid-cols-1 gap-x-[var(--spacing-gutter)] sm:grid-cols-2 lg:grid-cols-4">
          {compliance.arrangements.slice(0, 4).map((item) => (
            <div key={item.number} className="border-t border-[var(--rule)] py-5" data-reveal>
              <dt className="t-label">{item.number}</dt>
              <dd className="t-sub mt-3 text-[var(--ink)]">{item.title}</dd>
            </div>
          ))}
        </dl>
      </Band>

      <Band ground="mist" id="testimonials">
        <SectionHead title={about.testimonials.title} standfirst={about.testimonials.standfirst} />
        <div className="mt-12">
          <Testimonials ground="paper" />
        </div>
      </Band>

      <Band ground="graphite" id="enquiries">
        <SectionHead title={home.enquiry.title} standfirst={home.enquiry.standfirst} />
        <div className="mt-12">
          <EnquiryForm />
        </div>
      </Band>
    </>
  );
}
