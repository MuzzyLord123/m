import type { Metadata } from 'next';

import { reviewLinks } from '@content/reviews';
import { profiles } from '@content/site';

import { Band, Container } from '@/components/Band';
import { Meta, Split } from '@/components/Split';
import { PageHead } from '@/components/PageHead';
import { SeamLink } from '@/components/SeamLink';
import { Pending } from '@/components/Pending';

export const metadata: Metadata = {
  title: 'Leave a review | Ego Decorators, Neston',
  description:
    'If we have worked for you, the two places a review helps most are Yell and Google. Both links are here.',
  alternates: { canonical: '/leave-a-review' },
  // Not a page for search traffic — it exists to be texted to a customer.
  robots: { index: false, follow: true },
};

export default function LeaveAReviewPage() {
  return (
    <>
      <PageHead
        eyebrow="Reviews"
        title="Two minutes, if you have them"
        standfirst="If we have done a job for you and you were happy with it, a few lines somewhere public is the single most useful thing you can do for a small firm. Here are the two places it counts."
      />

      <Band tone="paper" className="pt-0">
        <Container>
          <Split
            className="border-t border-hair py-8"
            left={
              <div className="md:ml-auto md:max-w-[18ch]">
                <Meta className="mb-2">Where most of ours are</Meta>
                <h2 className="display-sm cross-seam">Yell</h2>
              </div>
            }
            right={
              <div>
                <p className="prose-body max-w-[52ch]">
                  Most of the reviews we have are here already. You will need to be signed in, or
                  it will ask you to make an account first.
                </p>
                <p className="mt-4">
                  <SeamLink href={reviewLinks.yell} external>
                    Write a review on Yell
                  </SeamLink>
                </p>
                <p className="mt-2">
                  <SeamLink href={profiles.yell.href} external>
                    Read the listing
                  </SeamLink>
                </p>
              </div>
            }
          />

          <Split
            className="border-t border-hair py-8"
            left={
              <div className="md:ml-auto md:max-w-[18ch]">
                <Meta className="mb-2">Where it helps most</Meta>
                <h2 className="display-sm cross-seam">Google</h2>
              </div>
            }
            right={
              reviewLinks.google ? (
                <div>
                  <p className="prose-body max-w-[52ch]">
                    A Google review is what puts us in front of somebody searching for a decorator
                    in Neston or on the Wirral. It takes about a minute if you are already signed
                    in on your phone.
                  </p>
                  <p className="mt-4">
                    <SeamLink href={reviewLinks.google} external>
                      Write a review on Google
                    </SeamLink>
                  </p>
                </div>
              ) : (
                <Pending id="google-profile" label="Google Business Profile" />
              )
            }
          />
        </Container>
      </Band>
    </>
  );
}
