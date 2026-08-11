import type { Metadata } from 'next'
import Link from 'next/link'
import { Annotated } from '@/components/Annotated'
import { CallLink } from '@/components/CallLink'
import { Drawn } from '@/components/Drawn'
import { EnquiryForm } from '@/components/EnquiryForm'
import { GridRules } from '@/components/GridRules'
import { Section } from '@/components/Section'
import { SprayServiceBlock } from '@/components/SprayServiceBlock'
import { PageShell } from '@/components/Shell'
import { pageMetadata } from '@/lib/metadata'
import { phone } from '@content/site'
import {
  sprayHeroCallouts,
  sprayHeroPhoto,
  sprayIntro,
  sprayProcess,
  sprayServices,
} from '@content/spraying'

export const metadata: Metadata = pageMetadata({
  /*
   * The brief gives this title as "UPVC, garage door & exterior spraying | KH
   * Decorators" (§8.9) but also states, as grounds for rejection, that no title may
   * lack a place (§10). The second rule is the stricter one and the one that matters
   * for the local searches Kenny is bidding on, so the town is in. Wording otherwise
   * as specified, with the searched-for terms still at the front.
   */
  title: 'UPVC, garage door & exterior spraying in {town} | KH Decorators',
  description:
    'Spray finishing in {town} and across the north west. UPVC windows and doors, garage doors, render, cladding, kitchen doors and furniture. Degreased, keyed, primed, two coats. Ring Kenny on 07538 869832.',
  path: '/spraying',
})

/**
 * The money page.
 *
 * Spraying is the thing Kenny does that the competition round here mostly does not,
 * and "UPVC spraying" and "garage door spraying" have real search volume and thin
 * competition. On the old site this was one line of body text.
 *
 * Two structural decisions worth knowing about:
 *
 *  1. The question index sits above the fold. Somebody arriving from an ad for
 *     "UPVC spraying" sees their own question in the first screen and one tap takes
 *     them to the answer. That is the conversion mechanism on this page — not the
 *     hero photograph and not the button.
 *
 *  2. Every section is a `SprayService` object rendered through one component. To
 *     split /upvc-spraying out as its own ad-group landing page, add a route that
 *     renders `<SprayServiceBlock service={upvc} headingLevel="h1" />` and take its
 *     metadata from `service.landing`. No new components, no copy in JSX.
 */
export default function SprayingPage() {
  const rail = sprayServices.map((service, i) => ({
    id: service.slug,
    number: String(i + 1).padStart(2, '0'),
    label: service.name.split(/[—,]/)[0].trim(),
  }))

  return (
    <PageShell rail={rail}>
      {/* ============================================================ *
          Hero — and the question index
          ============================================================ */}
      <Drawn className="relative py-14 md:py-20">
        <GridRules />

        <div className="relative lg:grid lg:grid-cols-12 lg:gap-x-6">
          <div className="lg:col-span-8">
            <p className="annotation-lg text-ink">Spray finishing</p>
            <h1 className="display mt-4">
              Sprayed finishes on the surfaces a brush cannot do properly
            </h1>
            <p className="measure mt-8 text-lg leading-relaxed">{sprayIntro.lede}</p>

            {/* The question index. Whatever ad brought them, their question is here. */}
            <nav aria-label="Questions answered on this page" className="mt-10">
              <p className="annotation">Straight to your question</p>
              <ul className="mt-4 border-t border-rule">
                {sprayServices.map((service) => (
                  <li key={service.slug} className="border-b border-rule">
                    <Link
                      href={`#${service.slug}`}
                      className="group flex items-baseline justify-between gap-4 py-3"
                    >
                      <span className="link link-hover-target">{service.question}</span>
                      <span aria-hidden="true" className="text-signal">
                        ↓
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <CallLink
                className="annotation-lg border border-signal bg-signal px-6 py-4 text-paper transition-opacity duration-150 hover:opacity-85"
                from="spraying-hero"
              >
                Ring Kenny — {phone.label}
              </CallLink>
              <Link
                href="#quote"
                className="annotation-lg border border-ink px-6 py-4 transition-colors duration-150 hover:border-signal hover:text-signal"
              >
                Ask for a price
              </Link>
            </div>
          </div>
        </div>

        {/* Full width, so the callout labels have a gutter each side to sit in. */}
        <div className="relative mt-14">
          <Annotated
            photo={sprayHeroPhoto}
            callouts={sprayHeroCallouts}
            sizes="(min-width: 1280px) 1000px, 100vw"
            priority
            ratio="16 / 7"
          />
        </div>
      </Drawn>

      {/* ============================================================ *
          Why spraying at all
          ============================================================ */}
      <Section number="00" title="Why spray rather than brush">
        <div className="space-y-5">
          {sprayIntro.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="measure">
              {paragraph}
            </p>
          ))}
        </div>
      </Section>

      {/* ============================================================ *
          The four services
          ============================================================ */}
      {sprayServices.map((service, i) => (
        <SprayServiceBlock
          key={service.slug}
          service={service}
          number={String(i + 1).padStart(2, '0')}
        />
      ))}

      {/* ============================================================ *
          How a spray job runs
          ============================================================ */}
      <Section number="05" title="How a spray job runs">
        <ol className="border-t border-rule">
          {sprayProcess.map((step) => (
            <li
              key={step.number}
              className="grid gap-x-6 gap-y-2 border-b border-rule py-5 md:grid-cols-12"
            >
              <div className="annotation md:col-span-1">{step.number}</div>
              <h3 className="text-lg font-medium tracking-[-0.01em] md:col-span-4">{step.title}</h3>
              <p className="text-muted md:col-span-7">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ============================================================ *
          Quote
          ============================================================ */}
      <Section
        id="quote"
        number="06"
        title="Ask about spraying"
        standfirst="Tell me what it is and roughly where you are. Spraying cannot be quoted off a photograph — I need to see what the existing coating is doing and what needs masking — but I can tell you on the phone whether it is worth me coming out."
      >
        <EnquiryForm from="spraying" />
      </Section>
    </PageShell>
  )
}
