import type { Metadata } from 'next';

import { Section, Container } from '@/components/Section';
import { EnquiryForm } from '@/components/EnquiryForm';
import { EmptyFrame } from '@/components/Plate';
import { Rule } from '@/components/Rule';
import { PhoneNumber } from '@/components/Phone';
import { decorating } from '@content/copy/decorating';

export const metadata: Metadata = {
  title: decorating.meta.title,
  description: decorating.meta.description,
  alternates: { canonical: '/decorating' },
  openGraph: {
    title: decorating.meta.title,
    description: decorating.meta.description,
    url: '/decorating',
  },
};

export default function DecoratingPage() {
  return (
    <>
      <Section tone="night">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
            <div className="lg:col-span-5">
              <Rule className="max-w-24" />
              <p className="eyebrow mt-6">{decorating.eyebrow}</p>
              <h1 className="mt-4 text-[clamp(2.5rem,6vw,4.5rem)]">{decorating.heading}</h1>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 lg:pt-24">
              <p className="text-lg leading-[1.7]">{decorating.lede}</p>
            </div>
          </div>
        </Container>
      </Section>

      {decorating.services.map((service, i) => (
        <Section key={service.eyebrow} tone={i % 2 === 0 ? 'linen' : 'night'}>
          <Container>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
              <div className={i % 2 === 0 ? 'lg:col-span-4' : 'lg:col-span-4 lg:order-2 lg:col-start-9'}>
                <Rule className="max-w-24" />
                <p className="eyebrow mt-6">{service.eyebrow}</p>
              </div>

              <div
                className={
                  i % 2 === 0
                    ? 'lg:col-span-7 lg:col-start-6'
                    : 'lg:col-span-7 lg:order-1 lg:col-start-1'
                }
              >
                <h2 className="text-[clamp(1.75rem,4vw,2.75rem)]">{service.heading}</h2>
                <div className="mt-8 flex flex-col gap-6">
                  {service.paragraphs.map((p) => (
                    <p key={p} className="max-w-[62ch] text-lg leading-[1.7]">
                      {p}
                    </p>
                  ))}
                </div>

                <EmptyFrame
                  ratio="3 / 2"
                  className="mt-12"
                  need={`A photograph of this work: ${service.heading.toLowerCase()}.`}
                />
              </div>
            </div>
          </Container>
        </Section>
      ))}

      <Section tone="linen">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
            <div className="lg:col-span-4">
              <Rule className="max-w-24" />
              <p className="eyebrow mt-6">{decorating.how.eyebrow}</p>
              <h2 className="mt-4 text-[clamp(1.75rem,3.4vw,2.5rem)]">{decorating.how.heading}</h2>
            </div>
            <ul className="lg:col-span-7 lg:col-start-6">
              {decorating.how.points.map((point) => (
                <li
                  key={point}
                  className="border-t border-t-current/15 py-5 first:border-t-0 first:pt-0"
                >
                  <p className="max-w-[56ch] text-base leading-[1.7]">{point}</p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      <Section tone="night">
        <Container>
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
            <div className="lg:col-span-4">
              <Rule className="max-w-24" />
              <p className="eyebrow mt-6">Arrange a visit</p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)]">Come and look at it?</h2>
              <p className="secondary mt-6 max-w-[40ch] text-base leading-[1.7]">
                Tell me what the job is and roughly when you want it doing.
              </p>
              <p className="mt-8 text-xl">
                <PhoneNumber />
              </p>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <EnquiryForm source="decorating" />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
