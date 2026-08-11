import type { Metadata } from 'next';

import { pageMetadata } from '@/lib/metadata';

import { Section, Container } from '@/components/Section';
import { ProjectSpread } from '@/components/ProjectSpread';
import { Rule } from '@/components/Rule';
import { Needed } from '@/components/Needed';
import { getProjects } from '@/lib/projects';
import { SHOW_PLACEHOLDERS } from '@content/site';
import { work } from '@content/copy/work';

export const metadata: Metadata = pageMetadata({
  title: work.meta.title,
  description: work.meta.description,
  path: '/work',
});

export default function WorkPage() {
  const projects = getProjects();

  return (
    <>
      <Section tone="night">
        <Container>
          <Rule className="max-w-24" />
          <p className="eyebrow mt-6">{work.eyebrow}</p>
          <h1 className="mt-4 text-[clamp(2.5rem,6vw,4.5rem)]">{work.heading}</h1>
          <p className="secondary mt-8 max-w-[58ch] text-lg leading-[1.7]">{work.lede}</p>
        </Container>
      </Section>

      <Section tone="linen">
        <Container>
          <div className="flex flex-col gap-24 lg:gap-32">
            {projects.map((project, i) => (
              <ProjectSpread
                key={project.slug}
                project={project}
                reversed={i % 2 === 1}
                priority={i === 0}
              />
            ))}
          </div>

          {/* Scaffolding copy: shown while the site is being reviewed, dropped
              once SHOW_PLACEHOLDERS is off. */}
          {SHOW_PLACEHOLDERS ? (
            <div className="mt-24 lg:mt-32">
              <Rule className="max-w-24" />
              <p className="eyebrow mt-6">{work.pending.eyebrow}</p>
              <h2 className="mt-4 max-w-[22ch] text-[clamp(1.75rem,3.5vw,2.75rem)]">
                {work.pending.heading}
              </h2>
              <p className="secondary mt-6 max-w-[60ch] text-base leading-[1.7]">
                {work.pending.body}
              </p>
              <Needed
                id="project-grouping"
                label="Eight to twelve jobs go here"
                className="mt-12"
                minHeight="12rem"
              />
            </div>
          ) : null}
        </Container>
      </Section>
    </>
  );
}
