import type { Metadata } from 'next'
import { Band } from '@/components/Band'
import { Hero } from '@/components/Hero'
import { Needed } from '@/components/Needed'
import { QuoteBand } from '@/components/QuoteBand'
import { TrustCard } from '@/components/kit'
import { SERVICE_ICONS } from '@/components/icons'
import { fill, pageMetadata } from '@/lib/metadata'
import { dustless } from '@content/dustless'
import { isPlaceholder } from '@content/types'

export const metadata: Metadata = pageMetadata({
  title: 'Dustless sanding — decorating in {town} | KH Painting and Decorating',
  description:
    'Dustless sanding in {town} and across the north west. Dust extracted at the pad as it is made, so you can stay in the house while the decorating happens. Ring Kenny on 07538 869832.',
  path: '/dustless-sanding',
})

/**
 * The second differentiator, and the answer to the objection that stops people
 * booking decorating at all: not the cost, but the fortnight of dust afterwards.
 */
export default function DustlessSandingPage() {
  // The four reasons are the persuasive part of this page, so they get icons and
  // cards rather than a two-column prose grid.
  const icons = ['extractor', 'brush', 'roller', 'interior'] as const

  return (
    <>
      <Hero
        photo={dustless.photo}
        eyebrow="My method"
        title="Dustless sanding"
        gild="Dustless"
        lede={`${dustless.question} ${dustless.lede}`}
        plaque={'caption' in dustless.photo ? String(dustless.photo.caption) : undefined}
        from="dustless-hero"
      />

      {/* What it means */}
      <Band tone="well" eyebrow="In practice" title="What it means in practice" divider>
        <div className="grid gap-5 md:grid-cols-3">
          {dustless.what.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="kh-card p-6 text-paper-dim">
              {paragraph}
            </p>
          ))}
        </div>
      </Band>

      {/* Why it matters */}
      <Band
        eyebrow="Why it matters"
        title="Why it matters when you live in the house"
        align="centre"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          {dustless.whyItMatters.map((item, i) => (
            <TrustCard
              key={item.title}
              title={item.title}
              body={item.body}
              icon={SERVICE_ICONS[icons[i % icons.length]]}
            />
          ))}
        </div>
      </Band>

      {/* What's included */}
      <Band tone="well" eyebrow="What's included" title="How I set up on your job" divider>
        <div className="kh-card max-w-[52rem] p-6 md:p-8">
          <dl className="space-y-4">
            {dustless.spec.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[minmax(0,12rem)_minmax(0,1fr)] items-baseline gap-4 border-b border-rule pb-4 last:border-b-0 last:pb-0"
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
        eyebrow="Straight answers"
        title="Where the word overstates it"
        standfirst="“Dustless” is the trade term and it flatters the truth. Here is what it actually does and does not do."
      >
        <ul className="grid gap-5 lg:grid-cols-2">
          {dustless.limits.map((limit) => (
            <li key={limit.slice(0, 24)} className="kh-card p-5 text-paper-dim">
              {limit}
            </li>
          ))}
        </ul>
      </Band>

      <QuoteBand
        from="dustless-sanding"
        standfirst="The extraction is not an extra and it is not a line on the quote — it is how I work on every job. Tell me what needs doing and I will price the decorating."
      />
    </>
  )
}
