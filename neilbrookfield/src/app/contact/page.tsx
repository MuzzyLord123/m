import type { Metadata } from 'next';

import { Section, Container } from '@/components/Section';
import { EnquiryForm } from '@/components/EnquiryForm';
import { Needed } from '@/components/Needed';
import { Rule } from '@/components/Rule';
import { PhoneLink } from '@/components/Phone';
import { contact } from '@content/copy/contact';

export const metadata: Metadata = {
  title: contact.meta.title,
  description: contact.meta.description,
  alternates: { canonical: '/contact' },
  openGraph: {
    title: contact.meta.title,
    description: contact.meta.description,
    url: '/contact',
  },
};

export default function ContactPage() {
  return (
    <>
      <Section tone="night">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
            <div className="lg:col-span-5">
              <Rule className="max-w-24" />
              <p className="eyebrow mt-6">{contact.eyebrow}</p>
              <h1 className="mt-4 text-[clamp(2.5rem,6vw,4.5rem)]">{contact.heading}</h1>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 lg:pt-24">
              <p className="text-lg leading-[1.7]">{contact.lede}</p>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="linen">
        <Container>
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
            <div className="lg:col-span-4">
              <Rule className="max-w-24" />
              <p className="eyebrow mt-6">Ring me</p>
              <p className="mt-4 font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,2.5rem)] leading-none font-light">
                <PhoneLink />
              </p>
              <p className="secondary mt-5 max-w-[36ch] text-base leading-[1.7]">
                {contact.phoneNote}
              </p>

              <hr className="hairline my-10" />

              <p className="eyebrow">Where I work</p>
              <p className="mt-3 text-base">{contact.areaNote}</p>
              <Needed
                id="area"
                label="How far Neil travels, and the villages worth naming"
                className="mt-6"
                minHeight="8rem"
              />

              <Needed
                id="hours"
                label="Hours he is happy to be rung on"
                className="mt-6"
                minHeight="8rem"
              />
            </div>

            <div className="lg:col-span-7 lg:col-start-6">
              <p className="eyebrow">{contact.form.eyebrow}</p>
              <h2 className="mt-4 mb-10 text-[clamp(1.75rem,3.4vw,2.5rem)]">
                {contact.form.heading}
              </h2>
              <EnquiryForm source="contact" />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
