import type { Metadata } from 'next';

import { interior } from '@content/copy/interior';
import { Band, Container } from '@/components/Band';
import { Meta, Split } from '@/components/Split';
import { PageHead, SeamRow } from '@/components/PageHead';
import { Seam } from '@/components/Seam';
import { Arrive } from '@/components/Arrive';
import { Enquiry } from '@/components/Enquiry';
import { SeamLink } from '@/components/SeamLink';
import { requireProject } from '@/lib/projects';

export const metadata: Metadata = {
  title: 'Interior decorators in Neston | Cheshire, Wirral & Flintshire',
  description:
    'Interior painting and decorating in Neston and across Cheshire, the Wirral and Flintshire. Walls, ceilings, woodwork and papering, from a single stained kitchen ceiling to a whole house.',
  alternates: { canonical: '/interior' },
};

export default function InteriorPage() {
  const project = requireProject(interior.comparison.project, '/interior');

  return (
    <>
      <PageHead eyebrow="Interior" title={interior.title} standfirst={interior.standfirst} />

      <Band tone="paper" className="pt-0">
        <Container wide>
          <Arrive>
            <Seam
              before={project.before}
              after={project.after}
              beforeLabel={interior.comparison.before}
              afterLabel={interior.comparison.after}
              caption={interior.comparison.eyebrow}
              priority
            />
          </Arrive>
        </Container>
      </Band>

      <Band tone="paper">
        <Container>
          <h2 className="display cross-seam max-w-[10ch]">{interior.work.heading}</h2>

          <div className="mt-12">
            {interior.work.items.map((item) => (
              <SeamRow key={item.title} title={item.title}>
                <p>{item.body}</p>
              </SeamRow>
            ))}
          </div>
        </Container>
      </Band>

      <Band tone="ink">
        <Container>
          <Split
            left={
              <div className="md:ml-auto md:max-w-[14ch]">
                <h2 className="display-sm cross-seam">{interior.hallways.heading}</h2>
              </div>
            }
            right={
              <div className="prose-body max-w-[54ch]">
                {interior.hallways.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
              </div>
            }
          />
        </Container>
      </Band>

      <Band tone="paper">
        <Container>
          <Split
            stackRule={false}
            left={
              <div>
                <Meta>Interior</Meta>
                <p className="mt-4">
                  <SeamLink href="/projects">Jobs we have done</SeamLink>
                </p>
                <p className="mt-2">
                  <SeamLink href="/exterior">Exterior decorating</SeamLink>
                </p>
              </div>
            }
            right={<Enquiry heading={interior.cta.heading} body={interior.cta.body} />}
          />
        </Container>
      </Band>
    </>
  );
}
