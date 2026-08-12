import type { Metadata } from 'next'
import Link from 'next/link'
import { Band } from '@/components/Band'
import { CallLink } from '@/components/CallLink'
import { Drawn } from '@/components/Drawn'
import { EnquiryForm } from '@/components/EnquiryForm'
import { Needed } from '@/components/Needed'
import { ExtractorIcon, PhoneIcon } from '@/components/icons'
import { TrustCard, WorkPhoto } from '@/components/kit'
import { SERVICE_ICONS } from '@/components/icons'
import { fill, pageMetadata } from '@/lib/metadata'
import { dustless } from '@content/dustless'
import { phone } from '@content/site'
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
      {/* Hero */}
      <section className="relative">
        <Drawn className="mx-auto max-w-[78rem] px-5 pt-14 pb-16 md:px-8 md:pt-20 md:pb-20">
          <div className="kh-reveal grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="annotation flex items-center gap-2 text-gold">
                <ExtractorIcon className="size-5" />
                My method
              </p>

              <h1 className="display mt-4">Dustless sanding</h1>

              <div className="kh-card mt-7 p-6">
                <p className="display-xs text-gold">{dustless.question}</p>
                <p className="mt-4 leading-relaxed">{dustless.lede}</p>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <CallLink className="kh-btn gap-2" from="dustless-hero">
                  <PhoneIcon className="size-4" />
                  Ring Kenny — {phone.label}
                </CallLink>
                <Link href="#quote" className="kh-btn-ghost">
                  Get a free quote
                </Link>
              </div>
            </div>

            <WorkPhoto
              photo={dustless.photo}
              sizes="(min-width: 1024px) 46vw, 100vw"
              priority
              ratio="4 / 3"
            />
          </div>
        </Drawn>
      </section>

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
                  {isPlaceholder(row.value) ? <Needed token={row.value} /> : fill(row.value)}
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

      {/* Quote */}
      <Band
        id="quote"
        tone="well"
        eyebrow="Free quote"
        title="Ask for a price"
        standfirst="The extraction is not an extra and it is not a line on the quote — it is how I work on every job. Tell me what needs doing and I will price the decorating."
        divider
      >
        <div className="max-w-[42rem]">
          <EnquiryForm from="dustless-sanding" />
        </div>
      </Band>
    </>
  )
}
