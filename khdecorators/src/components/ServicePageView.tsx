import type { ServicePage } from '@content/types'
import { isPlaceholder } from '@content/types'
import { Band } from './Band'
import { Hero } from './Hero'
import { Needed } from './Needed'
import { QuoteBand } from './QuoteBand'
import { Gallery } from './Gallery'
import { Step, TickList } from './kit'
import { byCategory } from '@content/photos'
import { fill } from '@/lib/metadata'

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
      <Hero
        photo={service.photo}
        eyebrow={service.eyebrow ?? 'Service'}
        title={service.h1}
        gild={service.gild}
        lede={service.lede}
        plaque={'caption' in service.photo ? String(service.photo.caption) : undefined}
        from={`${service.slug}-hero`}
      />

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
                  {isPlaceholder(fill(row.value)) ? <Needed token={fill(row.value)} /> : fill(row.value)}
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

      {service.gallery ? (
        <Band
          id="work"
          eyebrow="My own photographs"
          title="Some of the jobs"
          gild="jobs"
          standfirst="Tap any of them to see it larger."
          divider
        >
          <Gallery items={byCategory(service.gallery)} label={`${service.h1}: photographs`} />
        </Band>
      ) : null}

      <QuoteBand from={service.slug} />
    </>
  )
}
