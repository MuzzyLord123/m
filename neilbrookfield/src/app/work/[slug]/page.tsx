import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';

import { pageMetadata } from '@/lib/metadata';
import { Section, Container } from '@/components/Section';
import { Plate, EmptyFrame } from '@/components/Plate';
import { SpecimenStrip } from '@/components/SpecimenStrip';
import { Rule } from '@/components/Rule';
import { jsonLd, projectSchema } from '@/lib/schema';
import {
  TYPE_LABELS,
  getProject,
  getProjects,
  getNextProject,
  heroImage,
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
  const hero = project.images.find((i) => i.src);

  return pageMetadata({
    title: `${project.title}${where} | Neil Brookfield`,
    description: project.brief,
    path: `/work/${project.slug}`,
    type: 'article',
    // The sharing image is the job's own hero photograph. Where the job has no
    // photographs yet, pageMetadata falls back to the site card.
    ...(hero?.src ? { image: { url: hero.src, alt: hero.alt ?? project.title } } : {}),
  });
}

const mdxComponents = {
  p: (props: React.ComponentProps<'p'>) => (
    <p {...props} className="max-w-[64ch] text-lg leading-[1.7]" />
  ),
  h2: (props: React.ComponentProps<'h2'>) => (
    <h2 {...props} className="mt-12 text-[clamp(1.5rem,3vw,2rem)]" />
  ),
  a: (props: React.ComponentProps<'a'>) => <a {...props} className="link-rule" />,
  ul: (props: React.ComponentProps<'ul'>) => (
    <ul {...props} className="max-w-[64ch] list-disc pl-6" />
  ),
};

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const hero = heroImage(project);
  const rest = project.images.slice(1);
  const next = getNextProject(project.slug);

  return (
    <>
      {/* Title block over the hero photograph. */}
      <Section tone="night" flush className="!pt-0">
        <div className="relative">
          {hero?.src ? (
            <Plate
              image={{ ...hero, caption: undefined }}
              ratio="16 / 9"
              priority
              sizes="100vw"
              animate={false}
            />
          ) : (
            <EmptyFrame
              ratio="16 / 9"
              need={
                hero?.needs ??
                'The lead photograph for this job, at original resolution from the Wix media manager.'
              }
            />
          )}
        </div>

        <Container className="gutter-x mt-12">
          <p className="eyebrow">
            {TYPE_LABELS[project.type]}
            {project.location ? ` · ${project.location}` : ''}
            {project.year ? ` · ${project.year}` : ''}
          </p>
          <h1 className="mt-5 max-w-[20ch] text-[clamp(2.25rem,6vw,4.5rem)]">{project.title}</h1>

          {project.status !== 'complete' && project.note ? (
            <div className="mt-10 max-w-[60ch] border border-dashed border-slate p-6">
              <p className="eyebrow">Not yet confirmed</p>
              <p className="secondary mt-3 text-sm leading-relaxed">{project.note}</p>
            </div>
          ) : null}
        </Container>
      </Section>

      <Section tone="linen">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
            <div className="lg:col-span-4">
              <Rule className="max-w-24" />
              <p className="eyebrow mt-6">What the customer wanted</p>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <p className="text-[clamp(1.35rem,2.6vw,1.75rem)] leading-[1.45]">{project.brief}</p>
            </div>
          </div>

          {project.work.length ? (
            <div className="mt-24 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
              <div className="lg:col-span-4">
                <Rule className="max-w-24" />
                <p className="eyebrow mt-6">What the job involved</p>
                <p className="secondary mt-4 max-w-[32ch] text-sm leading-relaxed">
                  In the order it was done. The preparation comes first because that is where the
                  time goes.
                </p>
              </div>
              <ol className="lg:col-span-7 lg:col-start-6">
                {project.work.map((step, i) => (
                  <li key={step} className="border-t border-t-current/15 py-6 first:border-t-0 first:pt-0">
                    <div className="flex gap-6">
                      <span className="eyebrow tabular mt-1 shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <p className="max-w-[54ch] text-base leading-[1.7]">{step}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {project.colours.length ? (
            <div className="mt-24">
              <SpecimenStrip colours={project.colours} />
            </div>
          ) : null}
        </Container>
      </Section>

      {project.body ? (
        <Section tone="night">
          <Container>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
              <div className="lg:col-span-4">
                <Rule className="max-w-24" />
                <p className="eyebrow mt-6">In Neil's words</p>
              </div>
              <div className="prose-neil lg:col-span-7 lg:col-start-6">
                <MDXRemote source={project.body} components={mdxComponents} />
              </div>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* The photographs, read down the page. Never a grid of thumbnails —
          that was the old site's failure. The title sticks alongside them. */}
      {rest.length ? (
        <Section tone="night" className="!pt-0">
          <Container>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-x-[var(--spacing-gutter)]">
              <div className="lg:col-span-3">
                <div className="lg:sticky lg:top-28">
                  <Rule className="max-w-24" />
                  <p className="eyebrow mt-6">{TYPE_LABELS[project.type]}</p>
                  <p className="mt-3 font-[family-name:var(--font-display)] text-2xl leading-tight font-light">
                    {project.title}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-20 lg:col-span-9 lg:col-start-4">
                {rest.map((image, i) => (
                  <Plate
                    key={image.src ?? image.needs ?? i}
                    image={image}
                    ratio="3 / 2"
                    sizes="(min-width: 1024px) 70vw, 100vw"
                  />
                ))}
              </div>
            </div>
          </Container>
        </Section>
      ) : null}

      {next ? (
        <Section tone="linen">
          <Container>
            <Rule className="max-w-24" />
            <p className="eyebrow mt-6">Next job</p>
            <h2 className="mt-4 max-w-[20ch] text-[clamp(1.75rem,4vw,3rem)]">
              <Link href={`/work/${next.slug}`} className="hover:text-brass">
                {next.title}
              </Link>
            </h2>
            <Link href="/work" className="eyebrow link-rule mt-8 inline-block">
              All the work
            </Link>
          </Container>
        </Section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(projectSchema(project)) }}
      />
    </>
  );
}
