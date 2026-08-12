import type { Metadata } from 'next';

import { Band, SectionHead } from '@/components/Band';
import { Confirm } from '@/components/Confirm';
import { EnquiryForm } from '@/components/EnquiryForm';
import { SheetHeader } from '@/components/SheetHeader';
import { Arrow } from '@/components/Arrow';
import { pageMetadata } from '@/lib/metadata';
import { contact } from '@content/copy/contact';
import { accreditation, coverage, email, phone, site } from '@content/site';

export const metadata: Metadata = pageMetadata({
  title: contact.meta.title,
  description: contact.meta.description,
  path: '/contact',
});

/**
 * /contact — replaces /contact-us/.
 *
 * `?enquiry=tender` preselects the type, which is how the capability statement
 * links arrive here from the commercial pages. It is a query string rather than
 * a client-side handoff so the link works from an email, from a PDF, and with
 * JavaScript off.
 */
export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ enquiry?: string }>;
}) {
  const { enquiry } = await searchParams;
  const initialType = contact.types.some((t) => t.id === enquiry) ? enquiry! : 'commercial';

  return (
    <>
      <SheetHeader title={contact.sheet.title} standfirst={contact.sheet.standfirst}>
        <div>
          <a
            href={phone.href}
            data-analytics="phone"
            className="t-label !text-[var(--color-navy)] inline-flex items-center gap-3 bg-[var(--color-amber)] px-6 py-4 hover:bg-[#c98d18]"
          >
            {phone.who} — {phone.display}
            <Arrow />
          </a>
          <p className="mt-4 max-w-[44ch] text-[15px] leading-[1.5] text-[var(--muted)]">
            {contact.direct.note}
          </p>
        </div>
      </SheetHeader>

      <Band ground="mist" id="capability-statement">
        <SectionHead
          title="Send an enquiry"
          standfirst="Pick the type first — it changes what is worth telling us. A tender enquiry can also take the capability statement straight away."
        />
        <div className="mt-12">
          <EnquiryForm initialType={initialType} capabilityStatement={initialType === 'tender'} />
        </div>
      </Band>

      <Band ground="graphite">
        <div className="grid12 gap-y-10">
          <div className="col-span-12 lg:col-span-6">
            <h2 className="t-section" data-reveal>
              <span className="reveal-type">{contact.direct.title}</span>
            </h2>
            <a
              href={phone.href}
              data-analytics="phone"
              className="mt-6 block font-display text-[clamp(2rem,4vw,3.25rem)] font-extrabold leading-none tracking-[-0.02em] text-[var(--ink)] hover:text-[var(--mark)]"
            >
              {phone.display}
            </a>
            <p className="t-label mt-4">{phone.who}</p>

            {email.confirmed ? (
              <a
                href={`mailto:${email.published}`}
                className="mt-8 block text-[17px] text-[var(--muted)] underline underline-offset-4 hover:text-[var(--mark)]"
              >
                {email.published}
              </a>
            ) : (
              <Confirm
                id="email"
                className="mt-8 max-w-[52ch]"
                note="Which address the site should publish. The site is on mcdonaldpaintingcontractors.co.uk and the current published address is on mcdonaldpainting.co.uk — a mismatch that procurement spam filters treat as a red flag. Until it is settled, the form and the phone are the routes in."
              />
            )}
          </div>

          <div className="col-span-12 lg:col-span-5 lg:col-start-8">
            <p className="t-label mb-2">{contact.registered.title}</p>
            <p className="mb-6 max-w-[42ch] text-[15px] leading-[1.5] text-[var(--muted)]">
              {contact.registered.note}
            </p>
            <dl className="border-t border-[var(--rule)]">
              {[
                { label: 'Registered name', value: site.legalName },
                { label: 'Company number', value: site.companyNumber },
                {
                  label: 'Accreditation',
                  value: `${accreditation.name} · ${accreditation.body}`,
                },
                { label: 'Base', value: site.base },
                { label: 'Coverage', value: coverage.wider },
                { label: 'Local coverage', value: coverage.localLong },
              ].map((row) => (
                <div key={row.label} className="grid grid-cols-[9rem_1fr] gap-4 border-b border-[var(--rule)] py-3">
                  <dt className="t-label pt-0.5">{row.label}</dt>
                  <dd className="text-[15px] leading-[1.4] text-[var(--ink)]">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Band>
    </>
  );
}
