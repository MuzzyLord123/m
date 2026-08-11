import type { Metadata } from 'next';

import { exterior } from '@content/copy/exterior';
import { Band, Container } from '@/components/Band';
import { Meta, Split } from '@/components/Split';
import { PageHead, SeamRow } from '@/components/PageHead';
import { Seam } from '@/components/Seam';
import { Arrive } from '@/components/Arrive';
import { Enquiry } from '@/components/Enquiry';
import { SeamLink } from '@/components/SeamLink';
import { requireProject } from '@/lib/projects';

export const metadata: Metadata = {
  title: 'Exterior painters & decorators | Neston, Wirral & Flintshire',
  description:
    'Exterior painting and decorating across the Wirral, Cheshire and Flintshire. Render and masonry, windows and doors, soffits and fascias, gutters and metalwork — repaired first where the timber has gone.',
  alternates: { canonical: '/exterior' },
};

export default function ExteriorPage() {
  const project = requireProject(exterior.comparison.project, '/exterior');

  return (
    <>
      <PageHead eyebrow="Exterior" title={exterior.title} standfirst={exterior.standfirst} />

      <Band tone="paper" className="pt-0">
        <Container wide>
          <Arrive>
            <Seam
              before={project.before}
              after={project.after}
              beforeLabel={exterior.comparison.before}
              afterLabel={exterior.comparison.after}
              caption={exterior.comparison.eyebrow}
              priority
            />
          </Arrive>
        </Container>
      </Band>

      <Band tone="paper">
        <Container>
          <h2 className="display cross-seam max-w-[12ch]">{exterior.work.heading}</h2>

          <div className="mt-12">
            {exterior.work.items.map((item) => (
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
                <h2 className="display-sm cross-seam">{exterior.weather.heading}</h2>
              </div>
            }
            right={
              <div className="prose-body max-w-[54ch]">
                {exterior.weather.body.map((paragraph) => (
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
                <Meta>Exterior</Meta>
                <p className="mt-4">
                  <SeamLink href="/repairs">When the timber has gone</SeamLink>
                </p>
                <p className="mt-2">
                  <SeamLink href="/projects">Jobs we have done</SeamLink>
                </p>
              </div>
            }
            right={<Enquiry heading={exterior.cta.heading} body={exterior.cta.body} />}
          />
        </Container>
      </Band>
    </>
  );
}
