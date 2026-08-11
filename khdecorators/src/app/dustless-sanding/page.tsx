import type { Metadata } from 'next'
import Link from 'next/link'
import { Annotated } from '@/components/Annotated'
import { CallLink } from '@/components/CallLink'
import { Drawn } from '@/components/Drawn'
import { EnquiryForm } from '@/components/EnquiryForm'
import { GridRules } from '@/components/GridRules'
import { Section } from '@/components/Section'
import { PageShell } from '@/components/Shell'
import { Spec } from '@/components/Spec'
import { fill, pageMetadata } from '@/lib/metadata'
import { dustless } from '@content/dustless'
import { phone } from '@content/site'

export const metadata: Metadata = pageMetadata({
  title: 'Dustless sanding — decorating in {town} | KH Decorators',
  description:
    'Dustless sanding in {town} and across the north west. Dust extracted at the pad as it is made, so you can stay in the house while the decorating happens. Ring Kenny on 07538 869832.',
  path: '/dustless-sanding',
})

/**
 * The second differentiator, and the answer to the objection that stops people booking
 * decorating at all: not the cost, but the fortnight of dust.
 */
export default function DustlessSandingPage() {
  const rail = [
    { id: 'what', number: '01', label: 'What it means' },
    { id: 'why', number: '02', label: 'Why it matters' },
    { id: 'spec', number: '03', label: 'Specification' },
    { id: 'limits', number: '04', label: 'Honest limits' },
    { id: 'quote', number: '05', label: 'Ask for a price' },
  ]

  return (
    <PageShell rail={rail}>
      <Drawn className="relative py-14 md:py-20">
        <GridRules />
        <div className="relative lg:grid lg:grid-cols-12 lg:gap-x-6">
          <div className="lg:col-span-8">
            <p className="annotation-lg text-ink">Method</p>
            <h1 className="display mt-4">Dustless sanding</h1>
            <div className="mt-8 border-l border-signal pl-5">
              <p className="annotation-lg text-ink">{dustless.question}</p>
              <p className="measure mt-3 text-lg leading-relaxed">{dustless.lede}</p>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <CallLink
                className="annotation-lg border border-signal bg-signal px-6 py-4 text-paper transition-opacity duration-150 hover:opacity-85"
                from="dustless-hero"
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
            photo={dustless.photo}
            callouts={dustless.callouts}
            sizes="(min-width: 1280px) 1000px, 100vw"
            priority
            ratio="16 / 7"
          />
        </div>
      </Drawn>

      <Section id="what" number="01" title="What it means in practice">
        <div className="space-y-5">
          {dustless.what.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="measure">
              {paragraph}
            </p>
          ))}
        </div>
      </Section>

      <Section id="why" number="02" title="Why it matters when you live in the house">
        <div className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
          {dustless.whyItMatters.map((item) => (
            <div key={item.title} className="border-t border-ink pt-4">
              <h3 className="text-lg font-medium tracking-[-0.01em]">{item.title}</h3>
              <p className="mt-3 text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="spec" number="03" title="Specification">
        <div className="max-w-[46rem]">
          <Spec
            rows={dustless.spec.map((row) => ({
              ...row,
              value: fill(row.value),
            }))}
          />
        </div>
      </Section>

      <Section
        id="limits"
        number="04"
        title="Where the word overstates it"
        standfirst="“Dustless” is the trade term. Here is what it actually does and does not do."
        standfirstTone="annotation"
      >
        <ul className="grid gap-x-10 gap-y-5 lg:grid-cols-2">
          {dustless.limits.map((limit) => (
            <li key={limit.slice(0, 24)} className="border-t border-ink pt-4">
              {limit}
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="quote"
        number="05"
        title="Ask for a price"
        standfirst="The extraction is not an extra and it is not a line on the quote — it is how I work on every job. Tell me what needs doing and I will price the decorating."
      >
        <EnquiryForm from="dustless-sanding" />
      </Section>
    </PageShell>
  )
}
