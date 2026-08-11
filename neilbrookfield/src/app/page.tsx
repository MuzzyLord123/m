import Link from 'next/link';

import { Hero } from '@/components/Hero';
import { Section, Container } from '@/components/Section';
import { ProjectSpread } from '@/components/ProjectSpread';
import { Reviews } from '@/components/Reviews';
import { EnquiryForm } from '@/components/EnquiryForm';
import { Needed } from '@/components/Needed';
import { Rule } from '@/components/Rule';
import { FadeIn } from '@/components/Reveal';
import { PhoneNumber } from '@/components/Phone';
import { getFeaturedProjects } from '@/lib/projects';
import { home } from '@content/copy/home';

/**
 * Section tones alternate so the eye resets: the opening and the story sit on
 * ink, the work and the reviews on linen.
 */
export default function HomePage() {
  const featured = getFeaturedProjects(3);

  return (
    <>
      {/* Hero + what he is known for: one continuous opening on night. */}
      <Hero
        eyebrow={home.hero.eyebrow}
        heading={home.hero.heading}
        lede={home.hero.lede}
        image={{
          needs:
            'The hero photograph: the best hand-painted kitchen there is a picture of, wide, at original resolution.',
        }}
      />

      <Section tone="night">
        <Container>
          <Rule className="max-w-24" />
          <h2 className="sr-only">What I get asked for</h2>
          <p className="eyebrow mt-6">{home.knownFor.eyebrow}</p>

          <div className="mt-12 flex flex-col gap-14">
            {home.knownFor.items.map((item, i) => (
              <FadeIn key={item.heading} delay={i * 0.05}>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
                  <h3 className="text-[clamp(1.5rem,2.6vw,2.1rem)] lg:col-span-5">
                    {item.heading}
                  </h3>
                  <div className="lg:col-span-6 lg:col-start-7">
                    <p className="secondary max-w-[54ch] text-base leading-[1.7]">{item.body}</p>
                    <Link href={item.href} className="eyebrow link-rule mt-5 inline-block">
                      {item.linkLabel}
                    </Link>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </Container>
      </Section>

      <Section tone="linen">
        <Container>
          <Rule className="max-w-24" />
          <p className="eyebrow mt-6">{home.work.eyebrow}</p>
          <h2 className="mt-4 text-[clamp(2rem,4.5vw,3.25rem)]">{home.work.heading}</h2>

          <div className="mt-20 flex flex-col gap-24 lg:gap-32">
            {featured.map((project, i) => (
              <ProjectSpread key={project.slug} project={project} reversed={i % 2 === 1} />
            ))}

            {featured.length < 3 ? (
              <Needed
                id="project-grouping"
                label={`Two more jobs go here — ${3 - featured.length} of the three lead projects are still to be chosen`}
                minHeight="14rem"
              />
            ) : null}
          </div>

          <Link href={home.work.link.href} className="eyebrow link-rule mt-20 inline-block">
            {home.work.link.label}
          </Link>
        </Container>
      </Section>

      <Section tone="night">
        <Container>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
            <div className="lg:col-span-4">
              <Rule className="max-w-24" />
              <p className="eyebrow mt-6">{home.story.eyebrow}</p>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <h2 className="text-[clamp(2rem,4.5vw,3.25rem)]">{home.story.heading}</h2>
              <p className="mt-8 max-w-[58ch] text-lg leading-[1.7]">{home.story.body}</p>
              <Link href={home.story.link.href} className="eyebrow link-rule mt-8 inline-block">
                {home.story.link.label}
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="linen">
        <Container>
          <Rule className="max-w-24" />
          <p className="eyebrow mt-6">{home.reviews.eyebrow}</p>
          <h2 className="mt-4 mb-16 text-[clamp(2rem,4.5vw,3.25rem)]">{home.reviews.heading}</h2>
          <Reviews />
        </Container>
      </Section>

      <Section tone="night" id="enquiry">
        <Container>
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
            <div className="lg:col-span-4">
              <Rule className="max-w-24" />
              <p className="eyebrow mt-6">{home.enquiry.eyebrow}</p>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)]">{home.enquiry.heading}</h2>
              <p className="secondary mt-6 max-w-[42ch] text-base leading-[1.7]">
                {home.enquiry.body}
              </p>
              <p className="mt-8 text-xl">
                <PhoneNumber />
              </p>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <EnquiryForm source="home" />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
