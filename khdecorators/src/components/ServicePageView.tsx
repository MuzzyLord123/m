import Link from 'next/link'
import type { ServicePage } from '@content/types'
import { isPlaceholder } from '@content/types'
import { Band } from './Band'
import { CallLink } from './CallLink'
import { Drawn } from './Drawn'
import { EnquiryForm } from './EnquiryForm'
import { Needed } from './Needed'
import { PhoneIcon, TickIcon } from './icons'
import { Step, TickList, WorkPhoto } from './kit'
import { fill } from '@/lib/metadata'
import { phone } from '@content/site'

/**
 * The three standard service pages — interior, exterior, wallpapering — all render
 * through here from a `ServicePage` object, so they stay consistent and a fourth is
 * an object rather than a page.
 *
 * The argument is the same every time and it is the reason this site can win work
 * the competition cannot: what the job covers, how it is actually done, what is
 * included, and honestly what it will not do. That last section is the most
 * persuasive thing on the page precisely because nobody else writes one.
 */
export function ServicePageView({ service }: { service: ServicePage }) {
  return (
    <>
      {/* Hero */}
      <section className="relative">
        <Drawn className="mx-auto max-w-[78rem] px-5 pt-14 pb-16 md:px-8 md:pt-20 md:pb-20">
          <div className="kh-reveal grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="annotation text-gold">Service</p>
              <h1 className="display mt-4">{service.h1}</h1>
              <p className="measure mt-6 text-lg leading-relaxed text-paper-dim">{service.lede}</p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <CallLink className="kh-btn gap-2" from={`${service.slug}-hero`}>
                  <PhoneIcon className="size-4" />
                  Ring Kenny — {phone.label}
                </CallLink>
                <Link href="#quote" className="kh-btn-ghost">
                  Get a free quote
                </Link>
              </div>
            </div>

            <WorkPhoto
              photo={service.photo}
              sizes="(min-width: 1024px) 46vw, 100vw"
              priority
              ratio="4 / 3"
            />
          </div>
        </Drawn>
      </section>

      {/* What it covers */}
      <Band id="covers" tone="well" eyebrow="What it covers" title="The work itself" divider>
        <TickList className="sm:grid-cols-2 sm:gap-x-10" items={service.covers} />
      </Band>

      {/* Method */}
      <Band
        id="method"
        eyebrow="How I do it"
        title="How I actually do it"
        standfirst="In order. The parts you cannot see once it is finished are the parts that decide whether it lasts."
      >
        <ol className="grid gap-5 md:grid-cols-2">
          {service.method.map((step, i) => (
            <Step
              key={step.title}
              number={String(i + 1).padStart(2, '0')}
              title={step.title}
              body={step.body}
            />
          ))}
        </ol>
      </Band>

      {/* What's included */}
      <Band
        id="spec"
        tone="well"
        eyebrow="What's included"
        title="What you get for the money"
        divider
      >
        <div className="kh-card max-w-[52rem] p-6 md:p-8">
          <dl className="space-y-4">
            {service.spec.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)] items-baseline gap-4 border-b border-rule pb-4 last:border-b-0 last:pb-0"
              >
                <dt className="annotation">{row.label}</dt>
                <dd className="font-medium">
                  {isPlaceholder(row.value) ? <Needed token={row.value} /> : fill(row.value)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Band>

      {/* Honest limits */}
      <Band
        id="limits"
        eyebrow="Straight answers"
        title="What it will not do"
        standfirst="Worth reading before you book anybody, not just me. A page that only says yes is a page nobody believes."
      >
        <ul className="grid gap-5 lg:grid-cols-2">
          {service.limits.map((limit) => (
            <li key={limit.slice(0, 24)} className="kh-card p-5 text-paper-dim">
              {limit}
            </li>
          ))}
        </ul>
      </Band>

      {/* Quote */}
      <Band
        id="quote"
        tone="well"
        eyebrow="Free quote"
        title="Ask for a price"
        standfirst="A couple of lines about the job and a town is enough to start with. I will ring you back rather than send a brochure."
        divider
      >
        <div className="grid gap-12 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:gap-16">
          <EnquiryForm from={service.slug} />

          <div className="lg:pt-2">
            <h3 className="annotation text-gold">Or just ring me</h3>
            <p className="mt-4">
              <CallLink
                className="display-xs text-gold underline decoration-1 underline-offset-4 transition-colors duration-150 hover:text-gold-lift hover:decoration-2"
                from={`${service.slug}-quote`}
              />
            </p>
            <ul className="kh-ticks mt-8">
              {[
                'Free, and no obligation attached to it',
                'Same-day answer, usually',
                'One job at a time, so the dates are real',
              ].map((item) => (
                <li key={item}>
                  <TickIcon className="mt-1 size-5 text-gold" />
                  <span className="text-paper-dim">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Band>
    </>
  )
}
