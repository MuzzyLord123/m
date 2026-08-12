import type { Metadata } from 'next';

import { about } from '@content/copy/about';
import { site, tradingSince } from '@content/site';
import { reviewsFor } from '@content/reviews';

import { Band, Container } from '@/components/Band';
import { Meta, Split } from '@/components/Split';
import { PageHead, SeamRow } from '@/components/PageHead';
import { Pending } from '@/components/Pending';
import { Testimonial, RatingLine } from '@/components/Reviews';
import { Enquiry } from '@/components/Enquiry';
import { SeamLink } from '@/components/SeamLink';

export const metadata: Metadata = {
  title: 'About us — a family firm in Neston | Ego Decorators',
  description:
    'Ego Decorators is a small family-run painting and decorating firm in Neston, working across Cheshire, the Wirral and Flintshire. How we work, and who turns up.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  const reviews = reviewsFor('about');
  const since = tradingSince();

  return (
    <>
      <PageHead eyebrow="About" title={about.title} standfirst={about.standfirst} />

      {/* ------------------------------------------------------------ the team */}
      <Band tone="paper" className="pt-0">
        <Container>
          <Split
            className="border-t border-hair pt-band"
            left={
              <div className="md:ml-auto md:max-w-[16ch]">
                <Meta className="mb-2">{site.base}</Meta>
                <h2 className="display-sm cross-seam">Who we are</h2>
              </div>
            }
            right={
              about.people.length ? (
                <ul className="prose-body max-w-[52ch]">
                  {about.people.map((person) => (
                    <li key={person.name} className="border-t border-hair py-3">
                      <span className="font-medium">
                        {person.name}
                        {person.known ? ` (${person.known})` : ''}
                      </span>{' '}
                      — {person.role}
                    </li>
                  ))}
                </ul>
              ) : (
                <Pending id="team" label="The team — who is who" />
              )
            }
          />
        </Container>
      </Band>

      {/* --------------------------------------------------------- years trading */}
      <Band tone="paper" className="pt-0">
        <Container>
          <Split
            className="border-t border-hair pt-band"
            stackRule={false}
            left={
              <div className="md:ml-auto md:max-w-[16ch]">
                <h2 className="display-sm cross-seam">How long</h2>
              </div>
            }
            right={
              since ? (
                <p className="prose-body max-w-[52ch]">
                  Ego Decorators has been {since}. That figure is worked out from the year we
                  started every time this page loads, so it cannot quietly go out of date the way
                  a number typed into a website does.
                </p>
              ) : (
                <Pending id="founded" label="The year the business started" />
              )
            }
          />
        </Container>
      </Band>

      {/* --------------------------------------------------------------- how */}
      <Band tone="ink">
        <Container>
          <h2 className="display cross-seam max-w-[10ch]">{about.how.heading}</h2>
          <div className="mt-12">
            {about.how.items.map((item, i) => (
              <SeamRow
                key={item.title}
                label={`${i + 1} of ${about.how.items.length}`}
                title={item.title}
                className="border-t border-hair-ink py-8"
              >
                <p>{item.body}</p>
              </SeamRow>
            ))}
          </div>
        </Container>
      </Band>

      {/* ------------------------------------------------------------ manner */}
      <Band tone="paper">
        <Container>
          <Split
            left={
              <div className="md:ml-auto md:max-w-[16ch]">
                <h2 className="display-sm cross-seam">{about.manner.heading}</h2>
              </div>
            }
            right={
              <div>
                <p className="prose-body max-w-[54ch]">{about.manner.body}</p>
                <RatingLine className="mt-6" />
              </div>
            }
          />

          <div className="mt-band">
            {reviews.map((review) => (
              <div key={review.id} className="border-t border-hair pt-8">
                <Testimonial review={review} />
              </div>
            ))}
          </div>

          <p className="mt-8">
            <SeamLink href="/leave-a-review">Had us in? Leave a review</SeamLink>
          </p>
        </Container>
      </Band>

      <Band tone="paper" className="pt-0">
        <Container>
          <hr className="hair mb-band" />
          <Split
            stackRule={false}
            left={<Meta>About</Meta>}
            right={<Enquiry heading={about.cta.heading} body={about.cta.body} />}
          />
        </Container>
      </Band>
    </>
  );
}
