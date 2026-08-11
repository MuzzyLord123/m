import type { Metadata } from 'next'
import Link from 'next/link'
import { Band } from '@/components/Band'
import { CallLink } from '@/components/CallLink'
import { Drawn } from '@/components/Drawn'
import { Needed } from '@/components/Needed'
import { BrushIcon, PhoneIcon, SERVICE_ICONS } from '@/components/icons'
import { TrustCard } from '@/components/kit'
import { fill, pageMetadata } from '@/lib/metadata'
import { about } from '@content/about'
import { phone } from '@content/site'
import { isPlaceholder } from '@content/types'

export const metadata: Metadata = pageMetadata({
  title: about.title,
  description: about.description,
  path: '/about',
})

/**
 * /about — redirected to from /about-us, which is where it lived on Google Sites.
 *
 * Every word here is new. The old About page's "Services" link pointed at
 * rmdecorsolutions.co.uk — another decorator's website — which is what happens when
 * copy is taken from a template and the links never get changed. Nothing was
 * carried across, including the parts that read fine.
 */
export default function AboutPage() {
  const icons = ['brush', 'roller', 'shop', 'extractor'] as const

  return (
    <>
      <section className="relative">
        <Drawn className="mx-auto max-w-[78rem] px-5 pt-14 pb-14 md:px-8 md:pt-20 md:pb-16">
          <div className="kh-reveal mx-auto max-w-[46rem] text-center">
            <p className="annotation flex items-center justify-center gap-2 text-gold">
              <BrushIcon className="size-5" />
              About
            </p>
            <h1 className="display mt-4">{about.h1}</h1>
            <p className="mt-6 text-lg leading-relaxed text-paper-dim">{fill(about.lede)}</p>
          </div>
        </Drawn>
      </section>

      <Band tone="well" eyebrow="In my own words" title="How I got here, and how I work" divider>
        <div className="mx-auto max-w-[46rem] space-y-5 text-paper-dim">
          {about.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{fill(paragraph)}</p>
          ))}
        </div>
      </Band>

      <Band eyebrow="How I work" title="Four things I will not budge on" align="centre">
        <div className="grid gap-5 sm:grid-cols-2">
          {about.principles.map((item, i) => (
            <TrustCard
              key={item.title}
              title={item.title}
              body={item.body}
              icon={SERVICE_ICONS[icons[i % icons.length]]}
            />
          ))}
        </div>
      </Band>

      <Band tone="well" eyebrow="The facts" title="Everything you might want to check" divider>
        <div className="kh-card max-w-[52rem] p-6 md:p-8">
          <dl className="space-y-4">
            {about.spec.map((row) => (
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

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <CallLink className="kh-btn gap-2" from="about">
            <PhoneIcon className="size-4" />
            Ring Kenny — {phone.label}
          </CallLink>
          <Link href="/contact" className="kh-btn-ghost">
            Send me the job
          </Link>
        </div>
      </Band>
    </>
  )
}
