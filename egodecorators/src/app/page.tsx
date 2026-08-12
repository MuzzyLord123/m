import type { Metadata } from 'next';

import { home } from '@content/copy/home';
import { site } from '@content/site';
import { reviewsFor } from '@content/reviews';

import { Band, Container } from '@/components/Band';
import { Meta, Split } from '@/components/Split';
import { Wordmark } from '@/components/Wordmark';
import { Seam } from '@/components/Seam';
import { Arrive } from '@/components/Arrive';
import { SlideFromSeam } from '@/components/SlideFromSeam';
import { SeamLink } from '@/components/SeamLink';
import { Testimonial } from '@/components/Reviews';
import { Enquiry } from '@/components/Enquiry';
import { requireProject } from '@/lib/projects';

export const metadata: Metadata = {
  title: 'Painters & decorators in Neston | Ego Decorators',
  description:
    'Family-run painters and decorators in Neston, covering Cheshire, the Wirral and Flintshire. We repair rotten windows, soffits and fascias before we paint them.',
  alternates: { canonical: '/' },
};

export default function HomePage() {
  const lead = requireProject(home.leadComparison.project, 'the home page');
  const commercial = requireProject(home.commercialComparison.project, 'the home page');
  const reviews = reviewsFor('home');

  return (
    <>
      {/* ------------------------------------------------------- the wordmark */}
      <Band tone="paper">
        <Container>
          <Wordmark as="h1" size="display" />

          <Split
            className="mt-10"
            align="baseline"
            stackRule={false}
            left={<Meta>{site.base} · Cheshire · Wirral · Flintshire</Meta>}
            right={<p className="lede max-w-[46ch]">{home.standfirst}</p>}
          />
        </Container>
      </Band>

      {/* ----------------------------------------------- the first comparison */}
      <Band tone="paper" className="pt-0">
        <Container wide>
          <Arrive>
            <Seam
              before={lead.before}
              after={lead.after}
              beforeLabel={home.leadComparison.before}
              afterLabel={home.leadComparison.after}
              caption={home.leadComparison.eyebrow}
              priority
            />
          </Arrive>
        </Container>
      </Band>

      {/* --------------------------------------------- the repair specialism */}
      <Band tone="paper">
        <Container>
          <Split
            left={
              <SlideFromSeam side="left">
                <h2 className="display cross-seam">{home.specialism.heading}</h2>
              </SlideFromSeam>
            }
            right={
              <SlideFromSeam side="right" delay={0.08}>
                <div className="prose-body">
                  {home.specialism.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                  ))}
                </div>
                <p className="mt-6">
                  <SeamLink href={home.specialism.link.href}>
                    {home.specialism.link.label}
                  </SeamLink>
                </p>
              </SlideFromSeam>
            }
          />
        </Container>
      </Band>

      {/* -------------------------------------------- the commercial proof */}
      <Band tone="ink">
        <Container>
          <Split
            className="mb-10"
            stackRule={false}
            left={<Meta>{home.commercialComparison.eyebrow}</Meta>}
            right={<p className="lede max-w-[52ch]">{home.commercialComparison.lead}</p>}
          />
        </Container>

        <Container wide>
          <Arrive>
            <Seam
              before={commercial.before}
              after={commercial.after}
              beforeLabel={home.commercialComparison.before}
              afterLabel={home.commercialComparison.after}
            />
          </Arrive>
        </Container>

        <Container className="mt-8">
          <Split
            stackRule={false}
            left={null}
            right={
              <SeamLink href={home.commercialComparison.link.href}>
                {home.commercialComparison.link.label}
              </SeamLink>
            }
          />
        </Container>
      </Band>

      {/* ------------------------------------------------------------ services */}
      <Band tone="paper">
        <Container>
          <h2 className="display-sm">{home.services.heading}</h2>

          <div className="mt-10">
            {home.services.items.map((service, i) => (
              <Split
                key={service.href}
                className="border-t border-hair py-8"
                left={
                  <h3 className="display-sm cross-seam max-w-[14ch] md:ml-auto">
                    {service.title}
                  </h3>
                }
                right={
                  <div>
                    <p className="prose-body max-w-[46ch]">{service.body}</p>
                    <p className="mt-4">
                      <SeamLink href={service.href}>
                        {i === 0 ? 'How we do repairs' : `More on ${service.title.toLowerCase()}`}
                      </SeamLink>
                    </p>
                  </div>
                }
              />
            ))}
          </div>
        </Container>
      </Band>

      {/* -------------------------------------------------------- testimonials */}
      <Band tone="paper" className="pt-0">
        <Container>
          <hr className="hair mb-band" />
          <Split
            align="start"
            left={reviews[0] ? <Testimonial review={reviews[0]} /> : null}
            right={reviews[1] ? <Testimonial review={reviews[1]} /> : null}
          />
        </Container>
      </Band>

      {/* ---------------------------------------------------------------- area */}
      <Band tone="paper" className="pt-0">
        <Container>
          <Split
            left={<h2 className="display-sm cross-seam">{home.area.heading}</h2>}
            right={<p className="prose-body max-w-[54ch]">{home.area.body}</p>}
          />
        </Container>
      </Band>

      {/* ------------------------------------------------------------- enquiry */}
      <Band tone="paper" className="pt-0">
        <Container>
          <hr className="hair mb-band" />
          <Split
            stackRule={false}
            left={<Meta>Get a price</Meta>}
            right={<Enquiry heading={home.enquiry.heading} body={home.enquiry.body} />}
          />
        </Container>
      </Band>
    </>
  );
}
