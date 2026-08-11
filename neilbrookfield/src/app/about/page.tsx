import type { Metadata } from 'next';

import { pageMetadata } from '@/lib/metadata';
import Link from 'next/link';

import { Section, Container } from '@/components/Section';
import { EmptyFrame } from '@/components/Plate';
import { Rule } from '@/components/Rule';
import { Needed } from '@/components/Needed';
import { PhoneNumber } from '@/components/Phone';
import { about } from '@content/copy/about';
import { FOUNDED, yearsTrading } from '@content/site';

export const metadata: Metadata = pageMetadata({
  title: about.meta.title,
  description: about.meta.description,
  path: '/about',
});

/**
 * Revalidated daily.
 *
 * The old site said "40 years of experience", written once in 2024 against a
 * 1990 start. Numbers like that are only ever right on the day they are typed.
 * The figure below is computed from FOUNDED and the page re-renders every day,
 * so it cannot be wrong in January.
 */
export const revalidate = 86400;

export default function AboutPage() {
  return (
    <>
      <Section tone="night">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
            <div className="lg:col-span-5">
              <Rule className="max-w-24" />
              <p className="eyebrow mt-6">{about.eyebrow}</p>
              <h1 className="mt-4 text-[clamp(2.5rem,6vw,4.5rem)]">{about.heading}</h1>
              <p className="eyebrow mt-10">
                <span className="tabular">{yearsTrading()}</span> years on my own account · eight
                before that
              </p>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 lg:pt-24">
              <p className="text-lg leading-[1.7]">{about.lede}</p>
            </div>
          </div>

          <div className="mt-20">
            <EmptyFrame
              ratio="21 / 9"
              need="A photograph of Neil at work — brush in hand, mid-job, not posed against a van."
            />
          </div>
        </Container>
      </Section>

      {about.sections.map((section, i) => (
        <Section key={section.heading} tone={i % 2 === 0 ? 'linen' : 'night'}>
          <Container>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
              <div className="lg:col-span-4">
                <Rule className="max-w-24" />
                <p className="eyebrow mt-6">{section.heading}</p>
              </div>
              <div className="lg:col-span-7 lg:col-start-6">
                <div className="flex flex-col gap-6">
                  {section.paragraphs.map((p) => (
                    <p key={p} className="max-w-[64ch] text-lg leading-[1.7]">
                      {p}
                    </p>
                  ))}
                </div>
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
              <p className="eyebrow mt-6">Since {FOUNDED}</p>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <h2 className="text-[clamp(1.75rem,4vw,2.75rem)]">{about.closing.heading}</h2>
              <p className="mt-8 max-w-[62ch] text-lg leading-[1.7]">{about.closing.body}</p>

              <div className="mt-12 flex flex-wrap items-center gap-8">
                <Link href="/contact" className="eyebrow link-rule">
                  Arrange a visit
                </Link>
                <span className="text-xl">
                  <PhoneNumber />
                </span>
              </div>

              <Needed
                id="credentials"
                label="Insurance, trade bodies or qualifications — if there are any, they go here"
                className="mt-16"
                minHeight="9rem"
              />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
