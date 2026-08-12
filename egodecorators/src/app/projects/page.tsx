import type { Metadata } from 'next';

import { Band, Container } from '@/components/Band';
import { Meta, Split } from '@/components/Split';
import { PageHead } from '@/components/PageHead';
import { SeamLink } from '@/components/SeamLink';
import { Pending } from '@/components/Pending';
import { getProjects, projectMeta } from '@/lib/projects';

export const metadata: Metadata = {
  title: 'Work — jobs we have done | Neston, Wirral & Cheshire',
  description:
    'Painting, decorating and exterior repair jobs across Neston, the Wirral, Cheshire and Flintshire, each one with the state it was in and the state we left it in.',
  alternates: { canonical: '/projects' },
};

export default function ProjectsPage() {
  const projects = getProjects();

  return (
    <>
      <PageHead
        eyebrow="Work"
        title="The state it was in"
        standfirst="Every job here has a photograph of what we found and a photograph of what we left, taken from the same spot. If the two pictures are not the same view, the job does not go on this page."
      />

      <Band tone="paper" className="pt-0">
        <Container>
          {projects.map((project) => (
            <Split
              key={project.slug}
              className="border-t border-hair py-8"
              left={
                <div className="md:ml-auto md:max-w-[20ch]">
                  <Meta className="mb-2">{projectMeta(project)}</Meta>
                  <h2 className="display-sm cross-seam">{project.title}</h2>
                </div>
              }
              right={
                <div>
                  <p className="prose-body max-w-[52ch]">{project.problem}</p>
                  {project.status !== 'complete' ? (
                    <Meta className="mt-3">
                      {project.status === 'awaiting-photos'
                        ? 'Photographs to come'
                        : 'Carried over from the old site — not yet re-confirmed'}
                    </Meta>
                  ) : null}
                  <p className="mt-4">
                    <SeamLink href={`/projects/${project.slug}`}>
                      What we did on this one
                    </SeamLink>
                  </p>
                </div>
              }
            />
          ))}

          <div className="border-t border-hair pt-8">
            <Pending
              id="comparison-pairs"
              label="More jobs — four matched before-and-after pairs needed"
            />
          </div>
        </Container>
      </Band>
    </>
  );
}
