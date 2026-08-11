import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';

import { Band, Container } from '@/components/Band';
import { Meta, Split } from '@/components/Split';
import { Seam } from '@/components/Seam';
import { Arrive } from '@/components/Arrive';
import { SeamLink } from '@/components/SeamLink';
import { SlideFromSeam } from '@/components/SlideFromSeam';
import { Enquiry } from '@/components/Enquiry';
import { pageMetadata } from '@/lib/metadata';
import { jsonLd, projectSchema } from '@/lib/schema';
import {
  TYPE_LABELS,
  getNextProject,
  getProject,
  getProjects,
  projectMeta,
} from '@/lib/projects';

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};

  const where = project.location ? ` in ${project.location}` : '';

  return pageMetadata({
    title: `${project.title}${where}`,
    description: project.problem,
    path: `/projects/${project.slug}`,
    type: 'article',
  });
}

/** MDX body styling. The write-up gets the body face and a sane measure. */
const mdxComponents = {
  p: (props: React.ComponentProps<'p'>) => <p {...props} className="max-w-[62ch]" />,
  h2: (props: React.ComponentProps<'h2'>) => <h2 {...props} className="display-sm mt-10 mb-4" />,
  ul: (props: React.ComponentProps<'ul'>) => (
    <ul {...props} className="max-w-[62ch] list-disc pl-5" />
  ),
  a: (props: React.ComponentProps<'a'>) => <a {...props} className="link-seam" />,
};

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const next = getNextProject(project.slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(projectSchema(project)) }}
      />

      <Band tone="paper">
        <Container>
          <SlideFromSeam side="left">
            <h1 className="display cross-seam max-w-[16ch]">{project.title}</h1>
          </SlideFromSeam>

          <Split
            className="mt-10"
            align="baseline"
            stackRule={false}
            left={<Meta>{projectMeta(project)}</Meta>}
            right={<p className="lede max-w-[52ch]">{project.problem}</p>}
          />

          {project.note ? <p className="meta mt-6 max-w-[62ch] normal-case tracking-normal">{project.note}</p> : null}
        </Container>
      </Band>

      {/* The comparison. Full bleed — this is the only place imagery goes wide. */}
      <Band tone="paper" className="pt-0">
        <Container wide>
          <Arrive>
            <Seam
              before={project.before}
              after={project.after}
              beforeLabel={project.problem}
              afterLabel={project.work[project.work.length - 1] ?? 'Finished'}
              priority
            />
          </Arrive>
        </Container>
      </Band>

      {/* What was done, in order, opposite the write-up. */}
      <Band tone="paper">
        <Container>
          <Split
            left={
              <div className="md:ml-auto md:max-w-[24ch]">
                <Meta className="mb-3">What we did, in order</Meta>
                <ol>
                  {project.work.map((step) => (
                    <li key={step} className="border-t border-hair py-2 text-[15px] leading-[1.5]">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            }
            right={
              <div className="prose-body">
                <MDXRemote source={project.body} components={mdxComponents} />
              </div>
            }
          />
        </Container>
      </Band>

      {/* Any further photographs, down the page. */}
      {project.gallery.filter((g) => g.src).length ? (
        <Band tone="paper" className="pt-0">
          <Container>
            <div className="grid gap-gutter md:grid-cols-2">
              {project.gallery
                .filter((g) => g.src && g.alt)
                .map((image) => (
                  <Arrive key={image.src}>
                    <Image
                      src={image.src as string}
                      alt={image.alt as string}
                      width={image.width ?? 1600}
                      height={image.height ?? 1067}
                      sizes="(min-width: 48rem) 50vw, 100vw"
                      className="h-auto w-full"
                    />
                  </Arrive>
                ))}
            </div>
          </Container>
        </Band>
      ) : null}

      {/* Next job, and the ask. */}
      <Band tone="paper" className="pt-0">
        <Container>
          <hr className="hair mb-band" />
          <Split
            stackRule={false}
            left={
              <div>
                <Meta>{TYPE_LABELS[project.type]}</Meta>
                {next ? (
                  <p className="mt-4">
                    <SeamLink href={`/projects/${next.slug}`}>{next.title}</SeamLink>
                  </p>
                ) : null}
                <p className="mt-2">
                  <SeamLink href="/projects">All the jobs</SeamLink>
                </p>
              </div>
            }
            right={
              <Enquiry
                heading="Something like this?"
                body="Tell us what state yours is in. A photograph of the worst corner is the quickest way to get a straight answer about what it needs."
              />
            }
          />
        </Container>
      </Band>
    </>
  );
}
