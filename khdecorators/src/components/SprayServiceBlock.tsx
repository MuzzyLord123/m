import type { SprayService } from '@content/types'
import { isPlaceholder } from '@content/types'
import { Band } from './Band'
import { Needed } from './Needed'
import { Step, TickList, WorkPhoto } from './kit'
import { fill } from '@/lib/metadata'

/**
 * One sprayable service, in full.
 *
 * `/spraying` renders four of these. A future `/upvc-spraying` or
 * `/garage-door-spraying` renders exactly one, from the same object, with no new
 * component and no copy written into a page file — which is the whole reason
 * `SprayService` exists as a type. See ADS-MIGRATION.md §7 for when to split them.
 *
 * The order is the order a customer's questions arrive in: the question itself,
 * then the answer, what it covers, why spraying rather than a brush, the
 * preparation, what is included, and the honest limits last.
 */
export function SprayServiceBlock({
  service,
  index,
  /** `h2` on /spraying, which has its own h1. `h1` on a single-service page. */
  headingLevel = 'h2',
}: {
  service: SprayService
  index: number
  headingLevel?: 'h1' | 'h2'
}) {
  const Heading = headingLevel
  // Alternate the band background so four of these in a row do not read as one
  // long undifferentiated page.
  const tone = index % 2 === 0 ? 'plain' : 'well'

  return (
    <Band id={service.slug} tone={tone} divider={index > 0}>
      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="annotation text-gold">Spray finishing</p>
          <Heading className="display-sm mt-3">{service.name}</Heading>

          {/*
            The question, then the answer. This has to be the first thing read by
            somebody who arrived from an ad for exactly this service — it is the
            conversion mechanism on this page.
          */}
          <div className="kh-card mt-7 p-6">
            <p className="display-xs text-gold">{service.question}</p>
            <p className="mt-4 leading-relaxed text-paper">{service.answer}</p>
          </div>

          <h3 className="annotation mt-10 text-gold">Why sprayed, not brushed</h3>
          <TickList className="mt-4" items={service.whySpray} tone="dim" />
        </div>

        <div className="space-y-8">
          <WorkPhoto photo={service.photo} sizes="(min-width: 1024px) 46vw, 100vw" ratio="4 / 3" />

          <div>
            <h3 className="annotation text-gold">What I spray</h3>
            <TickList className="mt-4" items={service.covers} />
          </div>
        </div>
      </div>

      {/* Preparation */}
      <div className="mt-16">
        <h3 className="display-xs">Preparation, in order</h3>
        <p className="annotation mt-2">Most of the job. Most of the quote.</p>
        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {service.preparation.map((step, i) => (
            /* No title — each preparation step is a single sentence. `Step`
               omits the heading rather than rendering an empty one. */
            <Step key={step.slice(0, 24)} number={String(i + 1).padStart(2, '0')} body={step} />
          ))}
        </ol>
      </div>

      {/* What's included and the limits, side by side */}
      <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <h3 className="display-xs">What’s included</h3>
          <p className="annotation mt-2">What goes on, how many coats, how long.</p>
          <div className="kh-card mt-6 p-6">
            <dl className="space-y-4">
              {service.spec.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] items-baseline gap-4 border-b border-rule pb-4 last:border-b-0 last:pb-0"
                >
                  <dt className="annotation">{row.label}</dt>
                  <dd className="font-medium">
                    {isPlaceholder(row.value) ? <Needed token={row.value} /> : fill(row.value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div>
          <h3 className="display-xs">What it will not do</h3>
          <p className="annotation mt-2">
            The honest list. Read this before you book anybody, not just me.
          </p>
          <ul className="mt-6 space-y-4">
            {service.limits.map((limit) => (
              <li key={limit.slice(0, 24)} className="kh-card p-5 text-paper-dim">
                {limit}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Band>
  )
}
