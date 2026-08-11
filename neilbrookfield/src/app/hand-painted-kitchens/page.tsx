import type { Metadata } from 'next';

import { Section, Container } from '@/components/Section';
import { ProjectSpread } from '@/components/ProjectSpread';
import { EnquiryForm } from '@/components/EnquiryForm';
import { Needed } from '@/components/Needed';
import { EmptyFrame } from '@/components/Plate';
import { Rule } from '@/components/Rule';
import { PhoneNumber } from '@/components/Phone';
import { getProjectsByType } from '@/lib/projects';
import { kitchens } from '@content/copy/kitchens';

export const metadata: Metadata = {
  title: kitchens.meta.title,
  description: kitchens.meta.description,
  alternates: { canonical: '/hand-painted-kitchens' },
  openGraph: {
    title: kitchens.meta.title,
    description: kitchens.meta.description,
    url: '/hand-painted-kitchens',
  },
};

export default function KitchensPage() {
  const projects = getProjectsByType('kitchen');

  return (
    <>
      <Section tone="night">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
            <div className="lg:col-span-5">
              <Rule className="max-w-24" />
              <p className="eyebrow mt-6">{kitchens.eyebrow}</p>
              <h1 className="mt-4 text-[clamp(2.5rem,6vw,4.5rem)]">{kitchens.heading}</h1>
            </div>
            <div className="lg:col-span-6 lg:col-start-7 lg:pt-24">
              <p className="text-lg leading-[1.7]">{kitchens.lede}</p>
            </div>
          </div>

          <div className="mt-20">
            <EmptyFrame
              ratio="21 / 9"
              need="A wide photograph of a finished hand-painted kitchen — ideally one with the light coming in from one side, so the brushed finish reads."
            />
          </div>
        </Container>
      </Section>

      <Section tone="linen">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
            <div className="lg:col-span-4">
              <Rule className="max-w-24" />
              <p className="eyebrow mt-6">{kitchens.brushedNotSprayed.eyebrow}</p>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <h2 className="text-[clamp(1.75rem,4vw,3rem)]">
                {kitchens.brushedNotSprayed.heading}
              </h2>
              <div className="mt-8 flex flex-col gap-6">
                {kitchens.brushedNotSprayed.paragraphs.map((p) => (
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
                <p className="eyebrow mt-6">{kitchens.process.eyebrow}</p>
                <h2 className="mt-4 text-[clamp(1.75rem,3.4vw,2.5rem)]">
                  {kitchens.process.heading}
                </h2>
                <p className="secondary mt-6 max-w-[34ch] text-base leading-[1.7]">
                  {kitchens.process.intro}
                </p>
              </div>
            </div>

            <ol className="lg:col-span-7 lg:col-start-6">
              {kitchens.process.steps.map((step, i) => (
                <li key={step.title} className="border-t border-t-slate py-8 first:border-t-0 first:pt-0">
                  <div className="flex gap-6">
                    <span className="eyebrow tabular mt-2 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="text-[clamp(1.2rem,2.2vw,1.5rem)]">{step.title}</h3>
                      <p className="secondary mt-3 max-w-[54ch] text-base leading-[1.7]">
                        {step.body}
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
          {/* Stacked asymmetric rows, not a three-up card row — see the
              distinctness contract. Nothing here is a card. */}
          <div className="flex flex-col gap-16">
            {[kitchens.furniture, kitchens.colour, kitchens.cost].map((block) => (
              <div
                key={block.eyebrow}
                className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]"
              >
                <div className="lg:col-span-4">
                  <Rule className="max-w-16" />
                  <p className="eyebrow mt-5">{block.eyebrow}</p>
                </div>
                <div className="lg:col-span-7 lg:col-start-6">
                  <h3 className="text-[clamp(1.3rem,2.4vw,1.75rem)]">{block.heading}</h3>
                  <p className="secondary mt-4 max-w-[58ch] text-base leading-[1.7]">
                    {block.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="night">
        <Container>
          <Rule className="max-w-24" />
          <p className="eyebrow mt-6">{kitchens.projects.eyebrow}</p>
          <h2 className="mt-4 text-[clamp(2rem,4.5vw,3.25rem)]">{kitchens.projects.heading}</h2>

          <div className="mt-20 flex flex-col gap-24 lg:gap-32">
            {projects.map((project, i) => (
              <ProjectSpread key={project.slug} project={project} reversed={i % 2 === 1} />
            ))}
            {projects.length === 0 ? (
              <Needed
                id="project-grouping"
                label="The kitchens go here — named, with the colours used"
                minHeight="14rem"
              />
            ) : null}
          </div>
        </Container>
      </Section>

      <Section tone="linen">
        <Container>
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
            <div className="lg:col-span-4">
              <Rule className="max-w-24" />
              <p className="eyebrow mt-6">Arrange a visit</p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)]">Have a look at your kitchen?</h2>
              <p className="secondary mt-6 max-w-[40ch] text-base leading-[1.7]">
                Send a photograph of a door and the run of units and I will tell you whether it is
                worth painting before I come out.
              </p>
              <p className="mt-8 text-xl">
                <PhoneNumber />
              </p>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <EnquiryForm source="hand-painted-kitchens" />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
