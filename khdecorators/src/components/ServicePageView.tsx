import Link from 'next/link'
import type { ServicePage } from '@content/types'
import { Annotated } from './Annotated'
import { CallLink } from './CallLink'
import { Drawn } from './Drawn'
import { EnquiryForm } from './EnquiryForm'
import { GridRules } from './GridRules'
import { Section } from './Section'
import { PageShell } from './Shell'
import { Spec } from './Spec'
import { fill } from '@/lib/metadata'
import { phone } from '@content/site'

/**
 * The three standard service pages — interior, exterior, wallpapering — all render
 * through here from a `ServicePage` object. One component so they stay consistent, and so
 * a fourth is an object rather than a page.
 *
 * The structure is the same argument every time: what the work covers, how it is actually
 * done, the specification, and what it will not do. The method section is the one that
 * earns the enquiry — it is the part no competitor's site has, because writing it requires
 * knowing how the job goes.
 */
export function ServicePageView({ service }: { service: ServicePage }) {
  const rail = [
    { id: 'covers', number: '01', label: 'What it covers' },
    { id: 'method', number: '02', label: 'How I do it' },
    { id: 'spec', number: '03', label: 'Specification' },
    { id: 'limits', number: '04', label: 'Limits' },
    { id: 'quote', number: '05', label: 'Ask for a price' },
  ]

  return (
    <PageShell rail={rail}>
      {/* Hero */}
      <Drawn className="relative py-14 md:py-20">
        <GridRules />
        <div className="relative lg:grid lg:grid-cols-12 lg:gap-x-6">
          <div className="lg:col-span-8">
            <h1 className="display">{service.h1}</h1>
            <p className="measure mt-8 text-lg leading-relaxed">{service.lede}</p>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <CallLink
                className="annotation-lg border border-signal bg-signal px-6 py-4 text-paper transition-opacity duration-150 hover:opacity-85"
                from={`${service.slug}-hero`}
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
            photo={service.photo}
            callouts={service.callouts}
            sizes="(min-width: 1280px) 1000px, 100vw"
            priority
            ratio="16 / 7"
          />
        </div>
      </Drawn>

      <Section id="covers" number="01" title="What it covers">
        <ul className="grid border-t border-rule sm:grid-cols-2 sm:gap-x-10">
          {service.covers.map((item) => (
            <li key={item} className="border-b border-rule py-3">
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="method"
        number="02"
        title="How I actually do it"
        standfirst="In order. The parts you cannot see afterwards are the parts that matter."
        standfirstTone="annotation"
      >
        <ol className="border-t border-rule">
          {service.method.map((step, i) => (
            <li
              key={step.title}
              className="grid gap-x-6 gap-y-2 border-b border-rule py-6 md:grid-cols-12"
            >
              <div className="annotation md:col-span-1">{String(i + 1).padStart(2, '0')}</div>
              <h3 className="text-lg font-medium tracking-[-0.01em] md:col-span-4">{step.title}</h3>
              <p className="text-muted md:col-span-7">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="spec" number="03" title="Specification">
        <div className="max-w-[46rem]">
          <Spec
            rows={service.spec.map((row) => ({
              ...row,
              value: fill(row.value),
            }))}
          />
        </div>
      </Section>

      <Section
        id="limits"
        number="04"
        title="What it will not do"
        standfirst="Worth reading before you book anybody, not just me."
        standfirstTone="annotation"
      >
        <ul className="grid gap-x-10 gap-y-5 lg:grid-cols-2">
          {service.limits.map((limit) => (
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
        standfirst="A couple of lines about the job and a town is enough to start with. I will ring you back rather than send a brochure."
      >
        <EnquiryForm from={service.slug} />
      </Section>
    </PageShell>
  )
}
