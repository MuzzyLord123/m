import type { Metadata } from 'next';

import { repairs } from '@content/copy/repairs';
import { Band, Container } from '@/components/Band';
import { Meta, Split } from '@/components/Split';
import { PageHead, SeamRow } from '@/components/PageHead';
import { Seam } from '@/components/Seam';
import { Arrive } from '@/components/Arrive';
import { Enquiry } from '@/components/Enquiry';
import { Pending } from '@/components/Pending';
import { SeamLink } from '@/components/SeamLink';
import { requireProject } from '@/lib/projects';

export const metadata: Metadata = {
  title: 'Window, soffit & fascia repairs and painting | Cheshire & Wirral',
  description:
    'We cut rotten timber out of windows, soffits and fascias, splice new wood in, prime it and paint it. What each stage of rot looks like, what can be repaired, and when we will tell you to replace instead. Neston, Wirral and Flintshire.',
  alternates: { canonical: '/repairs' },
};

export default function RepairsPage() {
  const project = requireProject(repairs.comparison.project, '/repairs');

  return (
    <>
      <PageHead eyebrow="Exterior repair" title={repairs.title} standfirst={repairs.standfirst} />

      <Band tone="paper" className="pt-0">
        <Container wide>
          <Arrive>
            <Seam
              before={project.before}
              after={project.after}
              beforeLabel={repairs.comparison.before}
              afterLabel={repairs.comparison.after}
              caption={repairs.comparison.eyebrow}
              priority
            />
          </Arrive>
        </Container>
      </Band>

      {/* ------------------------------------------------- the four stages -- */}
      <Band tone="paper">
        <Container>
          <Split
            stackRule={false}
            left={<h2 className="display cross-seam max-w-[10ch]">{repairs.stages.heading}</h2>}
            right={<p className="lede max-w-[48ch]">{repairs.stages.intro}</p>}
          />

          <div className="mt-12">
            {repairs.stages.items.map((item) => (
              <SeamRow key={item.stage} label={`Stage ${item.stage}`} title={item.title}>
                <p>{item.body}</p>
              </SeamRow>
            ))}
          </div>
        </Container>
      </Band>

      {/* ------------------------------------------- filled, spliced, replaced */}
      <Band tone="ink">
        <Container>
          <Split
            stackRule={false}
            left={<h2 className="display cross-seam max-w-[10ch]">{repairs.decision.heading}</h2>}
            right={<p className="lede max-w-[48ch]">{repairs.decision.intro}</p>}
          />

          <div className="mt-12">
            {repairs.decision.items.map((item) => (
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

      {/* -------------------------------------------------- soffits and fascias */}
      <Band tone="paper">
        <Container>
          <Split
            left={
              <div className="md:ml-auto md:max-w-[16ch]">
                <h2 className="display-sm cross-seam">{repairs.soffits.heading}</h2>
              </div>
            }
            right={
              <div className="prose-body max-w-[54ch]">
                {repairs.soffits.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
              </div>
            }
          />

          {/* The close-ups this page needs. Named, not quietly left blank. */}
          <Pending
            id="woodwork-closeups"
            label="Photographs — rot opened up, spliced, primed, finished"
            className="mt-12"
          />
        </Container>
      </Band>

      {/* ------------------------------------------------------------- method */}
      <Band tone="paper" className="pt-0">
        <Container>
          <hr className="hair mb-band" />
          <Split
            stackRule={false}
            left={<h2 className="display cross-seam max-w-[10ch]">{repairs.method.heading}</h2>}
            right={<p className="lede max-w-[48ch]">{repairs.method.intro}</p>}
          />

          <ol className="mt-12">
            {repairs.method.steps.map((step, i) => (
              <li key={step.title}>
                <SeamRow label={`${i + 1} of ${repairs.method.steps.length}`} title={step.title}>
                  <p>{step.body}</p>
                </SeamRow>
              </li>
            ))}
          </ol>
        </Container>
      </Band>

      {/* -------------------------------------------------------- what it buys */}
      <Band tone="paper" className="pt-0">
        <Container>
          <Split
            className="border-t border-hair pt-band"
            left={
              <div className="md:ml-auto md:max-w-[14ch]">
                <h2 className="display-sm cross-seam">{repairs.honest.heading}</h2>
              </div>
            }
            right={
              <div className="prose-body max-w-[54ch]">
                {repairs.honest.body.map((paragraph) => (
                  <p key={paragraph.slice(0, 24)}>{paragraph}</p>
                ))}
              </div>
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
                <Meta>Exterior repair</Meta>
                <p className="mt-4">
                  <SeamLink href="/exterior">Exterior decorating</SeamLink>
                </p>
                <p className="mt-2">
                  <SeamLink href="/projects">Jobs we have done</SeamLink>
                </p>
              </div>
            }
            right={<Enquiry heading={repairs.cta.heading} body={repairs.cta.body} />}
          />
        </Container>
      </Band>
    </>
  );
}
