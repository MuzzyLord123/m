import type { Metadata } from 'next';

import { commercial } from '@content/copy/commercial';
import { reviewsFor } from '@content/reviews';

import { Band, Container } from '@/components/Band';
import { Meta, Split } from '@/components/Split';
import { PageHead, SeamRow } from '@/components/PageHead';
import { Seam } from '@/components/Seam';
import { Arrive } from '@/components/Arrive';
import { Enquiry } from '@/components/Enquiry';
import { Pending } from '@/components/Pending';
import { Testimonial } from '@/components/Reviews';
import { SeamLink } from '@/components/SeamLink';
import { requireProject } from '@/lib/projects';

export const metadata: Metadata = {
  title: 'Commercial decorators — offices, warehouses & care homes | Cheshire & Wirral',
  description:
    'Commercial and industrial painting and decorating across Cheshire, the Wirral and Flintshire. Offices, warehouses, churches and care homes, worked in phases or out of hours around premises that stay open.',
  alternates: { canonical: '/commercial' },
};

export default function CommercialPage() {
  const project = requireProject(commercial.comparison.project, '/commercial');
  const reviews = reviewsFor('commercial');

  return (
    <>
      <PageHead
        eyebrow="Commercial and industrial"
        title={commercial.title}
        standfirst={commercial.standfirst}
      />

      <Band tone="paper" className="pt-0">
        <Container wide>
          <Arrive>
            <Seam
              before={project.before}
              after={project.after}
              beforeLabel={commercial.comparison.before}
              afterLabel={commercial.comparison.after}
              caption={commercial.comparison.eyebrow}
              priority
            />
          </Arrive>
        </Container>
      </Band>

      {/* ------------------------------------------------ fitting around you -- */}
      <Band tone="ink">
        <Container>
          <h2 className="display cross-seam max-w-[12ch]">{commercial.how.heading}</h2>

          <div className="mt-12">
            {commercial.how.items.map((item) => (
              <SeamRow
                key={item.title}
                title={item.title}
                className="border-t border-hair-ink py-8"
              >
                <p>{item.body}</p>
              </SeamRow>
            ))}
          </div>
        </Container>
      </Band>

      {/* --------------------------------------------------------- the review */}
      {reviews.length ? (
        <Band tone="paper">
          <Container>
            <Split
              stackRule={false}
              left={<Meta>What a client said</Meta>}
              right={<Testimonial review={reviews[0]} />}
            />
          </Container>
        </Band>
      ) : null}

      {/* ----------------------------------------------------------- premises */}
      <Band tone="paper" className="pt-0">
        <Container>
          <hr className="hair mb-band" />
          <h2 className="display-sm">{commercial.premises.heading}</h2>

          <div className="mt-10">
            {commercial.premises.items.map((item) => (
              <SeamRow key={item.title} title={item.title}>
                <p>{item.body}</p>
              </SeamRow>
            ))}
          </div>
        </Container>
      </Band>

      {/* -------------------------------------------------------- the paperwork */}
      <Band tone="paper" className="pt-0">
        <Container>
          <Split
            className="border-t border-hair pt-band"
            left={
              <div className="md:ml-auto md:max-w-[16ch]">
                <h2 className="display-sm cross-seam">{commercial.paperwork.heading}</h2>
              </div>
            }
            right={
              commercial.paperwork.body ? (
                <p className="prose-body max-w-[54ch]">{commercial.paperwork.body}</p>
              ) : (
                <Pending id="insurance" label="Public liability cover and qualifications" />
              )
            }
          />
        </Container>
      </Band>

      {/* ---------------------------------------------------------------- ask */}
      <Band tone="paper" className="pt-0">
        <Container>
          <hr className="hair mb-band" />
          <Split
            stackRule={false}
            left={
              <div>
                <Meta>Commercial</Meta>
                <p className="mt-4">
                  <SeamLink href="/projects/reagent-offices-and-warehouse">
                    The ReAgent job in full
                  </SeamLink>
                </p>
                <p className="mt-2">
                  <SeamLink href="/repairs">Exterior repair</SeamLink>
                </p>
              </div>
            }
            right={<Enquiry heading={commercial.cta.heading} body={commercial.cta.body} />}
          />
        </Container>
      </Band>
    </>
  );
}
