import type { SprayService } from '@content/types'
import { Annotated } from './Annotated'
import { Section } from './Section'
import { Spec } from './Spec'
import { fill } from '@/lib/metadata'

/**
 * One sprayable service, in full.
 *
 * `/spraying` renders four of these. A future `/upvc-spraying` or
 * `/garage-door-spraying` renders exactly one, from the same object, with no new
 * component and no copy written into a page file — which is the whole reason
 * `SprayService` exists as a type. See ADS-MIGRATION.md §7 for when to split them.
 *
 * The order inside the block is the order a customer's questions arrive in: the question
 * itself, the answer, what it covers, why spraying rather than a brush, the preparation,
 * the specification, and then the limits. Limits last but never omitted — a page that
 * only says yes is a page nobody believes.
 */
export function SprayServiceBlock({
  service,
  number,
  /** `h2` on /spraying, which has its own h1. `h1` on a single-service landing page. */
  headingLevel = 'h2',
}: {
  service: SprayService
  number: string
  headingLevel?: 'h1' | 'h2'
}) {
  return (
    <Section id={service.slug} number={number} title={service.name} headingLevel={headingLevel}>
      {/* The question, then the answer. This has to be the first thing read by
          somebody who arrived from an ad for exactly this service. */}
      <div className="border-l-2 border-gold pl-5">
        <p className="annotation-lg text-gold">{service.question}</p>
        <p className="measure mt-3 text-lg leading-relaxed">{service.answer}</p>
      </div>

      <div className="mt-12">
        <Annotated
          photo={service.photo}
          callouts={service.callouts}
          sizes="(min-width: 1280px) 900px, 100vw"
          ratio="3 / 2"
        />
      </div>

      <div className="mt-14 grid gap-x-10 gap-y-12 lg:grid-cols-2">
        <div>
          <h3 className="annotation-lg text-gold">What I spray</h3>
          <ul className="mt-4 border-t border-rule">
            {service.covers.map((item) => (
              <li key={item} className="border-b border-rule py-3">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="annotation-lg text-gold">Why sprayed, not brushed</h3>
          <ul className="mt-4 space-y-4">
            {service.whySpray.map((item) => (
              <li key={item.slice(0, 24)} className="border-t border-rule pt-4">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-14 grid gap-x-10 gap-y-12 lg:grid-cols-2">
        <div>
          <h3 className="annotation-lg text-gold">Preparation, in order</h3>
          <p className="annotation mt-2 normal-case tracking-normal">
            Most of the job. Most of the quote.
          </p>
          <ol className="mt-4 border-t border-rule">
            {service.preparation.map((step, i) => (
              <li
                key={step.slice(0, 24)}
                className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-3 border-b border-rule py-3"
              >
                <span className="annotation pt-1">{String(i + 1).padStart(2, '0')}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h3 className="annotation-lg text-gold">Specification</h3>
          <p className="annotation mt-2 normal-case tracking-normal">
            What goes on, how many coats, how long.
          </p>
          <div className="mt-4">
            <Spec
              rows={service.spec.map((row) => ({
                ...row,
                value: fill(row.value),
              }))}
            />
          </div>
        </div>
      </div>

      <div className="mt-14">
        <h3 className="annotation-lg text-gold">What it will not do</h3>
        <p className="annotation mt-2 normal-case tracking-normal">
          The honest list. Read this one before you book anybody, not just me.
        </p>
        <ul className="mt-5 grid gap-x-10 gap-y-5 lg:grid-cols-2">
          {service.limits.map((limit) => (
            <li key={limit.slice(0, 24)} className="border-t border-edge pt-4">
              {limit}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
