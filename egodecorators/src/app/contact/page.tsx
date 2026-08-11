import type { Metadata } from 'next';

import { contact } from '@content/copy/contact';
import { home } from '@content/copy/home';
import { site } from '@content/site';

import { Band, Container } from '@/components/Band';
import { Meta, Split } from '@/components/Split';
import { PageHead } from '@/components/PageHead';
import { Enquiry } from '@/components/Enquiry';
import { Pending } from '@/components/Pending';

export const metadata: Metadata = {
  title: 'Contact — get a price | Ego Decorators, Neston',
  description:
    'Ring or email Ego Decorators in Neston for painting, decorating and exterior repair across Cheshire, the Wirral and Flintshire. Send a photograph of the problem and we will tell you what it needs.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <>
      <PageHead eyebrow="Contact" title={contact.title} standfirst={contact.standfirst} />

      <Band tone="paper" className="pt-0">
        <Container>
          <Split
            className="border-t border-hair pt-band"
            left={
              <div className="md:ml-auto md:max-w-[24ch]">
                <Meta className="mb-3">{contact.helpful.heading}</Meta>
                <ul>
                  {contact.helpful.items.map((item) => (
                    <li key={item} className="border-t border-hair py-2 text-[15px] leading-[1.5]">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            }
            right={
              <Enquiry heading={contact.direct.heading} body={contact.direct.body} withForm />
            }
          />
        </Container>
      </Band>

      {/* --------------------------------------------------------------- hours */}
      <Band tone="paper" className="pt-0">
        <Container>
          <Split
            className="border-t border-hair pt-band"
            stackRule={false}
            left={
              <div className="md:ml-auto md:max-w-[16ch]">
                <h2 className="display-sm cross-seam">When we work</h2>
              </div>
            }
            right={
              contact.hours ? (
                <p className="prose-body max-w-[52ch]">{contact.hours}</p>
              ) : (
                <Pending id="hours" label="Working hours and how soon you can come out" />
              )
            }
          />
        </Container>
      </Band>

      {/* ---------------------------------------------------------------- area */}
      <Band tone="ink">
        <Container>
          <Split
            left={
              <div className="md:ml-auto md:max-w-[16ch]">
                <Meta className="mb-2">{site.areaServed.join(' · ')}</Meta>
                <h2 className="display-sm cross-seam">{home.area.heading}</h2>
              </div>
            }
            right={<p className="prose-body max-w-[54ch]">{home.area.body}</p>}
          />
        </Container>
      </Band>
    </>
  );
}
