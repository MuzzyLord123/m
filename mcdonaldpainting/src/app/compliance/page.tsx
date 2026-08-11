import type { Metadata } from 'next';

import { Band, NumberedItem, SectionHead } from '@/components/Band';
import { Confirm } from '@/components/Confirm';
import { CapabilityStatementAction } from '@/components/PrimaryAction';
import { SheetHeader } from '@/components/SheetHeader';
import { pageMetadata } from '@/lib/metadata';
import { compliance } from '@content/copy/compliance';
import { accreditation, insurance, site, workforce } from '@content/site';

export const metadata: Metadata = pageMetadata({
  title: compliance.meta.title,
  description: compliance.meta.description,
  path: '/compliance',
});

/**
 * /compliance — the page the old /health-safety/ should have been.
 *
 * Written to be forwarded. A buyer should be able to send this URL to their
 * compliance team and have it answer the pre-qualification questionnaire
 * without a phone call — which is also why every gap in it is marked rather
 * than smoothed over.
 */
export default function CompliancePage() {
  return (
    <>
      <SheetHeader title={compliance.sheet.title} standfirst={compliance.sheet.standfirst}>
        <CapabilityStatementAction note="The same information as a six-page PDF, for the procurement file." />
      </SheetHeader>

      {/* The summary table. This is the block a compliance team screenshots. */}
      <Band ground="steel">
        <dl className="border-t border-line">
          {[
            {
              label: 'Accreditation',
              value: `${accreditation.name} — assessed by ${accreditation.body}`,
              confirm: 'safecontractor',
            },
            {
              label: 'Certificate number',
              value: accreditation.certificateNumber,
              confirm: 'safecontractor',
            },
            {
              label: 'Public liability',
              value: insurance.publicLiability,
              confirm: 'insurance',
            },
            {
              label: 'Employers’ liability',
              value: insurance.employersLiability,
              confirm: 'insurance',
            },
            {
              label: 'Operative qualification',
              value: `${workforce.qualification} standard`,
              confirm: null,
            },
            {
              label: 'Company number',
              value: site.companyNumber,
              confirm: null,
            },
            {
              label: 'RAMS',
              value: 'Site-specific, issued before mobilisation, reissued per phase',
              confirm: null,
            },
            {
              label: 'COSHH',
              value: 'Assessments and safety data sheets for every product on site',
              confirm: null,
            },
          ].map((row) => (
            <div
              key={row.label}
              className="grid12 gap-y-2 border-b border-line py-4"
              data-reveal
            >
              <dt className="col-span-12 lg:col-span-3">
                <span className="t-label">{row.label}</span>
              </dt>
              <dd className="col-span-12 lg:col-span-9">
                {row.value ? (
                  <span className="text-[15px] leading-[1.5] text-bone">{row.value}</span>
                ) : (
                  <Confirm id={row.confirm!} className="max-w-[56ch]" />
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Band>

      <Band ground="concrete">
        <div className="grid12 gap-y-8">
          <div className="col-span-12 lg:col-span-4">
            <h2 className="t-section" data-reveal>
              <span className="reveal-type">{compliance.accreditation.title}</span>
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-7 lg:col-start-6">
            {compliance.accreditation.body.map((para) => (
              <p key={para.slice(0, 24)} className="t-body mb-5 max-w-[64ch] last:mb-0">
                {para}
              </p>
            ))}
            <Confirm
              id={compliance.accreditation.confirm}
              note={compliance.accreditation.confirmNote}
              className="mt-8 max-w-[56ch]"
            />
          </div>
        </div>
      </Band>

      <Band ground="graphite">
        <div className="grid12 gap-y-8">
          <div className="col-span-12 lg:col-span-4">
            <h2 className="t-section" data-reveal>
              <span className="reveal-type">{compliance.insurance.title}</span>
            </h2>
          </div>
          <div className="col-span-12 lg:col-span-7 lg:col-start-6">
            {compliance.insurance.body.map((para) => (
              <p key={para.slice(0, 24)} className="t-body max-w-[64ch] text-concrete">
                {para}
              </p>
            ))}
            <Confirm
              id={compliance.insurance.confirm}
              note={compliance.insurance.confirmNote}
              className="mt-8 max-w-[56ch]"
            />
          </div>
        </div>
      </Band>

      <Band ground="concrete">
        <SectionHead title="How the work is run" />
        <div className="mt-8">
          {compliance.arrangements.map((item) => (
            <NumberedItem key={item.number} number={item.number} title={item.title}>
              <p className="max-w-[64ch] text-[15px] leading-[1.6]">{item.body}</p>
              {'confirm' in item && item.confirm ? (
                <Confirm
                  id={item.confirm}
                  note={'confirmNote' in item ? item.confirmNote : undefined}
                  className="mt-6 max-w-[56ch]"
                />
              ) : null}
            </NumberedItem>
          ))}
        </div>
      </Band>

      <Band ground="graphite">
        <div className="grid12">
          <div className="col-span-12 lg:col-span-8">
            <h2 className="t-section" data-reveal>
              <span className="reveal-type">{compliance.references.title}</span>
            </h2>
            <p className="t-body mt-6 max-w-[62ch] text-concrete">{compliance.references.body}</p>
            <Confirm
              id={compliance.references.confirm}
              note={compliance.references.confirmNote}
              className="mt-8 max-w-[56ch]"
            />
          </div>
        </div>
      </Band>
    </>
  );
}
