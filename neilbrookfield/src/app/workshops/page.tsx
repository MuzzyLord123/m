import type { Metadata } from 'next';

import { Section, Container } from '@/components/Section';
import { EnquiryForm } from '@/components/EnquiryForm';
import { Needed } from '@/components/Needed';
import { EmptyFrame } from '@/components/Plate';
import { Rule } from '@/components/Rule';
import { PhoneNumber } from '@/components/Phone';
import { workshops } from '@content/copy/workshops';
import { workshop } from '@content/pricing';

export const metadata: Metadata = {
  title: workshops.meta.title,
  description: workshops.meta.description,
  alternates: { canonical: '/workshops' },
  openGraph: {
    title: workshops.meta.title,
    description: workshops.meta.description,
    url: '/workshops',
  },
};

/**
 * Published pricing is a trust signal, so it is set in type — but only once the
 * figures have been re-confirmed. Until then the block says so rather than
 * printing a rate from 2024 that Neil may no longer charge.
 */
function PriceBlock() {
  if (!workshop.confirmed) {
    return (
      <Needed
        id="workshop-pricing"
        label={`The rate goes here, in figures — last published in ${workshop.quotedIn}`}
        minHeight="12rem"
      />
    );
  }

  return (
    <div className="border border-slate p-8 md:p-10">
      <dl className="flex flex-col gap-8">
        <div className="flex items-baseline justify-between gap-8 border-b border-b-current/15 pb-8">
          <dt className="text-lg">By the hour</dt>
          <dd className="tabular font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3rem)] leading-none font-light">
            {workshop.currency}
            {workshop.hourly}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-8">
          <dt className="text-lg">
            <span className="tabular">{workshop.block.hours}</span> hours
          </dt>
          <dd className="tabular font-[family-name:var(--font-display)] text-[clamp(2rem,5vw,3rem)] leading-none font-light">
            {workshop.currency}
            {workshop.block.price}
          </dd>
        </div>
      </dl>
      <hr className="hairline my-8" />
      <p className="secondary text-base leading-[1.7]">{workshop.travel}</p>
    </div>
  );
}

export default function WorkshopsPage() {
  return (
    <>
      <Section tone="night">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
            <div className="lg:col-span-5">
              <Rule className="max-w-24" />
              <p className="eyebrow mt-6">{workshops.eyebrow}</p>
              <h1 className="mt-4 text-[clamp(2.5rem,6vw,4.5rem)]">{workshops.heading}</h1>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 lg:pt-24">
              <p className="text-lg leading-[1.7]">{workshops.lede}</p>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="linen">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
            <div className="lg:col-span-4">
              <Rule className="max-w-24" />
              <p className="eyebrow mt-6">{workshops.who.eyebrow}</p>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <h2 className="text-[clamp(1.75rem,4vw,2.75rem)]">{workshops.who.heading}</h2>
              <div className="mt-8 flex flex-col gap-6">
                {workshops.who.paragraphs.map((p) => (
                  <p key={p} className="max-w-[62ch] text-lg leading-[1.7]">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="night">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <Rule className="max-w-24" />
                <p className="eyebrow mt-6">{workshops.covers.eyebrow}</p>
                <h2 className="mt-4 text-[clamp(1.75rem,3.4vw,2.5rem)]">
                  {workshops.covers.heading}
                </h2>
                <p className="secondary mt-6 max-w-[34ch] text-base leading-[1.7]">
                  {workshops.covers.intro}
                </p>
              </div>
            </div>
            <ol className="lg:col-span-7 lg:col-start-6">
              {workshops.covers.items.map((item, i) => (
                <li key={item.title} className="border-t border-t-slate py-8 first:border-t-0 first:pt-0">
                  <div className="flex gap-6">
                    <span className="eyebrow tabular mt-2 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="text-[clamp(1.2rem,2.2vw,1.5rem)]">{item.title}</h3>
                      <p className="secondary mt-3 max-w-[54ch] text-base leading-[1.7]">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      <Section tone="linen">
        <Container>
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
            <div className="lg:col-span-5">
              <Rule className="max-w-24" />
              <p className="eyebrow mt-6">{workshops.practical.eyebrow}</p>
              <ul className="mt-8">
                {workshops.practical.points.map((point) => (
                  <li
                    key={point}
                    className="border-t border-t-current/15 py-5 first:border-t-0 first:pt-0"
                  >
                    <p className="max-w-[46ch] text-base leading-[1.7]">{point}</p>
                  </li>
                ))}
              </ul>

              <EmptyFrame
                ratio="4 / 3"
                className="mt-12"
                need="A photograph from a Saturday session if one exists — somebody being shown how to cut in, or a piece of furniture part-way through."
              />
            </div>

            <div className="lg:col-span-6 lg:col-start-7">
              <p className="eyebrow">{workshops.price.eyebrow}</p>
              <h2 className="mt-4 mb-8 text-[clamp(1.75rem,3.4vw,2.5rem)]">
                {workshops.price.heading}
              </h2>
              <PriceBlock />
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="night" id="book">
        <Container>
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
            <div className="lg:col-span-4">
              <Rule className="max-w-24" />
              <p className="eyebrow mt-6">{workshops.enquiry.eyebrow}</p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)]">{workshops.enquiry.heading}</h2>
              <p className="secondary mt-6 max-w-[40ch] text-base leading-[1.7]">
                {workshops.enquiry.body}
              </p>
              <p className="mt-8 text-xl">
                <PhoneNumber />
              </p>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <EnquiryForm source="workshops" variant="workshop" />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
